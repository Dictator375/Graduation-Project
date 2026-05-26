const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');

const isDev = process.env.NODE_ENV !== 'production';
let mainWindow;

// Wait until a port responds before opening the window
function waitForPort(port, retries = 40) {
  return new Promise((resolve) => {
    function tryConnect() {
      const req = http.get(`http://localhost:${port}`, () => resolve());
      req.on('error', () => {
        if (retries-- <= 0) { resolve(); return; }
        setTimeout(tryConnect, 500);
      });
      req.end();
    }
    tryConnect();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  1024,
    minHeight: 640,
    title:     'نظام إدارة محطة الوقود',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
    backgroundColor: '#0f1117',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  if (isDev) {
    // Wait for backend AND Vite to be fully ready before opening window
    console.log('[App] Waiting for backend and Vite...');
    await Promise.all([waitForPort(3001), waitForPort(5173)]);
    console.log('[App] Everything ready — opening window');
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('open-save-dialog', async (_, defaultName) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'report.csv',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  return result.filePath;
});