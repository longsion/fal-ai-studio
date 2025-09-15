const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize store for configuration
const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for configuration
ipcMain.handle('get-config', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-config', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('get-all-config', () => {
  return store.store;
});

// IPC handler for image generation
ipcMain.handle('generate-image', async (event, options) => {
  try {
    const { generateImage } = require('./services/imageGenerator');
    return await generateImage(options);
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
});

// IPC handler for showing error dialogs
ipcMain.handle('show-error', async (event, title, content) => {
  return dialog.showErrorBox(title, content);
});
