import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const triggerMock = vi.fn();
const mutationState: { isLoading: boolean; error: Error | null } = {
  isLoading: false,
  error: null,
};

vi.mock("../../../hooks/useAdminMutation", () => ({
  useAdminMutation: () => ({
    trigger: triggerMock,
    isLoading: mutationState.isLoading,
    error: mutationState.error,
  }),
}));

import { BackfillPublishStatePanel } from "../BackfillPublishStatePanel.client";

const DRY_RUN_RESULT = {
  dryRun: true,
  policy: "auto-publish-on-consent",
  scanned: 10,
  candidates: 2,
  applied: 0,
  skipped: { alreadyPublic: 3, adminExplicit: 1, consentNotMet: 4, deleted: 0 },
};

const APPLY_RESULT = {
  dryRun: false,
  policy: "auto-publish-on-consent",
  scanned: 2,
  candidates: 2,
  applied: 2,
  skipped: { alreadyPublic: 0, adminExplicit: 0, consentNotMet: 0, deleted: 0 },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  triggerMock.mockReset();
  triggerMock.mockResolvedValue(DRY_RUN_RESULT);
  mutationState.isLoading = false;
  mutationState.error = null;
  vi.spyOn(globalThis, "confirm").mockReturnValue(true);
});

describe("BackfillPublishStatePanel", () => {
  it("TC-A1 dry-run を実行し scanned/candidates と dryRun モードを表示する", async () => {
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith(
        {},
        "/api/admin/sync/backfill-publish-state?dryRun=true",
      ),
    );
    expect(await screen.findByText("candidates")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("dryRun")).toBeTruthy();
  });

  it("TC-A2 apply を実行し applied 件数と apply モードを表示する", async () => {
    triggerMock.mockResolvedValueOnce(DRY_RUN_RESULT).mockResolvedValueOnce(APPLY_RESULT);
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    await screen.findByText("candidates");
    fireEvent.click(screen.getByTestId("backfill-apply"));
    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith(
        {},
        "/api/admin/sync/backfill-publish-state?dryRun=false",
      ),
    );
    expect(await screen.findByText("applied")).toBeTruthy();
    // "apply" はボタン文言と mode 表示の dd の 2 箇所に現れる（mode=apply の可視化を確認）。
    expect(screen.getAllByText("apply").length).toBeGreaterThanOrEqual(2);
  });

  it("TC-A2b dry-run 前は apply が disabled", () => {
    render(<BackfillPublishStatePanel />);
    expect((screen.getByTestId("backfill-apply") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("TC-A2c apply は confirm キャンセル時に実行しない", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    await screen.findByText("candidates");
    fireEvent.click(screen.getByTestId("backfill-apply"));
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });

  it("TC-A3 skipped 内訳（adminExplicit / deleted）を各行に表示する", async () => {
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    expect(await screen.findByText("skipped.adminExplicit")).toBeTruthy();
    expect(screen.getByText("skipped.deleted")).toBeTruthy();
  });

  it("TC-A4 pending 中は両ボタンが disabled になる（二重起動防止）", () => {
    mutationState.isLoading = true;
    render(<BackfillPublishStatePanel />);
    expect(
      (screen.getByTestId("backfill-dry-run") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("backfill-apply") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("TC-A4b apply pending 中は apply ボタンだけ busy になる", async () => {
    let resolveApply: (value: typeof APPLY_RESULT) => void = () => {};
    triggerMock
      .mockResolvedValueOnce(DRY_RUN_RESULT)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            mutationState.isLoading = true;
            resolveApply = resolve;
          }),
      );
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    await screen.findByText("candidates");

    fireEvent.click(screen.getByTestId("backfill-apply"));

    await waitFor(() =>
      expect(screen.getByTestId("backfill-apply").getAttribute("aria-busy")).toBe(
        "true",
      ),
    );
    expect(screen.getByTestId("backfill-dry-run").getAttribute("aria-busy")).toBeNull();

    mutationState.isLoading = false;
    resolveApply(APPLY_RESULT);
    expect(await screen.findByText("applied")).toBeTruthy();
  });

  it("TC-A5 HTTP error 時は結果テーブルを描画せず error 文言を表示する", () => {
    mutationState.error = new Error("backfill failed");
    render(<BackfillPublishStatePanel />);
    expect(screen.getByRole("alert").textContent).toContain("backfill failed");
    expect(screen.queryByText("candidates")).toBeNull();
  });

  it("TC-A6 schema mismatch 時は parseError を表示し結果テーブルを描画しない", async () => {
    triggerMock.mockResolvedValueOnce({ foo: 1 });
    render(<BackfillPublishStatePanel />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("candidates")).toBeNull();
  });

  it("TC-A7 apply 成功時に onApplied を検証済み結果で呼ぶ", async () => {
    triggerMock.mockResolvedValueOnce(DRY_RUN_RESULT).mockResolvedValueOnce(APPLY_RESULT);
    const onApplied = vi.fn();
    render(<BackfillPublishStatePanel onApplied={onApplied} />);
    fireEvent.click(screen.getByTestId("backfill-dry-run"));
    await screen.findByText("candidates");
    fireEvent.click(screen.getByTestId("backfill-apply"));
    await waitFor(() =>
      expect(onApplied).toHaveBeenCalledWith(
        expect.objectContaining({ applied: 2 }),
      ),
    );
  });
});
