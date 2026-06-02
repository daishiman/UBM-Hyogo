// @vitest-environment node
// issue-1031 Phase 4/6: POST/DELETE /me/photo と GET /me/profile photoUrl 拡張の contract テスト。
// Miniflare D1（setupD1）+ in-memory R2 mock + presign mock で HTTP 契約と副作用を検証する。
// 不変条件 #11: path に memberId を含めず session.user.memberId のみで解決（AC-2）。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import {
  MEMBER_IDENTITY_1,
  MEMBER_STATUS_CONSENTED,
  MEMBER_RESPONSE_1,
  RESPONSE_FIELDS_R001,
  FIELD_VISIBILITY_M001,
} from "../../repository/__fixtures__/members.fixture";
import { createMeRoute } from "./index";
import {
  __resetRateLimitForTests,
  RATE_LIMIT_MAX,
} from "../../middleware/rate-limit-self-request";

// presign util は network 非依存に固定するため mock（定数はそのまま actual を温存）。
const { presignMock } = vi.hoisted(() => ({ presignMock: vi.fn() }));
vi.mock("../../lib/r2/member-photo-presign", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../lib/r2/member-photo-presign")>();
  return { ...actual, presignMemberPhotoGetUrl: presignMock };
});

// ---- in-memory R2 mock ----
class FakeR2Bucket {
  store = new Map<string, ArrayBuffer>();
  async put(key: string, value: ArrayBuffer): Promise<{ key: string }> {
    this.store.set(key, value);
    return { key };
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  has(key: string): boolean {
    return this.store.has(key);
  }
  get size(): number {
    return this.store.size;
  }
}

const PRESIGN_SECRETS = {
  R2_ACCOUNT_ID: "acc",
  R2_ACCESS_KEY_ID: "kid",
  R2_SECRET_ACCESS_KEY: "secret",
} as const;

const seedMember = async (env: InMemoryD1) => {
  const insert = (table: string, row: Record<string, unknown>) => {
    const cols = Object.keys(row);
    const ph = cols.map((_, i) => `?${i + 1}`).join(",");
    return env.db
      .prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${ph})`)
      .bind(...Object.values(row))
      .run();
  };
  await insert("member_identities", MEMBER_IDENTITY_1);
  await insert("member_status", MEMBER_STATUS_CONSENTED);
  await insert("member_responses", MEMBER_RESPONSE_1);
  for (const f of RESPONSE_FIELDS_R001) await insert("response_fields", f);
  for (const v of FIELD_VISIBILITY_M001) await insert("member_field_visibility", v);
};

const buildApp = (
  env: InMemoryD1,
  r2: FakeR2Bucket | null,
  opts?: {
    sessionEmail?: string | null;
    withPresignSecrets?: boolean;
  },
) => {
  const sessionEmail =
    opts?.sessionEmail === undefined ? "user1@example.com" : opts.sessionEmail;
  const app = createMeRoute({
    resolveSession: async () => {
      if (!sessionEmail) return null;
      return { email: sessionEmail, memberId: "m_001" };
    },
  });
  const e = {
    DB: env.db as unknown as D1Database,
    RESPONDER_URL: "https://example.com/form",
    ...(r2 ? { MEMBER_PHOTOS: r2 as unknown as R2Bucket } : {}),
    ...(opts?.withPresignSecrets === false ? {} : PRESIGN_SECRETS),
  };
  return { app, e };
};

const fileOf = (bytes: number, type: string): File =>
  new File([new Uint8Array(bytes)], "avatar", { type });

const postPhoto = (
  app: ReturnType<typeof buildApp>["app"],
  e: ReturnType<typeof buildApp>["e"],
  file: File | null,
  extra?: { query?: string; extraFields?: Record<string, string> },
) => {
  const fd = new FormData();
  if (file) fd.append("file", file);
  if (extra?.extraFields) {
    for (const [k, v] of Object.entries(extra.extraFields)) fd.append(k, v);
  }
  const path = `/photo${extra?.query ?? ""}`;
  return app.request(path, { method: "POST", body: fd }, e);
};

const photoRow = (env: InMemoryD1, memberId: string) =>
  env.db
    .prepare(
      `SELECT content_type, byte_size, uploaded_by, source FROM member_photos WHERE member_id = ?1`,
    )
    .bind(memberId)
    .first<{
      content_type: string;
      byte_size: number;
      uploaded_by: string;
      source: string;
    }>();

const countPhotoRows = async (env: InMemoryD1, memberId: string): Promise<number> => {
  const row = await env.db
    .prepare(`SELECT COUNT(*) AS n FROM member_photos WHERE member_id = ?1`)
    .bind(memberId)
    .first<{ n: number }>();
  return row?.n ?? 0;
};

const auditRowsFor = (env: InMemoryD1, action: string) =>
  env.db
    .prepare(
      `SELECT actor_email, target_id, after_json FROM audit_log WHERE action = ?1 ORDER BY created_at DESC`,
    )
    .bind(action)
    .all<{ actor_email: string | null; target_id: string | null; after_json: string | null }>();

describe("POST /me/photo route contract", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitForTests();
    presignMock.mockReset();
    r2 = new FakeR2Bucket();
    await seedMember(env);
  }, 30000);

  it("ME-PHOTO-C-1: 正常 JPEG self-upload → 200 + source='self' + audit", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(100 * 1024, "image/jpeg"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const row = await photoRow(env, "m_001");
    expect(row?.source).toBe("self");
    expect(r2.has("members/m_001/avatar")).toBe(true);
    const audits = await auditRowsFor(env, "member.photo_uploaded");
    expect((audits.results ?? []).length).toBe(1);
    expect(audits.results?.[0]?.actor_email).toBe("user1@example.com");
    expect(audits.results?.[0]?.target_id).toBe("m_001");
  });

  it("ME-PHOTO-C-2: PNG 1 バイト（最小許容）→ 200", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(1, "image/png"));
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(true);
  });

  it("ME-PHOTO-C-3: WebP 256KB ちょうど（上限境界）→ 200", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(262144, "image/webp"));
    expect(res.status).toBe(200);
  });

  it("ME-PHOTO-C-4: file フィールド不在 → 400・副作用なし", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, null);
    expect(res.status).toBe(400);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-5: 空ファイル（0 バイト）→ 400・副作用なし", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(0, "image/jpeg"));
    expect(res.status).toBe(400);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-6: MIME 不許可（image/gif）→ 415・副作用なし", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(1024, "image/gif"));
    expect(res.status).toBe(415);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-7: MIME 不許可（application/pdf）→ 415", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(1024, "application/pdf"));
    expect(res.status).toBe(415);
  });

  it("ME-PHOTO-C-8: サイズ超過（262145 バイト）→ 413・副作用なし", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(262145, "image/jpeg"));
    expect(res.status).toBe(413);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-9: 未認証 → 401・副作用なし・memberId を漏らさない", async () => {
    const { app, e } = buildApp(env, r2, { sessionEmail: null });
    const res = await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    expect(res.status).toBe(401);
    const body = await res.text();
    expect(body).not.toContain("m_001");
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-10: rulesConsent 未同意 → 403・副作用なし", async () => {
    await env.db
      .prepare("UPDATE member_status SET rules_consent='declined' WHERE member_id='m_001'")
      .run();
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    expect(res.status).toBe(403);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ME-PHOTO-C-11: rate limit 超過 → 429", async () => {
    const { app, e } = buildApp(env, r2);
    const statuses: number[] = [];
    for (let i = 0; i < RATE_LIMIT_MAX + 1; i += 1) {
      const res = await postPhoto(app, e, fileOf(1024, "image/jpeg"));
      statuses.push(res.status);
    }
    expect(statuses[RATE_LIMIT_MAX]).toBe(429);
  });

  it("ME-PHOTO-C-12: R2 binding 無し → 503・D1 変更なし", async () => {
    const { app, e } = buildApp(env, null);
    const res = await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    expect(res.status).toBe(503);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ME-PHOTO-C-13: body/query に他人 memberId を混入しても自分の row のみ書く（AC-2）", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await postPhoto(app, e, fileOf(1024, "image/jpeg"), {
      query: "?memberId=other_member_id",
      extraFields: { memberId: "other_member_id" },
    });
    expect(res.status).toBe(200);
    expect(await countPhotoRows(env, "m_001")).toBe(1);
    expect(await countPhotoRows(env, "other_member_id")).toBe(0);
    expect(r2.has("members/m_001/avatar")).toBe(true);
    expect(r2.has("members/other_member_id/avatar")).toBe(false);
  });
});

describe("DELETE /me/photo route contract", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitForTests();
    presignMock.mockReset();
    r2 = new FakeR2Bucket();
    await seedMember(env);
  }, 30000);

  const del = (
    app: ReturnType<typeof buildApp>["app"],
    e: ReturnType<typeof buildApp>["e"],
  ) => app.request("/photo", { method: "DELETE" }, e);

  it("ME-PHOTO-C-14: photo 存在 → 200 + D1/R2 delete + audit", async () => {
    const { app, e } = buildApp(env, r2);
    await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    const res = await del(app, e);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.has("members/m_001/avatar")).toBe(false);
    const audits = await auditRowsFor(env, "member.photo_deleted");
    expect((audits.results ?? []).length).toBe(1);
    expect(audits.results?.[0]?.target_id).toBe("m_001");
  });

  it("ME-PHOTO-C-15: photo 未登録 → 404・audit なし", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await del(app, e);
    expect(res.status).toBe(404);
    const audits = await auditRowsFor(env, "member.photo_deleted");
    expect((audits.results ?? []).length).toBe(0);
  });

  it("ME-PHOTO-C-16: 未認証 → 401", async () => {
    const { app, e } = buildApp(env, r2, { sessionEmail: null });
    const res = await del(app, e);
    expect(res.status).toBe(401);
  });

  it("ME-PHOTO-C-17: DELETE は rulesConsent 不要（declined でも 200）", async () => {
    const { app, e } = buildApp(env, r2);
    await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    await env.db
      .prepare("UPDATE member_status SET rules_consent='declined' WHERE member_id='m_001'")
      .run();
    const res = await del(app, e);
    expect(res.status).toBe(200);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ME-PHOTO-C-18: DELETE は session.memberId の row のみ削除（path に memberId 無し・AC-2）", async () => {
    const { app, e } = buildApp(env, r2);
    await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    // 別 member の row を直接 INSERT しておく。
    await env.db
      .prepare(
        `INSERT INTO member_photos
         (member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`,
      )
      .bind("other_member_id", "members/other_member_id/avatar", "image/jpeg", 10, "x@e.com", "admin")
      .run();
    const res = await del(app, e);
    expect(res.status).toBe(200);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    // 他 member の row は変化なし。
    expect(await countPhotoRows(env, "other_member_id")).toBe(1);
  });
});

describe("GET /me/profile photoUrl 拡張", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitForTests();
    presignMock.mockReset();
    r2 = new FakeR2Bucket();
    await seedMember(env);
  }, 30000);

  it("ME-PHOTO-C-19: photo row 有 + presign 成功 → photoUrl 同梱", async () => {
    const { app, e } = buildApp(env, r2);
    await postPhoto(app, e, fileOf(1024, "image/jpeg"));
    presignMock.mockResolvedValue("https://signed.example/members/m_001/avatar?sig=x");
    const res = await app.request("/profile", {}, e);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBe("https://signed.example/members/m_001/avatar?sig=x");
  });

  it("ME-PHOTO-C-20: photo row 無 → photoUrl 省略（200 維持）", async () => {
    const { app, e } = buildApp(env, r2);
    const res = await app.request("/profile", {}, e);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBeUndefined();
    expect(presignMock).not.toHaveBeenCalled();
  });

  it("ME-PHOTO-C-21: presign secret 未設定 → photoUrl 省略（200 維持・fail-soft）", async () => {
    const { app, e } = buildApp(env, r2, { withPresignSecrets: false });
    await env.db
      .prepare(
        `INSERT INTO member_photos
         (member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`,
      )
      .bind("m_001", "members/m_001/avatar", "image/jpeg", 1024, "user1@example.com", "self")
      .run();
    const res = await app.request("/profile", {}, e);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBeUndefined();
    expect(presignMock).not.toHaveBeenCalled();
  });
});
