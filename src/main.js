const { app, BrowserWindow, ipcMain, Menu, shell, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const SUMMARY_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary';
const NEWS_URL =
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news';
const STANDINGS_URL =
  'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings';

const FETCH_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0 Safari/537.36',
};

let mainWindow = null;
let miniWindow = null;
let miniContext = null;
let miniAlwaysOnTop = true;
let isPinned = false;
let isQuitting = false;
let closingMainWindow = false;
let miniDockState = 'visible';
let miniDockBounds = null;
let miniDockDisplay = null;
let miniEdgeTimer = null;
let miniAnimationTimer = null;
let miniTopDwellStartedAt = 0;
let miniRevealArmed = false;

const MINI_TOP_TRIGGER = 20;
const MINI_REVEAL_TRIGGER = 4;
const MINI_ANIMATION_MS = 180;
const MINI_EDGE_POLL_MS = 70;
const MINI_TOP_DWELL_MS = 280;
const MINI_PANEL_HOVER_MARGIN = 12;

function isAllowedHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchJson(url, attempts = 3) {
  if (!isAllowedHttpUrl(url)) {
    throw new Error('不支持的请求地址');
  }

  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        throw new Error(`数据服务返回 ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 550 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error('网络请求失败');
}

function normalizeStatus(status = {}) {
  const type = status.type ?? {};
  return {
    state: type.state ?? 'pre',
    completed: Boolean(type.completed),
    description: type.description ?? '',
    detail: type.detail ?? type.shortDetail ?? '',
    shortDetail: type.shortDetail ?? type.detail ?? '',
    period: Number(status.period ?? 0),
    clock: status.displayClock ?? '',
  };
}

function normalizeCompetitor(competitor = {}) {
  const team = competitor.team ?? {};
  return {
    id: String(competitor.id ?? team.id ?? ''),
    homeAway: competitor.homeAway ?? '',
    order: competitor.order ?? 0,
    winner: Boolean(competitor.winner),
    score: String(competitor.score ?? '0'),
    team: {
      id: String(team.id ?? competitor.id ?? ''),
      abbreviation: team.abbreviation ?? '',
      name: team.name ?? '',
      displayName: team.displayName ?? '',
      shortDisplayName: team.shortDisplayName ?? team.name ?? '',
      logo:
        team.logo ??
        team.logos?.find((logo) => logo.rel?.includes('scoreboard'))?.href ??
        team.logos?.[0]?.href ??
        '',
      color: team.color ?? '6f737a',
      alternateColor: team.alternateColor ?? 'd8d8dc',
      slug: team.slug ?? '',
    },
    linescores: (competitor.linescores ?? []).map((line) => ({
      period: Number(line.period ?? 0),
      value: String(line.displayValue ?? line.value ?? ''),
    })),
    records: (competitor.records ?? []).map((record) => ({
      type: record.type ?? '',
      summary: record.summary ?? '',
    })),
    record:
      competitor.record?.find((record) => record.type === 'total')?.summary ??
      competitor.records?.find((record) => record.type === 'total')?.summary ??
      '',
  };
}

function normalizeGame(event) {
  const competition = event.competitions?.[0] ?? {};
  const competitors = (competition.competitors ?? [])
    .map(normalizeCompetitor)
    .sort((a, b) => {
      if (a.homeAway === b.homeAway) return a.order - b.order;
      return a.homeAway === 'away' ? -1 : 1;
    });

  return {
    id: String(event.id ?? competition.id ?? ''),
    date: event.date ?? competition.date ?? '',
    name: event.name ?? '',
    shortName: event.shortName ?? '',
    seasonType: event.season?.slug ?? '',
    status: normalizeStatus(competition.status ?? event.status),
    competitors,
    venue: competition.venue
      ? {
          name: competition.venue.fullName ?? '',
          city: competition.venue.address?.city ?? '',
          state: competition.venue.address?.state ?? '',
        }
      : null,
  };
}

function normalizeScoreboard(payload) {
  return {
    updatedAt: new Date().toISOString(),
    events: (payload.events ?? []).map(normalizeGame),
  };
}

function normalizeStandings(payload) {
  const conferences = (payload.children ?? [])
    .map((conference) => {
      const statsByName = (entry) =>
        new Map(
          (entry.stats ?? []).map((stat) => [
            stat.name,
            stat.displayValue ?? stat.value ?? '',
          ]),
        );
      const numberStat = (stats, name) => {
        const value = Number(stats.get(name));
        return Number.isFinite(value) ? value : 0;
      };
      const teams = (conference.standings?.entries ?? [])
        .map((entry) => {
          const stats = statsByName(entry);
          const team = entry.team ?? {};
          return {
            id: String(team.id ?? ''),
            rank: numberStat(stats, 'playoffSeed'),
            wins: numberStat(stats, 'wins'),
            losses: numberStat(stats, 'losses'),
            winPercent: numberStat(stats, 'winPercent'),
            gamesBehind: String(stats.get('gamesBehind') ?? '-'),
            streak: String(stats.get('streak') ?? ''),
            team: {
              id: String(team.id ?? ''),
              abbreviation: team.abbreviation ?? '',
              name: team.displayName ?? team.name ?? '',
              shortName:
                team.shortDisplayName ?? team.name ?? team.displayName ?? '',
              logo:
                team.logos?.find((logo) => logo.rel?.includes('default'))?.href ??
                team.logos?.[0]?.href ??
                '',
              color: team.color ?? '',
            },
          };
        })
        .filter((entry) => entry.id)
        .sort((left, right) => {
          if (left.rank !== right.rank) return left.rank - right.rank;
          if (right.winPercent !== left.winPercent) {
            return right.winPercent - left.winPercent;
          }
          if (right.wins !== left.wins) return right.wins - left.wins;
          return left.losses - right.losses;
        });

      const abbreviation = String(conference.abbreviation ?? '');
      const key = abbreviation === 'West' ? 'west' : 'east';
      return {
        key,
        id: String(conference.id ?? ''),
        name: key === 'west' ? '西部' : '东部',
        teams,
      };
    })
    .filter((conference) => conference.teams.length);

  return {
    updatedAt: new Date().toISOString(),
    season:
      payload.children?.[0]?.standings?.seasonDisplayName ??
      payload.season?.displayName ??
      '',
    conferences: ['east', 'west']
      .map((key) => conferences.find((conference) => conference.key === key))
      .filter(Boolean),
  };
}

function extractAthletes(boxscore) {
  const athletes = [];
  for (const team of boxscore?.players ?? []) {
    const teamId = String(team.team?.id ?? '');
    const statGroup = team.statistics?.[0] ?? {};
    const statNames = statGroup.names ?? [];
    for (const entry of statGroup.athletes ?? []) {
      if (!entry.athlete?.id) continue;
      const readStat = (code) => {
        const index = statNames.indexOf(code);
        const value = index >= 0 ? entry.stats?.[index] : '';
        return value === undefined || value === null || value === '' || value === '--'
          ? '0'
          : String(value);
      };
      athletes.push({
        id: String(entry.athlete.id),
        teamId,
        name: entry.athlete.displayName ?? '',
        shortName: entry.athlete.shortName ?? entry.athlete.displayName ?? '',
        headshot:
          entry.athlete.headshot?.href ??
          `https://a.espncdn.com/i/headshots/nba/players/full/${entry.athlete.id}.png`,
        jersey: entry.athlete.jersey ?? '',
        position:
          entry.athlete.position?.abbreviation ??
          entry.athlete.position?.displayName ??
          '',
        stats: {
          minutes: readStat('MIN'),
          points: readStat('PTS'),
          fieldGoals: readStat('FG'),
          threePointers: readStat('3PT'),
          freeThrows: readStat('FT'),
          rebounds: readStat('REB'),
          assists: readStat('AST'),
          steals: readStat('STL'),
          turnovers: readStat('TO'),
          blocks: readStat('BLK'),
          fouls: readStat('PF'),
          plusMinus: readStat('+/-'),
        },
      });
    }
  }
  return athletes;
}

