// 06c: MemberDrawer は profile 本文 input を持たない (#4 / #11)
//       および tag 直接編集 form を持たない (#13)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";

const patchMemberStatusMock = vi.fn();
const postMemberNoteMock = vi.fn();
const deleteMemberMock = vi.fn();
const restoreMemberMock = vi.fn();

vi.mock("../../../lib/admin/api", () => ({
  patchMemberStatus: (...a: unknown[]) => patchMemberStatusMock(...a),
  postMemberNote: (...a: unknown[]) => postMemberNoteMock(...a),
  deleteMember: (...a: unknown[]) => deleteMemberMock(...a),
  restoreMember: (...a: unknown[]) => restoreMemberMock(...a),
}));

import { MemberDrawer } from "../MemberDrawer";

const baseDetail = {
  identityMemberId: "m_1",
  identityEmail: "a@example.com",
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  profile: {
    sections: [],
    summary: { fullName: "山田 太郎" },
    editResponseUrl: "https://forms.example.com/edit/abc",
  },
  audit: [
    { occurredAt: "2026-01-01T00:00:00Z", action: "member.update", actor: "admin@example.com" },
  ],
};

const stubFetch = (detail: unknown, opts: { ok?: boolean; status?: number } = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      headers: { get: () => "application/json" },
      json: async () => detail,
    } as unknown as Response),
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  patchMemberStatusMock.mockReset();
  postMemberNoteMock.mockReset();
  deleteMemberMock.mockReset();
  restoreMemberMock.mockReset();
});

beforeEach(() => {
  stubFetch(baseDetail);
});

const waitForViewLoaded = async () => {
  await waitFor(() => expect(screen.getByText(/email:/)).toBeTruthy());
};

const findHiddenRadio = () => {
  const radios = screen.getAllByRole("radio") as HTMLInputElement[];
  return radios.find((r) => r.parentElement?.textContent?.includes("hidden"))!;
};

describe("MemberDrawer", () => {
  it("happy: profile 本文 textarea/input が存在しない (#4 #11)", async () => {
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();
    expect(screen.queryByLabelText(/事業概要|business/i)).toBeNull();
    expect(screen.queryByLabelText(/自己紹介|self/i)).toBeNull();
  });

  it("happy: tag 直接編集 form がなく /admin/tags リンクのみ (#13)", async () => {
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();
    expect(document.querySelector("[data-testid=tag-direct-edit]")).toBeNull();
    const link = screen.getByRole("link", { name: /タグキューで編集/ });
    expect(link.getAttribute("href")).toMatch(/^\/admin\/tags\?memberId=/);
  });

  it("読み込み中: fetch pending 中は「読み込み中…」を表示", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    expect(screen.getByText("読み込み中…")).toBeTruthy();
  });

  it("fetch エラー: 500 で role=alert にエラー表示", async () => {
    stubFetch({}, { ok: false, status: 500 });
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("status 500");
    });
  });

  it("mutation - publishState 変更 成功: patchMemberStatus + onMutated/onClose 呼出", async () => {
    patchMemberStatusMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const onMutated = vi.fn();
    const onClose = vi.fn();
    render(<MemberDrawer memberId="m_1" onClose={onClose} onMutated={onMutated} />);
    await waitForViewLoaded();

    fireEvent.click(findHiddenRadio());
    fireEvent.click(screen.getByRole("button", { name: "確定" }));

    await waitFor(() => {
      expect(patchMemberStatusMock).toHaveBeenCalledWith("m_1", { publishState: "hidden" });
    });
    await waitFor(() => expect(onMutated).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("mutation - publishState 変更 失敗: error 表示、onClose 呼ばれない", async () => {
    patchMemberStatusMock.mockResolvedValue({ ok: false, status: 403, error: "denied" });
    const onClose = vi.fn();
    render(<MemberDrawer memberId="m_1" onClose={onClose} onMutated={() => {}} />);
    await waitForViewLoaded();

    fireEvent.click(findHiddenRadio());
    fireEvent.click(screen.getByRole("button", { name: "確定" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("denied");
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("mutation - メモ投稿: 空文字で disabled、入力後に postMemberNote 呼出", async () => {
    postMemberNoteMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const onMutated = vi.fn();
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={onMutated} />);
    await waitForViewLoaded();

    const saveBtn = screen.getByRole("button", { name: "メモを保存" }) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    const ta = screen.getByLabelText("管理メモ本文");
    fireEvent.change(ta, { target: { value: "memo body" } });
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(postMemberNoteMock).toHaveBeenCalledWith("m_1", "memo body");
    });
    await waitFor(() => expect(onMutated).toHaveBeenCalled());
  });

  it("mutation - 論理削除: 確認 dialog → 理由入力で deleteMember 呼出", async () => {
    deleteMemberMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const onClose = vi.fn();
    render(<MemberDrawer memberId="m_1" onClose={onClose} onMutated={() => {}} />);
    await waitForViewLoaded();

    fireEvent.click(screen.getByRole("button", { name: "論理削除する" }));
    const execBtn = screen.getByRole("button", { name: "削除実行" }) as HTMLButtonElement;
    expect(execBtn.disabled).toBe(true);

    const reasonInput = screen.getByLabelText(/削除理由/);
    fireEvent.change(reasonInput, { target: { value: "spam" } });
    expect(execBtn.disabled).toBe(false);
    fireEvent.click(execBtn);

    await waitFor(() => {
      expect(deleteMemberMock).toHaveBeenCalledWith("m_1", "spam");
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("mutation - 論理削除 失敗時: error 表示", async () => {
    deleteMemberMock.mockResolvedValue({ ok: false, status: 500, error: "boom" });
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();

    fireEvent.click(screen.getByRole("button", { name: "論理削除する" }));
    fireEvent.change(screen.getByLabelText(/削除理由/), { target: { value: "r" } });
    fireEvent.click(screen.getByRole("button", { name: "削除実行" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("boom");
    });
  });

  it("mutation - 復元: isDeleted=true で restoreMember 呼出", async () => {
    stubFetch({
      ...baseDetail,
      status: { ...baseDetail.status, isDeleted: true },
    });
    restoreMemberMock.mockResolvedValue({ ok: true, status: 200, data: {} });
    const onMutated = vi.fn();
    const onClose = vi.fn();
    render(<MemberDrawer memberId="m_1" onClose={onClose} onMutated={onMutated} />);
    await waitForViewLoaded();

    fireEvent.click(screen.getByRole("button", { name: "復元する" }));
    await waitFor(() => {
      expect(restoreMemberMock).toHaveBeenCalledWith("m_1");
    });
    await waitFor(() => expect(onMutated).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("empty audit list: view.audit=[] で audit ul は空", async () => {
    stubFetch({ ...baseDetail, audit: [] });
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();
    const auditSection = screen.getByRole("region", { name: "監査ログ" });
    expect(auditSection.querySelectorAll("li").length).toBe(0);
  });

  it("editResponseUrl 未取得: 未取得メッセージ表示", async () => {
    stubFetch({
      ...baseDetail,
      profile: { ...baseDetail.profile, editResponseUrl: null },
    });
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();
    expect(screen.getByText("Google Form 編集URLは未取得です。")).toBeTruthy();
  });

  it("pendingPublish キャンセル: 確認 dialog が消える", async () => {
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitForViewLoaded();

    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[0]!);
    expect(screen.getByRole("dialog", { name: "変更確認" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog", { name: "変更確認" })).toBeNull();
  });
});
