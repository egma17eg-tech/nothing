// screens.jsx — Main, Transcribing, Done

// ── MAIN SCREEN ─────────────────────────────────────────────
function MainScreen({ t, setTweak, onTranscribe, file, setFile, lang, setLang, accuracy, setAccuracy, words, setWords }) {
  const [dragOver, setDragOver] = React.useState(false);

  const getAudioDuration = (filePath) => new Promise((resolve) => {
    const a = new Audio();
    a.onloadedmetadata = () => {
      const t = a.duration;
      if (!isFinite(t)) { resolve("—"); return; }
      const m = Math.floor(t / 60);
      const s = String(Math.floor(t % 60)).padStart(2,'0');
      resolve(`${m}:${s}`);
    };
    a.onerror = () => resolve("—");
    a.src = `file://${filePath}`;
  });

  const pickRealFile = async () => {
    if (window.seyamii) {
      const f = await window.seyamii.openFile();
      if (f) {
        const dur = await getAudioDuration(f.path);
        setFile({ name: f.name, size: f.size, path: f.path, duration: dur, sampleRate: "audio" });
      }
    }
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (dropped && dropped.path) {
      const durD = await getAudioDuration(dropped.path);
      setFile({ name: dropped.name, size: (dropped.size/(1024*1024)).toFixed(1)+" MB", path: dropped.path, duration: durD, sampleRate: "audio" });
    } else {
      pickRealFile();
    }
  };
  const handleClick = () => { pickRealFile(); };

  return (
    <div style={{
      width: "100%", height: "100%", display: "grid",
      gridTemplateColumns: "1.15fr 1fr",
    }}>
      {/* LEFT — Drop zone */}
      <div style={{
        padding: "36px 28px 28px 40px",
        display: "flex", flexDirection: "column", gap: 18,
        background: "linear-gradient(180deg, var(--surf-main-a) 0%, var(--surf-main-b) 100%)",
        borderRight: "0.5px solid var(--line)",
      }}>
        <div>
          <Eyebrow>Source audio</Eyebrow>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 30, fontWeight: 400,
            letterSpacing: "-0.015em", color: "var(--ink)",
            marginTop: 6, lineHeight: 1.15,
          }}>
            Drop the file you want<br/>
            <em style={{ color: "var(--ink-3)" }}>turned into subtitles.</em>
          </div>
        </div>

        <DropZone
          dragOver={dragOver}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={handleClick}
          file={file}
          accent={t.accent}
          onClear={() => setFile(null)}
        />

        <div style={{
          display: "flex", gap: 16, fontFamily: "var(--sans)",
          fontSize: 11.5, color: "var(--ink-4)",
        }}>
          <span>WAV · MP3 · M4A · FLAC · MP4 · MOV</span>
          <span style={{ flex: 1 }} />
          <span>Up to 4 GB · processed locally</span>
        </div>
      </div>

      {/* RIGHT — Settings */}
      <div style={{
        padding: "36px 40px 28px 28px",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
      }}>
        <Eyebrow>Output settings</Eyebrow>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400,
          color: "var(--ink)", letterSpacing: "-0.01em", marginTop: 6,
          lineHeight: 1.25,
        }}>
          How should the SRT look?
        </div>

        <div style={{
          marginTop: 22, display: "flex", flexDirection: "column", gap: 22,
        }}>
          <Field label="Language" hint={lang === "ar" ? "Right-to-left output, diacritic-aware." : "Subtitles emitted in English, sentence-cased."}>
            <Segmented
              value={lang} onChange={setLang} accent={t.accent}
              options={[
                { value: "ar", label: "العربية" },
                { value: "en", label: "English" },
              ]}
            />
          </Field>

          <Field
            label="Words per subtitle"
            hint="Shorter cues read faster — typical for social cuts."
            right={
              <span style={{
                fontFamily: "var(--mono)", fontSize: 12,
                color: "var(--ink-2)", fontWeight: 500,
              }}>{words} {words === 1 ? "word" : "words"}</span>
            }
          >
            <StepSlider value={words} min={1} max={10}
              onChange={setWords} accent={t.accent} />
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: "var(--sans)", fontSize: 10.5,
              color: "var(--ink-4)", marginTop: 4,
            }}>
              <span>1 — kinetic</span>
              <span>10 — broadcast</span>
            </div>
          </Field>

          <Field
            label="Accuracy mode"
            right={(() => {
              const lvl = ACCURACY_LEVELS.find((l) => l.id === accuracy);
              const ready = t.enginesReady?.[accuracy];
              return (
                <span style={{
                  fontFamily: "var(--mono)", fontSize: 10.5,
                  color: ready ? "var(--ink-4)" : t.accent, letterSpacing: "0.04em",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {!ready && <span style={{
                    width: 5, height: 5, borderRadius: "50%", background: t.accent,
                  }} />}
                  {!ready && "Needs download"}
                </span>
              );
            })()}
          >
            <AccuracyPicker value={accuracy} onChange={setAccuracy}
              accent={t.accent} enginesReady={t.enginesReady || {}} />
          </Field>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginTop: 20,
        }}>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-4)",
            lineHeight: 1.4, flex: 1,
          }}>
            {file
              ? <>Estimated <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>
                  ~1m 24s</b> on this Mac.</>
              : <>Drop a file to begin.</>}
          </div>
          <button
            disabled={!file}
            onClick={onTranscribe}
            style={{
              height: 40, padding: "0 22px", borderRadius: 10,
              border: 0, cursor: file ? "default" : "not-allowed",
              background: file ? t.accent : "var(--inactive)",
              color: file ? "var(--on-accent)" : "var(--inactive-fg)",
              fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600,
              letterSpacing: "0.005em",
              boxShadow: file
                ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -4px rgba(168,76,42,0.4)"
                : "none",
              display: "flex", alignItems: "center", gap: 8,
              transition: "background .15s",
            }}>
            Transcribe
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, right, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{
          fontFamily: "var(--sans)", fontSize: 12.5, fontWeight: 600,
          color: "var(--ink)", letterSpacing: "0.005em",
        }}>{label}</div>
        <div style={{ flex: 1 }} />
        {right}
      </div>
      {children}
      {hint && (
        <div style={{
          fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-4)",
          lineHeight: 1.45,
        }}>{hint}</div>
      )}
    </div>
  );
}

