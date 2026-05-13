import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberDetailSections } from "../MemberDetailSections";

afterEach(() => cleanup());

type Section = Parameters<typeof MemberDetailSections>[0]["sections"][number];

function makeSection(over: Partial<Section> = {}): Section {
  return {
    key: "basic",
    title: "基本情報",
    fields: [
      {
        stableKey: "basic:fullName",
        label: "氏名",
        value: "山田 太郎",
        kind: "shortText",
        visibility: "public",
        source: "forms",
      },
      {
        stableKey: "basic:tags",
        label: "タグ",
        value: ["a", "b"],
        kind: "checkbox",
        visibility: "public",
        source: "forms",
      },
    ],
    ...over,
  } as Section;
}

describe("MemberDetailSections", () => {
  it("renders section heading and rows for visible fields (TC-U-01)", () => {
    const { container } = render(
      <MemberDetailSections sections={[makeSection()]} />,
    );
    expect(container.querySelector("h2")?.textContent).toBe("基本情報");
    expect(container.querySelector('[data-section="basic"]')).toBeTruthy();
  });

  it("focuses data-stable-key on every kv-row (TC-U-02 — invariants #1)", () => {
    const { container } = render(
      <MemberDetailSections sections={[makeSection()]} />,
    );
    const rows = container.querySelectorAll(".kv-row");
    const stableRows = container.querySelectorAll("[data-stable-key]");
    expect(rows.length).toBe(2);
    expect(stableRows.length).toBe(rows.length);
  });

  it("excludes url kind from KVList (TC-U-03)", () => {
    const sec = makeSection({
      fields: [
        {
          stableKey: "links:site",
          label: "サイト",
          value: "https://example.com",
          kind: "url",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: "basic:fullName",
          label: "氏名",
          value: "テスト",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
      ],
    });
    const { container } = render(<MemberDetailSections sections={[sec]} />);
    expect(container.querySelectorAll(".kv-row").length).toBe(1);
    expect(
      container.querySelector('[data-stable-key="basic:fullName"]'),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-stable-key="links:site"]'),
    ).toBeFalsy();
  });

  it("renders array as comma-joined and null/empty as em-dash (TC-U-04)", () => {
    const sec = makeSection({
      fields: [
        {
          stableKey: "k:arr",
          label: "配列",
          value: ["x", "y"],
          kind: "checkbox",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: "k:empty",
          label: "空",
          value: "",
          kind: "shortText",
          visibility: "public",
          source: "forms",
        },
      ],
    });
    const { container } = render(<MemberDetailSections sections={[sec]} />);
    const values = Array.from(container.querySelectorAll(".kv-value")).map(
      (n) => n.textContent,
    );
    expect(values).toContain("x, y");
    expect(values).toContain("—");
  });

  it("hides section when no visible fields remain", () => {
    const sec = makeSection({
      fields: [
        {
          stableKey: "links:only",
          label: "サイト",
          value: "https://x",
          kind: "url",
          visibility: "public",
          source: "forms",
        },
      ],
    });
    const { container } = render(<MemberDetailSections sections={[sec]} />);
    expect(container.querySelector('[data-section="basic"]')).toBeFalsy();
  });
});
