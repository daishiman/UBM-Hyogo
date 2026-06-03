import { describe, expect, it } from "vitest";
import {
  parseEnvInterfaceProps,
  parseInventoryRows,
  parseWranglerBindings,
  reconcile,
} from "../verify-wrangler-binding-drift.mjs";

const wranglerFixture = `
[[d1_databases]]
binding = "DB"

[[analytics_engine_datasets]]
binding = "SYNC_ALERTS"

[[env.production.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"

[[env.staging.r2_buckets]]
binding = "UBM_AUDIT_COLD_STORAGE"

[[env.production.r2_buckets]]
binding = "UBM_AUDIT_APP_COLD_STORAGE"

[[env.staging.r2_buckets]]
binding = "UBM_AUDIT_APP_COLD_STORAGE"

[[env.production.r2_buckets]]
binding = "MEMBER_PHOTOS"

[[env.staging.r2_buckets]]
binding = "MEMBER_PHOTOS"

# [[env.production.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"

# [[queues.producers]]
# binding = "SCHEMA_ALIAS_BACKFILL_QUEUE"
`;

const envFixture = `
export interface Env {
  readonly DB: D1Database;
  readonly SYNC_ALERTS?: AnalyticsEngineDataset;
  readonly UBM_AUDIT_COLD_STORAGE?: R2Bucket;
  readonly UBM_AUDIT_APP_COLD_STORAGE?: R2Bucket;
  readonly MEMBER_PHOTOS?: R2Bucket;
  readonly ALERT_DEDUP_KV?: KVNamespace;
  readonly SCHEMA_ALIAS_BACKFILL_QUEUE?: Queue<unknown>;
  readonly R2_ACCOUNT_ID?: string;
  readonly AUTH_SECRET?: string;
}
`;

const inventoryFixture = `
### Current Cloudflare binding inventory（Issue #57 / issue #1054 / 2026-06-02）

| Binding | Kind | Current state | Owner / boundary |
| --- | --- | --- | --- |
| \`DB\` | D1 database | top-level + production/staging active in \`apps/api/wrangler.toml\` | core D1 database |
| \`SYNC_ALERTS\` | Analytics Engine dataset | top-level + production/staging active in \`apps/api/wrangler.toml\` | sync alert metrics |
| \`UBM_AUDIT_COLD_STORAGE\` | R2 bucket | production/staging active in \`apps/api/wrangler.toml\` | Issue #514 |
| \`UBM_AUDIT_APP_COLD_STORAGE\` | R2 bucket | production/staging active in \`apps/api/wrangler.toml\` | Issue #315 |
| \`MEMBER_PHOTOS\` | R2 bucket | production/staging active in \`apps/api/wrangler.toml\` | issue-983 |
| \`ALERT_DEDUP_KV\` | Workers KV | \`apps/api/src/env.ts\` optional; wrangler blocks remain commented | alert relay |
| \`SCHEMA_ALIAS_BACKFILL_QUEUE\` | Queue | \`apps/api/src/env.ts\` optional; wrangler blocks remain commented | schema alias backfill |
| \`SESSION_KV\` | Workers KV | not applied | UT-13 |
| \`R2_BUCKET\` | R2 bucket | not applied | UT-12 |

### Next section
`;

function parsedFixtures() {
  return {
    bindings: parseWranglerBindings(wranglerFixture),
    envProps: parseEnvInterfaceProps(envFixture),
    inventoryRows: parseInventoryRows(inventoryFixture),
  };
}

