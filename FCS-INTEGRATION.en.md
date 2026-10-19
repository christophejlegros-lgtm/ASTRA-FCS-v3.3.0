# FCS layer — substrate-constrained functionalism

**ASTRA v3.2.0 · `fcs_*` tools (9) · `astra://fcs/*` resources (4) · prompts (2)**

Implements, inside ASTRA, the values of the series:

| Document | Title | Version |
|---|---|---|
| I | Substrate-constrained functionalism | v1.5 |
| II | Metaphysical complement | v1.4 |
| IV | The neurochemical implementation | v1.3 · 06·10·2026 (table unchanged since v1.2) |
| S | Illustrated synthesis | S-1.6 · 06·10·2026 |

© Geneva 2026 Christophe Jean Legros · Assistance Multi IA

---

## 1. What the layer is not

It produces **no score**. That is an architectural constraint, not stylistic
restraint: the series' negative heuristic forbids, in fourth place, aggregate
scores over ordinal criteria lacking a common scale (document II §1.4, after
Okasha 2011 — Arrow's theorem applied to theory choice).

The aggregation rule the programme **adopts** is **Pareto dominance**, which
yields a *partial* order. Two incomparable pairs stay incomparable. *(v3.2.0)*
This choice is a **methodological discipline, not a logical necessity**: Arrow's
theorem constrains rules that deliver a complete ordering under precise axioms;
Pareto escapes it by giving up completeness, and other multi-criteria procedures
(lexicographic, outranking, conventional weightings) remain possible when their
conventions and trade-offs are declared. The analogy with Arrow does not by
itself make Pareto the unique admissible rule. `mayAggregate()`
refuses, at runtime, any combination of ordinal criteria, and
`refuseAggregate()` returns a withheld scalar carrying its reason rather than a
number.

This discipline extends `tcai/phenomenal-guard.ts`, which already encodes
Block's access/phenomenal distinction in the type system: there is no
constructor for a phenomenal claim, and there is likewise no constructor for a
conformance score.

---

## 2. The four-level framework and ASTRA's coverage

| Level | Content | Status | Realised by | ASTRA module |
|---|---|---|---|---|
| **I** Substrate | transmembrane ionic currents, endogenous fields, ephaptic coupling | Established (existence) · Modelled (field hypothesis) | organoid MEA | `engine/neuroplatform.ts` |
| **II** Kinaesthetic proto-consciousness | efference–reafference loop, minimal self | Modelled · Contested | silicon SNN, MEA | `tcai/self-model.ts`, `second-order.ts` |
| **III** Hierarchical inference | predictive coding, top-down priors | Modelled | silicon SNN | `world-model.ts`, `tcai/active-inference.ts` |
| **IV** Access consciousness | ignition, global broadcast | Established (signatures) · Contested (sufficiency) | silicon SNN | `tcai/global-workspace.ts` |

**Core** — individuation by a functional profile; substrate constraint in the
*weak* sense (in living systems the profile is realised **as a matter of fact**
by a restricted class of transmembrane ionic dynamics); weak emergence;
polynomial admissibility.

**Belt** — the **field hypothesis**: the endogenous field is a causally
efficacious coupling route and not a measurement epiphenomenon. Since document I
v1.5 the substrate constraint (core) and the field hypothesis (belt) are
distinguished; conflating them is the error that version exists to remove.

> **Reading the framework (v3.2.0).** The order I → IV is an order of presentation
> and analysis: it establishes neither an ontogenetic succession nor a relation of
> necessity between levels (`LEVEL_ORDER_CAUTION`). At level II, "realised" bears
> on (a) the sensorimotor control loop and (b) the operational boundary drawn by
> closure, **not** on (c) subjective experience, which neither establishes; that
> (a)+(b) are the primitive form of consciousness is the kinaesthetic thesis, a
> belt thesis (`LEVELS.II.distinctions`). The core claims now carry scope notes:
> the weak substrate constraint leaves open which predictions separate FCS from a
> realisation-sensitive functionalism; polynomial admissibility selects
> observables, it is not a truth criterion. The six open questions of the
> analysis of 9 October 2026 are published as `OPEN_QUESTIONS`.

### What the layer establishes about ASTRA

The silicon LIF+STDP network **realises no constitutive pair**. The LIF equation
names a membrane potential and a conductance, but nothing crosses a membrane:
the variables are the model's, not the substrate's. Under the substrate
constraint the level-I carrier is absent there, whatever the level-III and
level-IV profile shows — which remains compatible with the multiple
realisability *in principle* that the core asserts.

Level III is the one place where ASTRA **meets** the core's admissibility
condition rather than approximating it: the family of approximations is declared
— joint-embedding encoder, SIGReg regularisation, bounded-horizon CEM planning.

---

## 3. The neurochemical taxonomy

Thirteen molecular classes, **seventeen species–function pairs**, five causal
roles, three ordinal sub-criteria, **eight strata**.

The ordering is of **functions**, not of substances: glutamate is a generator in
class 3 and a metabolite in class 13; calcium is a charge carrier in class 1 and,
as a second messenger, belongs to signalling cascades rather than to the carrier.

### The three sub-criteria

| Sub-criterion | Definition | Encoded |
|---|---|---|
| **d** | causal distance to the carrier, in steps mediated by a distinct entity; mobile charge = 0; a coefficient of the carrier's equations = 1 | `pair.d` |
| **τ** | the longer of two durations — action on the carrier, own physiological variation; decides whether the class can individuate an episode (~100 ms) | `pair.tauLog10` |
| **ablation** | effect on level-IV signatures, in four ordered degrees | `pair.ablation` |

### The ordinalisation of τ — declared in document IV v1.3

Document IV v1.2 published τ as a **range**, and the strata, without the
reduction linking them. The reduction used in `EPISODE_WINDOW_ORDINALISATION`
was reconstructed as the one that reproduces the published strata; **document IV
v1.3 (§2, 06·10·2026) now declares it**:

```
rank 0 — the range reaches 10⁻¹ s or below: the class acts within the episode window
rank 1 — the range starts above 10⁻¹ s, up to 10⁰ s: it straddles the window
rank 2 — the range starts above 10⁰ s: it cannot individuate an episode
```

The reduction **reproduces all eight published strata exactly** (document IV §3),
and `tests/fcs.test.ts` checks it on every run. That agreement is a **consistency
check of the transcription, not a validation of the cuts**: inferring the
correctness of a reduction from its fit to the published order would be the move
prohibition 3 forbids. The choice is load-bearing — of ten plausible reductions
(`ALTERNATIVE_ORDINALISATIONS`: upper bound, midpoint, raw exponent, shifted or
fewer cuts), **only the declared one** reproduces the strata; the others displace
one to fourteen pairs. `ordinalisationSensitivity()` reports this, and
`fcs_stratify` returns it.

```ts
const result = canonicalStratification();
result.reproducesPublished; // true
result.divergences;         // []
result.strata.length;       // 8
```

### The eight strata

| Stratum | Pairs | Reading |
|---|---|---|
| S1 | 1 | the ion as mobile charge |
| S2 | 2a | channels, ionotropic receptors, connexins |
| S3 | 2b · 3 · 4 · 11 | four pairs; 4 and 11 equivalent, the others incomparable |
| S4 | 5 · 6 · 10a · 12a | four pairs; 10a and 12a equivalent, the others incomparable |
| S5 | 9b · 10b | two incomparable pairs |
| S6 | 7 · 8 | two incomparable pairs |
| S7 | 9a | hormones, genomic route |
| S8 | 12b · 13 | equivalent on all three sub-criteria |

Incomparability is a **result**, not a gap: `fcs_compare` reports it explicitly,
with the reason — separating them would require the aggregation prohibition 4
refuses.

### What a stratum index does not say (v3.1.1)

The strata **present** the partial order; they are not the order. Two facts are
computed, not asserted (`stratification.ts` §4, tests in `tests/fcs.test.ts`):

- **Pairs in different strata need not be comparable.** Of the 121 pairs the
  strata separate, **28** are ordered by no dominance — e.g. the extracellular
  medium (S3) and the neuromodulators (S4). Reading the index as a rank would
  restore the total order prohibition 4 removes. `fcs_compare` now says so when
  two incomparable pairs sit in different strata.
- **A stratum is context-dependent.** Removing the ion (class 1) moves the sixteen
  other pairs up one stratum; six removals out of seventeen shift at least one
  other pair: the index labels the peeling, it is not a property of the pair.
  *(v3.2.0 correction.)* A label shift alone does **not** establish a failure of
  independence of irrelevant alternatives in Arrow's exact sense — Arrow's IIA
  concerns the relation between two alternatives under a change of the
  *profile*, not removals from the menu, nor labels. The two questions are now
  computed separately (below).

The object faithful to document IV §2 is the **dominance relation** — 93 ordered
pairs out of 136 — and its Hasse diagram. `fcs_stratify` returns both
(`dominance.hasse`, `incomparableAcrossStrata`, `contextDependence`).

### Independence, stated precisely (v3.2.0)

Declared transposition: the three sub-criteria play the voters, the seventeen
pairs the alternatives, each criterion's ordinal values its ranking.
`independenceChecks()` (returned by `fcs_stratify` and `fcs_report`) tests two
relations against two perturbations:

| Relation | Menu contraction (remove a third pair) | Profile change (one ordinal step of a third pair) |
|---|---|---|
| dominance relation | 0 / 2 040 — by construction | 0 / 10 680 — by construction |
| weak order induced by reading strata as ranks | 17 violations / 2 040 | 159 violations / 10 680 |

Dominance passes both **by construction** — an analytic zero, reported for symmetry,
not a test that could have failed: whether *x* dominates *y* depends on their own
coordinates only. The strata-induced order fails both — a choice-consistency
failure under contraction (cf. Sen 1971, doi:10.2307/2296384) and an Arrow-type
IIA failure under profile change. This is one more reason **not to read strata as
ranks**; it says nothing against the dominance relation, and whether the
transposition fits theory choice remains to be argued.

### Sensitivity to the episode window and inter-rater agreement (v3.2.0)

- `episodeWindowSensitivity()` sweeps the first cut: the eight strata are
  reproduced for **any first cut in [10⁻¹, 10⁰) s**, and for none outside. With
  integer-exponent τ bounds the result cannot change within a decade; the decade
  itself is the load-bearing choice and needs an **independent biological
  justification**.
- `fcs_agreement` (new tool) returns a **blind coding sheet** (labels, roles and
  definitions, no published values) and, from several raters' codings,
  **Krippendorff's α** per sub-criterion (Hayes & Krippendorff 2007,
  doi:10.1080/19312450709336664), each rater's agreement with the source table,
  and whether each coding reproduces the eight strata. Agreement supports the
  reliability of the coding, not the biological validity of the cuts; the
  acceptability threshold is to be declared before coding.

