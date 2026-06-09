import { describe, expect, it } from "vitest";
import { FetchAuthedError } from "../../../features/admin/hooks/useAdminMutation";
import {
  applyLifecycleSuccess,
  parseTagLifecycleError,
  statusLabel,
  visibleLifecycleOperations,
  type TagDefinitionItem,
} from "../tagCatalogLifecycle";

const tag = (overrides: Partial<TagDefinitionItem> = {}): TagDefinitionItem => ({
  tagId: "tag_1",
  code: "supporter",
  label: "サポーター",
  category: "role",
  active: true,
  ...overrides,
});

describe("tagCatalogLifecycle", () => {
  it("active/inactive の表示操作を分ける", () => {
    expect(statusLabel(true)).toBe("有効");
    expect(statusLabel(false)).toBe("停止中");
    expect(visibleLifecycleOperations(tag({ active: true }))).toEqual([
      "deactivate",
      "physical-delete",
    ]);
    expect(visibleLifecycleOperations(tag({ active: false }))).toEqual([
      "reactivate",
      "physical-delete",
    ]);
  });

  it("reactivate/deactivate/physical-delete 成功を local list に反映する", () => {
    const items = [tag({ tagId: "tag_1" }), tag({ tagId: "tag_2", active: false })];
    expect(applyLifecycleSuccess(items, "tag_1", "deactivate")[0]?.active).toBe(false);
    expect(
      applyLifecycleSuccess(items, "tag_2", "reactivate", tag({ tagId: "tag_2" }))[1]
        ?.active,
    ).toBe(true);
    expect(applyLifecycleSuccess(items, "tag_1", "physical-delete")).toHaveLength(1);
  });

  it("physical delete 409 referenceCount を管理者向け文言に正規化する", () => {
    const parsed = parseTagLifecycleError(
      new FetchAuthedError(
        409,
        JSON.stringify({ ok: false, error: "tag_has_references", referenceCount: 3 }),
      ),
    );
    expect(parsed).toEqual({
      code: "tag_has_references",
      message: "3人に使用中のため削除不可",
      referenceCount: 3,
    });
  });

  it("tag_not_found と unknown body を個別に扱う", () => {
    expect(
      parseTagLifecycleError(
        new FetchAuthedError(404, JSON.stringify({ ok: false, error: "tag_not_found" })),
      ).message,
    ).toBe("対象タグが見つかりません。画面を更新してください。");
    expect(parseTagLifecycleError(new FetchAuthedError(409, "not-json")).code).toBe(
      "http_409",
    );
  });
});
