// workflow: mypage-prototype-alignment / Phase 4 RED test
// 対象: VisibilitySummary（ST-2 Stat grid-3）
// 操作対象: external prop（sections）。

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type {
  MemberProfileSection,
  MemberProfileSectionField,
} from "@ubm-hyogo/shared";
import { STABLE_KEY } from "@ubm-hyogo/shared";

import { VisibilitySummary } from "../VisibilitySummary";

afterEach(() => cleanup());

const makeField = (
  stableKey: string,
  visibility: MemberProfileSectionField["visibility"],
): MemberProfileSectionField => ({
  stableKey: stableKey as MemberProfileSectionField["stableKey"],
  label: stableKey,
  value: "x",
  kind: "shortText",
  visibility,
  source: "forms",
});

describe("VisibilitySummary", () => {
  it("public/member/admin の件数を 3 枚の Stat で表示する", () => {
    const sections: MemberProfileSection[] = [
      {
        key: "s",
        title: "S",
        fields: [
          makeField(STABLE_KEY.fullName, "public"),
          makeField(STABLE_KEY.nickname, "public"),
          makeField(STABLE_KEY.location, "public"),
          makeField(STABLE_KEY.occupation, "member"),
          makeField(STABLE_KEY.hometown, "member"),
          makeField(STABLE_KEY.publicConsent, "admin"),
        ],
      },
    ];
    render(<VisibilitySummary sections={sections} />);
    expect(screen.getByText("PUBLIC")).toBeTruthy();
    expect(screen.getByText("MEMBERS")).toBeTruthy();
    expect(screen.getByText("PRIVATE")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("空 sections のとき全件 0 を表示する", () => {
    expect(() =>
      render(<VisibilitySummary sections={[]} />),
    ).not.toThrow();
    expect(screen.getAllByText("0")).toHaveLength(3);
  });

  // Phase 6: 未知 visibility は加算されない
  it("未知 visibility は件数に加算されない", () => {
    const sections: MemberProfileSection[] = [
      {
        key: "s",
        title: "S",
        fields: [
          makeField(STABLE_KEY.fullName, "public"),
          makeField(STABLE_KEY.nickname, "public"),
          makeField(
            STABLE_KEY.location,
            "secret" as MemberProfileSectionField["visibility"],
          ),
          makeField(
            STABLE_KEY.occupation,
            "secret" as MemberProfileSectionField["visibility"],
          ),
          makeField(
            STABLE_KEY.hometown,
            "secret" as MemberProfileSectionField["visibility"],
          ),
        ],
      },
    ];
    expect(() =>
      render(<VisibilitySummary sections={sections} />),
    ).not.toThrow();
    expect(screen.getByText("2")).toBeTruthy();
    // MEMBERS=0, PRIVATE=0
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
