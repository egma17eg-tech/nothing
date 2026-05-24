// Seyamii Slate — macOS app prototype
// Three screens: Main → Transcribing → Done

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "screen": "main",
  "accent": "#c8643c",
  "showChrome": true,
  "demoFile": "",
  "defaultLang": "en",
  "defaultAccuracy": "balanced",
  "defaultSavePath": "~/Movies/Premiere/Subtitles",
  "theme": "creative",
  "enginesReady": { "draft": true, "quick": true, "balanced": true, "precise": false, "studio": false }
}/*EDITMODE-END*/;

const THEMES = [
  { id: "creative",       label: "Creative",       sub: "Warm beige",       bg: "#faf9f5", ink: "#1f1e1b", accent: "#c8643c", style: "claude" },
  { id: "creative-dark",  label: "Creative Dark",  sub: "Toasted",          bg: "#24211a", ink: "#f0ebda", accent: "#e8a075", style: "claude" },
  { id: "nothing-light",  label: "Nothing Light",  sub: "Spec sheet",       bg: "#f4f4f4", ink: "#0a0a0a", accent: "#d12015", style: "nothing" },
  { id: "nothing-dark",   label: "Nothing Dark",   sub: "Glyph",            bg: "#0c0c0c", ink: "#ffffff", accent: "#d12015", style: "nothing" },
];

const ACCURACY_LEVELS = [
  { id: "draft",    label: "Draft",    caption: "Get the gist",                  size: "75 MB",  speed: "12×", bytes: 78_853_867 },
  { id: "quick",    label: "Quick",    caption: "Good enough to edit",           size: "148 MB", speed: "8×",  bytes: 155_149_095 },
  { id: "balanced", label: "Balanced", caption: "Most people stop here",         size: "484 MB", speed: "4×",  bytes: 507_715_251 },
  { id: "precise",  label: "Precise",  caption: "When it has to be right",       size: "1.53 GB",speed: "1.4×",bytes: 1_642_279_504 },
  { id: "studio",   label: "Studio",   caption: "Frame-perfect, no compromises", size: "3.09 GB",speed: "0.6×",bytes: 3_321_079_095 },
];

// ── Sample data ─────────────────────────────────────────────
const SAMPLE_WORDS = (
  "the thing about creativity that nobody really tells you is that it's mostly " +
  "sitting in a room with yourself for a long time and being okay with the fact " +
  "that what you're making might not be any good and that's actually the work " +
  "right learning to stay in that uncomfortable place long enough for something " +
  "honest to come out so when people ask me how do you stay productive i think " +
  "the question itself is kind of off the productivity isn't the point the point " +
  "is the quality of attention you bring to the thing in front of you"
).split(/\s+/);

const SAMPLE_SRT_CUES = [
  { i: 1,  a: "00:00:00,120", b: "00:00:01,480", t: "The thing about" },
  { i: 2,  a: "00:00:01,520", b: "00:00:02,640", t: "creativity that nobody" },
  { i: 3,  a: "00:00:02,680", b: "00:00:03,920", t: "really tells you" },
  { i: 4,  a: "00:00:03,960", b: "00:00:05,200", t: "is that it's mostly" },
  { i: 5,  a: "00:00:05,240", b: "00:00:06,520", t: "sitting in a room" },
  { i: 6,  a: "00:00:06,560", b: "00:00:07,840", t: "with yourself for" },
  { i: 7,  a: "00:00:07,880", b: "00:00:09,000", t: "a long time" },
  { i: 8,  a: "00:00:09,040", b: "00:00:10,440", t: "and being okay" },
  { i: 9,  a: "00:00:10,480", b: "00:00:11,720", t: "with the fact that" },
  { i: 10, a: "00:00:11,760", b: "00:00:13,080", t: "what you're making" },
  { i: 11, a: "00:00:13,120", b: "00:00:14,360", t: "might not be" },
  { i: 12, a: "00:00:14,400", b: "00:00:15,520", t: "any good and" },
  { i: 13, a: "00:00:15,560", b: "00:00:16,920", t: "that's actually the" },
  { i: 14, a: "00:00:16,960", b: "00:00:18,200", t: "work right learning" },
  { i: 15, a: "00:00:18,240", b: "00:00:19,640", t: "to stay in that" },
  { i: 16, a: "00:00:19,680", b: "00:00:21,040", t: "uncomfortable place long" },
  { i: 17, a: "00:00:21,080", b: "00:00:22,320", t: "enough for something" },
  { i: 18, a: "00:00:22,360", b: "00:00:23,600", t: "honest to come out" },
];

// ── Utility components ──────────────────────────────────────
function TrafficLights({ scale = 1 }) {
  const s = (c) => ({
    width: 12 * scale, height: 12 * scale, borderRadius: "50%",
    background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.18)",
  });
  return (
    <div style={{ display: "flex", gap: 8 * scale, alignItems: "center" }}>
      <div style={s("var(--traffic-r)")} />
      <div style={s("var(--traffic-y)")} />
      <div style={s("var(--traffic-g)")} />
    </div>
  );
}

function Eyebrow({ children, color = "var(--ink-4)" }) {
  return (
    <div style={{
      fontFamily: "var(--sans)", fontSize: 10.5, fontWeight: 600,
      letterSpacing: "0.14em", textTransform: "uppercase", color,
    }}>{children}</div>
  );
}

