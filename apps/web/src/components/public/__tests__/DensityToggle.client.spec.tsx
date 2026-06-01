import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const replaceMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParams,
  usePathname: () => "/members",
}));

import { DensityToggle } from "../DensityToggle.client";

beforeEach(() => {
  replaceMock.mockClear();
});

afterEach(() => cleanup());

function openHelp(container: HTMLElement): HTMLDetailsElement {
  const details = container.querySelector(
    '[data-component="help-hint"]',
  ) as HTMLDetailsElement;
  const summary = details.querySelector("summary") as HTMLElement;
  fireEvent.click(summary);
  // jsdom が summary click で native toggle しない場合のフォールバック
  if (!details.open) {
    details.open = true;
    fireEvent(details, new Event("toggle"));
  }
  return details;
}

describe("DensityToggle", () => {
  it("3 種の radio を Segmented として描画し value で aria-checked を反映する", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    expect(
      screen.getByRole("radiogroup", { name: "表示密度" }),
    ).toBeTruthy();
    expect(
      container.querySelector('[data-component="density-toggle"]'),
    ).toBeTruthy();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "ゆったり" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "密" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: "リスト" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: "ゆったり" }).getAttribute("data-density")).toBe("comfy");
  });

  it("各密度モードの sublabel と HelpHint を描画する", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    expect(screen.getByText("紹介文とタグまで確認")).toBeTruthy();
    expect(screen.getByText("多くの候補を一度に比較")).toBeTruthy();
    expect(screen.getByText("名前と区画を行で走査")).toBeTruthy();
    expect(
      container.querySelector('[data-component="help-hint"] summary'),
    ).toBeTruthy();
    openHelp(container);
    expect(screen.getAllByRole("term")).toHaveLength(3);
    expect(screen.getAllByRole("definition")).toHaveLength(3);
    expect(
      screen.getAllByText("カードに自己紹介、関心タグ、詳細への導線を広く表示します。"),
    ).toHaveLength(2);
  });

  it("comfy 選択時は density param を削除して /members に replace する", () => {
    render(<DensityToggle value="dense" />);
    fireEvent.click(screen.getByRole("radio", { name: "ゆったり" }));
    expect(replaceMock).toHaveBeenCalledWith("/members", { scroll: false });
  });

  it("dense 選択時は density=dense を URL に付与する", () => {
    render(<DensityToggle value="comfy" />);
    fireEvent.click(screen.getByRole("radio", { name: "密" }));
    expect(replaceMock).toHaveBeenCalledWith("/members?density=dense", {
      scroll: false,
    });
  });

  // value="list" で list radio が aria-checked（回帰 guard / TC-14）
  it("value=list 初期表示で list radio が aria-checked になる", () => {
    render(<DensityToggle value="list" />);
    expect(screen.getByRole("radio", { name: "リスト" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "ゆったり" }).getAttribute("aria-checked")).toBe("false");
  });

  // --- 複数配置の a11y id 堅牢化（AC-1/AC-2/AC-3） ---

  it("複数配置しても description id と aria-describedby が衝突しない (TC-1/TC-2)", () => {
    const { container } = render(
      <>
        <DensityToggle value="comfy" />
        <DensityToggle value="dense" />
      </>,
    );
    const spans = Array.from(
      container.querySelectorAll("span.visually-hidden"),
    ) as HTMLElement[];
    expect(spans).toHaveLength(6); // 3 description × 2 instance
    const ids = spans.map((s) => s.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(6); // 全 id が unique

    // aria-describedby が参照切れしない
    const radios = Array.from(
      container.querySelectorAll('[role="radio"]'),
    ) as HTMLElement[];
    const idSet = new Set(ids);
    for (const radio of radios) {
      const described = radio.getAttribute("aria-describedby");
      expect(described).toBeTruthy();
      expect(idSet.has(described as string)).toBe(true);
    }
  });

  it("instance 内で radio→description が対応する (TC-3)", () => {
    const { container } = render(
      <>
        <DensityToggle value="comfy" />
        <DensityToggle value="dense" />
      </>,
    );
    const controls = Array.from(
      container.querySelectorAll('[data-component="density-toggle-control"]'),
    ) as HTMLElement[];
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      const localIds = new Set(
        Array.from(control.querySelectorAll("span.visually-hidden")).map(
          (s) => (s as HTMLElement).id,
        ),
      );
      const localRadios = Array.from(
        control.querySelectorAll('[role="radio"]'),
      ) as HTMLElement[];
      for (const radio of localRadios) {
        const described = radio.getAttribute("aria-describedby") as string;
        // 自 instance 内の span を指す（他 instance を指さない）
        expect(localIds.has(described)).toBe(true);
      }
    }
  });

  it("3 配置しても description id と aria-describedby が全て unique になる (TC-11)", () => {
    const { container } = render(
      <>
        <DensityToggle value="comfy" />
        <DensityToggle value="dense" />
        <DensityToggle value="list" />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("span.visually-hidden")).map(
      (span) => (span as HTMLElement).id,
    );
    expect(ids).toHaveLength(9);
    expect(new Set(ids).size).toBe(9);
    const describedBy = Array.from(container.querySelectorAll('[role="radio"]')).map(
      (radio) => (radio as HTMLElement).getAttribute("aria-describedby"),
    );
    expect(new Set(describedBy).size).toBe(9);
    expect(describedBy.every((id) => id !== null && ids.includes(id))).toBe(true);
  });

  // --- HelpHint close 挙動（AC-3/AC-4/AC-5/AC-9） ---

  it("Escape で HelpHint が閉じ focus が summary に戻る (TC-4)", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    const details = openHelp(container);
    expect(details.open).toBe(true);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(details.querySelector("summary"));
  });

  it("details 外への pointerdown で閉じる (TC-5)", () => {
    const { container } = render(
      <div>
        <DensityToggle value="comfy" />
        <button data-testid="outside" type="button">
          outside
        </button>
      </div>,
    );
    const details = openHelp(container);
    expect(details.open).toBe(true);
    fireEvent.pointerDown(screen.getByTestId("outside"));
    expect(details.open).toBe(false);
  });

  it("details 内への pointerdown では閉じない (TC-6)", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    const details = openHelp(container);
    const dd = details.querySelector("dd") as HTMLElement;
    fireEvent.pointerDown(dd);
    expect(details.open).toBe(true);
  });

  it("summary toggle は従来どおり open/close する (TC-7) / 再 open も可能 (TC-12)", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    const details = openHelp(container);
    expect(details.open).toBe(true);
    // Escape で閉じてから再度 summary で開ける
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(details.open).toBe(false);
    openHelp(container);
    expect(details.open).toBe(true);
  });

  it("Tab キーでは HelpHint を閉じない (TC-13)", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    const details = openHelp(container);
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(details.open).toBe(true);
  });

  // --- icon system 整合（AC-6） ---

  it("help icon が Icon system で描画され平文 ? を持たない (TC-8/TC-9)", () => {
    const { container } = render(<DensityToggle value="comfy" />);
    const summary = container.querySelector(
      '[data-component="help-hint"] summary',
    ) as HTMLElement;
    expect(summary.querySelector('[data-component="icon"]')).toBeTruthy();
    expect(summary.textContent).not.toContain("?");
    expect(summary.getAttribute("aria-label")).toBe("表示密度の説明を見る");
  });

  it("unmount 後に listener が残らない (TC-10)", () => {
    const { container, unmount } = render(<DensityToggle value="comfy" />);
    openHelp(container);
    unmount();
    expect(() => {
      fireEvent.keyDown(document.body, { key: "Escape" });
      fireEvent.pointerDown(document.body);
    }).not.toThrow();
  });
});
