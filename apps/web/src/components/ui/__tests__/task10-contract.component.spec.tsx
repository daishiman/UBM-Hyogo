import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  Avatar,
  Badge,
  badgeVariants,
  Banner,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Sidebar,
  Stat,
} from "../index";

afterEach(() => cleanup());

describe("task-10 ui primitive contract", () => {
  it("exports the 11 task-10 primitives from the barrel", () => {
    expect(Button).toBeTypeOf("function");
    expect(buttonVariants).toBeTypeOf("function");
    expect(Card).toBeTypeOf("function");
    expect(CardHeader).toBeTypeOf("function");
    expect(CardTitle).toBeTypeOf("function");
    expect(CardDescription).toBeTypeOf("function");
    expect(CardContent).toBeTypeOf("function");
    expect(CardFooter).toBeTypeOf("function");
    expect(Badge).toBeTypeOf("function");
    expect(badgeVariants).toBeTypeOf("function");
    // Input is wrapped in forwardRef for FormField ref forwarding,
    // so it surfaces as an object (ForwardRefExoticComponent) — not a function.
    expect(Input).toBeTypeOf("object");
    expect(Select).toBeTypeOf("function");
    expect(Sidebar).toBeTypeOf("function");
    expect(Stat).toBeTypeOf("function");
    expect(EmptyState).toBeTypeOf("function");
    expect(Avatar).toBeTypeOf("function");
    expect(Field).toBeTypeOf("function");
    expect(Banner).toBeTypeOf("function");
  });

  it("keeps className merge and accessibility surfaces available", () => {
    render(
      <>
        <Card aria-label="カード" className="custom-card">
          <CardHeader><CardTitle>見出し</CardTitle></CardHeader>
          <CardContent>本文</CardContent>
          <CardFooter>footer</CardFooter>
        </Card>
        <Badge tone="info" className="custom-badge" dot>情報</Badge>
        <Sidebar label="サイドバー">nav</Sidebar>
        <Stat label="公開中" value="12" />
        <EmptyState title="空です" action={<Button>作成</Button>} />
        <Banner tone="danger" title="エラー">保存できません</Banner>
      </>,
    );

    expect(screen.getByLabelText("カード").className).toContain("custom-card");
    expect(screen.getByText("情報").getAttribute("data-tone")).toBe("info");
    expect(screen.getByRole("complementary", { name: "サイドバー" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "空です" })).toBeTruthy();
    expect(screen.getByRole("alert").getAttribute("data-tone")).toBe("danger");
  });

  it("extends legacy primitives with task-10 props", () => {
    render(
      <Field label="メール" required error="入力してください">
        {(fieldProps) => <Input {...fieldProps} inputSize="lg" invalid />}
      </Field>,
    );

    const input = screen.getByLabelText("メール *必須");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("data-size")).toBe("lg");
    expect(screen.getByRole("alert").textContent).toBe("入力してください");
  });
});
