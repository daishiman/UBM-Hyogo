import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { ProfileHero } from "../ProfileHero";

afterEach(() => cleanup());

const baseProps = {
  memberId: "mem-001",
  fullName: "山田 太郎",
  nickname: "taro",
  occupation: "エンジニア",
  location: "兵庫県神戸市",
  ubmZone: "Kobe",
  ubmMembershipType: "regular",
};

describe("ProfileHero", () => {
  it("renders all fields and badges when zone and membershipType present (happy)", () => {
    const { container } = render(<ProfileHero {...baseProps} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      baseProps.fullName,
    );
    expect(
      container.querySelector('[data-role="nickname"]')?.textContent,
    ).toBe(`@${baseProps.nickname}`);
    expect(
      container.querySelector('[data-role="occupation"]')?.textContent,
    ).toBe(baseProps.occupation);
    expect(
      container.querySelector('[data-role="location"]')?.textContent,
    ).toBe(baseProps.location);
    expect(
      container.querySelector('[data-key="zone"]')?.textContent,
    ).toBe(baseProps.ubmZone);
    expect(
      container.querySelector('[data-key="status"]')?.textContent,
    ).toBe(baseProps.ubmMembershipType);
    expect(screen.getByRole("img", { name: baseProps.fullName })).toBeTruthy();
  });

  it("renders empty badges container when zone and membershipType are null (empty)", () => {
    const { container } = render(
      <ProfileHero
        {...baseProps}
        ubmZone={null}
        ubmMembershipType={null}
      />,
    );
    const badges = container.querySelector('[data-role="badges"]');
    expect(badges).not.toBeNull();
    expect(badges?.childElementCount).toBe(0);
  });

  it("omits nickname row when nickname is empty string (variant)", () => {
    const { container } = render(
      <ProfileHero {...baseProps} nickname="" />,
    );
    expect(container.querySelector('[data-role="nickname"]')).toBeNull();
  });

  // --- issue-1029 lane F: photoUrl → <Avatar src> 配線 ---

  it("F-1: photoUrl 有で img src が photoUrl と一致", () => {
    const photo = "https://r2/p?s=x";
    const { container } = render(<ProfileHero {...baseProps} photoUrl={photo} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(photo);
  });

  it("F-2: photoUrl 無で img なし（hue placeholder へ fallback）", () => {
    const { container } = render(<ProfileHero {...baseProps} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