function extractLeaders(boxscore) {
  const leaders = [];
  for (const team of boxscore?.players ?? []) {
    const statGroup = team.statistics?.[0];
    if (!statGroup) continue;
    const pointsIndex = statGroup.names?.indexOf('PTS') ?? -1;
    const rows = (statGroup.athletes ?? [])
      .filter((entry) => entry.stats?.length)
      .map((entry) => ({
        id: String(entry.athlete?.id ?? ''),
        teamId: String(team.team?.id ?? ''),
        name: entry.athlete?.displayName ?? '',
        headshot:
          entry.athlete?.headshot?.href ??
          `https://a.espncdn.com/i/headshots/nba/players/full/${entry.athlete?.id}.png`,
        points:
          pointsIndex >= 0 ? Number(entry.stats[pointsIndex] ?? 0) : 0,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 3);
    leaders.push({ teamId: String(team.team?.id ?? ''), players: rows });
  }
  return leaders;
}

function normalizeNewsArticle(article = {}, teamId = '') {
  const teamCategories = (article.categories ?? []).filter(
    (category) => category.type === 'team',
  );
  return {
    id: String(article.id ?? article.dataSourceIdentifier ?? article.headline ?? ''),
    teamId: String(teamId),
    headline: article.headline ?? '',
    description: article.description ?? '',
    type: article.type ?? '',
    teamName:
      teamCategories.find(
        (category) =>
          String(category.teamId ?? category.team?.id ?? '') === String(teamId),
      )?.description ?? '',
    image: article.images?.[0]?.url ?? '',
    published: article.published ?? '',
    categoryTeamIds: [
      ...new Set(
        teamCategories
          .map((category) => String(category.teamId ?? category.team?.id ?? ''))
          .filter(Boolean),
      ),
    ],
    categoryNames: (article.categories ?? [])
      .map((category) => String(category.description ?? ''))
      .filter(Boolean),
    webUrl:
      article.links?.web?.href ??
      article.links?.mobile?.href ??
      article.links?.api?.news?.href ??
      '',
  };
}

function curateTeamNews(articles, teamId) {
  const teamArticles = articles
    .map((article) => normalizeNewsArticle(article, teamId))
    .filter((article) => article.headline);

  const ranked = teamArticles.map((article, index) => {
    const text = `${article.headline} ${article.description}`.toLowerCase();
    const teamName = article.teamName.toLowerCase();
    const shortTeamName = teamName.split(/\s+/).at(-1) ?? '';
    const leagueWide = article.categoryTeamIds.length > 6;
    const directType = ['HeadlineNews', 'Recap', 'Preview'].includes(
      article.type,
    );
    const mentionsTeam =
      Boolean(teamName) &&
      (text.includes(teamName) ||
        (shortTeamName.length >= 4 && text.includes(shortTeamName)));
    const broadHeadline =
      /^(nba breakout players|what worked|nba championship|which nba father-son|jay-z)/i.test(
        article.headline,
      );
    let score = 0;
    if (!leagueWide) score += 5;
    if (directType) score += 2;
    if (article.categoryTeamIds.length <= 3) score += 2;
    if (article.type === 'Media') score += 1;
    if (mentionsTeam) score += 4;
    if (broadHeadline) score -= 10;
    if (!article.headline) score -= 20;
    if (text.length < 30) score -= 2;
    return { article, score, index };
  });

  ranked.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    const leftTime = Date.parse(left.article.published) || 0;
    const rightTime = Date.parse(right.article.published) || 0;
    if (leftTime !== rightTime) return rightTime - leftTime;
    return left.index - right.index;
  });

  const seen = new Set();
  return ranked
    .map(({ article }) => article)
    .filter((article) => {
      const key = article.id || article.headline;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function normalizeSummary(payload) {
  const header = payload.header ?? {};
  const competition = header.competitions?.[0] ?? {};
  const competitors = (competition.competitors ?? [])
    .map(normalizeCompetitor)
    .sort((a, b) => {
      if (a.homeAway === b.homeAway) return a.order - b.order;
      return a.homeAway === 'away' ? -1 : 1;
    });

  const plays = (payload.plays ?? []).slice(-360).map((play) => ({
    id: String(play.id ?? ''),
    sequence: Number(play.sequenceNumber ?? 0),
    typeId: String(play.type?.id ?? ''),
    type: play.type?.text ?? '',
    text: play.text ?? '',
    shortDescription: play.shortDescription ?? '',
    awayScore: Number(play.awayScore ?? 0),
    homeScore: Number(play.homeScore ?? 0),
    period: Number(play.period?.number ?? 0),
    clock: play.clock?.displayValue ?? '',
    scoringPlay: Boolean(play.scoringPlay),
    scoreValue: Number(play.scoreValue ?? 0),
    shootingPlay: Boolean(play.shootingPlay),
    pointsAttempted: Number(play.pointsAttempted ?? 0),
    teamId: String(play.team?.id ?? ''),
    participants: (play.participants ?? [])
      .map((entry) => String(entry.athlete?.id ?? ''))
      .filter(Boolean),
    wallclock: play.wallclock ?? '',
  }));

  const videos = (payload.videos ?? []).map((video) => ({
    id: String(video.id ?? ''),
    headline: video.headline ?? '',
    description: video.description ?? '',
    thumbnail: video.thumbnail ?? '',
    duration: Number(video.duration ?? 0),
    publishDate:
      video.originalPublishDate ??
      video.timeRestrictions?.embargoDate ??
      '',
    webUrl: video.links?.web?.href ?? '',
  }));

  return {
    updatedAt: new Date().toISOString(),
    game: {
      id: String(header.id ?? competition.id ?? ''),
      date: competition.date ?? header.date ?? '',
      name: header.name ?? '',
      seasonType: header.season?.slug ?? '',
      status: normalizeStatus(competition.status ?? header.status),
      competitors,
      venue: competition.venue
        ? {
            name: competition.venue.fullName ?? '',
            city: competition.venue.address?.city ?? '',
            state: competition.venue.address?.state ?? '',
          }
        : null,
    },
    athletes: extractAthletes(payload.boxscore),
    leaders: extractLeaders(payload.boxscore),
    plays,
    videos,
    news: (payload.news?.articles ?? [])
      .slice(0, 6)
      .map((article) => normalizeNewsArticle(article)),
  };
}

function normalizeMiniGame(game = {}) {
  const competitors = (game.competitors ?? []).slice(0, 2).map((competitor) => {
    const team = competitor.team ?? {};
    return {
      id: String(competitor.id ?? team.id ?? ''),
      homeAway: competitor.homeAway === 'home' ? 'home' : 'away',
      winner: Boolean(competitor.winner),
      score: String(competitor.score ?? '0'),
      record: String(competitor.record ?? ''),
      team: {
        id: String(team.id ?? competitor.id ?? ''),
        abbreviation: String(team.abbreviation ?? ''),
        color: String(team.color ?? ''),
        slug: String(team.slug ?? ''),
      },
    };
  });

  return {
    id: String(game.id ?? ''),
    date: String(game.date ?? ''),
    seasonType: String(game.seasonType ?? ''),
    status: {
      state: ['pre', 'in', 'post'].includes(game.status?.state)
        ? game.status.state
        : 'pre',
      period: Number(game.status?.period ?? 0),
      clock: String(game.status?.clock ?? ''),
      shortDetail: String(game.status?.shortDetail ?? ''),
    },
    competitors,
  };
}

function normalizeMiniContext(payload = {}) {
  const date = /^\d{8}$/.test(String(payload.date ?? ''))
    ? String(payload.date)
    : '';
  if (!date) throw new Error('比赛日期无效');

  const byId = new Map();
  for (const rawGame of (Array.isArray(payload.games) ? payload.games : []).slice(0, 30)) {
    const game = normalizeMiniGame(rawGame);
    if (/^\d+$/.test(game.id) && game.competitors.length === 2) {
      byId.set(game.id, game);
    }
  }

  const games = [...byId.values()];
  const gameId = String(payload.gameId ?? '');
  if (!games.some((game) => game.id === gameId)) {
    throw new Error('未找到要打开的比赛');
  }

  return {
    date,
    gameId,
    games,
    updatedAt: new Date().toISOString(),
  };
}

function stopMiniAnimation() {
  if (miniAnimationTimer) {
    clearInterval(miniAnimationTimer);
    miniAnimationTimer = null;
  }
}

function stopMiniEdgeWatcher() {
  if (miniEdgeTimer) {
    clearInterval(miniEdgeTimer);
    miniEdgeTimer = null;
  }
  miniTopDwellStartedAt = 0;
}

function resetMiniDockState() {
  stopMiniEdgeWatcher();
  stopMiniAnimation();
  miniDockState = 'visible';
  miniDockBounds = null;
  miniDockDisplay = null;
  miniRevealArmed = false;
}

function positionMiniNearMain() {
  if (
    !miniWindow ||
    miniWindow.isDestroyed() ||
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }

  const mainBounds = mainWindow.getBounds();
  const miniBounds = miniWindow.getBounds();
  const display = screen.getDisplayMatching(mainBounds);
  const workArea = display.workArea;
  const x = Math.min(
    Math.max(
      Math.round(mainBounds.x + mainBounds.width - miniBounds.width - 20),
      workArea.x + 8,
    ),
    workArea.x + workArea.width - miniBounds.width - 8,
  );
  const y = Math.min(
    Math.max(Math.round(mainBounds.y + 72), workArea.y + 8),
    workArea.y + workArea.height - miniBounds.height - 8,
  );
  miniWindow.setPosition(x, y, false);
}

function animateMiniBounds(targetBounds, duration, onDone) {
  if (!miniWindow || miniWindow.isDestroyed()) return;

  stopMiniAnimation();
  const startBounds = miniWindow.getBounds();
  const startedAt = Date.now();

  miniAnimationTimer = setInterval(() => {
    if (!miniWindow || miniWindow.isDestroyed()) {
      stopMiniAnimation();
      return;
    }

    const progress = Math.min(1, (Date.now() - startedAt) / duration);
    const eased = 1 - (1 - progress) ** 3;
    miniWindow.setBounds(
      {
        x: Math.round(startBounds.x + (targetBounds.x - startBounds.x) * eased),
        y: Math.round(startBounds.y + (targetBounds.y - startBounds.y) * eased),
        width: targetBounds.width,
        height: targetBounds.height,
      },
      false,
    );

    if (progress >= 1) {
      stopMiniAnimation();
      onDone?.();
    }
  }, 16);
}

function revealMiniFromTop() {
  if (
    miniDockState !== 'hidden' ||
    !miniWindow ||
    miniWindow.isDestroyed() ||
    !miniDockBounds ||
    !miniDockDisplay
  ) {
    return;
  }

  miniDockState = 'showing';
  miniWindow.setAlwaysOnTop(miniAlwaysOnTop, 'floating');
  if (!miniWindow.isVisible()) {
    miniWindow.showInactive();
    miniWindow.moveTop();
  }

  animateMiniBounds(
    {
      ...miniDockBounds,
      y: miniDockDisplay.workArea.y + 6,
    },
    MINI_ANIMATION_MS,
    () => {
      if (!miniWindow || miniWindow.isDestroyed()) return;
      miniDockState = 'revealed';
      miniTopDwellStartedAt = 0;
    },
  );
}

function isPointInMiniRevealZone(point) {
  if (!miniDockBounds || !miniDockDisplay) return false;
  const area = miniDockDisplay.workArea;
  const withinWidth =
    point.x >= miniDockBounds.x - 32 &&
    point.x <= miniDockBounds.x + miniDockBounds.width + 32;
  return withinWidth && point.y <= area.y + MINI_REVEAL_TRIGGER;
}

function isPointInsideMiniHoverBounds(point, bounds) {
  return (
    point.x >= bounds.x - MINI_PANEL_HOVER_MARGIN &&
    point.x <= bounds.x + bounds.width + MINI_PANEL_HOVER_MARGIN &&
    point.y >= bounds.y - MINI_PANEL_HOVER_MARGIN &&
    point.y <= bounds.y + bounds.height + MINI_PANEL_HOVER_MARGIN
  );
}

function updateMiniEdgeState() {
  if (!miniWindow || miniWindow.isDestroyed()) {
    stopMiniEdgeWatcher();
    return;
  }

  if (miniDockState === 'hidden') {
    if (!miniDockBounds || !miniDockDisplay) return;
    const point = screen.getCursorScreenPoint();
    const area = miniDockDisplay.workArea;

    // The pointer usually stays at the top after docking. Require it to leave
    // the top edge before a hover can reveal the window again.
    if (!miniRevealArmed) {
      if (point.y > area.y + MINI_TOP_TRIGGER + 8) {
        miniRevealArmed = true;
      }
      return;
    }

    if (isPointInMiniRevealZone(point)) revealMiniFromTop();
    return;
  }

  if (miniDockState !== 'visible' && miniDockState !== 'revealed') {
    miniTopDwellStartedAt = 0;
    return;
  }

  const bounds = miniWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  const edgeY = display.workArea.y + MINI_TOP_TRIGGER;

  if (miniDockState === 'revealed') {
    if (bounds.y > edgeY) {
      miniDockState = 'visible';
    } else {
      const point = screen.getCursorScreenPoint();
      if (!isPointInsideMiniHoverBounds(point, bounds)) {
        dockMiniToTop(bounds, {
          armOnHide: point.y > display.workArea.y + MINI_TOP_TRIGGER + 8,
        });
      }
      return;
    }
  }

  if (bounds.y > edgeY) {
    miniTopDwellStartedAt = 0;
    return;
  }

  if (!miniTopDwellStartedAt) {
    miniTopDwellStartedAt = Date.now();
    return;
  }

  if (Date.now() - miniTopDwellStartedAt >= MINI_TOP_DWELL_MS) {
    miniTopDwellStartedAt = 0;
    dockMiniToTop(bounds);
  }
}

function startMiniEdgeWatcher() {
  stopMiniEdgeWatcher();
  miniEdgeTimer = setInterval(updateMiniEdgeState, MINI_EDGE_POLL_MS);
  updateMiniEdgeState();
}

function rearmMiniDockAfterReveal() {
  if (
    miniDockState !== 'revealed' ||
    !miniWindow ||
    miniWindow.isDestroyed()
  ) {
    return;
  }

  const bounds = miniWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  if (bounds.y > display.workArea.y + MINI_TOP_TRIGGER) {
    miniDockState = 'visible';
    miniTopDwellStartedAt = 0;
  }
}

function dockMiniToTop(bounds, { armOnHide = false } = {}) {
  if (
    (miniDockState !== 'visible' && miniDockState !== 'revealed') ||
    !miniWindow ||
    miniWindow.isDestroyed()
  ) {
    return;
  }

  const display = screen.getDisplayMatching(bounds);
  miniDockState = 'hiding';
  miniTopDwellStartedAt = 0;
  miniRevealArmed = false;
  miniDockBounds = {
    x: bounds.x,
    y: Math.max(bounds.y, display.workArea.y),
    width: bounds.width,
    height: bounds.height,
  };
  miniDockDisplay = {
    id: display.id,
    workArea: { ...display.workArea },
  };

  animateMiniBounds(
    {
      ...bounds,
      y: display.workArea.y - bounds.height - 2,
    },
    MINI_ANIMATION_MS,
    () => {
      if (!miniWindow || miniWindow.isDestroyed()) return;
      miniWindow.hide();
      miniDockState = 'hidden';
      const point = screen.getCursorScreenPoint();
      const area = miniDockDisplay?.workArea;
      miniRevealArmed =
        armOnHide ||
        Boolean(area && point.y > area.y + MINI_TOP_TRIGGER + 8);
    },
  );
}

function createWindow() {
  const requestedWidth = Number(process.env.NBA_WINDOW_WIDTH);
  const requestedHeight = Number(process.env.NBA_WINDOW_HEIGHT);
  const width =
    Number.isFinite(requestedWidth) && requestedWidth >= 980
      ? requestedWidth
      : 1220;
  const height =
    Number.isFinite(requestedHeight) && requestedHeight >= 680
      ? requestedHeight
      : 820;
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 980,
    minHeight: 680,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    roundedCorners: true,
    title: '篮下 NBA 图文直播',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (!app.isPackaged) {
    mainWindow.webContents.on('console-message', (details) => {
      console.log(`[renderer:${details.level}] ${details.message}`);
    });
    mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
      console.error(`[preload] ${preloadPath}`, error);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized', false);
  });
  mainWindow.on('closed', () => {
    closingMainWindow = true;
    if (miniWindow && !miniWindow.isDestroyed()) miniWindow.close();
    miniWindow = null;
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedHttpUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (isAllowedHttpUrl(url)) shell.openExternal(url);
    }
  });

  if (process.env.NBA_SCREENSHOT) {
    const screenshotPath = path.resolve(process.env.NBA_SCREENSHOT);
    const delay = Number(process.env.NBA_SCREENSHOT_DELAY ?? 6500);
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        const image = await mainWindow.webContents.capturePage();
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, image.toPNG());
        app.quit();
      }, delay);
    });
  }
}

