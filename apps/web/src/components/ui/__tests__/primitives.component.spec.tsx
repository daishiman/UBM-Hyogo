import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
import { Chip } from "../Chip";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Card } from "../Card";
import { Badge } from "../Badge";
import { Switch } from "../Switch";
import { Segmented } from "../Segmented";
import { Field } from "../Field";
import { Input } from "../Input";
import { Textarea } from "../Textarea";
import { Select } from "../Select";
import { Sidebar } from "../Sidebar";
import { Stat } from "../Stat";
import { EmptyState } from "../EmptyState";
import { Banner } from "../Banner";
import { Search } from "../Search";
import { Drawer } from "../Drawer";
import { Modal } from "../Modal";
import { ToastProvider, useToast } from "../Toast";
import { KVList } from "../KVList";
import { LinkPills } from "../LinkPills";

describe("Chip", () => {
  it("renders without throwing", () => {
    render(<Chip tone="cool">test</Chip>);
  });
});

describe("Avatar", () => {
  it("hue is deterministic for same memberId", () => {
    const { container: c1 } = render(<Avatar memberId="abc123" name="Test User" />);
    const { container: c2 } = render(<Avatar memberId="abc123" name="Test User" />);
    expect(c1.querySelector("[role=img]")?.getAttribute("style")).toBe(
      c2.querySelector("[role=img]")?.getAttribute("style"),
    );
  });
  it("has aria-label", () => {
    render(<Avatar memberId="abc123" name="Test User" />);
    expect(screen.getByRole("img", { name: "Test User" })).toBeTruthy();
  });
});

describe("Button", () => {
  it("has aria-busy when loading", () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole("button").getAttribute("aria-busy")).toBe("true");
  });
});

describe("Card", () => {
  it("renders className on the root", () => {
    render(<Card aria-label="summary">content</Card>);
    expect(screen.getByLabelText("summary").className).toContain("ui-card");
  });
});

describe("Badge", () => {
  it("exposes tone as data attribute", () => {
    render(<Badge tone="success">公開中</Badge>);
    expect(screen.getByText("公開中").getAttribute("data-tone")).toBe("success");
  });
});

describe("Switch", () => {
  it("has role=switch and aria-checked", () => {
    render(<Switch checked={false} onChange={() => {}} label="toggle" />);
    const el = screen.getByRole("switch");
    expect(el.getAttribute("aria-checked")).toBe("false");
  });
});

describe("Segmented", () => {
  it("has role=radiogroup", () => {
    render(
      <Segmented options={[{ value: "a", label: "A" }]} value="a" onChange={() => {}} />,
    );
    expect(screen.getByRole("radiogroup")).toBeTruthy();
  });
});

describe("Field", () => {
  it("label htmlFor matches id", () => {
    render(
      <Field id="my-input" label="Name">
        <input id="my-input" />
      </Field>,
    );
    expect(document.querySelector('label[for="my-input"]')).toBeTruthy();
  });
});

describe("Input", () => {
  it("renders without throwing", () => {
    render(<Input />);
  });
});

describe("Textarea", () => {
  it("renders without throwing", () => {
    render(<Textarea />);
  });
});

describe("Select", () => {
  it("renders without throwing", () => {
    render(<Select options={[{ value: "a", label: "A" }]} />);
  });
});

describe("Sidebar", () => {
  it("renders complementary navigation with label", () => {
    render(<Sidebar label="管理メニュー">Menu</Sidebar>);
    expect(screen.getByRole("complementary", { name: "管理メニュー" })).toBeTruthy();
  });
});

describe("Stat", () => {
  it("renders label and value", () => {
    render(<Stat label="総会員数" value="42" />);
    expect(screen.getByText("総会員数")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("renders title, description, and action", () => {
    render(<EmptyState title="未登録" description="表示できる項目がありません" action={<button>追加</button>} />);
    expect(screen.getByRole("heading", { name: "未登録" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "追加" })).toBeTruthy();
  });
});

describe("Banner", () => {
  it("uses status role and tone", () => {
    render(<Banner tone="info">確認してください</Banner>);
    expect(screen.getByRole("status").getAttribute("data-tone")).toBe("info");
  });
  it("uses alert role for warning and danger", () => {
    render(<Banner tone="warning">確認してください</Banner>);
    expect(screen.getByRole("alert")).toBeTruthy();
  });
});

describe("Search", () => {
  it("clear button fires onChange with empty string", () => {
    let val = "hello";
    render(<Search value={val} onChange={(v) => { val = v; }} />);
    fireEvent.click(screen.getByLabelText("クリア"));
    expect(val).toBe("");
  });
});

describe("Drawer", () => {
  it("has role=dialog when open", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Test">
        <div />
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("calls onClose on Escape", () => {
    let closed = false;
    render(
      <Drawer open={true} onClose={() => { closed = true; }} title="Test">
        <div />
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(closed).toBe(true);
  });
  it("traps focus with Tab", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Test">
        <button>First</button>
        <button>Last</button>
      </Drawer>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });
});

describe("Modal", () => {
  it("has role=dialog when open", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <div />
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("traps focus with Shift+Tab", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });
});

describe("Toast", () => {
  it("ToastProvider renders without throwing", () => {
    render(<ToastProvider><div /></ToastProvider>);
  });

  it("shows and auto-dismisses toast messages", () => {
    vi.useFakeTimers();
    function TriggerToast() {
      const { toast } = useToast();
      return <button onClick={() => toast("保存しました")}>fire</button>;
    }

    render(
      <ToastProvider>
        <TriggerToast />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "fire" }));
    expect(screen.getByRole("status").textContent).toBe("保存しました");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("throws when useToast is used outside ToastProvider", () => {
    function OutsideProvider() {
      useToast();
      return null;
    }

    expect(() => render(<OutsideProvider />)).toThrow(
      "useToast must be used within ToastProvider",
    );
  });
});

describe("KVList", () => {
  it("renders correct number of items in dl", () => {
    render(<KVList items={[{ key: "a", value: "1" }, { key: "b", value: "2" }]} />);
    expect(document.querySelectorAll("dt")).toHaveLength(2);
  });
});

describe("LinkPills", () => {
  it("external links have rel=noopener noreferrer", () => {
    render(<LinkPills links={[{ label: "X", href: "https://example.com" }]} />);
    const a = document.querySelector("a");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
