import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const triggerMock = vi.fn();

vi.mock("../../../hooks", () => ({
  useAdminMutation: (
    endpoint: string,
    method: string,
    options?: { onSuccess?: () => void | Promise<void> },
  ) => ({
    trigger: async (payload: unknown) => {
      const result = await triggerMock(endpoint, method, payload);
      await options?.onSuccess?.();
      return result;
    },
    isLoading: false,
    error: null,
  }),
}));

import { MemberDrawer } from "../MemberDrawer";

const detail = {
  identityMemberId: "m1",
  identityEmail: "member@example.com",
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  profile: {
    memberId: "m1",
    responseId: "r1",
    responseEmail: "member@example.com",
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    summary: {
      fullName: "Member One",
      nickname: "M1",
      location: "Hyogo",
      occupation: "Engineer",
      ubmZone: null,
      ubmMembershipType: null,
    },
    sections: [],
    attendance: [],
    tags: [],
    lastSubmittedAt: "2026-05-15T00:00:00.000Z",
    editResponseUrl: null,
  },
  audit: [],
  notes: [
    {
      noteId: "n1",
      body: "existing note",
      noteType: "general",
      requestStatus: null,
      createdBy: "admin@example.com",
      updatedBy: "admin@example.com",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  triggerMock.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => detail,
    }) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MemberDrawer notes integration", () => {
  it("IT-01: 既存 notes 一覧と新規 NoteForm toggle を表示する", async () => {
    render(<MemberDrawer memberId="m1" onClose={vi.fn()} />);

    expect(await screen.findByText("existing note")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "メモを追加" }));

    expect((screen.getByLabelText("メモ本文") as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByRole("button", { name: "追加" })).toBeTruthy();
  });

  it("IT-02: 編集 button は NoteForm を PATCH mode で開く", async () => {
    triggerMock.mockResolvedValue({ ok: true });
    render(<MemberDrawer memberId="m1" onClose={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "編集" }));
    expect((screen.getByLabelText("メモ本文") as HTMLTextAreaElement).value).toBe(
      "existing note",
    );
    fireEvent.click(screen.getByRole("button", { name: "更新" }));

    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith(
        "/api/admin/members/m1/notes/n1",
        "PATCH",
        { body: "existing note" },
      ),
    );
  });
});
