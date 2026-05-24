// main.jsx — App shell wiring screens together

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme to <body data-theme> and persist
  React.useEffect(() => {
    const theme = t.theme || "creative";
    document.body.setAttribute("data-theme", theme);
    try { localStorage.setItem("seyamii_theme", theme); } catch(e) {}
  }, [t.theme]);

  // Load saved theme on first render
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("seyamii_theme");
      if (saved && saved !== (t.theme || "creative")) {
        const th = THEMES.find(x => x.id === saved);
        if (th) setTweak({ theme: saved, accent: th.accent });
      }
    } catch(e) {}
  }, []);

  const [file, setFile] = React.useState(null);
  // Per-transcription settings, seeded from defaults
  const [lang, setLang] = React.useState(t.defaultLang || "en");
  const [accuracy, setAccuracy] = React.useState(t.defaultAccuracy || "balanced");
  const [words, setWords] = React.useState(3);
  // Overlay sheet ("settings" | "history" | null)
  const [sheet, setSheet] = React.useState(null);
  const [transcribeStartTime, setTranscribeStartTime] = React.useState(null);

  const [transitioning, setTransitioning] = React.useState(false);
  const goto = (s) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setTweak("screen", s);
      setTimeout(() => setTransitioning(false), 20);
    }, 200);
  };

  const markEngineReady = (id) => {
    setTweak("enginesReady", { ...(t.enginesReady || {}), [id]: true });
  };

  const setTheme = (id) => {
    const th = THEMES.find((x) => x.id === id);
    if (!th) return;
    // Snap accent to theme default so the brand reads consistently
    setTweak({ theme: id, accent: th.accent });
  };

  return (
    <>
      <WindowFrame accent={t.accent} showChrome={t.showChrome} screen={t.screen}
        sheet={sheet} file={file}
        onOpenSettings={() => setSheet(sheet === "settings" ? null : "settings")}
        onOpenHistory={() => setSheet(sheet === "history" ? null : "history")}>
        {t.screen === "main" && (
          <div data-screen-label="01 Main">
            <MainScreen
              t={t} setTweak={setTweak}
              file={file} setFile={setFile}
              lang={lang} setLang={setLang}
              accuracy={accuracy} setAccuracy={setAccuracy}
              words={words} setWords={setWords}
              onTranscribe={() => { setTranscribeStartTime(Date.now()); goto("transcribing"); }}
            />
          </div>
        )}
        {t.screen === "transcribing" && (
          <div data-screen-label="02 Transcribing"
               style={{ width: "100%", height: "100%" }}>
            <TranscribingScreen
              t={t} file={file} accuracy={accuracy} lang={lang} words={words}
              onEngineReady={markEngineReady}
              onCancel={() => { setFile(null); goto("main"); }}
              onDone={() => {
                window.__transcribeDuration = transcribeStartTime ? Math.round((Date.now() - transcribeStartTime) / 1000) : null;
                goto("done");
              }} />
          </div>
        )}
        {t.screen === "done" && (
          <div data-screen-label="03 Done"
               style={{ width: "100%", height: "100%" }}>
            <DoneScreen t={t} file={file} onReset={() => { setFile(null); window.__lastResult = null; window.__transcribeDuration = null; goto("main"); }} />
          </div>
        )}

        {/* Overlay sheets */}
        {sheet === "settings" && (
          <SettingsSheet t={t} setTweak={setTweak} setTheme={setTheme}
            onClose={() => setSheet(null)} />
        )}
        {sheet === "history" && (
          <HistorySheet t={t}
            onClose={() => setSheet(null)} />
        )}
      </WindowFrame>

      <ScreenStrip current={t.screen} onChange={goto} accent={t.accent} />

      <TweaksPanel title="Slate · Tweaks">
        <TweakSection label="Theme">
          <TweakSelect label="Theme" value={t.theme || "creative"}
            options={THEMES.map((th) => ({ value: th.id, label: th.label }))}
            onChange={setTheme} />
        </TweakSection>
        <TweakSection label="View">
          <TweakRadio label="Screen" value={t.screen}
            options={[
              { value: "main", label: "Main" },
              { value: "transcribing", label: "Transcribing" },
              { value: "done", label: "Done" },
            ]}
            onChange={(v) => setTweak("screen", v)} />
          <TweakSelect label="Open sheet" value={sheet || "none"}
            options={[
              { value: "none", label: "— closed —" },
              { value: "settings", label: "Settings" },
              { value: "history", label: "History" },
            ]}
            onChange={(v) => setSheet(v === "none" ? null : v)} />
          <TweakToggle label="Window chrome" value={t.showChrome}
            onChange={(v) => setTweak("showChrome", v)} />
        </TweakSection>
        <TweakSection label="Demo state">
          <TweakSelect label="Accuracy level" value={accuracy}
            options={ACCURACY_LEVELS.map((l) => ({ value: l.id, label: l.label }))}
            onChange={setAccuracy} />
          <TweakToggle label="Precise engine ready"
            value={!!t.enginesReady?.precise}
            onChange={(v) => setTweak("enginesReady",
              { ...(t.enginesReady || {}), precise: v })} />
          <TweakToggle label="Studio engine ready"
            value={!!t.enginesReady?.studio}
            onChange={(v) => setTweak("enginesReady",
              { ...(t.enginesReady || {}), studio: v })} />
        </TweakSection>
        <TweakSection label="Brand">
          <TweakColor label="Accent" value={t.accent}
            options={["#c8643c", "#a45e3b", "#7a6b56", "#3d6b5a", "#5b6e8f"]}
            onChange={(v) => setTweak("accent", v)} />
          <TweakText label="Demo file" value={t.demoFile}
            onChange={(v) => setTweak("demoFile", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

function ScreenStrip({ current, onChange, accent }) {
  const screens = [
    { id: "main", label: "1 · Drop & configure" },
    { id: "transcribing", label: "2 · Transcribing" },
    { id: "done", label: "3 · Export" },
  ];
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: 18,
      transform: "translateX(-50%)",
      display: "flex", gap: 0, padding: 4,
      background: "rgba(31,30,27,0.78)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: 999,
      boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 10px 30px rgba(0,0,0,0.25)",
      border: "0.5px solid rgba(255,255,255,0.06)",
    }}>
      {screens.map((s) => {
        const on = s.id === current;
        return (
          <button key={s.id} onClick={() => onChange(s.id)}
            style={{
              padding: "7px 16px", borderRadius: 999, border: 0,
              background: on ? "rgba(255,255,255,0.92)" : "transparent",
              color: on ? "#1f1e1b" : "rgba(255,255,255,0.65)",
              fontFamily: "var(--sans)", fontSize: 11.5,
              fontWeight: on ? 600 : 500, letterSpacing: "0.01em",
              cursor: "default",
            }}>{s.label}</button>
        );
      })}
    </div>
  );
}

window.App = App;

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
