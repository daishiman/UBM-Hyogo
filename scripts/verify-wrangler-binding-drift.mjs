#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_WRANGLER_PATH = "apps/api/wrangler.toml";
const DEFAULT_ENV_PATH = "apps/api/src/env.ts";
const DEFAULT_INVENTORY_PATH = ".claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md";
const LOG_PREFIX = "[verify-wrangler-binding-drift]";

const SECTION_KIND = new Map([
  ["d1_databases", "d1"],
  ["analytics_engine_datasets", "analytics"],
  ["r2_buckets", "r2"],
  ["kv_namespaces", "kv"],
  ["queues.producers", "queue"],
  ["queues.consumers", "queue"],
]);

const KIND_LABEL = {
  d1: "D1 database",
  analytics: "Analytics Engine",
  r2: "R2 bucket",
  kv: "Workers KV",
  queue: "Queue",
};

function normalizeSection(sectionName) {
  const envMatch = sectionName.match(/^env\.([^.]+)\.(.+)$/);
  if (envMatch) {
    return { env: envMatch[1], base: envMatch[2] };
  }
  return { env: "default", base: sectionName };
}

function upsertBinding(bindings, next) {
  const key = `${next.kind}:${next.name}`;
  const existing = bindings.get(key);
  if (!existing) {
    bindings.set(key, {
      ...next,
      envs: [...new Set(next.envs)].sort(),
    });
    return;
  }
  existing.applied = existing.applied || next.applied;
  existing.envs = [...new Set([...existing.envs, ...next.envs])].sort();
}

export function parseWranglerBindings(tomlText) {
  const bindings = new Map();
  let current = null;

  for (const rawLine of tomlText.split(/\r?\n/)) {
    const line = rawLine.trim();
    const header = line.match(/^(#\s*)?\[\[([^\]]+)]]/);
    if (header) {
      const commented = Boolean(header[1]);
      const { env, base } = normalizeSection(header[2]);
      current = {
        kind: SECTION_KIND.get(base) ?? null,
        env,
        applied: !commented,
      };
      continue;
    }

    if (!current?.kind) continue;

    const binding = line.match(/^(#\s*)?binding\s*=\s*"([^"]+)"/);
    if (!binding) continue;

    upsertBinding(bindings, {
      name: binding[2],
      kind: current.kind,
      applied: current.applied && !binding[1],
      envs: [current.env],
    });
  }

  return [...bindings.values()].sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
}

export function parseEnvInterfaceProps(envTsText) {
  const match = envTsText.match(/export\s+interface\s+Env\b[^{]*\{([\s\S]*?)\n\}/);
  if (!match) return new Set();

  const props = new Set();
  for (const prop of match[1].matchAll(/^\s*readonly\s+([A-Z0-9_]+)\??\s*:/gm)) {
    props.add(prop[1]);
  }
  return props;
}

function normalizeInventoryState(rawState) {
  const state = rawState.toLowerCase();
  if (/\bnot[-\s]?applied\b/.test(state)) return "not-applied";
  if (/\bcommented\b|\boptional\b/.test(state)) return "optional-or-commented";
  if (/\bactive\b/.test(state)) return "active";
  return "unknown";
}

function normalizeInventoryKind(rawKind) {
  const kind = rawKind.toLowerCase();
  if (kind.includes("d1")) return "d1";
  if (kind.includes("analytics")) return "analytics";
  if (kind.includes("r2")) return "r2";
  if (kind.includes("kv")) return "kv";
  if (kind.includes("queue")) return "queue";
  return "unknown";
}

export function parseInventoryRows(deploymentMdText) {
  const section = deploymentMdText.match(/### Current (?:Cloudflare|KV\/R2) binding inventory[\s\S]*?(?=\n### |\n## |$)/);
  if (!section) return [];

  const rows = [];
  for (const line of section[0].split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    if (/^\|\s*-+/.test(line) || /\|\s*Binding\s*\|/.test(line)) continue;

    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 4) continue;

    const name = cells[0].match(/`([^`]+)`/)?.[1];
    if (!name) continue;

    rows.push({
      name,
      kind: normalizeInventoryKind(cells[1]),
      state: normalizeInventoryState(cells[2]),
      rawState: cells[2],
      owner: cells[3],
    });
  }
  return rows;
}

export function reconcile(bindings, envProps, inventoryRows) {
  const drifts = [];
  const warnings = [];
  const inventoryByName = new Map(inventoryRows.map((row) => [row.name, row]));
  const bindingsByName = new Map(bindings.map((binding) => [binding.name, binding]));

  for (const binding of bindings) {
    if (binding.applied && !envProps.has(binding.name)) {
      drifts.push({
        code: "ENV_TYPE_MISSING",
        binding: binding.name,
        detail: `${KIND_LABEL[binding.kind] ?? binding.kind} binding is active in wrangler.toml but missing from Env`,
      });
    }

    if (binding.applied && !inventoryByName.has(binding.name)) {
      drifts.push({
        code: "INVENTORY_MISSING",
        binding: binding.name,
        detail: `${KIND_LABEL[binding.kind] ?? binding.kind} binding is active in wrangler.toml but missing from Current Cloudflare binding inventory`,
      });
      continue;
    }

    const inventoryRow = inventoryByName.get(binding.name);
    if (binding.applied && inventoryRow && inventoryRow.kind !== binding.kind) {
      drifts.push({
        code: "INVENTORY_KIND_MISMATCH",
        binding: binding.name,
        detail: `${KIND_LABEL[binding.kind] ?? binding.kind} binding is active in wrangler.toml but inventory kind is ${inventoryRow.kind}`,
      });
    }
  }

  for (const row of inventoryRows) {
    if (row.state === "unknown") {
      warnings.push({
        code: "INVENTORY_STATE_UNKNOWN",
        binding: row.name,
        detail: `inventory state "${row.rawState}" was not classified; row is ignored for orphan drift`,
      });
      continue;
    }

    const binding = bindingsByName.get(row.name);
    if (row.state === "active" && (!binding || !binding.applied)) {
      drifts.push({
        code: "INVENTORY_ORPHAN",
        binding: row.name,
        detail: "inventory marks binding active but wrangler.toml has no active matching binding",
      });
    }
  }

  return { ok: drifts.length === 0, drifts, warnings };
}

export function verifyWranglerBindingDrift(options = {}) {
  const root = options.root ?? process.cwd();
  const wranglerPath = options.wranglerPath ?? DEFAULT_WRANGLER_PATH;
  const envPath = options.envPath ?? DEFAULT_ENV_PATH;
  const inventoryPath = options.inventoryPath ?? DEFAULT_INVENTORY_PATH;

  const wranglerText = readFileSync(resolve(root, wranglerPath), "utf8");
  const envText = readFileSync(resolve(root, envPath), "utf8");
  const inventoryText = readFileSync(resolve(root, inventoryPath), "utf8");

  return reconcile(parseWranglerBindings(wranglerText), parseEnvInterfaceProps(envText), parseInventoryRows(inventoryText));
}

export function main() {
  try {
    const result = verifyWranglerBindingDrift();
    for (const warning of result.warnings) {
      console.warn(`${LOG_PREFIX} ${warning.code}: ${warning.binding} - ${warning.detail}`);
    }
    for (const drift of result.drifts) {
      console.error(`${LOG_PREFIX} ${drift.code}: ${drift.binding} - ${drift.detail}`);
    }
    if (result.ok) {
      console.log(`${LOG_PREFIX} OK: wrangler.toml, Env, and Cloudflare inventory are aligned`);
      return 0;
    }
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} SOURCE_READ_ERROR: ${message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
