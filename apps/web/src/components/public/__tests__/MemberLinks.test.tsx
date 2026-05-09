import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MemberLinks } from "../MemberLinks";

afterEach(() => cleanup());

type Section = Parameters<typeof MemberLinks>[0]["sections"][number];

function section(fields: Section["fields"]): Section {
  return { key: "basic", title: "基本情報", fields };
}

describe("MemberLinks", () => {
  it("extracts only url kind fields (TC-U-05)", () => {
    const sec = section([
      {
        stableKey: "k:site",
        label: "サイト",
        value: "https://example.com",
        kind: "url",
        visibility: "public",
        source: "forms",
      },
      {
        stableKey: "k:fullName",
        label: "氏名",
        value: "山田",
        kind: "shortText",
        visibility: "public",
        source: "forms",
      },
    ]);
    const { container } = render(<MemberLinks sections={[sec]} />);
    expect(container.querySelectorAll("a").length).toBe(1);
    expect(
      container.querySelector('[data-stable-key="k:site"]'),
    ).toBeTruthy();
  });

  it("returns null when no links exist (TC-U-06)", () => {
    const sec = section([
      {
        stableKey: "k:fullName",
        label: "氏名",
        value: "山田",
        kind: "shortText",
        visibility: "public",
        source: "forms",
      },
    ]);
    const { container } = render(<MemberLinks sections={[sec]} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses target=_blank rel=noopener noreferrer (TC-U-07)", () => {
    const sec = section([
      {
        stableKey: "k:site",
        label: "Site",
        value: "https://example.com",
        kind: "url",
        visibility: "public",
        source: "forms",
      },
    ]);
    const { container } = render(<MemberLinks sections={[sec]} />);
    const a = container.querySelector("a");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toContain("noopener");
    expect(a?.getAttribute("rel")).toContain("noreferrer");
  });
});
