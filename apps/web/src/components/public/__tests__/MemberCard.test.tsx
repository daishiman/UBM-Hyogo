import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { MemberCard } from "../MemberCard";
import { buildMember } from "../../../test-utils/fixtures/public";

afterEach(() => cleanup());

describe("MemberCard", () => {
  it("renders all member fields and link to detail page (happy)", () => {
    const member = buildMember();
    const { container } = render(<MemberCard member={member} />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe(`/members/${member.memberId}`);
    expect(link.getAttribute("aria-label")).toBe(
      `${member.fullName} の詳細`,
    );
    expect(
      container.querySelector('[data-role="name"]')?.textContent,
    ).toBe(member.fullName);
    expect(
      container.querySelector('[data-role="nickname"]')?.textContent,
    ).toBe(`@${member.nickname}`);
    expect(
      container.querySelector('[data-role="occupation"]')?.textContent,
    ).toBe(member.occupation);
    expect(
      container.querySelector('[data-role="location"]')?.textContent,
    ).toBe(member.location);
    expect(
      container.querySelector('[data-role="zone"]')?.textContent,
    ).toBe(member.ubmZone);
    expect(
      container.querySelector('[data-role="status"]')?.textContent,
    ).toBe(member.ubmMembershipType);
    expect(
      container
        .querySelector('[data-component="member-card"]')
        ?.getAttribute("data-density"),
    ).toBe("comfy");
  });

  it("hides optional fields when nickname/zone/membershipType are empty/null (empty)", () => {
    const member = buildMember({
      nickname: "",
      ubmZone: null,
      ubmMembershipType: null,
    });
    const { container } = render(<MemberCard member={member} />);
    expect(container.querySelector('[data-role="nickname"]')).toBeNull();
    expect(container.querySelector('[data-role="zone"]')).toBeNull();
    expect(container.querySelector('[data-role="status"]')).toBeNull();
  });

  it("hides occupation when density='list' (variant)", () => {
    const member = buildMember();
    const { container, rerender } = render(
      <MemberCard member={member} density="list" />,
    );
    expect(
      container
        .querySelector('[data-component="member-card"]')
        ?.getAttribute("data-density"),
    ).toBe("list");
    expect(container.querySelector('[data-role="occupation"]')).toBeNull();

    rerender(<MemberCard member={member} density="dense" />);
    expect(
      container
        .querySelector('[data-component="member-card"]')
        ?.getAttribute("data-density"),
    ).toBe("dense");
    expect(container.querySelector('[data-role="occupation"]')).not.toBeNull();
  });
});
