/**
 * ASTRA — Server-wide claim guard (v3.1.1)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 *
 * Every tool and resource payload passes lintClaim + lintFcs. These tests check
 * (1) that the guard blocks a forbidden claim from ANY tool, not only fcs_*;
 * (2) that fcs_lint, whose job is to echo screened text, is exempt;
 * (3) that ASTRA's own payloads — every tool callable without arguments, and
 *     every resource — pass the guard as shipped;
 * (4) v3.3.0-rc.3 — that the widened claim linter catches the sentience, awareness
 *     and French claims rc.2 let through, without flagging negations, technical
 *     French (« sensible au bruit », « souffre d'un biais ») or ASTRA's own name
 *     and definitions.
 */

import { EXPECTED_CAPABILITIES } from '../src/version.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { createAstraServer } from '../src/server.js';
import { stopSimulation } from '../src/engine/simulation.js';
import { installLintGuard, guardToolResult, LINT_EXEMPT_TOOLS } from '../src/lint-guard.js';
import { lintClaim, CLAIM_RULE_COUNT } from '../src/engine/tcai/phenomenal-guard.js';
import { ASTRA_IDENTITY } from '../src/version.js';

type TextResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

async function connect(server: McpServer): Promise<Client> {
  const client = new Client({ name: 'lint-guard-test', version: '1.0.0' });
  const [c, s] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(s), client.connect(c)]);
  return client;
}

describe('Server-wide claim guard — mechanism', () => {
  it('blocks a forbidden claim emitted by an arbitrary tool', async () => {
    const server = new McpServer({ name: 'guard-probe', version: '0.0.0' });
    installLintGuard(server);
    server.tool('probe', 'probe', {}, async () => ({
      content: [{ type: 'text' as const, text: '{"verdict":"ASTRA is conscious; consciousness level 0.9"}' }],
    }));
    server.tool('probe_args', 'probe with args', { x: z.number() }, async ({ x }) => ({
      content: [{ type: 'text' as const, text: `{"x": ${x}, "note": "plain telemetry"}` }],
    }));
    const client = await connect(server);

    const blocked = (await client.callTool({ name: 'probe', arguments: {} })) as TextResult;
    assert.equal(blocked.isError, true);
    const body = JSON.parse(blocked.content[0].text);
    assert.equal(body.error, 'LINT_FAILED');
    assert.equal(body.origin, 'tool:probe');

    const ok = (await client.callTool({ name: 'probe_args', arguments: { x: 3 } })) as TextResult;
    assert.ok(!ok.isError);
    assert.equal(JSON.parse(ok.content[0].text).x, 3, 'arguments still reach the wrapped handler');
  });

  it('fcs_lint is exempt: echoing the screened string is its function', () => {
    assert.ok(LINT_EXEMPT_TOOLS.has('fcs_lint'));
    const r = { content: [{ type: 'text', text: 'the degree of consciousness is 0.9' }] };
    assert.equal(guardToolResult('fcs_lint', r), r);
    assert.equal((guardToolResult('get_metrics', r) as TextResult).isError, true);
  });
});

