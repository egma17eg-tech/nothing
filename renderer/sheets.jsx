// sheets.jsx — Settings + History sheets

function SheetOverlay({ children, onClose, title, eyebrow, accent }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      opacity: 1,
    }}>
      {/* dim */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(31,30,27,0.18)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }} />
      {/* sheet */}
      <div style={{
        position: "absolute", left: 28, right: 28, top: 14, bottom: 14,
        background: "var(--bg)",
        border: "0.5px solid var(--line-2)",
        borderRadius: 12,
        boxShadow: "0 24px 60px -10px rgba(31,30,27,0.4), 0 1px 0 rgba(255,255,255,0.5) inset",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 28px 18px",
          borderBottom: "0.5px solid var(--line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <Eyebrow color={accent}>{eyebrow}</Eyebrow>
            <div style={{
              fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400,
              color: "var(--ink)", letterSpacing: "-0.01em", marginTop: 4,
            }}>{title}</div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8,
            border: "0.5px solid var(--line-2)",
            background: "var(--button-ghost-bg)",
            cursor: "default", color: "var(--ink-3)",
            fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1,
          }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes sheetFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes sheetSlideIn { from{transform:translateY(-12px);opacity:0} to{transform:none;opacity:1} }
      `}</style>
    </div>
  );
}

// ── SETTINGS ────────────────────────────────────────────────
function SettingsSheet({ t, setTweak, setTheme, onClose }) {
  const [editingPath, setEditingPath] = React.useState(false);
  return (
    <SheetOverlay onClose={onClose}
      eyebrow="App preferences" title="Settings" accent={t.accent}>
      <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        <SettingRow
          label="Theme"
          help="Changes the entire app instantly. Your accent color snaps to match."
        >
          <ThemePicker value={t.theme || "creative"} onChange={setTheme} />
        </SettingRow>
        <SettingRow
          label="Default save location"
          help="Where new .srt files are written when you click Save."
        >
          <div style={{
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <div style={{
              flex: 1, height: 32, padding: "0 12px", borderRadius: 8,
              border: "0.5px solid var(--line-2)",
              background: "var(--surf-card)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <FolderGlyph accent={t.accent} />
              <input
                value={t.defaultSavePath || "~/Movies/Premiere/Subtitles"}
                onChange={(e) => setTweak("defaultSavePath", e.target.value)}
                style={{
                  flex: 1, minWidth: 0, border: 0, outline: 0,
                  background: "transparent", fontFamily: "var(--mono)",
                  fontSize: 12, color: "var(--ink-2)",
                  letterSpacing: "0.01em",
                }} />
            </div>
            <button style={{
              height: 32, padding: "0 14px", borderRadius: 8,
              border: "0.5px solid var(--line-2)",
              background: "var(--button-ghost-bg)",
              fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500,
              color: "var(--ink-2)", cursor: "default",
            }}>Choose…</button>
          </div>
          <RecentPaths accent={t.accent} setTweak={setTweak} />
        </SettingRow>

        <SettingRow
          label="Default language"
          help="Pre-selected on the main screen for new files."
        >
          <Segmented
            value={t.defaultLang}
            onChange={(v) => setTweak("defaultLang", v)}
            accent={t.accent}
            options={[
              { value: "ar", label: "العربية" },
              { value: "en", label: "English" },
            ]}
          />
        </SettingRow>

        <SettingRow
          label="Default accuracy level"
          help="Used for new transcriptions. You can still override per file."
        >
          <AccuracyPicker
            value={t.defaultAccuracy}
            onChange={(v) => setTweak("defaultAccuracy", v)}
            accent={t.accent}
            enginesReady={t.enginesReady || {}}
          />
        </SettingRow>

        <div style={{
          padding: "14px 16px",
          background: "rgba(31,30,27,0.03)",
          border: "0.5px solid var(--line)",
          borderRadius: 10,
          display: "flex", gap: 14, alignItems: "center",
        }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)",
            letterSpacing: "0.04em",
          }}>
            ENGINES INSTALLED
          </div>
          <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ACCURACY_LEVELS.map((l) => {
              const on = t.enginesReady?.[l.id];
              return (
                <div key={l.id} style={{
                  padding: "3px 9px", borderRadius: 999,
                  background: on ? `${t.accent}14` : "rgba(31,30,27,0.04)",
                  border: on ? `0.5px solid ${t.accent}40` : "0.5px solid var(--line)",
                  fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500,
                  color: on ? t.accent : "var(--ink-4)",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: on ? t.accent : "var(--ink-4)",
                    opacity: on ? 1 : 0.4,
                  }} />
                  {l.label}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setTweak("enginesReady", {
              draft: true, quick: true, balanced: true, precise: false, studio: false,
            })}
            style={{
              height: 26, padding: "0 10px", borderRadius: 6,
              border: "0.5px solid var(--line-2)",
              background: "var(--button-ghost-bg)",
              fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500,
              color: "var(--ink-3)", cursor: "default",
            }}>Reset</button>
        </div>
      </div>
    </SheetOverlay>
  );
}

function SettingRow({ label, help, children }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "220px 1fr",
      gap: 32, alignItems: "start",
    }}>
      <div>
        <div style={{
          fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600,
          color: "var(--ink)", letterSpacing: "0.005em",
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--sans)", fontSize: 11.5, color: "var(--ink-3)",
          marginTop: 4, lineHeight: 1.45,
        }}>{help}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function RecentPaths({ accent, setTweak }) {
  const paths = [
    "~/Movies/Premiere/Subtitles",
    "~/Desktop",
    "~/Dropbox/Clients/Acme/Episodes",
  ];
  return (
    <div style={{
      display: "flex", gap: 6, flexWrap: "wrap",
      fontFamily: "var(--mono)", fontSize: 10.5,
    }}>
      <span style={{
        color: "var(--ink-4)", padding: "3px 0",
        fontFamily: "var(--sans)", letterSpacing: "0.04em",
        textTransform: "uppercase", fontSize: 9.5, fontWeight: 600,
      }}>RECENT</span>
      {paths.map((p) => (
        <button key={p}
          onClick={() => setTweak("defaultSavePath", p)}
          style={{
            padding: "3px 8px", borderRadius: 5,
            border: "0.5px solid var(--line)",
            background: "var(--button-ghost-bg)",
            color: "var(--ink-2)", cursor: "default",
            fontFamily: "var(--mono)", fontSize: 10.5,
          }}>{p}</button>
      ))}
    </div>
  );
}

function FolderGlyph({ accent }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1.5 4a1 1 0 0 1 1-1h3l1 1.5h5a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4z"
        fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="0.8" />
    </svg>
  );
}

// ── HISTORY ─────────────────────────────────────────────────
const HISTORY_ITEMS = [
  { name: "ep_047_creativity_raw.wav",       date: "Today, 11:42",       words: 1287, lang: "en", level: "balanced", duration: "12:47" },
  { name: "client_intake_amal_v2.m4a",       date: "Today, 09:18",       words: 642,  lang: "ar", level: "precise",  duration: "06:21" },
  { name: "ep_046_attention_master.wav",     date: "Yesterday, 16:55",   words: 2104, lang: "en", level: "studio",   duration: "21:08" },
  { name: "investor_call_q1_review.mp4",     date: "Yesterday, 10:02",   words: 3812, lang: "en", level: "balanced", duration: "38:14" },
  { name: "lecture_03_morphology.mp3",       date: "Mon · May 19",       words: 5021, lang: "ar", level: "balanced", duration: "52:38" },
  { name: "interview_safiya_b_roll.wav",     date: "Mon · May 19",       words: 312,  lang: "ar", level: "quick",    duration: "03:55" },
  { name: "ep_045_first_drafts.wav",         date: "Sun · May 18",       words: 1844, lang: "en", level: "precise",  duration: "16:32" },
  { name: "promo_cut_30s_alt2.mov",          date: "Fri · May 16",       words: 78,   lang: "en", level: "draft",    duration: "00:30" },
  { name: "team_standup_archive.m4a",        date: "Thu · May 15",       words: 992,  lang: "en", level: "quick",    duration: "11:47" },
];

function HistorySheet({ t, onClose }) {
  const [q, setQ] = React.useState("");
  const filtered = HISTORY_ITEMS.filter((h) =>
    !q || h.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <SheetOverlay onClose={onClose}
      eyebrow="Recent transcriptions" title="History" accent={t.accent}>
      <div style={{ padding: "18px 28px 12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 12px", height: 34, borderRadius: 8,
          background: "var(--button-ghost-bg)",
          border: "0.5px solid var(--line-2)",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="var(--ink-3)" strokeWidth="1.4" />
            <path d="M8.5 8.5l3 3" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search 142 files…"
            style={{
              flex: 1, border: 0, outline: 0, background: "transparent",
              fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink)",
            }} />
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-4)",
            letterSpacing: "0.04em",
          }}>{filtered.length} / {HISTORY_ITEMS.length}</div>
        </div>
      </div>

      <div style={{
        padding: "0 28px",
        display: "grid",
        gridTemplateColumns: "minmax(0,2fr) 130px 90px 90px 110px 32px",
        gap: 16, alignItems: "center",
        height: 32,
        fontFamily: "var(--sans)", fontSize: 10, fontWeight: 600,
        color: "var(--ink-4)", letterSpacing: "0.08em", textTransform: "uppercase",
        borderBottom: "0.5px solid var(--line)",
      }}>
        <div>File</div>
        <div>Date</div>
        <div style={{ textAlign: "right" }}>Words</div>
        <div>Language</div>
        <div>Accuracy</div>
        <div></div>
      </div>

      <div>
        {filtered.map((h, i) => (
          <HistoryRow key={i} item={h} accent={t.accent} />
        ))}
        {filtered.length === 0 && (
          <div style={{
            padding: "40px", textAlign: "center",
            fontFamily: "var(--serif)", fontStyle: "italic",
            fontSize: 15, color: "var(--ink-4)",
          }}>No matches.</div>
        )}
      </div>
    </SheetOverlay>
  );
}

function HistoryRow({ item, accent }) {
  const [hover, setHover] = React.useState(false);
  const level = ACCURACY_LEVELS.find((l) => l.id === item.level);
  const langLabel = item.lang === "ar" ? "العربية" : "English";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "0 28px",
        display: "grid",
        gridTemplateColumns: "minmax(0,2fr) 130px 90px 90px 110px 32px",
        gap: 16, alignItems: "center",
        height: 52, cursor: "default",
        background: hover ? "rgba(200,100,60,0.04)" : "transparent",
        borderBottom: "0.5px solid var(--line)",
        transition: "background .12s",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <FileIcon ext={item.name.split(".").pop()} accent={accent} />
        <div style={{
          flex: 1, minWidth: 0,
        }}>
          <div style={{
            fontFamily: "var(--serif)", fontSize: 14, fontWeight: 500,
            color: "var(--ink)", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{item.name}</div>
          <div style={{
            fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)",
            letterSpacing: "0.03em",
          }}>{item.duration}</div>
        </div>
      </div>
      <div style={{
        fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)",
      }}>{item.date}</div>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--ink-2)",
        fontVariantNumeric: "tabular-nums", textAlign: "right",
      }}>{item.words.toLocaleString()}</div>
      <div style={{
        fontFamily: item.lang === "ar" ? "var(--serif)" : "var(--sans)",
        fontSize: 12.5, color: "var(--ink-2)",
      }}>{langLabel}</div>
      <div>
        <LevelChip level={level} accent={accent} />
      </div>
      <button style={{
        width: 24, height: 24, borderRadius: 6, border: 0,
        background: hover ? "rgba(31,30,27,0.06)" : "transparent",
        color: "var(--ink-3)", cursor: "default",
        fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1,
      }}>⋯</button>
    </div>
  );
}

function FileIcon({ ext, accent }) {
  const isVideo = ["mp4", "mov"].includes(ext);
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 7,
      background: isVideo ? "rgba(91,110,143,0.14)" : `${accent}14`,
      color: isVideo ? "var(--ink-3)" : accent,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
      }}>{ext}</div>
    </div>
  );
}

function LevelChip({ level, accent }) {
  if (!level) return null;
  const idx = ACCURACY_LEVELS.findIndex((l) => l.id === level.id);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px 3px 6px", borderRadius: 999,
      background: "rgba(31,30,27,0.04)",
      border: "0.5px solid var(--line)",
      fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500,
      color: "var(--ink-2)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            width: 2, height: 2 + i * 2, borderRadius: 0.5,
            background: i <= idx ? accent : "var(--inactive-2)",
          }} />
        ))}
      </div>
      {level.label}
    </div>
  );
}

window.SettingsSheet = SettingsSheet;
window.HistorySheet = HistorySheet;

// ── Theme picker ────────────────────────────────────────────
function ThemePicker({ value, onChange }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
    }}>
      {THEMES.map((th) => {
        const on = th.id === value;
        return (
          <button key={th.id} onClick={() => onChange(th.id)}
            style={{
              padding: 0, border: 0, background: "transparent",
              cursor: "default", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
            <ThemeSwatch theme={th} on={on} />
            <div style={{
              display: "flex", flexDirection: "column", gap: 1,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "var(--sans)", fontSize: 12.5, fontWeight: 600,
                color: "var(--ink)",
              }}>
                {on && <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "var(--accent)",
                }} />}
                {th.label}
              </div>
              <div style={{
                fontFamily: "var(--sans)", fontSize: 10.5, color: "var(--ink-4)",
                letterSpacing: "0.01em",
              }}>{th.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ThemeSwatch({ theme, on }) {
  // Mini-window preview of each theme; mirrors the real app's layout.
  const isNothing = theme.style === "nothing";
  const T = {
    bg: theme.bg, ink: theme.ink, accent: theme.accent,
  };
  // Per-theme palette for the swatch
  const swatches = {
    "creative":      { surf: "#fdfcf7", chrome: "#efebde", grid: "#1f1e1b0d", panel: "#ffffff" },
    "creative-dark": { surf: "#2c281e", chrome: "#221f17", grid: "#f0ebda0d", panel: "#322e23" },
    "nothing-light": { surf: "#ededed", chrome: "#e4e4e4", grid: "#0000001a", panel: "#ffffff" },
    "nothing-dark":  { surf: "#141414", chrome: "#0c0c0c", grid: "#ffffff1a", panel: "#1f1f1f" },
  }[theme.id];

  return (
    <div style={{
      position: "relative",
      borderRadius: isNothing ? 3 : 8,
      overflow: "hidden", background: T.bg,
      border: on ? `1.5px solid ${T.accent}` : `0.5px solid var(--line-2)`,
      outline: on ? `3px solid ${T.accent}26` : "none",
      boxShadow: on ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
      aspectRatio: "4 / 3",
      transition: "all .15s",
    }}>
      {/* dot grid background for Nothing */}
      {isNothing && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${swatches.grid} 1px, transparent 0)`,
          backgroundSize: "6px 6px",
        }} />
      )}
      {/* chrome strip */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 12,
        background: swatches.chrome,
        display: "flex", alignItems: "center", gap: 2.5, padding: "0 4px",
        borderBottom: `0.5px solid ${T.ink}1a`,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 3.5, height: 3.5, borderRadius: "50%",
            background: isNothing ? T.ink : ["#ff5f57", "#febc2e", "#28c840"][i],
            opacity: isNothing ? 0.6 : 1,
          }} />
        ))}
      </div>
      {/* split panels */}
      <div style={{
        position: "absolute", left: 6, right: 6, top: 18, bottom: 8,
        display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 4,
      }}>
        <div style={{
          background: swatches.panel, borderRadius: isNothing ? 2 : 4,
          border: `0.5px solid ${T.ink}1a`,
          padding: "4px 5px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          {/* Mini waveform */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 1, height: 12,
          }}>
            {[3, 7, 5, 10, 8, 11, 6, 9, 7, 4, 8].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: h, background: T.accent, borderRadius: 0.5,
                opacity: i < 4 ? 1 : 0.5,
              }} />
            ))}
          </div>
          {/* Mini text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <div style={{ height: 2, width: "60%", background: T.ink, opacity: 0.7, borderRadius: 1 }} />
            <div style={{ height: 2, width: "80%", background: T.ink, opacity: 0.3, borderRadius: 1 }} />
          </div>
        </div>
        <div style={{
          background: swatches.surf, borderRadius: isNothing ? 2 : 4,
          border: `0.5px solid ${T.ink}1a`,
          padding: "4px 5px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <div style={{ height: 2.5, width: "70%", background: T.ink, opacity: 0.85, borderRadius: 1 }} />
            <div style={{ height: 1.5, width: "50%", background: T.ink, opacity: 0.3, borderRadius: 1 }} />
          </div>
          <div style={{
            height: 6, background: T.accent,
            borderRadius: isNothing ? 1 : 2,
          }} />
        </div>
      </div>
    </div>
  );
}

window.ThemePicker = ThemePicker;
