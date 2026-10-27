const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const screenshotPath = path.join(projectRoot, 'preview-mini.png');

const games = [
  {
    id: '401800001',
    date: '2026-10-27T02:30:00Z',
    seasonType: 'regular',
    status: { state: 'in', period: 3, clock: '04:21', shortDetail: 'Q3 4:21' },
    competitors: [
      {
        id: '9',
        homeAway: 'away',
        score: '88',
        team: { id: '9', abbreviation: 'GS', color: '1d428a', slug: 'golden-state-warriors' },
      },
      {
        id: '7',
        homeAway: 'home',
        score: '91',
        team: { id: '7', abbreviation: 'DEN', color: '0e2240', slug: 'denver-nuggets' },
      },
    ],
  },
  {
    id: '401800002',
    date: '2026-10-27T03:00:00Z',
    seasonType: 'regular',
    status: { state: 'in', period: 2, clock: '01:08', shortDetail: 'Q2 1:08' },
    competitors: [
      {
        id: '27',
        homeAway: 'away',
        score: '52',
        team: { id: '27', abbreviation: 'WSH', color: '002b5c', slug: 'washington-wizards' },
      },
      {
        id: '30',
        homeAway: 'home',
        score: '57',
        team: { id: '30', abbreviation: 'CHA', color: '1d1160', slug: 'charlotte-hornets' },
      },
    ],
  },
];

const context = {
  date: '20261027',
  gameId: games[0].id,
  games,
  updatedAt: new Date().toISOString(),
};

function summaryFor(gameId) {
  const game = games.find((item) => item.id === gameId) ?? games[0];
  return {
    updatedAt: new Date().toISOString(),
    game,
    athletes: [],
    leaders: [],
    videos: [],
    news: [],
    plays: [
      {
        id: `${game.id}-1`,
        sequence: 240,
        clock: game.status.clock,
        period: game.status.period,
        type: 'Jump Shot',
        text: 'Stephen Curry makes 28-foot three point jumper (Draymond Green assists)',
        description:
          'Stephen Curry makes 28-foot three point jumper (Draymond Green assists)',
        teamId: game.competitors[0].team.id,
        scoreValue: 3,
        shootingPlay: true,
        scoringPlay: true,
        awayScore: game.competitors[0].score,
        homeScore: game.competitors[1].score,
        wallclock: new Date().toISOString(),
        athletesInvolved: [
          { id: '3975', displayName: 'Stephen Curry' },
          { id: '3218', displayName: 'Draymond Green' },
        ],
      },
    ],
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  ipcMain.handle('mini:get-state', () => ({
    context,
    alwaysOnTop: true,
  }));
  ipcMain.handle('nba:summary', (_event, gameId) => summaryFor(String(gameId)));
  ipcMain.handle('mini:select-game', (_event, gameId) => {
    context.gameId = String(gameId);
    return true;
  });
  ipcMain.handle('mini:toggle-top', () => ({ alwaysOnTop: true }));
  ipcMain.handle('window:show-main', () => true);

  const win = new BrowserWindow({
    width: 420,
    height: 140,
    useContentSize: true,
    show: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(projectRoot, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  await win.loadFile(path.join(projectRoot, 'src', 'mini.html'));
  await wait(1200);
  await win.webContents.executeJavaScript(`
    Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 6000);
            })
      )
    )
  `);
  await wait(400);

  const metrics = await win.webContents.executeJavaScript(`
    (() => {
      const latest = document.querySelector('.latest-panel').getBoundingClientRect();
      const score = document.querySelector('.score-card').getBoundingClientRect();
      const message = document.querySelector('.line-message');
      return {
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        scroll: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        },
        latest: { x: latest.x, y: latest.y, width: latest.width, height: latest.height },
        score: { x: score.x, y: score.y, width: score.width, height: score.height },
        liveLineCount: document.querySelectorAll('.live-line').length,
        message: message?.textContent ?? '',
        messageFontSize: message ? getComputedStyle(message).fontSize : '',
        messageVisibleWidth: message?.clientWidth ?? 0,
        messageScrollWidth: message?.scrollWidth ?? 0,
        teams: [
          document.querySelector('#awayName')?.textContent,
          document.querySelector('#homeName')?.textContent
        ],
        logos: [...document.querySelectorAll('.mini-team img')].map((image) => ({
          src: image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          visibility: getComputedStyle(image).visibility
        })),
        scoreText: [
          document.querySelector('#awayScore')?.textContent,
          document.querySelector('#homeScore')?.textContent
        ],
        clock: document.querySelector('#gameClock')?.textContent
      };
    })()
  `);

  const image = await win.webContents.capturePage();
  fs.writeFileSync(screenshotPath, image.toPNG());

  await win.webContents.executeJavaScript(
    `document.querySelector('#nextGameButton').click()`,
  );
  await wait(1200);
  const switchedMetrics = await win.webContents.executeJavaScript(`
    ({
      teams: [
        document.querySelector('#awayName')?.textContent,
        document.querySelector('#homeName')?.textContent
      ],
      scoreText: [
        document.querySelector('#awayScore')?.textContent,
        document.querySelector('#homeScore')?.textContent
      ],
      clock: document.querySelector('#gameClock')?.textContent,
      liveLineCount: document.querySelectorAll('.live-line').length,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight
    })
  `);

  console.log(JSON.stringify({ metrics, switchedMetrics, screenshotPath }, null, 2));
  app.quit();
});
