// @vitest-environment node
// issue-1030 Phase 4/6: member_photos の variant 列 round-trip テスト。
// migration 0023 で ADD COLUMN した thumb/hash/status の snake_case↔camelCase 写像を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  getMemberPhoto,
  upsertMemberPhoto,
  type MemberPhotoRow,
} from "../memberPhotos";
import { asMemberId } from "@ubm-hyogo/shared";

const HEX64 = "a".repeat(64);

const baseRow = (memberId: string): Omit<MemberPhotoRow, "uploadedAt"> => ({
  memberId,
  objectKey: `members/${memberId}/avatar`,
  contentType: "image/webp",
  byteSize: 4096,
  thumbObjectKey: null,
  thumbByteSize: null,
  contentHash: null,
  processingStatus: "original_fallback",
  uploadedBy: "admin@example.com",
  // issue-1031: source 列追加後の round-trip 既定。admin 代行を既定値とする。
  source: "admin",
});

// snake_case 列を直読みして camelCase マッピングと突合するためのヘルパ。
const rawRow = async (env: InMemoryD1, memberId: string) =>
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

const countRows = async (env: InMemoryD1, memberId: string): Promise<number> => {
  const r = await env.db
    .prepare(`SELECT COUNT(*) AS n FROM member_photos WHERE member_id = ?1`)
    .bind(memberId)
    .first<{ n: number }>();
  return r?.n ?? 0;
};

describe("memberPhotos repository (variant 列)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 60000);

  it("REPO-V-1: thumb 系 4 列込み upsert → camelCase で round-trip", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...baseRow("m1"),
      thumbObjectKey: "members/m1/thumb",
      thumbByteSize: 2048,
      contentHash: HEX64,
      processingStatus: "client_generated",
    });
    const got = await getMemberPhoto(env.ctx, asMemberId("m1"));
    expect(got?.thumbObjectKey).toBe("members/m1/thumb");
    expect(got?.thumbByteSize).toBe(2048);
    expect(got?.contentHash).toBe(HEX64);
    expect(got?.processingStatus).toBe("client_generated");
    // snake_case 列も投入値どおり保存されている。
    const raw = await rawRow(env, "m1");
    expect(raw?.thumb_object_key).toBe("members/m1/thumb");
    expect(raw?.processing_status).toBe("client_generated");
  });

  it("REPO-V-2: thumb なし upsert → thumb 系 3 列 null・status=original_fallback", async () => {
    await upsertMemberPhoto(env.ctx, baseRow("m1"));
    const got = await getMemberPhoto(env.ctx, asMemberId("m1"));
    expect(got?.thumbObjectKey).toBeNull();
    expect(got?.thumbByteSize).toBeNull();
    expect(got?.contentHash).toBeNull();
    expect(got?.processingStatus).toBe("original_fallback");
  });

  it("REPO-V-3: 後方互換 — 旧列のみ INSERT した行も例外なく取得（thumb null / status=none）", async () => {
    // 0022 までの列のみで直接 INSERT（0023 の DEFAULT 'none' / NULL が適用される）。
    await env.db
      .prepare(
        `INSERT INTO member_photos
          (member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`,
      )
      .bind("m_legacy", "members/m_legacy/avatar", "image/jpeg", 12345, "old@example.com")
      .run();
    const got = await getMemberPhoto(env.ctx, asMemberId("m_legacy"));
    expect(got).not.toBeNull();
    expect(got?.objectKey).toBe("members/m_legacy/avatar");
    expect(got?.contentType).toBe("image/jpeg");
    expect(got?.byteSize).toBe(12345);
    expect(got?.thumbObjectKey).toBeNull();
    expect(got?.processingStatus).toBe("none");
  });

  it("REPO-V-4: 2 回 upsert（thumb 有 → thumb なし）で後勝ち・行数 1", async () => {
    await upsertMemberPhoto(env.ctx, {
      ...baseRow("m1"),
      thumbObjectKey: "members/m1/thumb",
      thumbByteSize: 2048,
      contentHash: HEX64,
      processingStatus: "client_generated",
    });
    await upsertMemberPhoto(env.ctx, baseRow("m1"));
    const got = await getMemberPhoto(env.ctx, asMemberId("m1"));
    expect(got?.processingStatus).toBe("original_fallback");
    expect(got?.thumbObjectKey).toBeNull();
    expect(await countRows(env, "m1")).toBe(1);
  });

  it("REPO-V-5: 不在 member → null（既存挙動不変）", async () => {
    const got = await getMemberPhoto(env.ctx, asMemberId("m_missing"));
    expect(got).toBeNull();
  });
});