function AccuracyPicker({ value, onChange, accent, enginesReady }) {
  const idx = ACCURACY_LEVELS.findIndex((l) => l.id === value);
  const cur = ACCURACY_LEVELS[idx] || ACCURACY_LEVELS[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${ACCURACY_LEVELS.length}, 1fr)`,
        gap: 4, padding: 3,
        background: "var(--surf-chip)", borderRadius: 9,
        border: "0.5px solid var(--line)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 3, bottom: 3,
          left: `calc(3px + ${idx} * (100% - 6px) / ${ACCURACY_LEVELS.length})`,
          width: `calc((100% - 6px) / ${ACCURACY_LEVELS.length})`,
          background: "var(--surf-chip-thumb)", borderRadius: 7,
          boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 0 0 0.5px var(--line)",
          transition: "left .18s cubic-bezier(.3,.7,.4,1)",
        }} />
        {ACCURACY_LEVELS.map((l) => {
          const on = l.id === value;
          const ready = enginesReady[l.id];
          return (
            <button key={l.id} onClick={() => onChange(l.id)}
              style={{
                position: "relative", zIndex: 1, height: 30,
                border: 0, background: "transparent", cursor: "default",
                fontFamily: "var(--sans)", fontSize: 12,
                fontWeight: on ? 600 : 500,
                color: on ? "var(--ink)" : "var(--ink-3)",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}>
              {l.label}
              {!ready && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: accent, opacity: 0.85,
                }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{
        padding: "10px 12px", borderRadius: 8,
        background: "var(--button-ghost-bg)",
        border: "0.5px solid var(--line)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <SizeBars idx={idx} accent={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500,
            color: "var(--ink)", lineHeight: 1.25,
          }}>{cur.caption}</div>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 10.5, color: "var(--ink-4)",
            marginTop: 2, letterSpacing: "0.01em",
          }}>
            {cur.label} · {cur.size} model · {cur.speed} real-time
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeBars({ idx, accent }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 2, height: 22,
    }}>
      {ACCURACY_LEVELS.map((_, i) => (
        <div key={i} style={{
          width: 4, height: 6 + i * 4, borderRadius: 1,
          background: i <= idx ? accent : "var(--inactive)",
          opacity: i <= idx ? 1 : 1,
        }} />
      ))}
    </div>
  );
}

function AccuracyToggle({ value, onChange, accent }) {
  const options = [
    { value: "fast", label: "Fast", caption: "Drafts, social cuts" },
    { value: "precise", label: "Precise", caption: "Final delivery" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{
              padding: "10px 12px", textAlign: "left",
              border: on
                ? `1px solid ${accent}`
                : "0.5px solid var(--line-2)",
              outline: on ? `2px solid ${accent}22` : "none",
              outlineOffset: 0,
              background: on ? "var(--surf-card)" : "var(--button-ghost-bg)",
              borderRadius: 9, cursor: "default",
              display: "flex", flexDirection: "column", gap: 2,
              transition: "all .12s",
            }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600,
              color: "var(--ink)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: on ? accent : "var(--inactive-2)",
              }} />
              {o.label}
            </div>
            <div style={{
              fontFamily: "var(--sans)", fontSize: 11, color: "var(--ink-4)",
            }}>{o.caption}</div>
          </button>
        );
      })}
    </div>
  );
}

function DropZone({ dragOver, onDragOver, onDragLeave, onDrop, onClick, file, accent, onClear }) {
  if (file) {
    return (
      <div style={{
        flex: 1, borderRadius: 14,
        border: "0.5px solid var(--line-2)",
        background: "var(--surf-card)",
        padding: 22,
        display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 24px -16px rgba(31,30,27,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Waveform accent={accent} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500,
              color: "var(--ink)", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{file.name}</div>
            <div style={{
              display: "flex", gap: 10, marginTop: 4,
              fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-4)",
            }}>
              <span>{file.duration}</span>
              <span>·</span>
              <span>{file.size}</span>
              <span>·</span>
              <span>{file.sampleRate}</span>
            </div>
          </div>
          <button onClick={onClear} style={{
            width: 28, height: 28, borderRadius: 8, border: 0,
            background: "rgba(31,30,27,0.05)", cursor: "default",
            color: "var(--ink-3)", fontFamily: "var(--sans)",
            fontSize: 14, lineHeight: 1,
          }}>✕</button>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <WaveformLarge accent={accent} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)",
          letterSpacing: "0.04em",
        }}>
          <span>00:00</span><span>03:11</span><span>06:23</span>
          <span>09:35</span><span>12:47</span>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} onDragOver={onDragOver}
      onDragLeave={onDragLeave} onDrop={onDrop}
      style={{
        flex: 1, borderRadius: 14, cursor: "default",
        border: `1.5px dashed ${dragOver ? accent : "rgba(31,30,27,0.18)"}`,
        background: dragOver
          ? `${accent}10`
          : "repeating-linear-gradient(135deg, var(--line) 0 8px, transparent 8px 16px), var(--surf-dropzone)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        padding: 32, textAlign: "center",
        transition: "all .15s",
      }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: dragOver ? accent : "var(--surf-card)",
        border: dragOver ? "none" : "0.5px solid var(--line-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: dragOver
          ? `0 8px 20px -6px ${accent}66`
          : "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 6px rgba(31,30,27,0.06)",
        transition: "all .15s",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4M12 4l-5 5M12 4l5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
            stroke={dragOver ? "var(--on-accent)" : "var(--ink-2)"}
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "var(--serif)", fontSize: 19, fontWeight: 500,
          color: "var(--ink)", letterSpacing: "-0.005em",
        }}>
          {dragOver ? "Release to load" : "Drop an audio or video file"}
        </div>
        <div style={{
          fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink-3)",
          marginTop: 4,
        }}>
          or <u style={{ color: accent, textUnderlineOffset: 3 }}>browse your library</u>
        </div>
      </div>
      <div style={{
        marginTop: 8, padding: "6px 10px", borderRadius: 999,
        background: "rgba(31,30,27,0.04)",
        fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-3)",
        letterSpacing: "0.04em",
      }}>
        ⌘O · open from disk
      </div>
    </div>
  );
}

function Waveform({ accent }) {
  const bars = Array.from({ length: 14 }, (_, i) =>
    8 + Math.abs(Math.sin(i * 1.3) * 16) + (i % 3) * 3);
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: `${accent}14`,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 1.5,
    }}>
      {bars.slice(0, 7).map((h, i) => (
        <div key={i} style={{
          width: 1.5, height: h, borderRadius: 1, background: accent, opacity: 0.85,
        }} />
      ))}
    </div>
  );
}

function WaveformLarge({ accent }) {
  // pseudo-random but stable bar heights
  const N = 120;
  const heights = React.useMemo(() => Array.from({ length: N }, (_, i) => {
    const a = Math.sin(i * 0.31) * 0.5 + 0.5;
    const b = Math.sin(i * 0.087 + 1) * 0.4 + 0.6;
    const c = Math.sin(i * 0.61 + 2.4) * 0.25;
    return Math.max(0.08, Math.min(1, a * b + c));
  }), []);
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", gap: 2,
    }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          flex: 1, height: `${h * 100}%`, minHeight: 2,
          background: `${accent}55`,
          borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

window.MainScreen = MainScreen;
window.AccuracyPicker = AccuracyPicker;
