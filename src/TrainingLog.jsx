import { useState, useEffect, useRef } from "react";
import { storage } from "./storage";

/* ============================ PROGRAM DATA ============================ */

const LIFT = "lift";
const DO = "do";
const TEST = "test";

/*
 * Ten weeks in four phases. Weeks 1-2 reintroduce the movements at
 * deliberately submaximal loads, week 3 bridges into the Phase 1 exercise
 * selection at one set fewer, weeks 4-9 build, week 10 deloads and retests.
 *
 * Day order follows the weekly template: the four lifting days Mon/Tue/Thu/Fri,
 * then Athletic on Saturday. Athletic is last because it is the day college is
 * allowed to take — never a lifting day.
 */

const PROGRAM = {
  intro: [
    {
      id: "introLowerA",
      name: "Lower A",
      tag: "Squat",
      ex: [
        { id: "bsq", n: "Back squat", s: "3 × 6–8", t: LIFT, note: "Empty bar week 1. Add weight in week 2 only if every rep looks the same. Safeties set at depth" },
        { id: "dbrdl", n: "DB Romanian deadlift", s: "3 × 10", t: LIFT, note: "Light" },
        { id: "lpress", n: "Leg press", s: "3 × 10–12", t: LIFT },
        { id: "lcurl", n: "Leg curl", s: "2 × 12", t: LIFT },
        { id: "calf", n: "Standing calf raise", s: "2 × 15", t: LIFT },
        { id: "plank", n: "Plank", s: "3 × 30–45s", t: DO },
      ],
    },
    {
      id: "introUpperA",
      name: "Upper A",
      tag: "Press and vertical pull",
      ex: [
        { id: "dbbench", n: "DB bench press", s: "3 × 8–10", t: LIFT },
        { id: "dbohp", n: "Standing DB overhead press", s: "3 × 8–10", t: LIFT },
        { id: "csrow", n: "Chest-supported DB row", s: "3 × 10–12", t: LIFT },
        { id: "pulldown", n: "Lat pulldown", s: "2 × 12", t: LIFT },
        { id: "lat", n: "Lateral raise", s: "2 × 12–15", t: LIFT },
        { id: "tpush", n: "Triceps pushdown", s: "2 × 12", t: LIFT },
      ],
    },
    {
      id: "introLowerB",
      name: "Lower B",
      tag: "Hinge",
      ex: [
        { id: "tbdl", n: "Trap-bar deadlift", s: "3 × 5", t: LIFT, note: "Light. Technique only" },
        { id: "hacksq", n: "Leg press or hack squat", s: "3 × 10–12", t: LIFT },
        { id: "dbsplit", n: "DB split squat", s: "2 × 8/leg", t: LIFT },
        { id: "backext", n: "Back extension", s: "2 × 12", t: LIFT },
        { id: "scalf", n: "Seated calf raise", s: "2 × 15", t: LIFT },
        { id: "abwheel", n: "Ab wheel or cable crunch", s: "3 × 10", t: LIFT },
      ],
    },
    {
      id: "introUpperB",
      name: "Upper B",
      tag: "Pull and delts",
      ex: [
        { id: "pullup", n: "Pull-ups", s: "4 × half max", t: LIFT, note: "If your max is 8, do 4 × 4" },
        { id: "brow", n: "Barbell row", s: "3 × 8–10", t: LIFT, note: "Your one well-coached barbell lift. Load it" },
        { id: "incdb", n: "Incline DB press", s: "3 × 10", t: LIFT },
        { id: "facepull", n: "Face pull", s: "2 × 15", t: LIFT },
        { id: "dbcurl", n: "DB curl", s: "3 × 10–12", t: LIFT },
        { id: "ohtri", n: "Overhead triceps extension", s: "2 × 12", t: LIFT },
      ],
    },
    {
      id: "introAth",
      name: "Athletic",
      tag: "Track + carries",
      athletic: true,
      ex: [
        { id: "jog1", n: "Easy jog", s: "10 min", t: DO },
        { id: "drills", n: "A-skips, high knees, carioca", s: "2 × 20m each", t: DO },
        { id: "bjump", n: "Broad jumps", s: "4 × 3", t: DO, note: "Submaximal in week 1" },
        { id: "strides", n: "Strides", s: "6 × 60m @ 80%", t: DO },
        { id: "carry", n: "Farmer's carry", s: "4 × 30–40m", t: LIFT },
        { id: "hkr", n: "Hanging knee raise", s: "3 × 10", t: DO },
        { id: "splank", n: "Side plank", s: "2 × 30s/side", t: DO },
        { id: "jog2", n: "Easy jog to finish", s: "10 min", t: DO },
      ],
    },
  ],
  build: [
    {
      id: "buildLowerA",
      name: "Lower A",
      tag: "Squat",
      ex: [
        { id: "bsq", n: "Back squat", s: "4 × 5–8", t: LIFT, rest: 180 },
        { id: "lpress", n: "Leg press", s: "3 × 10–12", t: LIFT, rest: 90 },
        { id: "dbrdl", n: "DB Romanian deadlift", s: "3 × 8–10", t: LIFT, rest: 90 },
        { id: "lcurl", n: "Leg curl", s: "3 × 10–12", t: LIFT, rest: 60 },
        { id: "calf", n: "Standing calf raise", s: "3 × 12–15", t: LIFT, rest: 60 },
        { id: "hlr", n: "Hanging leg raise", s: "3 × 10–12", t: LIFT, rest: 60 },
      ],
    },
    {
      id: "buildUpperA",
      name: "Upper A",
      tag: "Press and vertical pull",
      tip: "Superset the last three.",
      ex: [
        { id: "bench", n: "Bench press", s: "4 × 5–8", t: LIFT, rest: 180, note: "In a rack with safeties at chest height, or dumbbells. Never to failure" },
        { id: "incdb", n: "Incline DB press", s: "3 × 8–12", t: LIFT, rest: 90 },
        { id: "csrow", n: "Chest-supported row", s: "3 × 8–12", t: LIFT, rest: 90 },
        { id: "pulldown", n: "Lat pulldown", s: "3 × 8–12", t: LIFT, rest: 90 },
        { id: "lat", n: "Lateral raise", s: "3 × 12–15", t: LIFT, rest: 45 },
        { id: "tpush", n: "Triceps pushdown", s: "3 × 10–15", t: LIFT, rest: 45 },
        { id: "dbcurl", n: "DB curl", s: "3 × 10–12", t: LIFT, rest: 45 },
      ],
    },
    {
      id: "buildLowerB",
      name: "Lower B",
      tag: "Hinge",
      ex: [
        { id: "tbdl", n: "Trap-bar deadlift", s: "3 × 5", t: LIFT, rest: 180, note: "No chalk in RecWell. Mixed grip or straps — don't let this become grip training" },
        { id: "bss", n: "Bulgarian split squat", s: "3 × 8–10/leg", t: LIFT, rest: 90 },
        { id: "hthrust", n: "Hip thrust", s: "3 × 8–12", t: LIFT, rest: 90 },
        { id: "backext", n: "Back extension", s: "2 × 12", t: LIFT, rest: 60 },
        { id: "scalf", n: "Seated calf raise", s: "3 × 15", t: LIFT, rest: 45 },
        { id: "pallof", n: "Pallof press", s: "3 × 12/side", t: LIFT, rest: 45 },
      ],
    },
    {
      id: "buildUpperB",
      name: "Upper B",
      tag: "Pull and delts",
      tip: "Superset the last three.",
      ex: [
        { id: "pullup", n: "Pull-ups", s: "4 × (max − 2)", t: LIFT, rest: 120, note: "Two short of failure every set. Add load once you can do 4 × 8 clean" },
        { id: "dips", n: "Dips or flat DB press", s: "3 × 8–12", t: LIFT, rest: 90 },
        { id: "ohp", n: "Overhead press", s: "3 × 6–10", t: LIFT, rest: 120 },
        { id: "brow", n: "Barbell row", s: "3 × 8–10", t: LIFT, rest: 90 },
        { id: "clat", n: "Cable lateral raise", s: "3 × 12–15", t: LIFT, rest: 45 },
        { id: "hcurl", n: "Hammer curl", s: "3 × 12", t: LIFT, rest: 45 },
        { id: "facepull", n: "Face pull", s: "2 × 15", t: LIFT, rest: 45 },
      ],
    },
    {
      id: "buildAth",
      name: "Athletic",
      tag: "Track + carries",
      athletic: true,
      ex: [
        { id: "jog1", n: "Warm-up jog + drills", s: "12 min", t: DO },
        { id: "bjump", n: "Box jumps or broad jumps", s: "4 × 3", t: DO },
        { id: "sprints", n: "Sprints", s: "6 × 60m @ 85–90%", t: DO, note: "Weeks 4–6. Go to 8 × 60–80m in weeks 7–9 only if Monday squats aren't suffering" },
        { id: "sled", n: "Sled push or heavy carry", s: "4 × 30m", t: LIFT },
        { id: "corecirc", n: "Core circuit", s: "3 rounds", t: DO, note: "Hanging leg raise, Pallof press, weighted sit-ups" },
        { id: "jog2", n: "Optional easy jog", s: "10 min", t: DO },
      ],
    },
  ],
};

