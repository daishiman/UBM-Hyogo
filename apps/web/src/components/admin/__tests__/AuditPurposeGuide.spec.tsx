import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuditPurposeGuide } from "../AuditPurposeGuide";

afterEach(() => cleanup());

describe("AuditPurposeGuide", () => {
  it("renders the audit purpose and glossary terms", () => {
    render(<AuditPurposeGuide />);

    expect(screen.getByText("誰が、いつ、何を変えたかを追跡します")).toBeTruthy();
    expect(screen.getAllByRole("definition").map((node) => node.textContent).join(" ")).toContain(
      "操作した人",
    );
    expect(screen.getByText("PII")).toBeTruthy();
    expect(screen.getByText("batchId")).toBeTruthy();
  });
});