// Segmented control
function Segmented({ value, options, onChange, accent }) {
  const idx = Math.max(0, options.findIndex((o) => (o.value ?? o) === value));
  const n = options.length;
  return (
    <div style={{
      position: "relative", display: "flex", padding: 3,
      background: "var(--surf-chip)", borderRadius: 9, userSelect: "none",
      border: "0.5px solid rgba(31,30,27,0.08)",
    }}>
      <div style={{
        position: "absolute", top: 3, bottom: 3,
        left: `calc(3px + ${idx} * (100% - 6px) / ${n})`,
        width: `calc((100% - 6px) / ${n})`,
        background: "var(--surf-chip-thumb)", borderRadius: 7,
        boxShadow: "0 1px 2px rgba(0,0,0,0.07), 0 0 0 0.5px var(--line)",
        transition: "left .18s cubic-bezier(.3,.7,.4,1)",
      }} />
      {options.map((o, i) => {
        const v = o.value ?? o;
        const l = o.label ?? o;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{
              position: "relative", zIndex: 1, flex: 1, height: 28,
              border: 0, background: "transparent", cursor: "default",
              fontFamily: "var(--sans)", fontSize: 13,
              fontWeight: v === value ? 600 : 500,
              color: v === value ? "var(--ink)" : "var(--ink-3)",
              letterSpacing: "0.005em",
            }}>{l}</button>
        );
      })}
    </div>
  );
}

// Custom horizontal slider with stepped marks
function StepSlider({ value, min, max, onChange, accent }) {
  const trackRef = React.useRef(null);
  const steps = max - min + 1;
  const pct = ((value - min) / (max - min)) * 100;
  const onPointerDown = (e) => {
    const update = (clientX) => {
      const r = trackRef.current.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      onChange(Math.round(min + p * (max - min)));
    };
    update(e.clientX);
    const move = (ev) => update(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div ref={trackRef} onPointerDown={onPointerDown}
      style={{ position: "relative", height: 28, cursor: "default" }}>
      {/* track */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: "50%",
        transform: "translateY(-50%)", height: 4, borderRadius: 999,
        background: "var(--surf-track)",
      }} />
      {/* filled */}
      <div style={{
        position: "absolute", left: 0, top: "50%",
        transform: "translateY(-50%)", height: 4, borderRadius: 999,
        background: accent, width: `${pct}%`,
        transition: "width .12s ease",
      }} />
      {/* ticks */}
      {Array.from({ length: steps }).map((_, i) => {
        const p = (i / (steps - 1)) * 100;
        const active = (min + i) <= value;
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: `${p}%`,
            transform: "translate(-50%,-50%)",
            width: 2, height: 8, borderRadius: 1,
            background: active ? accent : "var(--inactive-2)",
            opacity: active ? 0.5 : 1,
          }} />
        );
      })}
      {/* thumb */}
      <div style={{
        position: "absolute", top: "50%", left: `${pct}%`,
        transform: "translate(-50%,-50%)",
        width: 20, height: 20, borderRadius: "50%",
        background: "var(--surf-card)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(31,30,27,0.16)",
        transition: "left .12s ease",
      }} />
    </div>
  );
}

// ── Window chrome ───────────────────────────────────────────
function WindowFrame({ children, accent, showChrome, screen, sheet, file, onOpenSettings, onOpenHistory }) {
  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      background: "var(--bg)",
      display: "flex", flexDirection: "column", position: "relative",
    }}>
      {showChrome && <TitleBar accent={accent} screen={screen} sheet={sheet} file={file}
        onOpenSettings={onOpenSettings} onOpenHistory={onOpenHistory} />}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function TitleBar({ accent, screen, onOpenSettings, onOpenHistory, sheet, file }) {
  const screenLabel =
    screen === "main" ? "New transcription" :
    screen === "transcribing" ? "Transcribing" :
    "Ready to export";
  return (
    <div style={{
      height: 44, display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      padding: "0 14px",
      background: "linear-gradient(180deg, var(--chrome-a) 0%, var(--chrome-b) 100%)",
      borderBottom: "0.5px solid var(--line-2)",
      position: "relative", WebkitAppRegion: "drag",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 72, WebkitAppRegion: "drag" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--sans)", fontSize: 12, color: "var(--ink-3)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: accent, opacity: 0.85,
          }} />
          <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>Seyamii&nbsp;Slate</span>
          <span style={{ color: "var(--ink-4)" }}>·</span>
          <span>{screenLabel}</span>
        </div>
      </div>
      <div style={{
        fontFamily: "var(--serif)", fontStyle: "italic",
        fontSize: 14, color: "var(--ink-3)", letterSpacing: "0.01em",
      }}>
        {(file && file.name) || ""}
      </div>
      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 6,
        alignItems: "center",
      }}>
        <ChromeButton label="History" active={sheet === "history"} onClick={onOpenHistory} />
        <ChromeButton label="Settings" active={sheet === "settings"} onClick={onOpenSettings} />
      </div>
    </div>
  );
}

function ChromeButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ WebkitAppRegion: "no-drag",
      height: 24, padding: "0 10px", borderRadius: 6,
      border: active ? "0.5px solid rgba(31,30,27,0.35)" : "0.5px solid var(--line-2)",
      background: active ? "var(--button-ghost-bg-active)" : "var(--button-ghost-bg)",
      fontFamily: "var(--sans)", fontSize: 11.5, fontWeight: active ? 600 : 500,
      color: active ? "var(--ink)" : "var(--ink-3)",
      cursor: "default",
      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
    }}>{label}</button>
  );
}

window.WindowFrame = WindowFrame;
window.Segmented = Segmented;
window.StepSlider = StepSlider;
window.Eyebrow = Eyebrow;
window.SAMPLE_WORDS = SAMPLE_WORDS;
window.SAMPLE_SRT_CUES = SAMPLE_SRT_CUES;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
window.ACCURACY_LEVELS = ACCURACY_LEVELS;
window.THEMES = THEMES;
window.ChromeButton = ChromeButton;