const RETEST = {
  id: "retest",
  name: "Retest",
  tag: "Week 10 · Thu/Fri",
  test: true,
  ex: [
    { id: "t_pullup", n: "Max strict pull-ups", s: "reps", t: TEST },
    { id: "t_pushup", n: "Push-ups in 2 min", s: "reps", t: TEST },
    { id: "t_mile", n: "1-mile run", s: "mm:ss", t: TEST },
    { id: "t_squat", n: "Back squat 5RM", s: "lb", t: TEST },
    { id: "t_bench", n: "Bench 5RM (or DB 8RM)", s: "lb", t: TEST },
    { id: "t_bw", n: "Bodyweight", s: "lb", t: TEST },
  ],
};

/* Every day that can appear in a log, for resolving history entries. */
const ALL_DAYS = [...PROGRAM.intro, ...PROGRAM.build, RETEST];

const phaseForWeek = (w) =>
  w <= 2 ? "intro" : w === 3 ? "bridge" : w <= 9 ? "build" : "deload";

const daysForWeek = (w) => {
  const p = phaseForWeek(w);
  if (p === "intro") return PROGRAM.intro;
  // Week 10 is Mon-Wed at half volume, then the retest Thu/Fri.
  if (p === "deload") return [...PROGRAM.build.slice(0, 3), RETEST];
  return PROGRAM.build; // bridge runs the build selection, one set lighter
};

