# ✈️ Mountain Wave Leg Evaluator
**A Per-Leg Preflight Decision Tool for Wasatch Front and Western Mountain Terrain Flights**

[![Live Tool](https://img.shields.io/badge/Live%20Tool-Open%20Evaluator-38bdf8?style=flat&logo=googlechrome&logoColor=white)](https://yuledev.github.io/FLT_Mountain_Wave_Calc/)
[![FAA Reference](https://img.shields.io/badge/FAA--H--8083--28A-Aviation%20Weather%20Handbook-1d4ed8?style=flat&logo=bookstack&logoColor=white)](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28a-aviation-weather-handbook)
[![ACS Standards](https://img.shields.io/badge/ACS-Standards%20Addressed-16a34a?style=flat&logo=checkmarx&logoColor=white)](#acs-standards-directly-addressed)

---

## What This Is

The Mountain Wave Leg Evaluator is a browser-based preflight decision tool built to help student pilots, certificated pilots, and CFIs quantify mountain wave risk before flying any leg near significant terrain — specifically the Wasatch Front and surrounding Utah ranges, though applicable to any mountainous western US corridor.

The tool is structured around a critical operational principle: **you evaluate each leg of your route separately.** Terrain relief, cruise altitude, ridge position, and density altitude all change between segments. A safe departure leg does not make a crossing leg safe. The Leg Evaluator forces deliberate, segment-by-segment thinking rather than a single pass-fail for the whole flight.

For each leg, the tool computes wave ratio, Froude Number regime, vertical wave scale, ridge clearance, time to terrain, density altitude, adjusted climb rate, estimated wave sink, and climb margin — combined into a structured preflight check with a scored go/no-go output.

This tool is a companion to the ground school briefing *"The Invisible Rollercoaster: Mastering Mountain Wave Turbulence."*

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

## What the Leg Evaluator Does

The Leg Evaluator guides the pilot through a structured preflight wave check for a specific route segment, computing risk indicators at each step. Run it once per leg.

### Step 1 — Leg Geometry: Three Altitude Inputs

Each leg requires three altitude values, all in feet MSL:

**Planned Cruise Altitude** is your intended cruising altitude for this leg. All performance calculations — density altitude, adjusted climb rate, ridge clearance, and time to terrain — are referenced to this value, not to the departure airport elevation. Use your planned cruise altitude from ForeFlight's altitude selector.

**Highest Ridge or Peak on the Leg** is the summit elevation of the highest terrain feature your route crosses or passes near. Find it on ForeFlight's Aeronautical Map or a sectional chart.

**Terrain Floor (Lowest Under Leg)** is the elevation of the lowest terrain directly beneath your planned route. This is not necessarily your destination airport — it is the floor of the valley or corridor you will fly over. If you enter a downdraft, this is the terrain that matters.

The tool then derives:
- **Terrain Relief (H)** = Ridge Elevation − Terrain Floor, which anchors the wave ratio and Froude Number
- **Ridge Clearance** = Cruise Altitude − Ridge Elevation, which determines whether you are above or below the ridge crest (negative = rotor zone)
- **Terrain Clearance** = Cruise Altitude − Terrain Floor, used to compute time to terrain at estimated wave sink rate

**Example — Mt. Nebo / U14 (Nephi Municipal) leg:**
- Cruise altitude: 9,500 ft MSL
- Ridge: 11,928 ft MSL (Mt. Nebo, highest Wasatch peak)
- Terrain floor: 5,022 ft MSL (U14 airport / valley floor)
- Relief: 6,906 ft (H = 6.9) → anchors wave ratio and Froude calculation
- Ridge clearance: −2,428 ft → cruise altitude is **below** the ridge crest → rotor zone entry

### Step 2 — Wave Ratio (Quick Heuristic)

```
Wave Ratio = Cross-Ridge Wind Component (kts) ÷ Terrain Relief (thousands of ft)
```

The wind input is the effective cross-ridge component (U⊥) — the full ridge-top wind speed corrected for the angle at which wind meets the ridge. Perpendicular flow uses the full wind; oblique (~45°) applies a 0.707 factor; parallel applies 0.10. This cosine correction is shared by all three wave physics outputs (wave ratio, Froude Number, and vertical wavelength) so the outputs remain internally consistent.

| Ratio | Interpretation |
|---|---|
| < 2.5 | Low concern — routine mountain awareness |
| 2.5 – 4.0 | Caution — well-organized wave possible, brief thoroughly |
| 4.0 – 6.0 | Danger — expect significant vertical drafts, go/no-go decision required |
| > 6.0 | Windstorm — no-go for all light aircraft |

> **Note:** The wave ratio is an informal heuristic from FAA-H-8083-28 and AC 00-57, not a certified formula. Use alongside Froude Number and official weather products.

### Step 3 — Froude Number Regime

The tool uses the dimensionally consistent Froude Number formula:

```
Fr = U⊥ / (N × H)

U⊥ = cross-ridge wind component (m/s) — total wind × cosine correction, then × 0.5144 to convert from knots
N  = Brunt-Väisälä frequency proxy (rad/s) — derived from the Atmospheric Stability Wizard:
     Strong stable layer  → N = 0.020 rad/s
     Moderate stability   → N = 0.012 rad/s
     Weak/no stable layer → N = 0.006 rad/s
H  = terrain relief (meters) — converted from feet via × 0.3048
```

Only the perpendicular component of wind forces a standing wave. Using the total wind in an oblique or parallel flow scenario would overstate Fr by up to 30–40%, potentially misclassifying the regime. The cosine correction is applied identically here as in the wave ratio.

| Fr | Regime | What to Expect |
|---|---|---|
| Fr < 0.8 | Mountain Wins (Blocking) | Rotors at or below ridge altitude; air stacks on windward side. Do not confuse "blocking" with "safe" — this regime destroyed BOAC 911. |
| Fr 0.8–1.2 | **Maximum Danger (Resonance)** | 3,000+ fpm vertical drafts, severe rotor, altimeter errors 500–2,000 ft — **NO-GO for all light aircraft** |
| Fr > 1.2 | Wind Wins (Shooting Flow) | Extreme downslope winds, hydraulic jump on valley floor, Vno exceedance risk |

The N values are dry-air estimates. Per Durran and Klemp (1983), in saturated or cloudy conditions the moist Brunt-Väisälä frequency (N_m) is lower than dry N — meaning the tool may slightly overstate wave organization in cloudy air. It errs conservative: overstating wave intensity is the safer error direction for a go/no-go tool.

### Step 4 — Vertical Wave Scale (λz)

Once the stability wizard is complete, the tool computes the vertical wavelength of the mountain wave:

```
λz = 2π × U⊥ / N
```

This formula is sourced from Durran (2003, Encyclopedia of Atmospheric Sciences) and validated against his example of N = 0.01047 s⁻¹, U = 10 m/s → λz ≈ 6 km. The output is displayed in nautical miles.

Operationally, λz tells you how much altitude separates the worst sink zone from the worst lift zone in the wave cycle. One quarter-wavelength (λz/4) is the vertical distance between the trough of maximum downdraft and the peak of maximum updraft. A short λz means the transitions are compressed into a smaller altitude band — the aircraft encounters full-amplitude sink within a shorter altitude change.

> **Important distinction:** λz is the *vertical* wavelength, not the horizontal crest-to-crest spacing. The horizontal distance between trapped lee wave crests is a different quantity determined by atmospheric layering structure and cannot be computed from U and N alone.

### Step 5 — Wind Direction to Ridgeline

Wind geometry significantly affects wave organization. The tool applies a cosine correction to the effective cross-ridge wind component (U⊥), which flows through all three wave physics outputs — not just as a point bonus to the risk score.

| Angle | Effect | Score Modifier |
|---|---|---|
| Perpendicular (~90°) | Most organized, powerful standing wave — full U⊥ | +12 pts |
| Oblique (~45°) | Moderate wave organization — U⊥ × 0.707 | +5 pts |
| Parallel | Minimal wave generation — U⊥ × 0.10 | +0 pts |

Perpendicular flow across the Wasatch from the W/NW is the classic high-risk setup for the Nephi corridor. Even a moderate shift toward oblique reduces effective wave forcing by roughly 30%.

### Step 6 — Atmospheric Stability Check (Wizard)

A guided **6-question** wizard assesses atmospheric stability and real-world risk signals from publicly available weather data (ForeFlight Winds Aloft, Skew-T soundings). No meteorology background required.

The six questions divide into two distinct categories by design:

**Three meteorological questions** determine the atmospheric stability classification (N proxy). Their answers govern the Froude Number and vertical wavelength outputs:
1. Temperature inversion presence on the Skew-T — the primary wave setup indicator per AC 00-57
2. Wind direction consistency across altitude layers — organized vs. disorganized airflow
3. Wind shear ratio between ridge level and 6,000 ft above the ridge — distinguishes vertically propagating waves (shear ratio ≤ 1.6) from trapped lee waves (ratio ≥ 2.0), per AC 00-57 §5.1

**Three real-world confirmation questions** score independently as external risk signals and do not influence the N classification. This keeps the Froude Number calculation physically meaningful and prevents double-counting:
4. PIREPs within 100 nm of the route (ground truth from pilots who just flew it)
5. **Visual cloud signatures** — lenticular (ACSL), rotor, or cap/Foehn wall clouds per AC 00-57 Part II. A visible rotor cloud is treated as a real-time confirmation equivalent to a severe PIREP.
6. Active advisories — G-AIRMET Tango or non-convective SIGMET (WS)

The three meteorological inputs produce a stability classification:
- **Strong stable layer** (N = 0.020 rad/s) — strong temperature inversion, organized multi-level flow, increasing shear
- **Moderate stability** (N = 0.012 rad/s) — partial inversion or partial flow organization
- **Weak/no stable layer** (N = 0.006 rad/s) — no inversion, disorganized flow

Before the wizard is completed, the tool holds stability at neutral (N = 0.006, "Weak/no stable layer") rather than assuming moderate. This means the pre-wizard score is conservative by omission — it does not artificially inflate the risk score while the pilot is mid-briefing.

### Step 7 — Density Altitude and Performance Margin

This is the variable most preflight checklists omit entirely.

**Density altitude** is computed from Outside Air Temperature (OAT) at your **planned cruise altitude** and that altitude itself — not at the departure airport. This is the operationally meaningful value: it reflects what your engine and wings are actually working with when a wave encounter occurs at altitude. OAT at cruise altitude comes from ForeFlight Winds Aloft at the appropriate altitude layer.

```
DA ≈ Pressure Altitude + 120 × (OAT − ISA temp at that altitude)
ISA temp = 15°C − (1.98°C per 1,000 ft)
```

**Adjusted climb rate** scales the aircraft's sea-level climb rate linearly from full power at sea level to zero at service ceiling:

```
Adjusted Climb Rate = Book Climb Rate × max(0, 1 − DA / Service Ceiling)
```

**Estimated wave sink** uses piecewise linear interpolation between four anchor points — no step-function cliffs between breakpoints, so a 2-knot wind change produces a proportional score change rather than a sudden jump:

| Wave Ratio | Est. Wave Sink | Condition |
|---|---|---|
| 0 | ~200 fpm | Negligible wave |
| 2.5 | ~1,000 fpm | Moderate organized wave |
| 4.0 | ~3,000 fpm | Significant wave — exceeds most light aircraft climb rate |
| 6.0+ | ~5,000+ fpm | Windstorm / hydraulic jump conditions |

Values between anchors are linearly interpolated. These are order-of-magnitude estimates calibrated to accident parameter reconstruction and regulatory guidance, not experimentally derived from a single study.

**Climb margin** = Adjusted Climb Rate − Estimated Wave Sink

A negative climb margin means the aircraft physically cannot outclimb the estimated wave downdraft using engine power alone. The correct response is lateral exit, not a climb attempt — but this number directly informs the go/no-go decision.

**Ridge clearance** = Cruise Altitude − Ridge Elevation

A negative ridge clearance means your cruise altitude places you below the ridge crest — inside the rotor zone. The rotor zone warning panel activates automatically when this condition is combined with a lee-side position and a wave ratio above 2.5. See the Rotor Zone panel description below.

**Time to terrain** = Terrain Clearance ÷ Estimated Wave Sink Rate

Displayed in seconds. This is how long you have from the onset of maximum estimated wave sink until terrain impact, given your current terrain clearance. At night, when the rotor is invisible, this number is your margin.

> ⚠️ **Even a positive climb margin does not mean "pull back."** In a wave encounter, maintain Va, accept the descent, and exit laterally. Full power provides control authority and limits altitude loss — it is not an altitude recovery tool in a major wave downdraft.

### Step 8 — Rotor Zone Hard Warning

When all three of the following are true — cruise altitude is below the ridge crest, position is lee-side or crossing, and wave ratio exceeds 2.5 — the tool activates a dedicated Rotor Zone warning panel. This is the geometric condition associated with BOAC 911 and JAL/Evergreen 46E.

The panel displays three values in real time: feet below the ridge crest, seconds to terrain at estimated wave sink rate, and climb altitude required to escape the rotor (ridge crest + 1,000 ft margin). The pilot action guidance adapts based on climb margin:

If climb margin is negative — the aircraft cannot power-climb out of the rotor — the panel instructs the pilot to set Va, turn 45–90° toward the valley floor immediately, and not pull back. If climb margin is positive, the panel still instructs a lateral exit: even when the aircraft could theoretically climb through the rotor, doing so prolongs exposure to the most violent zone.

### Step 9 — Go/No-Go Advisory Ladder

| Product / Condition | Action |
|---|---|
| G-AIRMET Tango active on leg route | Caution — apply full wave check before flying this leg |
| Non-convective SIGMET (WS) active | **Hard no-go. Overrides all other inputs. Not a judgment call.** |
| Moderate+ PIREP on your route | Treat as a personal warning — go/no-go review required |
| Skew-T shows stable layer at ridge level | High N — expect organized, amplified wave |
| Rotor cloud visible toward ridge | AC 00-57 Part II — wave is active and organized right now |

**SIGMET Hard Override:** An active non-convective SIGMET (WS) for severe turbulence on or near the leg route locks the Leg Evaluator to NO-GO regardless of any other inputs. No score calculation can override this. The UI displays a "SIGMET OVERRIDE" indicator so the pilot knows the exact reason.

### Step 10 — Pilot Experience (ADM Margin)

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
| SportCruiser | 700 fpm | 88 kts | +15 pts |
| DA20-C1 | 800 fpm | 99 kts | +10 pts |
| DA40 | 1,070 fpm | 108 kts | +5 pts |
| Heavier GA | 1,200 fpm | 128 kts | +0 pts |

A SportCruiser flown by an instrument-rated pilot is still a SportCruiser. Select the aircraft, not the certificate.

---

## Weight-Adjusted Maneuvering Speed (Va)

This concept is not computed by the Leg Evaluator but is essential knowledge for any pilot operating near mountain terrain.

Va is not a fixed number — it **decreases as the aircraft gets lighter:**

```
Va (adjusted) = Va (max gross) × √( Current Weight ÷ Max Gross Weight )
```

**Why this matters in a rotor:** A lighter aircraft reaches its structural load limit at a lower airspeed. If you are flying solo with partial fuel in a SportCruiser or DA20, your actual Va may be 10–15 knots below the placarded value. Exceeding adjusted Va in severe turbulence can cause structural failure.

**The scenario:** Solo student, half tanks, SportCruiser. Published Va = 88 kts at 1,320 lbs MTOW. Aircraft weight ~950 lbs.

```
Va (adjusted) = 88 × √(950 ÷ 1320) = 88 × 0.848 = ~75 kts
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
| AC 00-57 | Hazardous mountain winds and visual indicators — wave formation, ridge wind thresholds (§3.3: 20 kt trigger), trapped vs. vertically propagating wave distinction (§5.1), visual cloud signatures (Part II) |
| AIM 7-1-5 | AIRMETs — Sierra, Tango, Zulu |
| AIM 7-1-6 | SIGMETs — non-convective (WS) turbulence criterion |
| FAR 91.103 | Preflight action requirements |
| AC 00-45 | Skew-T, PIREPs, GFA interpretation |
| Durran (2003) | Vertical wavelength formula: λz = 2πU/N |
| Durran & Klemp (1983) | Moist N_m caveat — dry-air estimates conservative in saturated conditions |
| Menchaca & Durran (2016) | Cold-frontal wave burst limitation — tool may underestimate risk in rapidly evolving post-frontal conditions |

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
| G-AIRMET Tango | Moderate turbulence (including wave) | ✅ Check first for mountain flying |
| SIGMET (WS) | Severe/extreme turbulence, severe icing, volcanic ash | ✅ Active SIGMET = hard no-go |

There is no US advisory product specifically named "Mountain Wave SIGMET." Mountain wave producing severe or extreme turbulence is captured under the standard non-convective SIGMET (WS) turbulence severity criterion.

---

## Pre-Solo Mountain Wave Endorsement

CFIs may use this tool as part of the pre-solo mountain terrain endorsement oral. The student should be able to:

- Explain mountain wave formation, rotor, the three Froude Number regimes, and lenticular/cap cloud identification without reference material
- Locate G-AIRMET Tango, non-convective SIGMET WS, and PIREPs on aviationweather.gov and correctly identify go/no-go triggers
- Correctly answer both standard endorsement scenarios for a specific leg:
  - **Scenario A (leg: KPVU to U14):** G-AIRMET Tango + wave ratio 3.9 + stable layer on Skew-T + 30 kt NW ridge winds + night VFR + cruise altitude below Mt. Nebo's ridge crest = **NO-GO for this leg**
  - **Scenario B (in-flight):** GPS 8,500 ft / altimeter 10,200 ft / VSI –1,800 fpm = Set Va, level nose, full power for control authority, 45–90° turn toward valley, declare with ATC

**Suggested endorsement language:**
> *"[Student] has received and demonstrated understanding of mountain wave hazards, visual and instrument cues, weather product interpretation, and correct in-flight response procedures per FAA-H-8083-28 Ch. 16. Authorized for solo flight in the [area] provided no G-AIRMET Tango or SIGMET WS is active for the route. [Date, CFI signature, certificate number]."*

---

## Local Knowledge — The Nephi Corridor

Flights into U14 (Nephi Municipal Airport, 5,022 ft MSL) from the north transit the lee side of Mt. Nebo (11,928 ft) — the highest Wasatch peak — with nearly 6,900 ft of terrain relief.

**Local Rule:** If ridge-top winds (≈11,000–12,000 ft) exceed **20 kts** from the W/NW, the approach into U14 is no longer routine. This threshold is drawn directly from AC 00-57 §3.3, which identifies 20 kt cross-ridge flow as the onset condition for significant mountain wave activity. Apply the full wave check. At night, you will not see the rotor — you will only feel the instantaneous transition from smooth laminar flow to violent multi-directional turbulence.

The venturi geometry of the Wasatch-to-west-range gap accelerates already-fast air further on its way through. The hydraulic jump that results can sit directly over the airport environment. Know the numbers before you depart.

---

## Further Resources

| Resource | Link |
|---|---|
| FAA Aviation Weather Handbook (FAA-H-8083-28A) | [faa.gov](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28a-aviation-weather-handbook) |
| Aviation Weather Center (GFA, PIREPs, SIGMETs) | [aviationweather.gov](https://aviationweather.gov) |
| Skew-T Soundings — Windy.com | [windy.com](https://www.windy.com) — select Sounding layer; enter KSLC or nearest rawinsonde station |
| Skew-T Archive — University of Wyoming | [weather.uwyo.edu](https://weather.uwyo.edu/upperair/sounding.html) — historical soundings for research and training |
| NTSB Aviation Accident Database | [ntsb.gov](https://www.ntsb.gov) |
| Utah Soaring Association (Wasatch wave expertise) | [utahsoaring.org](https://www.utahsoaring.org) |
| ForeFlight — GFA overlay + Winds Aloft layers | Use winds aloft layer set to ridge MSL altitude; check 12,000 ft for Wasatch flights |
| SkyVector — Flight planning with weather overlay | Cross-reference winds aloft and active SIGMETs during route planning |

> **Note on Skew-T access:** The FAA retired its operational Skew-T sounding tools in 2024. The Stability Wizard in this tool was designed specifically to make stability assessment accessible without requiring a Skew-T — but for pilots who want the full picture, Windy.com's Sounding layer and the University of Wyoming archive are the current recommended alternatives.

---

## Known Limitations

The following limitations are acknowledged and either disclosed within the tool or are inherent to its scope.

The tool is a preflight decision aid, not a real-time weather product. It uses pilot-entered parameters, not live data feeds. The accuracy of the output depends entirely on the accuracy of the data the pilot enters.

Wave sink estimates are order-of-magnitude approximations. Actual conditions can and do exceed the tool's estimates, particularly in the Sierra Nevada and during strong post-frontal events.

The position multipliers (windward 0.35, crossing/lee-close 1.00, lee-moderate 0.60, lee-far 0.30) are physically reasoned estimates, not empirically validated constants. The 20 nm and 60 nm distance thresholds are representative, not precise.

The Froude Number uses a three-tier N proxy rather than a value computed from a specific sounding. This is a deliberate trade-off between accuracy and accessibility.

The tool assumes a quasi-steady-state wave regime. Per Menchaca and Durran (2016), rapidly deepening baroclinic systems can produce sudden, transient mountain wave bursts that are not well-captured by steady-state Froude analysis. Pilots operating within 12–24 hours of a significant frontal passage should apply additional conservatism beyond the tool's output.

The N proxy values are dry-air estimates. Per Durran and Klemp (1983), the moist Brunt-Väisälä frequency (N_m) is lower than dry N in saturated or cloudy conditions, meaning the tool may slightly overstate wave organization in cloudy air. It errs conservative.

The tool is framed for Wasatch Front operations. The underlying physics apply universally, but the scenario library, slider hints, and reference table thresholds assume a pilot in the Salt Lake valley corridor. Pilots in other mountain regions should treat the tool as a framework and calibrate locally.

---

## Disclaimer

This tool is an educational aid and preflight decision support resource. It does not replace an official FAA weather briefing, flight service station consultation, or the judgment of a certificated flight instructor. All go/no-go decisions remain the responsibility of the pilot in command under FAR 91.103.

The wave ratio heuristic used in this tool is an informal decision aid — not a certified meteorological formula. The Froude Number is computed using a dimensionally consistent implementation of Fr = U⊥ / (N × H), with U⊥ representing the effective cross-ridge wind component and Brunt-Väisälä frequency values calibrated to observed stability regimes. Always cross-reference with official G-AIRMET, SIGMET, and PIREP data from aviationweather.gov.

---

*Built to enable and protect pilots. Fly the wing. Trust the math. Respect the waves.*

*Companion briefing: "The Invisible Rollercoaster — Mastering Mountain Wave Turbulence"*
