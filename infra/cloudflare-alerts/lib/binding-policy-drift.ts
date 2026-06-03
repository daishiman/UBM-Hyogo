/**
 * Issue #1056: KV/R2 binding activity vs alert policy enabled-state drift.
 *
 * This guard is local-only: it reads wrangler.toml and repo alert manifests,
 * and never calls the Cloudflare API.
 */
import fs from "node:fs";
import path from "node:path";
import type { CanonicalPolicy } from "./types.ts";

export type BindingKind = "kv" | "r2";

export interface BindingPolicyMapping {
  kind: BindingKind;
  policyNames: string[];
}

export interface ActiveBindings {
  kv: string[];
  r2: string[];
}

export type BindingPolicyDrift =
  | {
      kind: "MONITORING_GAP";
      bindingKind: BindingKind;
      policy: string;
      policyName: string;
      activeBindings: string[];
      policyEnabled: boolean;
      message: string;
    }
  | {
      kind: "STALE_MONITORING";
      bindingKind: BindingKind;
      policy: string;
      policyName: string;
      activeBindings: string[];
      policyEnabled: boolean;
      message: string;
    };

export const BINDING_POLICY_MAP: BindingPolicyMapping[] = [
  {
    kind: "kv",
    policyNames: ["workers-kv-writes-per-day", "workers-kv-stored-bytes"],
  },
  {
    kind: "r2",
    policyNames: ["r2-class-a"],
  },
];

const SECTION_PATTERN =
  /^\s*\[\[(?:env\.[^.]+\.)?(kv_namespaces|r2_buckets)\]\]\s*(?:#.*)?$/;
const BINDING_PATTERN = /^\s*binding\s*=\s*"([^"]+)"\s*(?:#.*)?$/;

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function emptyBindings(): ActiveBindings {
  return { kv: [], r2: [] };
}

export function parseActiveBindings(wranglerToml: string): ActiveBindings {
  const bindings = emptyBindings();
  let currentKind: BindingKind | null = null;

  for (const line of wranglerToml.split(/\r?\n/)) {
    if (line.trimStart().startsWith("#")) continue;

    const section = SECTION_PATTERN.exec(line);
    if (section) {
      currentKind = section[1] === "kv_namespaces" ? "kv" : "r2";
      continue;
    }

    if (line.trimStart().startsWith("[[")) {
      currentKind = null;
      continue;
    }

    if (!currentKind) continue;
    const binding = BINDING_PATTERN.exec(line);
    if (binding) bindings[currentKind].push(binding[1]);
  }

  return {
    kv: uniqueSorted(bindings.kv),
    r2: uniqueSorted(bindings.r2),
  };
}

export function loadActiveBindings(repoRoot: string): ActiveBindings {
  const wranglerPath = path.join(repoRoot, "apps/api/wrangler.toml");
  return parseActiveBindings(fs.readFileSync(wranglerPath, "utf-8"));
}

export function buildBindingPolicyDrift(
  activeBindings: ActiveBindings,
  policies: CanonicalPolicy[],
  mapping: BindingPolicyMapping[] = BINDING_POLICY_MAP,
): BindingPolicyDrift[] {
  const policyByName = new Map(policies.map((p) => [p.name, p]));
  const drifts: BindingPolicyDrift[] = [];

  for (const item of mapping) {
    const bindings = activeBindings[item.kind];
    const isActive = bindings.length > 0;
    for (const policyName of item.policyNames) {
      const policyEnabled = policyByName.get(policyName)?.enabled ?? false;
      if (isActive && !policyEnabled) {
        drifts.push({
          kind: "MONITORING_GAP",
          bindingKind: item.kind,
          policy: policyName,
          policyName,
          activeBindings: bindings,
          policyEnabled,
          message: `${item.kind} binding active (${bindings.join(",")}) but alert policy '${policyName}' is enabled:false or missing`,
        });
      } else if (!isActive && policyEnabled) {
        drifts.push({
          kind: "STALE_MONITORING",
          bindingKind: item.kind,
          policy: policyName,
          policyName,
          activeBindings: bindings,
          policyEnabled,
          message: `alert policy '${policyName}' is enabled but ${item.kind} binding is inactive`,
        });
      }
    }
  }

  return drifts;
}
