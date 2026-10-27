const TEAMS = {
  1: { full: '亚特兰大老鹰', short: '老鹰', color: '#e03a3e', slug: 'hawks' },
  2: { full: '波士顿凯尔特人', short: '凯尔特人', color: '#007a33', slug: 'celtics' },
  3: { full: '新奥尔良鹈鹕', short: '鹈鹕', color: '#0c2340', slug: 'pelicans' },
  4: { full: '芝加哥公牛', short: '公牛', color: '#ce1141', slug: 'bulls' },
  5: { full: '克利夫兰骑士', short: '骑士', color: '#860038', slug: 'cavaliers' },
  6: { full: '达拉斯独行侠', short: '独行侠', color: '#00538c', slug: 'mavericks' },
  7: { full: '丹佛掘金', short: '掘金', color: '#0e2240', slug: 'nuggets' },
  8: { full: '底特律活塞', short: '活塞', color: '#c8102e', slug: 'pistons' },
  9: { full: '金州勇士', short: '勇士', color: '#1d428a', slug: 'warriors' },
  10: { full: '休斯顿火箭', short: '火箭', color: '#ce1141', slug: 'rockets' },
  11: { full: '印第安纳步行者', short: '步行者', color: '#002d62', slug: 'pacers' },
  12: { full: '洛杉矶快船', short: '快船', color: '#c8102e', slug: 'clippers' },
  13: { full: '洛杉矶湖人', short: '湖人', color: '#552583', slug: 'lakers' },
  14: { full: '迈阿密热火', short: '热火', color: '#98002e', slug: 'heat' },
  15: { full: '密尔沃基雄鹿', short: '雄鹿', color: '#00471b', slug: 'bucks' },
  16: { full: '明尼苏达森林狼', short: '森林狼', color: '#0c2340', slug: 'timberwolves' },
  17: { full: '布鲁克林篮网', short: '篮网', color: '#20242b', slug: 'nets' },
  18: { full: '纽约尼克斯', short: '尼克斯', color: '#006bb6', slug: 'knicks' },
  19: { full: '奥兰多魔术', short: '魔术', color: '#0077c0', slug: 'magic' },
  20: { full: '费城76人', short: '76人', color: '#006bb6', slug: '76ers' },
  21: { full: '菲尼克斯太阳', short: '太阳', color: '#1d1160', slug: 'suns' },
  22: { full: '波特兰开拓者', short: '开拓者', color: '#e03a3e', slug: 'blazers' },
  23: { full: '萨克拉门托国王', short: '国王', color: '#5a2d81', slug: 'kings' },
  24: { full: '圣安东尼奥马刺', short: '马刺', color: '#3e424b', slug: 'spurs' },
  25: { full: '俄克拉荷马城雷霆', short: '雷霆', color: '#007ac1', slug: 'thunder' },
  26: { full: '犹他爵士', short: '爵士', color: '#002b5c', slug: 'jazz' },
  27: { full: '华盛顿奇才', short: '奇才', color: '#002b5c', slug: 'wizards' },
  28: { full: '多伦多猛龙', short: '猛龙', color: '#ce1141', slug: 'raptors' },
  29: { full: '孟菲斯灰熊', short: '灰熊', color: '#5d76a9', slug: 'grizzlies' },
  30: { full: '夏洛特黄蜂', short: '黄蜂', color: '#1d1160', slug: 'hornets' },
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
const PLAYER_NAME_KEYS = Object.entries(PLAYER_NAMES)
  .filter(([key]) => key.length >= 6)
  .sort(([left], [right]) => right.length - left.length);
const LIVE_REFRESH_MS = 3000;
const IDLE_REFRESH_MS = 60000;
const TEAM_NEWS_REFRESH_MS = 60000;
const LIVE_SCHEDULE_REFRESH_TICKS = 20;

const state = {
  selectedDate: '',
  today: '',
  events: [],
  selectedGameId: '',
  summary: null,
  view: 'live',
  autoRefresh: true,
  refreshTimer: null,
  clockTimer: null,
  refreshTicks: 0,
  loadToken: 0,
  feedSignature: '',
  firstFeedId: '',
  toastTimer: null,
  playerTeamId: '',
  news: [],
  newsStatus: 'idle',
  newsUpdatedAt: '',
  newsTeamKey: '',
  newsFetchedAt: 0,
  standings: null,
  standingsStatus: 'idle',
  standingsConference: 'east',
};

const el = {
  windowFrame: document.querySelector('#windowFrame'),
  closeButton: document.querySelector('#closeButton'),
  minimizeButton: document.querySelector('#minimizeButton'),
  maximizeButton: document.querySelector('#maximizeButton'),
  pinButton: document.querySelector('#pinButton'),
  miniButton: document.querySelector('#miniButton'),
  beijingClock: document.querySelector('#beijingClock'),
  scoreCard: document.querySelector('#scoreCard'),
  seasonPill: document.querySelector('#seasonPill'),
  gameDate: document.querySelector('#gameDate'),
  statusBadge: document.querySelector('#statusBadge'),
  statusText: document.querySelector('#statusText'),
  awayLogo: document.querySelector('#awayLogo'),
  awayName: document.querySelector('#awayName'),
  awayRecord: document.querySelector('#awayRecord'),
  awayScore: document.querySelector('#awayScore'),
  homeLogo: document.querySelector('#homeLogo'),
  homeName: document.querySelector('#homeName'),
  homeRecord: document.querySelector('#homeRecord'),
  homeScore: document.querySelector('#homeScore'),
  gameClock: document.querySelector('#gameClock'),
  quarterStrip: document.querySelector('#quarterStrip'),
  updateStamp: document.querySelector('#updateStamp'),
  livePulse: document.querySelector('#livePulse'),
  feed: document.querySelector('#feed'),
  feedEmpty: document.querySelector('#feedEmpty'),
  emptyTitle: document.querySelector('#emptyTitle'),
  emptyText: document.querySelector('#emptyText'),
  feedSummary: document.querySelector('#feedSummary'),
  refreshMode: document.querySelector('#refreshMode'),
  refreshButton: document.querySelector('#refreshButton'),
  feedTabs: document.querySelector('#feedTabs'),
  contentKicker: document.querySelector('#contentKicker'),
  contentTitle: document.querySelector('#contentTitle'),
  liveView: document.querySelector('#liveView'),
  statsView: document.querySelector('#statsView'),
  newsView: document.querySelector('#newsView'),
  newPill: document.querySelector('#newPill'),
  scheduleDate: document.querySelector('#scheduleDate'),
  scheduleWeekday: document.querySelector('#scheduleWeekday'),
  scheduleList: document.querySelector('#scheduleList'),
  previousDay: document.querySelector('#previousDay'),
  nextDay: document.querySelector('#nextDay'),
  todayButton: document.querySelector('#todayButton'),
  standingsSeason: document.querySelector('#standingsSeason'),
  standingsTabs: document.querySelector('#standingsTabs'),
  standingsList: document.querySelector('#standingsList'),
  standingsEmpty: document.querySelector('#standingsEmpty'),
  playerStatsTitle: document.querySelector('#playerStatsTitle'),
  playerStatsUpdated: document.querySelector('#playerStatsUpdated'),
  playerTeamTabs: document.querySelector('#playerTeamTabs'),
  playerStatsList: document.querySelector('#playerStatsList'),
  playerStatsEmpty: document.querySelector('#playerStatsEmpty'),
  newsGrid: document.querySelector('#newsGrid'),
  newsEmpty: document.querySelector('#newsEmpty'),
  autoRefreshToggle: document.querySelector('#autoRefreshToggle'),
  connectionTitle: document.querySelector('#connectionTitle'),
  connectionText: document.querySelector('#connectionText'),
  loadingLayer: document.querySelector('#loadingLayer'),
  toast: document.querySelector('#toast'),
};

const chinaDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const chinaTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const chinaWeekdayFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  weekday: 'short',
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sanitizeColor(value, fallback = '#73767e') {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function getChinaParts(date = new Date()) {
  const parts = chinaDateFormatter.formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: chinaWeekdayFormatter.format(date),
  };
}

function dateKey(date = new Date()) {
  const parts = getChinaParts(date);
  return `${parts.year}${parts.month}${parts.day}`;
}

function keyFromIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateKey(date);
}

function dateKeyToParts(key) {
  return {
    year: key.slice(0, 4),
    month: key.slice(4, 6),
    day: key.slice(6, 8),
  };
}

function shiftDateKey(key, offset) {
  const { year, month, day } = dateKeyToParts(key);
  const shifted = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + offset));
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

function formatChineseDate(key, includeYear = false) {
  const { year, month, day } = dateKeyToParts(key);
  return includeYear
    ? `${year}年${Number(month)}月${Number(day)}日`
    : `${Number(month)}月${Number(day)}日`;
}

function formatWeekday(value) {
  const date = typeof value === 'string' && /^\d{8}$/.test(value)
    ? new Date(`${dateKeyToParts(value).year}-${dateKeyToParts(value).month}-${dateKeyToParts(value).day}T12:00:00+08:00`)
    : new Date(value);
  return chinaWeekdayFormatter.format(date);
}

function formatBeijingTime(value, fallback = '--:--') {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : chinaTimeFormatter.format(date);
}

