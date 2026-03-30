import { useState, useEffect, useRef } from "react";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap";

// ─── Stability wizard ─────────────────────────────────────────────────────────
const WIZARD_QUESTIONS = [
  {
    id: "temp_inversion",
    question: "On the Skew-T (aviationweather.gov → Soundings → KSLC), does the temperature line lean to the RIGHT near ridge altitude?",
    why: "A rightward lean = warmer air above cooler air = temperature inversion. This is the #1 setup indicator for violent, organized mountain wave.",
    options: [
      { label: "Yes — line clearly leans right near ridge altitude", value: 3, hint: "Strong stable layer" },
      { label: "Somewhat — slight rightward lean", value: 2, hint: "Moderate stability" },
      { label: "No — line goes left or straight up", value: 0, hint: "Weak/no stable layer" },
      { label: "I can't read the Skew-T yet", value: 1, hint: "We'll use wind data only" },
    ],
  },
  {
    id: "wind_direction",
    question: "On ForeFlight Winds Aloft layers, are the winds coming from roughly the same direction (W, NW, or SW) at multiple altitudes near and above the ridge?",
    why: "Consistent wind direction across altitudes means organized, laminar airflow — the kind that sets up a clean, powerful standing wave on the lee side.",
    options: [
      { label: "Yes — same direction at all levels", value: 2, hint: "Organized wave setup" },
      { label: "Mostly — minor variation", value: 1, hint: "Moderate organization" },
      { label: "No — direction shifts a lot with altitude", value: 0, hint: "Disorganized, less wave risk" },
    ],
  },
  {
    id: "wind_shear",
    question: "Do the winds INCREASE in speed as you go higher in altitude on ForeFlight Winds Aloft?",
    why: "Wind speed increasing with altitude = wind shear. Combined with a stable layer, shear dramatically amplifies wave amplitude and rotor intensity.",
    options: [
      { label: "Yes — clearly faster at higher altitudes", value: 2, hint: "High shear, wave amplified" },
      { label: "About the same speed throughout", value: 1, hint: "Moderate shear" },
      { label: "Decreasing with altitude", value: 0, hint: "Low shear" },
    ],
  },
  {
    id: "pireps",
    question: "Are there any PIREPs showing moderate or severe turbulence within 100nm of your route on aviationweather.gov?",
    why: "PIREPs are ground truth — real observations from pilots who just flew your route. The JAL/Evergreen crew received a severe PIREP before takeoff and departed anyway. It cost them an engine.",
    options: [
      { label: "Yes — severe turbulence PIREP on route", value: 4, hint: "Treat as a personal warning" },
      { label: "Yes — moderate turbulence PIREP", value: 2, hint: "Brief extra thoroughly" },
      { label: "No PIREPs near my route", value: 0, hint: "Absence ≠ clearance; could mean no traffic" },
    ],
  },
  {
    id: "advisories",
    question: "Is there an active non-convective SIGMET (WS) or G-AIRMET Tango on aviationweather.gov → GFA for your route?",
    why: "An active SIGMET WS for severe turbulence is a no-go. Full stop. No judgment call required. G-AIRMET Tango (moderate turbulence) means brief thoroughly and apply the wave ratio before deciding.",
    options: [
      { label: "Active SIGMET (WS) — severe turbulence", value: 5, hint: "FULL STOP — no-go" },
      { label: "Active G-AIRMET Tango only", value: 2, hint: "Brief thoroughly, apply wave ratio" },
      { label: "No advisories active", value: 0, hint: "Continue assessment" },
    ],
  },
];

function classifyStability(answers) {
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  if (total >= 9) return "strong";
  if (total >= 4) return "moderate";
  return "none";
}

function stabilityLabel(s) {
  return { strong: "Strong stable layer", moderate: "Moderate stability", none: "Weak / no stable layer" }[s];
}

// ─── Risk engine ──────────────────────────────────────────────────────────────
function calcWaveRatio(wind, relief) {
  if (!relief || relief <= 0) return null;
  return wind / (relief / 1000);
}

function calcFroude(wind, stability, relief) {
  const n = { strong: 1.6, moderate: 1.0, none: 0.5 }[stability] || 1.0;
  const H = relief / 3280;
  if (!H) return null;
  return Math.round((wind / (n * H * 20)) * 100) / 100;
}

