const {
  app,
  Menu,
  session,
  BrowserWindow,
  globalShortcut,
  shell,
  nativeTheme,
  systemPreferences,
} = require("electron");

const crypto = require("crypto");
const { promisify } = require("util");
const log = require("electron-log");
const keytar = require("keytar");

const { initializeStore } = require("./services/storage-service");

const SERVICE_NAME = "quest-app";

const isDev = process.env.NODE_ENV !== "production";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

let isAuthenticated = false;

function centerAndFocus(window) {
  window.show();
  window.focus();
  window.center();
  window.focusOnWebView();
}

let mainWindow;
const createWindow = async () => {
  let encryptionKey = await keytar.getPassword(SERVICE_NAME, "encryptionKey");
  if (!encryptionKey) {
    encryptionKey = (await promisify(crypto.randomBytes)(256)).toString("hex");
    await keytar.setPassword(SERVICE_NAME, "encryptionKey", encryptionKey);
  }

  if (
    !isDev &&
    !isAuthenticated &&
    encryptionKey &&
    systemPreferences &&
    systemPreferences.canPromptTouchID &&
    systemPreferences.canPromptTouchID()
  ) {
    await systemPreferences.promptTouchID("access your keychain");
  }

  isAuthenticated = true;

  // override user agent to by-pass some CSRF checks
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = "Quest";
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    details.responseHeaders["Quest-Cookie"] = details.responseHeaders["Set-Cookie"];
    callback(details);
  });

  const store = await initializeStore({
    isProduction: process.env.NODE_ENV === "production",
    encryptionKey,
  });

  const theme = store.access()?.nested?.appearance?.nested?.theme?.get();

  mainWindow = new BrowserWindow({
    width: isDev ? 1300 : 800,
    height: 900,
    // only support frameless in prod as it breaks when devtools are open
    // TODO: fix frameless mode
    // titleBarStyle: isDev ? undefined : "hidden",
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      additionalArguments: [`--encryptionKey=${encryptionKey}`, `--theme=${theme}`],
    },
    backgroundColor: nativeTheme.shouldUseDarkColors && theme !== "light" ? "#293742" : "",
  });

  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    const devToolShortcuts = "CommandOrControl+Option+i";
    if (!globalShortcut.isRegistered(devToolShortcuts)) {
      globalShortcut.register(devToolShortcuts, () => mainWindow.webContents.openDevTools());
    }
  }
  centerAndFocus(mainWindow);

  // force opening the link with target=_blank in a browser window
  mainWindow.webContents.on("new-window", async function (e, url) {
    e.preventDefault();
    await shell.openExternal(url);
  });

  registerGlobalShortcut(store);
};

function registerGlobalShortcut(store) {
  const shortcut = store.access().nested.shortcuts.nested.focusApp.get();
  if (globalShortcut.isRegistered(shortcut)) {
    globalShortcut.unregister(shortcut);
  }
  globalShortcut.register(shortcut, () => {
    try {
      centerAndFocus(mainWindow);
    } catch (e) {
      return createWindow();
    }
  });
}

function makeMenu() {
  const isMac = process.platform === "darwin";

  const devTools = [
    { role: "reload" },
    { role: "forcereload" },
    { role: "toggledevtools" },
    { type: "separator" },
  ];

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [isMac ? { role: "close" } : { role: "quit" }],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        ...(isDev ? devTools : []),
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }]
          : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => shell.openExternal("https://github.com/hverlin/Quest"),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  makeMenu();

  try {
    await createWindow();
  } catch (e) {
    log.error("error, quiting", e);
    app.quit();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", (e) => {
  // prevent quitting the app so it can be opened with the global shortcut
  e.preventDefault();
  e.returnValue = false;
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
