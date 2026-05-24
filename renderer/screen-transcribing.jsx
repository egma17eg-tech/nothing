// screen-transcribing.jsx
// Two phases: "setup" (engine download, first-run only) then "running".

function TranscribingScreen({ t, file, accuracy, lang, words, onDone, onEngineReady, onCancel }) {
  const [phase, setPhase] = React.useState("checking");
  const [level] = React.useState(ACCURACY_LEVELS.find((l) => l.id === accuracy) || ACCURACY_LEVELS[2]);
  const modelMap = { draft:"tiny", quick:"base", balanced:"small", precise:"medium", studio:"large-v3" };

  React.useEffect(() => {
    if (!window.seyamii) { setPhase("setup"); return; }
    window.seyamii.checkModel(accuracy).then(res => {
      if (res && res.ready) {
        setPhase("running");
      } else {
        setPhase("setup");
      }
    }).catch(() => setPhase("setup"));
  }, [accuracy]);

  if (phase === "checking") return <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",fontFamily:"var(--sans)",fontSize:13,color:"var(--ink-3)"}}>Checking engine…</div>;
  if (phase === "setup") {
    return <SetupPanel t={t} level={level} onCancel={onCancel}
      onReady={() => {
        onEngineReady && onEngineReady(accuracy);
        setPhase("running");
      }}
    />;
  }
  return <RunningPanel t={t} file={file} accuracy={accuracy} lang={lang}
    words={words} level={level} onDone={onDone} />;
}