function getFrRegime(fr) {
  if (fr === null) return null;
  if (fr < 0.8) return { label: "MOUNTAIN WINS (Blocking)", code: "blocking", color: "#f59e0b" };
  if (fr <= 1.2) return { label: "RESONANCE — MAXIMUM DANGER", code: "resonance", color: "#ef4444" };
  return { label: "WIND WINS (Shooting Flow)", code: "shooting", color: "#f97316" };
}

function calcRisk({ waveRatio, isNight, aircraft, stability, ridgeWind, sigmetBonus, pirepBonus }) {
  let s = 0;
  if (waveRatio !== null) {
    if (waveRatio < 2.5) s += 10;
    else if (waveRatio < 4.0) s += 35;
    else if (waveRatio < 6.0) s += 60;
    else s += 80;
  }
  s += { strong: 20, moderate: 10, none: -5 }[stability] || 0;
  if (isNight) s += 15;
  s += { sportcruiser: 15, da20: 10, da40: 5, heavier: 0 }[aircraft] || 0;
  if (ridgeWind > 40) s += 15;
  else if (ridgeWind > 25) s += 8;
  s += sigmetBonus + pirepBonus;
  return Math.max(0, Math.min(100, s));
}

function getRiskLevel(score) {
  if (score < 30) return "LOW";
  if (score < 55) return "CAUTION";
  if (score < 75) return "HIGH";
  return "NO-GO";
}

const RISK_COLORS = { LOW: "#22c55e", CAUTION: "#f59e0b", HIGH: "#f97316", "NO-GO": "#ef4444" };

const NARRATIVES = {
  LOW: {
    summary: "Conditions appear manageable. Standard wave awareness required.",
    actions: [
      "Verify G-AIRMET Tango status on aviationweather.gov before departure",
      "Note PIREPs within 50nm — treat them as ground truth, not advisory",
      "Cross-check GPS altitude vs. altimeter throughout; flag >300 ft disagreement",
      "File a departure PIREP — your data protects the next pilot",
    ],
  },
  CAUTION: {
    summary: "Wave activity probable. Go/no-go requires active Skew-T and PIREP review.",
    actions: [
      "Re-confirm advisories and PIREPs within 30 minutes of departure",
      "Approach every ridgeline at 45° — never perpendicular",
      "Pre-identify your exit: nearest valley/lower terrain, before you need it",
      "In sink: Va, full power, nose AT or BELOW horizon — never back-pressure",
      "Consider delaying to daytime if student or solo flight",
    ],
  },
  HIGH: {
    summary: "Significant wave likely. Warrants serious reconsideration for light aircraft.",
    actions: [
      "Do not proceed without PIREP confirmation of smooth conditions on route",
      "Active non-convective SIGMET (WS)? Full stop — no-go, no exceptions",
      "Night + wave + light aircraft = highest-risk NTSB accident profile",
      "Cross-check GPS altitude every 5 minutes; declare with ATC at first hint of wave",
      "SportCruiser or DA20 at night with these parameters: stay on the ground",
    ],
  },
  "NO-GO": {
    summary: "NO-GO. This combination matches the JAL/Evergreen Anchorage and BOAC Fuji parameter envelope.",
    actions: [
      "Do not depart. Full stop.",
      "Re-check in 4–6 hours or when ridge-top winds drop below 25 kts",
      "If already airborne: declare — 'Unable to maintain altitude, mountain wave encounter'",
      "Turn 45–90° toward lowest available terrain; exit the wave train laterally",
      "Emergency: Va, nose at horizon, full power — trust attitude indicator over your inner ear",
    ],
  },
};

