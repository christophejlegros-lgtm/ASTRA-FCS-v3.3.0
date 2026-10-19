/**
 * ASTRA — MCP surface for proxy validation (v3.2.0)
 * ═════════════════════════════════════════════════
 *   proxy_validate           — run the validation controls of every computed proxy
 *   astra://proxies/cards    — construct, formula, invariances, domain of use
 *
 * Programme minimal de consolidation, point 3 (analysis of 9 October 2026).
 * The tool is read-only: synthetic signals use a private generator and SNN
 * controls run on an isolated random stream that is restored afterwards.
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { validateProxies, DEFAULT_VALIDATION_OPTIONS, type ControlFamily } from './engine/proxy-validation.js';
import { PROXY_CARDS } from './engine/proxy-cards.js';
import { tcaiSystem } from './engine/tcai/acm-bridge.js';
import { toolAnnotations } from './tool-annotations.js';

const json = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] });

export function registerProxyCapabilities(server: McpServer): void {
  server.tool(
    'proxy_validate',
    'Run the validation controls of ASTRA\'s computed proxies (Φ̃-RIIU, effective information, the ACM components): ' +
    'witness signals, common-source controls, connectivity ablation, invariance checks and measurement statuses. ' +
    'Each control tests one declared property and reports whether it holds; a failing control is a finding about the ' +
    'proxy. The live Φ̃-RIIU and EI values are classified against the witness bands. Read-only: runs on an isolated ' +
    'random stream.',
    {
      families: z.array(z.enum(['riiu', 'ei', 'acm'])).optional().describe('Control families to run. Default: all three.'),
      seed: z.number().int().min(0).max(0xffffffff).optional().describe(`Seed of the private stream (default ${DEFAULT_VALIDATION_OPTIONS.seed}).`),
      reps: z.number().int().min(5).max(200).optional().describe('Repetitions for witness bands (default 40).'),
      snnSteps: z.number().int().min(50).max(2000).optional().describe('SNN steps for the ablation controls (default 300).'),
    },
    toolAnnotations('proxy_validate'),
    async ({ families, seed, reps, snnSteps }) => json(validateProxies({
      families: families as ControlFamily[] | undefined, seed, reps, snnSteps,
      live: { riiu: tcaiSystem.riiu, ignitionTrajectory: tcaiSystem.ignitionHistory() },
    })),
  );

  server.resource('proxy-cards', 'astra://proxies/cards',
    { description: 'Proxy cards: construct, exact formula, invariances, domain of use, inferences not licensed', mimeType: 'application/json' },
    async () => ({ contents: [{ uri: 'astra://proxies/cards', mimeType: 'application/json',
      text: JSON.stringify({
        noteEn: 'A symbol borrowed from a theory (Φ̃, GW̃, PAD̃) transmits none of that theory\'s properties to the proxy. ' +
                'Invariances cite the proxy_validate control that checks them.',
        noteFr: 'Un symbole emprunté à une théorie (Φ̃, GW̃, PAD̃) ne transmet au proxy aucune des propriétés de cette théorie. ' +
                'Les invariances citent le contrôle de proxy_validate qui les éprouve.',
        cards: PROXY_CARDS,
      }, null, 2) }] }));
}
