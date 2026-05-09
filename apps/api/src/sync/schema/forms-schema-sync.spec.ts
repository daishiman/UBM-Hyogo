// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { runSchemaSync } from "./forms-schema-sync";
import { ConflictError, SyncIntegrityError, type SchemaSyncEnv } from "./types";
import * as syncJobs from "../../repository/syncJobs";
import {
  FORMS_GET_31_ITEMS,
  FORMS_GET_WITH_UNKNOWN,
} from "../../../tests/fixtures/forms-get";
import type { RawForm } from "@ubm-hyogo/integrations-google";

const makeDeps = (env: InMemoryD1, raw: RawForm) => ({
  ctx: env.ctx,
  formsClient: {
    getForm: async () => {
      throw new Error("not used in test");
    },
    getRawForm: async (_formId: string) => raw,
  },
});

const makeEnv = (env: InMemoryD1): SchemaSyncEnv => ({
  DB: env.db as unknown as SchemaSyncEnv["DB"],
  GOOGLE_FORM_ID: "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
});

describe("runSchemaSync", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("AC-1 / AC-5 / AC-8: 31 項目を upsert し sync_jobs が succeeded で記録される", { timeout: 30000 }, async () => {
    const result = await runSchemaSync(makeEnv(env), makeDeps(env, FORMS_GET_31_ITEMS));
    expect(result.status).toBe("succeeded");
    expect(result.upserted).toBe(31);

    const qcount = await env.db
      .prepare("SELECT COUNT(*) AS c FROM schema_questions WHERE revision_id = ?")
      .bind(result.revisionId!)
      .first<{ c: number }>();
    expect(qcount?.c).toBe(31);

    const sections = await env.db
      .prepare(
        "SELECT COUNT(DISTINCT section_key) AS c FROM schema_questions WHERE revision_id = ?",
      )
      .bind(result.revisionId!)
      .first<{ c: number }>();
    expect(sections?.c).toBe(6);

    // AC-8: 既知 31 項目は stable_key が 'unknown' でない
    const unknown = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM schema_questions WHERE revision_id = ? AND stable_key = 'unknown'",
      )
      .bind(result.revisionId!)
      .first<{ c: number }>();
    expect(unknown?.c).toBe(0);

    const job = await syncJobs.findLatest(env.ctx, "schema_sync");
    expect(job?.status).toBe("succeeded");
  });

  it("AC-2: 未知 question は schema_diff_queue に 1 件 = 1 row で積まれる", { timeout: 30000 }, async () => {
    const result = await runSchemaSync(
      makeEnv(env),
      makeDeps(env, FORMS_GET_WITH_UNKNOWN),
    );
    expect(result.status).toBe("succeeded");
    expect(result.diffEnqueued).toBe(1);
    const row = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM schema_diff_queue WHERE status = 'queued' AND type = 'unresolved' AND question_id = ?",
      )
      .bind("q31x")
      .first<{ c: number }>();
    expect(row?.c).toBe(1);
    const manifest = await env.db
      .prepare("SELECT unknown_field_count AS c FROM schema_versions WHERE revision_id = ?")
      .bind(result.revisionId!)
      .first<{ c: number }>();
    expect(manifest?.c).toBe(1);
  });

  it(
    "AC-4: 同一 revisionId の再実行で schema_versions は重複 row を作らない",
    async () => {
      await runSchemaSync(makeEnv(env), makeDeps(env, FORMS_GET_31_ITEMS));
      await runSchemaSync(makeEnv(env), makeDeps(env, FORMS_GET_31_ITEMS));
      const r = await env.db
        .prepare("SELECT COUNT(*) AS c FROM schema_versions WHERE revision_id = ?")
        .bind(FORMS_GET_31_ITEMS.revisionId!)
        .first<{ c: number }>();
      expect(r?.c).toBe(1);
    },
    30000,
  );

  it("AC-6: 同種 schema_sync が running なら ConflictError", async () => {
    // 直接 running 行を入れて 409 を再現
    await syncJobs.start(env.ctx, "schema_sync");
    await expect(
      runSchemaSync(makeEnv(env), makeDeps(env, FORMS_GET_31_ITEMS)),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("forms.get 失敗時に sync_jobs.status='failed' へ遷移する", async () => {
    const failingDeps = {
      ctx: env.ctx,
      formsClient: {
        getForm: async () => {
          throw new Error("not used");
        },
        getRawForm: async () => {
          throw new Error("forms-api: 503");
        },
      },
    };
    await expect(
      runSchemaSync(makeEnv(env), failingDeps),
    ).rejects.toThrow(/forms-api/);
    const job = await syncJobs.findLatest(env.ctx, "schema_sync");
    expect(job?.status).toBe("failed");
    expect(job?.error).toMatchObject({ message: expect.stringContaining("forms-api") });
  });

  it("31 項目から逸脱した fixture は SyncIntegrityError で failed", async () => {
    const tooFew: RawForm = {
      ...FORMS_GET_31_ITEMS,
      items: (FORMS_GET_31_ITEMS.items ?? []).slice(0, 10),
    };
    await expect(
      runSchemaSync(makeEnv(env), makeDeps(env, tooFew)),
    ).rejects.toBeInstanceOf(SyncIntegrityError);
    const job = await syncJobs.findLatest(env.ctx, "schema_sync");
    expect(job?.status).toBe("failed");
  });

  it("GOOGLE_FORM_ID 未設定なら failed 遷移して SyncIntegrityError", async () => {
    const env2: SchemaSyncEnv = { DB: env.db as unknown as SchemaSyncEnv["DB"] };
    await expect(
      runSchemaSync(env2, makeDeps(env, FORMS_GET_31_ITEMS)),
    ).rejects.toBeInstanceOf(SyncIntegrityError);
  });
});
