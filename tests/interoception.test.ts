/**
 * ASTRA — Interoceptive channel, kept separate (v3.3.0-rc.5)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  InteroceptiveChannel, validateInteroceptiveSpecs, validateInteroceptiveReading, cultureInteroception,
  exampleRobotInteroception, checkChannelSeparation, interoceptiveVector, type InteroceptiveVariableSpec, type InteroceptiveReading,
} from '../src/engine/interoception.js';
import { CrossModalFusion, EXTEROCEPTIVE_MODALITIES, type ModalityEmbedding } from '../src/engine/multimodal-sensors.js';

const specs: InteroceptiveVariableSpec[] = [
  { id: 'tempC', unit: '°C', setpoint: 35, viableMin: 25, viableMax: 45, substrate: 'robot' },
  { id: 'charge', unit: 'fraction', setpoint: 0.8, viableMin: 0.2, viableMax: 1, substrate: 'robot' },
];
const reading = (t: number, tempC: number, charge = 0.8, clockDomain = 'mcu-0'): InteroceptiveReading =>
  ({ t, clockDomain, origin: 'reported', values: { tempC, charge } });

describe('Interoceptive variable declarations', () => {
  it('requires a setpoint strictly inside a viable range, and unique ids', () => {
    assert.deepEqual(validateInteroceptiveSpecs(specs), []);
    assert.ok(validateInteroceptiveSpecs([{ ...specs[0], setpoint: 50 }]).some((p) => /strictly inside/.test(p)));
    assert.ok(validateInteroceptiveSpecs([{ ...specs[0], viableMin: 45, viableMax: 25 }]).some((p) => /viableMin must be < viableMax/.test(p)));
    assert.ok(validateInteroceptiveSpecs([specs[0], specs[0]]).some((p) => /declared twice/.test(p)));
    assert.ok(validateInteroceptiveSpecs([]).length > 0);
  });

  it('supplies no culture defaults: every viable range is the laboratory\'s to declare', () => {
    const c = cultureInteroception({ mediumTempC: [35.5, 38.5], mediumPH: [7.1, 7.6] });
    assert.deepEqual(c.map((s) => [s.id, s.setpoint]), [['mediumTempC', 37], ['mediumPH', 7.4]]);
    assert.throws(() => cultureInteroception({ mediumTempC: [38, 39], mediumPH: [7.1, 7.6] }), RangeError); // 37 outside
  });

  it('the robot preset is declared illustrative and valid', () => {
    assert.deepEqual(validateInteroceptiveSpecs(exampleRobotInteroception()), []);
  });

  it('refuses undeclared variables, non-finite values and a missing clock domain', () => {
    assert.ok(validateInteroceptiveReading({ ...reading(0, 35), values: { tempC: 35, pressure: 1 } }, specs).some((p) => /not a declared/.test(p)));
    assert.ok(validateInteroceptiveReading({ ...reading(0, 35), values: { tempC: NaN } }, specs).some((p) => /finite/.test(p)));
    assert.ok(validateInteroceptiveReading({ ...reading(0, 35), clockDomain: ' ' }, specs).some((p) => /clockDomain/.test(p)));
  });
});

describe('Homeostatic encoding', () => {
  it('signed homeostatic error, viability margin and the outside-viable list', () => {
    const ch = new InteroceptiveChannel(specs);
    const f = ch.encode(reading(0, 40, 0.1));
    const temp = f.variables.find((v) => v.id === 'tempC')!;
    const charge = f.variables.find((v) => v.id === 'charge')!;
    assert.equal(temp.homeostaticError, 0.5);          // (40 − 35) / 10
    assert.equal(temp.viabilityMargin, 0.5);           // min(15, 5) / 10
    assert.ok(charge.viabilityMargin < 0);
    assert.deepEqual(f.outsideViable, ['charge']);
    assert.equal(f.homeostaticDrive, 1);
    assert.equal(f.channel, 'interoceptive');
    assert.deepEqual(interoceptiveVector(f), [0.5, -7 / 4]);
  });

  it('prediction errors start null, then shrink as the homeostatic model learns a relaxation', () => {
    const ch = new InteroceptiveChannel([specs[0]]);
    let x = 44;
    const errs: number[] = [];
    for (let k = 0; k < 60; k++) {
      const f = ch.encode({ t: k * 100, clockDomain: 'mcu-0', origin: 'simulated', values: { tempC: x } });
      if (k === 0) assert.equal(f.rmsPredictionError, null);
      else errs.push(f.rmsPredictionError!);
      x = x + 0.25 * (35 - x);
    }
    assert.ok(errs[errs.length - 1] < 0.01 * errs[0] + 1e-9, `${errs[0]} → ${errs[errs.length - 1]}`);
  });

  it('a frozen channel does not adapt: a gain on the delivered state keeps showing as prediction error', () => {
    const ch = new InteroceptiveChannel([specs[0]]);
    let x = 44;
    const series: number[] = [];
    for (let k = 0; k < 80; k++) { series.push(x); x = x + 0.25 * (35 - x) + (k % 10 === 0 ? 4 : 0); }
    series.slice(0, 40).forEach((v, k) => ch.encode({ t: k, clockDomain: 'd', origin: 'simulated', values: { tempC: v } }));
    ch.setLearning(false);
    const congruent = series.slice(40).map((v, k) => ch.encode({ t: 40 + k, clockDomain: 'd', origin: 'simulated', values: { tempC: v } }).rmsPredictionError!);
    const ch2 = new InteroceptiveChannel([specs[0]]);
    series.slice(0, 40).forEach((v, k) => ch2.encode({ t: k, clockDomain: 'd', origin: 'simulated', values: { tempC: v } }));
    ch2.setLearning(false);
    const gained = series.slice(40).map((v, k) => ch2.encode({ t: 40 + k, clockDomain: 'd', origin: 'simulated', values: { tempC: 35 + 3 * (v - 35) } }).rmsPredictionError!);
    const mean = (a: number[]) => a.slice(1).reduce((s, v) => s + v, 0) / (a.length - 1);
    assert.ok(mean(gained) > 2 * mean(congruent));
  });

  it('a channel is bound to one clock domain', () => {
    const ch = new InteroceptiveChannel(specs);
    ch.encode(reading(0, 35));
    assert.throws(() => ch.encode(reading(1, 35, 0.8, 'other-clock')), RangeError);
  });
});

describe('Separation of the two channels', () => {
  it('lists physical signals claimed by both channels', () => {
    assert.deepEqual(checkChannelSeparation(['encoder-0', 'motor-current'], ['motor-current', 'fuel-gauge']), ['motor-current']);
    assert.deepEqual(checkChannelSeparation(['encoder-0'], ['fuel-gauge']), []);
  });

  it('the exteroceptive attention fusion refuses an interoceptive frame at run time', () => {
    const ch = new InteroceptiveChannel(specs);
    const frame = ch.encode(reading(0, 36));
    const fusion = new CrossModalFusion({ latentDim: 8, fusionHeads: 1, fusionHiddenDim: 8 } as never);
    assert.throws(() => fusion.fuse(new Float64Array(8), [frame as unknown as ModalityEmbedding]), TypeError);
    assert.ok(!EXTEROCEPTIVE_MODALITIES.has('interoceptive'));
  });
});
