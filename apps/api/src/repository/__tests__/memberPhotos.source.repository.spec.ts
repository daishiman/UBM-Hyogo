// @vitest-environment node
// issue-1031 Phase 4/6: migration 0023 の source 列 roundtrip / DEFAULT backfill / 正規化 を検証。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  upsertMemberPhoto,
  getMemberPhoto,
  deleteMemberPhoto,
} from "../memberPhotos";
import { asMemberId } from "../_shared/brand";

describe("memberPhotos source roundtrip（migration 0023）", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  const mid = (s: string) => asMemberId(s);

  // issue-1030: thumb 系 variant 列は本 source テストの対象外。
  //   merge 後 MemberPhotoRow は thumb 系も必須のため、型を満たす null 既定をここで補う。
  const VARIANT_DEFAULTS = {
    thumbObjectKey: null,
    thumbByteSize: null,
    contentHash: null,
    processingStatus: "original_fallback",
  } as const;

  it("REPO-SRC-1: source='self' roundtrip", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_001",
      objectKey: "members/m_001/avatar",
      contentType: "image/jpeg",
      byteSize: 1024,
      uploadedBy: "member@example.com",
      source: "self",
    });
    const row = await getMemberPhoto(env.ctx, mid("m_001"));
    expect(row?.source).toBe("self");
  });

  it("REPO-SRC-2: source='admin' roundtrip", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_002",
      objectKey: "members/m_002/avatar",
      contentType: "image/png",
      byteSize: 2048,
      uploadedBy: "admin@example.com",
      source: "admin",
    });
    const row = await getMemberPhoto(env.ctx, mid("m_002"));
    expect(row?.source).toBe("admin");
  });

  it("REPO-SRC-3: 旧 0022 列構成での INSERT は DEFAULT 'admin' で backfill される", async () => {
    // 0023 適用済み環境で「source を指定しない」旧来 INSERT を直接実行（DEFAULT 動作確認）。
    await env.db
      .prepare(
        `INSERT INTO member_photos
         (member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`,
      )
      .bind("m_003", "members/m_003/avatar", "image/jpeg", 512, "legacy@example.com")
      .run();
    const row = await getMemberPhoto(env.ctx, mid("m_003"));
    expect(row?.source).toBe("admin");
  });

  it("REPO-SRC-4: 0023 の DDL shape（source TEXT NOT NULL DEFAULT 'admin'）", async () => {
    const info = await env.db
      .prepare(`PRAGMA table_info(member_photos)`)
      .all<{
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
      }>();
    const sourceCol = (info.results ?? []).find((c) => c.name === "source");
    expect(sourceCol).toBeTruthy();
    expect(sourceCol?.type).toBe("TEXT");
    expect(sourceCol?.notnull).toBe(1);
    // DEFAULT は SQLite が "'admin'"（クォート込み）で返す。
    expect(sourceCol?.dflt_value).toBe("'admin'");
  });

  it("REPO-SRC-5: DB に未知の source（legacy）が入っても getMemberPhoto は 'admin' に正規化", async () => {
    await env.db
      .prepare(
        `INSERT INTO member_photos
         (member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`,
      )
      .bind("m_004", "members/m_004/avatar", "image/jpeg", 256, "x@example.com", "legacy")
      .run();
    const row = await getMemberPhoto(env.ctx, mid("m_004"));
    expect(row?.source).toBe("admin");
  });

  it("REPO-SRC-6: self upsert → admin upsert で上書きすると source='admin' になる", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_005",
      objectKey: "members/m_005/avatar",
      contentType: "image/jpeg",
      byteSize: 100,
      uploadedBy: "member@example.com",
      source: "self",
    });
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_005",
      objectKey: "members/m_005/avatar",
      contentType: "image/png",
      byteSize: 200,
      uploadedBy: "admin@example.com",
      source: "admin",
    });
    const row = await getMemberPhoto(env.ctx, mid("m_005"));
    expect(row?.source).toBe("admin");
  });

  it("REPO-SRC-7: delete 後は getMemberPhoto が null", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_006",
      objectKey: "members/m_006/avatar",
      contentType: "image/jpeg",
      byteSize: 64,
      uploadedBy: "member@example.com",
      source: "self",
    });
    await deleteMemberPhoto(env.ctx, mid("m_006"));
    const row = await getMemberPhoto(env.ctx, mid("m_006"));
    expect(row).toBeNull();
  });

  it("REPO-SRC-8: admin → self upsert（last-write-wins）で source='self'", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_007",
      objectKey: "members/m_007/avatar",
      contentType: "image/png",
      byteSize: 300,
      uploadedBy: "admin@example.com",
      source: "admin",
    });
    await upsertMemberPhoto(env.ctx, {
      ...VARIANT_DEFAULTS,
      memberId: "m_007",
      objectKey: "members/m_007/avatar",
      contentType: "image/webp",
      byteSize: 400,
      uploadedBy: "member@example.com",
      source: "self",
    });
    const row = await getMemberPhoto(env.ctx, mid("m_007"));
    expect(row?.source).toBe("self");
  });
});
