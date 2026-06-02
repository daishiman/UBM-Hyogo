// issue-1031 Phase 4/6: PhotoUpload 状態機械 / ロック解放（try/finally 等価）/ client 事前検証 / a11y。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const { mockUpload, mockDelete, mockRefresh } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockDelete: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@/lib/api/me-photo-client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api/me-photo-client")>(
      "@/lib/api/me-photo-client",
    );
  return {
    ...actual,
    uploadOwnPhoto: mockUpload,
    deleteOwnPhoto: mockDelete,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { PhotoRequestError } from "@/lib/api/me-photo-client";
import { PhotoUpload } from "../PhotoUpload.client";

const fileInput = (): HTMLInputElement =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

const jpeg = (bytes = 1024): File =>
  new File([new Uint8Array(bytes)], "photo.jpg", { type: "image/jpeg" });

const selectFile = async (file: File) => {
  await act(async () => {
    fireEvent.change(fileInput(), { target: { files: [file] } });
    await Promise.resolve();
    await Promise.resolve();
  });
};

afterEach(() => {
  cleanup();
  mockUpload.mockReset();
  mockDelete.mockReset();
  mockRefresh.mockReset();
});

beforeEach(() => {
  mockUpload.mockReset();
  mockDelete.mockReset();
  mockRefresh.mockReset();
});

describe("PhotoUpload コンポーネント", () => {
  // ---- 状態機械 ----
  it("PHOTO-UP-1: idle（photoUrl なし）— file input と hue placeholder が render される", () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    expect(fileInput()).not.toBeNull();
    expect(screen.queryByRole("img")).not.toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("PHOTO-UP-2: photoUrl あり → Avatar が <img> を render", () => {
    render(<PhotoUpload memberId="m_001" name="田中" photoUrl="https://x/a.jpg" />);
    expect(document.querySelector("img")).not.toBeNull();
  });

  it("PHOTO-UP-4: upload 中は input が disabled（重複送信防止）", async () => {
    let resolveUpload: (() => void) | null = null;
    mockUpload.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        }),
    );
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg());
    expect(fileInput().disabled).toBe(true);
    await act(async () => {
      resolveUpload?.();
      await Promise.resolve();
    });
  });

  it("PHOTO-UP-5: upload 成功 → success 状態 + router.refresh", async () => {
    mockUpload.mockResolvedValueOnce(undefined);
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg());
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toMatch(/更新しました/);
    });
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("PHOTO-UP-6: upload エラー後 → ロック解放（input が再び操作可能）", async () => {
    mockUpload.mockRejectedValueOnce(new Error("upload failed"));
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg());
    await waitFor(() => {
      expect(screen.getByRole("alert")).not.toBeNull();
    });
    // try/finally と等価のロック解放: input は disabled でない。
    expect(fileInput().disabled).toBe(false);
  });

  it("PHOTO-UP-7: delete ボタン（photo あり）→ confirm ダイアログ表示", () => {
    render(<PhotoUpload memberId="m_001" name="田中" photoUrl="https://x/a.jpg" />);
    fireEvent.click(screen.getByLabelText("プロフィール写真を削除"));
    expect(screen.getByRole("alertdialog")).not.toBeNull();
  });

  it("PHOTO-UP-8/9: delete confirm → deleteOwnPhoto 呼び出し + 成功で router.refresh", async () => {
    mockDelete.mockResolvedValueOnce(undefined);
    render(<PhotoUpload memberId="m_001" name="田中" photoUrl="https://x/a.jpg" />);
    fireEvent.click(screen.getByLabelText("プロフィール写真を削除"));
    await act(async () => {
      fireEvent.click(screen.getByText("削除する"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("PHOTO-UP-10: delete エラー後 → ロック解放・再操作可能", async () => {
    mockDelete.mockRejectedValueOnce(new PhotoRequestError(500, "UNKNOWN"));
    render(<PhotoUpload memberId="m_001" name="田中" photoUrl="https://x/a.jpg" />);
    fireEvent.click(screen.getByLabelText("プロフィール写真を削除"));
    await act(async () => {
      fireEvent.click(screen.getByText("削除する"));
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(screen.getByRole("alert")).not.toBeNull();
    });
    // ロック解放後は input が再び有効。
    expect(fileInput().disabled).toBe(false);
  });

  it("PHOTO-UP-11: photoUrl なし → delete ボタンは存在しない", () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    expect(screen.queryByLabelText("プロフィール写真を削除")).toBeNull();
  });

  // ---- client 事前 MIME/size チェック ----
  it("PHOTO-UP-12: MIME 不許可（image/gif）→ upload 呼ばれず error 表示", async () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(new File([new Uint8Array(1024)], "a.gif", { type: "image/gif" }));
    expect(mockUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).not.toBeNull();
  });

  it("PHOTO-UP-13: サイズ超過（262145 バイト）→ upload 呼ばれず error 表示", async () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg(262145));
    expect(mockUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).not.toBeNull();
  });

  it("PHOTO-UP-14: 許容 MIME（image/png 1 バイト）→ uploadOwnPhoto が呼ばれる", async () => {
    mockUpload.mockResolvedValueOnce(undefined);
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(new File([new Uint8Array(1)], "a.png", { type: "image/png" }));
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  // ---- a11y ----
  it("PHOTO-UP-15: file input に accessible name がある", () => {
    render(<PhotoUpload memberId="m_001" name="田中" />);
    expect(fileInput().getAttribute("aria-label")).toBe("プロフィール写真を変更");
  });

  it("PHOTO-UP-16: upload 中は role=status の要素が存在する", async () => {
    let resolveUpload: (() => void) | null = null;
    mockUpload.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        }),
    );
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg());
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    await act(async () => {
      resolveUpload?.();
      await Promise.resolve();
    });
  });

  it("PHOTO-UP-17: エラー時は role=alert で通知", async () => {
    mockUpload.mockRejectedValueOnce(new PhotoRequestError(413, "FILE_TOO_LARGE"));
    render(<PhotoUpload memberId="m_001" name="田中" />);
    await selectFile(jpeg());
    await waitFor(() => {
      expect(screen.getByRole("alert")).not.toBeNull();
    });
  });
});
