import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  class FetchAuthedError extends Error {
    status: number;
    bodyText: string;
    constructor(status: number, bodyText: string) {
      super(`HTTP ${status}`);
      this.status = status;
      this.bodyText = bodyText;
    }
  }
  return {
    FetchAuthedError,
    runState: { isLoading: false, error: null as Error | null },
    backfillState: { isLoading: false, error: null as Error | null },
    previewState: { isLoading: false, error: null as Error | null },
    hookCallCount: 0,
    runTriggerMock: vi.fn(),
    backfillTriggerMock: vi.fn(),
    previewTriggerMock: vi.fn(),
  };
});

// issue-1089: ManualFormResyncPanel は useAdminMutation を run / backfill / preview の
// 順で 3 回呼ぶ（Phase 4 §6・順序が正本）。(hookCallCount-1) % 3 で再 render を跨いで割り当てる。
vi.mock("../../../hooks/useAdminMutation", () => ({
  FetchAuthedError: h.FetchAuthedError,
  useAdminMutation: () => {
    h.hookCallCount += 1;
    const slot = (h.hookCallCount - 1) % 3;
    if (slot === 1) {
      return {
        trigger: h.backfillTriggerMock,
        isLoading: h.backfillState.isLoading,
        error: h.backfillState.error,
      };
    }
    if (slot === 2) {
      return {
        trigger: h.previewTriggerMock,
        isLoading: h.previewState.isLoading,
        error: h.previewState.error,
      };
    }
    return {
      trigger: h.runTriggerMock,
      isLoading: h.runState.isLoading,
      error: h.runState.error,
    };
  },
}));

import { ManualFormResyncPanel } from "../ManualFormResyncPanel.client";

const SUCCESS = {
  ok: true,
  result: {
    status: "succeeded",
    jobId: "job-1",
    processedCount: 3,
    writeCount: 2,
    cursor: "cursor-1",
  },
};

const PREVIEW_OK = {
  ok: true,
  preview: {
    status: "preview",
    dryRun: true,
    responseCount: 7,
    estimatedWrites: 9,
    pagesScanned: 1,
    capped: false,
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  h.runTriggerMock.mockReset();
  h.backfillTriggerMock.mockReset();
  h.previewTriggerMock.mockReset();
  h.hookCallCount = 0;
  h.runTriggerMock.mockResolvedValue(SUCCESS);
  h.backfillTriggerMock.mockResolvedValue(SUCCESS);
  h.previewTriggerMock.mockResolvedValue(PREVIEW_OK);
  h.runState.isLoading = false;
  h.runState.error = null;
  h.backfillState.isLoading = false;
  h.backfillState.error = null;
  h.previewState.isLoading = false;
  h.previewState.error = null;
  vi.spyOn(globalThis, "confirm").mockReturnValue(true);
});

