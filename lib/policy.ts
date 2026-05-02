/**
 * Policy DSL parsing, validation, and template loading.
 *
 * The DSL is JSON. Users can write it directly, or have Claude write it
 * via the MCP server, or pick from a template.
 */

import { BunkerPolicy } from "./types";
import aaveRsethCascade from "../data/templates/aave-rseth-cascade.json";
import driftGovernance from "../data/templates/drift-governance.json";
import skyUsdsLoop from "../data/templates/sky-usds-loop.json";

export const TEMPLATES = {
  "aave-rseth-cascade": aaveRsethCascade,
  "drift-governance": driftGovernance,
  "sky-usds-loop": skyUsdsLoop,
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

export function loadTemplate(key: TemplateKey) {
  const tpl = TEMPLATES[key];
  if (!tpl) throw new Error(`Unknown template: ${key}`);
  return BunkerPolicy.parse(tpl);
}

export function validatePolicy(input: unknown) {
  return BunkerPolicy.parse(input);
}

export function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, tpl]) => ({
    key,
    name: (tpl as { name: string }).name,
    asset: (tpl as { asset: string }).asset,
    protocol: (tpl as { protocol: string }).protocol,
  }));
}
