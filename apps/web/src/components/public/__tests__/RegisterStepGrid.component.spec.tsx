import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RegisterStepGrid } from "../RegisterStepGrid";

afterEach(() => cleanup());

describe("RegisterStepGrid", () => {
  it("renders the prototype 3-step flow", () => {
    const { container } = render(<RegisterStepGrid />);
    const cards = container.querySelectorAll(".register-step-card");
    expect(cards).toHaveLength(3);
    expect(container.textContent).toContain("STEP 01");
    expect(container.textContent).toContain("Google フォームで回答");
    expect(container.textContent).toContain("自動反映");
    expect(container.textContent).toContain("ログインして確認");
  });
});