function formatGameDate(value) {
  if (!value) return '比赛时间待定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '比赛时间待定';
  return `北京时间 ${formatChineseDate(keyFromIso(value))} ${formatBeijingTime(value)}`;
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

function teamInfo(team = {}) {
  const id = String(team.id ?? team.teamId ?? '');
  const known = TEAMS[id];
  return {
    id,
    full: known?.full ?? `球队${id || ''}`,
    short: known?.short ?? `球队${id || ''}`,
    color: sanitizeColor(team.color ? `#${String(team.color).replace('#', '')}` : known?.color, known?.color),
    slug: known?.slug ?? team.slug ?? '',
  };
}

function teamsMentionedInText(value) {
  const text = String(value ?? '').toLowerCase();
  return Object.entries(TEAMS)
    .filter(([, team]) => text.includes(team.slug.toLowerCase()))
    .map(([id]) => teamInfo({ id }));
}

function formatRecord(record) {
  if (!record) return '战绩待更新';
  const match = String(record).match(/(\d+)-(\d+)/);
  return match ? `${match[1]}胜${match[2]}负` : '战绩待更新';
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
  return new Map((state.summary?.athletes ?? []).map((athlete) => [String(athlete.id), athlete]));
}

function chineseNameForAthlete(athlete) {
  if (!athlete) return '场上球员';
  const mapped = PLAYER_NAMES[normalizeEnglishName(athlete.name)];
  if (mapped) return mapped.replaceAll('-', '·');
  const team = teamInfo({ id: athlete.teamId });
  return `${team.short}${athlete.jersey ? `${athlete.jersey}号` : ''}球员`;
}

function chineseNameById(id, players = athleteMap()) {
  return chineseNameForAthlete(players.get(String(id)));
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
  const team = teamInfo({
    id: fallbackTeamId,
  });
  return { primary, team };
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
  const { primary, team, name } = playerOrTeam(play, players);
  const type = play.type || '';
  const typeLower = type.toLowerCase();
  const description = play.text || '';
  const ajaxTeam = teamInfo({ id: play.teamId });
  const period = periodName(play.period);
  const game = state.summary?.game;

  if (typeLower.includes('end game')) {
    const away = game?.competitors?.[0];
    const home = game?.competitors?.[1];
    return {
      message: `比赛结束，${teamInfo(away?.team).short} ${away?.score ?? play.awayScore} 比 ${play.homeScore ?? home?.score ?? ''} ${teamInfo(home?.team).short}`,
      tag: '终场',
      accent: '#6d7078',
      important: true,
    };
  }

  if (typeLower.includes('end period')) {
    const away = game?.competitors?.[0];
    const home = game?.competitors?.[1];
    return {
      message: `${period}结束，${teamInfo(away?.team).short} ${play.awayScore} 比 ${play.homeScore} ${teamInfo(home?.team).short}`,
      tag: '节间',
      accent: '#6d7078',
      important: true,
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
      important: false,
    };
  }

  if (typeLower.includes('timeout')) {
    return {
      message: `${ajaxTeam.short}请求暂停`,
      tag: '暂停',
      accent: '#69717f',
      important: true,
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
      important: made,
    };
  }

  if (typeLower.includes('rebound')) {
    const offensive = typeLower.includes('offensive');
    const teamRebound = /team rebound/i.test(description);
    return {
      message: teamRebound
        ? `${ajaxTeam.short}全队${offensive ? '拼下前场篮板' : '保护后场篮板'}`
        : `${name}${offensive ? '抢下前场篮板' : '保护后场篮板'}`,
      tag: offensive ? '前场篮板' : '篮板',
      accent: '#1eaa71',
      important: false,
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
      important: true,
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
      important: Boolean(steal),
    };
  }

  if (typeLower.includes('jumpball')) {
    const match = description.match(/^(.+?)\s+vs\.?\s+(.+?)\s+\((.+?)\s+gains possession\)/i);
    if (match) {
      const first = findAthleteByEnglishName(match[1]);
      const second = findAthleteByEnglishName(match[2]);
      const winner = findAthleteByEnglishName(match[3]);
      return {
        message: `${chineseNameForAthlete(first)}与${chineseNameForAthlete(second)}跳球，${chineseNameForAthlete(winner)}获得球权`,
        tag: '跳球',
        accent: '#69717f',
        important: true,
      };
    }
    return {
      message: `${name}参与跳球`,
      tag: '跳球',
      accent: '#69717f',
      important: true,
    };
  }

  if (
    typeLower.includes('review') ||
    typeLower.includes('challenge')
  ) {
    const overturned = /overturned|successful/i.test(description);
    const challenge = typeLower.includes('coach');
    return {
      message: challenge
        ? `${ajaxTeam.short}教练挑战${overturned ? '成功，原判改判' : '结束，原判维持'}`
        : `裁判回看录像，${overturned ? '判罚改判' : '原判维持'}`,
      tag: '回看',
      accent: '#326ff2',
      important: true,
    };
  }

  if (play.shootingPlay || typeLower.includes('shot') || typeLower.includes('layup')) {
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
      important: made || Boolean(block),
    };
  }

  const genericType = {
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
    'Jumpball': '参与跳球',
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
    'Substitution': '被替换下场',
    'Tip Dunk Shot': '补扣',
    'Tip Shot': '补篮',
    'Traveling': '走步失误',
    'Turnaround Fade Away Jump Shot': '转身后仰跳投',
    'Turnaround Hook Shot': '转身勾手',
    'Turnaround Jump Shot': '转身跳投',
  }[type] ?? '完成一次攻防';

  return {
    message: `${name}${genericType}`,
    tag: typeLower.includes('foul') ? '犯规' : '赛况',
    accent: typeLower.includes('foul') ? '#d14f4f' : '#73767e',
    important: typeLower.includes('foul'),
  };
}

function highlightMap() {
  const map = new Map();
  const videos = state.summary?.videos ?? [];
  const scoringPlays = (state.summary?.plays ?? []).filter(
    (play) => play.scoringPlay && play.wallclock,
  );
  const used = new Set();

  for (const video of videos) {
    if (!video.thumbnail || !video.publishDate) continue;
    const videoTime = new Date(video.publishDate).getTime();
    let best = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (const play of scoringPlays) {
      if (used.has(play.id)) continue;
      const diff = Math.abs(new Date(play.wallclock).getTime() - videoTime);
      if (diff < bestDiff) {
        best = play;
        bestDiff = diff;
      }
    }
    if (best && bestDiff < 6 * 60 * 1000) {
      map.set(best.id, video);
      used.add(best.id);
    }
  }
  return map;
}

