/**
 * ASTRA — Server-wide claim guard (v3.1.1)
 * ════════════════════════════════════════
 * Up to v3.1.0 only the `fcs_*`, `orch_*` and `ovo_*` families (20 of 70 tools)
 * passed their payloads through the linters. The other fifty — `get_acm_score`
 * among them — emitted unscreened text, so the server as a whole could make the
 * very moves the FCS negative heuristic forbids.
 *
 * `installLintGuard(server)` wraps `server.tool` and `server.resource` BEFORE
 * any registration, so that every text payload (including embedded resources) and structured result of every tool, and resource text
 * passes BOTH linters:
 *   · `lintClaim` — Block's access/phenomenal distinction (phenomenal-guard.ts)
 *   · `lintFcs`   — the five prohibitions of the FCS series (negative-heuristic.ts)
 *
 * A payload that fails is not emitted: the client receives a LINT_FAILED error
 * naming the tool and the findings, exactly as the FCS layer already did.
 *
 * Scope and limits, stated rather than implied: the linters are pattern
 * heuristics. They catch the formulations they encode, not every paraphrase;
 * they are a gate on ASTRA's own output, not a proof that no payload can carry
 * a forbidden claim. `fcs_lint` is exempt because echoing the screened string
 * back to the caller is its function. v3.3.0-rc.3: `lintClaim` widened from five
 * English patterns to 21 English and French rules, with a negation window for the
 * rules that carry no subject (phenomenal-guard.ts §5).
 *
 * © 2026 Christophe Jean Legros — Geneva · Assistance Multi IA
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { lintClaim } from './engine/tcai/phenomenal-guard.js';
import { lintFcs, type FcsLintFinding } from './engine/fcs/negative-heuristic.js';

/** Tools whose function is to echo screened text back to the caller. */
export const LINT_EXEMPT_TOOLS: ReadonlySet<string> = new Set(['fcs_lint']);

export interface LintVerdict {
  admissible: boolean;
  claimPatterns: string[];
  fcsFindings: FcsLintFinding[];
}

/** Screen one string against both linters. */
export function screen(text: string): LintVerdict {
  const claimPatterns = lintClaim(text);
  const fcsFindings = lintFcs(text);
  return { admissible: claimPatterns.length === 0 && fcsFindings.length === 0, claimPatterns, fcsFindings };
}

interface TextItem { type: 'text'; text: string }
interface ToolResultLike { content?: unknown[]; structuredContent?: unknown; isError?: boolean }
interface ResourceResultLike { contents?: Array<{ uri?: string; text?: unknown }> }

function isTextItem(x: unknown): x is TextItem {
  return typeof x === 'object' && x !== null
    && (x as { type?: unknown }).type === 'text'
    && typeof (x as { text?: unknown }).text === 'string';
}

function lintFailure(origin: string, v: LintVerdict): string {
  return JSON.stringify({
    error: 'LINT_FAILED',
    origin,
    claimPatterns: v.claimPatterns,
    fcsProhibitions: v.fcsFindings,
    note: 'Pattern-based screening flagged the payload. This heuristic finding is not a semantic proof; the original payload was withheld.',
  }, null, 2);
}

/** Scan decoded JSON strings as well as raw prose, without crossing field boundaries. */
function screenPayload(payload: unknown): LintVerdict {
  const pending: unknown[] = [payload];
  const seen = new Set<object>();
  while (pending.length) {
    const value = pending.pop();
    if (typeof value === 'string') {
      const verdict = screen(value);
      if (!verdict.admissible) return verdict;
    } else if (value && typeof value === 'object' && !seen.has(value)) {
      seen.add(value);
      for (const [key, item] of Object.entries(value)) pending.push(key, item);
    }
  }
  return screen('');
}
function screenText(text: string): LintVerdict {
  const raw = screen(text);
  if (!raw.admissible) return raw;
  try { return screenPayload(JSON.parse(text)); } catch { return raw; }
}

/** Screen text and MCP structured content; on failure discard the whole payload. */
export function guardToolResult<T>(toolName: string, result: T): T {
  if (LINT_EXEMPT_TOOLS.has(toolName)) return result;
  const r = result as unknown as ToolResultLike;
  if (!r) return result;
  const verdicts = [screenPayload(r.structuredContent)];
  if (Array.isArray(r.content)) {
    for (const item of r.content) {
      if (isTextItem(item)) verdicts.push(screenText(item.text));
      else if (item && typeof item === 'object') {
        const block = item as { type?: string; resource?: { text?: unknown }; description?: unknown };
        if (block.type === 'resource' && typeof block.resource?.text === 'string')
          verdicts.push(screenText(block.resource.text));
        if (block.type === 'resource_link') verdicts.push(screenPayload(block));
      }
    }
  }
  const failed = verdicts.find(v => !v.admissible);
  if (failed) return { content: [{ type: 'text', text: lintFailure(`tool:${toolName}`, failed) }],
    isError: true } as unknown as T;
  return result;
}

/** Screen a resource result; a failing item is replaced by the failure report. */
export function guardResourceResult<T>(resourceName: string, result: T): T {
  const r = result as unknown as ResourceResultLike;
  if (!r || !Array.isArray(r.contents)) return result;
  const contents = r.contents.map((c) => {
    if (typeof c.text !== 'string') return c;
    const v = screenText(c.text);
    return v.admissible ? c : { ...c, text: lintFailure(`resource:${resourceName}`, v) };
  });
  return { ...r, contents } as unknown as T;
}

type AnyFn = (...args: unknown[]) => unknown;

/** Registrations counted by the guard (v3.2.0): the capability summary is computed, not typed by hand. */
const COUNTS = new WeakMap<McpServer, { tools: number; resources: number; prompts: number }>();

/** Tools, resources and prompts registered on a guarded server so far. */
export function capabilityCounts(server: McpServer): { tools: number; resources: number; prompts: number } {
  return { ...(COUNTS.get(server) ?? { tools: 0, resources: 0, prompts: 0 }) };
}

/**
 * Install the guard on a server instance. Must be called before the first
 * `server.tool` / `server.resource` registration.
 */
export function installLintGuard(server: McpServer): void {
  const target = server as unknown as { tool: AnyFn; resource: AnyFn; prompt: AnyFn };
  const originalTool = target.tool.bind(server) as AnyFn;
  const originalResource = target.resource.bind(server) as AnyFn;
  const originalPrompt = target.prompt.bind(server) as AnyFn;
  const counts = { tools: 0, resources: 0, prompts: 0 };
  COUNTS.set(server, counts);

  target.prompt = (...args: unknown[]) => {
    counts.prompts++;
    return originalPrompt(...args);
  };

  target.tool = (...args: unknown[]) => {
    counts.tools++;
    const name = String(args[0]);
    const cb = args[args.length - 1];
    if (typeof cb === 'function') {
      args[args.length - 1] = async (...cbArgs: unknown[]) =>
        guardToolResult(name, await (cb as AnyFn)(...cbArgs));
    }
    return originalTool(...args);
  };

  target.resource = (...args: unknown[]) => {
    counts.resources++;
    const name = String(args[0]);
    const cb = args[args.length - 1];
    if (typeof cb === 'function') {
      args[args.length - 1] = async (...cbArgs: unknown[]) =>
        guardResourceResult(name, await (cb as AnyFn)(...cbArgs));
    }
    return originalResource(...args);
  };
}