// ── First-run engine setup ──────────────────────────────────
function SetupPanel({ t, level, onReady, onCancel }) {
  const [progress, setProgress] = React.useState(0);
  const [stage, setStage] = React.useState("Resolving"); // Resolving → Downloading → Verifying → Warming up
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (window.seyamii) {
      setStage("Preparing");
      const unsub = window.seyamii.onProgress((msg) => {
        if (msg.type === "download_start") {
          setStage("Downloading"); setProgress(0);
          setDlTotal(msg.totalMB || 0);
        } else if (msg.type === "download_progress") {
          setProgress(msg.progress || 0);
          setDlMB(msg.downloadedMB || 0);
          setDlTotal(msg.totalMB || 0);
          setDlSpeed(msg.speedMBs || 0);
          setDlRemaining(msg.remainingSec || 0);
          setStage("Downloading");
        } else if (msg.type === "model_ready") {
          setStage("Warming up"); setProgress(99);
        } else if (msg.type === "setup") {
          setStage(msg.stage || "Loading"); setProgress(msg.progress || 0);
        } else if (msg.type === "running" || msg.type === "done") {
          setProgress(100); setStage("Ready");
          unsub && unsub();
          setTimeout(onReady, 300);
        } else if (msg.type === "error") {
          unsub && unsub();
          setStage("Error: " + msg.message.slice(0, 50));
        }
      });
      return () => unsub && unsub();
    }

    // Fallback demo animation
    let p = 0;
    const tick = setInterval(() => {
      const inc = 0.6 + Math.random() * 1.4 * (1 - p / 120);
      p = Math.min(100, p + inc);
      if (p < 5) setStage("Resolving model");
      else if (p < 95) setStage("Downloading");
      else if (p < 99) setStage("Verifying checksum");
      else setStage("Warming up");
      setProgress(p);
      if (p >= 100) { clearInterval(tick); setTimeout(onReady, 700); }
    }, 130);
    return () => clearInterval(tick);
  }, [onReady]);

  const [dlMB, setDlMB] = React.useState(0);
  const [dlTotal, setDlTotal] = React.useState(0);
  const [dlSpeed, setDlSpeed] = React.useState(0);
  const [dlRemaining, setDlRemaining] = React.useState(0);
  const downloadedMb = dlMB > 0 ? dlMB.toFixed(1) : "0.0";
  const totalMb = dlTotal > 0 ? dlTotal.toFixed(0) : Math.round(parseFloat(level.size) * (level.size.includes("GB") ? 1024 : 1));
  const speedStr = dlSpeed > 0 ? ` · ${dlSpeed.toFixed(1)} MB/s` : "";
  const etaStr = dlRemaining > 60 ? ` · ${Math.ceil(dlRemaining/60)}m left` : dlRemaining > 0 ? ` · ${dlRemaining}s left` : "";

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg)",
    }}>
      <div style={{
        padding: "24px 40px 18px",
        display: "flex", alignItems: "center", gap: 14,
        borderBottom: "0.5px solid var(--line)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `${t.accent}14`, color: t.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 16h12" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <Eyebrow>First-run setup</Eyebrow>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink-3)",
            marginTop: 3,
          }}>
            <b style={{ color: "var(--ink), font-weight: 600" }}>{level.label}</b>
            {" "}engine · {level.size}
          </div>
        </div>
        <button style={{
          height: 30, padding: "0 14px", borderRadius: 8,
          border: "0.5px solid var(--line-2)", background: "var(--button-ghost-bg)",
          fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500,
          color: "var(--ink-2)", cursor: "default",
        }} onClick={() => {
            if (window.seyamii) window.seyamii.cancelTranscribe();
            onCancel && onCancel();
          }}>Cancel</button>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "0 80px",
        background:
          "radial-gradient(800px 500px at 50% 30%, var(--setup-glow) 0%, transparent 70%), var(--bg)",
      }}>
        <div style={{ maxWidth: 720, alignSelf: "center", width: "100%" }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 44, fontWeight: 400,
            color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1.05,
          }}>
            Getting ready for<br/>
            <em style={{ color: "var(--ink-3)" }}>the first time.</em>
          </div>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-3)",
            marginTop: 14, lineHeight: 1.5, maxWidth: 520,
          }}>
            This only happens once per quality level. Seyamii is pulling the
            <b style={{ color: "var(--ink-2)", fontWeight: 600 }}> {level.label}</b> engine
            ({level.size}) so transcription can run fully on-device from here on.
          </div>

          {/* Progress block */}
          <div style={{ marginTop: 36 }}>
            <div style={{
              display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10,
            }}>
              <div style={{
                fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600,
                color: "var(--ink-2)", letterSpacing: "0.01em",
              }}>{stage}{speedStr}{etaStr}</div>
              <div style={{ flex: 1 }} />
              <div style={{
                fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-4)",
                letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums",
              }}>
                {downloadedMb} / {totalMb} MB
              </div>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)",
                fontVariantNumeric: "tabular-nums", fontWeight: 600,
                minWidth: 42, textAlign: "right",
              }}>{Math.floor(progress)}%</div>
            </div>

            <div style={{
              height: 8, background: "var(--surf-track-2)", borderRadius: 999,
              position: "relative", overflow: "hidden",
              boxShadow: "inset 0 1px 1px rgba(0,0,0,0.05)",
            }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${t.accent} 0%, ${__shade(t.accent, 0.25)} 100%)`,
                borderRadius: 999,
                transition: "width .3s ease",
              }} />
              <div style={{
                position: "absolute", left: `${Math.max(0, progress - 14)}%`,
                top: 0, bottom: 0, width: 80,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                transition: "left .3s ease",
              }} />
            </div>

            <div style={{
              display: "flex", gap: 18, marginTop: 18,
              fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-4)",
              lineHeight: 1.5,
            }}>
              <SetupPoint>Files land in <code style={codeS}>~/.cache/whisper</code> — shared with other Whisper tools on your Mac.</SetupPoint>
              <SetupPoint>Next time you pick <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>{level.label}</b>, transcription starts immediately.</SetupPoint>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const codeS = {
  fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)",
  background: "rgba(31,30,27,0.05)", padding: "1px 6px", borderRadius: 4,
};

function SetupPoint({ children }) {
  return (
    <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{
        width: 4, height: 4, borderRadius: "50%", background: "var(--ink-4)",
        marginTop: 7, flexShrink: 0,
      }} />
      <div>{children}</div>
    </div>
  );
}

// ── Actual transcription ────────────────────────────────────
function RunningPanel({ t, file, accuracy, lang, words, level, onDone }) {
  const [progress, setProgress] = React.useState(0);
  const [wordIdx, setWordIdx] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const startedRef = React.useRef(false);
  const startTimeRef = React.useRef(null);

  const [liveWords, setLiveWords] = React.useState([]);
  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Real transcription via Electron bridge
    if (window.seyamii && file && file.path) {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      const timer = setInterval(() => setElapsed((Date.now()-startTimeRef.current)/1000), 250);
      const unsub = window.seyamii.onProgress((msg) => {
        if (msg.type === "running") {
          setProgress(msg.progress || 0);
          if (msg.wordsFound) setWordIdx(msg.wordsFound);
        } else if (msg.type === "done") {
          clearInterval(timer);
          unsub && unsub();
          setProgress(100);
          // Stash the real result so DoneScreen can read it
          window.__lastResult = msg;
          window.seyamii.notify({ title: "Seyamii Slate", body: `Done — ${msg.wordCount} words.` });
          setTimeout(() => onDone && onDone(), 500);
        } else if (msg.type === "error") {
          clearInterval(timer);
          unsub && unsub();
          alert("Transcription error: " + msg.message);
        }
      });
      window.seyamii.startTranscribe({
        filePath: file.path,
        language: lang,
        accuracy: accuracy,
        wordsPerCue: words,
      });
      return () => { clearInterval(timer); unsub && unsub(); };
    }

    // Fallback demo mode (no Electron) — keep the old fake animation
    let p = 0, i = 0, e = 0;
    const interval = setInterval(() => {
      p = Math.min(100, p + (1.1 + Math.random() * 1.6));
      i = Math.min(SAMPLE_WORDS.length, Math.floor((p / 100) * SAMPLE_WORDS.length));
      e += 0.18;
      setProgress(p); setWordIdx(i); setElapsed(e);
      if (p >= 100) { clearInterval(interval); setTimeout(() => onDone && onDone(), 600); }
    }, 180);
    return () => clearInterval(interval);
  }, [onDone]);

  const visibleWords = SAMPLE_WORDS.slice(0, wordIdx);
  const remainingSec = 0;
  const remaining = progress > 0 ? "calculating..." : "—";
  const currentWord = visibleWords[visibleWords.length - 1] || "";

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg)",
    }}>
      {/* File info bar */}
      <div style={{
        padding: "20px 40px 16px",
        display: "flex", alignItems: "center", gap: 16,
        borderBottom: "0.5px solid var(--line)",
      }}>
        <PulseAvatar accent={t.accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500,
            color: "var(--ink)", letterSpacing: "-0.005em",
          }}>{(file && file.name) || "—"}</div>
          <div style={{
            display: "flex", gap: 10, marginTop: 3,
            fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-4)",
          }}>
            <span>12:47</span><span>·</span><span>48.2 MB</span><span>·</span>
            <span>{lang === "ar" ? "العربية" : "English"}</span><span>·</span>
            <span>{words} {words === 1 ? "word" : "words"} / cue</span><span>·</span>
            <span>{level.label}</span>
          </div>
        </div>
        <Stat label="Elapsed" value={`${Math.floor(elapsed)}s`} />
        <Stat label="Remaining" value={remaining} />
        <Stat label="Words" value={visibleWords.length} />
      </div>

      {/* Waveform strip with playhead + current-word highlight */}
      <WaveformStrip progress={progress} accent={t.accent} currentWord={currentWord} />

      {/* Live word feed */}
      <div style={{
        flex: 1, margin: "10px 40px 24px", padding: "20px 26px 24px",
        background: "linear-gradient(180deg, var(--surf-feed-a) 0%, var(--surf-feed-b) 100%)",
        border: "0.5px solid var(--line)",
        borderRadius: 12,
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Eyebrow color={t.accent}>Live word feed</Eyebrow>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: t.accent,
              animation: "pulse 1.3s ease-in-out infinite",
            }} />
            streaming · {Math.floor(progress)}%
          </div>
        </div>

        <WordFeed words={visibleWords} accent={t.accent} />

        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: 60,
          background: "linear-gradient(180deg, transparent, var(--surf-feed-b))",
          pointerEvents: "none",
        }} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        @keyframes wordIn { from{opacity:0;transform:translateY(4px);filter:blur(2px)} to{opacity:1;transform:none;filter:none} }
        @keyframes caret { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes barPulse { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.15)} }
      `}</style>
    </div>
  );
}

