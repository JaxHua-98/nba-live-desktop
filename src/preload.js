const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nbaDesktop', {
  getScoreboard: (date) => ipcRenderer.invoke('nba:scoreboard', date),
  getSummary: (eventId) => ipcRenderer.invoke('nba:summary', eventId),
  getStandings: () => ipcRenderer.invoke('nba:standings'),
  getTeamNews: (teamIds) => ipcRenderer.invoke('nba:team-news', teamIds),
  windowAction: (action) => ipcRenderer.invoke('window:action', action),
  openMini: (payload) => ipcRenderer.invoke('mini:open', payload),
  getMiniState: () => ipcRenderer.invoke('mini:get-state'),
  toggleMiniTop: () => ipcRenderer.invoke('mini:toggle-top'),
  selectMiniGame: (gameId) => ipcRenderer.invoke('mini:select-game', gameId),
  showMain: () => ipcRenderer.invoke('window:show-main'),
  onMaximized: (callback) => {
    const listener = (_event, maximized) => callback(maximized);
    ipcRenderer.on('window:maximized', listener);
    return () => ipcRenderer.removeListener('window:maximized', listener);
  },
  onMiniContext: (callback) => {
    const listener = (_event, context) => callback(context);
    ipcRenderer.on('mini:context', listener);
    return () => ipcRenderer.removeListener('mini:context', listener);
  },
  onMiniGameSelected: (callback) => {
    const listener = (_event, gameId) => callback(gameId);
    ipcRenderer.on('mini:game-selected', listener);
    return () => ipcRenderer.removeListener('mini:game-selected', listener);
  },
});
