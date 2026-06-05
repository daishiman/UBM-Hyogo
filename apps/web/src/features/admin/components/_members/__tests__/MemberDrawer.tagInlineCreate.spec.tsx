// issue-1068 / task-B: MemberDrawer の tag inline-create spec（C-T1〜C-T8）。
//   fetchMemberTags と useAdminMutation を mock。useAdminMutation mock は onSuccess/onError を
//   呼べる形にして create→attach→conflict→部分成功 の状態遷移を検証する。
//   vi.stubGlobal("window",...) は使わない（happy-dom + Object.defineProperty / spyOn）。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";
import { FetchAuthedError } from "../../../../../lib/fetch/errors";
import type { AdminTagRef, MemberTagsResult } from "../../../api/members";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const fetchMemberTagsMock = vi.fn<(memberId: string) => Promise<MemberTagsResult>>();
vi.mock("../../../api/members", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../api/members")>()),
  fetchMemberTags: (memberId: string) => fetchMemberTagsMock(memberId),
}));

// useAdminMutation を mock。POST endpoint で create（/api/admin/tags）と assign（/members/:id/tags）を区別。
type MutOptions = {
  onSuccess?: (data: unknown) => void | Promise<void>;
  onError?: (e: Error) => void;
  idempotencyKey?: string | (() => string);
  successMessage?: string;
  treat404AsSuccess?: unknown;
  refreshOnSuccess?: boolean;
};
type Slot = { trigger: ReturnType<typeof vi.fn>; options: MutOptions | null };
const create: Slot = { trigger: vi.fn(), options: null };
const assign: Slot = { trigger: vi.fn(), options: null };
const del: Slot = { trigger: vi.fn(), options: null };

