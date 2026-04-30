// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン分類
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

import { SchemaDiffPanel } from "../SchemaDiffPanel";

const item = (over: Partial<{ type: "added" | "changed" | "removed" | "unresolved"; label: string; diffId: string }>) => ({
  diffId: "d1",
  revisionId: "r1",
  type: "added" as const,
  questionId: "q1",
  stableKey: null,
  label: "Q",
  suggestedStableKey: null,
  status: "queued" as const,
  resolvedBy: null,
  resolvedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("SchemaDiffPanel", () => {
  it("4 ペインに分類して見出しを表示する", () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 4,
          items: [
            item({ diffId: "a", type: "added", label: "added-1" }),
            item({ diffId: "b", type: "changed", label: "changed-1" }),
            item({ diffId: "c", type: "removed", label: "removed-1" }),
            item({ diffId: "d", type: "unresolved", label: "unresolved-1" }),
          ],
        }}
      />,
    );
    expect(screen.getByText("added-1")).toBeTruthy();
    expect(screen.getByText("changed-1")).toBeTruthy();
    expect(screen.getByText("removed-1")).toBeTruthy();
    expect(screen.getByText("unresolved-1")).toBeTruthy();
  });
});
