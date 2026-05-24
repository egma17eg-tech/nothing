const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
let mainWindow;
let transcribeProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1140, height: 760, minWidth: 900, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['mp3','wav','m4a','flac','mp4','mov','aac'] }],
  });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  const stat = fs.statSync(filePath);
  return { path: filePath, name: path.basename(filePath), size: (stat.size/(1024*1024)).toFixed(1)+' MB' };
});

ipcMain.handle('save-file', async (_, opts) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: opts.defaultName,
    filters: [{ name: 'SRT', extensions: ['srt'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, opts.content, 'utf8');
  return result.filePath;
});

ipcMain.handle('reveal-in-finder', async (_, filePath) => { shell.showItemInFolder(filePath); });

ipcMain.handle('start-transcribe', async (event, opts) => {
  if (transcribeProcess) { transcribeProcess.kill(); transcribeProcess = null; }
  const modelMap = { draft:'tiny', quick:'base', balanced:'small', precise:'medium', studio:'large-v3' };
  transcribeProcess = spawn('python3', [
    path.join(__dirname, 'backend', 'transcribe.py'),
    '--action', 'transcribe',
    '--file', opts.filePath,
    '--language', opts.language === 'ar' ? 'ar' : 'en',
    '--model', modelMap[opts.accuracy] || 'small',
    '--words-per-cue', String(opts.wordsPerCue),
  ]);
  transcribeProcess.stdout.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach((line) => {
      try { mainWindow.webContents.send('transcribe-progress', JSON.parse(line)); } catch(e) {}
    });
  });
  transcribeProcess.stderr.on('data', (data) => {
    const txt = data.toString();
    if (txt.includes('ERROR') || txt.includes('Traceback')) {
      mainWindow.webContents.send('transcribe-progress', { type: 'error', message: txt.slice(0,300) });
    }
  });
  transcribeProcess.on('close', () => { transcribeProcess = null; });
  return { started: true };
});

ipcMain.handle('cancel-transcribe', async () => {
  if (transcribeProcess) { transcribeProcess.kill(); transcribeProcess = null; }
  return { cancelled: true };
});

ipcMain.handle('check-model', async (_, accuracy) => {
  const modelMap = { draft:'tiny', quick:'base', balanced:'small', precise:'medium', studio:'large-v3' };
  const modelName = modelMap[accuracy] || 'small';
  const os = require('os');
  const whisperCache = path.join(os.homedir(), '.cache', 'whisper');
  const modelFile = path.join(whisperCache, modelName + '.pt');
  let ready = false;
  try {
    ready = fs.existsSync(modelFile) && fs.statSync(modelFile).size > 10_000_000;
  } catch(e) {}
  return { ready, modelName, path: modelFile };
});

ipcMain.handle('notify', async (_, opts) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) new Notification({ title: opts.title, body: opts.body }).show();
});