vi.mock("../../../hooks/useAdminMutation", async () => {
  const errors = await import("../../../../../lib/fetch/errors");
  return {
    FetchAuthedError: errors.FetchAuthedError,
    useAdminMutation: (endpoint: string, method: string, options: MutOptions) => {
      if (method === "POST" && endpoint === "/api/admin/tags") {
        create.options = options;
        return { trigger: create.trigger, isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
      }
      if (method === "POST") {
        assign.options = options;
        return { trigger: assign.trigger, isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
      }
      if (method === "DELETE") {
        del.options = options;
        return { trigger: del.trigger, isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
      }
      return { trigger: vi.fn(() => Promise.resolve(undefined)), isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
    },
  };
});

import { MemberDrawer } from "../MemberDrawer";

const ENG: AdminTagRef = { tagId: "tag_eng", code: "engineer", label: "エンジニア", category: "occupation" };
const MGR: AdminTagRef = { tagId: "tag_mgr", code: "manager", label: "経営者", category: "occupation" };
const VIP: AdminTagRef = { tagId: "tag_vip", code: "vip", label: "VIP会員", category: "membership" };

const TAGS: MemberTagsResult = { assigned: [ENG], available: [ENG, MGR] };

const mkDetail = (): AdminMemberDetailView => ({
  identityMemberId: asMemberId("m1"),
  identityEmail: asResponseEmail("member@example.com"),
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    notificationOptOut: false,
  },
  profile: {
    memberId: asMemberId("m1"),
    responseId: asResponseId("res-1"),
    responseEmail: asResponseEmail("member@example.com"),
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    summary: {
      fullName: "山田 太郎",
      nickname: "",
      location: "Kobe",
      occupation: "経営者",
      ubmZone: "0_to_1",
      ubmMembershipType: "member",
    },
    sections: [],
    attendance: [],
    tags: [],
    lastSubmittedAt: "2026-05-15T00:00:00.000Z",
    editResponseUrl: null,
  },
  audit: [],
});

const mockDetailFetch = () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () => ({ ok: true, json: async () => mkDetail() }) as Response,
  );
};

const renderDrawer = async () => {
  mockDetailFetch();
  render(<MemberDrawer memberId="m1" onClose={() => {}} />);
  // tag セクションの読み込み完了を待つ
  await screen.findByRole("button", { name: "経営者" });
};

const openForm = () => {
  fireEvent.click(screen.getByTestId("tag-inline-create-open"));
};

const fillForm = (code: string, label: string, category: string) => {
  fireEvent.change(screen.getByLabelText("コード"), { target: { value: code } });
  fireEvent.change(screen.getByLabelText("表示名"), { target: { value: label } });
  fireEvent.change(screen.getByLabelText("カテゴリ"), { target: { value: category } });
};

const submitForm = () => {
  fireEvent.click(screen.getByRole("button", { name: "作成して付与" }));
};

beforeEach(() => {
  create.trigger = vi.fn(() => Promise.resolve(VIP));
  assign.trigger = vi.fn(() => Promise.resolve({ assigned: [ENG], available: [ENG, MGR] }));
  del.trigger = vi.fn(() => Promise.resolve(undefined));
  create.options = null;
  assign.options = null;
  del.options = null;
  fetchMemberTagsMock.mockReset();
  fetchMemberTagsMock.mockResolvedValue(TAGS);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MemberDrawer tag inline-create (issue-1068 task-B)", () => {
  it("C-T1: 「+ 新規タグ」→ FormField ×3 表示 / キャンセル → idle", async () => {
    await renderDrawer();
    expect(screen.queryByLabelText("コード")).toBeNull();
    openForm();
    expect(screen.getByLabelText("コード")).toBeDefined();
    expect(screen.getByLabelText("表示名")).toBeDefined();
    expect(screen.getByLabelText("カテゴリ")).toBeDefined();
    // 入力 → キャンセルでクリア & idle
    fillForm("vip", "VIP会員", "membership");
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(screen.queryByLabelText("コード")).toBeNull());
    expect(screen.getByTestId("tag-inline-create-open")).toBeDefined();
  });

  it("C-T2: create 成功（201）→ attach → pill 反映・form idle", async () => {
    await renderDrawer();
    openForm();
    fillForm("vip", "VIP会員", "membership");
    submitForm();
    // create mutation が body 付きで発火
    expect(create.trigger).toHaveBeenCalledWith({ code: "vip", label: "VIP会員", category: "membership" });
    // 201 → 親 assign mutation が tagId 付きで発火
    await waitFor(() => expect(assign.trigger).toHaveBeenCalledWith({ tagId: "tag_vip" }));
    // assign の onSuccess で {assigned, available} を反映 → VIP が assigned + available に出現
    assign.options?.onSuccess?.({ assigned: [ENG, VIP], available: [ENG, MGR, VIP] });
    await waitFor(() => {
      const vipPill = screen.getByRole("button", { name: "VIP会員" });
      expect(vipPill.getAttribute("aria-pressed")).toBe("true");
    });
    // form は idle へ復帰
    expect(screen.queryByLabelText("コード")).toBeNull();
  });

  it("C-T3: client validation で送信ブロック（create mutation 未発火 + error 表示）", async () => {
    await renderDrawer();
    // code 空
    openForm();
    fillForm("", "VIP会員", "membership");
    submitForm();
    expect(create.trigger).not.toHaveBeenCalled();
    expect(screen.getByText("コードを入力してください")).toBeDefined();

    // code regex 違反
    fillForm("VIP!", "VIP会員", "membership");
    submitForm();
    expect(create.trigger).not.toHaveBeenCalled();
    expect(
      screen.getByText(/英小文字・数字・アンダースコア/),
    ).toBeDefined();

    // label 121 文字
    fillForm("vip", "a".repeat(121), "membership");
    submitForm();
    expect(create.trigger).not.toHaveBeenCalled();
    expect(screen.getByText("表示名は120文字以内で入力してください")).toBeDefined();

    // category 65 文字
    fillForm("vip", "VIP会員", "c".repeat(65));
    submitForm();
    expect(create.trigger).not.toHaveBeenCalled();
    expect(screen.getByText("カテゴリは64文字以内で入力してください")).toBeDefined();
  });

  it("C-T4: server 400 invalid_body → 包括 error 表示 + form 維持（ロック解放）", async () => {
    create.trigger = vi.fn(() =>
      Promise.reject(new FetchAuthedError(400, '{"ok":false,"error":"invalid_body"}')),
    );
    await renderDrawer();
    openForm();
    fillForm("vip", "VIP会員", "membership");
    submitForm();
    await waitFor(() =>
      expect(screen.getByText(/入力内容を確認してください/)).toBeDefined(),
    );
    // form は維持（コード入力欄が残る）、attach は発火しない
    expect(screen.getByLabelText("コード")).toBeDefined();
    expect(assign.trigger).not.toHaveBeenCalled();
  });

  it("C-T5: 409 tag_code_conflict → conflict 回収・既存 pill 選択で attach・create 再発火 0", async () => {
    create.trigger = vi.fn(() =>
      Promise.reject(new FetchAuthedError(409, '{"ok":false,"error":"tag_code_conflict"}')),
    );
    // conflict 後 refetch では同 code 既存 tag(VIP) を available に含める
    fetchMemberTagsMock.mockResolvedValue({ assigned: [ENG], available: [ENG, MGR, VIP] });
    await renderDrawer();
    openForm();
    fillForm("vip", "VIP会員", "membership");
    submitForm();
    // conflict UI が出る
    await waitFor(() => expect(screen.getByTestId("tag-inline-create-conflict")).toBeDefined());
    expect(fetchMemberTagsMock).toHaveBeenCalledWith("m1");
    // refetch 反映後、既存 VIP pill が conflict ブロック内に選択導線として出現
    const conflictBlock = screen.getByTestId("tag-inline-create-conflict");
    const existing = await waitFor(() =>
      conflictBlock.querySelector("button[aria-pressed]") as HTMLButtonElement,
    );
    expect(existing.textContent).toContain("VIP会員");
    fireEvent.click(existing);
    // 既存 tag を attach（親 assign 発火）
    await waitFor(() => expect(assign.trigger).toHaveBeenCalledWith({ tagId: "tag_vip" }));
    // create mutation は 2 回目発火しない
    expect(create.trigger).toHaveBeenCalledTimes(1);
  });

  it("C-T6: 部分成功（201 後 attach 失敗）→ createdPendingAttach 保持 + retry で attach 再実行", async () => {
    // assign 1 回目 reject（onError + reject）/ 2 回目 resolve
    let attachCall = 0;
    assign.trigger = vi.fn(() => {
      attachCall += 1;
      if (attachCall === 1) {
        assign.options?.onError?.(new Error("attach failed"));
        return Promise.reject(new Error("attach failed"));
      }
      assign.options?.onSuccess?.({ assigned: [ENG, VIP], available: [ENG, MGR, VIP] });
      return Promise.resolve({ assigned: [ENG, VIP], available: [ENG, MGR, VIP] });
    });
    await renderDrawer();
    openForm();
    fillForm("vip", "VIP会員", "membership");
    submitForm();
    // retry 導線が出る
    await waitFor(() => expect(screen.getByTestId("tag-attach-retry")).toBeDefined());
    expect(create.trigger).toHaveBeenCalledTimes(1);
    const retryBtn = screen.getByRole("button", { name: "付与を再試行" });
    fireEvent.click(retryBtn);
    // assign は再実行（2 回目）、create は再発火しない
    await waitFor(() => expect(assign.trigger).toHaveBeenCalledTimes(2));
    expect(create.trigger).toHaveBeenCalledTimes(1);
    // 2 回目 resolve で retry 導線が消える
    await waitFor(() => expect(screen.queryByTestId("tag-attach-retry")).toBeNull());
  });

  it("C-T7: 既存 pill の付与/解除が inline-create 追加後も従来経路で動く（regression 0）", async () => {
    await renderDrawer();
    // 既存 available pill「経営者」を click → assign 発火（従来 toggle 経路）
    const mgr = screen.getByRole("button", { name: "経営者" });
    expect(mgr.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(mgr);
    expect(assign.trigger).toHaveBeenCalledWith({ tagId: "tag_mgr" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "経営者" }).getAttribute("aria-pressed")).toBe("true"),
    );
    // 選択済み「エンジニア」click → unassign（DELETE）発火
    fireEvent.click(screen.getByRole("button", { name: "エンジニア" }));
    expect(del.trigger).toHaveBeenCalledWith(undefined, "/api/admin/members/m1/tags/tag_eng");
  });

  it("C-T8: a11y — 入力は label と紐付き、validation error は role=alert", async () => {
    await renderDrawer();
    openForm();
    // getByLabelText で取得できる（FormField label 紐付け）
    expect(screen.getByLabelText("コード")).toBeDefined();
    expect(screen.getByLabelText("表示名")).toBeDefined();
    expect(screen.getByLabelText("カテゴリ")).toBeDefined();
    // validation error は role=alert
    fillForm("", "", "");
    submitForm();
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
  });
});
