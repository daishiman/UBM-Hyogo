import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemberPublishSwitch } from "../_members/MemberPublishSwitch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MemberPublishSwitch", () => {
  it("reads the current admin status response shape", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        ok: true,
        status: {
          member_id: "member-1",
          publish_state: "hidden",
        },
      }),
    } as Response);
    const onSuccess = vi.fn();

    render(
      <MemberPublishSwitch
        memberId="member-1"
        publishState="public"
        isDeleted={false}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: /現在 公開/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/members/member-1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ publishState: "hidden" }),
        }),
      );
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("hidden"));
    expect(screen.getByText("非公開")).toBeTruthy();
  });

  it("syncs local display when parent publishState changes", () => {
    const { rerender } = render(
      <MemberPublishSwitch
        memberId="member-1"
        publishState="public"
        isDeleted={false}
      />,
    );

    expect(screen.getByText("公開")).toBeTruthy();

    rerender(
      <MemberPublishSwitch
        memberId="member-1"
        publishState="hidden"
        isDeleted={false}
      />,
    );

    expect(screen.getByText("非公開")).toBeTruthy();
  });
});
