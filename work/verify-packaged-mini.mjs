import fs from 'node:fs';
import path from 'node:path';

const port = process.argv[2] ?? '9223';
const projectRoot = path.resolve(import.meta.dirname, '..');
const screenshotPath = path.join(projectRoot, 'preview-mini-live.png');

async function listTargets() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}`);
  return response.json();
}

function connect(target) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    let nextId = 0;

    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          return new Promise((resolveCommand, rejectCommand) => {
            const id = ++nextId;
            pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
            socket.send(JSON.stringify({ id, method, params }));
          });
        },
        close() {
          socket.close();
        },
      });
    });

    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(String(event.data));
      if (!payload.id || !pending.has(payload.id)) return;
      const { resolve: resolveCommand, reject: rejectCommand } = pending.get(
        payload.id,
      );
      pending.delete(payload.id);
      if (payload.error) rejectCommand(new Error(payload.error.message));
      else resolveCommand(payload.result);
    });

    socket.addEventListener('error', () => {
      reject(new Error('Unable to connect to the packaged app CDP target'));
    });
  });
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Evaluation failed');
  }
  return result.result.value;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mainTarget = (await listTargets()).find((target) =>
  target.url.endsWith('/src/index.html'),
);
if (!mainTarget) throw new Error('Main window target was not found');

const mainClient = await connect(mainTarget);
const opened = await evaluate(
  mainClient,
  `(async () => {
    const date = '20261027';
    const scoreboard = await window.nbaDesktop.getScoreboard(date);
    const games = scoreboard?.events ?? [];
    if (!games.length) return { ok: false, reason: '当天没有比赛数据' };
    const game =
      games.find((item) => item.status?.state === 'in') ??
      games.find((item) => item.status?.state === 'post') ??
      games[0];
    const gameId = game.id;
    await window.nbaDesktop.openMini({ date, gameId, games });
    return {
      ok: true,
      date,
      gameId,
      gameState: game.status?.state,
      gameCount: games.length
    };
  })()`,
);
mainClient.close();
if (!opened?.ok) throw new Error(opened?.reason ?? 'Unable to open mini window');

await wait(5000);
const miniTarget = (await listTargets()).find((target) =>
  target.url.endsWith('/src/mini.html'),
);
if (!miniTarget) throw new Error('Mini window target was not found');

const miniClient = await connect(miniTarget);
await miniClient.send('Page.enable');
const metrics = await evaluate(
  miniClient,
  `({
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    scroll: {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    },
    teams: [
      document.querySelector('#awayName')?.textContent,
      document.querySelector('#homeName')?.textContent
    ],
    score: [
      document.querySelector('#awayScore')?.textContent,
      document.querySelector('#homeScore')?.textContent
    ],
    clock: document.querySelector('#gameClock')?.textContent,
    liveLineCount: document.querySelectorAll('.live-line').length,
    latest: document.querySelector('.line-message')?.textContent ?? ''
  })`,
);

const shot = await miniClient.send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
});
fs.writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));
miniClient.close();

console.log(JSON.stringify({ opened, metrics, screenshotPath }, null, 2));
