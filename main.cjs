const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 430,
    height: 390,
    minWidth: 390,
    minHeight: 390,
    resizable: true,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");
}

ipcMain.on("window:minimize", () => win?.minimize());
ipcMain.on("window:close", () => win?.close());
ipcMain.on("window:pin", (_event, pinned) => win?.setAlwaysOnTop(Boolean(pinned)));

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