---

## 4. The conformance audit

`fcs_conformance` answers, for each of the three substrates, a question the
substrate constraint makes well-posed: **which pairs does this substrate realise,
and through which channel does ASTRA observe it?**

Four verdicts: `realised` · `simulated` · `absent` · `undetermined`.

### The IRB biomarkers already are observations of classes

This is where the layer stops being a table and becomes an integration:

| ASTRA channel | Pair | Role | Provenance |
|---|---|---|---|
| *external input* — extracellular Ca²⁺, mM | **1** — ions | constitutive | measured (ASTRA has no such channel) |
| `eth.ca` — **intracellular** free Ca²⁺, nM | *no pair* — second messenger, outside class 1 | — | reported, unbound |
| `eth.fr` — median per-unit firing rate, Hz | **3** — transmitter amino acids | generator | derived |
| `eth.atp` — ATP/ADP ratio | **7** — energy metabolites | permissive | measured |
| `eth.viab` — viability, % | **2b** — Na⁺/K⁺-ATPase | permissive | derived (proxy) |

**Calcium, corrected in v3.1.1.** Up to v3.1.0, `eth.ca` was bound to class 1 as
"extracellular Ca²⁺ at the MEA bath". But `ethics.ts` defines it as
*intracellular* free Ca²⁺ (thresholds 100/200 nM) — the second messenger that
document IV §2 and synthesis S-1.6 explicitly place outside class 1 — and bath
Ca²⁺ is of the order of millimoles, not nanomoles. The only channel attached to a
constitutive pair rested on the category error the series forbids. Class 1 now
reads only an extracellular value in mM, supplied by the caller
(`extracellularCalciumMm`); without one it is `withheld()`.