function createMiniWindow() {
  miniWindow = new BrowserWindow({
    width: 420,
    height: 140,
    minWidth: 420,
    minHeight: 140,
    maxWidth: 560,
    maxHeight: 187,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    roundedCorners: true,
    resizable: true,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: miniAlwaysOnTop,
    title: '比赛速览',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  miniWindow.loadFile(path.join(__dirname, 'mini.html'));
  miniWindow.setAlwaysOnTop(miniAlwaysOnTop, 'floating');

  if (!app.isPackaged) {
    miniWindow.webContents.on('console-message', (details) => {
      console.log(`[mini:${details.level}] ${details.message}`);
    });
    miniWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
      console.error(`[mini preload] ${preloadPath}`, error);
    });
  }

  miniWindow.once('ready-to-show', () => {
    if (!miniWindow || miniWindow.isDestroyed()) return;
    positionMiniNearMain();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
    miniWindow.show();
    startMiniEdgeWatcher();
  });

  miniWindow.on('move', rearmMiniDockAfterReveal);
  miniWindow.on('moved', rearmMiniDockAfterReveal);

  miniWindow.webContents.once('did-finish-load', () => {
    if (miniWindow && !miniWindow.isDestroyed()) {
      miniWindow.webContents.send('mini:context', miniContext);
    }
  });

  miniWindow.on('closed', () => {
    resetMiniDockState();
    miniWindow = null;
    if (
      !closingMainWindow &&
      !isQuitting &&
      mainWindow &&
      !mainWindow.isDestroyed()
    ) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  miniWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedHttpUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  miniWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== miniWindow.webContents.getURL()) {
      event.preventDefault();
      if (isAllowedHttpUrl(url)) shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  ipcMain.handle('nba:scoreboard', async (_event, date) => {
    const normalizedDate = /^\d{8}$/.test(String(date ?? ''))
      ? String(date)
      : '';
    const url = new URL(SCOREBOARD_URL);
    if (normalizedDate) url.searchParams.set('dates', normalizedDate);
    url.searchParams.set('limit', '100');
    return normalizeScoreboard(await fetchJson(url.toString()));
  });

  ipcMain.handle('nba:summary', async (_event, eventId) => {
    if (!/^\d+$/.test(String(eventId ?? ''))) {
      throw new Error('比赛编号无效');
    }
    const url = new URL(SUMMARY_URL);
    url.searchParams.set('event', String(eventId));
    return normalizeSummary(await fetchJson(url.toString()));
  });

  ipcMain.handle('nba:standings', async () => {
    return normalizeStandings(await fetchJson(STANDINGS_URL));
  });

  ipcMain.handle('nba:team-news', async (_event, teamIds) => {
    const normalizedIds = [
      ...new Set(
        (Array.isArray(teamIds) ? teamIds : [])
          .map((teamId) => String(teamId ?? ''))
          .filter((teamId) => /^\d+$/.test(teamId)),
      ),
    ].slice(0, 2);
    if (!normalizedIds.length) throw new Error('球队编号无效');

    const responses = await Promise.allSettled(
      normalizedIds.map(async (teamId) => {
        const url = new URL(NEWS_URL);
        url.searchParams.set('team', teamId);
        url.searchParams.set('limit', '12');
        const payload = await fetchJson(url.toString());
        return {
          teamId,
          articles: curateTeamNews(payload.articles ?? [], teamId),
        };
      }),
    );
    const teams = responses
      .filter((response) => response.status === 'fulfilled')
      .map((response) => response.value);
    if (!teams.length) {
      throw responses.find((response) => response.status === 'rejected')
        ?.reason ?? new Error('球队新闻加载失败');
    }
    return { updatedAt: new Date().toISOString(), teams };
  });

  ipcMain.handle('mini:open', (_event, payload) => {
    miniContext = normalizeMiniContext(payload);

    if (!miniWindow || miniWindow.isDestroyed()) {
      resetMiniDockState();
      createMiniWindow();
    } else {
      resetMiniDockState();
      if (miniWindow.isMinimized()) miniWindow.restore();
      positionMiniNearMain();
      miniWindow.webContents.send('mini:context', miniContext);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
      miniWindow.show();
      miniWindow.focus();
      startMiniEdgeWatcher();
    }

    return { ok: true };
  });

  ipcMain.handle('mini:get-state', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win !== miniWindow) return null;
    return { context: miniContext, alwaysOnTop: miniAlwaysOnTop };
  });

  ipcMain.handle('mini:toggle-top', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win !== miniWindow) return { alwaysOnTop: false };
    miniAlwaysOnTop = !miniAlwaysOnTop;
    win.setAlwaysOnTop(miniAlwaysOnTop, 'floating');
    return { alwaysOnTop: miniAlwaysOnTop };
  });

  ipcMain.handle('window:show-main', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (
      !win ||
      win !== miniWindow ||
      !mainWindow ||
      mainWindow.isDestroyed()
    ) {
      return false;
    }
    resetMiniDockState();
    miniWindow.hide();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return true;
  });

  ipcMain.handle('mini:select-game', (event, gameId) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const normalizedId = String(gameId ?? '');
    if (
      !win ||
      win !== miniWindow ||
      !miniContext?.games.some((game) => game.id === normalizedId) ||
      !mainWindow ||
      mainWindow.isDestroyed()
    ) {
      return false;
    }
    miniContext = {
      ...miniContext,
      gameId: normalizedId,
      updatedAt: new Date().toISOString(),
    };
    mainWindow.webContents.send('mini:game-selected', normalizedId);
    return true;
  });

  ipcMain.handle('window:action', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;
    if (action === 'minimize') win.minimize();
    if (action === 'maximize') {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
    if (action === 'close') win.close();
    if (action === 'toggle-pin') {
      isPinned = !isPinned;
      win.setAlwaysOnTop(isPinned, 'floating');
    }
    return { pinned: isPinned, maximized: win.isMaximized() };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    resetMiniDockState();
    if (miniWindow && !miniWindow.isDestroyed()) miniWindow.hide();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