const PHASE_LABEL = {
  intro: "Weeks 1–2 — Reintroduction",
  bridge: "Week 3 — Bridge",
  build: "Weeks 4–9 — Build",
  deload: "Week 10 — Deload + retest",
};

const PHASE_CUE = {
  intro:
    "Every set ends with 3–4 reps left. You will feel underworked — that is the intent. Connective tissue adapts slower than muscle.",
  bridge:
    "Phase 1 exercises at one set fewer, still 3 RIR. The sets below are already reduced.",
  build: "Compounds to ~2 reps in reserve. Accessories 1–2.",
  deload: "Same weights, half the sets. The sets below are already halved.",
};

const setCount = (s) => {
  const m = s.match(/^(\d+)/);
  return m ? Math.min(parseInt(m[1], 10), 6) : 3;
};

/*
 * Week 3 drops a set from every exercise and week 10 halves them. Doing that
 * here rather than in a banner means the row count on screen is the work, so
 * there's no arithmetic to get wrong mid-session.
 */
const daySetCount = (day, week) =>
  day.ex.reduce((n, e) => n + (e.t === LIFT ? setsForWeek(e.s, week) : 0), 0);

const setsForWeek = (scheme, week) => {
  const base = setCount(scheme);
  const p = phaseForWeek(week);
  if (p === "bridge") return Math.max(base - 1, 1);
  if (p === "deload") return Math.max(Math.ceil(base / 2), 1);
  return base;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]} ${+d}`;
};

/* ============================== STYLES ============================== */

const CSS = `
.tl-root{
  --ink:#14161a; --panel:#1d2026; --panel2:#22262e; --line:#2f343d;
  --bone:#ece9e4; --muted:#868e99; --gold:#ffd520; --red:#e03a3e;
  background:var(--ink); color:var(--bone); min-height:100vh;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  padding-bottom:calc(96px + env(safe-area-inset-bottom));
}
.tl-root *{box-sizing:border-box;}
.tl-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;}
.tl-eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
.tl-head{padding:calc(20px + env(safe-area-inset-top)) 18px 14px;border-bottom:1px solid var(--line);position:sticky;top:0;
  background:var(--ink);z-index:20;}
.tl-title{font-size:22px;font-weight:800;letter-spacing:-.02em;margin:2px 0 0;}
.tl-weekbar{display:flex;gap:6px;overflow-x:auto;padding:14px 18px 4px;-webkit-overflow-scrolling:touch;}
.tl-weekbar::-webkit-scrollbar{display:none;}
.tl-wk{flex:0 0 auto;min-width:46px;padding:8px 0;border-radius:8px;border:1px solid var(--line);
  background:var(--panel);color:var(--muted);font-size:12px;font-weight:700;text-align:center;cursor:pointer;}