// ── Waveform strip with live highlight ──────────────────────
function WaveformStrip({ progress, accent, currentWord }) {
  const N = 220;
  const heights = React.useMemo(() => Array.from({ length: N }, (_, i) => {
    const a = Math.sin(i * 0.21) * 0.45 + 0.55;
    const b = Math.sin(i * 0.087 + 1) * 0.38 + 0.62;
    const c = Math.sin(i * 0.53 + 2.4) * 0.22;
    return Math.max(0.1, Math.min(1, a * b + c));
  }), []);
  const headIdx = Math.floor((progress / 100) * N);

  return (
    <div style={{
      padding: "16px 40px 8px",
    }}>
      <div style={{
        position: "relative", height: 78,
        display: "flex", alignItems: "center", gap: 2,
      }}>
        {heights.map((h, i) => {
          const past = i < headIdx - 1;
          const head = i >= headIdx - 1 && i <= headIdx + 1;
          const future = i > headIdx + 1;
          const fromCenter = Math.abs(i - headIdx);
          return (
            <div key={i} style={{
              flex: 1, position: "relative",
              height: `${h * 100}%`,
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: head
                  ? accent
                  : past
                    ? `${accent}cc`
                    : future
                      ? "var(--inactive)"
                      : accent,
                borderRadius: 1,
                transformOrigin: "center",
                animation: head ? "barPulse 0.6s ease-in-out infinite" : "none",
                opacity: future ? Math.max(0.55, 1 - fromCenter * 0.005) : 1,
              }} />
            </div>
          );
        })}

        {/* Word callout above current position */}
        {currentWord && progress > 1 && progress < 99 && (
          <div style={{
            position: "absolute", left: `${(progress / 100) * 100}%`,
            top: -2, transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            pointerEvents: "none",
            transition: "left .25s cubic-bezier(.3,.7,.4,1)",
          }}>
            <div style={{
              padding: "3px 10px", borderRadius: 999,
              background: "var(--accent)", color: "#fff",
              fontFamily: "var(--serif)", fontSize: 13, fontWeight: 500,
              letterSpacing: "0.005em",
              boxShadow: "0 4px 10px rgba(31,30,27,0.25)",
              whiteSpace: "nowrap",
            }}>{currentWord}</div>
            <div style={{
              width: 0, height: 0, marginTop: -1,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid var(--accent)",
            }} />
          </div>
        )}
      </div>

      {/* timestamps + scrub area */}
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 6,
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)",
        letterSpacing: "0.04em",
      }}>
        <span>00:00</span>
        <span style={{ color: accent }}>
          {(() => {
            const sec = Math.floor((progress / 100) * 767);
            return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
          })()} / 12:47
        </span>
        <span>12:47</span>
      </div>
    </div>
  );
}

