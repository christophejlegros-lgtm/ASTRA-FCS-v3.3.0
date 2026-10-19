/**
 * ASTRA — Proxy validation (v3.2.0, consolidation point 3)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 *
 * Checks that:
 *  · the legacy Φ̃-RIIU formula is bit-identical to v3.1.1;
 *  · each control of proxy-validation.ts reports the property it declares,
 *    including the controls the ACM proxies are expected to FAIL;
 *  · statuses keep a null result, an absence of measurement, an insufficient
 *    sample and a degenerate input apart;
 *  · the controls leave the global random stream untouched (read-only tool);
 *  · the ACM proxies read the SNN the server steps (wiring defect of ≤ 3.1.1).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  RIIUPhi, riiuL1Share, riiuCorrelationShare, estimateEffectiveInformation, computeEffectiveInformation,
  classifyAgainstWitness,
} from '../src/engine/tcai/metrics.js';
import { validateProxies, witnessSignals, commonSourceSignals } from '../src/engine/proxy-validation.js';
import { PROXY_CARDS } from '../src/engine/proxy-cards.js';
import { ACMModule, integrationProxyOf } from '../src/engine/acm.js';
import { SNNEngine, snnEngine } from '../src/engine/snn.js';
import { reseed, random, withIsolatedStream, DEFAULT_SEED } from '../src/utils/rng.js';
import { screen } from '../src/lint-guard.js';
import { createAstraServer } from '../src/server.js';
import { stopSimulation } from '../src/engine/simulation.js';

/** The v3.1.1 loop, verbatim, to pin the legacy value. */
function legacyRiiu(buffer: number[][]): number {
  const n = buffer.length;
  const d = buffer[0].length;
  const mean = new Array<number>(d).fill(0);
  for (const z of buffer) for (let j = 0; j < d; j++) mean[j] += z[j] / n;
  let diag = 0, off = 0;
  for (let a = 0; a < d; a++) {
    for (let b = a; b < d; b++) {
      let c = 0;
      for (const z of buffer) c += (z[a] - mean[a]) * (z[b] - mean[b]);
      c /= n;
      if (a === b) diag += Math.abs(c);
      else off += 2 * Math.abs(c);
    }
  }
  const total = diag + off;
  return total > 1e-12 ? off / total : 0;
}

describe('Φ̃-RIIU — legacy formula and status-bearing evaluation', () => {
  it('computeValue() is bit-identical to the v3.1.1 loop', () => {
    for (const seed of [1, 2, 3]) {
      const buf = commonSourceSignals(64, 16, seed);
      const phi = new RIIUPhi();
      for (const z of buf) phi.push(z);
      assert.equal(phi.computeValue(), legacyRiiu(buf));
      assert.equal(riiuL1Share(buf), legacyRiiu(buf));
    }
  });

  it('separates not-measured, insufficient-sample, degenerate and value', () => {
    const p = new RIIUPhi();
    assert.equal(p.evaluate().status, 'not-measured');
    p.push([1, 2, 3]);
    assert.equal(p.evaluate().status, 'insufficient-sample');
    assert.equal(p.evaluate().value, null);
    const flat = new RIIUPhi();
    for (let i = 0; i < 10; i++) flat.push([0.5, 0.5, 0.5]);
    assert.equal(flat.evaluate().status, 'degenerate');
    const ok = new RIIUPhi();
    for (const z of witnessSignals(32, 4, 9)) ok.push(z);
    const e = ok.evaluate();
    assert.equal(e.status, 'value');
    assert.equal(e.value, e.legacy);
  });

  it('a value inside the witness band becomes a null result', () => {
    const ok = new RIIUPhi();
    for (const z of witnessSignals(64, 8, 4)) ok.push(z);
    const v = ok.evaluate().value!;
    const o = classifyAgainstWitness(ok.evaluate(), { lo: v - 0.01, hi: v + 0.01 });
    assert.equal(o.status, 'null-result');
  });

  it('the correlation share is scale-invariant; the L1 share is not', () => {
    const buf = commonSourceSignals(64, 8, 5);
    const scaled = buf.map((z) => z.map((x, j) => (j === 2 ? 50 * x : x)));
    assert.ok(Math.abs(riiuCorrelationShare(buf)! - riiuCorrelationShare(scaled)!) < 1e-12);
    assert.ok(Math.abs(riiuL1Share(buf)! - riiuL1Share(scaled)!) > 0.01);
  });
});

describe('Effective information — observational estimate with coverage', () => {
  it('reports coverage and keeps the legacy value', () => {
    const traj = Array.from({ length: 100 }, (_, t) => t % 4);
    const e = estimateEffectiveInformation(traj, 8);
    assert.equal(e.coverage, 0.5);
    assert.equal(e.status, 'value');
    assert.equal(e.legacy, computeEffectiveInformation(traj, 8));
    assert.match(e.noteEn, /unobserved states are omitted/);
  });

  it('withholds the value when an observed state has too few transitions', () => {
    const e = estimateEffectiveInformation([0, 1, 2, 0, 1, 2], 8);
    assert.equal(e.status, 'insufficient-sample');
    assert.equal(e.value, null);
    assert.ok(e.legacy > 0, 'the legacy API returns a number that is not a result');
  });
});

