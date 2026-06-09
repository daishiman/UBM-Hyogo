import { describe, it, expect } from "vitest";
import { resolveFieldPrecedence } from "./field-precedence";
import type { ResponseFieldRow } from "../../repository/responseFields";
import type { MemberFieldOverrideRow } from "../../repository/memberFieldOverrides";

const field = (
  stableKey: string,
  valueJson: string | null,
): ResponseFieldRow =>
  ({
    response_id: "r1",
    stable_key: stableKey,
    value_json: valueJson,
    raw_value_json: valueJson,
  }) as unknown as ResponseFieldRow;

const override = (
  stableKey: string,
  valueJson: string | null,
): Pick<MemberFieldOverrideRow, "stable_key" | "value_json" | "raw_value_json"> => ({
  stable_key: stableKey,
  value_json: valueJson,
  raw_value_json: valueJson,
});

describe("resolveFieldPrecedence", () => {
  it("override が無いフィールドは response 値・source=forms", () => {
    const out = resolveFieldPrecedence([field("fullName", '"Alice"')], []);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      stable_key: "fullName",
      value_json: '"Alice"',
      source: "forms",
    });
  });

  it("override が L1 として response 値より優先される（DEC-4）", () => {
    const out = resolveFieldPrecedence(
      [field("fullName", '"Form Name"')],
      [override("fullName", '"Admin Name"')],
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      stable_key: "fullName",
      value_json: '"Admin Name"',
      source: "admin",
    });
  });

  it("override にしか無いフィールドも結果へ含む", () => {
    const out = resolveFieldPrecedence([], [override("nickname", '"Nick"')]);
    expect(out).toEqual([
      expect.objectContaining({
        stable_key: "nickname",
        value_json: '"Nick"',
        source: "admin",
      }),
    ]);
  });

  it("value_json=null の override（明示クリア）も override 値として勝つ", () => {
    const out = resolveFieldPrecedence(
      [field("occupation", '"Engineer"')],
      [override("occupation", null)],
    );
    expect(out[0]).toMatchObject({
      stable_key: "occupation",
      value_json: null,
      source: "admin",
    });
  });

  it("複数フィールドは stable_key 昇順で安定ソートされる", () => {
    const out = resolveFieldPrecedence(
      [field("zebra", '"z"'), field("alpha", '"a"')],
      [override("mango", '"m"')],
    );
    expect(out.map((f) => f.stable_key)).toEqual(["alpha", "mango", "zebra"]);
  });

  it("空入力は空配列", () => {
    expect(resolveFieldPrecedence([], [])).toEqual([]);
  });
});