describe("ManualFormResyncPanel", () => {
  it("TC-B1 差分 sync を実行し結果（writeCount / 差分モード）を表示する", async () => {
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-run"));
    await waitFor(() =>
      expect(h.runTriggerMock).toHaveBeenCalledWith(
        {},
        "/api/admin/sync/responses?fullSync=false",
      ),
    );
    expect(await screen.findByText("writeCount")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("run")).toBeTruthy();
  });

  // TC-B2 更新理由（AC-5）: 件数プレビュー導入により backfill は canBackfill gate
  // （preview 後のみ enable）へ変更。preview 実行 → 結果表示 → confirm 承認 →
  // ?fullSync=true の staged flow で等価の承認保証を担保する。
  it("TC-B2 全件 backfill は preview → confirm 承認後に実行する（staged）", async () => {
    render(<ManualFormResyncPanel />);
    // 1) 影響件数を確認（preview）
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    await waitFor(() =>
      expect(h.previewTriggerMock).toHaveBeenCalledWith(
        {},
        "/api/admin/sync/responses?dryRun=true&fullSync=true",
      ),
    );
    // 2) preview 表示後に backfill enable → confirm 承認 → 実行
    await waitFor(() =>
      expect(
        (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByTestId("manual-sync-backfill"));
    await waitFor(() => expect(globalThis.confirm).toHaveBeenCalled());
    expect(h.backfillTriggerMock).toHaveBeenCalledWith(
      {},
      "/api/admin/sync/responses?fullSync=true",
    );
    expect(await screen.findByText("backfill")).toBeTruthy();
  });

  it("TC-B3 confirm キャンセル時は backfill を実行しない", async () => {
    vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    await waitFor(() =>
      expect(
        (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByTestId("manual-sync-backfill"));
    await waitFor(() => expect(globalThis.confirm).toHaveBeenCalled());
    expect(h.backfillTriggerMock).not.toHaveBeenCalled();
  });

  it("TC-B4 pending 中は 3 ボタンすべて disabled になる", () => {
    h.runState.isLoading = true;
    render(<ManualFormResyncPanel />);
    expect(
      (screen.getByTestId("manual-sync-run") as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("manual-sync-backfill-preview") as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("TC-B5 409 sync_in_progress を検知して結果テーブルを描画しない", () => {
    h.runState.error = new h.FetchAuthedError(
      409,
      JSON.stringify({
        ok: false,
        result: {
          status: "skipped",
          jobId: "job-running",
          processedCount: 0,
          writeCount: 0,
          cursor: null,
          skippedReason: "another response sync is in progress",
        },
      }),
    );
    render(<ManualFormResyncPanel />);
    expect(screen.getByRole("status").textContent).toContain("他の sync が実行中です");
    expect(screen.queryByText("writeCount")).toBeNull();
  });

  it("TC-B6 HTTP error 時は結果テーブルを描画せず error 文言を表示する", () => {
    h.runState.error = new Error("sync failed");
    render(<ManualFormResyncPanel />);
    expect(screen.getByRole("alert").textContent).toContain("sync failed");
    expect(screen.queryByText("writeCount")).toBeNull();
  });

  it("TC-B7 schema mismatch 時は parseError を表示しテーブルを描画しない", async () => {
    h.runTriggerMock.mockResolvedValueOnce({ foo: 1 });
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-run"));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByText("writeCount")).toBeNull();
  });

  it("TC-B8 差分成功時に onSynced を検証済み結果で呼ぶ", async () => {
    const onSynced = vi.fn();
    render(<ManualFormResyncPanel onSynced={onSynced} />);
    fireEvent.click(screen.getByTestId("manual-sync-run"));
    await waitFor(() =>
      expect(onSynced).toHaveBeenCalledWith(
        expect.objectContaining({ status: "succeeded", writeCount: 2 }),
      ),
    );
  });

  it("TC-B9 影響件数を確認すると preview パネルに実数・推定・走査ページを表示する", async () => {
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    await waitFor(() =>
      expect(h.previewTriggerMock).toHaveBeenCalledWith(
        {},
        "/api/admin/sync/responses?dryRun=true&fullSync=true",
      ),
    );
    // responseCount（実数）と estimatedWrites（推定ラベル）を表示
    const countEl = await screen.findByTestId("manual-sync-preview-response-count");
    expect(countEl.textContent).toContain("7");
    expect(
      screen.getByTestId("manual-sync-preview-estimated-writes").textContent,
    ).toContain("9");
    expect(screen.getByText(/推定/)).toBeTruthy();
    expect(screen.getByText("pagesScanned")).toBeTruthy();
  });

  it("TC-B9b capped=true のとき上限到達の注記を表示する", async () => {
    h.previewTriggerMock.mockResolvedValueOnce({
      ok: true,
      preview: {
        status: "preview",
        dryRun: true,
        responseCount: 100,
        estimatedWrites: 500,
        pagesScanned: 100,
        capped: true,
      },
    });
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    expect(await screen.findByText(/上限到達: 一部のみ集計/)).toBeTruthy();
  });

  it("TC-B10 canBackfill gate: preview 前は backfill disabled、preview 成功後に enable", async () => {
    render(<ManualFormResyncPanel />);
    // (a) preview 未実行 → disabled
    expect(
      (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
    ).toBe(true);
    // (b) preview 成功後 → enable
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    await waitFor(() =>
      expect(
        (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
      ).toBe(false),
    );
  });

  it("TC-B11 confirm 文言に実数を埋め込み、cancel 時は backfill を実行しない", async () => {
    const confirmSpy = vi.spyOn(globalThis, "confirm").mockReturnValue(false);
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    await waitFor(() =>
      expect(
        (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByTestId("manual-sync-backfill"));
    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(confirmSpy).toHaveBeenCalledWith(
      "全 7 件の回答を再取込します（推定 9 write）。実行しますか?",
    );
    expect(h.backfillTriggerMock).not.toHaveBeenCalled();
  });

  it("TC-B12 preview schema mismatch 時は parseError を表示し backfill を gate する", async () => {
    h.previewTriggerMock.mockResolvedValueOnce({ ok: true, preview: { foo: 1 } });
    render(<ManualFormResyncPanel />);
    fireEvent.click(screen.getByTestId("manual-sync-backfill-preview"));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "件数取得不可",
    );
    expect(
      screen.queryByTestId("manual-sync-preview-response-count"),
    ).toBeNull();
    expect(
      (screen.getByTestId("manual-sync-backfill") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
