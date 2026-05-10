// 08a AC-4: ResponseId と MemberId の混同を type レベルで防ぐ
// repository/__tests__/brand.test.ts の補完として、関数引数（MemberId を受ける関数）に
// ResponseId を渡そうとすると @ts-expect-error でブロックされることを集約 verify する。

import { describe, it, expect } from "vitest";
import {
  asMemberId,
  asResponseId,
  type MemberId,
  type ResponseId,
} from "../repository/_shared/brand";

// MemberId のみ受ける純関数。実際のリポジトリ関数の代理。
const acceptsMemberId = (m: MemberId): MemberId => m;
const acceptsResponseId = (r: ResponseId): ResponseId => r;

describe("brand-type: MemberId vs ResponseId（08a AC-4）", () => {
  it("ResponseId を MemberId 引数に渡すと型エラー（@ts-expect-error 行で確認）", () => {
    const r = asResponseId("r_001");
    // @ts-expect-error MemberId 引数に ResponseId は渡せない
    const out = acceptsMemberId(r);
    expect(out).toBe("r_001"); // ランタイム値は素通し
  });

  it("MemberId を ResponseId 引数に渡すと型エラー", () => {
    const m = asMemberId("m_001");
    // @ts-expect-error ResponseId 引数に MemberId は渡せない
    const out = acceptsResponseId(m);
    expect(out).toBe("m_001");
  });

  it("正しい brand 同士は通過する（control case）", () => {
    const m = asMemberId("m_002");
    const r = asResponseId("r_002");
    expect(acceptsMemberId(m)).toBe("m_002");
    expect(acceptsResponseId(r)).toBe("r_002");
  });
});
