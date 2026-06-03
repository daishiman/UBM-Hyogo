// issue-983 Phase 4/6: Avatar の src 対応 / MemberAvatar の photoUrl 対応 render テスト。
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Avatar } from "../../../../../components/ui/Avatar";
import { MemberAvatar } from "../MemberAvatar";

afterEach(() => {
  cleanup();
});

describe("Avatar src 対応", () => {
  it("AVATAR-R-1: src なし → img は描画されず role=img の div のみ", () => {
    render(<Avatar name="田中" size="md" />);
    expect(screen.getByRole("img")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("AVATAR-R-2: src あり → img が alt=name で描画される", () => {
    render(<Avatar name="田中" src="https://r2.test/photo.jpg" size="md" />);
    const img = document.querySelector("img") as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img!.alt).toBe("田中");
  });

  it("AVATAR-R-3: src あり onError → img が消え hue placeholder に fallback", () => {
    render(<Avatar name="田中" src="https://r2.test/photo.jpg" size="md" />);
    const img = document.querySelector("img") as HTMLImageElement;
    fireEvent.error(img);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("AVATAR-R-4: src なし → data-hue が数値・data-size=md（AC-4 DOM 互換）", () => {
    render(<Avatar name="田中" size="md" />);
    const div = screen.getByRole("img");
    expect(div.getAttribute("data-size")).toBe("md");
    const hue = div.getAttribute("data-hue");
    expect(hue).not.toBeNull();
    expect(Number.isNaN(Number(hue))).toBe(false);
  });

  it("AVATAR-E-1: src あり → data-hue 属性が維持される", () => {
    render(<Avatar name="田中" src="https://r2.test/p.jpg" size="md" />);
    // 写真有時は wrapper div と <img> の両方が role=img のため wrapper を class で取得する。
    const div = document.querySelector(".ui-avatar") as HTMLElement;
    expect(div.getAttribute("data-hue")).not.toBeNull();
  });

  it("AVATAR-E-2: src onError 後 → fallback div に data-size が維持される", () => {
    render(<Avatar name="田中" src="https://r2.test/p.jpg" size="md" />);
    fireEvent.error(document.querySelector("img") as HTMLImageElement);
    expect(screen.getByRole("img").getAttribute("data-size")).toBe("md");
  });
});

describe("MemberAvatar photoUrl 対応", () => {
  it("AVATAR-R-5: photoUrl なし → hue placeholder（img なし）", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" />);
    expect(screen.getByRole("img")).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("AVATAR-R-6: photoUrl あり → img が描画される", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" photoUrl="https://r2.test/p.jpg" />);
    expect(document.querySelector("img")).not.toBeNull();
  });

  it("AVATAR-E-3: photoUrl なし → img が DOM に存在しない", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" />);
    expect(document.querySelector("img")).toBeNull();
  });

  it("AVATAR-E-4: size=lg が data-size=lg に反映される", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" size="lg" />);
    expect(screen.getByRole("img").getAttribute("data-size")).toBe("lg");
  });
});

describe("MemberAvatar photoThumbUrl 対応（issue-1030）", () => {
  const display = "https://r2.test/display.webp";
  const thumb = "https://r2.test/thumb.webp";

  it("AVATAR-V-1: size=sm + 双方有 → thumb を使用", () => {
    render(
      <MemberAvatar memberId="m_001" fullName="田中" photoUrl={display} photoThumbUrl={thumb} size="sm" />,
    );
    expect((document.querySelector("img") as HTMLImageElement).src).toBe(thumb);
  });

  it("AVATAR-V-2: size=md + 双方有 → thumb を使用", () => {
    render(
      <MemberAvatar memberId="m_001" fullName="田中" photoUrl={display} photoThumbUrl={thumb} size="md" />,
    );
    expect((document.querySelector("img") as HTMLImageElement).src).toBe(thumb);
  });

  it("AVATAR-V-3: size=lg + 双方有 → display を使用", () => {
    render(
      <MemberAvatar memberId="m_001" fullName="田中" photoUrl={display} photoThumbUrl={thumb} size="lg" />,
    );
    expect((document.querySelector("img") as HTMLImageElement).src).toBe(display);
  });

  it("AVATAR-V-4: size=sm + thumb undefined → display へ fallback", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" photoUrl={display} size="sm" />);
    expect((document.querySelector("img") as HTMLImageElement).src).toBe(display);
  });

  it("AVATAR-V-5: 双方なし（sm）→ img なし・hue placeholder", () => {
    render(<MemberAvatar memberId="m_001" fullName="田中" size="sm" />);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img")).toBeTruthy();
  });

  it("AVATAR-V-6: sm + thumb 有で onError → img 消え hue placeholder", () => {
    render(
      <MemberAvatar memberId="m_001" fullName="田中" photoUrl={display} photoThumbUrl={thumb} size="sm" />,
    );
    fireEvent.error(document.querySelector("img") as HTMLImageElement);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img")).toBeTruthy();
  });
});
