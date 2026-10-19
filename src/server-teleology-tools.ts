/**
 * ASTRA — MCP surface of the functional-teleology extension (v3.3.0-rc)
 *   teleology_framework · teleology_assess · teleology_compare — read-only, closed-world.
 * Payloads pass the server-wide claim guard (lint-guard.ts); since rc.2 every report
 * restates the contract's purpose, function and owner, so the guard screens them too.
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { assess, compare, assessmentShape, comparisonShape, TELEOLOGY_FRAMEWORK } from './engine/teleology/index.js';
import { toolAnnotations } from './tool-annotations.js';
const json = (data: unknown, isError = false) => ({ isError,
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });
function safely(run: () => unknown) {
  try { return json(run()); }
  catch (error) { return json({ error: 'INVALID_TELEOLOGY_INPUT',
    message: error instanceof Error ? error.message : 'Invalid input' }, true); }
}
export function registerTeleologyCapabilities(server: McpServer): void {
  server.tool('teleology_framework', 'Declared-purpose assessment rules and limits.', {},
    toolAnnotations('teleology_framework'), async () => json(TELEOLOGY_FRAMEWORK));
  server.tool('teleology_assess', 'Assess reported outcome intervals against goals and hard constraints. Read only.',
    assessmentShape, toolAnnotations('teleology_assess'), async args => safely(() => assess(args)));
  server.tool('teleology_compare', 'Compare alternatives under one contract using robust interval Pareto dominance.',
    comparisonShape, toolAnnotations('teleology_compare'), async args => safely(() => compare(args)));
}
