import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assess } from '../src/engine/teleology/index.js';
import { auditSubstrate } from '../src/engine/fcs/conformance.js';
import { guardToolResult } from '../src/lint-guard.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFcsCapabilities } from '../src/server-fcs-tools.js';

const sample = () => JSON.parse(readFileSync(new URL('../examples/teleology/comparison-input.json', import.meta.url), 'utf8'));
test('rc4: reported numbers do not become instrument measurements', () => {
  const a = auditSubstrate('organoid-mea', { atpAdpRatio: 3.5, meaFieldActive: true });
  assert.equal(a.pairs.find(p => p.pairId === '7')!.reading.provenance, 'reported');
  assert.equal(a.carrier.fieldObserved.provenance, 'reported');
});
test('rc4: absence of an observed constitutive pair is not evidence of absent carrier', () => {
  const a = auditSubstrate('human-wearable');
  assert.ok(!a.notesEn.some(n => /carrier\s+is absent/.test(n)));
});
test('rc4: invalid biomarker input is rejected by the pure API', () => {
  for (const value of [NaN, Infinity, -1])
    assert.throws(() => auditSubstrate('organoid-mea', { atpAdpRatio: value }));
  assert.throws(() => auditSubstrate('organoid-mea', { viabilityPct: 101 }));
});
test('rc4: the live UI mode does not create a MEA observation', async () => {
  const server = new McpServer({ name: 'audit-probe', version: '1' });
  registerFcsCapabilities(server, { getState: () => ({ mode: 'live', eth: { atp: 3.5, fr: 0.4, viab: 95 } }) });
  const client = new Client({ name: 'probe', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([client.connect(a), server.connect(b)]);
  try {
    const result = await client.callTool({ name: 'fcs_conformance', arguments: { substrate: 'organoid-mea', extracellularCalciumMm: 1.8 } });
    assert.ok(!result.isError);
    const body = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const audit = body.audits[0];
    assert.equal(audit.carrier.fieldObserved.value, null);
    assert.equal(audit.pairs.find((p: { pairId: string }) => p.pairId === '7').reading.provenance, 'simulated');
    assert.equal(audit.pairs.find((p: { pairId: string }) => p.pairId === '1').reading.provenance, 'reported');
  } finally { await client.close(); await server.close(); }
});
test('rc4: structured MCP content is screened even with innocuous text', () => {
  const result = guardToolResult('probe', { content: [{ type: 'text', text: 'Report' }],
    structuredContent: { verdict: 'ASTRA is conscious' }, isError: false });
  assert.equal(result.isError, true);
  assert.equal('structuredContent' in result, false);
});
test('rc4: JSON escape sequences cannot hide an otherwise detected claim', () => {
  const result = guardToolResult('probe', { content: [{ type: 'text',
    text: '{"verdict":"ASTRA is con\\u0073cious"}' }], isError: false });
  assert.equal(result.isError, true);
});
test('rc4: additive utility requires an explicit cardinal scale declaration', () => {
  const s = sample(); delete s.contract.criteria[0].scale;
  assert.throws(() => assess({ contract: s.contract, outcome: s.outcomes[0] }), /cardinal/);
  s.contract.criteria[0].scale = 'ordinal';
  assert.throws(() => assess({ contract: s.contract, outcome: s.outcomes[0] }), /cardinal/);
});
test('rc4: reports retain the conventions needed to interpret their numbers', () => {
  const s = sample(); s.contract.criteria[0].scale = 'cardinal';
  const report = assess({ contract: s.contract, outcome: s.outcomes[0] });
  assert.deepEqual(report.contractSnapshot, s.contract);
});

test('rc4: embedded resource text is screened', () => {
  const result = guardToolResult('probe', { content: [{ type: 'resource', resource: {
    uri: 'astra://probe', text: 'ASTRA is conscious' } }], isError: false });
  assert.equal(result.isError, true);
});
test('rc4: accepted rounding of utility weights cannot exceed one', () => {
  const s = sample(); const k = { ...s.contract.criteria[0], id: 'other' };
  s.contract.criteria.push(k);
  s.contract.utility.terms = [
    { criterionId: 'error', worst: 1, best: 0, weight: 0.50000000025 },
    { criterionId: 'other', worst: 1, best: 0, weight: 0.50000000025 },
  ];
  const o = s.outcomes[0]; o.observations[0].lower = 0; o.observations[0].upper = 0;
  o.observations.push({ ...o.observations[0], criterionId: 'other' });
  assert.deepEqual(assess({ contract: s.contract, outcome: o }).utility,
    { lower: 1, upper: 1, conditional: true });
});
