// @vitest-environment node
// issue-983 Phase 4/6: POST/DELETE /admin/members/:id/photo と GET 拡張の contract テスト。
// Miniflare D1（setupD1）+ in-memory R2 mock + presign mock で HTTP 契約と副作用を検証する。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "../members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "../_test-auth";

// presign util は network 非依存に固定するため mock（fail-soft / 成功を test ごとに制御）。
const { presignMock } = vi.hoisted(() => ({ presignMock: vi.fn() }));
vi.mock("../../../lib/r2/member-photo-presign", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../lib/r2/member-photo-presign")>();
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
  async head(key: string): Promise<{ key: string } | null> {
    return this.store.has(key) ? { key } : null;
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

const makeEnv = (
  env: InMemoryD1,
  r2: FakeR2Bucket,
  opts?: { withPresignSecrets?: boolean },
) => ({
  DB: env.db as unknown as D1Database,
  AUTH_SECRET: TEST_AUTH_SECRET,
  MEMBER_PHOTOS: r2 as unknown as R2Bucket,
  ...(opts?.withPresignSecrets === false ? {} : PRESIGN_SECRETS),
});

const seedMember = async (env: InMemoryD1, memberId: string) => {
  const responseId = `r_${memberId}`;
  await env.db
    .prepare(
      `INSERT INTO member_responses
        (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
       VALUES (?1, 'f1', 'rev1', 'h1', ?2, ?3, ?4, ?5)`,
    )
    .bind(
      responseId,
      `${memberId}@example.com`,
      "2026-05-01T00:00:00Z",
      JSON.stringify({ fullName: "田中太郎", nickname: "たなか", location: "神戸", occupation: "経営者" }),
      `${memberId} 田中太郎`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES (?1, ?2, ?3, ?3, ?4)`,
    )
    .bind(memberId, `${memberId}@example.com`, responseId, "2026-05-01T00:00:00Z")
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status
        (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES (?1, 'consented', 'consented', 'public', 0)`,
    )
    .bind(memberId)
    .run();
};

const fileOf = (bytes: number, type: string): File =>
  new File([new Uint8Array(bytes)], "avatar", { type });

const postPhoto = async (
  env: InMemoryD1,
  r2: FakeR2Bucket,
  memberId: string,
  file: File,
) => {
  const fd = new FormData();
  fd.append("file", file);
  return createAdminMembersRoute().request(
    `/members/${memberId}/photo`,
    { method: "POST", body: fd, headers: { ...(await adminAuthHeader()) } },
    makeEnv(env, r2),
  );
};

const countPhotoRows = async (env: InMemoryD1, memberId: string): Promise<number> => {
  const row = await env.db
    .prepare(`SELECT COUNT(*) AS n FROM member_photos WHERE member_id = ?1`)
    .bind(memberId)
    .first<{ n: number }>();
  return row?.n ?? 0;
};

const photoRow = async (env: InMemoryD1, memberId: string) =>
  env.db
    .prepare(
      `SELECT content_type, byte_size, uploaded_by FROM member_photos WHERE member_id = ?1`,
    )
    .bind(memberId)
    .first<{ content_type: string; byte_size: number; uploaded_by: string }>();

const auditRowsFor = async (env: InMemoryD1, action: string) =>
  env.db
    .prepare(
      `SELECT actor_email, target_id, after_json FROM audit_log WHERE action = ?1 ORDER BY created_at DESC`,
    )
    .bind(action)
    .all<{ actor_email: string | null; target_id: string | null; after_json: string | null }>();

// issue-1030: display/thumb/contentHash を任意に組み立てて POST するヘルパ。
const postVariants = async (
  env: InMemoryD1,
  r2: FakeR2Bucket,
  memberId: string,
  opts: { display?: File; thumb?: File; contentHash?: string; legacyFile?: File },
) => {
  const fd = new FormData();
  if (opts.display) fd.append("display", opts.display);
  if (opts.thumb) fd.append("thumb", opts.thumb);
  if (opts.contentHash !== undefined) fd.append("contentHash", opts.contentHash);
  if (opts.legacyFile) fd.append("file", opts.legacyFile);
  return createAdminMembersRoute().request(
    `/members/${memberId}/photo`,
    { method: "POST", body: fd, headers: { ...(await adminAuthHeader()) } },
    makeEnv(env, r2),
  );
};

// thumb 系の variant 列を直読みするヘルパ。
const variantRow = async (env: InMemoryD1, memberId: string) =>
  env.db
    .prepare(
      `SELECT thumb_object_key, thumb_byte_size, content_hash, processing_status
       FROM member_photos WHERE member_id = ?1`,
    )
    .bind(memberId)
    .first<{
      thumb_object_key: string | null;
      thumb_byte_size: number | null;
      content_hash: string | null;
      processing_status: string;
    }>();

describe("POST /admin/members/:memberId/photo", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  it("ROUTE-C-1: 正常 JPEG → 200 + D1 upsert + R2 put + audit", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await countPhotoRows(env, "m_001")).toBe(1);
    expect(r2.has("members/m_001/avatar")).toBe(true);
    const audits = await auditRowsFor(env, "admin.member.photo_uploaded");
    expect((audits.results ?? []).length).toBe(1);
  });

  it("ROUTE-C-2: 257KB 超過 → 413・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(257 * 1024, "image/jpeg"));
    expect(res.status).toBe(413);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ROUTE-C-3: 不許可 MIME(image/gif) → 415・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(1024, "image/gif"));
    expect(res.status).toBe(415);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.size).toBe(0);
  });

  it("ROUTE-C-4: member 不在 → 404", async () => {
    const res = await postPhoto(env, r2, "m_missing", fileOf(1024, "image/png"));
    expect(res.status).toBe(404);
    expect(r2.size).toBe(0);
  });

  it("ROUTE-C-5 / ROUTE-E-11: 256KB ちょうど → 200", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(262144, "image/webp"));
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(true);
  });

  it("ROUTE-E-9: 0 バイト → 400", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(0, "image/jpeg"));
    expect(res.status).toBe(400);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ROUTE-E-10: 1 バイト → 200（最小許容）", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(1, "image/jpeg"));
    expect(res.status).toBe(200);
  });

  it("ROUTE-E-12: 262145 バイト(1超過) → 413", async () => {
    await seedMember(env, "m_001");
    const res = await postPhoto(env, r2, "m_001", fileOf(262145, "image/jpeg"));
    expect(res.status).toBe(413);
  });

  it("ROUTE-E-3/E-4: 2 回 POST で上書き(content_type/byte_size が後勝ち, R2 は 1 object)", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(10 * 1024, "image/jpeg"));
    await postPhoto(env, r2, "m_001", fileOf(20 * 1024, "image/png"));
    const row = await photoRow(env, "m_001");
    expect(row?.content_type).toBe("image/png");
    expect(row?.byte_size).toBe(20 * 1024);
    expect(await countPhotoRows(env, "m_001")).toBe(1);
    expect(r2.size).toBe(1);
  });

  it("ROUTE-E-7: audit actor_email が admin email・action 固定", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    const audits = await auditRowsFor(env, "admin.member.photo_uploaded");
    expect(audits.results?.[0]?.actor_email).toBe("admin@example.com");
    expect(audits.results?.[0]?.target_id).toBe("m_001");
  });
});

