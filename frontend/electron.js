const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const url = require('url');
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");

// 配置日志
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

function createWindow() {
  log.info('Creating window...');
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, './dist/index.html'),
    protocol: 'file:',
    slashes: true
  });
  
  log.info('Loading URL:', startUrl);
  win.loadURL(startUrl).catch(err => {
    log.error('Failed to load URL:', err);
    dialog.showErrorBox('加载错误', '无法加载应用程序。请检查您的网络连接或重新安装应用程序。');
  });

  win.webContents.on('did-finish-load', () => {
    log.info('Window finished loading');
  });

  win.on('closed', () => {
    log.info('Window closed');
  });
}

function sendStatusToWindow(text) {
  log.info(text);
  if (mainWindow) {
    mainWindow.webContents.send('message', text);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('正在检查更新...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('有可用更新。');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('当前已是最新版本。');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('更新出错: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "下载速度: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - 已下载 ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('更新已下载');
});

app.on('ready', () => {
  log.info('App is ready');
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  log.info('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  dialog.showErrorBox('错误', '发生了一个未知错误。请重新启动应用程序。');
});