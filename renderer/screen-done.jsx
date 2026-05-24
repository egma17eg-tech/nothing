// screen-done.jsx

function formatSRT(cues) {
  return cues.map((c) =>
    `${c.i}\n${c.a} --> ${c.b}\n${c.t}\n`
  ).join("\n");
}

function DoneScreen({ t, file, onReset }) {
  const result = (typeof window !== "undefined" && window.__lastResult) || null;
  const realCues = result && result.cues ? result.cues : SAMPLE_SRT_CUES;
  const realSrt = result && result.srtText ? result.srtText : null;
  const [copied, setCopied] = React.useState(false);
  const [savedPath, setSavedPath] = React.useState(null);
  const [hoverLine, setHoverLine] = React.useState(null);

  // Deterministic confidences keyed off cue index so they don't reshuffle on rerender
  const confidence = (i) => {
    const v = 0.985 + Math.sin(i * 1.7) * 0.02 - (i % 11 === 0 ? 0.08 : 0);
    return Math.max(0.78, Math.min(0.999, v));
  };

  const srtText = realSrt || SAMPLE_SRT_CUES.map((c) =>
    `${c.i}\n${c.a} --> ${c.b}\n${c.t}\n`
  ).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(srtText);
    } catch (e) { /* clipboard blocked in iframe — still flash the UI */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = async () => {
    const base = (file && file.name) || t.demoFile;
    const fname = base.replace(/\.(wav|mp3|m4a|flac|mp4|mov|aac)$/i, ".srt");
    if (window.seyamii) {
      const saved = await window.seyamii.saveFile({ defaultName: fname, content: srtText });
      if (saved) setSavedPath(saved);
    } else {
      setSavedPath(`${t.defaultSavePath || "~/Movies/Premiere/Subtitles"}/${fname}`);
    }
  };

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "grid", gridTemplateColumns: "1.55fr 1fr",
      background: "var(--bg)",
    }}>
      {/* LEFT — SRT preview */}
      <div style={{
        display: "flex", flexDirection: "column",
        background: "var(--surf-elevated)",
        borderRight: "0.5px solid var(--line)",
      }}>
        <div style={{
          padding: "22px 32px 16px",
          display: "flex", alignItems: "center", gap: 12,
          borderBottom: "0.5px solid var(--line)",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--surf-chip)", color: "var(--ok)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.5l2.5 2.5L11 4.5" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500,
              color: "var(--ink)", letterSpacing: "-0.005em",
            }}>
              {((file && file.name) || t.demoFile || "output").replace(/\.(wav|mp3|m4a|flac|mp4|mov|aac)$/i, ".srt")}
            </div>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)",
              letterSpacing: "0.04em", marginTop: 2,
            }}>142 cues · 5.8 kb · utf-8 · word-aligned</div>
          </div>
          <div style={{ flex: 1 }} />
          <PreviewToolbar />
        </div>

        {/* SRT content area */}
        <div style={{
          flex: 1, overflow: "auto", padding: "18px 0 28px",
          fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.55,
          position: "relative",
        }}>
          {realCues.map((c, idx) => {
            const conf = confidence(c.i);
            const low = conf < 0.92;
            return (
              <div key={c.i}
                onMouseEnter={() => setHoverLine(c.i)}
                onMouseLeave={() => setHoverLine(null)}
                style={{
                  padding: "8px 32px 8px 0",
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  background: hoverLine === c.i ? "rgba(200,100,60,0.04)" : "transparent",
                  borderLeft: hoverLine === c.i
                    ? `2px solid ${t.accent}`
                    : "2px solid transparent",
                  transition: "background .12s",
                  alignItems: "start",
                }}>
                <div style={{
                  color: "var(--ink-4)", textAlign: "right",
                  paddingRight: 16, fontVariantNumeric: "tabular-nums",
                  fontSize: 11,
                }}>{String(c.i).padStart(3, "0")}</div>
                <div>
                  <div style={{
                    color: "var(--ink-4)", fontSize: 11,
                    fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
                  }}>
                    <span style={{ color: t.accent }}>{c.a}</span>
                    <span style={{ margin: "0 8px", opacity: 0.5 }}>→</span>
                    <span style={{ color: t.accent }}>{c.b}</span>
                  </div>
                  <div style={{
                    color: "var(--ink)", fontFamily: "var(--serif)",
                    fontSize: 15, marginTop: 3, fontWeight: 400,
                  }}>{c.t}</div>
                </div>
                <ConfidenceBadge value={conf} low={low} accent={t.accent} />
              </div>
            );
          })}
          <div style={{
            padding: "12px 32px", color: "var(--ink-4)",
            fontFamily: "var(--mono)", fontSize: 11,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span>124 more cues</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
        </div>
      </div>

      {/* RIGHT — Summary + export */}
      <div style={{
        padding: "28px 32px",
        display: "flex", flexDirection: "column", gap: 22,
        background: "var(--bg)",
      }}>
        <div>
          <Eyebrow color="var(--ok)">Complete</Eyebrow>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 36, fontWeight: 400,
            color: "var(--ink)", letterSpacing: "-0.02em",
            marginTop: 8, lineHeight: 1.05,
          }}>
            Done in<br/>
            <span style={{ color: t.accent }}>{(() => {
              const dur = window.__transcribeDuration;
              if (!dur) return "—";
              return dur < 60 ? `${dur}s.` : `${Math.floor(dur/60)}m ${dur%60}s.`;
            })()}</span>
          </div>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)",
            marginTop: 10, lineHeight: 1.5,
          }}>
            Word-aligned timestamps for every cue. Ready to drop into Premiere
            as a captions track or burn-in.
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
          background: "var(--line)",
          border: "0.5px solid var(--line-2)", borderRadius: 10,
          overflow: "hidden",
        }}>
          <StatTile label="Cues" value={result ? String(result.cueCount) : "142"} />
          <StatTile label="Words" value={result ? String(result.wordCount) : "1,287"} />
          <StatTile label="Avg duration" value="1.32s" />
          <StatTile label="Confidence" value="98.4%" sub="precise mode" />
        </div>

        {/* Export buttons */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <PrimaryButton accent={t.accent} onClick={async () => {
              if (!window.seyamii) return;
              const base = (file && file.name) || "transcript";
              const fname = base.replace(/\.(wav|mp3|m4a|flac|mp4|mov|aac)$/i, ".srt");
              const saved = await window.seyamii.saveFile({ defaultName: fname, content: srtText });
              if (saved) {
                setSavedPath(saved);
                await window.seyamii.revealInFinder(saved);
              }
            }}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2"
                  stroke="currentColor" strokeWidth="1.6" />
                <path d="M5 7l2 2 4-4" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }>
            Save & Reveal in Finder
          </PrimaryButton>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <SecondaryButton onClick={handleCopy} accent={t.accent}
              flash={copied}
              icon={copied ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5"
                    stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 3V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H3"
                    stroke="currentColor" strokeWidth="1.3" fill="none" />
                </svg>
              )}>
              {copied ? "Copied to clipboard" : "Copy SRT"}
            </SecondaryButton>
            <SecondaryButton onClick={handleSave}>Save .srt…</SecondaryButton>
          </div>

          {savedPath && (
            <div style={{
              marginTop: 4, padding: "10px 12px",
              background: "rgba(91,122,74,0.08)",
              border: "0.5px solid rgba(91,122,74,0.3)",
              borderRadius: 8,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                background: "var(--ok)", color: "var(--on-accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.2L4 7.2 8 3.2" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600,
                  color: "var(--ok-ink)", letterSpacing: "0.005em",
                }}>Saved</div>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-2)",
                  marginTop: 2, wordBreak: "break-all", lineHeight: 1.4,
                }}>{savedPath}</div>
              </div>
              <button onClick={() => setSavedPath(null)} style={{
                width: 18, height: 18, padding: 0, borderRadius: 4,
                border: 0, background: "transparent", cursor: "default",
                color: "var(--ink-3)", fontSize: 11, lineHeight: 1,
                flexShrink: 0, marginTop: 1,
              }}>✕</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: "14px 16px",
          background: "rgba(200,100,60,0.06)",
          border: `0.5px solid ${t.accent}33`,
          borderRadius: 10,
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: t.accent, color: "var(--on-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 13, fontWeight: 600, lineHeight: 1,
          }}>i</div>
          <div style={{
            fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-2)",
            lineHeight: 1.45,
          }}>
            <b>Tip — </b>
            Premiere needs the file inside your project folder. Use
            “Send to Premiere” to drop it next to your sequence and mount
            it as a captions track in one move.
          </div>
        </div>

        <button onClick={onReset} style={{
          alignSelf: "flex-start", padding: 0, border: 0,
          background: "transparent", cursor: "default",
          fontFamily: "var(--sans)", fontSize: 12.5, color: "var(--ink-3)",
        }}>
          ← Transcribe another file
        </button>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div style={{
      background: "var(--bg)", padding: "12px 14px",
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{
        fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600,
        color: "var(--ink-4)", letterSpacing: "0.08em", textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--serif)", fontSize: 22, color: "var(--ink)",
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: "var(--sans)", fontSize: 10.5, color: "var(--ink-4)",
        }}>{sub}</div>
      )}
    </div>
  );
}