**Firing rate, recalibrated in v3.1.1.** `eth.fr` is the median per-unit
spontaneous rate (statistic S1 of `empirical/confront.py`), referenced to the
eight DANDI 001603 organoids analysed in E1/E2: normal 0.14–0.63 Hz, stress
within a factor 2, distress beyond. The former 15–45 Hz range would have reported
every one of those real organoids in distress. It is a descriptive reference
interval from one dataset, not a validated welfare criterion.

A drifting biomarker thereby becomes the statement "this pair has left its
operating range", not merely an ethics flag. A silent channel does **not return
zero**: the pair goes to `withheld()`. An absent measurement is not a null
measurement.

### The human substrate

Every verdict is `undetermined` **by design**. The subject realises the full
taxonomy; the 1 Hz autonomic channel determines none of it, and recording that
is the audit's result, not its failure.

---

## 5. The withdrawal conditions

`fcs_withdrawal` evaluates the belt against strand outcomes. An unset outcome
stays `undetermined` and **never collapses to a negative**.

**Declared revision order**, common to documents I, II and IV:

```
1 inference procedure and measurement auxiliaries
2 bridge auxiliary
3 grain hypothesis (M2)
4 individuation criterion (M3)
5 kinaesthetic thesis
6 field hypothesis
```

Declaring it in advance is what stops a refutation from being absorbed by
whichever auxiliary is cheapest to sacrifice after the fact.

