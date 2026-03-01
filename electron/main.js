const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

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

  const artistsFile = path.join(dataDir, 'artists.json');
  const releasesFile = path.join(dataDir, 'releases.json');

  // Copy default data files on first run
  if (!fs.existsSync(artistsFile)) {
    let sourceDir;
    if (isDev) {
      sourceDir = path.join(__dirname, '../backend/data');
    } else {
      sourceDir = path.join(process.resourcesPath, 'data');
    }

    const sourceArtists = path.join(sourceDir, 'artists.json');
    const sourceReleases = path.join(sourceDir, 'releases.json');

    if (fs.existsSync(sourceArtists)) {
      fs.copyFileSync(sourceArtists, artistsFile);
    } else {
      fs.writeFileSync(artistsFile, '[]');
    }

    if (fs.existsSync(sourceReleases)) {
      fs.copyFileSync(sourceReleases, releasesFile);
    } else {
      fs.writeFileSync(releasesFile, '[]');
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
  process.env.PORT = '3000';

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
    mainWindow.loadURL('http://localhost:3000');
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
