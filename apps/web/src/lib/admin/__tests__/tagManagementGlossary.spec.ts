import { describe, expect, it } from "vitest";

import {
  getTagTerm,
  TAG_MANAGEMENT_COPY,
  TAG_MANAGEMENT_GLOSSARY,
} from "../tagManagementGlossary";

describe("tagManagementGlossary", () => {
  it("タグ管理の必須キーをすべて持つ", () => {
    expect(TAG_MANAGEMENT_GLOSSARY.map((term) => term.key)).toEqual([
      "tag-definition",
      "tag-assignment",
      "tag-code",
      "tag-label",
      "tag-category",
      "tag-suggestion",
      "tag-unresolved",
      "tag-resolve",
    ]);
  });

  it("key から用語を引け、未登録 key は undefined を返す", () => {
    expect(getTagTerm("tag-code")).toMatchObject({
      label: "コード",
      description: expect.stringContaining("自動生成"),
    });
    expect(getTagTerm("missing")).toBeUndefined();
  });

  it("画面文言を用語集SSOT側で管理する", () => {
    expect(TAG_MANAGEMENT_COPY.createFormDescription).toContain("会員ディレクトリ");
    expect(TAG_MANAGEMENT_COPY.assignmentHeaderDescription).toContain("メンバーに割り当てます");
    expect(TAG_MANAGEMENT_COPY.definitionGuideBody).toContain("タグ割当画面");
    expect(TAG_MANAGEMENT_COPY.assignmentGuideBody).toContain("タグ定義");
  });
});
