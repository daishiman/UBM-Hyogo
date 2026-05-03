import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "../SignOutButton";

const signOutMock = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

afterEach(() => {
  cleanup();
  signOutMock.mockReset();
});

describe("SignOutButton", () => {
  it("calls Auth.js signOut with the default login redirect", async () => {
    signOutMock.mockResolvedValue(undefined);

    render(<SignOutButton />);
    fireEvent.click(screen.getByTestId("sign-out-button"));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/login" });
    });
  });

  it("uses custom label and redirectTo when provided", async () => {
    signOutMock.mockResolvedValue(undefined);

    render(<SignOutButton label="Sign out" redirectTo="/login?next=/admin" />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/login?next=/admin" });
    });
  });

  it("disables the button while signOut is pending", async () => {
    signOutMock.mockReturnValue(new Promise(() => {}));

    render(<SignOutButton />);
    fireEvent.click(screen.getByTestId("sign-out-button"));

    expect(screen.getByTestId("sign-out-button")).toHaveProperty("disabled", true);
    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
