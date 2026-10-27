const TEAMS = {
  1: { full: '亚特兰大老鹰', short: '老鹰', color: '#e03a3e' },
  2: { full: '波士顿凯尔特人', short: '凯尔特人', color: '#007a33' },
  3: { full: '新奥尔良鹈鹕', short: '鹈鹕', color: '#0c2340' },
  4: { full: '芝加哥公牛', short: '公牛', color: '#ce1141' },
  5: { full: '克利夫兰骑士', short: '骑士', color: '#860038' },
  6: { full: '达拉斯独行侠', short: '独行侠', color: '#00538c' },
  7: { full: '丹佛掘金', short: '掘金', color: '#0e2240' },
  8: { full: '底特律活塞', short: '活塞', color: '#c8102e' },
  9: { full: '金州勇士', short: '勇士', color: '#1d428a' },
  10: { full: '休斯顿火箭', short: '火箭', color: '#ce1141' },
  11: { full: '印第安纳步行者', short: '步行者', color: '#002d62' },
  12: { full: '洛杉矶快船', short: '快船', color: '#c8102e' },
  13: { full: '洛杉矶湖人', short: '湖人', color: '#552583' },
  14: { full: '迈阿密热火', short: '热火', color: '#98002e' },
  15: { full: '密尔沃基雄鹿', short: '雄鹿', color: '#00471b' },
  16: { full: '明尼苏达森林狼', short: '森林狼', color: '#0c2340' },
  17: { full: '布鲁克林篮网', short: '篮网', color: '#20242b' },
  18: { full: '纽约尼克斯', short: '尼克斯', color: '#006bb6' },
  19: { full: '奥兰多魔术', short: '魔术', color: '#0077c0' },
  20: { full: '费城76人', short: '76人', color: '#006bb6' },
  21: { full: '菲尼克斯太阳', short: '太阳', color: '#1d1160' },
  22: { full: '波特兰开拓者', short: '开拓者', color: '#e03a3e' },
  23: { full: '萨克拉门托国王', short: '国王', color: '#5a2d81' },
  24: { full: '圣安东尼奥马刺', short: '马刺', color: '#3e424b' },
  25: { full: '俄克拉荷马城雷霆', short: '雷霆', color: '#007ac1' },
  26: { full: '犹他爵士', short: '爵士', color: '#002b5c' },
  27: { full: '华盛顿奇才', short: '奇才', color: '#002b5c' },
  28: { full: '多伦多猛龙', short: '猛龙', color: '#ce1141' },
  29: { full: '孟菲斯灰熊', short: '灰熊', color: '#5d76a9' },
  30: { full: '夏洛特黄蜂', short: '黄蜂', color: '#1d1160' },
};

const TEAM_CODES = {
  1: 'atl',
  2: 'bos',
  3: 'no',
  4: 'chi',
  5: 'cle',
  6: 'dal',
  7: 'den',
  8: 'det',
  9: 'gs',
  10: 'hou',
  11: 'ind',
  12: 'lac',
  13: 'lal',
  14: 'mia',
  15: 'mil',
  16: 'min',
  17: 'bkn',
  18: 'ny',
  19: 'orl',
  20: 'phi',
  21: 'phx',
  22: 'por',
  23: 'sac',
  24: 'sa',
  25: 'okc',
  26: 'utah',
  27: 'wsh',
  28: 'tor',
  29: 'mem',
  30: 'cha',
};

const PLAYER_NAMES = window.NBA_PLAYER_NAMES?.names ?? {};
const LIVE_REFRESH_MS = 3000;
const IDLE_REFRESH_MS = 60000;

const state = {
  context: null,
  summary: null,
  currentGameId: '',
  alwaysOnTop: true,
  requestToken: 0,
  refreshTimer: null,
  toastTimer: null,
  loadingShown: false,
  switching: false,
};

