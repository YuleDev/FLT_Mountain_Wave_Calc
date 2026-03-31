# ✈️ Mountain Wave Risk Calculator
**A Preflight Decision Tool for Wasatch Front and Western Mountain Terrain Flights**

[![Live Tool](https://img.shields.io/badge/Live%20Tool-Open%20Calculator-38bdf8?style=flat&logo=googlechrome&logoColor=white)](https://yuledev.github.io/FLT_Mountain_Wave_Calc/)
[![FAA Reference](https://img.shields.io/badge/FAA--H--8083--28A-Aviation%20Weather%20Handbook-1d4ed8?style=flat&logo=bookstack&logoColor=white)](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28a-aviation-weather-handbook)
[![ACS Standards](https://img.shields.io/badge/ACS-Standards%20Addressed-16a34a?style=flat&logo=checkmarx&logoColor=white)](#acs-standards-directly-addressed)

---

## What This Is

The Mountain Wave Risk Calculator is a browser-based preflight decision tool built to help student pilots, certificated pilots, and CFIs quantify mountain wave risk before departing on flights near significant terrain — specifically the Wasatch Front and surrounding Utah ranges, though applicable to any mountainous western US corridor.

It operationalizes the go/no-go math that most pilots know they should do but rarely do systematically: wave ratio, Froude Number regime, terrain relief, ridge-top wind speed, density altitude, climb margin, stability layer assessment, and wind geometry — combined into a single, structured preflight check.

This tool is a companion to the ground school briefing *"The Invisible Rollercoaster: Mastering Mountain Wave Turbulence at Night."*

---

## Why This Exists

Mountain wave turbulence is the most underestimated hazard in western US general aviation:

| Statistic | Value | Source |
|---|---|---|
| Fatality rate in mountain wave accidents | 66% | NASA/NTSB 1987–2008 |
| Aircraft total loss rate | 66% | NASA/NTSB 1987–2008 |
| NTSB accidents with wave as primary cause | 42 | NTSB records 1990–2017 |
| GA fatal turbulence accidents (2008–2022) | 35 of 40 | FAA 2008–2022 |
| Part 121 fatal turbulence accidents since 2008 | 0 | FAA 2008–2022 |

The typical accident profile, by the numbers:

| Who | Percentage |
|---|---|
| Single piston-engine aircraft involved | 74% |
| Operating under Part 91 (GA rules) | 90% |
| Pilot held only a Private certificate | 47% |
| Accident occurred during cruise or maneuvering flight | 70% |

If you are a student or newly certificated private pilot flying a single-engine piston aircraft in the western US — **this is you.** That is the audience this tool is built for.

Neither BOAC Speedbird 911 (124 killed, Mt. Fuji, 1966) nor JAL/Evergreen 46E (engine separated, Anchorage, 1993) were caused by a lack of available information. They were caused by not acting on it. This tool forces the act of checking.

---

## What the Calculator Does

The calculator guides the pilot through a structured preflight wave check, computing risk indicators at each step.

### Step 1 — Terrain Relief
Input the highest ridge elevation and destination airport elevation. The calculator derives terrain relief (H), which anchors all subsequent calculations.

**Example — Mt. Nebo / U14 (Nephi Municipal):**
- Ridge: 11,928 ft MSL (Mt. Nebo, highest Wasatch peak)
- Airport: 5,022 ft MSL
- Relief: 6,906 ft (H = 6.9)

### Step 2 — Wave Ratio (Quick Heuristic)

```
Wave Ratio = Ridge-Top Wind Speed (kts) ÷ Terrain Relief (thousands of ft)
```

| Ratio | Interpretation |
|---|---|
| < 2.5 | Low concern — routine mountain awareness |
| 2.5 – 4.0 | Caution — well-organized wave possible, brief thoroughly |
| 4.0 – 6.0 | Danger — expect significant vertical drafts, go/no-go decision required |
| > 6.0 | Windstorm — no-go for all light aircraft |

> **Note:** The wave ratio is an informal heuristic, not a certified formula. Use alongside Froude Number and official weather products.

### Step 3 — Froude Number Regime

The calculator uses the dimensionally consistent Froude Number formula:

```
Fr = U / (N × H)

U = ridge-top wind speed (m/s, converted from knots)
N = Brunt-Väisälä frequency proxy (rad/s) — derived from stability classification:
    Strong stable layer → N = 0.020 rad/s
    Moderate stability  → N = 0.012 rad/s
    Weak/no stable layer → N = 0.006 rad/s
H = terrain relief (meters, converted from feet)
```

| Fr | Regime | What to Expect |
|---|---|---|
| Fr < 0.8 | Mountain Wins (Blocking) | Rotors near ridge altitude, mechanical turbulence, windward updrafts |
| Fr 0.8–1.2 | **Maximum Danger (Resonance)** | 3,000+ fpm vertical drafts, severe rotor, altimeter errors 500–2,000 ft — **NO-GO** |
| Fr > 1.2 | Wind Wins (Shooting Flow) | Extreme downslope winds, hydraulic jump on valley floor, Vno exceedance risk |

The Brunt-Väisälä frequency (N) is derived from the atmospheric stability wizard — see Step 5. This is the same N that appears in the formal Fr equation in FAA-H-8083-28; the calculator uses representative values calibrated to each stability regime.

### Step 4 — Wind Direction to Ridgeline

Wind geometry significantly affects wave organization. The calculator asks for the wind direction relative to the ridgeline:

| Angle | Effect | Risk Modifier |
|---|---|---|
| Perpendicular (~90°) | Most organized, powerful standing wave | +12 pts |
| Oblique (~45°) | Moderate wave organization | +5 pts |
| Parallel | Minimal wave generation | +0 pts |

Perpendicular flow across the Wasatch from the W/NW is the classic high-risk setup for the Nephi corridor.

### Step 5 — Atmospheric Stability Check (Wizard)

A guided 5-question wizard assesses atmospheric stability from publicly available weather data (ForeFlight Winds Aloft, aviationweather.gov Skew-T). No meteorology background required.

**Critical architecture note:** The stability wizard assesses meteorological conditions only — temperature inversion, wind direction consistency, and wind shear. PIREPs and SIGMETs are intentionally excluded from the stability score. They are assessed separately as real-world risk signals and scored independently. This prevents double-counting and keeps the Froude Number calculation physically meaningful.

The three meteorological inputs produce a stability classification:
- **Strong stable layer** (N = 0.020 rad/s) — strong temperature inversion, organized multi-level flow, increasing shear
- **Moderate stability** (N = 0.012 rad/s) — partial inversion or partial flow organization
- **Weak/no stable layer** (N = 0.006 rad/s) — no inversion, disorganized flow

### Step 6 — Density Altitude and Climb Margin

This is the variable most preflight checklists omit entirely.

**Density altitude** is computed from Outside Air Temperature (OAT) and airport elevation using the standard approximation:
```
DA ≈ Pressure Altitude + 120 × (OAT − ISA temp at that altitude)
ISA temp = 15°C − (1.98°C per 1,000 ft)
```

**Adjusted climb rate** scales the aircraft's sea-level climb rate linearly to the computed density altitude:
```
Adjusted Climb Rate = Book Climb Rate × (1 − DA / Service Ceiling)
```

**Estimated wave sink** is derived from wave ratio thresholds, based on NASA/FAA mountain wave study data:
- Wave ratio < 2.5 → ~500 fpm
- Wave ratio 2.5–4.0 → ~1,500 fpm
- Wave ratio 4.0–6.0 → ~3,000 fpm
- Wave ratio > 6.0 → ~5,000 fpm

**Climb margin** = Adjusted Climb Rate − Estimated Wave Sink

A negative climb margin means the aircraft physically cannot outclimb the estimated wave downdraft using engine power alone. This is not a death sentence — the correct response is lateral exit, not a climb attempt — but it directly informs the go/no-go decision.

> ⚠️ **Even a positive climb margin does not mean "pull back."** In a wave encounter, maintain Va, accept the descent, and exit laterally. Full power provides control authority and limits altitude loss — it is not an altitude recovery tool in a major wave downdraft.

### Step 7 — Go/No-Go Advisory Ladder

| Product / Condition | Action |
|---|---|
| G-AIRMET Tango active on route | Caution — apply full wave check before departure |
| Non-convective SIGMET (WS) active | **Hard no-go. Overrides all other inputs. Not a judgment call.** |
| Moderate+ PIREP on your route | Treat as a personal warning — go/no-go review required |
| Skew-T shows stable layer at ridge level | High N — expect organized, amplified wave |

**SIGMET Hard Override:** An active non-convective SIGMET (WS) for severe turbulence on or near the route locks the calculator to NO-GO regardless of any other inputs. No score calculation can override this. The UI displays a "SIGMET OVERRIDE" indicator so the pilot knows the exact reason.

### Step 8 — Pilot Experience (ADM Margin)

Mountain wave physics are identical regardless of pilot certificate. What changes with experience is the quality of in-flight decision-making and the available error margin. A student pilot encountering the same wave as a commercial pilot has less trained response to draw from.

| Experience | ADM Modifier |
|---|---|
| Student | +12 pts |
| Private | +6 pts |
| Instrument-rated | +2 pts |
| Commercial / CFI | +0 pts |

> **Important:** This modifier does not reflect aircraft structural limits, wave severity, or any physical parameter. It reflects the statistical difference in human response quality under the stress of an unexpected wave encounter — consistent with NTSB ADM findings across mountain wave accidents.

### Aircraft Type — Structural Margin Only

The aircraft selector reflects airframe structural margin: Va at max gross weight, wing loading, and g-limit envelope. It does **not** reflect pilot rating, avionics capability, or IFR certification.

| Aircraft | Sea-Level Climb | Va (gross) | Structural Penalty |
|---|---|---|---|
| SportCruiser | 700 fpm | 83 kts | +15 pts |
| DA20-C1 | 800 fpm | 99 kts | +10 pts |
| DA40 | 1,070 fpm | 111 kts | +5 pts |
| Heavier GA | 1,200 fpm | 128 kts | +0 pts |

A SportCruiser flown by an instrument-rated pilot is still a SportCruiser. Select the aircraft, not the certificate.

---

## Weight-Adjusted Maneuvering Speed (Va)

This concept is not computed by the calculator but is essential knowledge for any pilot operating near mountain terrain.

Va is not a fixed number — it **decreases as the aircraft gets lighter:**

```
Va (adjusted) = Va (max gross) × √( Current Weight ÷ Max Gross Weight )
```

**Why this matters in a rotor:** A lighter aircraft reaches its structural load limit at a lower airspeed. If you are flying solo with partial fuel in a SportCruiser or DA20, your actual Va may be 10–15 knots below the placarded value. Exceeding adjusted Va in severe turbulence can cause structural failure.

**The scenario:** Solo student, half tanks, SportCruiser. Published Va = 83 kts. Aircraft weight ~950 lbs vs. max gross 1,320 lbs.
```
Va (adjusted) = 83 × √(950 ÷ 1320) = 83 × 0.848 = ~70 kts
```
That pilot's actual structural margin disappears 13 knots sooner than the placard suggests. In a rotor encounter, that gap can matter.

**Rule:** Know your weight before you depart. Calculate your adjusted Va. In turbulence, stay 10–15 knots *below* your adjusted Va — not at it.

---

## In-Flight Quick Reference

If the preflight check is missed and a wave encounter occurs:

```
IMMEDIATE ACTIONS — MOUNTAIN WAVE ENCOUNTER
────────────────────────────────────────────
1. SET Va  — Do not exceed. Do not chase altitude.
2. IN SINK — Full power. Nose at/below horizon. Accept the descent.
             DO NOT PULL BACK. You cannot out-climb the atmosphere.
3. EXIT    — Turn 45°–90° toward the valley / lower terrain.
             Waves are linear — exit the wave train laterally.
4. DECLARE — "Unable to maintain altitude, mountain wave encounter."
             Clears airspace below you. Alerts ATC and other traffic.
5. ALTIMETER CHECK — If GPS and pressure altitude disagree by >300 ft
             over terrain: STOP. CLIMB. DIVERT. GPS = truth.
```

---

## Instrument Traps This Tool Helps You Remember

### The Altimeter Lie
Accelerated airflow over a ridge lowers static pressure at the static port. The altimeter interprets this as higher altitude than you actually are. Documented over-reads of 500–1,500 ft are common; >2,000 ft in extreme events.

**Rule:** GPS geometric altitude = terrain clearance. Pressure altitude = unreliable in wave.

### The VSI Ambush
In laminar flow above the wave, the aircraft feels smooth and the VSI may be steady. The rotor below can produce 3,000+ fpm sink with no warning transition. By the time the VSI pegs, terrain clearance may already be critically low — especially at night.

### The Tailwind/Groundspeed Trap
High groundspeed in a tailwind means a steeper descent gradient over the ground. A 40-knot tailwind combined with a downdraft pushes the aircraft forward into the terrain and downward simultaneously. If groundspeed is increasing while VSI is dropping: turn away immediately.

---

## Regulatory and Reference Basis

| Reference | Coverage |
|---|---|
| FAA-H-8083-28 Ch. 16 | Mountain wave mechanics, rotor, lenticular, hydraulic jump |
| FAA-H-8083-25 Ch. 12 | Aviation weather — stability, wave, inversions |
| AIM 7-1-5 | AIRMETs — Sierra, Tango, Zulu |
| AIM 7-1-6 | SIGMETs — non-convective (WS) turbulence criterion |
| FAR 91.103 | Preflight action requirements |
| AC 00-45 | Aviation Weather Services — Skew-T, PIREPs, GFA |

---

## ACS Standards Directly Addressed

| Standard | Area |
|---|---|
| PA.I.B.K3 / K3a | Mountain wave, lenticular, rotor, wave indicators |
| PA.I.C | ADM, TEM, risk management, hazardous attitude |
| PA.II.A | Weather product interpretation — G-AIRMET, SIGMET, PIREPs, Skew-T |
| PA.X.A | Emergency operations — unexpected turbulence, terrain, structural loads |
| IR.I.B.K3 | Mountain wave as IFR hazard, altimeter unreliability |
| CA.I.B.K3 | Advanced wave mechanics, crew coordination, structural limits |

---

## AIRMET / SIGMET Quick Reference

A common source of confusion:

| Product | What It Covers | Mountain Wave Relevance |
|---|---|---|
| AIRMET Sierra | IFR conditions, mountain obscuration | ❌ Not turbulence, not wave |
| AIRMET Tango | Moderate turbulence (including wave) | ✅ Check first for mountain flying |
| SIGMET (WS) | Severe/extreme turbulence, severe icing, volcanic ash | ✅ Active SIGMET = hard no-go |

There is no US advisory product specifically named "Mountain Wave SIGMET." Mountain wave producing severe or extreme turbulence is captured under the standard non-convective SIGMET (WS) turbulence severity criterion.

---

## Pre-Solo Mountain Wave Endorsement

CFIs may use this tool as part of the pre-solo mountain terrain endorsement oral. The student should be able to:

- Explain mountain wave formation, rotor, the three Froude Number regimes, and lenticular/cap cloud identification without reference material
- Locate G-AIRMET Tango, non-convective SIGMET WS, and PIREPs on aviationweather.gov and correctly identify go/no-go triggers
- Correctly answer both standard endorsement scenarios:
  - **Scenario A:** G-AIRMET Tango + wave ratio 3.9 + stable layer on Skew-T + 30 kt NW ridge winds + night VFR = **NO-GO**
  - **Scenario B:** GPS 8,500 ft / altimeter 10,200 ft / VSI –1,800 fpm = Set Va, level nose, full power, 45–90° turn toward valley, declare with ATC

**Suggested endorsement language:**
> *"[Student] has received and demonstrated understanding of mountain wave hazards, visual and instrument cues, weather product interpretation, and correct in-flight response procedures per FAA-H-8083-28 Ch. 16. Authorized for solo flight in the [area] provided no G-AIRMET Tango or SIGMET WS is active for the route. [Date, CFI signature, certificate number]."*

---

## Local Knowledge — The Nephi Corridor

Flights into U14 (Nephi Municipal Airport, 5,022 ft MSL) from the north transit the lee side of Mt. Nebo (11,928 ft) — the highest Wasatch peak — with nearly 6,900 ft of terrain relief.

**Local Rule:** If ridge-top winds (≈11,000–12,000 ft) exceed 25 kts from the W/NW, the approach into U14 is no longer routine. Apply the full wave check. At night, you will not see the rotor — you will only feel the instantaneous transition from smooth laminar flow to violent multi-directional turbulence.

The venturi geometry of the Wasatch-to-west-range gap accelerates already-fast air further on its way through. The hydraulic jump that results can sit directly over the airport environment. Know the numbers before you depart.

---

## Further Resources

| Resource | Link |
|---|---|
| FAA Aviation Weather Handbook (FAA-H-8083-28A) | [faa.gov](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28a-aviation-weather-handbook) |
| AOPA Air Safety Institute — Mountain Flying Course | [aopa.org/asf](https://www.aopa.org/training-and-safety/air-safety-institute) |
| Aviation Weather Center (GFA, PIREPs, SIGMETs) | [aviationweather.gov](https://aviationweather.gov) |
| NTSB Aviation Accident Database | [ntsb.gov](https://www.ntsb.gov) |
| Utah Soaring Association (Wasatch wave expertise) | [utahsoaring.org](https://www.utahsoaring.org) |
| KSLC Skew-T Sounding | [aviationweather.gov/upperair](https://aviationweather.gov/upperair/java) |
| ForeFlight — GFA overlay + Winds Aloft layers | Use winds aloft layer set to ridge MSL altitude; check 12,000 ft for Wasatch flights |
| SkyVector — Flight planning with weather overlay | Cross-reference winds aloft and active SIGMETs during route planning |

---

## Disclaimer

This tool is an educational aid and preflight decision support resource. It does not replace an official FAA weather briefing, flight service station consultation, or the judgment of a certificated flight instructor. All go/no-go decisions remain the responsibility of the pilot in command under FAR 91.103.

The wave ratio heuristic used in this calculator is an informal decision aid — not a certified meteorological formula. The Froude Number is computed using a dimensionally consistent implementation of Fr = U / (N × H), with Brunt-Väisälä frequency values calibrated to observed stability regimes. Always cross-reference with official G-AIRMET, SIGMET, and PIREP data from aviationweather.gov.

---

*Built to enable and protect pilots. Fly the wing. Trust the math. Respect the waves.*

*Companion briefing: "The Invisible Rollercoaster — Mastering Mountain Wave Turbulence"*