.tl-wk.on{background:var(--gold);color:#14161a;border-color:var(--gold);}
.tl-phase{padding:8px 18px 0;}
.tl-card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;
  margin:10px 18px;cursor:pointer;display:flex;align-items:center;gap:12px;}
.tl-rule{width:3px;align-self:stretch;border-radius:2px;background:var(--line);}
.tl-rule.done{background:var(--gold);}
.tl-dayname{font-size:17px;font-weight:700;letter-spacing:-.01em;}
.tl-daytag{font-size:12px;color:var(--muted);margin-top:2px;}
.tl-chev{margin-left:auto;color:var(--muted);font-size:20px;}
.tl-back{background:none;border:none;color:var(--gold);font-size:14px;font-weight:600;
  padding:0;cursor:pointer;display:flex;align-items:center;gap:6px;}
.tl-ex{border-top:1px solid var(--line);padding:16px 18px;}
.tl-exhead{display:flex;align-items:baseline;gap:8px;}
.tl-exname{font-size:15px;font-weight:700;flex:1;}
.tl-scheme{font-size:12px;color:var(--gold);}
.tl-exnote{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.45;}
.tl-ghost{font-size:12px;color:var(--muted);margin-top:8px;padding-left:9px;
  border-left:2px solid var(--red);line-height:1.5;}