describe("DELETE /admin/members/:memberId/photo", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  it("ROUTE-C-6: photo 有 → 200 + D1 delete + R2 delete + audit", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    const res = await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    expect(res.status).toBe(200);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
    expect(r2.has("members/m_001/avatar")).toBe(false);
    const audits = await auditRowsFor(env, "admin.member.photo_deleted");
    expect((audits.results ?? []).length).toBe(1);
  });

  it("ROUTE-C-7: photo 不在 → 404", async () => {
    await seedMember(env, "m_001");
    const res = await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    expect(res.status).toBe(404);
  });

  it("ROUTE-E-8: DELETE audit action=photo_deleted・target_id=memberId", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    const audits = await auditRowsFor(env, "admin.member.photo_deleted");
    expect(audits.results?.[0]?.target_id).toBe("m_001");
  });
});

describe("GET /admin/members/:memberId photoUrl 拡張", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  const getDetail = async (memberId: string, opts?: { withPresignSecrets?: boolean }) =>
    createAdminMembersRoute().request(
      `/members/${memberId}`,
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2, opts),
    );

  it("ROUTE-C-8: photo 有・presign 成功 → 200 + photoUrl 有", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    presignMock.mockResolvedValue("https://signed.example/members/m_001/avatar?sig=x");
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBe("https://signed.example/members/m_001/avatar?sig=x");
    expect(presignMock).toHaveBeenCalled();
  });

  it("ROUTE-C-9: photo 無 → 200 + photoUrl 無し・presign 不呼び出し", async () => {
    await seedMember(env, "m_001");
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBeUndefined();
    expect(presignMock).not.toHaveBeenCalled();
  });

  it("ROUTE-C-10 / ROUTE-E-2: presign が null → 200 + photoUrl 無し(fail-soft)", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    presignMock.mockResolvedValue(null);
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBeUndefined();
  });

  it("ROUTE-E-1: presign secret 未設定 → 200 + photoUrl 無し・presign 不呼び出し", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    const res = await getDetail("m_001", { withPresignSecrets: false });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string };
    expect(body.photoUrl).toBeUndefined();
    expect(presignMock).not.toHaveBeenCalled();
  });

  it("ROUTE-E-5/E-6: DELETE 後の GET → photoUrl 無し・detail 本体は正常", async () => {
    await seedMember(env, "m_001");
    await postPhoto(env, r2, "m_001", fileOf(1024, "image/jpeg"));
    await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      photoUrl?: string;
      identityMemberId?: string;
      status?: unknown;
      profile?: unknown;
    };
    expect(body.photoUrl).toBeUndefined();
    expect(body.identityMemberId).toBe("m_001");
    expect(body.status).toBeTruthy();
    expect(body.profile).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// issue-1030: display/thumb variant pipeline contract
// ---------------------------------------------------------------------------
describe("POST /admin/members/:memberId/photo (variant)", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  it("ROUTE-V-1: display+thumb+contentHash → 200・両 put・client_generated・audit に hasThumb", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/webp"),
      contentHash: "a".repeat(64),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(r2.has("members/m_001/avatar")).toBe(true);
    expect(r2.has("members/m_001/thumb")).toBe(true);
    const row = await variantRow(env, "m_001");
    expect(row?.processing_status).toBe("client_generated");
    expect(row?.thumb_object_key).toBe("members/m_001/thumb");
    expect(row?.thumb_byte_size).toBe(2048);
    expect(row?.content_hash).toBe("a".repeat(64));
    // audit after に hasThumb=true・signed URL / raw bytes は含まない。
    const audits = await auditRowsFor(env, "admin.member.photo_uploaded");
    const after = JSON.parse(audits.results?.[0]?.after_json ?? "{}") as Record<string, unknown>;
    expect(after.hasThumb).toBe(true);
    expect(JSON.stringify(after)).not.toContain("X-Amz-");
  });

  it("ROUTE-V-2: display のみ → 200・avatar のみ・original_fallback・thumb null", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", { display: fileOf(1024, "image/jpeg") });
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(true);
    expect(r2.has("members/m_001/thumb")).toBe(false);
    const row = await variantRow(env, "m_001");
    expect(row?.processing_status).toBe("original_fallback");
    expect(row?.thumb_object_key).toBeNull();
  });

  it("ROUTE-V-3: 後方互換 — 旧 file 単一 → 200・original_fallback・thumb null", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", { legacyFile: fileOf(1024, "image/png") });
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(true);
    const row = await variantRow(env, "m_001");
    expect(row?.processing_status).toBe("original_fallback");
    expect(row?.thumb_object_key).toBeNull();
  });

  it("ROUTE-V-4: thumb が 64KB 超過 → 413・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(65537, "image/webp"),
    });
    expect(res.status).toBe(413);
    expect(r2.size).toBe(0);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ROUTE-V-5: display が 256KB 超過 → 413・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", {
      display: fileOf(262145, "image/jpeg"),
    });
    expect(res.status).toBe(413);
    expect(r2.size).toBe(0);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ROUTE-V-6: thumb MIME 不許可(image/gif) → 415・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/gif"),
    });
    expect(res.status).toBe(415);
    expect(r2.size).toBe(0);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ROUTE-V-7: display も旧 file も不在 → 400・副作用なし", async () => {
    await seedMember(env, "m_001");
    const res = await postVariants(env, r2, "m_001", { contentHash: "x" });
    expect(res.status).toBe(400);
    expect(r2.size).toBe(0);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });
});

