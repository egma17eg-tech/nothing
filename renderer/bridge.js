// bridge.js — wires the real Electron IPC into the design's component system
// Loaded after all JSX components, before main.jsx renders

(function () {
  if (!window.seyamii) return; // not in Electron — prototype mode, no-op

  // Override the fake handlers with real ones
  window.__bridge = {

    // Called when user clicks Browse or drops a file
    openFile: async () => {
      const file = await window.seyamii.openFile();
      return file; // { path, name, size }
    },

    // Called when Transcribe button is pressed
    startTranscribe: async ({ filePath, language, accuracy, wordsPerCue, onProgress, onDone, onError }) => {
      const unsub = window.seyamii.onProgress((msg) => {
        if (msg.type === 'running') {
          onProgress && onProgress(msg);
        } else if (msg.type === 'done') {
          unsub && unsub();
          onDone && onDone(msg);
          window.seyamii.notify({ title: 'Seyamii Slate', body: `Done — ${msg.wordCount} words transcribed.` });
        } else if (msg.type === 'error') {
          unsub && unsub();
          onError && onError(msg.message);
        } else if (msg.type === 'setup') {
          onProgress && onProgress({ ...msg, isSetup: true });
        }
      });
      await window.seyamii.startTranscribe({ filePath, language, accuracy, wordsPerCue });
    },

    cancelTranscribe: () => window.seyamii.cancelTranscribe(),

    saveSRT: async ({ defaultName, content }) => {
      return await window.seyamii.saveFile({ defaultName, content });
    },

    revealInFinder: (path) => window.seyamii.revealInFinder(path),

    checkModel: (accuracy) => window.seyamii.checkModel(accuracy),
  };

  console.log('[Seyamii] Bridge ready');
})();
