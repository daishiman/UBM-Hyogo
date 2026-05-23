import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FormField } from "../FormField";
import { Pagination } from "../Pagination";
import { Icon } from "../Icon";
import { EmptyState } from "../EmptyState";
import { Breadcrumb } from "../../admin/Breadcrumb";
import { axe } from "../../../test/axe";

afterEach(() => cleanup());

describe("FormField (G9-1)", () => {
  it("error 時に aria-invalid と aria-describedby を入力に注入する", () => {
    render(
      <FormField name="email" label="メール" error="必須項目です">
        <input type="email" />
      </FormField>,
    );
    const input = screen.getByLabelText("メール") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = screen.getByRole("alert");
    expect(errorEl.id).toBe(describedBy);
  });

  it("error 無し時は aria-invalid を付けない", () => {
    render(
      <FormField name="name" label="氏名">
        <input type="text" />
      </FormField>,
    );
    const input = screen.getByLabelText("氏名");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("required 時に視覚的アスタリスクを表示する", () => {
    const { container } = render(
      <FormField name="x" label="X" required>
        <input />
      </FormField>,
    );
    expect(container.querySelector(".ui-form-field__required")).toBeTruthy();
  });
});

describe("EmptyState (G9-2)", () => {
  it("4 props (icon/title/description/action) を受け付ける", () => {
    render(
      <EmptyState
        icon={<span data-testid="ico" />}
        title="空"
        description="まだありません"
        action={<button>追加</button>}
      />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("空")).toBeTruthy();
    expect(screen.getByText("まだありません")).toBeTruthy();
    expect(screen.getByRole("button", { name: "追加" })).toBeTruthy();
  });

  it("children-only 既存 API を維持する", () => {
    render(<EmptyState>まだありません</EmptyState>);
    expect(screen.getByRole("status").textContent).toContain("まだありません");
  });
});

describe("Pagination (G9-3)", () => {
  it("total 指定時は current / totalPages を表示する", () => {
    render(
      <Pagination current={2} total={50} pageSize={10} hasNext hasPrev onNext={() => {}} onPrev={() => {}} />,
    );
    expect(screen.getByText("2 / 5")).toBeTruthy();
  });

  it("total 未指定時は cursor only として meta 省略 (ページ X のみ表示)", () => {
    render(<Pagination current={3} hasNext={false} hasPrev onNext={() => {}} onPrev={() => {}} />);
    expect(screen.getByText("ページ 3")).toBeTruthy();
  });

  it("disabled state で onNext/onPrev が発火しない", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(<Pagination current={1} hasNext={false} hasPrev={false} onNext={onNext} onPrev={onPrev} />);
    fireEvent.click(screen.getByLabelText("次のページ"));
    fireEvent.click(screen.getByLabelText("前のページ"));
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it("nav は aria-label=pagination を持つ", () => {
    render(<Pagination current={1} hasNext hasPrev onNext={() => {}} onPrev={() => {}} />);
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeTruthy();
  });
});

describe("Icon (G9-4)", () => {
  it("ariaLabel 未指定時は aria-hidden", () => {
    const { container } = render(<Icon><svg /></Icon>);
    const span = container.querySelector("[data-component=icon]") as HTMLElement;
    expect(span.getAttribute("aria-hidden")).toBe("true");
    expect(span.getAttribute("role")).toBeNull();
  });

  it("ariaLabel 指定時は role=img + aria-label", () => {
    render(<Icon name="search" ariaLabel="検索" />);
    const img = screen.getByRole("img", { name: "検索" });
    expect(img).toBeTruthy();
  });

  it.each([
    ["sm", 12],
    ["md", 16],
    ["lg", 20],
    ["xl", 24],
  ] as const)("size %s は %s px", (size, px) => {
    const { container } = render(
      <Icon size={size}>
        <svg />
      </Icon>,
    );
    const span = container.querySelector("[data-component=icon]") as HTMLElement;
    expect(span.style.width).toBe(`${px}px`);
    expect(span.style.height).toBe(`${px}px`);
  });
});

describe("Breadcrumb (G9-5)", () => {
  it("nav[aria-label=breadcrumb] + ol で描画する", () => {
    const { container } = render(
      <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "会員" }]} />,
    );
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeTruthy();
    expect(container.querySelector("ol")).toBeTruthy();
  });

  it("最終項目は aria-current=page、href 未指定なら span で描画する", () => {
    render(
      <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "会員" }]} />,
    );
    expect(screen.getByText("会員").getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "会員" })).toBeNull();
    expect(screen.getByRole("link", { name: "管理" })).toBeTruthy();
  });

  it("separator は aria-hidden", () => {
    const { container } = render(
      <Breadcrumb items={[{ label: "a", href: "/a" }, { label: "b" }]} />,
    );
    const sep = container.querySelector(".ui-breadcrumb__sep");
    expect(sep?.getAttribute("aria-hidden")).toBe("true");
  });

  it("items 空時は何も描画しない", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.querySelector("[data-component=breadcrumb]")).toBeNull();
  });
});

describe.each([
  [
    "FormField",
    () =>
      render(
        <FormField name="name" label="氏名">
          <input type="text" />
        </FormField>,
      ).container,
  ],
  [
    "FormField (error)",
    () =>
      render(
        <FormField name="email" label="メール" error="必須項目です">
          <input type="email" />
        </FormField>,
      ).container,
  ],
  [
    "EmptyState",
    () =>
      render(
        <EmptyState
          icon={<span data-testid="ico" />}
          title="空"
          description="まだありません"
          action={<button>追加</button>}
        />,
      ).container,
  ],
  [
    "Pagination",
    () =>
      render(
        <Pagination current={2} total={50} pageSize={10} hasNext hasPrev onNext={() => {}} onPrev={() => {}} />,
      ).container,
  ],
  ["Icon (labelled)", () => render(<Icon name="search" ariaLabel="検索" />).container],
  [
    "Icon (decorative)",
    () =>
      render(
        <Icon>
          <svg />
        </Icon>,
      ).container,
  ],
  [
    "Breadcrumb",
    () =>
      render(
        <Breadcrumb items={[{ label: "管理", href: "/admin" }, { label: "会員" }]} />,
      ).container,
  ],
] as const)("a11y(%s)", (_, mount) => {
  it("has no axe violations", async () => {
    const results = await axe(mount());
    expect(results.violations).toHaveLength(0);
  });
});
