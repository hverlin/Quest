import { initializeStore } from "./services/storage-service";
import { getCredential, saveCredential } from "./services/credential-service";
const crypto = require("crypto");
const { promisify } = require("util");
const log = require("electron-log");

const {
  app,
  session,
  BrowserWindow,
  globalShortcut,
  shell,
  nativeTheme,
  systemPreferences,
} = require("electron");

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
  const isDev = process.env.NODE_ENV !== "production";

  let encryptionKey = await getCredential("encryptionKey");
  if (!encryptionKey) {
    encryptionKey = (await promisify(crypto.randomBytes)(256)).toString("hex");
    await saveCredential("encryptionKey", encryptionKey);
  }

  if (!isDev && !isAuthenticated && encryptionKey && systemPreferences.canPromptTouchID()) {
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
  }
  centerAndFocus(mainWindow);

  // force opening the link with target=_blank in a browser window
  mainWindow.webContents.on("new-window", async function (e, url) {
    e.preventDefault();
    await shell.openExternal(url);
  });

  const shortcut = "CommandOrControl+Shift+Space";
  if (!globalShortcut.isRegistered(shortcut)) {
    globalShortcut.register(shortcut, () => {
      try {
        centerAndFocus(mainWindow);
      } catch (e) {
        createWindow();
      }
    });
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
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