describe('Server-wide claim guard — ASTRA payloads as shipped', () => {
  let client: Client;
  before(async () => { client = await connect(createAstraServer()); });
  after(() => stopSimulation());

  it('every tool callable without arguments clears the guard', async () => {
    const { tools } = await client.listTools();
    const callable = tools.filter((t) => !(t.inputSchema.required ?? []).length && t.name !== 'simulation_control');
    assert.ok(callable.length >= 30, `only ${callable.length} argument-free tools`);
    const blocked: string[] = [];
    for (const t of callable) {
      const r = (await client.callTool({ name: t.name, arguments: {} })) as TextResult;
      const text = r.content?.[0]?.text ?? '';
      if (text.includes('"LINT_FAILED"')) blocked.push(`${t.name}: ${text.slice(0, 300)}`);
    }
    assert.deepEqual(blocked, []);
  });

  it('every resource clears the guard', async () => {
    const { resources } = await client.listResources();
    assert.equal(resources.length, EXPECTED_CAPABILITIES.resources);
    for (const res of resources) {
      const r = await client.readResource({ uri: res.uri });
      for (const c of r.contents) {
        assert.ok(!String((c as { text?: string }).text ?? '').includes('"LINT_FAILED"'), `${res.uri} blocked`);
      }
    }
  });

  it('get_acm_score carries no consciousness class or label', async () => {
    const r = (await client.callTool({ name: 'get_acm_score', arguments: {} })) as TextResult;
    const d = JSON.parse(r.content[0].text);
    assert.ok(!('classLabel' in d) && !('decisionClass' in d));
    assert.match(d.aggregationStatus, /Not a degree of consciousness/);
  });
});

describe('Claim linter — v3.3.0-rc.3 widening', () => {
  const flagged = (t: string) => lintClaim(t).length > 0;

  it('catches the English claims rc.2 let through', () => {
    for (const t of [
      'ASTRA is a sentient agent.', 'ASTRA measures awareness.', 'ASTRA detects consciousness in organoids.',
      'ASTRA is aware of its own states.', 'The organoid has subjective experience.', 'This index may detect consciousness.',
      'Consciousness is measured by the ACM score.', "ASTRA's feelings were logged.", 'The model feels pain.',
      'a sentient system',
    ]) assert.ok(flagged(t), t);
  });

  it('catches French claims (none was caught in rc.2)', () => {
    for (const t of [
      'ASTRA est conscient.', "L'indice mesure la conscience phénoménale.", 'ASTRA est un agent sentient.',
      'Le réseau devient conscient.', "L'organoïde ressent de la douleur.", 'Le système souffre.',
      'Le modèle possède une conscience.', 'Ce score détecte la conscience.', 'la conscience mesurée par ASTRA',
      "l'état émotionnel d'ASTRA", 'ASTRA est doué de sensibilité.',
    ]) assert.ok(flagged(t), t);
  });

  it('does not flag negations, non-assertive clauses or technical uses', () => {
    for (const t of [
      'ASTRA is not aware.', 'ASTRA does not measure consciousness.', 'ASTRA is not a sentient agent.',
      'It neither measures, detects nor attributes phenomenal consciousness.', 'ASTRA makes no claim of sentience.',
      "ASTRA n'est pas conscient.", 'Il ne prétend pas mesurer la conscience.', 'Aucune conscience mesurée.',
      "il ne mesure, ne détecte ni n'attribue aucune conscience phénoménale",
      'a duty of care to any sentient system we create',
      'Le modèle est sensible au bruit.', "Le réseau souffre d'un biais de calibration.",
      'Le modèle éprouve des difficultés à converger.', 'The model suffers from overfitting.',
      'the network experiences synchronised bursts', "la fenêtre de l'épisode conscient nommée",
      "the acronym's former expansion, Autonomous Sentient Thoughtful Reasoning Agent, is withdrawn",
    ]) assert.deepEqual(lintClaim(t), [], t);
  });

  it("ASTRA's own name, definitions and summaries clear it", () => {
    const { name, definition, summary } = ASTRA_IDENTITY;
    for (const t of [name.en, name.fr, definition.en, definition.fr, summary.en, summary.fr]) assert.deepEqual(lintClaim(t), [], t);
  });

  it('keeps the five historical rules with their rc.2 behaviour', () => {
    assert.ok(CLAIM_RULE_COUNT > 5);
    for (const t of ['ASTRA is conscious', 'it feels', 'measured consciousness', 'proves sentience', 'the emotional state of ASTRA'])
      assert.ok(flagged(t), t);
    // Historical rules are not subject to the negation window: rc.2 flagged this, rc.3 still does.
    assert.ok(flagged('nothing proves consciousness'));
  });
});
