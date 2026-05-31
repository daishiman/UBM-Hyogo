// @vitest-environment node
// issue-983 Phase 4/6: R2 presigned GET URL ユーティリティの unit テスト。
import { describe, it, expect, vi, afterEach } from "vitest";
import { AwsClient } from "aws4fetch";
import {
  presignMemberPhotoGetUrl,
  MEMBER_PHOTO_OBJECT_KEY,
  MEMBER_PHOTO_MAX_BYTES,
  MEMBER_PHOTO_ALLOWED_MIME,
} from "../member-photo-presign";

const VALID_DEPS = {
  accountId: "acc123",
  accessKeyId: "AKID",
  secretAccessKey: "SECRET",
  bucket: "ubm-hyogo-member-photos-staging",
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("presignMemberPhotoGetUrl", () => {
  it("PRESIGN-U-1: 正常系 — URL が r2.cloudflarestorage.com で始まる", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    expect(url).not.toBeNull();
    expect(url).toContain("acc123.r2.cloudflarestorage.com");
  });

  it("PRESIGN-U-2: X-Amz-Expires=300 を含む", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
  });

  it("PRESIGN-U-3: X-Amz-Signature クエリが truthy", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("X-Amz-Signature")).toBeTruthy();
  });

  it("PRESIGN-U-4: objectKey の空白が URL エンコードされる", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m 1/avatar", 300);
    const parsed = new URL(url!);
    expect(parsed.pathname).toContain("%20");
  });

  it("PRESIGN-U-5: accountId が空文字なら null", async () => {
    const url = await presignMemberPhotoGetUrl(
      { ...VALID_DEPS, accountId: "" },
      "members/m_001/avatar",
      300,
    );
    expect(url).toBeNull();
  });

  it("PRESIGN-U-6: accessKeyId が空文字なら null", async () => {
    const url = await presignMemberPhotoGetUrl(
      { ...VALID_DEPS, accessKeyId: "" },
      "members/m_001/avatar",
      300,
    );
    expect(url).toBeNull();
  });

  it("PRESIGN-U-7: aws4fetch.sign が throw しても null（fail-soft, 例外を伝播しない）", async () => {
    const spy = vi
      .spyOn(AwsClient.prototype, "sign")
      .mockRejectedValueOnce(new Error("sign error"));
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 300);
    expect(url).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it("PRESIGN-U-8: TTL 0 なら null（境界バリデーション）", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", 0);
    expect(url).toBeNull();
  });

  // --- Phase 6 拡充 ---
  it("PRESIGN-E-1: 不正 deps でも例外が上位に伝播しない", async () => {
    await expect(
      presignMemberPhotoGetUrl({ ...VALID_DEPS, accountId: "" }, "members/m_001/avatar", 300),
    ).resolves.toBeNull();
  });

  it("PRESIGN-E-2: TTL 負数なら null", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "members/m_001/avatar", -1);
    expect(url).toBeNull();
  });

  it("PRESIGN-E-3: objectKey が空文字なら null（境界）", async () => {
    const url = await presignMemberPhotoGetUrl(VALID_DEPS, "", 300);
    expect(url).toBeNull();
  });
});

describe("MEMBER_PHOTO constants", () => {
  it("MEMBER_PHOTO_OBJECT_KEY が members/{id}/avatar を生成する", () => {
    expect(MEMBER_PHOTO_OBJECT_KEY("m_001")).toBe("members/m_001/avatar");
  });

  it("MEMBER_PHOTO_MAX_BYTES は 262144（256KB）", () => {
    expect(MEMBER_PHOTO_MAX_BYTES).toBe(256 * 1024);
  });

  it("MEMBER_PHOTO_ALLOWED_MIME は jpeg/png/webp の 3 種", () => {
    expect([...MEMBER_PHOTO_ALLOWED_MIME]).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });
});
