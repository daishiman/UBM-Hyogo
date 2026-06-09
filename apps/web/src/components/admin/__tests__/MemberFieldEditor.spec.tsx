import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { MemberProfile } from "@ubm-hyogo/shared";

const triggerMock = vi.fn();

vi.mock("../../../features/admin/hooks/useAdminMutation", () => ({
  useAdminMutation: (_endpoint: string, _method: string, options: { onSuccess?: () => void }) => ({
    trigger: async (payload: unknown) => {
      triggerMock(payload);
      options.onSuccess?.();
      return { ok: true };
    },
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { MemberFieldEditor } from "../MemberFieldEditor";

afterEach(() => {
  cleanup();
  triggerMock.mockReset();
});

const profile = {
  responseId: "r1",
  sections: [
    {
      sectionKey: "basic",
      title: "基本",
      fields: [
        {
          stableKey: "fullName",
          label: "氏名",
          value: "Form Name",
          kind: "text",
          visibility: "public",
          source: "forms",
        },
        {
          stableKey: "systemId",
          label: "system",
          value: "x",
          kind: "system",
          visibility: "admin",
          source: "forms",
        },
      ],
    },
  ],
} as unknown as MemberProfile;

describe("MemberFieldEditor", () => {
  it("FormField 経由で編集対象と値を表示する", () => {
    render(
      <MemberFieldEditor
        memberId="m1"
        profile={profile}
        onProfileUpdated={() => {}}
      />,
    );

    expect(screen.getByLabelText("項目")).toBeDefined();
    expect(screen.getByLabelText("値")).toHaveProperty("value", "Form Name");
    expect(screen.queryByText("system")).toBeNull();
  });

  it("保存時に stableKey/value を PUT payload として送る", async () => {
    const onProfileUpdated = vi.fn();
    render(
      <MemberFieldEditor
        memberId="m1"
        profile={profile}
        onProfileUpdated={onProfileUpdated}
      />,
    );

    fireEvent.change(screen.getByLabelText("値"), {
      target: { value: "Admin Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(triggerMock).toHaveBeenCalledWith({
      stableKey: "fullName",
      value: "Admin Name",
    });
    expect(onProfileUpdated).toHaveBeenCalled();
  });
});
