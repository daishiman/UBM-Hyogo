import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RegisterFaq } from "../RegisterFaq";

afterEach(() => cleanup());

describe("RegisterFaq", () => {
  it("renders the prototype FAQ accordion", () => {
    const { container } = render(<RegisterFaq />);
    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(3);
    expect(container.textContent).toContain("回答内容の修正");
    expect(container.textContent).toContain("公開情報と会員限定情報");
    expect(container.textContent).toContain("退会したい");
  });
});
