# Somatosensory and interoceptive channels, and the withdrawal test of the kinaesthetic thesis

**ASTRA-FCS v3.3.0-rc.5 (pre-release)** · © Geneva 2026 Christophe Jean Legros · Assistance Multi IA
French version: [SOMATOSENSORY-INTEGRATION.fr.md](SOMATOSENSORY-INTEGRATION.fr.md) · Critical review and corrections (FR): [REVUE-SENSORS.md](REVUE-SENSORS.md) · Preregistrations: [FCS-K0, robot pilot](empirical/PREREG-KINAESTHETIC-K0-PILOT.md) · [FCS-K1, human participants](empirical/PREREG-KINAESTHETIC-K1.md)

## 1. What the layer makes testable

The kinaesthetic thesis is a belt thesis. Its withdrawal condition is stated in document II §4.2 and in `withdrawal.ts`: *if the dimensionality effects under rupture of closure (§6.3) appear for manipulations of interoceptive congruence and not for manipulations of sensorimotor congruence, the first closure is interoceptive and level II is redefined.*

Up to rc.4, ASTRA could not test this condition. It had no somatosensory channel, no separate interoceptive channel, no congruence manipulation, and no analysis able to establish the **absence** of an effect. rc.5 supplies all four, with gates that stop an ASTRA simulation from counting as evidence.

## 2. The loop

```
          efference copy (t_e, command)
  ┌────────────────────────────────────────────┐
  │                                            ▼
command ──▶ instrumented body ──▶ somatosensory reading (t, clock domain)
  │           (simulated or reported)      │  SA1 FA1 FA2 SA2 COLD WARM NOCI SPINDLE TENDON
  │                                        ▼
  │                          [sensorimotor manipulation: delay, gain, sign flip, remap, jitter]
  │                                        ▼
  └──▶ forward model ŷ = W·[1, u, y₋₁] ──▶ comparator: e = y − ŷ  (residual = exafference estimate)
                                                            │
                         M3 operational closure ◀───────────┘  (command informativeness vs shifted surrogate)

  internal variables (actuator temperature, charge, …  |  culture medium: T, pH, O₂, glucose)
         ▼
  [interoceptive manipulation: gain around the setpoint, offset, decoupling, delay]
         ▼
  SEPARATE interoceptive channel: homeostatic error, viability margin, prediction error
  (never in the exteroceptive fusion; no physical signal shared with the somatosensory channel)
```

## 3. Modules

| File | Role |
|---|---|
| `src/engine/somatosensory.ts` | Validated reading (rejects NaN, negative forces and missing clock domains), functional analogues of afferent classes, protective-threshold flags, declared rate code. |
| `src/engine/interoception.ts` | Declared variables (setpoint, viable range), homeostatic error, viability margin, learned homeostatic prediction. No culture defaults. Channel-separation check. |
| `src/engine/reafference.ts` | Efference copy, NLMS forward model with a persistence prior, pairing by expected latency L̂, comparator, M3 operational closure with a surrogate. |
| `src/engine/congruence.ts` | The two manipulation families on timestamped streams, a validated condition space, a local random stream. |
| `src/engine/body-loop.ts` | Calibrate, freeze, manipulate: both channels' errors per condition (the manipulation check). |
| `src/engine/body-sim.ts` | A simulated one-joint finger, used only to exercise the pipeline. All its data are `simulated`. |
| `src/engine/body-probes.ts` | FCS-K0 probe movements and per-condition observations. Responses combine the errors of **both** channels, each standardised. |
| `src/engine/dimensionality.ts` | Dissimilarity matrices, classical MDS (Torgerson 1952), participation ratio (Gao & Ganguli 2015), Student's t, OLS slope. |
| `src/engine/fcs/kinaesthetic-withdrawal.ts` | Protocol, SHA-256 hash, ethics, analysis, synthetic controls. Wired to `withdrawal.ts`. |
| `src/server-body-tools.ts` | 7 read-only MCP tools, 1 resource, 1 prompt. |

## 4. Design choices, stated rather than assumed

1. **A class names a role, not a physiological equivalence.** SA2, skin stretch, is reafferent because cutaneous stretch carries kinaesthetic information (Edin & Johansson 1995; Collins et al. 2005). It is therefore manipulated together with the joints. A frame-based optical tactile array cannot supply FA2, and the module says so instead of inventing a vibration channel. The default heat threshold (43 °C) follows the TRPV1 activation range (Vriens et al. 2014). The other thresholds are placeholders, to be replaced by datasheet values.
2. **Thermal sensing is about the contact.** A heated sensor that reads heat flux tells a metal from a wood at the same temperature; a passive sensor cannot.
3. **Latency is calibrated, then frozen.** A command issued at t_e is compared with the return the system holds at t_e + L̂. If each command were paired with "the next sample", a uniform delay would only lengthen the latency, and the comparator would never see it.
4. **Closure is defined against a surrogate.** The loop is closed if the real command predicts the return better than the same commands circularly shifted by half a session; the shift keeps the autocorrelation and destroys the correspondence. The pairing must also succeed in at least 90 % of cases, and the median latency must not exceed 100 ms. These thresholds are declared and can be changed. The criterion gives a boundary, not a magnitude. It bears on distinctions (a) and (b) of level II, never on (c).
5. **The two families are separated in three ways.** A condition belongs to one family only. No physical signal belongs to both channels: motor current used as effort (TENDON) cannot also serve as interoceptive energy draw. And the exteroceptive fusion refuses interoceptive frames at run time.
6. **A pure interoceptive delay is nearly invisible.** A delayed but self-consistent interoceptive series stays predictable from its own past, because autonomous regulation has "no discrete command and no specific reafference" (document II §4.2). The protocol template therefore uses a gain around the setpoint and decoupling, and the manipulation check is mandatory.

