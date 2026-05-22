import { describe, expect, it } from "vitest";

import { toFormPreviewView } from "../form-preview-view";

const RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

const field = (stableKey: string, sectionKey: string, position: number) => ({
  formId: "form-1",
  revisionId: "rev-1",
  schemaHash: "hash",
  stableKey,
  questionId: `q-${stableKey}`,
  itemId: `i-${stableKey}`,
  sectionKey,
  sectionTitle: sectionKey,
  label: stableKey,
  kind: "shortText",
  position,
  required: false,
  visibility: "public",
  searchable: false,
  source: "forms" as const,
  status: "active",
  choiceLabels: [],
});

describe("toFormPreviewView", () => {
  it("computes sectionCount and fieldCount", () => {
    const result = toFormPreviewView({
      manifest: {
        formId: "form-1",
        title: "UBM",
        revisionId: "rev-1",
        schemaHash: "hash",
        syncedAt: "2026-04-29T00:00:00+09:00",
        sourceUrl: "https://docs.google.com/forms/d/form-1",
        fieldCount: 3,
        unknownFieldCount: 0,
        state: "active",
      },
      fields: [
        field("fullName", "basic", 0),
        field("nickname", "basic", 1),
        field("ubmZone", "ubm", 0),
      ],
      responderUrl: RESPONDER_URL,
    });
    expect(result.sectionCount).toBe(2);
    expect(result.fieldCount).toBe(3);
    expect(result.responderUrl).toBe(RESPONDER_URL);
  });
});