const el = {
  miniFrame: document.querySelector('#miniFrame'),
  previousGameButton: document.querySelector('#previousGameButton'),
  nextGameButton: document.querySelector('#nextGameButton'),
  gamePosition: document.querySelector('#gamePosition'),
  pinButton: document.querySelector('#pinButton'),
  showMainButton: document.querySelector('#showMainButton'),
  scoreCard: document.querySelector('#scoreCard'),
  statusPill: document.querySelector('#statusPill'),
  statusText: document.querySelector('#statusText'),
  liveDot: document.querySelector('#liveDot'),
  awayLogo: document.querySelector('#awayLogo'),
  awayName: document.querySelector('#awayName'),
  awayScore: document.querySelector('#awayScore'),
  homeLogo: document.querySelector('#homeLogo'),
  homeName: document.querySelector('#homeName'),
  homeScore: document.querySelector('#homeScore'),
  gameClock: document.querySelector('#gameClock'),
  liveLines: document.querySelector('#liveLines'),
  liveEmpty: document.querySelector('#liveEmpty'),
  liveEmptyTitle: document.querySelector('#liveEmptyTitle'),
  liveEmptyText: document.querySelector('#liveEmptyText'),
  loadingLayer: document.querySelector('#loadingLayer'),
  toast: document.querySelector('#toast'),
};

const chinaDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: 'numeric',
  day: 'numeric',
});

const chinaTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const chinaTimeWithSecondsFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function sanitizeColor(value, fallback = '#73767e') {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function teamInfo(team = {}) {
  const id = String(team.id ?? team.teamId ?? '');
  const known = TEAMS[id];
  return {
    id,
    full: known?.full ?? `球队${id || ''}`,
    short: known?.short ?? `球队${id || ''}`,
    color: sanitizeColor(
      team.color ? `#${String(team.color).replace('#', '')}` : known?.color,
      known?.color,
    ),
  };
}

function teamLogo(teamId) {
  const code = TEAM_CODES[String(teamId)];
  return code
    ? `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${code}.png`
    : '';
}

function headshotUrl(athlete) {
  if (!athlete?.id) return '';
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${encodeURIComponent(
    athlete.id,
  )}.png&w=72&h=72&transparent=true`;
}

function formatChinaDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日期待定';
  const parts = chinaDateFormatter.formatToParts(date);
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${Number(month)}月${Number(day)}日`;
}

function formatBeijingTime(value, fallback = '--:--') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : chinaTimeFormatter.format(date);
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '刚刚同步'
    : `${chinaTimeWithSecondsFormatter.format(date)} 同步`;
}

function formatGameDate(value) {
  if (!value) return '比赛时间待定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '比赛时间待定';
  return `北京时间 ${formatChinaDate(value)} ${formatBeijingTime(value)}`;
}

function dateText(dateKey) {
  if (!/^\d{8}$/.test(String(dateKey ?? ''))) return '中国大陆时间';
  return `${Number(dateKey.slice(4, 6))}月${Number(dateKey.slice(6, 8))}日 · 中国大陆时间`;
}

function periodName(period) {
  if (!period) return '赛前';
  if (period <= 4) return ['第一节', '第二节', '第三节', '第四节'][period - 1];
  if (period === 5) return '加时赛';
  return `第${period - 4}个加时`;
}

function seasonName(slug) {
  if (slug === 'postseason') return '季后赛';
  if (slug === 'preseason') return '季前赛';
  if (slug === 'all-star') return '全明星';
  return '常规赛';
}

function formatRecord(record) {
  if (!record) return '战绩待更新';
  const match = String(record).match(/(\d+)-(\d+)/);
  return match ? `${match[1]}胜${match[2]}负` : '战绩待更新';
}

function positionName(position) {
  return (
    {
      PG: '控球后卫',
      SG: '得分后卫',
      SF: '小前锋',
      PF: '大前锋',
      C: '中锋',
      G: '后卫',
      F: '前锋',
    }[String(position ?? '').toUpperCase()] ?? '球员'
  );
}

function normalizeEnglishName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(jr|sr|iii|ii|iv)$/g, '');
}

function athleteMap() {
  return new Map(
    (state.summary?.athletes ?? []).map((athlete) => [String(athlete.id), athlete]),
  );
}