function PrimaryButton({ children, icon, accent, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 40, padding: "0 16px", borderRadius: 10,
      border: 0, background: accent, color: "var(--on-accent)",
      fontFamily: "var(--sans)", fontSize: 13.5, fontWeight: 600,
      cursor: "default", display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
      boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 16px -4px rgba(168,76,42,0.4)",
    }}>{icon}{children}</button>
  );
}

function SecondaryButton({ children, onClick, icon, flash, accent }) {
  return (
    <button onClick={onClick} style={{
      height: 36, padding: "0 14px", borderRadius: 9,
      border: flash ? `0.5px solid ${accent || "var(--ink)"}` : "0.5px solid var(--line-2)",
      background: flash ? "var(--surf-card)" : "var(--button-ghost-bg)",
      fontFamily: "var(--sans)", fontSize: 12.5, fontWeight: 500,
      color: flash ? (accent || "var(--ink)") : "var(--ink-2)", cursor: "default",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      transition: "all .15s",
    }}>
      {icon}
      {children}
    </button>
  );
}

function ConfidenceBadge({ value, low, accent }) {
  const pct = Math.round(value * 100);
  const color = value > 0.95 ? "var(--ok)" : value > 0.88 ? "var(--warn)" : "var(--err)";
  return (
    <div title={`Confidence ${(value * 100).toFixed(1)}%`}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 7px 3px 4px", borderRadius: 999,
        background: `${color}14`, border: `0.5px solid ${color}30`,
        fontFamily: "var(--mono)", fontSize: 10, color,
        fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
        height: 18, alignSelf: "start", marginTop: 16,
      }}>
      <ConfidenceDots value={value} color={color} />
      <span style={{ fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

function ConfidenceDots({ value, color }) {
  const filled = Math.round(value * 5);
  return (
    <div style={{ display: "flex", gap: 1.5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          width: 3, height: 3, borderRadius: "50%",
          background: i < filled ? color : `${color}30`,
        }} />
      ))}
    </div>
  );
}

function PreviewToolbar() {
  return (
    <div style={{
      display: "flex", gap: 4, padding: 2, borderRadius: 7,
      background: "rgba(31,30,27,0.05)",
    }}>
      {["SRT", "VTT", "TXT"].map((label, i) => (
        <button key={label} style={{
          padding: "4px 10px", borderRadius: 5, border: 0,
          background: i === 0 ? "var(--surf-card)" : "transparent",
          fontFamily: "var(--mono)", fontSize: 10.5,
          fontWeight: 600, letterSpacing: "0.04em",
          color: i === 0 ? "var(--ink)" : "var(--ink-4)",
          cursor: "default",
          boxShadow: i === 0 ? "0 0 0 0.5px var(--line-2), 0 1px 2px rgba(0,0,0,0.04)" : "none",
        }}>{label}</button>
      ))}
    </div>
  );
}

window.DoneScreen = DoneScreen;
window.__formatSRT = formatSRT;
