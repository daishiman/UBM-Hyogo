// issue-982 / task-B: MemberDrawer の tag 編集インタラクション spec。
//   fetchMemberTags と useAdminMutation を mock し、楽観更新 / rollback / pending / idempotency を検証する。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";
import type { MemberTagsResult } from "../../../api/members";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

// fetchMemberTags を mock（drawer open 時の GET）
const fetchMemberTagsMock = vi.fn<(memberId: string) => Promise<MemberTagsResult>>();
vi.mock("../../../api/members", () => ({
  fetchMemberTags: (memberId: string) => fetchMemberTagsMock(memberId),
}));

// useAdminMutation を mock（POST=assign / DELETE=unassign の options を捕捉し trigger を制御）
type MutOptions = {
  onSuccess?: (data: unknown) => void;
  onError?: (e: Error) => void;
  idempotencyKey?: string | (() => string);
  successMessage?: string;
  treat404AsSuccess?: unknown;
};
const mut: Record<"POST" | "DELETE", { trigger: ReturnType<typeof vi.fn>; options: MutOptions | null }> = {
  POST: { trigger: vi.fn(), options: null },
  DELETE: { trigger: vi.fn(), options: null },
};
vi.mock("../../../hooks/useAdminMutation", () => ({
  useAdminMutation: (_endpoint: string, method: string, options: MutOptions) => {
    // POST=assign / DELETE=unassign のみ捕捉。他 method（PATCH 等）は generic stub を返す。
    if (method === "POST" || method === "DELETE") {
      const slot = mut[method];
      slot.options = options;
      return { trigger: slot.trigger, isLoading: false, error: null, reset: vi.fn(), abort: vi.fn() };
    }
    return {
      trigger: vi.fn(() => Promise.resolve(undefined)),
      isLoading: false,
      error: null,
      reset: vi.fn(),
      abort: vi.fn(),
    };
  },
}));

import { MemberDrawer } from "../MemberDrawer";

const TAGS: MemberTagsResult = {
  assigned: [{ tagId: "tag_eng", code: "engineer", label: "エンジニア", category: "occupation" }],
  available: [
    { tagId: "tag_eng", code: "engineer", label: "エンジニア", category: "occupation" },
    { tagId: "tag_mgr", code: "manager", label: "経営者", category: "occupation" },
  ],
};

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

// detail GET は global fetch 経由。tag GET は fetchMemberTags（mock）経由。
const mockDetailFetch = () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () => ({ ok: true, json: async () => mkDetail() }) as Response,
  );
};

const findPill = (label: string): HTMLButtonElement =>
  screen.getByRole("button", { name: label }) as HTMLButtonElement;

beforeEach(() => {
  mut.POST.trigger = vi.fn(() => Promise.resolve(undefined));
  mut.DELETE.trigger = vi.fn(() => Promise.resolve(undefined));
  mut.POST.options = null;
  mut.DELETE.options = null;
  fetchMemberTagsMock.mockReset();
  fetchMemberTagsMock.mockResolvedValue(TAGS);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MemberDrawer tag editing (issue-982 task-B)", () => {
  it("B-T1: drawer open → available pill を描画し disabled でない", async () => {
    mockDetailFetch();
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const mgr = await screen.findByRole("button", { name: "経営者" });
    expect(mgr).toBeDefined();
    expect(findPill("エンジニア")).toBeDefined();
    expect((mgr as HTMLButtonElement).disabled).toBe(false);
  });

  it("B-T2: 未選択 pill click → POST mutation 発火 + 楽観的に selected 化", async () => {
    mockDetailFetch();
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const mgr = await screen.findByRole("button", { name: "経営者" });
    expect(mgr.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(mgr);
    expect(mut.POST.trigger).toHaveBeenCalledWith({ tagId: "tag_mgr" });
    await waitFor(() => expect(findPill("経営者").getAttribute("aria-pressed")).toBe("true"));
  });

  it("B-T3: 選択済み pill click → DELETE mutation 発火 + 楽観的に非 selected 化", async () => {
    mockDetailFetch();
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const eng = await screen.findByRole("button", { name: "エンジニア" });
    expect(eng.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(eng);
    expect(mut.DELETE.trigger).toHaveBeenCalledWith(
      undefined,
      "/api/admin/members/m1/tags/tag_eng",
    );
    await waitFor(() => expect(findPill("エンジニア").getAttribute("aria-pressed")).toBe("false"));
  });

  it("B-T4: assign 失敗（onError）→ rollback（selected 戻る）", async () => {
    mockDetailFetch();
    mut.POST.trigger = vi.fn(() => {
      mut.POST.options?.onError?.(new Error("assign failed"));
      return Promise.reject(new Error("assign failed"));
    });
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const mgr = await screen.findByRole("button", { name: "経営者" });
    fireEvent.click(mgr);
    // rollback で元の未選択状態に戻る
    await waitFor(() => expect(findPill("経営者").getAttribute("aria-pressed")).toBe("false"));
  });

  it("B-T5: unassign 失敗（onError）→ rollback（selected 維持）", async () => {
    mockDetailFetch();
    mut.DELETE.trigger = vi.fn(() => {
      mut.DELETE.options?.onError?.(new Error("unassign failed"));
      return Promise.reject(new Error("unassign failed"));
    });
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const eng = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(eng);
    await waitFor(() => expect(findPill("エンジニア").getAttribute("aria-pressed")).toBe("true"));
  });

  it("B-T6: pending 中の pill は disabled（二重発火防止）", async () => {
    mockDetailFetch();
    // 解決しない promise で pending を維持
    mut.POST.trigger = vi.fn(() => new Promise<undefined>(() => {}));
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    const mgr = await screen.findByRole("button", { name: "経営者" });
    fireEvent.click(mgr);
    await waitFor(() => expect(findPill("経営者").disabled).toBe(true));
    // pending 中の再 click は trigger を増やさない
    fireEvent.click(findPill("経営者"));
    expect(mut.POST.trigger).toHaveBeenCalledTimes(1);
  });

  it("B-T7: idempotencyKey option が truthy（header 付与経路）", async () => {
    mockDetailFetch();
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    await screen.findByRole("button", { name: "経営者" });
    expect(typeof mut.POST.options?.idempotencyKey).toBe("function");
    const key = (mut.POST.options?.idempotencyKey as () => string)();
    expect(key).toBeTruthy();
    expect(mut.DELETE.options?.treat404AsSuccess).toBe("silent");
  });

  it("B-T8: GET 失敗 → error 表示・クラッシュしない", async () => {
    mockDetailFetch();
    fetchMemberTagsMock.mockRejectedValue(new Error("HTTP 500"));
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    // drawer 本体（head）は表示され続ける
    await waitFor(() => expect(screen.getByText("山田 太郎")).toBeDefined());
    await waitFor(() =>
      expect(screen.getByText(/タグの読み込み失敗/)).toBeDefined(),
    );
  });
});
