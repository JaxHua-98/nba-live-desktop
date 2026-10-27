import fs from 'node:fs';
import path from 'node:path';

const port = process.argv[2] ?? '9223';
const screenshotPath =
  process.argv[3] ?? path.resolve(import.meta.dirname, '..', 'preview-stats.png');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
await client.send('Runtime.enable');

for (let attempt = 0; attempt < 60; attempt += 1) {
  const ready = await evaluate(
    client,
    `!document.querySelector('#loadingLayer')?.classList.contains('is-hidden')`,
  );
  if (!ready) break;
  await wait(500);
}

await evaluate(
  client,
  `document.querySelector('.segment[data-view="stats"]')?.click()`,
);
await wait(800);
await evaluate(
  client,
  `Promise.all(
    [...document.querySelectorAll('.player-stat-avatar img')].map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 8000);
          })
    )
  )`,
);
await wait(300);

const metrics = await evaluate(
  client,
  `(() => {
    const rect = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
      };
    };
    const avatars = [...document.querySelectorAll('.player-stat-avatar img')];
    const firstAvatar = avatars[0];
    const firstAvatarBox = firstAvatar?.closest('.player-stat-avatar');
    const name = document.querySelector('.player-stat-copy strong');
    const teamTabs = [...document.querySelectorAll('.player-team-tab')];
    return {
      viewport: {
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio
      },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      },
      feedPanel: rect(document.querySelector('.feed-panel')),
      statsView: rect(document.querySelector('#statsView')),
      playerList: rect(document.querySelector('#playerStatsList')),
      teamTabs: teamTabs.map((tab) => ({
        text: tab.innerText.trim(),
        hasScore: Boolean(tab.querySelector('b')),
        logoSize: tab.querySelector('img')
          ? getComputedStyle(tab.querySelector('img')).width
          : null
      })),
      rows: document.querySelectorAll('.player-stat-row').length,
      firstRow: rect(document.querySelector('.player-stat-row')),
      avatar: firstAvatarBox
        ? {
            src: firstAvatar?.src ?? '',
            width: getComputedStyle(firstAvatarBox).width,
            height: getComputedStyle(firstAvatarBox).height,
            naturalWidth: firstAvatar?.naturalWidth ?? 0,
            naturalHeight: firstAvatar?.naturalHeight ?? 0,
            complete: firstAvatar?.complete ?? false
          }
        : null,
      playerName: name
        ? {
            text: name.textContent,
            fontSize: getComputedStyle(name).fontSize
          }
        : null,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()`,
);

const clip = metrics.feedPanel;
const shot = await client.send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
  ...(clip
    ? {
        clip: {
          x: Math.max(0, clip.x),
          y: Math.max(0, clip.y),
          width: Math.min(clip.width, metrics.viewport.width),
          height: Math.min(
            clip.height,
            metrics.viewport.height - Math.max(0, clip.y),
          ),
          scale: 1,
        },
      }
    : {}),
});
fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
fs.writeFileSync(screenshotPath, Buffer.from(shot.data, 'base64'));

console.log(JSON.stringify({ metrics, screenshotPath }, null, 2));
client.close();
if (process.env.KEEP_OPEN !== '1') {
  const closer = await connect(target);
  closer.send('Browser.close').catch(() => {});
  await wait(300);
  closer.close();
}
process.exit(0);