describe('validateProxies — declared properties', () => {
  let report: ReturnType<typeof validateProxies>;
  before(() => { report = validateProxies(); });

  it('runs 17 controls in three families, 9 requirements and 8 declared defects', () => {
    assert.equal(report.controls.length, 17);
    assert.equal(report.summary.requirements, 9);
    assert.equal(report.summary.defects, 8);
    assert.deepEqual([...new Set(report.controls.map((c) => c.family))].sort(), ['acm', 'ei', 'riiu']);
  });

  it('Φ̃-RIIU and EI controls all hold', () => {
    for (const c of report.controls.filter((x) => x.family !== 'acm')) assert.ok(c.holds, `${c.id}: ${JSON.stringify(c.observed)}`);
  });

  it('the deployed Φ̃-RIIU witness level on independent noise is high (d = n = 64)', () => {
    const b = report.witnessBands['riiu.l1'];
    assert.equal(b.d, 64); assert.equal(b.n, 64);
    assert.ok(b.mean > 0.8, `witness mean ${b.mean}`);
  });

  it('the ACM integration and broadcast proxies FAIL their ablation controls, as their cards declare', () => {
    const byId = Object.fromEntries(report.controls.map((c) => [c.id, c]));
    assert.equal(byId.A1.holds, false);
    assert.equal(byId.A3.holds, false);
    assert.equal(byId.A2.holds, true, 'clamp active on most steps');
    assert.equal(byId.A4.holds, true, 'no PAD̃ input is a measurement');
    assert.deepEqual(report.summary.requirementsFailed, ['A1', 'A3']);
    assert.deepEqual(report.summary.defectsNotReproduced, []);
    assert.equal(report.summary.requirementsMet, 7);
    assert.equal(report.summary.defectsConfirmed, 8);
  });

  it('leaves the global random stream exactly where it was', () => {
    reseed(77); const a = [random(), random()];
    reseed(77); validateProxies({ families: ['acm'], snnSteps: 60 }); const b = [random(), random()];
    assert.deepEqual(a, b);
    reseed(DEFAULT_SEED);
  });

  it('every card cites only controls that exist, and the report clears the claim guard', () => {
    const ids = new Set(report.controls.map((c) => c.id));
    for (const card of PROXY_CARDS) {
      for (const inv of card.invariances) if (inv.checkedBy) assert.ok(ids.has(inv.checkedBy), `${card.id} cites ${inv.checkedBy}`);
    }
    assert.ok(screen(JSON.stringify(report)).admissible);
    assert.ok(screen(JSON.stringify(PROXY_CARDS)).admissible);
  });

  it('every card states the invariance checked by each control that targets it', () => {
    for (const c of report.controls.filter((x) => x.kind === 'invariance' || x.kind === 'ablation')) {
      const card = PROXY_CARDS.find((k) => k.id === c.proxyId)!;
      const inv = card.invariances.find((i) => i.checkedBy === c.id);
      assert.ok(inv, `${c.proxyId} card does not cite ${c.id}`);
    }
  });
});

describe('rng.withIsolatedStream', () => {
  after(() => reseed(DEFAULT_SEED));
  it('restores the stream even when fn throws', () => {
    reseed(5); const expected = random();
    reseed(5);
    assert.throws(() => withIsolatedStream(1, () => { random(); throw new Error('x'); }));
    assert.equal(random(), expected);
  });
});

describe('ACM wiring (defects of ≤ 3.1.1)', () => {
  after(() => stopSimulation());

  it('an unstepped engine is reported as not measured', () => {
    const e = new SNNEngine();
    assert.equal(integrationProxyOf(e).status, 'not-measured');
    const acm = new ACMModule(undefined, () => e);
    const r = acm.assess();
    assert.equal(r.components.broadcastProxy.status, 'not-measured');
    assert.ok(['not-measured', 'degenerate'].includes(r.compositeStatus));
  });

  it('GW̃ now reads the stepped engine instead of a state field nothing wrote', () => {
    const e = new SNNEngine();
    for (let i = 0; i < 80; i++) e.step();
    const r = new ACMModule(undefined, () => e).assess();
    assert.ok(r.components.broadcastProxy.value > 0, 'GW̃ was identically 0 up to v3.1.1');
    assert.ok(r.components.broadcastProxy.inputs.length >= 4);
    assert.equal(typeof r.confidenceStatus, 'string');
  });

  it('snn_step advances the network get_acm_score reads', async () => {
    const server = createAstraServer();
    const client = new Client({ name: 'acm-wiring', version: '1.0.0' });
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(s), client.connect(c)]);
    const before = snnEngine.engine.time;
    await client.callTool({ name: 'snn_step', arguments: { steps: 25 } });
    assert.equal(snnEngine.engine.time, before + 25, 'snn_step must advance the shared production SNN');
    const r = (await client.callTool({ name: 'get_acm_score', arguments: {} })) as { content: Array<{ text: string }> };
    const d = JSON.parse(r.content[0].text);
    assert.notEqual(d.components.integrationProxy.status, 'not-measured');
    assert.ok('compositeStatus' in d && 'measurementNoteEn' in d);
  });

  it('proxy_validate is exposed, returns the 17 controls and classifies live values', async () => {
    const server = createAstraServer();
    const client = new Client({ name: 'proxy-validate', version: '1.0.0' });
    const [c, s] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(s), client.connect(c)]);
    const r = (await client.callTool({ name: 'proxy_validate', arguments: { snnSteps: 80, reps: 10 } })) as { content: Array<{ text: string }> };
    const d = JSON.parse(r.content[0].text);
    assert.equal(d.controls.length, 17);
    assert.ok(d.live && 'phiRIIU' in d.live);
    assert.ok('effectiveInformation' in d.live && 'witnessBand' in d.live.effectiveInformation);
    const cards = await client.readResource({ uri: 'astra://proxies/cards' });
    assert.ok(String((cards.contents[0] as { text: string }).text).includes('tcai.phiRIIU'));
  });
});