describe("verify-wrangler-binding-drift", () => {
  it("parses env-prefixed active bindings and merges prod/staging entries", () => {
    const bindings = parseWranglerBindings(wranglerFixture);
    expect(bindings).toContainEqual({
      name: "MEMBER_PHOTOS",
      kind: "r2",
      applied: true,
      envs: ["production", "staging"],
    });
  });

  it("parses commented binding blocks as applied:false", () => {
    const bindings = parseWranglerBindings(wranglerFixture);
    expect(bindings).toContainEqual({
      name: "ALERT_DEDUP_KV",
      kind: "kv",
      applied: false,
      envs: ["production"],
    });
    expect(bindings).toContainEqual({
      name: "SCHEMA_ALIAS_BACKFILL_QUEUE",
      kind: "queue",
      applied: false,
      envs: ["default"],
    });
  });

  it("parses direct Env interface properties including secrets", () => {
    const props = parseEnvInterfaceProps(envFixture);
    expect([...props].sort()).toEqual([
      "ALERT_DEDUP_KV",
      "AUTH_SECRET",
      "DB",
      "MEMBER_PHOTOS",
      "R2_ACCOUNT_ID",
      "SCHEMA_ALIAS_BACKFILL_QUEUE",
      "SYNC_ALERTS",
      "UBM_AUDIT_APP_COLD_STORAGE",
      "UBM_AUDIT_COLD_STORAGE",
    ]);
  });

  it("parses inventory rows and normalizes states", () => {
    const rows = parseInventoryRows(inventoryFixture);
    expect(rows.map((row) => [row.name, row.kind, row.state])).toEqual([
      ["DB", "d1", "active"],
      ["SYNC_ALERTS", "analytics", "active"],
      ["UBM_AUDIT_COLD_STORAGE", "r2", "active"],
      ["UBM_AUDIT_APP_COLD_STORAGE", "r2", "active"],
      ["MEMBER_PHOTOS", "r2", "active"],
      ["ALERT_DEDUP_KV", "kv", "optional-or-commented"],
      ["SCHEMA_ALIAS_BACKFILL_QUEUE", "queue", "optional-or-commented"],
      ["SESSION_KV", "kv", "not-applied"],
      ["R2_BUCKET", "r2", "not-applied"],
    ]);
  });

  it("reports active wrangler binding missing from Env", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    envProps.delete("MEMBER_PHOTOS");
    expect(reconcile(bindings, envProps, inventoryRows).drifts).toContainEqual(
      expect.objectContaining({ code: "ENV_TYPE_MISSING", binding: "MEMBER_PHOTOS" }),
    );
  });

  it("reports active applied binding missing from inventory", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    const withoutMemberPhotos = inventoryRows.filter((row) => row.name !== "MEMBER_PHOTOS");
    expect(reconcile(bindings, envProps, withoutMemberPhotos).drifts).toContainEqual(
      expect.objectContaining({ code: "INVENTORY_MISSING", binding: "MEMBER_PHOTOS" }),
    );
  });

  it("reports active applied binding with a mismatched inventory kind", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    const mismatchedRows = inventoryRows.map((row) =>
      row.name === "MEMBER_PHOTOS" ? { ...row, kind: "kv" } : row,
    );
    expect(reconcile(bindings, envProps, mismatchedRows).drifts).toContainEqual(
      expect.objectContaining({ code: "INVENTORY_KIND_MISMATCH", binding: "MEMBER_PHOTOS" }),
    );
  });

  it("reports active applied binding with an unknown inventory kind", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    const mismatchedRows = inventoryRows.map((row) =>
      row.name === "MEMBER_PHOTOS" ? { ...row, kind: "unknown" } : row,
    );
    expect(reconcile(bindings, envProps, mismatchedRows).drifts).toContainEqual(
      expect.objectContaining({ code: "INVENTORY_KIND_MISMATCH", binding: "MEMBER_PHOTOS" }),
    );
  });

  it("reports inventory active row without active wrangler binding", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    const withoutMemberPhotos = bindings.filter((binding) => binding.name !== "MEMBER_PHOTOS");
    expect(reconcile(withoutMemberPhotos, envProps, inventoryRows).drifts).toContainEqual(
      expect.objectContaining({ code: "INVENTORY_ORPHAN", binding: "MEMBER_PHOTOS" }),
    );
  });

  it("does not fail commented optional bindings", () => {
    const bindings = parseWranglerBindings(`
# [[env.production.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"
`);
    const envProps = new Set(["ALERT_DEDUP_KV"]);
    const inventoryRows = parseInventoryRows(`
### Current KV/R2 binding inventory
| Binding | Kind | Current state | Owner / boundary |
| --- | --- | --- | --- |
| \`ALERT_DEDUP_KV\` | Workers KV | optional/commented until user gate | alert relay |
`);
    expect(reconcile(bindings, envProps, inventoryRows).drifts).toEqual([]);
  });

  it("passes the corrected current-state fixture", () => {
    const { bindings, envProps, inventoryRows } = parsedFixtures();
    expect(reconcile(bindings, envProps, inventoryRows)).toMatchObject({ ok: true, drifts: [] });
  });

  it("warns but does not fail unknown inventory state wording", () => {
    const { bindings, envProps } = parsedFixtures();
    const inventoryRows = parseInventoryRows(`
### Current KV/R2 binding inventory
| Binding | Kind | Current state | Owner / boundary |
| --- | --- | --- | --- |
| \`UNKNOWN_STATE_ONLY\` | R2 bucket | provisioned elsewhere | test |
`);
    const result = reconcile(bindings, envProps, inventoryRows);
    expect(result.drifts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "INVENTORY_MISSING", binding: "DB" }),
        expect.objectContaining({ code: "INVENTORY_MISSING", binding: "MEMBER_PHOTOS" }),
        expect.objectContaining({ code: "INVENTORY_MISSING", binding: "SYNC_ALERTS" }),
        expect.objectContaining({ code: "INVENTORY_MISSING", binding: "UBM_AUDIT_APP_COLD_STORAGE" }),
        expect.objectContaining({ code: "INVENTORY_MISSING", binding: "UBM_AUDIT_COLD_STORAGE" }),
      ]),
    );
    expect(result.drifts).toHaveLength(5);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: "INVENTORY_STATE_UNKNOWN", binding: "UNKNOWN_STATE_ONLY" }),
    );
  });
});
