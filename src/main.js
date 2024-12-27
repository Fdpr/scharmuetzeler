const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const isDev = import('electron-is-dev');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

require('@electron/remote/main').initialize()

const StateManager = require('./backend/statemanager');
const NotificationManager = require('./backend/NotificationManager');
const FileManager = require('./backend/FileManager');
const ActionManager = require('./backend/ActionManager');

// Initialize services
global.notificationManager = new NotificationManager();
global.stateManager = new StateManager();
global.fileManager = new FileManager();
global.actionManager = new ActionManager(global.stateManager, global.notificationManager);
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
      preload: path.join(__dirname, 'preload.js')
    },
  });

  require("@electron/remote/main").enable(global.mainWindow.webContents);

  global.mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
  global.mainWindow.webContents.openDevTools();

  // Global function to manage admin window
  global.openAdminWindow = function (signal) {
    if (global.adminWindow) {
      global.adminWindow.focus();
      if (signal) {
        global.adminWindow.webContents.send('signal', signal);
      }
      return global.adminWindow;
    }

    global.adminWindow = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      }
    });

    require("@electron/remote/main").enable(global.adminWindow.webContents)

    global.adminWindow.loadFile(path.join(__dirname, 'frontend', 'admin.html'));
    global.adminWindow.webContents.openDevTools();
    global.adminWindow.webContents.on('did-finish-load', () => {
      if (signal) {
        global.adminWindow.webContents.send('signal', signal);
      }
    });

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
      label: 'Workspace öffnen',
      click: () => global.stateManager.setWorkspace()
    },
    {
      label: 'Workspace speichern',
      click: () => global.stateManager.saveWorkspace(false)
    },
    {
      label: 'Admin-Panel öffnen',
      click: () => global.openAdminWindow({ type: "admin-panel" })
    },
    {
      label: 'Truppen-Editor',
      click: () => global.openAdminWindow({ type: "troop" })
    },
    {
      label: 'Anführer-Editor',
      click: () => global.openAdminWindow({ type: "leader" })
    },
    {
      label: 'Timeline-Editor',
      click: () => global.openAdminWindow()
    },
    {
      label: 'Fortsetzen',
      click: () => global.stateManager.updateState("tokens", global.stateManager.getState("tokens"))
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  global.mainWindow.setMenu(menu);

  // Check if app is in development mode and set Workspace to test folder
  if (isDev) {
    setTimeout(() => {
      console.log("Development mode detected. Setting workspace to test folder.");
      global.stateManager.setWorkspace(path.join(app.getPath("documents"), "scharmuetzeler", 'test'))
    }, 500);
  }
});


app.on('window-all-closed', () => {
  app.quit();
});