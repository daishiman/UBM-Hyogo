// admin-members-timestamp-jst-and-identity-label-clarity (T5):
// DIAGNOSTICS の日本語ラベル主・英語キー併記・真偽値日本語化を検証（AC-5/6/8）。
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { MemberDiagnosis } from "../../../diagnostics/types";

const fetchMemberDiagnosisMock =
  vi.fn<(memberId: string) => Promise<MemberDiagnosis>>();
vi.mock("../../../diagnostics/api", () => ({
  fetchMemberDiagnosis: (memberId: string) => fetchMemberDiagnosisMock(memberId),
}));

import { MemberDiagnosticsPanel } from "../MemberDiagnosticsPanel";

const mkDiagnosis = (
  overrides: Partial<MemberDiagnosis> = {},
): MemberDiagnosis => ({
  capturedAt: "2026-06-09T10:34:19.000Z",
  memberId: "m1",
  identityMatches: {
    byEmail: true,
    byExternalId: false,
    matchedFormResponseId: "res-1",
  },
  responseFieldCount: 28,
  expectedFieldCount: 31,
  missingFieldKeys: [],
  consent: { publicConsent: true, rulesConsent: true },
  publishState: { published: true, visibleOnPublicDirectory: true },
  hypothesisFlags: {
    H2_identityMissing: false,
    H3_hiddenByConsentOrPublish: false,
    H4_missingFieldsNonEmpty: false,
  },
  ...overrides,
});

afterEach(() => {
  cleanup();
  fetchMemberDiagnosisMock.mockReset();
});

describe("MemberDiagnosticsPanel — 日本語ラベル化", () => {
  it("AC-8: 見出しが「診断情報」で表示される", async () => {
    fetchMemberDiagnosisMock.mockResolvedValue(mkDiagnosis());
    render(<MemberDiagnosticsPanel memberId="m1" />);
    expect(await screen.findByText("診断情報")).toBeDefined();
  });

  it("AC-5: 各項目が日本語ラベル主・英語キー併記で表示される", async () => {
    fetchMemberDiagnosisMock.mockResolvedValue(mkDiagnosis());
    render(<MemberDiagnosticsPanel memberId="m1" />);
    expect(await screen.findByText("照合できたフォーム回答")).toBeDefined();
    expect(screen.getByText("取得できた項目数")).toBeDefined();
    expect(screen.getByText("公開ディレクトリに表示")).toBeDefined();
    // 英語キー併記（AC-11: DOM に残す）
    expect(screen.getByText("matched response")).toBeDefined();
    expect(screen.getByText("public visible")).toBeDefined();
  });

  it("AC-6: 真偽値が「はい/いいえ」で表示され、yes/no は残らない", async () => {
    fetchMemberDiagnosisMock.mockResolvedValue(
      mkDiagnosis({
        publishState: { published: false, visibleOnPublicDirectory: false },
        hypothesisFlags: {
          H2_identityMissing: false,
          H3_hiddenByConsentOrPublish: true,
          H4_missingFieldsNonEmpty: false,
        },
      }),
    );
    render(<MemberDiagnosticsPanel memberId="m1" />);
    await screen.findByText("診断情報");
    // public visible=false → いいえ, H3=true → はい, H4=false → いいえ
    // （「いいえ」は publicVisible と H4 の 2 箇所に出るため getAllByText で検証）
    expect(screen.getAllByText("はい").length).toBe(1);
    expect(screen.getAllByText("いいえ").length).toBe(2);
    expect(screen.queryByText("yes")).toBeNull();
    expect(screen.queryByText("no")).toBeNull();
  });
});
