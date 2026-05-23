import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { getLatestVersion, listVersions, supersede, upsertManifest } from "./schemaVersions";

const seed = () => ({
  tables: {
    schema_versions: [
      {
        revision_id: "v1",
        form_id: "f1",
        schema_hash: "h1",
        state: "superseded",
        synced_at: "2026-01-01",
        source_url: "https://example.com",
        field_count: 10,
        unknown_field_count: 0,
      },
      {
        revision_id: "v2",
        form_id: "f1",
        schema_hash: "h2",
        state: "active",
        synced_at: "2026-02-01",
        source_url: "https://example.com",
        field_count: 12,
        unknown_field_count: 1,
      },
      {
        revision_id: "v3",
        form_id: "f1",
        schema_hash: "h3",
        state: "active",
        synced_at: "2026-03-01",
        source_url: "https://example.com",
        field_count: 13,
        unknown_field_count: 2,
      },
    ],
  },
  primaryKeys: { schema_versions: ["revision_id"] },
});

describe("schemaVersions repository", () => {
  it("getLatestVersion は最新 synced_at の active 1 件 (AC-3)", async () => {
    const fake = createFakeD1(seed());
    const r = await getLatestVersion({ db: fake.d1 }, "f1");
    expect(r?.revisionId).toBe("v3");
    expect(r?.state).toBe("active");
  });

  it("getLatestVersion: active がなければ null", async () => {
    const fake = createFakeD1({
      tables: {
        schema_versions: [{ revision_id: "v1", form_id: "f1", schema_hash: "h", state: "superseded", synced_at: "2026-01-01", source_url: "u", field_count: 0, unknown_field_count: 0 }],
      },
      primaryKeys: { schema_versions: ["revision_id"] },
    });
    const r = await getLatestVersion({ db: fake.d1 }, "f1");
    expect(r).toBeNull();
  });

  it("listVersions は form_id 単位で複数返す", async () => {
    const fake = createFakeD1(seed());
    const r = await listVersions({ db: fake.d1 }, "f1");
    expect(r.map((x) => x.revisionId)).toEqual(["v3", "v2", "v1"]);
  });

  it("supersede は state を superseded に変更", async () => {
    const fake = createFakeD1(seed());
    await supersede({ db: fake.d1 }, "f1", "v2");
    const row = fake.state.tables.schema_versions!.find((r) => r["revision_id"] === "v2")!;
    expect(row["state"]).toBe("superseded");
  });

  it("upsertManifest は新規/置換ともに動作", async () => {
    const fake = createFakeD1(seed());
    const r = await upsertManifest(
      { db: fake.d1 },
      {
        revisionId: "v3",
        formId: "f1",
        schemaHash: "h3",
        state: "active",
        sourceUrl: "https://example.com",
        fieldCount: 15,
        unknownFieldCount: 0,
      },
    );
    expect(r.revisionId).toBe("v3");
    expect(fake.state.tables.schema_versions).toHaveLength(3);
  });
});
