/**
 * ASTRA — Somatosensory channel (v3.3.0-rc.5)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SomatosensoryEncoder, validateSomatosensoryReading, afferentVector, afferentRates,
  AFFERENT_CLASSES, REAFFERENT_CLASSES, DEFAULT_SOMATOSENSORY_CONFIG, type SomatosensoryReading,
} from '../src/engine/somatosensory.js';

const base = (over: Partial<SomatosensoryReading> = {}): SomatosensoryReading => ({
  t: 0, clockDomain: 'mcu-0', origin: 'reported',
  taxels: { rows: 2, cols: 2, normalN: [0, 1, 2.5, 10] },
  stretch: [0.05, -0.1],
  thermal: { surfaceTempC: 32, neutralTempC: 32, heated: false },
  joints: [{ id: 'mcp', angleRad: 0, torqueNm: 0.5 }],
  ...over,
});

describe('Somatosensory reading validation (rc.4 convention: refuse NaN, Infinity, out-of-domain)', () => {
  it('accepts a well-formed reading', () => {
    assert.deepEqual(validateSomatosensoryReading(base()), []);
  });

  it('refuses non-finite and negative forces, a wrong taxel count and a missing clock domain', () => {
    assert.ok(validateSomatosensoryReading(base({ taxels: { rows: 2, cols: 2, normalN: [0, 1, NaN, 2] } })).length > 0);
    assert.ok(validateSomatosensoryReading(base({ taxels: { rows: 2, cols: 2, normalN: [0, 1, -1, 2] } })).length > 0);
    assert.ok(validateSomatosensoryReading(base({ taxels: { rows: 2, cols: 2, normalN: [0, 1, 2] } })).length > 0);
    assert.ok(validateSomatosensoryReading(base({ clockDomain: '' })).some((p) => /clockDomain/.test(p)));
    assert.ok(validateSomatosensoryReading(base({ t: Infinity })).some((p) => /finite timestamp/.test(p)));
  });

  it('refuses an undeclared heating state, implausible temperatures and duplicated joints', () => {
    const r = base({ thermal: { surfaceTempC: 500, neutralTempC: 32, heated: undefined as unknown as boolean } });
    const p = validateSomatosensoryReading(r);
    assert.ok(p.some((x) => /surfaceTempC/.test(x)) && p.some((x) => /heated/.test(x)));
    assert.ok(validateSomatosensoryReading(base({ joints: [{ id: 'a', angleRad: 0 }, { id: 'a', angleRad: 1 }] })).some((x) => /duplicated/.test(x)));
  });

  it('refuses an origin other than simulated or reported (no upgrade to a measurement)', () => {
    assert.ok(validateSomatosensoryReading(base({ origin: 'measured' as unknown as 'reported' })).some((x) => /origin/.test(x)));
  });

  it('the encoder throws on an invalid reading instead of encoding it', () => {
    assert.throws(() => new SomatosensoryEncoder().encode(base({ stretch: [Infinity] })), RangeError);
  });
});

describe('Afferent-class analogues', () => {
  it('SA1 is the clamped normal force; the vector length is fixed from the first reading', () => {
    const enc = new SomatosensoryEncoder();
    const f0 = enc.encode(base());
    assert.deepEqual(f0.classes.SA1, [0, 0.2, 0.5, 1]); // forceSat 5 N, 10 N clamps
    assert.deepEqual(f0.classes.FA1, [0, 0, 0, 0]);    // no derivative yet
    assert.ok(f0.notes.some((n) => /FA1 set to 0/.test(n)));
    const f1 = enc.encode(base({ t: 10, taxels: { rows: 2, cols: 2, normalN: [0, 1.5, 2.5, 10] } }));
    assert.equal(afferentVector(f0).length, afferentVector(f1).length);
    // |Δ| = 0.5 N over 10 ms = 50 N/s = forceRateSat → 1
    assert.equal(f1.classes.FA1[1], 1);
    assert.equal(f1.classes.FA1[0], 0);
    assert.equal(f1.dtMs, 10);
  });

  it('FA2 needs a band-limited vibration channel, and says so when absent', () => {
    const enc = new SomatosensoryEncoder();
    const f = enc.encode(base());
    assert.deepEqual(f.classes.FA2, []);
    assert.ok(f.notes.some((n) => /FA2 requires a band-limited vibration channel/.test(n)));
    const g = new SomatosensoryEncoder().encode(base({ vibrationRms: 0.4 }));
    assert.deepEqual(g.classes.FA2, [0.4]);
  });

  it('SA2 encodes skin stretch magnitude and is reafferent (cutaneous stretch carries kinaesthetic information)', () => {
    const f = new SomatosensoryEncoder().encode(base());
    assert.deepEqual(f.classes.SA2.map((v) => +v.toFixed(6)), [0.25, 0.5]);
    assert.ok(REAFFERENT_CLASSES.includes('SA2'));
  });

  it('thermal classes combine a static and a dynamic component', () => {
    const enc = new SomatosensoryEncoder();
    enc.encode(base({ thermal: { surfaceTempC: 32, neutralTempC: 32, heated: false } }));
    const warming = enc.encode(base({ t: 1000, thermal: { surfaceTempC: 34, neutralTempC: 32, heated: false } }));
    // static (34−32)/10 = 0.2 → 0.1 ; dynamic 2 °C/s / 2 = 1 → 0.5
    assert.ok(Math.abs(warming.classes.WARM[0] - 0.6) < 1e-9);
    assert.equal(warming.classes.COLD[0], 0);
  });

  it('a heated sensor with a heat-flux reading tells materials apart at the same temperature', () => {
    const at = (flux: number) => new SomatosensoryEncoder().encode(base({ thermal: { surfaceTempC: 30, neutralTempC: 32, heated: true, heatFluxWm2: flux } }));
    const metal = at(1500), wood = at(150);
    assert.ok(metal.classes.COLD[0] > wood.classes.COLD[0] + 0.5);
    const unheated = new SomatosensoryEncoder().encode(base({ thermal: { surfaceTempC: 30, neutralTempC: 32, heated: false, heatFluxWm2: 1500 } }));
    assert.ok(unheated.notes.some((n) => /unheated sensor/.test(n)));
  });

  it('protective thresholds are flags, configurable, and carry no felt-state vocabulary', () => {
    const f = new SomatosensoryEncoder({ nociMechanicalN: 8 }).encode(base({ thermal: { surfaceTempC: 44, neutralTempC: 32, heated: false } }));
    assert.deepEqual(f.protective, { mechanical: true, heat: true, cold: false });
    assert.deepEqual(f.classes.NOCI, [1, 1, 0]);
    assert.ok(!/pain|douleur/i.test(JSON.stringify(f)));
    assert.equal(DEFAULT_SOMATOSENSORY_CONFIG.nociHeatC, 43);
  });

  it('SPINDLE gives position in the declared range and velocity (reported or derived); TENDON gives effort', () => {
    const enc = new SomatosensoryEncoder({ jointRanges: { mcp: [0, 2] } });
    const a = enc.encode(base({ joints: [{ id: 'mcp', angleRad: 0.5, torqueNm: -0.5 }] }));
    assert.equal(a.classes.SPINDLE[0], 0.25);
    assert.equal(a.classes.SPINDLE[1], 0.5); // no velocity yet: still
    assert.equal(a.classes.TENDON[0], 0.5);
    const b = enc.encode(base({ t: 100, joints: [{ id: 'mcp', angleRad: 0.7 }] }));
    assert.ok(b.classes.SPINDLE[1] > 0.5); // derived: +2 rad/s
    assert.equal(b.classes.TENDON.length, 0);
  });

  it('every class is present in the frame, in the declared order', () => {
    const f = new SomatosensoryEncoder().encode(base());
    assert.deepEqual(Object.keys(f.classes), [...AFFERENT_CLASSES]);
    assert.equal(f.channel, 'somatosensory');
  });
});

describe('Rate code', () => {
  it('maps activations linearly to [0, maxHz] with an index of class and unit', () => {
    const f = new SomatosensoryEncoder().encode(base());
    const { rateHz, index } = afferentRates(f, 200, ['SA1']);
    assert.deepEqual(rateHz, [0, 40, 100, 200]);
    assert.deepEqual(index[2], { cls: 'SA1', label: 'taxel 2' });
    assert.throws(() => afferentRates(f, 0), RangeError);
  });
});
