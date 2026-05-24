// Issue #837: SchemaDiffBulkRollbackModal — modal unit tests
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { axe } from "../../../test/axe";
import { SchemaDiffBulkRollbackModal } from "../SchemaDiffBulkRollbackModal";
import type { BulkRollbackRowState } from "../hooks/useSchemaDiffBulkRollbackSelection";

const row = (over: Partial<BulkRollbackRowState> = {}): BulkRollbackRowState => ({
  aliasId: over.aliasId ?? "alias-1",
  version: over.version ?? 1,
  stableKey: over.stableKey ?? "full_name",
  aliasLabel: over.aliasLabel ?? "Full name",
  resolvedAt: over.resolvedAt ?? "2026-05-19T00:00:00.000Z",
  resolvedBy: over.resolvedBy ?? "admin@example.com",
  impact: over.impact ?? { affectedResponseCount: 3, recomputeRequired: true },
  submitStatus: over.submitStatus ?? "idle",
  errorMessage: over.errorMessage,
});

afterEach(() => {
  cleanup();
});

const defaultProps = () => ({
  open: true,
  rows: [row(), row({ aliasId: "alias-2", aliasLabel: "Email" })],
  summary: null,
  isSubmitting: false,
  onSubmit: vi.fn(),
  onClose: vi.fn(),
});

describe("SchemaDiffBulkRollbackModal", () => {
  it("ROLLBACK-MODAL-01 rows と影響件数合計を描画する", () => {
    render(<SchemaDiffBulkRollbackModal {...defaultProps()} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("Full name")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("6 件")).toBeTruthy();
  });

  it("ROLLBACK-MODAL-02 submit / cancel を呼び分ける", () => {
    const props = defaultProps();
    render(<SchemaDiffBulkRollbackModal {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "一括で取り消す" }));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("ROLLBACK-MODAL-03 partial failure summary と row error を表示する", () => {
    render(
      <SchemaDiffBulkRollbackModal
        {...defaultProps()}
        rows={[
          row({
            aliasId: "alias-2",
            aliasLabel: "Email",
            submitStatus: "error",
            errorMessage: "race detected",
          }),
        ]}
        summary={{ succeeded: ["alias-1"], failed: ["alias-2"] }}
      />,
    );
    expect(screen.getByRole("status").getAttribute("data-summary-kind")).toBe("partial");
    expect(screen.getByRole("alert").textContent).toContain("race detected");
  });

  it("ROLLBACK-MODAL-04 isSubmitting=true では submit / cancel disabled", () => {
    render(<SchemaDiffBulkRollbackModal {...defaultProps()} isSubmitting />);
    expect(
      (screen.getByRole("button", { name: "取り消し中..." }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "キャンセル" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("ROLLBACK-MODAL-05 jest-axe violation 0", async () => {
    const { container } = render(<SchemaDiffBulkRollbackModal {...defaultProps()} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
