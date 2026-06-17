import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IdentityConflictGuide } from "../IdentityConflictGuide";

afterEach(() => cleanup());

describe("IdentityConflictGuide", () => {
  it("このページでできることを3点で説明する", () => {
    render(<IdentityConflictGuide />);

    expect(screen.getByRole("heading", { name: "このページでできること" })).toBeTruthy();
    expect(screen.getByText(/二重に登録されていそうな会員/)).toBeTruthy();
    expect(screen.getByText(/統合する/)).toBeTruthy();
    expect(screen.getByText(/別人として確定/)).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
