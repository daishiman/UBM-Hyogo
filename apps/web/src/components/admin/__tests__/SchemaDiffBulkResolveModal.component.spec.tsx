// Issue #776: SchemaDiffBulkResolveModal — modal 単体テスト
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { SchemaDiffBulkResolveModal } from "../SchemaDiffBulkResolveModal";
import type { BulkRowState } from "../hooks/useSchemaDiffBulkSelection";

const row = (over: Partial<BulkRowState> = {}): BulkRowState => ({
  diffId: over.diffId ?? "d1",
  questionId: over.questionId ?? "q1",
  category: over.category ?? "unresolved",
  suggestedStableKey: over.suggestedStableKey ?? "suggested_key",
  stableKey: over.stableKey ?? "current_key",
  submitStatus: over.submitStatus ?? "idle",
  errorMessage: over.errorMessage,
});

afterEach(() => {
  cleanup();
});

const defaultProps = () => ({
  open: true,
  rows: [row({ diffId: "d1", questionId: "q1" }), row({ diffId: "d2", questionId: "q2" })],
  isSubmitting: false,
  onUpdateStableKey: vi.fn(),
  onApplyRecommendation: vi.fn(),
  onApplyAllRecommendations: vi.fn(),
  onSubmit: vi.fn(),
  onClose: vi.fn(),
});

describe("SchemaDiffBulkResolveModal", () => {
  it("MODAL-01 rows の数だけ行を描画する", () => {
    render(<SchemaDiffBulkResolveModal {...defaultProps()} />);
    expect(screen.getAllByRole("row")).toHaveLength(3); // header + 2
  });

  it("MODAL-02 各行に stableKey input / 推奨採用 button / 状態 badge", () => {
    render(<SchemaDiffBulkResolveModal {...defaultProps()} />);
    expect(screen.getByLabelText("stableKey for q1")).toBeTruthy();
    expect(screen.getByLabelText("stableKey for q2")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "推奨採用" })).toHaveLength(2);
  });

  it("MODAL-03 確定 button click で onSubmit", () => {
    const props = defaultProps();
    render(<SchemaDiffBulkResolveModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "確定" }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it("MODAL-04 isSubmitting=true で confirm / cancel disabled", () => {
    const props = { ...defaultProps(), isSubmitting: true };
    render(<SchemaDiffBulkResolveModal {...props} />);
    expect(
      (screen.getByRole("button", { name: "送信中..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "キャンセル" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("MODAL-05 partial failure 時、失敗行の errorMessage が role=alert で表示", () => {
    const props = {
      ...defaultProps(),
      rows: [
        row({
          diffId: "d1",
          questionId: "q1",
          submitStatus: "error",
          errorMessage: "alias collision",
        }),
      ],
    };
    render(<SchemaDiffBulkResolveModal {...props} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("alias collision");
  });

  it("MODAL-06 Esc で onClose（isSubmitting=false 時）", () => {
    const props = defaultProps();
    render(<SchemaDiffBulkResolveModal {...props} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalled();
  });

  it("MODAL-07 isSubmitting=true 時は キャンセル click を無視", () => {
    const props = { ...defaultProps(), isSubmitting: true };
    render(<SchemaDiffBulkResolveModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("MODAL-08 jest-axe violation 0", async () => {
    const { container } = render(<SchemaDiffBulkResolveModal {...defaultProps()} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("MODAL-09 open=false で何も描画しない", () => {
    const props = { ...defaultProps(), open: false };
    const { container } = render(<SchemaDiffBulkResolveModal {...props} />);
    expect(container.querySelector("[data-testid=bulk-resolve-modal]")).toBeNull();
  });

  it("MODAL-10 invalid stableKey は row alert を出し確定 disabled", () => {
    const props = {
      ...defaultProps(),
      rows: [row({ diffId: "d1", questionId: "q1", stableKey: "1bad-key" })],
    };
    render(<SchemaDiffBulkResolveModal {...props} />);
    const input = screen.getByLabelText("stableKey for q1");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("stableKey");
    expect((screen.getByRole("button", { name: "確定" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
