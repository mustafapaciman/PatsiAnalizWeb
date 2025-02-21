const { app, BrowserWindow } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')

// Performans için global ayarlar
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('high-dpi-support', 1);

// RAM optimizasyonu
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

function createWindow() {
  const port = process.env.PORT || 3000;
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      webSecurity: false,
      enableWebSQL: false,
      spellcheck: false,
      enableBlinkFeatures: 'MemoryCache',
      v8CacheOptions: 'bypassHeatCheck',
      experimentalFeatures: false,
      nodeIntegrationInSubFrames: false,
      enableRemoteModule: false,
      nativeWindowOpen: true,
      webgl: true,
      affinity: 'main-window'
    },
    show: false,
    backgroundColor: '#fff',
    paintWhenInitiallyHidden: true,
    autoHideMenuBar: true,
    minimizable: true,
    frame: true,
    titleBarStyle: 'hidden',
    thickFrame: false,
    webPreferences: {
      offscreen: false
    }
  })

  if (isDev) {
    win.webContents.on('did-frame-finish-load', () => {
      win.webContents.closeDevTools();
      win.webContents.setAudioMuted(true);
      win.webContents.session.clearCache();
      win.webContents.session.clearStorageData({
        storages: ['appcache', 'shadercache', 'serviceworkers']
      });
    });
  }

  let gcInterval;
  setInterval(() => {
    if (global.gc) global.gc();
    const memoryInfo = process.getProcessMemoryInfo();
    if (memoryInfo.workingSetSize > 1024 * 1024 * 512) {
      if (global.gc) global.gc();
    }
  }, 60000);

  win.webContents.on('dom-ready', () => {
    win.webContents.send('optimize-rendering');
  });

  win.loadURL(
    isDev
      ? `http://localhost:${port}`
      : `file://${path.join(__dirname, '../build/index.html')}`
  )

  win.once('ready-to-show', () => {
    win.show()
    if (global.gc) global.gc();
    win.webContents.setZoomLevel(0);
    win.webContents.setVisualZoomLevelLimits(1, 1);
  })

  win.on('closed', () => {
    if (gcInterval) clearInterval(gcInterval);
    if (global.gc) global.gc();
  });
}

app.whenReady().then(() => {
  if (typeof v8 !== 'undefined') {
    v8.setFlagsFromString([
      '--max_old_space_size=4096',
      '--optimize_for_size',
      '--max_inlined_source_size=10000'
    ].join(' '));
  }
  createWindow();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (global.gc) global.gc();
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('render-process-gone', (event, webContents, details) => {
  if (details.reason === 'crashed') {
    console.log('Renderer process crashed, restarting...');
    createWindow();
  }
});

app.on('gpu-process-crashed', (event, killed) => {
  if (!killed) {
    console.log('GPU process crashed, restarting...');
    app.relaunch();
    app.exit();
  }
}); 