describe("GET /admin/members/:memberId photoThumbUrl 拡張", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  const getDetail = async (memberId: string) =>
    createAdminMembersRoute().request(
      `/members/${memberId}`,
      { headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );

  it("ROUTE-V-8: display+thumb 保存・presign 両成功 → photoUrl と photoThumbUrl 双方", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/webp"),
    });
    presignMock.mockImplementation(async (_deps: unknown, objectKey: string) =>
      `https://signed.example/${objectKey}?sig=x`,
    );
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string; photoThumbUrl?: string };
    expect(body.photoUrl).toBe("https://signed.example/members/m_001/avatar?sig=x");
    expect(body.photoThumbUrl).toBe("https://signed.example/members/m_001/thumb?sig=x");
    expect(presignMock).toHaveBeenCalledTimes(2);
  });

  it("ROUTE-V-9: display のみ保存 → photoUrl 有・photoThumbUrl undefined・presign 1 回", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", { display: fileOf(1024, "image/jpeg") });
    presignMock.mockImplementation(async (_deps: unknown, objectKey: string) =>
      `https://signed.example/${objectKey}?sig=x`,
    );
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string; photoThumbUrl?: string };
    expect(body.photoUrl).toBe("https://signed.example/members/m_001/avatar?sig=x");
    expect(body.photoThumbUrl).toBeUndefined();
    expect(presignMock).toHaveBeenCalledTimes(1);
  });

  it("ROUTE-V-10: thumb 保存済だが thumb presign が null → photoThumbUrl undefined・fail-soft", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/webp"),
    });
    presignMock.mockImplementation(async (_deps: unknown, objectKey: string) =>
      objectKey.endsWith("/thumb") ? null : `https://signed.example/${objectKey}?sig=x`,
    );
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photoUrl?: string; photoThumbUrl?: string };
    expect(body.photoUrl).toBe("https://signed.example/members/m_001/avatar?sig=x");
    expect(body.photoThumbUrl).toBeUndefined();
  });

  it("ROUTE-V-11: display presign が null → 両 undefined・detail 200 維持", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/webp"),
    });
    presignMock.mockResolvedValue(null);
    const res = await getDetail("m_001");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      photoUrl?: string;
      photoThumbUrl?: string;
      identityMemberId?: string;
    };
    expect(body.photoUrl).toBeUndefined();
    expect(body.photoThumbUrl).toBeUndefined();
    expect(body.identityMemberId).toBe("m_001");
  });
});

describe("DELETE /admin/members/:memberId/photo (variant)", () => {
  let env: InMemoryD1;
  let r2: FakeR2Bucket;
  beforeEach(async () => {
    env = await setupD1();
    r2 = new FakeR2Bucket();
    presignMock.mockReset();
  }, 30000);

  it("ROUTE-V-12: display+thumb 保存後 DELETE → 両 key 削除・D1 行削除", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", {
      display: fileOf(1024, "image/jpeg"),
      thumb: fileOf(2048, "image/webp"),
    });
    const res = await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(false);
    expect(r2.has("members/m_001/thumb")).toBe(false);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });

  it("ROUTE-V-13: thumb 不在・display のみ DELETE → 200・avatar 削除・例外なし", async () => {
    await seedMember(env, "m_001");
    await postVariants(env, r2, "m_001", { display: fileOf(1024, "image/jpeg") });
    const res = await createAdminMembersRoute().request(
      `/members/m_001/photo`,
      { method: "DELETE", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env, r2),
    );
    expect(res.status).toBe(200);
    expect(r2.has("members/m_001/avatar")).toBe(false);
    expect(await countPhotoRows(env, "m_001")).toBe(0);
  });
});