.tl-sets{display:flex;flex-direction:column;gap:6px;margin-top:10px;}
.tl-setrow{display:flex;align-items:center;gap:8px;}
.tl-setno{width:16px;font-size:11px;color:var(--muted);}
.tl-in{flex:1;min-width:0;background:var(--panel2);border:1px solid var(--line);border-radius:8px;
  color:var(--bone);padding:11px 10px;font-size:16px;text-align:center;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
.tl-in:focus{outline:2px solid var(--gold);outline-offset:-1px;}
.tl-in::placeholder{color:#5c636d;}
.tl-x{color:var(--muted);font-size:12px;}
.tl-sub{display:flex;gap:8px;margin-top:8px;align-items:center;}
.tl-note{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:8px;
  color:var(--bone);padding:10px;font-size:14px;font-family:inherit;resize:vertical;}
.tl-note:focus{outline:2px solid var(--gold);outline-offset:-1px;}
.tl-chip{border:1px solid var(--line);background:var(--panel2);color:var(--muted);border-radius:999px;
  padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;}
.tl-chip.on{background:var(--gold);color:#14161a;border-color:var(--gold);}
.tl-chip.tl-danger{color:var(--red);border-color:var(--red);}
.tl-chip.tl-danger.armed{background:var(--red);color:#fff;border-color:var(--red);}
.tl-btn{width:100%;background:var(--gold);color:#14161a;border:none;border-radius:10px;
  padding:15px;font-size:15px;font-weight:800;cursor:pointer;letter-spacing:.01em;}
.tl-btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--line);}
.tl-banner{margin:12px 18px;padding:12px 14px;border-radius:10px;background:var(--panel);
  border-left:3px solid var(--red);font-size:13px;line-height:1.5;color:var(--bone);}
.tl-tabs{position:fixed;bottom:0;left:0;right:0;display:flex;background:var(--ink);
  border-top:1px solid var(--line);z-index:30;padding-bottom:env(safe-area-inset-bottom);}
.tl-tab{flex:1;padding:12px 0 18px;background:none;border:none;color:var(--muted);
  font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
.tl-tab.on{color:var(--gold);box-shadow:inset 0 2px 0 var(--gold);}
.tl-timer{position:fixed;bottom:calc(64px + env(safe-area-inset-bottom));left:12px;right:12px;background:var(--panel);
  border:1px solid var(--gold);border-radius:12px;padding:12px 14px;display:flex;
  align-items:center;gap:12px;z-index:25;}
.tl-tval{font-size:26px;font-weight:800;color:var(--gold);}
.tl-empty{padding:48px 24px;text-align:center;color:var(--muted);font-size:14px;line-height:1.6;}
.tl-hrow{margin:10px 18px;padding:14px;background:var(--panel);border:1px solid var(--line);
  border-radius:12px;cursor:pointer;}
.tl-stat{display:flex;gap:18px;margin:12px 18px;}
.tl-statbox{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px;}
.tl-statval{font-size:26px;font-weight:800;letter-spacing:-.02em;}
@media (prefers-reduced-motion:no-preference){.tl-card{transition:border-color .15s ease;}}
.tl-card:active{border-color:var(--gold);}
`;

/* ============================== APP ============================== */

export default function TrainingLog() {
  const [data, setData] = useState({ logs: {}, notes: [], bw: [], week: 1 });
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("home");
  const [openDay, setOpenDay] = useState(null);
  const [openHist, setOpenHist] = useState(null);
  const [armedDel, setArmedDel] = useState(null);
  const [timer, setTimer] = useState(0);
  const saveRef = useRef(null);

  /* ---------- storage ---------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await storage.get("training-v1");
        if (r && r.value) setData(JSON.parse(r.value));
      } catch (e) {
        /* first run, nothing saved yet */
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveRef.current);
    saveRef.current = setTimeout(async () => {
      try {
        await storage.set("training-v1", JSON.stringify(data));
      } catch (e) {
        console.error("Could not save", e);
      }
    }, 500);
    return () => clearTimeout(saveRef.current);
  }, [data, loaded]);

  /* ---------- rest timer ---------- */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => {
      setTimer((s) => {
        if (s <= 1 && navigator.vibrate) navigator.vibrate(400);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timer > 0]);

  const week = data.week;
  const days = daysForWeek(week);
  const phase = phaseForWeek(week);

  const keyFor = (dayId) => `${todayISO()}|${dayId}`;
  const loggedThisWeek = (dayId) =>
    Object.values(data.logs).some((l) => l.dayId === dayId && l.week === week);

  /* ---------- last-time lookup ---------- */
  const lastFor = (exId, excludeKey) => {
    const entries = Object.entries(data.logs)
      .filter(([k, l]) => k !== excludeKey && l.ex && l.ex[exId])
      .sort((a, b) => (a[1].date < b[1].date ? 1 : -1));
    for (const [, l] of entries) {
      const e = l.ex[exId];
      const sets = (e.sets || []).filter((s) => s && (s.r || s.w));
      if (sets.length) return { date: l.date, sets, rir: e.rir };
    }
    return null;
  };

  const upd = (fn) => setData((d) => { const n = structuredClone(d); fn(n); return n; });

  /* ---------- session editing ---------- */
  const day = openDay ? days.find((d) => d.id === openDay) : null;
  const sKey = day ? keyFor(day.id) : null;
  const session = sKey ? data.logs[sKey] : null;

  const setField = (exId, field, val, idx) =>
    upd((n) => {
      if (!n.logs[sKey]) n.logs[sKey] = { date: todayISO(), dayId: day.id, week, ex: {}, note: "" };
      const s = n.logs[sKey];
      if (!s.ex[exId]) s.ex[exId] = { sets: [], rir: "", note: "", done: false };
      if (field === "set") {
        while (s.ex[exId].sets.length <= idx) s.ex[exId].sets.push({ w: "", r: "" });
        s.ex[exId].sets[idx] = { ...s.ex[exId].sets[idx], ...val };
      } else s.ex[exId][field] = val;
    });

  const setSessionNote = (v) =>
    upd((n) => {
      if (!n.logs[sKey]) n.logs[sKey] = { date: todayISO(), dayId: day.id, week, ex: {}, note: "" };
      n.logs[sKey].note = v;
    });

  const mmss = (s) => `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, "0")}`;

  /* ============================ RENDER ============================ */

  if (!loaded)
    return (
      <div className="tl-root">
        <style>{CSS}</style>
        <div className="tl-empty">Loading your log…</div>
      </div>
    );

  return (
    <div className="tl-root">
      <style>{CSS}</style>

      {/* ---------------- SESSION ---------------- */}
      {view === "home" && day && (
        <>
          <div className="tl-head">
            <button className="tl-back" onClick={() => setOpenDay(null)}>← All sessions</button>
            <div className="tl-title" style={{ marginTop: 8 }}>{day.name}</div>
            <div className="tl-daytag">
              {day.tag}
              {!day.athletic && !day.test && ` · ${daySetCount(day, week)} sets`}
              {` · Week ${week} · ${fmtDate(todayISO())}`}
            </div>
          </div>

          {!day.athletic && !day.test && (
            <div className="tl-banner">{PHASE_CUE[phase]}</div>
          )}

          {day.ex.map((ex, i) => {
            const cur = session?.ex?.[ex.id] || { sets: [], rir: "", note: "", done: false };
            const last = lastFor(ex.id, sKey);
            return (
              <div className="tl-ex" key={ex.id}>
                <div className="tl-exhead">
                  <div className="tl-exname">{ex.n}</div>
                  <div className="tl-scheme tl-mono">{ex.s}</div>
                </div>
                {i < 3 && !day.athletic && !day.test && (
                  <div className="tl-eyebrow" style={{ marginTop: 6 }}>Core · keep if short on time</div>
                )}
                {ex.note && <div className="tl-exnote">{ex.note}</div>}

                {last && (
                  <div className="tl-ghost tl-mono">
                    {fmtDate(last.date)} · {last.sets.map((s) => `${s.w || "—"}×${s.r || "—"}`).join("  ")}
                    {last.rir ? `  @${last.rir} RIR` : ""}
                  </div>
                )}

                {ex.t === LIFT && (
                  <>
                    <div className="tl-sets">
                      {Array.from({ length: setsForWeek(ex.s, week) }).map((_, idx) => (
                        <div className="tl-setrow" key={idx}>
                          <div className="tl-setno tl-mono">{idx + 1}</div>
                          <input
                            className="tl-in" type="text" inputMode="decimal" placeholder="lb"
                            value={cur.sets?.[idx]?.w || ""}
                            onChange={(e) => setField(ex.id, "set", { w: e.target.value }, idx)}
                          />
                          <span className="tl-x">×</span>
                          <input
                            className="tl-in" type="text" inputMode="numeric" placeholder="reps"
                            value={cur.sets?.[idx]?.r || ""}
                            onChange={(e) => setField(ex.id, "set", { r: e.target.value }, idx)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="tl-sub">
                      <span className="tl-eyebrow">RIR</span>
                      {["0", "1", "2", "3", "4"].map((v) => (
                        <button
                          key={v}
                          className={`tl-chip ${cur.rir === v ? "on" : ""}`}
                          onClick={() => setField(ex.id, "rir", cur.rir === v ? "" : v)}
                        >{v}</button>
                      ))}
                      {ex.rest && (
                        <button className="tl-chip" style={{ marginLeft: "auto" }} onClick={() => setTimer(ex.rest)}>
                          ⏱ {ex.rest}s
                        </button>
                      )}
                    </div>
                  </>
                )}

                {ex.t === DO && (
                  <div className="tl-sub">
                    <button
                      className={`tl-chip ${cur.done ? "on" : ""}`}
                      onClick={() => setField(ex.id, "done", !cur.done)}
                    >{cur.done ? "✓ Done" : "Mark done"}</button>
                  </div>
                )}

                {ex.t === TEST && (
                  <input
                    className="tl-in" style={{ marginTop: 10, textAlign: "left" }} type="text"
                    placeholder={ex.s}
                    value={cur.sets?.[0]?.r || ""}
                    onChange={(e) => setField(ex.id, "set", { r: e.target.value }, 0)}
                  />
                )}
              </div>
            );
          })}

          {day.tip && (
            <div className="tl-banner" style={{ borderLeftColor: "var(--gold)" }}>{day.tip}</div>
          )}

          <div style={{ padding: "18px" }}>
            <div className="tl-eyebrow" style={{ marginBottom: 8 }}>Session notes</div>
            <textarea
              className="tl-note" rows={3}
              placeholder="Sleep, energy, pain, anything odd."
              value={session?.note || ""}
              onChange={(e) => setSessionNote(e.target.value)}
            />
            <div style={{ height: 12 }} />
            <button className="tl-btn" onClick={() => setOpenDay(null)}>Done — saved</button>
          </div>
        </>
      )}

      {/* ---------------- HOME ---------------- */}
      {view === "home" && !day && (
        <>
          <div className="tl-head">
            <div className="tl-eyebrow">UMD RecWell · 5 days</div>
            <div className="tl-title">Training log</div>
          </div>
          <div className="tl-weekbar">
            {Array.from({ length: 10 }).map((_, i) => (
              <button
                key={i}
                className={`tl-wk ${week === i + 1 ? "on" : ""}`}
                onClick={() => upd((n) => { n.week = i + 1; })}
              >W{i + 1}</button>
            ))}
          </div>
          <div className="tl-phase">
            <span className="tl-eyebrow">{PHASE_LABEL[phase]}</span>
          </div>
          {days.map((d) => (
            <div className="tl-card" key={d.id} onClick={() => setOpenDay(d.id)}>
              <div className={`tl-rule ${loggedThisWeek(d.id) ? "done" : ""}`} />
              <div>
                <div className="tl-dayname">{d.name}</div>
                <div className="tl-daytag">{d.tag}</div>
              </div>
              <div className="tl-chev">›</div>
            </div>
          ))}
          <div className="tl-banner">
            Miss a day? Drop Athletic. Never skip a lifting day to keep it.
          </div>
          <div className="tl-banner" style={{ borderLeftColor: "var(--gold)" }}>
            No chalk or liquid grip anywhere in RecWell. Mixed grip or straps on heavy pulls.
          </div>
        </>
      )}

      {/* ---------------- HISTORY ---------------- */}
      {view === "history" && (
        <>
          <div className="tl-head">
            <div className="tl-eyebrow">Everything you've logged</div>
            <div className="tl-title">History</div>
          </div>
          {Object.entries(data.logs).length === 0 && (
            <div className="tl-empty">Nothing logged yet.<br />Finish a session and it shows up here.</div>
          )}
          {Object.entries(data.logs)
            .sort((a, b) => (a[1].date < b[1].date ? 1 : -1))
            .map(([k, l]) => {
              const d = ALL_DAYS.find((x) => x.id === l.dayId);
              const open = openHist === k;
              const armed = armedDel === k;
              return (
                <div
                  className="tl-hrow"
                  key={k}
                  onClick={() => { setOpenHist(open ? null : k); setArmedDel(null); }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>{d?.name || l.dayId}</div>
                    <div className="tl-eyebrow">W{l.week}</div>
                    <div className="tl-eyebrow" style={{ marginLeft: "auto" }}>{fmtDate(l.date)}</div>
                  </div>
                  {open && (
                    <div style={{ marginTop: 10 }}>
                      {Object.entries(l.ex || {}).map(([exId, e]) => {
                        const meta = ALL_DAYS.flatMap((x) => x.ex).find((x) => x.id === exId);
                        const sets = (e.sets || []).filter((s) => s.w || s.r);
                        if (!sets.length && !e.done) return null;
                        return (
                          <div key={exId} className="tl-mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>
                            {meta?.n || exId}: {e.done ? "done" : sets.map((s) => `${s.w || "—"}×${s.r || "—"}`).join("  ")}
                            {e.rir ? ` @${e.rir}` : ""}
                          </div>
                        );
                      })}
                      {l.note && <div className="tl-exnote" style={{ marginTop: 8 }}>{l.note}</div>}
                      <button
                        className={`tl-chip tl-danger ${armed ? "armed" : ""}`}
                        style={{ marginTop: 12 }}
                        onClick={(e) => {
                          // The row itself toggles open/closed; don't do both.
                          e.stopPropagation();
                          if (!armed) return setArmedDel(k);
                          upd((n) => { delete n.logs[k]; });
                          setArmedDel(null);
                          setOpenHist(null);
                        }}
                      >
                        {armed ? "Tap again to delete" : "Delete session"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}

      {/* ---------------- BODYWEIGHT ---------------- */}
      {view === "body" && (
        <BodyTab data={data} upd={upd} />
      )}

      {/* ---------------- NOTES ---------------- */}
      {view === "notes" && (
        <NotesTab data={data} upd={upd} />
      )}

      {/* ---------------- TIMER ---------------- */}
      {timer > 0 && (
        <div className="tl-timer">
          <div className="tl-tval tl-mono">{mmss(timer)}</div>
          <div className="tl-eyebrow">Rest</div>
          <button className="tl-chip" style={{ marginLeft: "auto" }} onClick={() => setTimer((s) => s + 30)}>+30s</button>
          <button className="tl-chip" onClick={() => setTimer(0)}>Stop</button>
        </div>
      )}

      {/* ---------------- TABS ---------------- */}
      <div className="tl-tabs">
        {[["home", "Train"], ["history", "History"], ["body", "Weight"], ["notes", "Notes"]].map(([id, label]) => (
          <button
            key={id}
            className={`tl-tab ${view === id ? "on" : ""}`}
            onClick={() => { setView(id); setOpenDay(null); }}
          >{label}</button>
        ))}
      </div>
    </div>
  );
}

/* ============================ BODYWEIGHT ============================ */

function BodyTab({ data, upd }) {
  const [val, setVal] = useState("");
  const entries = [...(data.bw || [])].sort((a, b) => (a.date < b.date ? 1 : -1));

  const add = () => {
    if (!val.trim()) return;
    upd((n) => {
      if (!n.bw) n.bw = [];
      n.bw.push({ date: todayISO(), w: val.trim(), id: Date.now() });
    });
    setVal("");
  };

  const avgOf = (list) =>
    list.length ? (list.reduce((s, e) => s + parseFloat(e.w || 0), 0) / list.length).toFixed(1) : "—";

  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);
  const prevCut = new Date(now.getTime() - 14 * 864e5).toISOString().slice(0, 10);
  const thisWeek = entries.filter((e) => e.date > cutoff);
  const lastWeek = entries.filter((e) => e.date <= cutoff && e.date > prevCut);
  const delta =
    thisWeek.length && lastWeek.length
      ? (parseFloat(avgOf(thisWeek)) - parseFloat(avgOf(lastWeek))).toFixed(1)
      : null;

  return (
    <>
      <div className="tl-head">
        <div className="tl-eyebrow">Same scale, morning, before eating</div>
        <div className="tl-title">Bodyweight</div>
      </div>

      <div className="tl-stat">
        <div className="tl-statbox">
          <div className="tl-eyebrow">7-day average</div>
          <div className="tl-statval tl-mono">{avgOf(thisWeek)}</div>
        </div>
        <div className="tl-statbox">
          <div className="tl-eyebrow">Week over week</div>
          <div className="tl-statval tl-mono" style={{ color: delta > 0 ? "var(--gold)" : "var(--bone)" }}>
            {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          </div>
        </div>
      </div>

      <div className="tl-banner">Target is +0.25 to +0.5 lb per week. Flat for two weeks means add 250 calories a day.</div>

      <div style={{ display: "flex", gap: 8, padding: "6px 18px 0" }}>
        <input
          className="tl-in" type="text" inputMode="decimal" placeholder="lb"
          value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="tl-btn" style={{ width: 110 }} onClick={add}>Add</button>
      </div>

      {entries.length === 0 && <div className="tl-empty">No weigh-ins yet.<br />Two or three mornings a week is plenty.</div>}
      {entries.map((e) => (
        <div className="tl-hrow" key={e.id} style={{ display: "flex", alignItems: "center" }}>
          <div className="tl-mono" style={{ fontSize: 18, fontWeight: 700 }}>{e.w}</div>
          <div className="tl-eyebrow" style={{ marginLeft: 12 }}>{fmtDate(e.date)}</div>
          <button
            className="tl-chip" style={{ marginLeft: "auto" }}
            onClick={() => upd((n) => { n.bw = n.bw.filter((x) => x.id !== e.id); })}
          >Remove</button>
        </div>
      ))}
    </>
  );
}

/* ============================== NOTES ============================== */

function NotesTab({ data, upd }) {
  const [txt, setTxt] = useState("");
  const notes = [...(data.notes || [])].sort((a, b) => b.id - a.id);

  const add = () => {
    if (!txt.trim()) return;
    upd((n) => {
      if (!n.notes) n.notes = [];
      n.notes.push({ id: Date.now(), date: todayISO(), text: txt.trim() });
    });
    setTxt("");
  };

  return (
    <>
      <div className="tl-head">
        <div className="tl-eyebrow">Form cues, machine settings, questions</div>
        <div className="tl-title">Notes</div>
      </div>

      <div style={{ padding: "14px 18px 0" }}>
        <textarea
          className="tl-note" rows={3}
          placeholder="Rack 4 has adjustable safeties. Set pin 7 for squat depth."
          value={txt} onChange={(e) => setTxt(e.target.value)}
        />
        <div style={{ height: 10 }} />
        <button className="tl-btn" onClick={add}>Save note</button>
      </div>

      {notes.length === 0 && (
        <div className="tl-empty">
          Nothing here yet.<br />
          Good first entries: which racks have safeties, where the trap bar lives, how busy the ERC is at your usual time.
        </div>
      )}
      {notes.map((n) => (
        <div className="tl-hrow" key={n.id}>
          <div className="tl-eyebrow">{fmtDate(n.date)}</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{n.text}</div>
          <button
            className="tl-chip" style={{ marginTop: 10 }}
            onClick={() => upd((d) => { d.notes = d.notes.filter((x) => x.id !== n.id); })}
          >Delete</button>
        </div>
      ))}
    </>
  );
}
