const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('seyamii', {
  openFile:         ()       => ipcRenderer.invoke('open-file'),
  saveFile:         (opts)   => ipcRenderer.invoke('save-file', opts),
  revealInFinder:   (path)   => ipcRenderer.invoke('reveal-in-finder', path),
  startTranscribe:  (opts)   => ipcRenderer.invoke('start-transcribe', opts),
  cancelTranscribe: ()       => ipcRenderer.invoke('cancel-transcribe'),
  checkModel:       (acc)    => ipcRenderer.invoke('check-model', acc),
  notify:           (opts)   => ipcRenderer.invoke('notify', opts),
  onProgress: (callback) => {
    ipcRenderer.on('transcribe-progress', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('transcribe-progress');
  },
});