function WordFeed({ words, accent }) {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [words.length]);
  return (
    <div ref={containerRef} style={{
      flex: 1, overflow: "hidden",
      fontFamily: "var(--serif)", fontSize: 21, lineHeight: 1.5,
      color: "var(--ink-2)", letterSpacing: "-0.005em",
    }}>
      {words.map((w, i) => {
        const fresh = i >= words.length - 4;
        const veryFresh = i === words.length - 1;
        return (
          <span key={i} style={{
            display: "inline",
            opacity: i < words.length - 50 ? 0.35 : (fresh ? 1 : 0.7),
            color: veryFresh ? accent : "inherit",
            fontWeight: veryFresh ? 500 : 400,
            animation: fresh ? "wordIn .25s ease-out both" : "none",
          }}>{w} </span>
        );
      })}
      <span style={{
        display: "inline-block", width: 2, height: 19,
        verticalAlign: "-3px", marginLeft: 2,
        background: accent, animation: "caret 1s steps(1) infinite",
      }} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 60 }}>
      <div style={{
        fontFamily: "var(--sans)", fontSize: 9.5, fontWeight: 600,
        color: "var(--ink-4)", letterSpacing: "0.08em", textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 13.5, color: "var(--ink)",
        fontVariantNumeric: "tabular-nums", marginTop: 2,
      }}>{value}</div>
    </div>
  );
}

function PulseAvatar({ accent }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 11,
      background: `${accent}14`, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 11,
        border: `1.5px solid ${accent}`,
        animation: "pulse 1.5s ease-in-out infinite",
      }} />
      <div style={{
        width: 12, height: 12, borderRadius: 3.5,
        background: accent,
      }} />
    </div>
  );
}

function shade(hex, amt) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r + (255 - r) * amt));
  g = Math.min(255, Math.round(g + (255 - g) * amt));
  b = Math.min(255, Math.round(b + (255 - b) * amt));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

window.TranscribingScreen = TranscribingScreen;
window.__shade = shade;
