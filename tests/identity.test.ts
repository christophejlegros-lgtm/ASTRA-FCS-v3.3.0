/**
 * ASTRA — Identity of the cited object (v3.2.0, consolidation point 1)
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 *
 * Every place that names the current version or the capability counts agrees
 * with src/version.ts, and the counts computed at registration agree with the
 * declared ones. v3.3.0-rc.3: the name is tested too, and the name test is shown
 * to fail on a phenomenal or ill-formed expansion.
 */
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createAstraServer } from '../src/server.js';
import { capabilityCounts } from '../src/lint-guard.js';
import { stopSimulation } from '../src/engine/simulation.js';
import { ASTRA_VERSION, EXPECTED_CAPABILITIES, ASTRA_IDENTITY } from '../src/version.js';
// @ts-expect-error — plain ESM script without type declarations
import { checkIdentity, checkName } from '../scripts/check-identity.mjs';

type NameReport = { problems: string[]; notices: string[] };
const withName = (patch: Record<string, unknown>) => JSON.parse(JSON.stringify({ ...ASTRA_IDENTITY, ...patch }));

describe('Identity of the cited object', () => {
  after(() => stopSimulation());

  it('documentation, metadata and CI agree with src/version.ts', () => {
    const r = checkIdentity() as { version: string; problems: string[] };
    assert.equal(r.version, ASTRA_VERSION);
    assert.deepEqual(r.problems, []);
  });

  it('the name passes its own test, files included', () => {
    const r = checkName() as NameReport;
    assert.deepEqual(r.problems, []);
  });

  it('the name test fails on the withdrawn "Awareness" expansion', () => {
    const r = checkName(withName({ name: { ...ASTRA_IDENTITY.name,
      en: ASTRA_IDENTITY.withdrawn[1].expansion } }), { files: false }) as NameReport;
    assert.ok(r.problems.some((p) => /phenomenal vocabulary/.test(p)), r.problems.join('\n'));
    assert.ok(r.problems.some((p) => /is the current name/.test(p)));
  });

  it('the name test fails when the declared units do not spell the acronym', () => {
    const r = checkName(withName({ initials: { ...ASTRA_IDENTITY.initials,
      fr: ['Agent', 'Orchestré', 'Simulation', 'Test', 'Recherche', 'Access'] } }), { files: false }) as NameReport;
    assert.ok(r.problems.some((p) => /fr units spell AOSTRA/.test(p)), r.problems.join('\n'));
  });

  it('the name test fails when a definition asserts what ASTRA cannot assert', () => {
    const r = checkName(withName({ definition: { ...ASTRA_IDENTITY.definition,
      fr: 'ASTRA-FCS est un agent sentient qui mesure la conscience.' } }), { files: false }) as NameReport;
    assert.ok(r.problems.some((p) => /definition\.fr fails lintClaim/.test(p)), r.problems.join('\n'));
  });

  it('the counts computed at registration equal EXPECTED_CAPABILITIES', () => {
    const server = createAstraServer();
    assert.deepEqual(capabilityCounts(server), { ...EXPECTED_CAPABILITIES });
  });
});