## 5. The withdrawal test

**Measure.** For each unit (organoid, session or subject) and each condition, build a dissimilarity matrix over probe items. Take its effective dimensionality, the participation ratio of the MDS spectrum. Then compute, per unit, the slope of this dimensionality on the graded level (0 = congruent, 1 = the family's strongest rupture), and the (1 − 2α) interval of that slope across units.

**Reading a family.** A family is "equivalent" (effect absent) if the slope's interval **and** the interval of every level's contrast with the baseline lie inside ±SESOI. This monotonicity guard stops an inverted-U response, whose slope is near 0, from being read as an absence. Otherwise it is an "increase" if the lower bound exceeds 0, or exceeds the SESOI when the minimum-effect criterion was chosen. In every other case it is a "decrease" or "inconclusive".

**Checks.** Each family must pass two checks:

- *manipulation*: the slope of its own channel's prediction error must be positive;
- *specificity*: that slope must exceed the other channel's.

**Patterns.** Four patterns follow: interoceptive-only, sensorimotor-only, both, neither. Any other configuration is "undetermined", with its reasons. A **decrease** in dimensionality is an anomaly against §6.3 and is examined first at rank 1 of the revision order.

**Effect on `withdrawal.ts`.** Only the interoceptive-only pattern withdraws the thesis. Sensorimotor-only keeps it standing and supports the choice of first closure. Both and neither keep it standing without discriminating. The pattern is passed alongside the boolean `dimensionalityFromInteroception`, and inconsistent values are not used.

**Confirmatory conditions.** All are required; otherwise the analysis stays exploratory:

- the protocol is declared confirmatory (`role: "confirmatory"`; a pilot never sets an outcome);
- the protocol is filed on a time-stamped registry;
- its SHA-256 hash is unchanged;
- no parameter is open (unit, minimum number of units, α, SESOI, effect criterion);
- the condition space is valid;
- the channels are disjoint;
- the ethics decision is not blocking;
- every observation is dated **after** filing and has `reported` origin.

**ASTRA's own simulations are not evidence.** They never set a withdrawal outcome.

## 6. With real hardware

- **Acquisition.** Use a microcontroller, a single clock domain, and hardware timestamps for both the command and the return. The protective reflex stays local; MCP is for supervision and analysis.
- **Delay line.** In live experiments the delay line belongs in the acquisition firmware, whose latency is known. `congruence.ts` is the reference implementation and the offline path.
- **Declared sources.** Declare `sourceSignals` for each channel. Data sent to ASTRA are marked `reported`: ASTRA does not verify them and never promotes them to measurements.
- **Living culture.** The viable ranges (temperature, pH, O₂, glucose) are the laboratory's. An ethics approval reference is required, and the welfare thresholds of the ethics monitor apply. Protective-threshold channels are not delivered to the culture without a stated justification.
- **Biohybrid route.** `afferentRates` provides a declared linear rate code, for SNN injection or MEA stimulation planning. The device's electrode count limits the somatotopic map: read it from the device's documentation; do not assume it.

## 7. MCP tools

| Tool | Function |
|---|---|
| `soma_encode` | Encodes a reading into afferent classes, threshold flags and a rate code. |
| `intero_encode` | Computes homeostatic errors, viability and prediction errors. |
| `kin_closure` | Assesses the M3 operational closure of a simulated or reported session. |
| `kin_manipulation_check` | Calibrates, freezes and manipulates, then returns both channels' errors per condition. |
| `kin_protocol` | Returns the template, or freezes a protocol: hash, open parameters, ethics. |
| `kin_analyse` | Analyses observations under a protocol: families, pattern, withdrawal outcome. |
| `kin_validate` | Runs the synthetic positive and negative controls of the analysis. |

Resource: `astra://kinaesthetic/protocol-template`. Prompt: `kinaesthetic-withdrawal-test`.

## 8. Limits

- Transposing the §6.3 statistic from phenomenal matrices to substrate-response matrices is an open question (C8 in `REVIEW.md`).
- The simulated body is elementary.
- The interoceptive channel is not wired to the second-order homeostatic controller. This is deliberate: wiring it would couple the two families.
- Effective dimensionality is not a degree of anything phenomenal (prohibitions 1 and 2).

References, with verified DOIs: [REVUE-SENSORS.md](REVUE-SENSORS.md) §6.