function chineseNameForAthlete(athlete) {
  if (!athlete) return '场上球员';
  const mapped = PLAYER_NAMES[normalizeEnglishName(athlete.name)];
  if (mapped) return mapped.replaceAll('-', '·');
  const team = teamInfo({ id: athlete.teamId });
  return `${team.short}${athlete.jersey ? `${athlete.jersey}号` : ''}球员`;
}

function findAthleteByEnglishName(name) {
  const target = normalizeEnglishName(name);
  if (!target) return null;
  const athletes = state.summary?.athletes ?? [];
  return (
    athletes.find((athlete) => normalizeEnglishName(athlete.name) === target) ??
    athletes.find((athlete) => normalizeEnglishName(athlete.name).includes(target)) ??
    null
  );
}

function findNamedAthleteInText(text) {
  const lower = String(text ?? '').toLowerCase();
  return (
    (state.summary?.athletes ?? [])
      .slice()
      .sort((a, b) => b.name.length - a.name.length)
      .find((athlete) => lower.includes(String(athlete.name).toLowerCase())) ?? null
  );
}

function primaryPlayContext(play, players = athleteMap()) {
  const primary = players.get(String(play.participants?.[0] ?? '')) ?? null;
  const fallbackTeamId =
    play.teamId ||
    primary?.teamId ||
    (/(?:end game|end period)/i.test(play.type)
      ? state.summary?.game?.competitors?.[0]?.team?.id
      : '');
  return {
    primary,
    team: teamInfo({ id: fallbackTeamId }),
  };
}

function playerOrTeam(play, players) {
  const { primary, team } = primaryPlayContext(play, players);
  return {
    primary,
    team,
    name: primary ? chineseNameForAthlete(primary) : team.short,
  };
}

function findParentheticalPlayer(text, actionWords) {
  const expression = new RegExp(
    `\\(([^)]*?)\\s+(?:${actionWords.join('|')})\\)`,
    'i',
  );
  const match = String(text ?? '').match(expression);
  return match ? findAthleteByEnglishName(match[1]) : null;
}

function feetToMeters(feet) {
  return Number((Number(feet) * 0.3048).toFixed(1)).toString();
}

function isMadePlay(play) {
  if (/\bmiss(?:es|ed)?\b/i.test(play.text)) return false;
  if (/\bmak(?:es|e|ing)\b/i.test(play.text)) return true;
  return Boolean(play.scoringPlay && play.scoreValue > 0);
}

function shotFamily(type) {
  const lower = type.toLowerCase();
  if (lower.includes('alley oop')) return '空接';
  if (lower.includes('dunk')) return '扣篮';
  if (lower.includes('finger roll')) return '拉杆上篮';
  if (lower.includes('layup')) return '上篮';
  if (lower.includes('hook')) return '勾手';
  if (lower.includes('tip')) return '补篮';
  if (lower.includes('fade away')) return '后仰跳投';
  if (lower.includes('step back')) return '后撤步跳投';
  if (lower.includes('turnaround')) return '转身跳投';
  if (lower.includes('pullup')) return '急停跳投';
  if (lower.includes('driving')) return '突破抛投';
  if (lower.includes('heave')) return '半场超远出手';
  if (lower.includes('bank')) return '打板跳投';
  return '跳投';
}

function shotPrefix(type) {
  const lower = type.toLowerCase();
  if (lower.includes('running')) return '快攻';
  if (lower.includes('driving')) return '突破';
  if (lower.includes('cutting')) return '空切';
  if (lower.includes('turnaround')) return '转身';
  return '';
}