### The bias asymmetry

The human strand's methodological bias favours the field. The evaluator
reproduces it: `fieldBeyondFiringInHumans: true` leaves M2 **undetermined**,
because the favourable outcome does not discriminate. Only `false` — the outcome
against the bias — withdraws M2.

Likewise, covariation alone does not settle the bridge auxiliary: ionic
composition varies with state (Ding et al., 2016) and a neuromodulatory common
cause may act upstream. It is the local intervention that carries the strand's
value.

### Revision records (v3.2.0)

A declared order is not enough (Lakatos 1978, doi:10.1017/CBO9780511621123):
protecting a core is legitimate only if revisions produce new, corroborated
content. `fcs_withdrawal` now accepts `revisions`: each record states the
**motivating datum**, the **new prediction**, the **defeater** (the test that could
still invalidate it), whether the prediction is novel, and its outcome.
`assessRevision()` classifies it — `incomplete`, `content-decreasing`,
`theoretically-progressive`, `empirically-progressive`, `refuted-prediction` — and
checks the declared order: a belt revision needs a recorded, earlier rank-1 check (inference
procedure and measurement auxiliaries) or a stated justification, and intermediate ranks
neither withdrawn nor examined are named (acceptable only if the anomaly does not implicate
them, as for an H1 failure bearing on the field hypothesis).
The bridge strand now treats an unset local intervention like a null one, and
the M1 evaluation states its underdetermination (a deflationary reading predicts
the same structural observations).

### The core

It does not appear in the evaluation. Its revision would be the abandonment of
the programme, not a move within it — and `evaluateWithdrawal()` refuses to rate
it.

---

## 6. The negative heuristic, enforced

| # | Prohibition | Enforcement |
|---|---|---|
| P1 | quantifying a degree of proto-consciousness or experience | `lintFcs()` |
| P2 | identifying a measure with phenomenality | `lintFcs()` |
| P3 | inferring a mechanism from a fitting success | `lintFcs()` |
| P4 | aggregate scores over ordinal criteria lacking a common scale | `mayAggregate()` · `refuseAggregate()` |
| P5 | inferring a constitutive role from a permissive ablation effect | `mayInferConstitutive()` |

