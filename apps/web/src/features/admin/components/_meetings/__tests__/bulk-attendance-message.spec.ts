import { describe, expect, it } from "vitest";
import { bulkFailureMessage } from "../bulk-attendance-message";

describe("bulkFailureMessage", () => {
  it("業務失敗の内訳を表示する", () => {
    expect(
      bulkFailureMessage({
        total: 4,
        ok: 1,
        duplicate: 2,
        deletedMember: 1,
        unknownMember: 0,
        invalid: 0,
      }),
    ).toBe("一括追加できませんでした（出席済 2 / 削除済 1）");
  });
});