function localizePlay(play) {
  const players = athleteMap();
  const { primary, name } = playerOrTeam(play, players);
  const type = play.type || '';
  const typeLower = type.toLowerCase();
  const description = play.text || '';
  const playTeam = teamInfo({ id: play.teamId });
  const period = periodName(play.period);
  const game = state.summary?.game;

  if (typeLower.includes('end game')) {
    const away = game?.competitors?.[0];
    const home = game?.competitors?.[1];
    return {
      message: `比赛结束，${teamInfo(away?.team).short} ${away?.score ?? play.awayScore} 比 ${play.homeScore ?? home?.score ?? ''} ${teamInfo(home?.team).short}`,
      tag: '终场',
      accent: '#6d7078',
    };
  }

  if (typeLower.includes('end period')) {
    const away = game?.competitors?.[0];
    const home = game?.competitors?.[1];
    return {
      message: `${period}结束，${teamInfo(away?.team).short} ${play.awayScore} 比 ${play.homeScore} ${teamInfo(home?.team).short}`,
      tag: '节间',
      accent: '#6d7078',
    };
  }

  if (typeLower.includes('substitution')) {
    const match = description.match(/^(.+?)\s+enters the game for\s+(.+)$/i);
    const entering = match ? findAthleteByEnglishName(match[1]) : primary;
    const leaving = match ? findAthleteByEnglishName(match[2]) : null;
    return {
      message: `${chineseNameForAthlete(entering)}替换${chineseNameForAthlete(leaving)}登场`,
      tag: '换人',
      accent: '#777a82',
    };
  }

  if (typeLower.includes('timeout')) {
    return {
      message: `${playTeam.short}请求暂停`,
      tag: '暂停',
      accent: '#69717f',
    };
  }

  if (typeLower.includes('free throw')) {
    const freeThrow = type.match(/(\d+)\s+of\s+(\d+)/i);
    const count = freeThrow ? `（${freeThrow[1]}/${freeThrow[2]}）` : '';
    const made = isMadePlay(play);
    return {
      message: `${name}${made ? '罚球命中' : '罚球不中'}${count}`,
      tag: made ? '罚球得分' : '罚球',
      accent: made ? '#f05a35' : '#ac6b51',
    };
  }

  if (typeLower.includes('rebound')) {
    const offensive = typeLower.includes('offensive');
    const teamRebound = /team rebound/i.test(description);
    return {
      message: teamRebound
        ? `${playTeam.short}全队${offensive ? '拼下前场篮板' : '保护后场篮板'}`
        : `${name}${offensive ? '抢下前场篮板' : '保护后场篮板'}`,
      tag: offensive ? '前场篮板' : '篮板',
      accent: '#1eaa71',
    };
  }

  if (typeLower.includes('foul')) {
    let label = '犯规';
    if (typeLower.includes('shooting')) label = '投篮犯规';
    else if (typeLower.includes('loose ball')) label = '无球犯规';
    else if (typeLower.includes('personal take')) label = '个人犯规';
    else if (typeLower.includes('offensive charge')) label = '进攻犯规';
    else if (typeLower.includes('offensive')) label = '进攻犯规';
    else if (typeLower.includes('technical')) label = '技术犯规';
    return {
      message: `${name}${label}`,
      tag: '犯规',
      accent: '#d14f4f',
    };
  }

  if (typeLower.includes('turnover')) {
    const steal = findParentheticalPlayer(description, ['steals?', 'steal']);
    const stealText = steal ? `，${chineseNameForAthlete(steal)}完成抢断` : '';
    let detail = '出现失误';
    if (typeLower.includes('bad pass')) detail = '传球失误';
    else if (typeLower.includes('lost ball')) detail = '丢球失误';
    else if (typeLower.includes('out of bounds')) detail = '传球出界';
    else if (typeLower.includes('traveling')) detail = '走步失误';
    else if (typeLower.includes('back court')) detail = '回场失误';
    else if (typeLower.includes('offensive goaltending')) detail = '进攻干扰球';
    else if (typeLower.includes('offensive foul')) detail = '进攻犯规';
    return {
      message: `${name}${detail}${stealText}`,
      tag: '失误',
      accent: '#b16c4d',
    };
  }

  if (typeLower.includes('jumpball')) {
    const match = description.match(
      /^(.+?)\s+vs\.?\s+(.+?)\s+\((.+?)\s+gains possession\)/i,
    );
    if (match) {
      const first = findAthleteByEnglishName(match[1]);
      const second = findAthleteByEnglishName(match[2]);
      const winner = findAthleteByEnglishName(match[3]);
      return {
        message: `${chineseNameForAthlete(first)}与${chineseNameForAthlete(second)}跳球，${chineseNameForAthlete(winner)}获得球权`,
        tag: '跳球',
        accent: '#69717f',
      };
    }
    return {
      message: `${name}参与跳球`,
      tag: '跳球',
      accent: '#69717f',
    };
  }

  if (typeLower.includes('review') || typeLower.includes('challenge')) {
    const overturned = /overturned|successful/i.test(description);
    const challenge = typeLower.includes('coach');
    return {
      message: challenge
        ? `${playTeam.short}教练挑战${overturned ? '成功，原判改判' : '结束，原判维持'}`
        : `裁判回看录像，${overturned ? '判罚改判' : '原判维持'}`,
      tag: '回看',
      accent: '#326ff2',
    };
  }

  if (
    play.shootingPlay ||
    typeLower.includes('shot') ||
    typeLower.includes('layup')
  ) {
    const made = isMadePlay(play);
    const points = play.scoreValue || play.pointsAttempted;
    const isThree = points === 3 || /three point/i.test(description);
    const distance = description.match(/(\d+)-foot/i);
    const distanceText = distance ? `在${feetToMeters(distance[1])}米外` : '';
    const prefix = shotPrefix(type);
    const family = shotFamily(type);
    const action = isThree && family === '跳投' ? '三分' : family;
    const assist = findParentheticalPlayer(description, ['assists?', 'assist']);
    const block = findParentheticalPlayer(description, ['blocks?', 'block']);
    let message = made
      ? `${name}${distanceText}${prefix}${action}命中`
      : `${name}${distanceText}${prefix}${action}不中`;
    if (made && assist) message += `，${chineseNameForAthlete(assist)}送出助攻`;
    if (!made && block) message += `，${chineseNameForAthlete(block)}送出封盖`;
    return {
      message,
      tag: made ? (isThree ? '三分' : '得分') : '出手',
      accent: made ? (isThree ? '#e47a2d' : '#f05a35') : '#7b7e86',
    };
  }

  const genericType =
    {
      'Alley Oop Dunk Shot': '完成空接扣篮',
      'Bad Pass Turnover': '传球失误',
      'Coach’s Challenge': '教练挑战',
      'Cutting Layup Shot': '空切上篮',
      'Defensive Rebound': '保护后场篮板',
      'Driving Dunk Shot': '突破扣篮',
      'Driving Finger Roll Layup': '突破拉杆上篮',
      'Driving Floating Jump Shot': '突破抛投',
      'Driving Hook Shot': '突破勾手',
      'Driving Layup Shot': '突破上篮',
      'Dunk Shot': '扣篮',
      'Fade Away Jump Shot': '后仰跳投',
      'Floating Jump Shot': '抛投',
      'Jump Shot': '跳投',
      Jumpball: '参与跳球',
      'Layup Shot': '上篮',
      'Loose Ball Foul': '无球犯规',
      'Offensive Charge': '进攻犯规',
      'Offensive Foul': '进攻犯规',
      'Offensive Rebound': '抢下前场篮板',
      'Personal Foul': '个人犯规',
      'Personal Take Foul': '个人犯规',
      'Pullup Jump Shot': '急停跳投',
      'Running Dunk Shot': '快攻扣篮',
      'Running Layup Shot': '快攻上篮',
      'Shooting Foul': '投篮犯规',
      'Step Back Jump Shot': '后撤步跳投',
      Substitution: '被替换下场',
      'Tip Dunk Shot': '补扣',
      'Tip Shot': '补篮',
      Traveling: '走步失误',
      'Turnaround Fade Away Jump Shot': '转身后仰跳投',
      'Turnaround Hook Shot': '转身勾手',
      'Turnaround Jump Shot': '转身跳投',
    }[type] ?? '完成一次攻防';

  const inferredPlayer = primary ?? findNamedAthleteInText(description);
  const inferredName = inferredPlayer ? chineseNameForAthlete(inferredPlayer) : name;
  return {
    message: `${inferredName}${genericType}`,
    tag: typeLower.includes('foul') ? '犯规' : '赛况',
    accent: typeLower.includes('foul') ? '#d14f4f' : '#73767e',
  };
}

