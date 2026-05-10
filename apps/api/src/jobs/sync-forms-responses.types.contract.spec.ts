// 03b: AC-7 / T-U-11 type-level test
// `tsc --noEmit` で MemberId と ResponseId の混同を拒否する。
// `@ts-expect-error` ディレクティブが解除される（= 代入が成功する）と
// tsc 自体が fail する。

import { describe, expect, it } from "vitest";
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";
import type { MemberId, ResponseId } from "@ubm-hyogo/shared";

describe("brand 型: MemberId と ResponseId は混同されない (AC-7)", () => {
  it("compiles (run-time は素通し、型のみ assert)", () => {
    const m: MemberId = asMemberId("m-1");
    const r: ResponseId = asResponseId("r-1");
    // @ts-expect-error: ResponseId is not assignable to MemberId
    const _bad1: MemberId = r;
    // @ts-expect-error: MemberId is not assignable to ResponseId
    const _bad2: ResponseId = m;
    expect(typeof m).toBe("string");
    expect(typeof r).toBe("string");
    void _bad1;
    void _bad2;
  });
});