// ─── Scenarios ────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {
    label: "Night Solo: Mt. Nebo → U14 Nephi",
    emoji: "🌙",
    story: "Student pilot on a night cross-country. FSS mentions 'some wave activity.' Ridge-top winds 30 kts NW, increasing with altitude. Moderate stable layer on Skew-T.",
    params: { ridgeElev: 11928, valleyElev: 5022, ridgeWind: 30, flightTime: "night", aircraft: "da20" },
    wizard: { temp_inversion: 2, wind_direction: 2, wind_shear: 2, pireps: 0, advisories: 2 },
  },
  {
    label: "BOAC Speedbird 911 — Mt. Fuji 1966",
    emoji: "🗻",
    story: "Boeing 707 in clear sky after cold frontal passage. Crew descends to 16,000 ft for passenger view of Mt. Fuji. Summit winds 65 kts NW. No visible warning. 124 killed.",
    params: { ridgeElev: 12388, valleyElev: 1000, ridgeWind: 65, flightTime: "day", aircraft: "heavier" },
    wizard: { temp_inversion: 3, wind_direction: 2, wind_shear: 2, pireps: 0, advisories: 0 },
  },
  {
    label: "JAL/Evergreen 46E — Anchorage 1993",
    emoji: "✈️",
    story: "Boeing 747 departing Anchorage into known wave conditions. Active SIGMET. ATC reports prior crew declared severe turbulence at 2,500 ft on same runway. Crew departed anyway.",
    params: { ridgeElev: 13000, valleyElev: 150, ridgeWind: 75, flightTime: "day", aircraft: "heavier" },
    wizard: { temp_inversion: 3, wind_direction: 2, wind_shear: 2, pireps: 4, advisories: 5 },
  },
  {
    label: "Calm Day VFR — KPVU to Nephi",
    emoji: "☀️",
    story: "Day VFR training flight from Provo. Winds at 12,000 ft are 12 kts. No advisories, no PIREPs. Skew-T shows no significant inversion. DA40 with CFI aboard.",
    params: { ridgeElev: 11928, valleyElev: 4497, ridgeWind: 12, flightTime: "day", aircraft: "da40" },
    wizard: { temp_inversion: 0, wind_direction: 0, wind_shear: 0, pireps: 0, advisories: 0 },
  },
];