function currentGame() {
  return (
    state.context?.games?.find((game) => game.id === state.currentGameId) ?? null
  );
}

function matchupLabel(game) {
  const away =
    game?.competitors?.find((item) => item.homeAway === 'away') ??
    game?.competitors?.[0];
  const home =
    game?.competitors?.find((item) => item.homeAway === 'home') ??
    game?.competitors?.[1];
  return `${teamInfo(away?.team).short} vs ${teamInfo(home?.team).short}`;
}

function gameAtOffset(offset) {
  const games = state.context?.games ?? [];
  if (games.length < 2) return null;
  const currentIndex = games.findIndex(
    (game) => game.id === state.currentGameId,
  );
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  return games[(baseIndex + offset + games.length) % games.length];
}

function renderGameSwitcher() {
  const games = state.context?.games ?? [];
  const currentIndex = games.findIndex(
    (game) => game.id === state.currentGameId,
  );
  const canSwitch = games.length > 1 && currentIndex >= 0;
  const previous = canSwitch ? gameAtOffset(-1) : null;
  const next = canSwitch ? gameAtOffset(1) : null;

  el.previousGameButton.disabled = !canSwitch;
  el.nextGameButton.disabled = !canSwitch;
  el.gamePosition.textContent =
    currentIndex >= 0 ? `${currentIndex + 1}/${games.length}` : '–';
  el.previousGameButton.title = previous
    ? `上一场：${matchupLabel(previous)}`
    : '当天仅有一场比赛';
  el.nextGameButton.title = next
    ? `下一场：${matchupLabel(next)}`
    : '当天仅有一场比赛';
  el.previousGameButton.setAttribute(
    'aria-label',
    previous ? `切换到上一场：${matchupLabel(previous)}` : '当天仅有一场比赛',
  );
  el.nextGameButton.setAttribute(
    'aria-label',
    next ? `切换到下一场：${matchupLabel(next)}` : '当天仅有一场比赛',
  );
}

