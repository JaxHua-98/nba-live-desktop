import fs from 'node:fs';
import path from 'node:path';

const port = process.argv[2] ?? '9229';
const screenshotPath =
  process.argv[3] ??
  path.resolve(import.meta.dirname, '..', 'preview-quarter-table.png');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      reject(new Error('Unable to connect to the main window CDP target'));
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

let target;
for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    target = (await listTargets()).find((item) =>
      item.url.endsWith('/src/index.html'),
    );
    if (target) break;
  } catch {}
  await wait(500);
}
if (!target) throw new Error('Main window target was not found');

const client = await connect(target);
await client.send('Page.enable');

for (let attempt = 0; attempt < 60; attempt += 1) {
  const loading = await evaluate(
    client,
    `!document.querySelector('#loadingLayer')?.classList.contains('is-hidden')`,
  );
  if (!loading) break;
  await wait(500);
}
await wait(1600);

const metrics = await evaluate(
  client,
  `(() => {
    const scoreCard = document.querySelector('.score-card');
    const table = document.querySelector('.quarter-table');
    const team = document.querySelector('.quarter-team');
    const logo = document.querySelector('.quarter-team img');
    const name = document.querySelector('.quarter-team b');
    const quarterValue = document.querySelector(
      '.quarter-team-row > span:not(.quarter-team)'
    );
    const total = document.querySelector('.quarter-team-row > strong');
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      scoreCard: box(scoreCard),
      table: box(table),
      team: box(team),
      rows: document.querySelectorAll('.quarter-team-row').length,
      logo: logo
        ? {
            ...box(logo),
            naturalWidth: logo.naturalWidth,
            naturalHeight: logo.naturalHeight
          }
        : null,
      teamName: name
        ? { text: name.textContent, fontSize: getComputedStyle(name).fontSize }
        : null,
      quarterValue: quarterValue
        ? {
            text: quarterValue.textContent,
            fontSize: getComputedStyle(quarterValue).fontSize
          }
        : null,
      total: total
        ? { text: total.textContent, fontSize: getComputedStyle(total).fontSize }
        : null,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()`,
);

const card = metrics.scoreCard;
const shot = await client.send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
  clip: {
    x: Math.max(0, card.x),
    y: Math.max(0, card.y),
    width: Math.min(card.width, metrics.viewport.width),
    height: Math.min(card.height, metrics.viewport.height - card.y),
    scale: 1,
  },
});
fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
fs.writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));

console.log(JSON.stringify({ metrics, screenshotPath }, null, 2));
client.send('Browser.close').catch(() => {});
await wait(300);
client.close();
process.exit(0);
