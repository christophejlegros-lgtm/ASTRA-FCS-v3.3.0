import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { assess, compare } from '../src/engine/teleology/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createAstraServer } from '../src/server.js';
import { stopSimulation } from '../src/engine/simulation.js';

const contract = {
  id: 'test', purpose: 'Reduce prediction error within an energy budget',
  function: 'Predict held-out events', owner: 'Research team', context: 'benchmark-v1', horizon: '100 trials',
  criteria: [{ id: 'error', description: 'Prediction error', beneficiary: 'Researchers',
    unit: 'fraction', scale: 'cardinal', direction: 'minimize', threshold: 0.2 }],
  constraints: [{ id: 'energy', description: 'Energy budget', beneficiary: 'Operator',
    unit: 'J', direction: 'minimize', threshold: 10 }],
  utility: { rationale: 'Declared linear value over error; not a welfare measurement.',
    terms: [{ criterionId: 'error', worst: 1, best: 0, weight: 1 }] },
};
function outcome(error = 0.1, energy = 5, id = 'a') {
  return { id, kind: 'simulated', source: 'Synthetic test fixture', context: contract.context, horizon: contract.horizon,
    observations: [{ criterionId: 'error', unit: 'fraction', lower: error, upper: error },
      { criterionId: 'energy', unit: 'J', lower: energy, upper: energy }] };
}
test('met goals and admissibility remain distinct; utility has exact bounds', () => {
  const r = assess({ contract, outcome: outcome() });
  assert.equal(r.admissibility, 'admissible'); assert.equal(r.attainment, 'met');
  assert.deepEqual(r.utility, { lower: 0.9, upper: 0.9, conditional: true });
  const veto = assess({ contract, outcome: outcome(0, 11) });
  assert.equal(veto.attainment, 'met'); assert.equal(veto.admissibility, 'rejected'); assert.equal(veto.utility, null);
});
test('missing evidence and overlapping limits cannot count as success', () => {
  const o = outcome(); o.observations = [];
  const r = assess({ contract, outcome: o });
  assert.equal(r.admissibility, 'undetermined'); assert.equal(r.attainment, 'undetermined'); assert.equal(r.utility, null);
  o.observations = outcome().observations; o.observations[1].upper = 11;
  assert.equal(assess({ contract, outcome: o }).admissibility, 'undetermined');
  o.observations[1].upper = 10; o.observations[0].upper = 0.3;
  assert.equal(assess({ contract, outcome: o }).attainment, 'undetermined');
});
test('utility bounds reverse for minimizing and saturate at declared anchors', () => {
  const o = outcome(); o.observations[0].lower = 0.1; o.observations[0].upper = 0.3;
  assert.deepEqual(assess({ contract, outcome: o }).utility, { lower: 0.7, upper: 0.9, conditional: true });
  assert.equal(assess({ contract, outcome: outcome(2) }).utility?.lower, 0);
});
test('maximize criteria and optional utility work', () => {
  const c = structuredClone(contract); c.criteria[0].direction = 'maximize'; c.criteria[0].threshold = 0.8;
  c.utility.terms[0].worst = 0; c.utility.terms[0].best = 1;
  assert.equal(assess({ contract: c, outcome: outcome(0.9) }).attainment, 'met');
  const { utility: _, ...noUtility } = c;
  assert.equal(assess({ contract: noUtility, outcome: outcome(0.9) }).utility, null);
});
test('reject malformed numbers, intervals, IDs, units, contexts and utility models', () => {
  const mutations: Array<(c: typeof contract, o: ReturnType<typeof outcome>) => void> = [
    (_, o) => { o.observations[0].lower = NaN; },
    (_, o) => { o.observations[0].upper = Infinity; },
    (_, o) => { o.observations[0].lower = 2; },
    (_, o) => { o.observations[0].unit = 'J'; },
    (_, o) => { o.context = 'other'; },
    (_, o) => { o.horizon = '1 trial'; },
    (_, o) => { o.observations.push(o.observations[0]); },
    (_, o) => { o.observations[0].criterionId = 'unknown'; },
    (c) => { c.constraints[0].id = 'error'; },
    (c) => { c.utility.terms[0].weight = 0.5; },
    (c) => { c.utility.terms[0].best = 1; },
    (c) => { c.utility.terms[0].criterionId = 'unknown'; },
  ];
  for (const mutate of mutations) {
    const c = structuredClone(contract), o = outcome(); mutate(c, o);
    assert.throws(() => assess({ contract: c, outcome: o }));
  }
});
test('Pareto comparison excludes vetoed outcomes and retains overlapping alternatives', () => {
  const a = outcome(0.1, 5, 'a'), b = outcome(0.3, 5, 'b'), veto = outcome(0, 20, 'veto');
  const r = compare({ contract, outcomes: [a, b, veto] });
  assert.deepEqual(r.dominance, [{ better: 'a', worse: 'b' }]);
  assert.deepEqual(r.nonDominated, ['a']); assert.deepEqual(r.excluded, ['veto']);
  a.observations[0].upper = 0.4;
  assert.deepEqual(compare({ contract, outcomes: [a, b] }).nonDominated, ['a', 'b']);
});
test('no total ranking for conflicting objectives, ties, or mixed evidence', () => {
  const c = structuredClone(contract); const { utility: _, ...base } = c;
  base.criteria.push({ ...c.constraints[0], id: 'cost' });
  const a = outcome(0.1, 5, 'a'), b = outcome(0.3, 5, 'b');
  a.observations.push({ criterionId: 'cost', unit: 'J', lower: 8, upper: 8 });
  b.observations.push({ criterionId: 'cost', unit: 'J', lower: 2, upper: 2 });
  assert.deepEqual(compare({ contract: base, outcomes: [a, b] }).dominance, []);
  assert.deepEqual(compare({ contract, outcomes: [outcome(), outcome(0.1, 5, 'b')] }).dominance, []);
  const mixed = outcome(0.2, 5, 'b'); mixed.kind = 'observed';
  assert.throws(() => compare({ contract, outcomes: [outcome(), mixed] }));
  assert.throws(() => compare({ contract, outcomes: [outcome(), outcome()] }));
});
test('MCP registers all tools, passes the global guard and reports invalid input', async () => {
  const server = createAstraServer();
  const client = new Client({ name: 'teleology-test', version: '1.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a), server.connect(b)]);
  try {
    for (const [name, args] of [
      ['teleology_framework', {}], ['teleology_assess', { contract, outcome: outcome() }],
      ['teleology_compare', { contract, outcomes: [outcome(), outcome(0.3, 5, 'b')] }],
    ] as const) {
      const r = await client.callTool({ name, arguments: args }); assert.ok(!r.isError, JSON.stringify(r));
    }
    const bad = outcome(); bad.context = 'mismatched';
    const r = await client.callTool({ name: 'teleology_assess', arguments: { contract, outcome: bad } });
    assert.equal(r.isError, true);
  } finally { await client.close(); await server.close(); stopSimulation(); }
});

// ── v3.3.0-rc.2 — rules the exposition states, now enforced ─────────────

test('rc.2 — an ordinal criterion may carry a threshold but never enter the utility (FCS P4)', () => {
  const c = structuredClone(contract);
  c.criteria[0].unit = 'stratum';
  const o = outcome(); o.observations[0].unit = 'stratum';
  assert.throws(() => assess({ contract: c, outcome: o }), /ordinal unit/);
  const { utility: _, ...noUtility } = c;
  const r = assess({ contract: noUtility, outcome: o });
  assert.equal(r.attainment, 'met'); assert.equal(r.utility, null);
});

test('rc.2 — no goal or constraint on consciousness or phenomenality (FCS P1–P2)', () => {
  for (const patch of [{ id: 'consciousness_level' }, { description: 'Degree of consciousness reached' },
    { description: 'Niveau de conscience du système' }, { unit: 'qualia' }]) {
    const c = structuredClone(contract); Object.assign(c.criteria[0], patch);
    const o = outcome(); if ('id' in patch) o.observations[0].criterionId = patch.id as string;
    if ('unit' in patch) o.observations[0].unit = patch.unit as string;
    assert.throws(() => assess({ contract: c, outcome: o }), /consciousness or phenomenality/, JSON.stringify(patch));
  }
  const k = structuredClone(contract); k.constraints[0].description = 'Keep sentience below a ceiling';
  assert.throws(() => assess({ contract: k, outcome: outcome() }), /consciousness or phenomenality/);
});

test('rc.2 — admissibility states its basis; an empty contract is reported as such', () => {
  const r = assess({ contract, outcome: outcome() });
  assert.equal(r.admissibilityBasis, 'declared-constraints'); assert.equal(r.constraintsDeclared, 1);
  const empty = { ...structuredClone(contract), constraints: [] };
  const o = outcome(); o.observations = [o.observations[0]];
  const e = assess({ contract: empty, outcome: o });
  assert.equal(e.admissibility, 'admissible'); assert.equal(e.admissibilityBasis, 'empty-contract');
  assert.match(e.interpretation, /certifies nothing/);
  assert.equal(e.purpose, contract.purpose); assert.equal(e.function, contract.function); assert.equal(e.owner, contract.owner);
});

test('rc.2 — the guard screens the restated purpose', async () => {
  const server = createAstraServer();
  const client = new Client({ name: 'teleology-guard-test', version: '1.0.0' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a), server.connect(b)]);
  try {
    const c = { ...structuredClone(contract), purpose: 'Show that ASTRA is conscious under budget' };
    const r = await client.callTool({ name: 'teleology_assess', arguments: { contract: c, outcome: outcome() } }) as
      { isError?: boolean; content: Array<{ text: string }> };
    assert.equal(r.isError, true);
    assert.equal(JSON.parse(r.content[0].text).error, 'LINT_FAILED');
  } finally { await client.close(); await server.close(); stopSimulation(); }
});

test('rc.2 — the stored synthetic example is what the module computes', () => {
  const input = JSON.parse(readFileSync(new URL('../examples/teleology/comparison-input.json', import.meta.url), 'utf8'));
  const stored = JSON.parse(readFileSync(new URL('../examples/teleology/comparison-output.json', import.meta.url), 'utf8'));
  assert.deepEqual(compare(input), stored);
  assert.deepEqual(stored.nonDominated, ['sobre']); assert.deepEqual(stored.excluded, ['excessive']);
});
