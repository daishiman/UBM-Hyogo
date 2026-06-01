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
    hookCallCount: 0,
    runTriggerMock: vi.fn(),
    backfillTriggerMock: vi.fn(),
  };
});

vi.mock("../../../hooks/useAdminMutation", () => ({
  FetchAuthedError: h.FetchAuthedError,
  useAdminMutation: () => {
    h.hookCallCount += 1;
    const isBackfill = h.hookCallCount % 2 === 0;
    return {
      trigger: isBackfill ? h.backfillTriggerMock : h.runTriggerMock,
      isLoading: isBackfill ? h.backfillState.isLoading : h.runState.isLoading,
      error: isBackfill ? h.backfillState.error : h.runState.error,
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  h.runTriggerMock.mockReset();
  h.backfillTriggerMock.mockReset();
  h.hookCallCount = 0;
  h.runTriggerMock.mockResolvedValue(SUCCESS);
  h.backfillTriggerMock.mockResolvedValue(SUCCESS);
  h.runState.isLoading = false;
  h.runState.error = null;
  h.backfillState.isLoading = false;
  h.backfillState.error = null;
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

  it("TC-B2 全件 backfill は confirm 承認後に実行する", async () => {
    render(<ManualFormResyncPanel />);
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
    fireEvent.click(screen.getByTestId("manual-sync-backfill"));
    await waitFor(() => expect(globalThis.confirm).toHaveBeenCalled());
    expect(h.backfillTriggerMock).not.toHaveBeenCalled();
  });

  it("TC-B4 pending 中は両ボタンが disabled になる", () => {
    h.runState.isLoading = true;
    render(<ManualFormResyncPanel />);
    expect(
      (screen.getByTestId("manual-sync-run") as HTMLButtonElement).disabled,
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
});
