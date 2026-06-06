import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANNOUNCE_TTL_MS,
  IdentityConflictAnnouncer,
  useIdentityConflictAnnounce,
} from "../IdentityConflictAnnouncer";
import {
  IDENTITY_CONFLICT_ANNOUNCEMENTS,
  announcementFor,
} from "../identityConflictAnnouncements";

function AnnounceButton({ message }: { message: string }) {
  const announce = useIdentityConflictAnnounce();
  return (
    <button type="button" onClick={() => announce(message)}>
      announce
    </button>
  );
}

function FallbackButton() {
  const announce = useIdentityConflictAnnounce();
  return (
    <button type="button" onClick={() => announce("outside provider")}>
      fallback
    </button>
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("IdentityConflictAnnouncer", () => {
  it("単一 role=status live region を children と同居させる", () => {
    render(
      <IdentityConflictAnnouncer>
        <p>候補一覧</p>
      </IdentityConflictAnnouncer>,
    );

    expect(screen.getByText("候補一覧")).toBeTruthy();
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("data-announcer")).toBe("identity-conflicts");
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("連続 announce を child 追加として保持し、上書きしない", () => {
    render(
      <IdentityConflictAnnouncer>
        <AnnounceButton message="first message" />
        <AnnounceButton message="second message" />
      </IdentityConflictAnnouncer>,
    );

    const buttons = screen.getAllByRole("button", { name: "announce" });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("first message");
    expect(status.textContent).toContain("second message");
    expect(status.querySelectorAll("span")).toHaveLength(2);
  });

  it("TTL 経過後に message child を除去する", async () => {
    vi.useFakeTimers();
    render(
      <IdentityConflictAnnouncer>
        <AnnounceButton message="temporary message" />
      </IdentityConflictAnnouncer>,
    );

    fireEvent.click(screen.getByRole("button", { name: "announce" }));
    expect(screen.getByRole("status").textContent).toContain("temporary message");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ANNOUNCE_TTL_MS);
    });

    expect(screen.getByRole("status").textContent).not.toContain("temporary message");
  });

  it("provider 外では no-op で例外を投げない", () => {
    render(<FallbackButton />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "fallback" }))).not.toThrow();
  });

  it("unmount 時に pending timer を clear する", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(
      <IdentityConflictAnnouncer>
        <AnnounceButton message="queued message" />
      </IdentityConflictAnnouncer>,
    );

    fireEvent.click(screen.getByRole("button", { name: "announce" }));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("announcementFor は action map から文言を単一導出する", () => {
    expect(announcementFor("merge")).toBe(IDENTITY_CONFLICT_ANNOUNCEMENTS.merge);
    expect(announcementFor("dismiss")).toBe(IDENTITY_CONFLICT_ANNOUNCEMENTS.dismiss);
  });
});
