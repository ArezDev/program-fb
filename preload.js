//preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onAppiumLoading: (cb) => ipcRenderer.on('appium-loading', cb),
  onNoDevicesFound: (cb) => ipcRenderer.on('no-devices-found', cb),
  startCreateFB: () => ipcRenderer.invoke('auto-create-fb'),
  startVerifyFB: () => ipcRenderer.invoke('auto-verify-fb'),
  startCreateThreads: () => ipcRenderer.invoke('auto-create-threads'),
  getCokisFB: (device) => ipcRenderer.invoke('getcokis-facebook', device),
  getDeviceConfigs: () => ipcRenderer.invoke('get-device-configs'),
  onReadyToRun: (cb) => ipcRenderer.on('ready-to-run', cb),

  //modem restart restartSinyal
  restartModem: () => ipcRenderer.invoke('restart-modem'),

  //settings
  openSettingsWindow: () => ipcRenderer.send('open-settings'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (data) => ipcRenderer.send('save-settings', data),
  
  // ✅ Listener progres log
  onFBLog: (callback) => ipcRenderer.on('fb-log', callback),
});