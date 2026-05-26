const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openSaveDialog: (defaultName) => ipcRenderer.invoke('open-save-dialog', defaultName),
  platform: process.platform,
});
