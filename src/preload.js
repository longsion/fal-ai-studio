const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration methods
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  getAllConfig: () => ipcRenderer.invoke('get-all-config'),
  
  // Image generation
  generateImage: (options) => ipcRenderer.invoke('generate-image', options),
  
  // Error handling
  showError: (title, content) => ipcRenderer.invoke('show-error', title, content)
});