Every payload passes **two** linters — `lintClaim` (Block's distinction) and
`lintFcs` (the five prohibitions). A payload failing either is returned as an
error, not emitted with a caveat in a footer. **Since v3.1.1 this holds for the
whole server**, not only the FCS layer: `src/lint-guard.ts` wraps every tool and
resource (`fcs_lint` alone is exempt, since it echoes the screened string). Up to
v3.1.0, fifty of the seventy tools — `get_acm_score` among them, which then
binned its composite into ABSENT…FULL "consciousness levels" — were unscreened.
That scale is withdrawn.

**What the linters are.** Pattern heuristics: they catch the formulations they
encode (v3.1.1 adds the common paraphrases — "consciousness level 0.7",
"Consciousness: 0.7", "71 % conscious", "Phi equals phenomenal experience"), not
every possible wording. They gate ASTRA's own output; they do not prove that no
payload can carry a forbidden claim.

**Use and mention.** Bibliographic units are exempt at unit level — a DOI, or a
unit that opens on an author list ("Casali, A. G., … (2013).") — so a title stays
with its marker; a year in parentheses at the end of an assertion no longer
exempts it (v3.1.1). Mentions of a prohibition are exempt per **sentence**, and
not when the sentence also asserts a value ("under prohibition 4, the degree of
consciousness is 0.71" makes the move). Fixed in v3.1.1: the P3 rule's final
alternation was ungrouped and fired on any sentence containing "mécanisme".
The rationale is unchanged: segments that *mention* a prohibition or that are
bibliographic are not claims — "No quantifying a
degree of proto-consciousness" states the move in order to forbid it, and Casali
et al. (2013) is titled *A theoretically based index of consciousness* whether or
not the phrase is welcome. A linter that fires on itself ends up switched off,
hence enforcing nothing.

> **Implementation note.** Without the `u` flag, JavaScript's `\b` is ASCII-only:
> in "phénoménalité.", the final "é" and the "." are both non-word characters, so
> there is no boundary between them and a trailing `\b` never fires. The French
> rules end with the `EOW` lookahead instead.

---

## 7. MCP surface

| Tool | Purpose |
|---|---|
| `fcs_report` | consolidated view: framework, core/belt, strata, substrates, prohibitions, revision order |
| `fcs_taxonomy` | the 17 pairs, filterable by role, stratum or identifier |
| `fcs_stratify` | recompute the partial order; the τ cuts are exposed as a parameter |
| `fcs_compare` | why two pairs are ordered — or why they are incomparable |
| `fcs_levels` | the four levels, their status, the ASTRA modules and the gap left open |
| `fcs_conformance` | per-substrate audit, bound to the live IRB biomarkers |
| `fcs_withdrawal` | belt standing under given strand outcomes; revision order |
| `fcs_lint` | screen a string, a proposed aggregation, or a constitutive inference |
| `fcs_agreement` | blind coding sheet; Krippendorff's α across raters; each rater against the source table (v3.2.0) |

**Resources** — `astra://fcs/framework` · `astra://fcs/taxonomy` ·
`astra://fcs/conformance` · `astra://fcs/references`

**Prompts** — `fcs-substrate-audit` · `fcs-belt-review`

---

## 8. Console

`dashboard/ASTRA-FCS-Dashboard.html` — a self-contained bilingual FR/EN page,
working offline on the embedded table and attaching to the HTTP transport
(`http://localhost:9003/mcp`) when one is available.

The console **recomputes the partial order in the browser** from the three
sub-criteria and reports whether it reproduces the eight published strata: it
demonstrates the rule instead of displaying a frozen result. Seven sections —
framework, strata (Hasse diagram, covering relation), class map (τ ranges on a
logarithmic axis, episode window marked), conformance, withdrawal (strand
console), negative heuristic (live linter), sources.

---

## 9. Tests

```bash
npm run test:fcs            # FCS-layer tests (tests/fcs.test.ts)
npm run test:consolidation  # v3.2.0 consolidation checks (tests/fcs-consolidation.test.ts, tests/identity.test.ts)
npm test                    # full suite
```

The load-bearing test is `reproduces the eight published strata exactly`. It
recomputes the order by dominance and compares it to the strata of document IV
§3. That is the only way to know a transcription is right.

---

## 10. Apparatus

Every entry in `engine/fcs/references.ts` carries the source documents' **(v)**
mark: DOI resolved, at drafting or on 19 September 2026, against the DOI
Foundation Handle system or against Crossref metadata. ASTRA minted and
reconstructed no DOI; an entry the source documents do not carry does not appear
in the file.

Principal supports: Chiang et al. (2019) · Traynelis & Dingledine (1989) ·
Dudek et al. (1990) · Ding et al. (2016) · Dehaene & Changeux (2011) ·
Koch et al. (2016) · Casali et al. (2013) · Okasha (2011) · Craver (2007) ·
Baumgartner & Gebharter (2016) · Aru et al. (2012) · de Graaf et al. (2012).
