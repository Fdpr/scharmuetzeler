const { app, BrowserWindow } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

require('@electron/remote/main').initialize()

const StateManager = require('./backend/StateManager');
const SystemMonitor = require('./backend/SystemMonitor');
const AdminService = require('./backend/AdminService');

// Initialize services
global.stateManager = new StateManager();
global.systemMonitor = new SystemMonitor(global.stateManager);
global.adminService = new AdminService(global.stateManager, global.fileManager);
global.mainWindow = null;
global.adminWindow = null;

const createMainWindow = () => {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      nodeIntegration: true,    // Allows direct Node.js access
      contextIsolation: false,  // Allows direct access to Electron APIs
      enableRemoteModule: true, // Allows remote module access
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  require("@electron/remote/main").enable(global.mainWindow.webContents);

  // and load the index.html of the app.
  global.mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));

  // Open the DevTools.
  global.mainWindow.webContents.openDevTools();

  // Global function to manage admin window
  global.openAdminWindow = function () {
    if (global.adminWindow) {
      global.adminWindow.focus();
      return global.adminWindow;
    }

    global.adminWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    });

    require("@electron/remote/main").enable(global.adminWindow.webContents)

    global.adminWindow.loadFile(path.join(__dirname, 'frontend', 'admin.html'));

    global.adminWindow.on('closed', () => {
      global.adminWindow = null;
    });

  };
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createMainWindow();

  // Quit when main window is closed
  global.mainWindow.on('closed', () => {
    app.quit();
  });

  const { Menu } = require('electron');
  const template = [
    {
      label: 'Admin',
      click: () => global.openAdminWindow()
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  global.mainWindow.setMenu(menu);
});


app.on('window-all-closed', () => {
  app.quit();
});