import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

import { ButtonLink } from "../ButtonLink";
import { buttonVariants } from "../Button";

describe("ButtonLink", () => {
  // TC-4-40
  it("link role として描画する", () => {
    render(<ButtonLink href="/x">登録</ButtonLink>);
    expect(screen.getByRole("link", { name: "登録" })).toBeTruthy();
  });

  // TC-4-41
  it("既定 className が buttonVariants(ghost,md) と一致する", () => {
    render(<ButtonLink href="/x">登録</ButtonLink>);
    expect(screen.getByRole("link", { name: "登録" }).className).toBe(
      buttonVariants({ variant: "ghost", size: "md" }),
    );
  });

  // TC-4-42
  it("variant=primary で className 一致 + data-variant", () => {
    render(
      <ButtonLink href="/x" variant="primary">
        登録
      </ButtonLink>,
    );
    const a = screen.getByRole("link", { name: "登録" });
    expect(a.className).toBe(buttonVariants({ variant: "primary", size: "md" }));
    expect(a.getAttribute("data-variant")).toBe("primary");
  });

  // TC-4-43
  it("size=lg で className 一致", () => {
    render(
      <ButtonLink href="/x" size="lg">
        登録
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "登録" }).className).toBe(
      buttonVariants({ variant: "ghost", size: "lg" }),
    );
  });

  // TC-4-44
  it("block で ui-button-block を含む", () => {
    render(
      <ButtonLink href="/x" block>
        登録
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "登録" }).className).toContain("ui-button-block");
  });

  // TC-4-45
  it("anchor として href を持つ", () => {
    render(<ButtonLink href="/register">登録</ButtonLink>);
    const a = screen.getByRole("link", { name: "登録" });
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")?.endsWith("/register")).toBe(true);
  });

  // TC-4-46
  it("leftIcon を aria-hidden ラッパ内に描画する", () => {
    render(
      <ButtonLink href="/x" leftIcon={<span data-testid="li" />}>
        登録
      </ButtonLink>,
    );
    const icon = screen.getByTestId("li");
    expect(icon.parentElement?.getAttribute("aria-hidden")).toBe("true");
  });

  // TC-4-47
  it("rightIcon を aria-hidden ラッパ内に描画する", () => {
    render(
      <ButtonLink href="/x" rightIcon={<span data-testid="ri" />}>
        登録
      </ButtonLink>,
    );
    const icon = screen.getByTestId("ri");
    expect(icon.parentElement?.getAttribute("aria-hidden")).toBe("true");
  });

  // TC-4-48
  it("...rest（target など）を透過する", () => {
    render(
      <ButtonLink href="/x" target="_blank">
        登録
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "登録" }).getAttribute("target")).toBe("_blank");
  });

  // TC-6-9（block 未指定で ui-button-block を含まない）
  it("block 未指定で ui-button-block を含まない", () => {
    render(<ButtonLink href="/x">登録</ButtonLink>);
    expect(screen.getByRole("link", { name: "登録" }).className).not.toContain("ui-button-block");
  });

  // TC-6-11（視覚等価）
  it("Button と同一 className（視覚等価）", () => {
    render(
      <ButtonLink href="/x" variant="accent" size="lg" block>
        登録
      </ButtonLink>,
    );
    const a = screen.getByRole("link", { name: "登録" });
    expect(a.className).toBe(buttonVariants({ variant: "accent", size: "lg", block: true }));
  });

  // TC-6-13（旧 public hero secondary CTA 互換）
  it("variant=secondary は data-variant を保ちながら ghost visual class を使う", () => {
    render(
      <ButtonLink href="/x" variant="secondary">
        もっと見る
      </ButtonLink>,
    );
    const a = screen.getByRole("link", { name: "もっと見る" });
    expect(a.getAttribute("data-variant")).toBe("secondary");
    expect(a.className).toBe(buttonVariants({ variant: "ghost", size: "md" }));
  });

  // TC-6-12（className を固定 snapshot で保証）
  it("variant=primary の className を固定する", () => {
    render(
      <ButtonLink href="/x" variant="primary">
        x
      </ButtonLink>,
    );
    expect(screen.getByRole("link", { name: "x" }).className).toMatchInlineSnapshot(
      `"ui-button ui-button-primary ui-button-md"`,
    );
  });
});