function mergedCurrentGame() {
  const game = currentGame();
  if (!game) return null;
  const summaryGame =
    state.summary?.game?.id === game.id ? state.summary.game : null;
  if (!summaryGame) return game;
  return {
    ...game,
    ...summaryGame,
    competitors: summaryGame.competitors?.length
      ? summaryGame.competitors
      : game.competitors,
  };
}

function currentGameFinished() {
  return mergedCurrentGame()?.status?.state === 'post';
}

function syncCurrentGameStatus(summary) {
  const summaryGame = summary?.game;
  if (
    !state.context?.games?.length ||
    summaryGame?.id !== state.currentGameId ||
    !summaryGame.status?.state
  ) {
    return;
  }
  const index = state.context.games.findIndex(
    (game) => game.id === state.currentGameId,
  );
  if (index < 0) return;
  const current = state.context.games[index];
  state.context.games[index] = {
    ...current,
    status: {
      ...current.status,
      ...summaryGame.status,
    },
  };
}

function renderGame() {
  const game = mergedCurrentGame();
  if (!game) return;

  const away = game.competitors?.find((item) => item.homeAway === 'away') ??
    game.competitors?.[0];
  const home = game.competitors?.find((item) => item.homeAway === 'home') ??
    game.competitors?.[1];
  const awayInfo = teamInfo(away?.team);
  const homeInfo = teamInfo(home?.team);
  const status = game.status ?? {};
  const live = status.state === 'in';
  const pre = status.state === 'pre';

  el.scoreCard.style.setProperty('--away-color', awayInfo.color);
  el.scoreCard.style.setProperty('--home-color', homeInfo.color);
  el.awayLogo.src = safeImageUrl(teamLogo(awayInfo.id));
  el.awayLogo.alt = `${awayInfo.short}队徽`;
  el.homeLogo.src = safeImageUrl(teamLogo(homeInfo.id));
  el.homeLogo.alt = `${homeInfo.short}队徽`;
  el.awayName.textContent = awayInfo.short;
  el.homeName.textContent = homeInfo.short;
  el.awayScore.textContent = pre ? '–' : String(away?.score ?? '–');
  el.homeScore.textContent = pre ? '–' : String(home?.score ?? '–');
  el.statusText.textContent = live ? '直播中' : pre ? '未开始' : '已结束';
  el.statusPill.classList.toggle('is-live', live);
  el.statusPill.classList.toggle('is-pre', pre);
  el.statusPill.classList.toggle('is-final', !live && !pre);
  el.liveDot.classList.toggle('is-live', live);

  if (live) {
    el.gameClock.className = 'game-clock is-live';
    el.gameClock.textContent = `${periodName(status.period)} · ${status.clock || '--:--'}`;
  } else if (pre) {
    el.gameClock.className = 'game-clock is-pre';
    el.gameClock.textContent = `${formatBeijingTime(game.date)} 开赛`;
  } else {
    el.gameClock.className = 'game-clock is-final';
    el.gameClock.textContent = '终场';
  }

  el.awayLogo.onerror = () => {
    el.awayLogo.style.visibility = 'hidden';
  };
  el.homeLogo.onerror = () => {
    el.homeLogo.style.visibility = 'hidden';
  };
  el.awayLogo.style.visibility = '';
  el.homeLogo.style.visibility = '';
}

