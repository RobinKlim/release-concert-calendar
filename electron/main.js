const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix SIGTRAP crashes on Linux
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

let mainWindow;

const isDev = !app.isPackaged;

function getDataDir() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'data');
}

function getFrontendPath() {
  if (isDev) {
    return path.join(__dirname, '../frontend/dist/frontend/browser');
  }
  return path.join(app.getAppPath(), 'frontend/dist/frontend/browser');
}

function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '../backend/server.js');
  }
  return path.join(app.getAppPath(), 'backend/server.js');
}

function copyDefaultData() {
  const dataDir = getDataDir();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let sourceDir;
  if (isDev) {
    sourceDir = path.join(__dirname, '../backend/data');
  } else {
    sourceDir = path.join(process.resourcesPath, 'data');
  }

  // Copy all data files on first run
  const dataFiles = ['artists.json', 'releases.json', 'concerts.json', 'settings.json'];
  const firstRun = !fs.existsSync(path.join(dataDir, 'artists.json'));

  if (firstRun) {
    for (const file of dataFiles) {
      const source = path.join(sourceDir, file);
      const dest = path.join(dataDir, file);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
      } else {
        fs.writeFileSync(dest, '{}');
      }
    }
  }
}

async function startBackend() {
  const dataDir = getDataDir();
  const frontendPath = getFrontendPath();
  const backendPath = getBackendPath();

  // Set environment variables before importing the backend
  process.env.DATA_DIR = dataDir;
  process.env.FRONTEND_BUILD_PATH = frontendPath;
  process.env.PORT = '47291';

  // Dynamically import the ES module backend (this starts the server)
  try {
    await import(`file://${backendPath}`);
    console.log('Backend server started');
  } catch (error) {
    console.error('Failed to start backend:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Wait for backend to start, then load the app
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:47291');
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  copyDefaultData();
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
