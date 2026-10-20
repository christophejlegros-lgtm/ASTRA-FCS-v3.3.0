/**
 * ASTRA — Somatosensory and interoceptive channels, kinaesthetic withdrawal test: MCP tools (v3.3.0-rc.5)
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════════
 * Seven read-only tools, one resource, one prompt:
 *
 *   soma_encode            reading → afferent-class activations, protective flags, rate code
 *   intero_encode          readings → homeostatic errors, viability, prediction errors
 *   kin_closure            efference + reafference → M3 operational closure (distinctions a–b)
 *   kin_manipulation_check calibrate, freeze, manipulate: both channels' errors per condition
 *   kin_protocol           protocol template, or freeze a protocol: hash, open parameters, ethics
 *   kin_analyse            observations under a frozen protocol → families, pattern, withdrawal outcome
 *   kin_validate           synthetic positive and negative controls of the analysis
 *
 * Every computation is pure: each call builds fresh encoders, models and local
 * random streams, so nothing here changes ASTRA's state or its global random
 * stream. Simulated sessions come from body-sim.ts and stay `simulated`.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toolAnnotations } from './tool-annotations.js';
import { SomatosensoryEncoder, afferentRates, afferentVector, type SomatosensoryReading } from './engine/somatosensory.js';
import { InteroceptiveChannel, exampleRobotInteroception, type InteroceptiveVariableSpec, type InteroceptiveReading } from './engine/interoception.js';
import { assessClosure, type EfferenceCopy } from './engine/reafference.js';
import { simulateFinger } from './engine/body-sim.js';
import { runConditions, type RecordedSession } from './engine/body-loop.js';
import type { ConditionSpec } from './engine/congruence.js';
import {
  protocolTemplate, freezeProtocol, analyseKinaestheticTest, synthesizeObservations,
  type KinaestheticProtocol, type KinaestheticObservation,
} from './engine/fcs/kinaesthetic-withdrawal.js';

// ── Schemas ───────────────────────────────────────────────────────

const MAX_SAMPLES = 20_000;
const origin = z.enum(['simulated', 'reported']);
const num = z.number().finite();

const TaxelSchema = z.object({
  rows: z.number().int().min(1).max(64),
  cols: z.number().int().min(1).max(64),
  normalN: z.array(num).max(4096),
  shearXN: z.array(num).max(4096).optional(),
  shearYN: z.array(num).max(4096).optional(),
});

const SomaReadingSchema = z.object({
  t: num,
  clockDomain: z.string().min(1).max(64),
  origin: origin.default('reported'),
  taxels: TaxelSchema.optional(),
  vibrationRms: num.nullable().optional(),
  stretch: z.array(num).max(256).optional(),
  thermal: z.object({
    surfaceTempC: num, neutralTempC: num, heated: z.boolean(), heatFluxWm2: num.nullable().optional(),
  }).optional(),
  joints: z.array(z.object({
    id: z.string().min(1).max(64), angleRad: num, velocityRadS: num.nullable().optional(), torqueNm: num.nullable().optional(),
  })).max(64).optional(),
  sourceSignals: z.array(z.string().max(64)).max(256).optional(),
});

const InteroSpecSchema = z.object({
  id: z.string().min(1).max(64), unit: z.string().max(32), setpoint: num, viableMin: num, viableMax: num,
  substrate: z.enum(['robot', 'culture', 'other']),
});

const InteroReadingSchema = z.object({
  t: num, clockDomain: z.string().min(1).max(64), origin: origin.default('reported'),
  values: z.record(num), sourceSignals: z.array(z.string().max(64)).max(256).optional(),
});

const EfferenceSchema = z.object({
  t: num, clockDomain: z.string().min(1).max(64), origin: origin.default('reported'),
  command: z.array(num).min(1).max(64), commandId: z.string().max(64).optional(),
});

const SensorimotorManipulationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('delay'), ms: num }),
  z.object({ kind: z.literal('gain'), factor: num }),
  z.object({ kind: z.literal('sign-flip') }),
  z.object({ kind: z.literal('spatial-remap'), permutation: z.array(z.number().int()).max(4096) }),
  z.object({ kind: z.literal('jitter'), sdMs: num, seed: z.number().int() }),
]);

const InteroceptiveManipulationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('delay'), ms: num }),
  z.object({ kind: z.literal('gain'), factor: num }),
  z.object({ kind: z.literal('offset'), deltas: z.record(num) }),
  z.object({ kind: z.literal('decouple'), seed: z.number().int() }),
  z.object({ kind: z.literal('phase-shift'), fractionOfCycle: num }),
]);

const ConditionSchema = z.object({
  id: z.string().min(1).max(64),
  family: z.enum(['baseline', 'sensorimotor', 'interoceptive']),
  level: num,
  sensorimotor: z.array(SensorimotorManipulationSchema).max(8).default([]),
  interoceptive: z.array(InteroceptiveManipulationSchema).max(8).default([]),
});

const ProtocolSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().max(400),
  role: z.enum(['confirmatory', 'pilot']),
  status: z.enum(['draft', 'filed']),
  registry: z.object({ name: z.string().max(100), reference: z.string().max(300), filedAt: z.string().max(40) }).nullable(),
  unit: z.enum(['organoid', 'session', 'subject', 'simulation-seed']).nullable(),
  minUnits: z.number().int().nullable(),
  alpha: num.nullable(),
  sesoi: num.nullable(),
  effectCriterion: z.enum(['superiority', 'minimum-effect']).nullable(),
  dissimilarity: z.enum(['correlation', 'euclidean', 'judged-similarity']),
  conditions: z.array(ConditionSchema).min(1).max(64),
  deliveryTarget: z.enum(['silicon', 'living-culture', 'human']),
  ethicsReference: z.string().max(300).nullable(),
  sourceSignals: z.object({ somatosensory: z.array(z.string().max(64)).max(256), interoceptive: z.array(z.string().max(64)).max(256) }),
});

const ObservationSchema = z.object({
  unitId: z.string().min(1).max(64),
  conditionId: z.string().min(1).max(64),
  collectedAt: z.string().max(40),
  origin,
  rdm: z.array(z.array(num).max(200)).max(200).optional(),
  patterns: z.array(z.array(num).max(2000)).max(200).optional(),
  manipulationCheck: z.object({ sensorimotorError: num, interoceptiveError: num }).optional(),
});

const SimulateSchema = z.object({
  steps: z.number().int().min(100).max(20_000).default(1500),
  seed: z.number().int().min(0).max(0xffffffff).default(1),
  objectContactCoefficient: num.optional().describe('W/m²K: high for metal, low for wood'),
});

// ── Helpers ───────────────────────────────────────────────────────

const round = (v: number, k = 4) => (Number.isFinite(v) ? Math.round(v * 10 ** k) / 10 ** k : v);
const emit = (o: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(o, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }, null, 2) }], isError: true });

function specsFrom(preset: 'example-robot' | undefined, specs: InteroceptiveVariableSpec[] | undefined): InteroceptiveVariableSpec[] {
  if (specs && specs.length) return specs;
  if (preset === 'example-robot') return exampleRobotInteroception();
  throw new RangeError('declare the interoceptive variables (specs) or choose the example-robot preset');
}

function sessionFrom(args: {
  source: 'simulate' | 'reported';
  simulate?: z.infer<typeof SimulateSchema>;
  efference?: EfferenceCopy[];
  somatosensory?: SomatosensoryReading[];
  interoceptive?: InteroceptiveReading[];
  interoceptiveLoad?: number[];
}): RecordedSession & { provenance: string } {
  if (args.source === 'simulate') {
    const sim = SimulateSchema.parse(args.simulate ?? {});
    const s = simulateFinger(sim.steps, { seed: sim.seed, ...(sim.objectContactCoefficient !== undefined ? { objectContactCoefficient: sim.objectContactCoefficient } : {}) });
    return { ...s, provenance: 'simulated (body-sim.ts: one-joint finger, elementary physics, no device)' };
  }
  const n = (args.efference?.length ?? 0) + (args.somatosensory?.length ?? 0) + (args.interoceptive?.length ?? 0);
  if (n > 3 * MAX_SAMPLES) throw new RangeError(`at most ${MAX_SAMPLES} samples per stream`);
  return {
    efference: args.efference ?? [], somatosensory: args.somatosensory ?? [], interoceptive: args.interoceptive ?? [],
    interoceptiveLoad: args.interoceptiveLoad, provenance: 'reported by the caller (not verified by ASTRA)',
  };
}

// ── Registration ──────────────────────────────────────────────────

export function registerBodyCapabilities(server: McpServer): void {
  server.tool(
    'soma_encode',
    'Somatosensory channel: encode a reading (taxels, vibration, skin stretch, contact thermistor, joints) into functional ' +
    'analogues of afferent classes (SA1, FA1, FA2, SA2, COLD, WARM, protective thresholds, SPINDLE, TENDON). Pass the previous ' +
    'reading of the same clock domain to obtain derivatives. Analogues name roles, not physiological equivalence.',
    {
      reading: SomaReadingSchema,
      previous: SomaReadingSchema.optional(),
      maxRateHz: z.number().positive().max(1000).default(100).describe('Linear rate code ceiling for spike injection or stimulation planning'),
    },
    toolAnnotations('soma_encode'),
    async ({ reading, previous, maxRateHz }) => {
      try {
        const enc = new SomatosensoryEncoder();
        if (previous) enc.encode(previous as SomatosensoryReading);
        const frame = enc.encode(reading as SomatosensoryReading);
        const rates = afferentRates(frame, maxRateHz);
        return emit({
          tool: 'soma_encode', origin: frame.origin, clockDomain: frame.clockDomain, t: frame.t, dtMs: frame.dtMs,
          classes: Object.fromEntries(Object.entries(frame.classes).map(([k, v]) => [k, v.map((x) => round(x))])),
          labels: frame.labels, protective: frame.protective,
          reafferentVectorLength: afferentVector(frame).length,
          rateCode: { maxRateHz, rateHz: rates.rateHz.map((x) => round(x, 2)) },
          notes: frame.notes,
          scope: 'Functional analogues of afferent classes; the protective channel is a threshold, named nociceptive, with no claim of any felt state.',
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'intero_encode',
    'Interoceptive channel, kept separate from the exteroceptive fusion: homeostatic errors, viability margins and homeostatic ' +
    'prediction errors over a sequence of readings. Declare the variables (setpoint, viable range) or use the illustrative ' +
    'example-robot preset; no culture defaults are supplied.',
    {
      specs: z.array(InteroSpecSchema).max(32).optional(),
      preset: z.enum(['example-robot']).optional(),
      readings: z.array(InteroReadingSchema).min(1).max(MAX_SAMPLES),
      loads: z.array(num).max(MAX_SAMPLES).optional().describe('Declared load per reading (a command quantity, never a sensed somatosensory signal)'),
    },
    toolAnnotations('intero_encode'),
    async ({ specs, preset, readings, loads }) => {
      try {
        const sp = specsFrom(preset, specs as InteroceptiveVariableSpec[] | undefined);
        if (loads && loads.length !== readings.length) throw new RangeError('loads must match readings');
        const ch = new InteroceptiveChannel(sp);
        const frames = readings.map((r, i) => ch.encode(r as InteroceptiveReading, loads?.[i] ?? 0));
        const last = frames[frames.length - 1];
        const pe = frames.map((f) => f.rmsPredictionError).filter((v): v is number => v !== null);
        return emit({
          tool: 'intero_encode', readings: frames.length, specs: sp, presetIsIllustrative: !specs?.length,
          last: { ...last, variables: last.variables.map((v) => ({ ...v, homeostaticError: round(v.homeostaticError), viabilityMargin: round(v.viabilityMargin),
            predictionError: v.predictionError === null ? null : round(v.predictionError) })) },
          meanRmsPredictionError: pe.length ? round(pe.reduce((a, b) => a + b, 0) / pe.length, 5) : null,
          everOutsideViable: [...new Set(frames.flatMap((f) => f.outsideViable))],
          separation: 'This channel never enters the cross-modal attention fusion; its manipulations stay independent of the sensorimotor ones.',
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'kin_closure',
    'Operational closure of the command–return loop (criterion M3, level II distinctions a–b): pairs efference copies with ' +
    'somatosensory returns on one clock domain, learns a forward model, and compares command informativeness with a surrogate ' +
    'in which the commands are circularly shifted. A boundary, not a magnitude.',
    {
      source: z.enum(['simulate', 'reported']).default('simulate'),
      simulate: SimulateSchema.optional(),
      efference: z.array(EfferenceSchema).max(MAX_SAMPLES).optional(),
      somatosensory: z.array(SomaReadingSchema).max(MAX_SAMPLES).optional(),
      criteria: z.object({
        minPairedFraction: num.optional(), maxMedianLatencyMs: num.optional(), minInformativenessGain: num.optional(),
      }).optional(),
    },
    toolAnnotations('kin_closure'),
    async ({ source, simulate, efference, somatosensory, criteria }) => {
      try {
        const s = sessionFrom({ source, simulate, efference: efference as EfferenceCopy[] | undefined, somatosensory: somatosensory as SomatosensoryReading[] | undefined });
        if (!s.efference.length || !s.somatosensory.length) throw new RangeError('efference and somatosensory streams are required');
        const enc = new SomatosensoryEncoder();
        const reaf = s.somatosensory.map((r) => ({ t: r.t, clockDomain: r.clockDomain, features: afferentVector(enc.encode(r)) }));
        const a = assessClosure(s.efference, reaf, criteria ?? {});
        return emit({
          tool: 'kin_closure', provenance: s.provenance, commands: s.efference.length, returns: reaf.length,
          ...a, commandInformativeness: a.commandInformativeness === null ? null : round(a.commandInformativeness),
          surrogateInformativeness: a.surrogateInformativeness === null ? null : round(a.surrogateInformativeness),
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'kin_manipulation_check',
    'Calibrate on a congruent block, freeze both models, then apply each condition\'s manipulations to the test block: returns, ' +
    'per condition, the somatosensory comparator error and the interoceptive prediction error. A family must raise its own ' +
    'channel\'s error, and more than the other\'s, before any null dimensionality effect can be read.',
    {
      source: z.enum(['simulate', 'reported']).default('simulate'),
      simulate: SimulateSchema.optional(),
      efference: z.array(EfferenceSchema).max(MAX_SAMPLES).optional(),
      somatosensory: z.array(SomaReadingSchema).max(MAX_SAMPLES).optional(),
      interoceptive: z.array(InteroReadingSchema).max(MAX_SAMPLES).optional(),
      interoceptiveLoad: z.array(num).max(MAX_SAMPLES).optional(),
      specs: z.array(InteroSpecSchema).max(32).optional(),
      preset: z.enum(['example-robot']).optional(),
      conditions: z.array(ConditionSchema).min(1).max(64).optional().describe('Default: the template condition space of kin_protocol'),
      calibrationFraction: z.number().min(0.2).max(0.8).default(0.5),
    },
    toolAnnotations('kin_manipulation_check'),
    async (args) => {
      try {
        const s = sessionFrom({
          source: args.source, simulate: args.simulate, efference: args.efference as EfferenceCopy[] | undefined,
          somatosensory: args.somatosensory as SomatosensoryReading[] | undefined,
          interoceptive: args.interoceptive as InteroceptiveReading[] | undefined, interoceptiveLoad: args.interoceptiveLoad,
        });
        const sp = specsFrom(args.source === 'simulate' ? (args.preset ?? 'example-robot') : args.preset, args.specs as InteroceptiveVariableSpec[] | undefined);
        const conditions = (args.conditions as ConditionSpec[] | undefined) ?? protocolTemplate().conditions;
        const runs = runConditions(s, conditions, sp, { calibrationFraction: args.calibrationFraction });
        return emit({
          tool: 'kin_manipulation_check', provenance: s.provenance,
          runs: runs.map((r) => ({ ...r, sensorimotorError: round(r.sensorimotorError, 5), interoceptiveError: round(r.interoceptiveError, 5) })),
          readingNote: 'Within a session these are descriptive. Across units, kin_analyse turns them into the manipulation check ' +
            '(own-channel error slope > 0) and the specificity check (own > other).',
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'kin_protocol',
    'Protocol of the kinaesthetic withdrawal test. Without arguments: the template, every author decision left open. With a ' +
    'protocol: its SHA-256 (canonical JSON), open parameters, condition-space problems, channel overlap and ethics decision — ' +
    'to be fixed and filed on a time-stamped registry BEFORE any data.',
    { protocol: ProtocolSchema.optional() },
    toolAnnotations('kin_protocol'),
    async ({ protocol }) => {
      try {
        const p = (protocol as KinaestheticProtocol | undefined) ?? protocolTemplate();
        const f = freezeProtocol(p);
        return emit({
          tool: 'kin_protocol', isTemplate: !protocol, ...f,
          readyToFile: f.openParameters.length === 0 && f.conditionProblems.length === 0 && f.channelOverlap.length === 0 && f.ethics.decision !== 'BLOCK',
          documents: { pilot: 'empirical/PREREG-KINAESTHETIC-K0-PILOT.md', confirmatory: 'empirical/PREREG-KINAESTHETIC-K1.md',
            protocols: 'empirical/protocols/' },
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'kin_analyse',
    'Analyse observations (one dissimilarity matrix or pattern set per unit and condition) under a protocol: effective ' +
    'dimensionality per condition, slope on the graded level per unit, (1 − 2α) intervals across units, superiority and ' +
    'equivalence per family, manipulation and specificity checks, and the resulting pattern. Sets the withdrawal outcome only ' +
    'for a filed protocol, unchanged, with reported observations collected after filing.',
    {
      protocol: ProtocolSchema,
      sha256: z.string().length(64).optional().describe('Hash obtained from kin_protocol before the data; default: recomputed'),
      observations: z.array(ObservationSchema).min(1).max(5000),
    },
    toolAnnotations('kin_analyse'),
    async ({ protocol, sha256, observations }) => {
      try {
        const frozen = freezeProtocol(protocol as KinaestheticProtocol);
        if (sha256) frozen.sha256 = sha256;
        const a = analyseKinaestheticTest(frozen, observations as KinaestheticObservation[]);
        return emit({ tool: 'kin_analyse', ...a });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.tool(
    'kin_validate',
    'Synthetic controls of the analysis: observations with a KNOWN planted pattern (interoceptive-only, sensorimotor-only, both, ' +
    'neither), optionally with a failed manipulation check, analysed under the given or template protocol. Validates the ' +
    'pipeline; says nothing about any substrate.',
    {
      plant: z.enum(['interoceptive-only', 'sensorimotor-only', 'both', 'neither']).default('interoceptive-only'),
      units: z.number().int().min(2).max(64).default(8),
      items: z.number().int().min(4).max(64).default(12),
      features: z.number().int().min(3).max(256).default(20),
      effect: z.number().min(0).max(1).default(0.9),
      noise: z.number().min(0).max(5).default(0.3),
      seed: z.number().int().min(0).max(0xffffffff).default(1),
      failCheck: z.enum(['sensorimotor', 'interoceptive']).nullable().default(null),
      sesoi: z.number().positive().default(0.15).describe('Bound used for this validation only'),
      alpha: z.number().gt(0).lt(0.5).default(0.05),
      effectCriterion: z.enum(['superiority', 'minimum-effect']).default('superiority'),
    },
    toolAnnotations('kin_validate'),
    async (o) => {
      try {
        const p: KinaestheticProtocol = { ...protocolTemplate(), unit: 'simulation-seed', minUnits: Math.min(o.units, 6), alpha: o.alpha, sesoi: o.sesoi,
          effectCriterion: o.effectCriterion };
        const obs = synthesizeObservations(p, { plant: o.plant, units: o.units, items: o.items, features: o.features, effect: o.effect,
          noise: o.noise, seed: o.seed, collectedAt: new Date(0).toISOString(), failCheck: o.failCheck });
        const a = analyseKinaestheticTest(freezeProtocol(p), obs);
        const expected = o.failCheck ? 'undetermined' : (o.effect === 0 ? 'neither' : o.plant);
        return emit({
          tool: 'kin_validate', planted: o.plant, failCheck: o.failCheck, expectedPattern: expected,
          recoveredPattern: a.pattern, recovered: a.pattern === expected,
          families: {
            sensorimotor: { classification: a.families.sensorimotor.classification, effect: a.families.sensorimotor.effect, check: a.families.sensorimotor.manipulationCheck.status },
            interoceptive: { classification: a.families.interoceptive.classification, effect: a.families.interoceptive.effect, check: a.families.interoceptive.manipulationCheck.status },
          },
          undeterminedReasons: a.undeterminedReasons,
          withdrawalOutcome: a.withdrawalOutcome,
          note: 'Synthetic, simulated observations: the run validates the analysis and, by design, never sets a withdrawal outcome.',
        });
      } catch (e) { return fail((e as Error).message); }
    },
  );

  server.resource(
    'kinaesthetic-protocol-template',
    'astra://kinaesthetic/protocol-template',
    { description: 'Template protocol of the kinaesthetic withdrawal test (author decisions open)', mimeType: 'application/json' },
    async () => ({
      contents: [{
        uri: 'astra://kinaesthetic/protocol-template',
        mimeType: 'application/json',
        text: JSON.stringify({ protocol: protocolTemplate(), frozen: freezeProtocol(protocolTemplate()) }, null, 2),
      }],
    }),
  );

  server.prompt(
    'kinaesthetic-withdrawal-test',
    'Prepare, check and analyse the withdrawal test of the kinaesthetic thesis',
    {},
    async () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'Prepare the withdrawal test of the kinaesthetic thesis (FCS level II, document II §4.2 and §6.3):',
            '',
            '1. `kin_protocol` (no argument): read the template; list the author decisions still open (unit, minUnits, α, SESOI, levels, ethics).',
            '2. `kin_closure` on a congruent session: is the command–return loop operationally closed (criterion M3)?',
            '3. `kin_manipulation_check`: does each family raise its own channel\'s error, and more than the other\'s?',
            '4. `kin_validate` for the four planted patterns and for a failed check: does the analysis recover what was planted?',
            '5. Only after the protocol is fixed, frozen (`kin_protocol` with the protocol: keep the SHA-256) and filed on a registry,',
            '   collect reported data and run `kin_analyse`; pass its withdrawalOutcome to `fcs_withdrawal`.',
            '',
            'Report which steps are complete and which decisions remain the author\'s. Do not present simulated runs as evidence.',
          ].join('\n'),
        },
      }],
    }),
  );
}
