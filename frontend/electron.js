const electron = require('electron');
const path = require('path');
const url = require('url');

// 拦截 'windows-foreground-love' 模块的加载
const originalLoad = electron.app._load;
electron.app._load = function(request, parent, isMain) {
  if (request === 'windows-foreground-love') {
    return {};
  }
  return originalLoad(request, parent, isMain);
};

const { app, BrowserWindow } = electron;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081'
    : url.format({
        pathname: path.join(__dirname, './dist/index.html'),
        protocol: 'file:',
        slashes: true
      });

  win.loadURL(startUrl);

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

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