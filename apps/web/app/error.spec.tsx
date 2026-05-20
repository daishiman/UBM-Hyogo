import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RouteError from "./error";
import { logger } from "../src/lib/logger";

vi.mock("../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

afterEach(() => cleanup());

describe("RouteError", () => {
  it("mounts with focus on the error heading", () => {
    const error = new Error("boom");

    render(<RouteError error={error} reset={() => {}} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(document.activeElement).toBe(heading);
    expect(logger.error).toHaveBeenCalledWith({
      event: "error.boundary.caught",
      digest: undefined,
      err: error,
    });
  });

  it("renders the digest when provided", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<RouteError error={error} reset={() => {}} />);

    expect(screen.getByText(/abc123/)).toBeTruthy();
  });
});