// ─── Animated value ───────────────────────────────────────────────────────────
function AnimVal({ value, decimals = 1, suffix = "" }) {
  const [disp, setDisp] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (value === null || value === undefined) return;
    const end = parseFloat(value);
    const from = disp;
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 480, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisp(from + (end - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span>{(value === null || value === undefined) ? "—" : disp.toFixed(decimals) + suffix}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Gauge({ score }) {
  const color = RISK_COLORS[getRiskLevel(score)];
  return (
    <div style={{ margin: "8px 0 5px" }}>
      <div style={{ height: 7, background: "rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg,#22c55e,${color})`, borderRadius: 6, transition: "width 0.7s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}55` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "rgba(255,255,255,0.2)", fontFamily: "'Share Tech Mono',monospace", marginTop: 2 }}>
        <span>LOW</span><span>CAUTION</span><span>HIGH</span><span>NO-GO</span>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step = 1, unit, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <label style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</label>
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: "#38bdf8" }}>{value.toLocaleString()} <span style={{ fontSize: 9, color: "rgba(56,189,248,0.5)" }}>{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }} />
      {hint && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", fontFamily: "'Inter',sans-serif", marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Toggles({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{ flex: 1, minWidth: 55, padding: "5px 7px", background: value === o.value ? "rgba(56,189,248,0.14)" : "rgba(255,255,255,0.04)", border: value === o.value ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.09)", borderRadius: 5, color: value === o.value ? "#38bdf8" : "rgba(255,255,255,0.38)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.03em" }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tile({ label, value, sub, color = "#38bdf8", glow }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}2a`, borderRadius: 7, padding: "9px 10px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {glow && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse,${color}14 0%,transparent 70%)`, animation: "pulseGlow 2s ease-in-out infinite", pointerEvents: "none" }} />}
      <div style={{ fontSize: 19, fontFamily: "'Share Tech Mono',monospace", color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", fontFamily: "'Inter',sans-serif", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [ridgeElev, setRidgeElev] = useState(11928);
  const [valleyElev, setValleyElev] = useState(5022);
  const [ridgeWind, setRidgeWind] = useState(30);
  const [flightTime, setFlightTime] = useState("night");
  const [aircraft, setAircraft] = useState("da20");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState({});
  const [wizardDone, setWizardDone] = useState(false);

  const [showActions, setShowActions] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  const stability = wizardDone ? classifyStability(wizardAnswers) : "moderate";
  const sigmetBonus = wizardAnswers.advisories === 5 ? 25 : 0;
  const pirepBonus = wizardAnswers.pireps === 4 ? 12 : wizardAnswers.pireps === 2 ? 5 : 0;

  const reliefFt = Math.max(0, ridgeElev - valleyElev);
  const waveRatio = calcWaveRatio(ridgeWind, reliefFt);
  const fr = calcFroude(ridgeWind, stability, reliefFt);
  const frRegime = getFrRegime(fr);
  const score = calcRisk({ waveRatio, isNight: flightTime === "night", aircraft, stability, ridgeWind, sigmetBonus, pirepBonus });
  const riskLevel = getRiskLevel(score);
  const riskColor = RISK_COLORS[riskLevel];
  const narrative = NARRATIVES[riskLevel];

  const loadScenario = (s, i) => {
    setRidgeElev(s.params.ridgeElev); setValleyElev(s.params.valleyElev);
    setRidgeWind(s.params.ridgeWind); setFlightTime(s.params.flightTime);
    setAircraft(s.params.aircraft); setWizardAnswers(s.wizard);
    setWizardDone(true); setWizardOpen(false); setWizardStep(0);
    setActiveScenario(i); setShowActions(true);
  };

  const handleWizardAnswer = (id, val) => {
    const updated = { ...wizardAnswers, [id]: val };
    setWizardAnswers(updated);
    if (wizardStep < WIZARD_QUESTIONS.length - 1) {
      setTimeout(() => setWizardStep(s => s + 1), 200);
    } else {
      setWizardDone(true); setWizardOpen(false); setShowActions(true);
    }
  };

  const resetWizard = () => {
    setWizardAnswers({}); setWizardDone(false);
    setWizardStep(0); setWizardOpen(true); setActiveScenario(null);
  };

  const currentQ = WIZARD_QUESTIONS[wizardStep];

  return (
    <>
      <style>{`
        @import url('${FONT_URL}');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#050a12;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:4px;background:rgba(255,255,255,0.1);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#38bdf8;cursor:pointer;box-shadow:0 0 7px #38bdf877;}
        @keyframes pulseGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.3s ease;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(56,189,248,0.25);border-radius:2px;}
      `}</style>

      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#050a12 0%,#091525 55%,#050e1a 100%)", fontFamily: "'Inter',sans-serif", color: "#e8f4fd", paddingBottom: 48 }}>

        {/* Grid overlay */}
        <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(56,189,248,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(56,189,248,0.025) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ borderBottom: "1px solid rgba(56,189,248,0.12)", padding: "16px 20px 13px", background: "rgba(5,10,18,0.88)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M2 28L12 8L18 18L22 12L30 28H2Z" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 14 Q13 10 18 14 Q23 18 28 14" stroke="rgba(56,189,248,0.4)" strokeWidth="1" fill="none" strokeDasharray="2 2" />
            </svg>
            <div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.08em", color: "#e0f2fe", lineHeight: 1 }}>MOUNTAIN WAVE RISK CALCULATOR</div>
              <div style={{ fontSize: 9, color: "rgba(56,189,248,0.5)", fontFamily: "'Share Tech Mono',monospace", letterSpacing: "0.15em", marginTop: 2 }}>WASATCH FRONT · FAA-H-8083-28 · PREFLIGHT DECISION TOOL</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 14px" }}>

          {/* Scenario cards */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9, fontFamily: "'Share Tech Mono',monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 7 }}>LEARN FROM REAL EVENTS — LOAD A SCENARIO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 7 }}>
              {SCENARIOS.map((s, i) => (
                <button key={i} onClick={() => loadScenario(s, i)}
                  style={{ background: activeScenario === i ? "rgba(56,189,248,0.09)" : "rgba(255,255,255,0.03)", border: activeScenario === i ? "1px solid rgba(56,189,248,0.45)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 10px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, color: activeScenario === i ? "#38bdf8" : "rgba(255,255,255,0.6)", letterSpacing: "0.03em", marginBottom: 4, lineHeight: 1.2 }}>{s.emoji} {s.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>{s.story}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginTop: 13 }}>

            {/* LEFT */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 16px 14px" }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", color: "rgba(56,189,248,0.65)", marginBottom: 14, textTransform: "uppercase" }}>◈ Flight Parameters</div>
              <Slider label="Ridge / Peak Elevation" value={ridgeElev} onChange={v => { setRidgeElev(v); setActiveScenario(null); }} min={4000} max={14500} step={100} unit="ft MSL" hint="Mt. Nebo = 11,928 ft · Find in ForeFlight Aeronautical Map" />
              <Slider label="Airport / Destination Elevation" value={valleyElev} onChange={v => { setValleyElev(v); setActiveScenario(null); }} min={0} max={8000} step={50} unit="ft MSL" hint="U14 Nephi = 5,022 ft · KPVU Provo = 4,497 ft" />
              <Slider label="Ridge-Top Wind Speed" value={ridgeWind} onChange={v => { setRidgeWind(v); setActiveScenario(null); }} min={5} max={90} step={5} unit="kts" hint="ForeFlight Winds Aloft → set layer to ridge MSL altitude" />
              <Toggles label="Flight Time" value={flightTime} onChange={v => { setFlightTime(v); setActiveScenario(null); }} options={[{ label: "Day VFR", value: "day" }, { label: "Night", value: "night" }]} />
              <Toggles label="Aircraft" value={aircraft} onChange={v => { setAircraft(v); setActiveScenario(null); }} options={[{ label: "SportCruiser", value: "sportcruiser" }, { label: "DA20", value: "da20" }, { label: "DA40", value: "da40" }, { label: "Heavier/IFR", value: "heavier" }]} />

              {/* Stability wizard */}
              <div style={{ padding: "10px 12px", background: wizardDone ? "rgba(56,189,248,0.06)" : "rgba(255,255,255,0.03)", border: wizardDone ? "1px solid rgba(56,189,248,0.28)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", color: wizardDone ? "#38bdf8" : "rgba(255,255,255,0.38)", textTransform: "uppercase" }}>
                      {wizardDone ? `✓ Stability: ${stabilityLabel(stability)}` : "◈ Atmospheric Stability Check"}
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.22)", fontFamily: "'Inter',sans-serif", marginTop: 2, lineHeight: 1.4 }}>
                      {wizardDone ? "5 questions answered · affects Froude index and risk score" : "5 guided questions · no Skew-T expertise needed"}
                    </div>
                  </div>
                  <button onClick={wizardDone ? resetWizard : () => setWizardOpen(true)} style={{ padding: "4px 10px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 5, color: "#38bdf8", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, cursor: "pointer", letterSpacing: "0.07em", flexShrink: 0, marginLeft: 8 }}>
                    {wizardDone ? "REDO" : "START →"}
                  </button>
                </div>
                {!wizardDone && (
                  <div style={{ fontSize: 8, color: "rgba(255,200,100,0.5)", fontFamily: "'Share Tech Mono',monospace", marginTop: 6, letterSpacing: "0.08em" }}>
                    ⚠ Using estimated stability — complete check for accurate Froude index
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>

              {/* Computed values */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px" }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.15em", color: "rgba(56,189,248,0.65)", marginBottom: 10, textTransform: "uppercase" }}>◈ Computed Values</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  <Tile label="Terrain Relief" value={<AnimVal value={reliefFt} decimals={0} />} sub="feet" color="#38bdf8" />
                  <Tile label="Wave Ratio" value={waveRatio ? <AnimVal value={waveRatio} decimals={1} /> : "—"} sub="wind ÷ relief (klft)" color={!waveRatio ? "#38bdf8" : waveRatio < 2.5 ? "#22c55e" : waveRatio < 4 ? "#f59e0b" : waveRatio < 6 ? "#f97316" : "#ef4444"} />
                  <Tile label="Froude Index" value={fr ? <AnimVal value={fr} decimals={2} /> : "—"} sub={frRegime ? frRegime.code : "heuristic"} color={frRegime ? frRegime.color : "#38bdf8"} />
                  <Tile label="Risk Score" value={<AnimVal value={score} decimals={0} suffix="/100" />} sub={`${aircraft} · ${flightTime}`} color={riskColor} glow={riskLevel === "NO-GO" || riskLevel === "HIGH"} />
                </div>
              </div>

              {/* Risk panel */}
              <div className="fu" style={{ background: `linear-gradient(135deg,rgba(5,10,18,0.95),${riskColor}0d)`, border: `1px solid ${riskColor}40`, borderRadius: 12, padding: "13px", boxShadow: `0 0 20px ${riskColor}18` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor, boxShadow: `0 0 8px ${riskColor}`, flexShrink: 0, animation: riskLevel !== "LOW" ? "pulseGlow 1.5s ease-in-out infinite" : "none" }} />
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 20, color: riskColor, letterSpacing: "0.1em", lineHeight: 1 }}>{riskLevel}</div>
                  {!wizardDone && <div style={{ fontSize: 8, color: "rgba(255,200,100,0.5)", fontFamily: "'Share Tech Mono',monospace", marginLeft: "auto", letterSpacing: "0.07em" }}>⚠ EST. STABILITY</div>}
                </div>
                <Gauge score={score} />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontFamily: "'Inter',sans-serif", lineHeight: 1.55, marginTop: 7, marginBottom: 9 }}>{narrative.summary}</div>
                <button onClick={() => setShowActions(!showActions)} style={{ width: "100%", padding: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 5, color: "rgba(255,255,255,0.35)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.1em", cursor: "pointer", marginBottom: showActions ? 9 : 0 }}>
                  {showActions ? "▲ HIDE PILOT ACTIONS" : "▼ SHOW PILOT ACTIONS"}
                </button>
                {showActions && (
                  <div className="fu">
                    {narrative.actions.map((a, i) => (
                      <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
                        <span style={{ color: riskColor, fontFamily: "'Share Tech Mono',monospace", fontSize: 8, marginTop: 2, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.52)", fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Froude regime */}
              {frRegime && (
                <div className="fu" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${frRegime.color}2e`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.22)", marginBottom: 3 }}>FROUDE REGIME</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 13, color: frRegime.color, letterSpacing: "0.05em" }}>{frRegime.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", marginTop: 4, fontFamily: "'Inter',sans-serif", lineHeight: 1.5 }}>
                    {frRegime.code === "blocking" && "Air stacks windward. Lee-side rotors at or below ridge altitude. Mechanical turbulence likely."}
                    {frRegime.code === "resonance" && "Wind matches mountain's natural frequency — maximum wave amplitude. 3,000+ fpm drafts possible. NO-GO for light aircraft."}
                    {frRegime.code === "shooting" && "Supercritical downslope flow. 'Boulder windstorm' effect. Hydraulic jump at valley floor. Extreme gusts near terrain."}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reference table */}
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "7px 13px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.28)" }}>
              WASATCH FRONT — LIGHT AIRCRAFT HARD LIMITS
            </div>
            {[
              ["Ridge-top winds", "> 25 kts W/NW + night + stable layer", "TREAT AS WAVE", "#f59e0b"],
              ["Wave ratio", "> 4.0 any light aircraft", "STRONG CAUTION", "#f97316"],
              ["Wave ratio", "> 6.0 any aircraft", "WINDSTORM — NO-GO", "#ef4444"],
              ["SIGMET (WS)", "Active on route", "FULL STOP — NO-GO", "#ef4444"],
              ["PIREP moderate+", "Within 50nm of route", "RE-EVALUATE NOW", "#f97316"],
              ["GPS vs. altimeter", "> 300 ft disagreement over terrain", "STOP. CLIMB. EVALUATE.", "#ef4444"],
            ].map(([trigger, cond, action, color], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", padding: "5px 13px", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 8, fontFamily: "'Share Tech Mono',monospace", color: "rgba(255,255,255,0.38)" }}>{trigger}</span>
                <span style={{ fontSize: 8, fontFamily: "'Inter',sans-serif", color: "rgba(255,255,255,0.22)" }}>{cond}</span>
                <span style={{ fontSize: 8, fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, color, letterSpacing: "0.04em" }}>{action}</span>
              </div>
            ))}
          </div>

          {/* PIREP reminder */}
          <div style={{ marginTop: 11, background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.13)", borderRadius: 9, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📡</span>
            <div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 11, color: "#38bdf8", letterSpacing: "0.07em", marginBottom: 2 }}>FILE A PIREP — PROTECT THE PILOT BEHIND YOU</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 }}>
                Smooth or rough — report it. The JAL/Evergreen crew received a severe turbulence PIREP from the same runway minutes before takeoff and departed anyway. <strong style={{ color: "rgba(255,255,255,0.55)" }}>Your PIREP may save a life.</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 8, color: "rgba(255,255,255,0.13)", fontFamily: "'Share Tech Mono',monospace", lineHeight: 1.9, letterSpacing: "0.08em" }}>
            EDUCATIONAL TOOL · NOT A CERTIFIED WEATHER PRODUCT · ALWAYS OBTAIN A COMPLETE FAA WEATHER BRIEFING<br />
            FAA-H-8083-28 Ch.16 · AIM 7-1-5/6 · FAR 91.103 · OPTIMIZED FOR WASATCH FRONT OPERATIONS
          </div>
        </div>

        {/* ── Wizard modal ── */}
        {wizardOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5,10,18,0.93)", backdropFilter: "blur(18px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "linear-gradient(160deg,#091525,#050e1a)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 14, padding: "24px", maxWidth: 540, width: "100%", boxShadow: "0 0 60px rgba(56,189,248,0.07)" }}>

              {/* Modal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: 15, color: "#e0f2fe", letterSpacing: "0.06em" }}>ATMOSPHERIC STABILITY CHECK</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "'Inter',sans-serif", marginTop: 2 }}>Answer from ForeFlight or aviationweather.gov — no meteorology training required</div>
                </div>
                <button onClick={() => setWizardOpen(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 4, color: "rgba(255,255,255,0.35)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, cursor: "pointer", padding: "3px 9px", flexShrink: 0, marginLeft: 12 }}>CLOSE</button>
              </div>

              {/* Progress */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "rgba(56,189,248,0.45)", letterSpacing: "0.12em" }}>QUESTION {wizardStep + 1} / {WIZARD_QUESTIONS.length}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {WIZARD_QUESTIONS.map((_, i) => (
                    <div key={i} style={{ width: 22, height: 3, borderRadius: 2, background: i <= wizardStep ? "#38bdf8" : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />
                  ))}
                </div>
              </div>

              {/* Question */}
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 14, color: "#e0f2fe", lineHeight: 1.45, marginBottom: 8 }}>{currentQ.question}</div>

              {/* Why this matters */}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'Inter',sans-serif", lineHeight: 1.55, marginBottom: 14, padding: "7px 11px", background: "rgba(56,189,248,0.04)", borderLeft: "2px solid rgba(56,189,248,0.22)", borderRadius: "0 4px 4px 0" }}>
                <span style={{ color: "rgba(56,189,248,0.45)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 8, letterSpacing: "0.1em" }}>WHY THIS MATTERS · </span>{currentQ.why}
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {currentQ.options.map(opt => (
                  <button key={opt.value} onClick={() => handleWizardAnswer(currentQ.id, opt.value)}
                    style={{ padding: "9px 13px", background: wizardAnswers[currentQ.id] === opt.value ? "rgba(56,189,248,0.11)" : "rgba(255,255,255,0.04)", border: wizardAnswers[currentQ.id] === opt.value ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.09)", borderRadius: 7, color: wizardAnswers[currentQ.id] === opt.value ? "#e0f2fe" : "rgba(255,255,255,0.48)", fontFamily: "'Inter',sans-serif", fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span>{opt.label}</span>
                    <span style={{ fontSize: 8, color: wizardAnswers[currentQ.id] === opt.value ? "rgba(56,189,248,0.65)" : "rgba(255,255,255,0.18)", fontFamily: "'Share Tech Mono',monospace", flexShrink: 0 }}>{opt.hint}</span>
                  </button>
                ))}
              </div>

              {wizardStep > 0 && (
                <button onClick={() => setWizardStep(s => s - 1)} style={{ marginTop: 14, background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 10, cursor: "pointer", letterSpacing: "0.07em" }}>← BACK</button>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