function renderEmptyLive(title, text) {
  el.liveLines.innerHTML = '';
  el.liveEmptyTitle.textContent = title;
  el.liveEmptyText.textContent = text;
  el.liveEmpty.classList.remove('is-hidden');
}

function renderLive() {
  const game = mergedCurrentGame();
  if (!game) return;

  const validSummary = state.summary?.game?.id === game.id;
  const plays = validSummary
    ? [...(state.summary?.plays ?? [])].sort(
        (a, b) =>
          b.sequence - a.sequence ||
          new Date(b.wallclock).getTime() - new Date(a.wallclock).getTime(),
      )
    : [];

  if (!plays.length) {
    if (!validSummary) {
      renderEmptyLive('正在同步赛况', '实时文字直播马上就好');
    } else if (game.status?.state === 'pre') {
      renderEmptyLive(
        '比赛尚未开始',
        `${teamInfo(game.competitors?.[0]?.team).short}对阵${teamInfo(game.competitors?.[1]?.team).short}，开赛后持续更新`,
      );
    } else {
      renderEmptyLive('暂无文字动态', '赛况正在同步，稍后会自动更新');
    }
    return;
  }

  el.liveEmpty.classList.add('is-hidden');
  el.liveLines.innerHTML = plays
    .slice(0, 1)
    .map((play) => {
      const localized = localizePlay(play);
      const clock = /end game/i.test(play.type)
        ? '终场'
        : /end period/i.test(play.type)
          ? '节间'
          : play.clock || '—';
      return `
        <article class="live-line" style="--line-accent:${escapeHtml(localized.accent)}">
          <span class="line-message" title="${escapeHtml(localized.message)}">${escapeHtml(localized.message)}</span>
          <span class="line-clock">${escapeHtml(clock)}</span>
        </article>
      `;
    })
    .join('');
}

function renderAll() {
  renderGame();
  renderLive();
}

function showLoading(show) {
  el.loadingLayer.classList.toggle('is-hidden', !show);
  state.loadingShown = show;
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => {
    el.toast.classList.remove('is-visible');
  }, 2600);
}

function scheduleRefresh() {
  clearTimeout(state.refreshTimer);
  state.refreshTimer = null;
  if (currentGameFinished()) return;
  const live = mergedCurrentGame()?.status?.state === 'in';
  state.refreshTimer = setTimeout(() => {
    if (document.hidden) {
      scheduleRefresh();
      return;
    }
    refreshCurrent(false);
  }, live ? LIVE_REFRESH_MS : IDLE_REFRESH_MS);
}