function headshotUrl(athlete, width = 220, height = 160) {
  if (!athlete?.id) return '';
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${encodeURIComponent(
    athlete.id,
  )}.png&w=${width}&h=${height}&transparent=true`;
}

function activePlays() {
  return [...(state.summary?.plays ?? [])].sort(
    (a, b) => b.sequence - a.sequence || new Date(b.wallclock) - new Date(a.wallclock),
  );
}

function feedSignature(plays) {
  return [
    state.summary?.game?.id ?? '',
    state.summary?.game?.status?.state ?? '',
    plays.slice(0, 60).map((play) => play.id).join(','),
  ].join('|');
}

function renderFeed(force = false) {
  const plays = activePlays();
  const signature = feedSignature(plays);
  const previousFirst = state.firstFeedId;
  if (!force && signature === state.feedSignature) return;

  const previousScroll = el.feed.scrollTop;
  state.feedSignature = signature;
  state.firstFeedId = plays[0]?.id ?? '';
  el.feed.innerHTML = '';

  if (!plays.length) {
    el.feedEmpty.classList.remove('is-hidden');
    const game = state.summary?.game;
    if (!game) {
      el.emptyTitle.textContent = '暂无比赛动态';
      el.emptyText.textContent = '请选择其他比赛日，或稍后刷新重试。';
    } else if (game.status?.state === 'pre') {
      el.emptyTitle.textContent = '比赛尚未开始';
      el.emptyText.textContent = `${teamInfo(game.competitors?.[0]?.team).short}对阵${
        teamInfo(game.competitors?.[1]?.team).short
      }，${formatGameDate(game.date)}开赛。`;
    } else {
      el.emptyTitle.textContent = '暂无图文动态';
      el.emptyText.textContent = '赛况正在同步，稍后会自动更新。';
    }
    updateContentMeta();
    return;
  }

  el.feedEmpty.classList.add('is-hidden');
  const highlights = highlightMap();
  const players = athleteMap();
  const visiblePlays = plays.slice(0, 100);

  visiblePlays.forEach((play, index) => {
    const localized = localizePlay(play);
    const period = periodName(play.period);
    const contextLabel = /end game/i.test(play.type)
      ? '终场'
      : /end period/i.test(play.type)
        ? `${period}结束`
        : `${period} ${play.clock || ''}`.trim();
    const primary = players.get(String(play.participants?.[0] ?? '')) ?? null;
    const team = primaryPlayContext(play, players).team;
    const video = highlights.get(play.id);
    const imageUrl = safeImageUrl(video?.thumbnail || headshotUrl(primary));
    const visualClass = video ? '' : 'is-headshot';
    const imageAlt = video
      ? `${team.short}比赛高光画面`
      : primary
        ? `${chineseNameForAthlete(primary)}头像`
        : `${team.short}队徽`;

    const item = document.createElement('article');
    item.className = 'feed-item';
    item.style.setProperty('--item-color', team.color);
    item.style.setProperty('--item-accent', localized.accent);
    item.style.animationDelay = `${Math.min(index, 8) * 28}ms`;
    item.innerHTML = `
      <div class="feed-visual ${imageUrl ? '' : 'is-placeholder'}">
        ${
          imageUrl
            ? `<img class="${visualClass}" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" loading="lazy" referrerpolicy="no-referrer" />`
            : `<img src="${escapeHtml(safeImageUrl(teamLogo(team.id)))}" alt="${escapeHtml(
                `${team.short}队徽`,
              )}" loading="lazy" referrerpolicy="no-referrer" />`
        }
        <span class="visual-badge">${video ? '现场' : primary ? '球员' : '球队'}</span>
      </div>
      <div class="feed-copy">
        <div class="feed-item-topline">
          <span class="feed-tag">${escapeHtml(localized.tag)}</span>
          <span class="feed-time">${escapeHtml(formatBeijingTime(play.wallclock, period))}</span>
        </div>
        <p class="feed-message">${escapeHtml(localized.message)}</p>
        <div class="feed-context">
          <strong>${escapeHtml(
            `${teamInfo(state.summary?.game?.competitors?.[0]?.team).short} ${play.awayScore} : ${play.homeScore} ${teamInfo(state.summary?.game?.competitors?.[1]?.team).short}`,
          )}</strong>
          <span class="context-divider"></span>
          <span>${escapeHtml(contextLabel)}</span>
        </div>
      </div>
    `;
    el.feed.append(item);
  });

  el.feed.querySelectorAll('img').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        image.style.visibility = 'hidden';
      },
      { once: true },
    );
  });

  const newestTime = formatBeijingTime(visiblePlays[0]?.wallclock, '--:--');
  updateContentMeta();

  if (
    state.view === 'live' &&
    previousFirst &&
    previousFirst !== state.firstFeedId &&
    previousScroll > 30
  ) {
    el.newPill.classList.remove('is-hidden');
  } else {
    el.newPill.classList.add('is-hidden');
  }
}

function renderPregameFeed() {
  const game = state.summary?.game;
  if (!game) {
    renderFeed(true);
    return;
  }
  el.feed.innerHTML = '';
  el.feedEmpty.classList.remove('is-hidden');
  el.emptyTitle.textContent = '比赛尚未开始';
  el.emptyText.textContent = `${teamInfo(game.competitors?.[0]?.team).short}对阵${
    teamInfo(game.competitors?.[1]?.team).short
  }，${formatGameDate(game.date)}开赛。`;
  el.feedSummary.textContent = '等待比赛开始';
  state.feedSignature = feedSignature([]);
}

function teamLogo(teamId) {
  const code = TEAM_CODES[String(teamId)];
  if (!code) return '';
  return `https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/${code}.png`;
}

function setTeamColor(element, color) {
  element.style.setProperty('--team-color', color);
}

function renderScore(game) {
  if (!game) {
    el.statusText.textContent = '暂无比赛';
    el.statusBadge.className = 'status-badge status-loading';
    el.gameClock.textContent = '请选择其他比赛日';
    return;
  }

  const away = game.competitors?.[0];
  const home = game.competitors?.[1];
  const awayInfo = teamInfo(away?.team);
  const homeInfo = teamInfo(home?.team);
  const status = game.status ?? {};
  const live = status.state === 'in';
  const pre = status.state === 'pre';
  const final = status.state === 'post';

  el.scoreCard.style.setProperty('--team-away', awayInfo.color);
  el.scoreCard.style.setProperty('--team-home', homeInfo.color);
  setTeamColor(el.awayLogo.parentElement, awayInfo.color);
  setTeamColor(el.homeLogo.parentElement, homeInfo.color);

  el.seasonPill.textContent = seasonName(game.seasonType);
  el.gameDate.textContent = formatGameDate(game.date);
  el.awayLogo.src = safeImageUrl(awayInfo && teamLogo(awayInfo.id));
  el.awayLogo.alt = `${awayInfo.short}队徽`;
  el.homeLogo.src = safeImageUrl(teamLogo(homeInfo.id));
  el.homeLogo.alt = `${homeInfo.short}队徽`;
  el.awayName.textContent = awayInfo.short;
  el.homeName.textContent = homeInfo.short;
  el.awayRecord.textContent = formatRecord(away?.record);
  el.homeRecord.textContent = formatRecord(home?.record);
  el.awayScore.textContent = pre ? '–' : (away?.score ?? '–');
  el.homeScore.textContent = pre ? '–' : (home?.score ?? '–');

  el.statusBadge.className = `status-badge ${
    live ? 'status-live' : pre ? 'status-upcoming' : 'status-final'
  }`;
  el.statusText.textContent = live ? '直播中' : pre ? '未开始' : '已结束';

  if (live) {
    el.gameClock.textContent = `${periodName(status.period)} · ${status.clock || '--:--'}`;
  } else if (pre) {
    el.gameClock.textContent = `${formatBeijingTime(game.date)} 开赛`;
  } else {
    el.gameClock.textContent = '终场';
  }

  el.livePulse.classList.toggle('is-live', live);
  el.updateStamp.textContent = live
    ? '正在同步'
    : `北京时间 ${formatBeijingTime(state.summary?.updatedAt || game.date)} 更新`;

  const periods = Math.max(
    away?.linescores?.length ?? 0,
    home?.linescores?.length ?? 0,
    4,
  );
  const hasLinescores = [away, home].some((team) =>
    team?.linescores?.some(
      (line) => line?.value !== undefined && line.value !== '',
    ),
  );
  if (!hasLinescores) {
    el.quarterStrip.innerHTML =
      '<span class="quarter-label">分节数据将在开赛后更新</span>';
    return;
  }

  const periodHeaders = Array.from(
    { length: periods },
    (_, index) =>
      `<span>${index < 4 ? `第${index + 1}节` : `加时${index - 3}`}</span>`,
  ).join('');
  const teamRow = (competitor, info) => {
    const periodCells = Array.from(
      { length: periods },
      (_, index) =>
        `<span>${escapeHtml(
          competitor?.linescores?.[index]?.value ?? '–',
        )}</span>`,
    ).join('');
    return `
      <div class="quarter-team-row">
        <span class="quarter-team">
          <img src="${escapeHtml(
            safeImageUrl(teamLogo(info.id)),
          )}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <b>${escapeHtml(info.short)}</b>
        </span>
        ${periodCells}
        <strong>${escapeHtml(pre ? '–' : competitor?.score ?? '–')}</strong>
      </div>
    `;
  };
  el.quarterStrip.innerHTML = `
    <div class="quarter-table">
      <div class="quarter-table-head">
        <span>球队</span>
        ${periodHeaders}
        <span>总分</span>
      </div>
      ${teamRow(away, awayInfo)}
      ${teamRow(home, homeInfo)}
    </div>
  `;
  el.quarterStrip.querySelectorAll('img').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        image.style.visibility = 'hidden';
      },
      { once: true },
    );
  });
}

function renderDateHeader() {
  const isToday = state.selectedDate === state.today;
  const dateText = formatChineseDate(state.selectedDate);
  const weekday = formatWeekday(state.selectedDate);
  el.scheduleDate.textContent = isToday ? '今天' : dateText;
  el.scheduleWeekday.textContent = isToday
    ? `${dateText} ${weekday} · 北京时间`
    : `${weekday} · 北京时间`;
}

function scheduleStatus(game) {
  if (game.status?.state === 'in') {
    return { text: '直播中', className: 'is-live' };
  }
  if (game.status?.state === 'post') {
    return { text: '已结束', className: 'is-final' };
  }
  return { text: formatBeijingTime(game.date, '待定'), className: 'is-upcoming' };
}

function renderSchedule() {
  renderDateHeader();
  el.scheduleList.innerHTML = '';

  if (!state.events.length) {
    el.scheduleList.innerHTML =
      '<div class="schedule-empty">当日暂无比赛<br />试试前后切换比赛日</div>';
    return;
  }

  const label = document.createElement('div');
  label.className = 'schedule-day-label';
  label.textContent = `共 ${state.events.length} 场比赛`;
  el.scheduleList.append(label);

  for (const game of state.events) {
    const away = game.competitors?.[0];
    const home = game.competitors?.[1];
    const awayInfo = teamInfo(away?.team);
    const homeInfo = teamInfo(home?.team);
    const status = scheduleStatus(game);
    const selected = game.id === state.selectedGameId;
    const pre = game.status?.state === 'pre';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `schedule-game${selected ? ' is-selected' : ''}`;
    button.dataset.gameId = game.id;
    button.setAttribute('aria-current', selected ? 'true' : 'false');
    button.innerHTML = `
      <span class="schedule-teams">
        <span class="schedule-team-row ${away?.winner ? 'is-winner' : game.status?.state === 'post' ? 'is-loser' : ''}">
          <img src="${escapeHtml(safeImageUrl(teamLogo(awayInfo.id)))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHtml(awayInfo.short)}</span>
          <b>${escapeHtml(pre ? '–' : away?.score ?? '–')}</b>
        </span>
        <span class="schedule-team-row ${home?.winner ? 'is-winner' : game.status?.state === 'post' ? 'is-loser' : ''}">
          <img src="${escapeHtml(safeImageUrl(teamLogo(homeInfo.id)))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
          <span>${escapeHtml(homeInfo.short)}</span>
          <b>${escapeHtml(pre ? '–' : home?.score ?? '–')}</b>
        </span>
      </span>
      <span class="schedule-status ${status.className}">${escapeHtml(status.text)}</span>
    `;
    button.title = '选择本场比赛';
    button.addEventListener('click', () => {
      selectGame(game);
    });
    button.querySelectorAll('img').forEach((image) => {
      image.addEventListener('error', () => {
        image.style.visibility = 'hidden';
      }, { once: true });
    });
    el.scheduleList.append(button);
  }
}

function renderStandings() {
  const standings = state.standings;
  const conferences = standings?.conferences ?? [];
  if (!conferences.some((item) => item.key === state.standingsConference)) {
    state.standingsConference = conferences[0]?.key ?? 'east';
  }

  el.standingsTabs.querySelectorAll('[data-conference]').forEach((button) => {
    const active = button.dataset.conference === state.standingsConference;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  el.standingsSeason.textContent = standings?.season
    ? `${standings.season} 常规赛`
    : '东西部排名';

  if (state.standingsStatus === 'loading' && !conferences.length) {
    el.standingsList.innerHTML = Array.from(
      { length: 7 },
      (_, index) => `
        <div class="standings-row standings-row-skeleton" aria-hidden="true">
          <span class="skeleton" style="width:15px;height:11px"></span>
          <span class="standings-team">
            <span class="skeleton" style="width:18px;height:18px;border-radius:50%"></span>
            <span class="skeleton" style="width:${index % 2 ? 60 : 72}%;height:11px"></span>
          </span>
          <span class="skeleton" style="width:25px;height:11px"></span>
          <span class="skeleton" style="width:28px;height:11px"></span>
          <span class="skeleton" style="width:18px;height:11px"></span>
        </div>
      `,
    ).join('');
    el.standingsEmpty.classList.add('is-hidden');
    return;
  }

  const conference = conferences.find(
    (item) => item.key === state.standingsConference,
  );
  if (!conference?.teams?.length) {
    el.standingsList.innerHTML = '';
    el.standingsEmpty.textContent =
      state.standingsStatus === 'error'
        ? '排名加载失败，请稍后重试'
        : '排名暂时不可用';
    el.standingsEmpty.classList.remove('is-hidden');
    return;
  }

  el.standingsEmpty.classList.add('is-hidden');
  el.standingsList.innerHTML = conference.teams
    .map((entry, index) => {
      const info = teamInfo(entry.team);
      const logo = entry.team.logo || teamLogo(info.id);
      const rank = entry.rank || index + 1;
      const winPercent = Number.isFinite(entry.winPercent)
        ? `${(entry.winPercent * 100).toFixed(1)}%`
        : '-';
      const gamesBehind = entry.gamesBehind === '0' ||
        entry.gamesBehind === '0.0'
        ? '-'
        : entry.gamesBehind || '-';
      return `
        <article class="standings-row${rank <= 6 ? ' is-playoff' : ''}">
          <span class="standings-rank">${escapeHtml(rank)}</span>
          <span class="standings-team">
            <img
              src="${escapeHtml(safeImageUrl(logo))}"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <strong>${escapeHtml(info.short)}</strong>
            <small>${escapeHtml(entry.streak || '')}</small>
          </span>
          <b>${escapeHtml(`${entry.wins}-${entry.losses}`)}</b>
          <span>${escapeHtml(winPercent)}</span>
          <span>${escapeHtml(gamesBehind)}</span>
        </article>
      `;
    })
    .join('');

  el.standingsList.querySelectorAll('img').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        image.style.visibility = 'hidden';
      },
      { once: true },
    );
  });
}

async function loadStandings() {
  if (!window.nbaDesktop?.getStandings) return;
  state.standingsStatus = 'loading';
  renderStandings();
  try {
    state.standings = await window.nbaDesktop.getStandings();
    state.standingsStatus = 'ready';
  } catch (error) {
    console.error('球队排名加载失败', error);
    state.standingsStatus = 'error';
  }
  renderStandings();
}

function playerPosition(position) {
  return (
    {
      PG: '控卫',
      SG: '分卫',
      SF: '小前',
      PF: '大前',
      C: '中锋',
      G: '后卫',
      F: '前锋',
    }[String(position ?? '').toUpperCase()] ?? '球员'
  );
}

function renderPlayerStats() {
  const summaryGame = state.summary?.game;
  const scheduledGame = state.events.find(
    (game) => game.id === state.selectedGameId,
  );
  const game = summaryGame?.id === state.selectedGameId
    ? { ...scheduledGame, ...summaryGame }
    : scheduledGame;
  const teams = (game?.competitors ?? []).slice(0, 2).map((competitor) => ({
    competitor,
    info: teamInfo(competitor.team),
  }));

  if (!teams.length) {
    el.playerTeamTabs.innerHTML = '';
    el.playerStatsList.innerHTML = '';
    el.playerStatsTitle.textContent = '本场表现';
    el.playerStatsUpdated.textContent = '等待比赛';
    el.playerStatsEmpty.classList.remove('is-hidden');
    updateContentMeta();
    return;
  }

  if (!teams.some((team) => team.info.id === state.playerTeamId)) {
    state.playerTeamId = teams[0].info.id;
  }
  const selectedTeam =
    teams.find((team) => team.info.id === state.playerTeamId) ?? teams[0];
  const athletes = state.summary?.game?.id === state.selectedGameId
    ? state.summary.athletes ?? []
    : [];
  const teamAthletes = athletes.filter(
    (athlete) => String(athlete.teamId) === selectedTeam.info.id,
  );
  const activeAthletes = teamAthletes.filter(
    (athlete) => Number(athlete.stats?.minutes ?? 0) > 0,
  );
  const candidates = activeAthletes.length
    ? activeAthletes
    : teamAthletes;
  const players = candidates
    .slice()
    .sort((a, b) => {
      const minutesDiff =
        Number(b.stats?.minutes ?? 0) - Number(a.stats?.minutes ?? 0);
      if (minutesDiff) return minutesDiff;
      return Number(b.stats?.points ?? 0) - Number(a.stats?.points ?? 0);
    })
    .slice(0, 8);

  el.playerTeamTabs.innerHTML = teams
    .map(
      ({ info }) => `
        <button
          class="player-team-tab${info.id === selectedTeam.info.id ? ' is-active' : ''}"
          type="button"
          data-team-id="${escapeHtml(info.id)}"
          style="--tab-color:${escapeHtml(info.color)}"
        >
          <img src="${escapeHtml(safeImageUrl(teamLogo(info.id)))}" alt="" referrerpolicy="no-referrer" />
          <span>${escapeHtml(info.short)}</span>
        </button>
      `,
    )
    .join('');
  el.playerStatsTitle.textContent = `${selectedTeam.info.short}球员`;
  el.playerStatsUpdated.textContent =
    game.status?.state === 'in'
      ? '实时更新'
      : state.summary?.updatedAt
        ? `${formatBeijingTime(state.summary.updatedAt)} 更新`
        : '等待数据';

  if (!players.length) {
    el.playerStatsList.innerHTML = '';
    el.playerStatsEmpty.textContent =
      game.status?.state === 'pre' ? '开赛后更新球员数据' : '暂无球员数据';
    el.playerStatsEmpty.classList.remove('is-hidden');
    updateContentMeta();
    return;
  }

  el.playerStatsEmpty.classList.add('is-hidden');
  el.playerStatsList.innerHTML = players
    .map((player) => {
      const name = chineseNameForAthlete(player);
      const headshot = safeImageUrl(
        `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${encodeURIComponent(
          player.id,
        )}.png&w=160&h=160&transparent=true`,
      );
      const plusMinus = String(player.stats?.plusMinus ?? '0');
      const plusMinusClass = plusMinus.startsWith('+')
        ? ' is-positive'
        : plusMinus.startsWith('-') && plusMinus !== '-0'
          ? ' is-negative'
          : '';
      const identity = [
        playerPosition(player.position),
        player.jersey ? `${player.jersey}号` : '',
      ].filter(Boolean).join(' · ');
      return `
        <article class="player-stat-row" style="--row-team:${escapeHtml(selectedTeam.info.color)}">
          <span class="player-stat-person">
            <span class="player-stat-avatar">
              <span>${escapeHtml(name.slice(0, 1))}</span>
              <img src="${escapeHtml(headshot)}" alt="" loading="lazy" referrerpolicy="no-referrer" />
            </span>
            <span class="player-stat-copy">
              <strong>${escapeHtml(name)}</strong>
              <small>${escapeHtml(identity || '本场球员')}</small>
            </span>
          </span>
          <span class="player-stat-value">${escapeHtml(player.stats?.minutes ?? '0')}</span>
          <span class="player-stat-value is-primary">${escapeHtml(player.stats?.points ?? '0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.rebounds ?? '0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.assists ?? '0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.steals ?? '0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.blocks ?? '0')}</span>
          <span class="player-stat-value is-shooting">${escapeHtml(player.stats?.fieldGoals ?? '0-0')}</span>
          <span class="player-stat-value is-shooting">${escapeHtml(player.stats?.threePointers ?? '0-0')}</span>
          <span class="player-stat-value is-shooting">${escapeHtml(player.stats?.freeThrows ?? '0-0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.turnovers ?? '0')}</span>
          <span class="player-stat-value">${escapeHtml(player.stats?.fouls ?? '0')}</span>
          <span class="player-stat-value is-plus-minus${plusMinusClass}">${escapeHtml(plusMinus)}</span>
        </article>
      `;
    })
    .join('');

  el.playerStatsList.querySelectorAll('img').forEach((image) => {
    image.addEventListener(
      'load',
      () => image.previousElementSibling?.classList.add('is-hidden'),
      { once: true },
    );
    image.addEventListener(
      'error',
      () => {
        image.style.visibility = 'hidden';
      },
      { once: true },
    );
  });
  updateContentMeta();
}

function currentContentTeams() {
  const game =
    state.summary?.game ??
    state.events.find((item) => item.id === state.selectedGameId);
  return (game?.competitors ?? []).slice(0, 2).map((competitor) => ({
    competitor,
    info: teamInfo(competitor.team),
  }));
}

function readNewsNumber(text, pattern) {
  return text.match(pattern)?.[1] ?? '';
}

function extractNewsFacts(article = {}) {
  const text = `${article.headline ?? ''} ${article.description ?? ''}`;
  const scorePatterns = [
    /(?:win over|victory over|beat|defeat|fend off|held off|holds off|hammered|routed)\D{0,90}?(\d{2,3})\s*[-–]\s*(\d{2,3})/i,
    /(?:\bto win|\bwon|\bfinal)\D{0,24}?(\d{2,3})\s*[-–]\s*(\d{2,3})/i,
    /(\d{2,3})\s*[-–]\s*(\d{2,3})\s+(?:win|victory)/i,
  ];
  const score = scorePatterns
    .map((pattern) => text.match(pattern))
    .find(Boolean);
  const teamName = String(article.teamName ?? '');
  const escapedTeamName = teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const record = escapedTeamName
    ? text.match(
        new RegExp(
          `${escapedTeamName}\\s*\\((\\d+)\\s*[-–]\\s*(\\d+),`,
          'i',
        ),
      )
    : null;
  const run = text.match(/\b(\d{1,3})\s*[-–]\s*(\d{1,3})\s+run\b/i);
  const deficit = text.match(
    /from\s+(?:down\s+)?(\d{1,3})\s+(?:down|points?\s+down)/i,
  );

  return {
    points: readNewsNumber(
      text,
      /(?:scored|scores|has|had|with|pours? in|drops?|dropping)\s+(\d{1,3})\s+points?/i,
    ) || readNewsNumber(text, /(\d{1,3})-point/i),
    rebounds: readNewsNumber(text, /\b(\d{1,3})\s+rebounds?\b/i),
    assists: readNewsNumber(text, /\b(\d{1,3})\s+assists?\b/i),
    threes: readNewsNumber(
      text,
      /\b(\d{1,3})\s+(?:3-pointers?|three-pointers?|3s)\b/i,
    ),
    steals: readNewsNumber(text, /\b(\d{1,3})\s+steals?\b/i),
    blocks: readNewsNumber(text, /\b(\d{1,3})\s+blocks?\b/i),
    score: score ? `${Number(score[1])}比${Number(score[2])}` : '',
    record:
      record ? `${Number(record[1])}胜${Number(record[2])}负` : '',
    run: run ? `${Number(run[1])}比${Number(run[2])}` : '',
    deficit: deficit ? String(Number(deficit[1])) : '',
    seasonHigh: /season[- ]high/i.test(text),
  };
}

function newsTypeLabel(article = {}) {
  return (
    {
      HeadlineNews: '快讯',
      Recap: '战报',
      Preview: '前瞻',
      Media: '集锦',
      Story: '深度',
    }[article.type] ?? '动态'
  );
}

function newsBrief(article, teamId) {
  const team = teamInfo({ id: teamId });
  const text = `${article.headline ?? ''} ${article.description ?? ''}`;
  const player = findKnownPlayerInNews(text);
  const actor = player || '球队核心';
  const facts = extractNewsFacts(article);
  const statParts = [
    facts.points ? `${facts.points}分` : '',
    facts.rebounds ? `${facts.rebounds}篮板` : '',
    facts.assists ? `${facts.assists}助攻` : '',
    facts.threes ? `${facts.threes}记三分` : '',
    facts.steals ? `${facts.steals}抢断` : '',
    facts.blocks ? `${facts.blocks}盖帽` : '',
  ].filter(Boolean);

  if (/injur|sidelin|out for|day-to-day|return from/i.test(text)) {
    return `${player || team.short}进入伤病观察，球队将更新出场状态与轮换安排。`;
  }

  if (/beef|drama|relationship|former teammate/i.test(text)) {
    return `围绕${team.short}球员关系与更衣室氛围的话题持续发酵，相关球员已经作出回应。`;
  }

  if (/trade|acquire|deal|contract|extension|waive|release|roster/i.test(text)) {
    return `${team.short}近期推进阵容调整，人员变化、合同情况与轮换影响值得关注。`;
  }

  if (/coach|fired|hire|front office/i.test(text)) {
    return `${team.short}教练组与管理层出现最新动态，后续安排将影响球队赛季计划。`;
  }

  if (
    article.type === 'Preview' ||
    /preview|hosts|travels to|takes on|plays? .*conference|conference foe|keys to|what to watch/i.test(
      text,
    )
  ) {
    return `${team.short}赛前简报：${
      facts.record ? `目前战绩${facts.record}，` : ''
    }球队正为下一场比赛完成备战，首发、轮换与关键对位是主要看点。`;
  }

  if (/highlight|media|video|clip/i.test(text) || article.type === 'Media') {
    return `本场关键回合与高光镜头已更新，可查看${team.short}原始比赛集锦。`;
  }

  if (/odds|championship and mvp|title odds/i.test(text)) {
    return `联盟更新赛季赔率，${team.short}的争冠前景与球员奖项竞争力进入讨论。`;
  }

  if (statParts.length) {
    if (/rall|comeback|implode|late run|run caps|erased|erases/i.test(text)) {
      if (/implode|collapse/i.test(text)) {
        return `${team.short}末段出现明显崩盘，${
          facts.score ? `最终以${facts.score}结束` : '比赛结果被逆转'
        }。${facts.run ? `对手在关键阶段打出${facts.run}攻势。` : ''}${actor}贡献${statParts.join('、')}。`;
      }
      return `${team.short}${
        facts.deficit ? `一度落后${facts.deficit}分，` : '比赛末段出现明显反转，'
      }${facts.score ? `最终以${facts.score}结束` : '最终结果发生逆转'}。${
        facts.run ? `关键阶段出现${facts.run}的比分攻势。` : ''
      }${actor}贡献${statParts.join('、')}。${
        /boo|fans?/i.test(text) ? '赛后球员也回应了主场球迷情绪。' : ''
      }`;
    }
    return `${actor}贡献${statParts.join('、')}${
      facts.seasonHigh ? '，刷新赛季单场新高' : ''
    }${facts.score ? `，比赛以${facts.score}结束` : ''}。`;
  }

  if (/rall|comeback|implode|late run|run caps|erased|erases/i.test(text)) {
    if (/implode|collapse/i.test(text)) {
      return `${team.short}末段出现明显崩盘，${
        facts.score ? `最终以${facts.score}结束` : '比赛结果被逆转'
      }。${facts.run ? `对手在关键阶段打出${facts.run}攻势。` : ''}`;
    }
    return `${team.short}${
      facts.deficit ? `一度落后${facts.deficit}分，` : '比赛末段出现明显反转，'
    }${facts.score ? `最终以${facts.score}结束` : '最终结果发生逆转'}。${
      facts.run ? `关键阶段出现${facts.run}的比分攻势。` : ''
    }`;
  }

  if (/fans? show love|in return|homecoming|tribute|welcome back/i.test(text)) {
    return `${player || team.short}的回归与球迷互动成为焦点，现场反响热烈。`;
  }

  if (/winless|without a win|still seeking/i.test(text)) {
    return `${team.short}开季仍在寻找首胜，球队急需改善攻防效率与关键回合执行。`;
  }

  if (/debut|first game|opening night/i.test(text)) {
    return `${team.short}完成新赛季亮相，新援磨合、核心状态与轮换次序成为观察重点。`;
  }

  if (article.type === 'Recap') {
    return `${team.short}近期比赛已经结束，球队表现、关键回合与轮换数据成为赛后焦点。`;
  }

  return `报道聚焦${team.short}近期表现、阵容轮换和赛季走势，可查看原文了解完整内容。`;
}

function findKnownPlayerInNews(headline) {
  const lower = String(headline ?? '').toLowerCase();
  const athlete = (state.summary?.athletes ?? [])
    .slice()
    .sort((a, b) => b.name.length - a.name.length)
    .find((player) => lower.includes(String(player.name).toLowerCase()));
  if (athlete) return chineseNameForAthlete(athlete);

  const normalized = normalizeEnglishName(headline);
  const match = PLAYER_NAME_KEYS.map(([key, name]) => ({
    key,
    name,
    index: normalized.indexOf(key),
  }))
    .filter((entry) => entry.index >= 0)
    .sort(
      (left, right) =>
        left.index - right.index || right.key.length - left.key.length,
    )[0];
  return match ? match.name.replaceAll('-', '·') : '';
}

function localizeNewsHeadline(article, teamId) {
  const teams = currentContentTeams();
  const team = teamInfo({ id: teamId });
  const opponent =
    teams.find((item) => item.info.id !== String(teamId))?.info ?? null;
  const headline = String(article.headline ?? '').trim();
  const description = String(article.description ?? '');
  const player = findKnownPlayerInNews(`${headline} ${description}`);
  const mentionedTeams = teamsMentionedInText(headline);
  const mentionedOpponent =
    mentionedTeams.find((item) => item.id !== team.id) ?? null;
  const opponentName = mentionedOpponent?.short ?? opponent?.short ?? '对手';
  const facts = extractNewsFacts(article);
  const actor = player || '球队核心';
  const titleStats = [
    facts.points ? `${facts.points}分` : '',
    facts.rebounds ? `${facts.rebounds}篮板` : '',
    facts.assists ? `${facts.assists}助攻` : '',
  ]
    .filter(Boolean)
    .join('、');

  if (!headline) return `${team.short}最新动态`;

  if (/game highlights?|highlights?$/i.test(headline)) {
    return `${team.short}比赛集锦：关键回合与高光镜头`;
  }

  if (/father-son duos|most points/i.test(headline)) {
    return 'NBA父子组合得分榜：历史高分组合盘点';
  }

  if (/power rankings?/i.test(headline)) {
    return 'NBA最新实力榜：联盟格局更新';
  }

  if (/odds|championship and mvp|title odds/i.test(headline)) {
    return `${team.short}赛季赔率更新：争冠与个人奖项受关注`;
  }

  if (/beef|drama|relationship|former teammate/i.test(headline)) {
    return `${
      player ? `${player}相关表态` : '球员关系话题'
    }：${team.short}更衣室动态受关注`;
  }

  if (/how .* became|iso king|summer practice|career year/i.test(headline)) {
    return `${player || '球员'}成长观察：${team.short}轮换角色持续进化`;
  }

  if (/rall|comeback|implode|late run|run caps|erased|erases/i.test(headline)) {
    const updateLabel =
      article.type === 'Recap' || article.type === 'Story' ? '战报' : '快讯';
    if (/implode|collapse/i.test(headline)) {
      return `${team.short}${updateLabel}：末段崩盘，遭${
        facts.run ? `${facts.run}攻势` : '对手逆转'
      }`;
    }
    return `${team.short}${updateLabel}：${
      facts.deficit ? `${facts.deficit}分逆转` : '末段完成逆转'
    }${player ? `，${player}领衔` : ''}`;
  }

  if (
    /hosts|visits|travels to|takes on|plays? .*following|conference matchup|conference foe|conference showdown/i.test(
      headline,
    )
  ) {
    const location = /hosts/i.test(headline)
      ? '主场'
      : /visits|travels to/i.test(headline)
        ? '客场'
        : '赛前';
    return `${team.short}${location}前瞻：${
      /following/i.test(headline) && facts.points
        ? `关注${actor}近期状态`
        : '轮换与关键对位成看点'
    }`;
  }

  if (/fans? show love|in return|homecoming|tribute/i.test(headline)) {
    return `${player || '功勋球员'}回归${team.short}，球迷现场致意`;
  }

  if (/season debuts|opening week debuts/i.test(headline)) {
    return `${team.short}赛季首秀盘点：新援与核心轮换亮相`;
  }

  const result = headline.match(
    /(\d{1,3})\s*[-–]\s*(\d{1,3})\s+win\s+over\s+(?:the\s+)?(.+?)(?:\.|$)/i,
  );
  const resultLead = headline.match(
    /lead(?:s|ing)?\s+(?:the\s+)?([a-z .]+?)\s+to\s+a\s+(\d{1,3})\s*[-–]\s*(\d{1,3})\s+win\s+over\s+(?:the\s+)?([a-z .]+?)(?:\.|$)/i,
  );
  const points = facts.points;
  const assists = facts.assists;

  if (/following/i.test(headline) && points) {
    return `${team.short}赛前前瞻：关注${actor}近期火热状态与下一场对位`;
  }

  if (/season[- ]high/i.test(headline) && points) {
    return `${team.short}新闻简报：${actor}砍下赛季新高${points}分${
      assists ? `、${assists}次助攻` : ''
    }`;
  }

  if (resultLead && points) {
    const winner =
      mentionedTeams.find((item) =>
        resultLead[1].toLowerCase().includes(item.slug.toLowerCase()),
      ) ??
      mentionedTeams.find((item) => item.id !== team.id) ??
      team;
    const loser =
      mentionedTeams.find((item) => item.id !== winner.id) ??
      (opponent?.id !== winner.id ? opponent : null);
    return `${actor}砍下${points}分，率领${winner.short}以${resultLead[2]}比${resultLead[3]}击败${loser?.short ?? opponentName}`;
  }

  if (result && points) {
    return `${team.short}战报：${actor}砍下${points}分，本场比分${result[1]}比${result[2]}`;
  }

  if (facts.score || titleStats) {
    if (facts.score && article.type !== 'HeadlineNews') {
      return `${team.short}战报：本场比分${facts.score}，比赛进程回顾`;
    }
    return `${team.short}${
      article.type === 'HeadlineNews' ? '快讯' : '比赛观察'
    }：${actor}${titleStats || '比赛数据'}受到关注`;
  }

  if (/plays?\s+the\s+/i.test(headline)) {
    const streak = headline.match(
      /(\d+)(?:st|nd|rd|th)\s+straight win/i,
    )?.[1];
    return `${team.short}赛前前瞻：对阵${opponentName}${
      streak ? `，冲击${streak}连胜` : '，球队公布最新备战情况'
    }`;
  }

  if (/injur|sidelin|out for|day-to-day|return from/i.test(headline)) {
    return `${team.short}伤病动态：${player || '球队'}最新伤情与出场状态更新`;
  }

  if (/trade|acquire|deal|market/i.test(headline)) {
    return `${team.short}交易动态：球队最新人员流动消息`;
  }

  if (/sign|contract|extension/i.test(headline)) {
    return `${team.short}签约动态：球队完成最新阵容调整`;
  }

  if (/waive|release|roster|option/i.test(headline)) {
    return `${team.short}阵容动态：球队更新轮换与名单`;
  }

  if (/coach|fired|hire/i.test(headline)) {
    return `${team.short}教练组动态：球队公布最新人事消息`;
  }

  if (/record|milestone|history|most\b/i.test(headline)) {
    return `${team.short}里程碑：${player || '球队'}迎来新的数据节点`;
  }

  if (/preview|what to watch|keys to/i.test(headline)) {
    return `${team.short}赛前观察：对阵${opponentName}的关键看点`;
  }

  if (article.type === 'HeadlineNews') {
    return `${team.short}快讯：${player ? `${player}最新消息公布` : '球队最新消息公布'}`;
  }
  if (article.type === 'Recap') {
    return `${team.short}战报：近期比赛结果与关键数据更新`;
  }
  if (article.type === 'Preview') {
    return `${team.short}赛前前瞻：下一场对位与轮换观察`;
  }
  if (article.type === 'Media') {
    return `${team.short}比赛集锦：关键回合已更新`;
  }
  return `${team.short}深度观察：阵容轮换与赛季走势`;
}

function formatNewsPublished(value) {
  if (!value) return '近日';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '近日';
  const today = keyFromIso(new Date().toISOString());
  const day = keyFromIso(value);
  return day === today
    ? `今天 ${formatBeijingTime(value)}`
    : `${formatChineseDate(day)} ${formatBeijingTime(value)}`;
}

function renderNews() {
  const teams = currentContentTeams();
  el.newsGrid.innerHTML = '';

  if (!teams.length) {
    el.newsEmpty.classList.remove('is-hidden');
    updateContentMeta();
    return;
  }

  el.newsEmpty.classList.add('is-hidden');
  el.newsGrid.innerHTML = teams
    .map(({ info, competitor }) => {
      const teamNews =
        state.news.find((entry) => String(entry.teamId) === info.id)?.articles ??
        [];
      const loading = state.newsStatus === 'loading' && !teamNews.length;
      const cards = loading
        ? Array.from(
            { length: 4 },
            () => `
              <div class="news-card news-card-skeleton" aria-hidden="true">
                <span class="skeleton news-brief-tag-skeleton"></span>
                <span class="skeleton news-brief-title-skeleton"></span>
                <span class="skeleton news-brief-copy-skeleton"></span>
                <span class="skeleton news-brief-meta-skeleton"></span>
              </div>
            `,
          ).join('')
        : teamNews.length
          ? teamNews
              .slice(0, 4)
              .map((article) => {
                const link = safeImageUrl(article.webUrl);
                const title = localizeNewsHeadline(article, info.id);
                const brief = newsBrief(article, info.id);
                const tag = link ? 'a' : 'article';
                const linkAttributes = link
                  ? `href="${escapeHtml(link)}" target="_blank" rel="noreferrer"`
                  : '';
                return `
                  <${tag}
                    class="news-card news-brief"
                    ${linkAttributes}
                    title="${escapeHtml(title)}"
                  >
                    <span class="news-brief-head">
                      <b class="news-brief-tag">${escapeHtml(
                        newsTypeLabel(article),
                      )}</b>
                      <small>${escapeHtml(
                        formatNewsPublished(article.published),
                      )}</small>
                    </span>
                    <strong>${escapeHtml(title)}</strong>
                    <span class="news-brief-summary">${escapeHtml(brief)}</span>
                    <span class="news-brief-footer">
                      <span>ESPN</span>
                      <span>${link ? '查看原文' : '球队简报'}</span>
                    </span>
                  </${tag}>
                `;
              })
              .join('')
          : `
              <div class="news-column-empty">
                新闻服务暂时没有返回${info.short}的报道简报
              </div>
            `;

      return `
        <section class="news-team-column" style="--news-team:${escapeHtml(info.color)}">
          <header class="news-team-header">
            <img
              src="${escapeHtml(safeImageUrl(teamLogo(info.id)))}"
              alt=""
              referrerpolicy="no-referrer"
            />
            <span>
              <strong>${escapeHtml(info.short)}</strong>
              <small>${escapeHtml(info.full)} · 近期报道</small>
            </span>
            <b>${escapeHtml(
              state.summary?.game?.status?.state === 'pre'
                ? '–'
                : competitor.score ?? '–',
            )}</b>
          </header>
          <div class="news-list">${cards}</div>
        </section>
      `;
    })
    .join('');

  el.newsGrid.querySelectorAll('img').forEach((image) => {
    image.addEventListener(
      'error',
      () => {
        image.style.visibility = 'hidden';
      },
      { once: true },
    );
  });
  updateContentMeta();
}

function updateContentMeta() {
  if (state.view === 'live') {
    const plays = activePlays();
    if (!plays.length) {
      el.feedSummary.textContent = '暂无动态';
      return;
    }
    const newestTime = formatBeijingTime(plays[0]?.wallclock, '--:--');
    el.feedSummary.textContent = `最近 ${Math.min(
      plays.length,
      100,
    )} 条动态 · ${newestTime} 更新`;
    return;
  }

  if (state.view === 'stats') {
    el.feedSummary.textContent = `实时球员数据 · ${
      el.playerStatsUpdated.textContent || '等待更新'
    }`;
    return;
  }

  const count = state.news.reduce(
    (total, entry) => total + Math.min(entry.articles?.length ?? 0, 4),
    0,
  );
  if (state.newsStatus === 'loading' && !count) {
    el.feedSummary.textContent = '正在加载双方球队新闻简报';
    return;
  }
  el.feedSummary.textContent = count
    ? `双方球队简报 · ${count} 条 · ${formatBeijingTime(
        state.newsUpdatedAt,
        '刚刚',
      )} 更新`
    : '双方球队新闻简报暂未更新';
}

function setContentView(view, options = {}) {
  if (!['live', 'stats', 'news'].includes(view)) return;
  state.view = view;
  const headings = {
    live: ['比赛现场', '图文直播'],
    stats: ['比赛数据', '实时统计'],
    news: ['球队动态', '新闻简报'],
  };
  el.contentKicker.textContent = headings[view][0];
  el.contentTitle.textContent = headings[view][1];
  el.feedTabs.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  [
    ['live', el.liveView],
    ['stats', el.statsView],
    ['news', el.newsView],
  ].forEach(([name, element]) => {
    const active = name === view;
    element.classList.toggle('is-active', active);
    element.setAttribute('aria-hidden', String(!active));
  });

  if (view === 'live') {
    renderFeed(true);
    el.newPill.classList.add('is-hidden');
    if (options.scrollTop) el.feed.scrollTop = 0;
  }
  if (view === 'stats') {
    renderPlayerStats();
    if (options.scrollTop) el.playerStatsList.scrollTop = 0;
  }
  if (view === 'news') {
    renderNews();
    if (options.scrollTop) el.newsGrid.scrollTop = 0;
  }
  updateContentMeta();
}

function allGamesFinished() {
  return (
    state.events.length > 0 &&
    state.events.every((game) => game.status?.state === 'post')
  );
}

function syncScheduledGameStatus(game) {
  if (!game?.id || !game.status?.state) return;
  const scheduled = state.events.find((item) => item.id === game.id);
  if (!scheduled) return;
  scheduled.status = {
    ...scheduled.status,
    ...game.status,
  };
}

function refreshModeText() {
  const finished = allGamesFinished();
  const live = state.summary?.game?.status?.state === 'in';
  if (!state.autoRefresh) {
    el.refreshMode.innerHTML = '<span class="refresh-dot"></span>自动刷新已暂停';
    el.connectionTitle.textContent = '自动刷新已暂停';
    el.connectionText.textContent = '点击右侧开关恢复同步';
  } else if (finished) {
    el.refreshMode.innerHTML = '<span class="refresh-dot"></span>仅同步新闻';
    el.connectionTitle.textContent = '赛况已结束';
    el.connectionText.textContent = '全部比赛已结束，每 60 秒更新球队新闻';
  } else {
    el.refreshMode.innerHTML = '<span class="refresh-dot"></span>自动刷新';
    el.connectionTitle.textContent = live ? '直播持续同步' : '赛况自动同步';
    el.connectionText.textContent = live
      ? '比赛进行中，每 3 秒同步'
      : '每 60 秒检查一次赛况';
  }
}

async function loadTeamNews(game, token = state.loadToken) {
  const teams = (game?.competitors ?? []).slice(0, 2);
  const teamIds = teams
    .map((competitor) => String(competitor.team?.id ?? ''))
    .filter((teamId) => /^\d+$/.test(teamId));
  if (!teamIds.length) {
    state.news = [];
    state.newsStatus = 'error';
    state.newsUpdatedAt = '';
    state.newsTeamKey = '';
    state.newsFetchedAt = 0;
    if (state.view === 'news') renderNews();
    return;
  }

  state.newsTeamKey = [...teamIds].sort().join(',');
  state.newsFetchedAt = Date.now();
  state.newsStatus = state.news.length ? 'ready' : 'loading';
  if (state.view === 'news') renderNews();

  try {
    const response = await window.nbaDesktop.getTeamNews(teamIds);
    if (token !== state.loadToken) return;
    state.news = response.teams ?? [];
    state.newsUpdatedAt = response.updatedAt ?? '';
    state.newsStatus = 'ready';
  } catch (error) {
    if (token !== state.loadToken) return;
    console.error('球队新闻加载失败', error);
    const fallback = state.summary?.news ?? [];
    state.news = teamIds.map((teamId) => ({
      teamId,
      articles: fallback,
    }));
    state.newsStatus = 'error';
    state.newsUpdatedAt = state.summary?.updatedAt ?? '';
  }

  if (state.view === 'news') renderNews();
  else updateContentMeta();
}

async function refreshNewsOnly(manual = false) {
  const game =
    state.summary?.game ??
    state.events.find((item) => item.id === state.selectedGameId);
  if (!game) return;
  await loadTeamNews(game, state.loadToken);
  if (manual) showToast('新闻已刷新');
}

async function fetchChinaDateEvents(selectedDate) {
  const dates = [
    shiftDateKey(selectedDate, -1),
    selectedDate,
    shiftDateKey(selectedDate, 1),
  ];
  const responses = await Promise.allSettled(
    dates.map((date) => window.nbaDesktop.getScoreboard(date)),
  );
  const successful = responses.filter((response) => response.status === 'fulfilled');
  if (!successful.length) {
    throw responses[0]?.reason ?? new Error('无法连接赛事数据');
  }

  const byId = new Map();
  for (const response of successful) {
    for (const game of response.value.events ?? []) {
      if (keyFromIso(game.date) === selectedDate) {
        byId.set(game.id, game);
      }
    }
  }
  return [...byId.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function chooseBestGame(events) {
  if (!events.length) return null;
  const now = Date.now();
  const live = events.find((game) => game.status?.state === 'in');
  if (live) return live;

  const upcoming = events
    .filter((game) => game.status?.state === 'pre')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const finals = events
    .filter((game) => game.status?.state === 'post')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (upcoming.length && new Date(upcoming[0].date).getTime() - now < 4 * 60 * 60 * 1000) {
    return upcoming[0];
  }
  return finals[0] ?? upcoming[0] ?? events[0];
}

function showScheduleLoading() {
  el.scheduleList.innerHTML = Array.from(
    { length: 5 },
    (_, index) => `
      <div class="schedule-game" aria-hidden="true">
        <span class="schedule-teams">
          <span class="skeleton" style="height:18px;width:${78 - index * 4}%"></span>
          <span class="skeleton" style="height:18px;width:${70 + index * 3}%"></span>
        </span>
        <span class="skeleton" style="height:12px;width:33px"></span>
      </div>
    `,
  ).join('');
}

function showFeedLoading() {
  el.feedEmpty.classList.add('is-hidden');
  el.feed.innerHTML = Array.from(
    { length: 3 },
    () => `
      <div class="feed-item" aria-hidden="true">
        <div class="skeleton" style="min-height:72px"></div>
        <div class="feed-copy">
          <span class="skeleton" style="height:13px;width:25%;margin-bottom:8px"></span>
          <span class="skeleton" style="height:14px;width:92%;margin-bottom:6px"></span>
          <span class="skeleton" style="height:14px;width:63%"></span>
        </div>
      </div>
    `,
  ).join('');
}

async function selectGame(game) {
  if (!game) return;
  state.selectedGameId = game.id;
  state.playerTeamId = '';
  state.summary = null;
  state.feedSignature = '';
  state.news = [];
  state.newsStatus = 'loading';
  state.newsUpdatedAt = '';
  state.newsTeamKey = '';
  state.newsFetchedAt = 0;
  renderScore(game);
  renderSchedule();
  renderPlayerStats();
  renderNews();
  showFeedLoading();
  updateContentMeta();

  const token = ++state.loadToken;
  try {
    const summary = await window.nbaDesktop.getSummary(game.id);
    if (token !== state.loadToken) return;
    state.summary = summary;
    const mergedGame = {
      ...game,
      ...summary.game,
      competitors: summary.game?.competitors?.length
        ? summary.game.competitors
        : game.competitors,
    };
    state.summary.game = mergedGame;
    syncScheduledGameStatus(mergedGame);
    renderScore(mergedGame);
    renderPlayerStats();
    renderFeed(true);
    loadTeamNews(mergedGame, token);
    refreshModeText();
    scheduleAutoRefresh();
  } catch (error) {
    if (token !== state.loadToken) return;
    console.error('比赛动态加载失败', error);
    showFeedError();
    state.newsStatus = 'error';
    renderNews();
    showToast(`比赛动态加载失败：${error.message ?? '请稍后重试'}`);
  }
}

async function openMini(gameId = state.selectedGameId) {
  if (!gameId || !window.nbaDesktop?.openMini || !state.events.length) return;
  try {
    await window.nbaDesktop.openMini({
      date: state.selectedDate,
      gameId,
      games: state.events,
    });
  } catch (error) {
    console.error('迷你窗打开失败', error);
    showToast(`迷你窗打开失败：${error.message ?? '请稍后重试'}`);
  }
}

function showFeedError() {
  el.feed.innerHTML = '';
  el.feedEmpty.classList.remove('is-hidden');
  el.emptyTitle.textContent = '图文动态暂时不可用';
  el.emptyText.textContent = '网络可能短暂波动，点击右上角刷新重试。';
  if (state.view === 'live') el.feedSummary.textContent = '加载失败';
  else updateContentMeta();
}

async function loadDate(selectedDate, options = {}) {
  clearTimeout(state.refreshTimer);
  state.selectedDate = selectedDate;
  state.loadToken += 1;
  renderDateHeader();
  showScheduleLoading();
  el.feedSummary.textContent = '正在读取当日赛程';

  try {
    const events = await fetchChinaDateEvents(selectedDate);
    state.events = events;
    if (!events.length) {
      state.selectedGameId = '';
      state.summary = null;
      renderSchedule();
      renderEmptyDay();
      return;
    }

    const preserved = events.find(
      (game) => options.preserveSelection && game.id === state.selectedGameId,
    );
    const selected = preserved ?? chooseBestGame(events);
    renderSchedule();
    await selectGame(selected);
  } catch (error) {
    state.events = [];
    state.summary = null;
    state.selectedGameId = '';
    renderSchedule();
    renderConnectionError(error);
  } finally {
    hideLoading();
  }
}

function renderEmptyDay() {
  renderScore(null);
  el.seasonPill.textContent = '赛程';
  el.gameDate.textContent = `${formatChineseDate(state.selectedDate)} · 北京时间`;
  el.awayName.textContent = '客队';
  el.homeName.textContent = '主队';
  el.awayRecord.textContent = '暂无比赛';
  el.homeRecord.textContent = '切换日期看看';
  el.awayScore.textContent = '–';
  el.homeScore.textContent = '–';
  el.gameClock.textContent = '当日暂无 NBA 比赛';
  el.statusBadge.className = 'status-badge status-final';
  el.statusText.textContent = '休赛';
  el.quarterStrip.innerHTML =
    '<span class="quarter-label">选择侧边栏中的其他比赛日</span>';
  el.updateStamp.textContent = '等待赛程';
  el.feed.innerHTML = '';
  el.feedEmpty.classList.remove('is-hidden');
  el.emptyTitle.textContent = '当日暂无比赛';
  el.emptyText.textContent = '可以切换到前后比赛日，查看赛程与图文动态。';
  el.feedSummary.textContent = '暂无动态';
  renderPlayerStats();
  state.news = [];
  state.newsStatus = 'error';
  renderNews();
  refreshModeText();
}

function renderConnectionError(error) {
  renderScore(null);
  el.statusBadge.className = 'status-badge status-final';
  el.statusText.textContent = '连接失败';
  el.gameClock.textContent = '请检查网络后重试';
  el.feed.innerHTML = '';
  el.feedEmpty.classList.remove('is-hidden');
  el.emptyTitle.textContent = '无法连接赛事服务';
  el.emptyText.textContent = '稍后会自动重试，也可以点击右上角刷新。';
  el.feedSummary.textContent = '连接失败';
  renderPlayerStats();
  state.news = [];
  state.newsStatus = 'error';
  renderNews();
  showToast(error?.message || '网络连接失败，请稍后重试');
  scheduleAutoRefresh();
}

async function refreshCurrent(manual = false) {
  if (!state.summary?.game?.id) {
    if (manual) await loadDate(state.selectedDate, { preserveSelection: true });
    return;
  }

  clearTimeout(state.refreshTimer);
  state.refreshTimer = null;
  if (manual) el.refreshButton.classList.add('is-spinning');
  try {
    if (allGamesFinished()) {
      await refreshNewsOnly(manual);
      return;
    }

    const token = ++state.loadToken;
    const summary = await window.nbaDesktop.getSummary(state.summary.game.id);
    if (token !== state.loadToken) return;
    state.summary = summary;
    const scheduled = state.events.find((game) => game.id === summary.game.id);
    const game = {
      ...scheduled,
      ...summary.game,
      competitors: summary.game.competitors?.length
        ? summary.game.competitors
        : scheduled?.competitors ?? [],
    };
    state.summary.game = game;
    syncScheduledGameStatus(game);
    renderScore(game);
    renderPlayerStats();
    renderFeed();
    const teamIds = (game.competitors ?? [])
      .map((competitor) => String(competitor.team?.id ?? ''))
      .filter((teamId) => /^\d+$/.test(teamId))
      .sort();
    const teamKey = teamIds.join(',');
    if (
      teamKey &&
      (state.newsTeamKey !== teamKey ||
        Date.now() - state.newsFetchedAt >= TEAM_NEWS_REFRESH_MS)
    ) {
      loadTeamNews(game, token);
    }
    refreshModeText();
    if (manual) showToast('赛况已刷新');
  } catch (error) {
    if (manual) showToast('刷新失败，请检查网络');
  } finally {
    el.refreshButton.classList.remove('is-spinning');
    scheduleAutoRefresh();
  }
}

function scheduleAutoRefresh() {
  clearTimeout(state.refreshTimer);
  if (!state.autoRefresh) return;

  if (allGamesFinished()) {
    state.refreshTimer = setTimeout(async () => {
      if (document.hidden) {
        scheduleAutoRefresh();
        return;
      }
      await refreshNewsOnly(false);
      refreshModeText();
      scheduleAutoRefresh();
    }, TEAM_NEWS_REFRESH_MS);
    refreshModeText();
    return;
  }

  const live = state.summary?.game?.status?.state === 'in';
  const delay = live ? LIVE_REFRESH_MS : IDLE_REFRESH_MS;
  state.refreshTimer = setTimeout(async () => {
    if (document.hidden) {
      scheduleAutoRefresh();
      return;
    }
    state.refreshTicks += 1;
    if (
      state.refreshTicks %
        (live ? LIVE_SCHEDULE_REFRESH_TICKS : 2) ===
      0
    ) {
      await loadDate(state.selectedDate, { preserveSelection: true, silent: true });
    } else {
      await refreshCurrent(false);
    }
  }, delay);
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add('is-visible');
  state.toastTimer = setTimeout(() => {
    el.toast.classList.remove('is-visible');
  }, 2800);
}

function hideLoading() {
  el.loadingLayer.classList.add('is-hidden');
}

function updateClock() {
  const now = new Date();
  el.beijingClock.textContent = `北京时间 ${chinaTimeFormatter.format(now)}`;
}

function bindWindowControls() {
  if (!window.nbaDesktop) return;
  el.closeButton.addEventListener('click', () => window.nbaDesktop.windowAction('close'));
  el.minimizeButton.addEventListener('click', () => window.nbaDesktop.windowAction('minimize'));
  el.maximizeButton.addEventListener('click', () => window.nbaDesktop.windowAction('maximize'));
  el.pinButton.addEventListener('click', async () => {
    const result = await window.nbaDesktop.windowAction('toggle-pin');
    el.pinButton.setAttribute('aria-pressed', result?.pinned ? 'true' : 'false');
  });
  window.nbaDesktop.onMaximized((maximized) => {
    el.windowFrame.classList.toggle('is-maximized', maximized);
  });
  window.nbaDesktop.onMiniGameSelected((gameId) => {
    const game = state.events.find((item) => item.id === gameId);
    if (game && game.id !== state.selectedGameId) selectGame(game);
  });
}

function bindInteractions() {
  el.feedTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    setContentView(button.dataset.view, { scrollTop: true });
  });

  el.refreshButton.addEventListener('click', () => refreshCurrent(true));
  el.miniButton.addEventListener('click', () => openMini());
  el.previousDay.addEventListener('click', () => {
    loadDate(shiftDateKey(state.selectedDate, -1));
  });
  el.nextDay.addEventListener('click', () => {
    loadDate(shiftDateKey(state.selectedDate, 1));
  });
  el.todayButton.addEventListener('click', () => {
    loadDate(state.today);
  });
  el.newPill.addEventListener('click', () => {
    el.feed.scrollTo({ top: 0, behavior: 'smooth' });
    el.newPill.classList.add('is-hidden');
  });
  el.feed.addEventListener('scroll', () => {
    if (el.feed.scrollTop < 12) el.newPill.classList.add('is-hidden');
  });
  el.autoRefreshToggle.addEventListener('click', () => {
    state.autoRefresh = !state.autoRefresh;
    el.autoRefreshToggle.setAttribute('aria-checked', String(state.autoRefresh));
    localStorage.setItem('nba-live-auto-refresh', String(state.autoRefresh));
    refreshModeText();
    scheduleAutoRefresh();
  });
  el.playerTeamTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-team-id]');
    if (!button) return;
    state.playerTeamId = button.dataset.teamId;
    renderPlayerStats();
  });
  el.standingsTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-conference]');
    if (!button || button.dataset.conference === state.standingsConference) {
      return;
    }
    state.standingsConference = button.dataset.conference;
    renderStandings();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshCurrent(false);
    }
  });
}

async function init() {
  state.today = dateKey();
  state.selectedDate = state.today;
  const storedAutoRefresh = localStorage.getItem('nba-live-auto-refresh');
  state.autoRefresh = storedAutoRefresh !== 'false';
  el.autoRefreshToggle.setAttribute('aria-checked', String(state.autoRefresh));
  bindWindowControls();
  bindInteractions();
  setContentView('live');
  refreshModeText();
  renderDateHeader();
  updateClock();
  state.clockTimer = setInterval(updateClock, 1000);

  if (!window.nbaDesktop) {
    hideLoading();
    renderConnectionError(new Error('桌面接口未加载'));
    return;
  }

  loadStandings();
  try {
    await loadDate(state.today);
  } finally {
    hideLoading();
  }
}

init();
