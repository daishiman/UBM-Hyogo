import { describe, expect, it } from "vitest";

import { mapProfileSessionErrorToDisplay } from "../session-error-display";

// Phase 6 §6.1 CC-1〜CC-8: /me 取得失敗 error code → 表示写像（純関数）の網羅。
// page.spec.tsx は UI レンダリング経由で主要分岐を間接カバーするが、本 spec は
// 5xx 全域（下限/中域/上限）・4xx 非410 の境界・防御的既定を純関数レベルで固定し、
// H6（410/5xx/FAILED を一律集約して root cause を隠蔽）の是正を root cause 区別として保証する。
describe("mapProfileSessionErrorToDisplay", () => {
  it("CC-1: MEMBER_SESSION_410 を deleted-member 区別（再ログインでなく管理者確認導線）に写像する", () => {
    const display = mapProfileSessionErrorToDisplay("MEMBER_SESSION_410");

    expect(display.dataCause).toBe("session-410");
    expect(display.retryHref).toBe("/profile");
    expect(display.actionHref).toBeUndefined();
    expect(display.detail).toContain("アカウントの利用状態を確認できませんでした。");
  });

  it("CC-2: MEMBER_SESSION_500（5xx 下限）を server 区別に写像する", () => {
    expect(mapProfileSessionErrorToDisplay("MEMBER_SESSION_500").dataCause).toBe(
      "session-5xx",
    );
  });

  it("CC-3: MEMBER_SESSION_503（5xx 中域）を server 区別に写像する", () => {
    const display = mapProfileSessionErrorToDisplay("MEMBER_SESSION_503");

    expect(display.dataCause).toBe("session-5xx");
    expect(display.retryHref).toBe("/profile");
    expect(display.detail).toContain("サーバー側でセッション確認に失敗しました。");
  });

  it("CC-4: MEMBER_SESSION_599（5xx 上限・境界）を server 区別に写像する", () => {
    expect(mapProfileSessionErrorToDisplay("MEMBER_SESSION_599").dataCause).toBe(
      "session-5xx",
    );
  });

  it("CC-5: MEMBER_SESSION_FAILED（transport）を session-failed に写像する", () => {
    const display = mapProfileSessionErrorToDisplay("MEMBER_SESSION_FAILED");

    expect(display.dataCause).toBe("session-failed");
    expect(display.detail).toContain("通信経路でセッション確認に失敗しました。");
  });

  it("CC-6: MEMBER_SESSION_UNKNOWN（非 Error / 未知）を既定の session-failed に写像する", () => {
    expect(
      mapProfileSessionErrorToDisplay("MEMBER_SESSION_UNKNOWN").dataCause,
    ).toBe("session-failed");
  });

  it("CC-7: MEMBER_SESSION_404 を再ログイン CTA（session-404）に写像する", () => {
    const display = mapProfileSessionErrorToDisplay("MEMBER_SESSION_404");

    expect(display.dataCause).toBe("session-404");
    expect(display.actionHref).toBe("/login?redirect=/profile");
    expect(display.actionLabel).toBe("再ログイン");
    expect(display.retryHref).toBeUndefined();
  });

  it("CC-8: MEMBER_SESSION_400（4xx 非410・非404）を 5xx と取り違えず既定に写像する", () => {
    expect(mapProfileSessionErrorToDisplay("MEMBER_SESSION_400").dataCause).toBe(
      "session-failed",
    );
  });

  it("ユーザー向け detail に生の技術文字列（status 数値 / MEMBER_SESSION code）を露出しない", () => {
    const codes = [
      "MEMBER_SESSION_410",
      "MEMBER_SESSION_503",
      "MEMBER_SESSION_FAILED",
      "MEMBER_SESSION_404",
      "MEMBER_SESSION_400",
    ];

    for (const code of codes) {
      const { detail } = mapProfileSessionErrorToDisplay(code);
      expect(detail).not.toMatch(/MEMBER_SESSION/);
      expect(detail).not.toMatch(/\b\d{3}\b/);
    }
  });
});
