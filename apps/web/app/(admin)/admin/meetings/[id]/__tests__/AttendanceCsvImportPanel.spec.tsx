// ut-07c-followup-001 UI test for AttendanceCsvImportPanel.
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AttendanceCsvImportPanel } from "../AttendanceCsvImportPanel";

const ORIGINAL_FETCH = global.fetch;

const csv = (rows: string[][]): string => {
  const header = "memberId,email";
  return [header, ...rows.map((r) => r.join(","))].join("\n");
};

const makeFile = (text: string): File =>
  new File([text], "attendance.csv", { type: "text/csv" });

const mockOk = (body: unknown) =>
  vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

const mockStatus = (status: number) =>
  vi.fn(async () => new Response("", { status }));

afterEach(() => {
  cleanup();
  global.fetch = ORIGINAL_FETCH;
});

beforeEach(() => {
  // jsdom: HTMLInputElement.files setter は read-only。File.text() を polyfill する。
  if (!("text" in File.prototype)) {
    Object.defineProperty(File.prototype, "text", {
      value: function (this: File) {
        return Promise.resolve(""); // overridden per test via mock
      },
    });
  }
});

const uploadCsv = async (input: HTMLInputElement, text: string) => {
  const file = makeFile(text);
  // jsdom: File.text() を per-instance で stub
  Object.defineProperty(file, "text", {
    value: async () => text,
  });
  Object.defineProperty(input, "files", {
    value: [file],
    configurable: true,
  });
  fireEvent.change(input);
};

describe("AttendanceCsvImportPanel", () => {
  it("case#12: upload → preview 遷移 (行別エラー render)", async () => {
    global.fetch = mockOk({
      ok: true,
      summary: {
        total: 2,
        ok: 1,
        duplicate: 1,
        deletedMember: 0,
        unknownMember: 0,
        invalid: 0,
      },
      rows: [
        { index: 0, status: "ok", memberId: "m_a" },
        { index: 1, status: "duplicate", memberId: "m_b" },
      ],
      dryRun: true,
      committed: false,
    });
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, csv([["m_a", ""], ["m_b", ""]]));
    await waitFor(() => {
      expect(screen.getByTestId("step-preview")).toBeTruthy();
    });
    const rows = screen.getAllByTestId("preview-row");
    expect(rows).toHaveLength(2);
    expect(rows[1].getAttribute("data-status")).toBe("duplicate");
    expect(screen.getAllByTestId("status-pill")[1].textContent).toBe("duplicate");
  });

  it("case#13: preview → confirm で commit リクエスト送信", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            summary: {
              total: 1,
              ok: 1,
              duplicate: 0,
              deletedMember: 0,
              unknownMember: 0,
              invalid: 0,
            },
            rows: [{ index: 0, status: "ok", memberId: "m_a" }],
            dryRun: true,
            committed: false,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            summary: {
              total: 1,
              ok: 1,
              duplicate: 0,
              deletedMember: 0,
              unknownMember: 0,
              invalid: 0,
            },
            rows: [{ index: 0, status: "ok", memberId: "m_a" }],
            dryRun: false,
            committed: true,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    global.fetch = fetchSpy as never;
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, csv([["m_a", ""]]));
    await waitFor(() => screen.getByTestId("confirm-import"));
    fireEvent.click(screen.getByTestId("confirm-import"));
    await waitFor(() => screen.getByTestId("step-done"));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const commitCall = fetchSpy.mock.calls[1][0] as string;
    expect(commitCall).toContain("dryRun=false");
    expect(screen.getByTestId("step-done").textContent).toContain("合計 1 行");
  });

  it("case#14: 413 受信時 エラー panel render", async () => {
    global.fetch = mockStatus(413) as never;
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, csv([["m_a", ""]]));
    await waitFor(() => screen.getByTestId("step-error"));
    expect(screen.getByTestId("step-error").textContent).toContain("500");
  });

  it("F8: parsing/preview から reset で idle に戻る", async () => {
    global.fetch = mockOk({
      ok: true,
      summary: {
        total: 1,
        ok: 1,
        duplicate: 0,
        deletedMember: 0,
        unknownMember: 0,
        invalid: 0,
      },
      rows: [{ index: 0, status: "ok", memberId: "m_a" }],
      dryRun: true,
      committed: false,
    });
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, csv([["m_a", ""]]));
    await waitFor(() => screen.getByTestId("cancel-import"));
    fireEvent.click(screen.getByTestId("cancel-import"));
    expect(screen.getByTestId("step-upload")).toBeTruthy();
  });

  it("F8b: 空 CSV はエラー panel", async () => {
    global.fetch = vi.fn();
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, "");
    await waitFor(() => screen.getByTestId("step-error"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("F9: deleted_member を含む preview は confirm disabled", async () => {
    global.fetch = mockOk({
      ok: true,
      summary: {
        total: 2,
        ok: 1,
        duplicate: 0,
        deletedMember: 1,
        unknownMember: 0,
        invalid: 0,
      },
      rows: [
        { index: 0, status: "ok", memberId: "m_a" },
        { index: 1, status: "deleted_member", memberId: "m_dead" },
      ],
      dryRun: true,
      committed: false,
    });
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    await uploadCsv(input, csv([["m_a", ""], ["m_dead", ""]]));
    await waitFor(() => screen.getByTestId("confirm-import"));
    expect(screen.getByTestId("confirm-import")).toHaveProperty("disabled", true);
    expect(screen.getByTestId("step-preview").textContent).toContain("deleted_member 1");
  });

  it("F10: 501 行以上は fetch 前に error", async () => {
    global.fetch = vi.fn();
    render(<AttendanceCsvImportPanel sessionId="s1" />);
    const input = screen.getByTestId("csv-file-input") as HTMLInputElement;
    const rows = Array.from({ length: 501 }, (_, i) => [`m_${i}`, ""]);
    await uploadCsv(input, csv(rows));
    await waitFor(() => screen.getByTestId("step-error"));
    expect(screen.getByTestId("step-error").textContent).toContain("500");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
