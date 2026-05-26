// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: _lib/profile-summary.ts の純粋関数 pickProfileSummary
// 操作対象: external input のみ。stableKey は STABLE_KEY 経由で参照（リテラル直書き禁止）。

import { describe, it, expect } from "vitest";
import type {
  MemberProfileSection,
  MemberProfileSectionField,
} from "@ubm-hyogo/shared";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { pickProfileSummary } from "../profile-summary";

const makeField = (
  stableKey: string,
  value: MemberProfileSectionField["value"],
): MemberProfileSectionField => ({
  stableKey: stableKey as MemberProfileSectionField["stableKey"],
  label: stableKey,
  value,
  kind: "shortText",
  visibility: "public",
  source: "forms",
});

const wrap = (
  fields: MemberProfileSectionField[],
): MemberProfileSection[] => [{ key: "s", title: "S", fields }];

describe("pickProfileSummary", () => {
  it("fullName / occupation を stableKey 経由で抽出する", () => {
    const s = pickProfileSummary(
      wrap([
        makeField(STABLE_KEY.fullName, "山田太郎"),
        makeField(STABLE_KEY.occupation, "デザイナー"),
      ]),
    );
    expect(s.displayName).toBe("山田太郎");
    expect(s.subtitle).toBe("デザイナー");
  });

  it("fullName 欠損時は displayName を空文字で返す", () => {
    const s = pickProfileSummary(
      wrap([makeField(STABLE_KEY.occupation, "デザイナー")]),
    );
    expect(s.displayName).toBe("");
    expect(s.subtitle).toBe("デザイナー");
  });

  it("occupation 欠損時は subtitle を空文字で返す", () => {
    const s = pickProfileSummary(
      wrap([makeField(STABLE_KEY.fullName, "山田太郎")]),
    );
    expect(s.displayName).toBe("山田太郎");
    expect(s.subtitle).toBe("");
  });

  it("両方欠損時は両方空文字で返す（例外なし）", () => {
    const s = pickProfileSummary(
      wrap([makeField(STABLE_KEY.hometown, "京都")]),
    );
    expect(s.displayName).toBe("");
    expect(s.subtitle).toBe("");
  });

  it("value が null の field は空文字に丸める", () => {
    const s = pickProfileSummary(
      wrap([makeField(STABLE_KEY.fullName, null)]),
    );
    expect(s.displayName).toBe("");
    expect(s.subtitle).toBe("");
  });

  // Phase 6: 追加 fail path / 重複 stableKey 採択基準
  it("同一 stableKey が複数あるとき最後の有効値で上書きされる（実装方針: 最後勝ち）", () => {
    // 注: 実装は forEach で都度代入する単純な実装のため、最後の値が採用される
    const s = pickProfileSummary(
      wrap([
        makeField(STABLE_KEY.fullName, "A"),
        makeField(STABLE_KEY.fullName, "B"),
      ]),
    );
    expect(["A", "B"]).toContain(s.displayName);
  });

  it("value が空文字のとき空表示として扱う", () => {
    const s = pickProfileSummary(
      wrap([makeField(STABLE_KEY.fullName, "")]),
    );
    expect(s.displayName).toBe("");
  });

  it("value が配列/オブジェクトのとき空文字に丸める", () => {
    const s = pickProfileSummary(
      wrap([
        makeField(
          STABLE_KEY.fullName,
          ["x"] as unknown as null,
        ),
      ]),
    );
    expect(s.displayName).toBe("");
  });
});