async function loadGame(game) {
  if (!game?.id) return;
  if (state.context) {
    state.context = { ...state.context, gameId: game.id };
  }
  state.currentGameId = game.id;
  state.summary = null;
  renderGameSwitcher();
  renderAll();
  showLoading(true);

  const token = ++state.requestToken;
  try {
    const summary = await window.nbaDesktop.getSummary(game.id);
    if (token !== state.requestToken) return;
    state.summary = summary;
    syncCurrentGameStatus(summary);
    renderAll();
    scheduleRefresh();
  } catch (error) {
    if (token !== state.requestToken) return;
    console.error('迷你窗比赛数据加载失败', error);
    renderEmptyLive('赛况暂时不可用', '网络可能短暂波动，稍后会自动重试');
    showToast(`加载失败：${error.message ?? '请稍后重试'}`);
    scheduleRefresh();
  } finally {
    if (token === state.requestToken) showLoading(false);
  }
}

async function switchGame(offset) {
  if (
    state.switching ||
    !window.nbaDesktop?.selectMiniGame ||
    (state.context?.games?.length ?? 0) < 2
  ) {
    return;
  }

  const nextGame = gameAtOffset(offset);
  if (!nextGame) return;

  state.switching = true;
  try {
    const selected = await window.nbaDesktop.selectMiniGame(nextGame.id);
    if (!selected) {
      showToast('比赛切换失败，请稍后重试');
      return;
    }
    await loadGame(nextGame);
    showToast(`已切换：${matchupLabel(nextGame)}`);
  } catch (error) {
    console.error('迷你窗切换比赛失败', error);
    showToast('比赛切换失败，请稍后重试');
  } finally {
    state.switching = false;
  }
}

async function refreshCurrent() {
  const game = currentGame();
  if (!game?.id) return;
  if (currentGameFinished()) {
    scheduleRefresh();
    return;
  }
  const token = ++state.requestToken;
  try {
    const summary = await window.nbaDesktop.getSummary(game.id);
    if (token !== state.requestToken) return;
    state.summary = summary;
    syncCurrentGameStatus(summary);
    renderAll();
  } catch {
    scheduleRefresh();
  } finally {
    if (token === state.requestToken) scheduleRefresh();
  }
}

async function applyContext(context) {
  if (!context?.games?.length) {
    showLoading(false);
    showToast('没有可显示的比赛');
    return;
  }
  const game =
    context.games.find((item) => item.id === String(context.gameId)) ??
    context.games[0];
  const sameGame = state.context?.updatedAt === context.updatedAt &&
    state.currentGameId === game.id;
  state.context = context;
  if (sameGame && state.summary) {
    renderAll();
    scheduleRefresh();
    return;
  }
  await loadGame(game);
}

function bindWindowControls() {
  const showMain = () => window.nbaDesktop.showMain();
  el.showMainButton.addEventListener('click', showMain);
  el.previousGameButton.addEventListener('click', () => switchGame(-1));
  el.nextGameButton.addEventListener('click', () => switchGame(1));
  el.pinButton.addEventListener('click', async () => {
    const result = await window.nbaDesktop.toggleMiniTop();
    renderPinState(Boolean(result?.alwaysOnTop));
    showToast(state.alwaysOnTop ? '已固定桌面' : '已取消固定');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      showMain();
      return;
    }
    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault();
      switchGame(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshCurrent();
  });
}

function renderPinState(alwaysOnTop) {
  state.alwaysOnTop = alwaysOnTop;
  const label = alwaysOnTop ? '取消固定桌面' : '固定桌面';
  el.pinButton.classList.toggle('is-active', alwaysOnTop);
  el.pinButton.setAttribute('aria-pressed', String(alwaysOnTop));
  el.pinButton.setAttribute('aria-label', label);
  el.pinButton.title = label;
}

async function init() {
  bindWindowControls();

  if (!window.nbaDesktop) {
    showLoading(false);
    showToast('桌面接口未加载');
    return;
  }

  window.nbaDesktop.onMiniContext((context) => {
    applyContext(context);
  });

  try {
    const miniState = await window.nbaDesktop.getMiniState();
    if (!miniState?.context) {
      showLoading(false);
      showToast('未找到比赛数据');
      return;
    }
    renderPinState(Boolean(miniState.alwaysOnTop));
    await applyContext(miniState.context);
  } catch (error) {
    console.error('迷你窗初始化失败', error);
    showLoading(false);
    showToast('迷你窗加载失败');
  }
}

init();
