import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { FormPreviewSections } from "../FormPreviewSections";
import {
  buildFormField,
  buildPreview,
} from "../../../test-utils/fixtures/public";

afterEach(() => cleanup());

describe("FormPreviewSections", () => {
  it("groups fields by sectionKey and shows visibility label / required badge (happy)", () => {
    const preview = buildPreview({
      fields: [
        buildFormField({
          sectionKey: "section-a",
          sectionTitle: "セクションA",
          stableKey: "section-a:f1",
          label: "氏名",
          visibility: "public",
          required: true,
        }),
        buildFormField({
          sectionKey: "section-a",
          sectionTitle: "セクションA",
          stableKey: "section-a:f2",
          label: "ニックネーム",
          visibility: "member",
          required: false,
        }),
        buildFormField({
          sectionKey: "section-b",
          sectionTitle: "セクションB",
          stableKey: "section-b:f1",
          label: "管理メモ",
          visibility: "admin",
          required: false,
        }),
      ],
      fieldCount: 3,
    });
    const { container } = render(<FormPreviewSections preview={preview} />);

    const sections = container.querySelectorAll("[data-section-key]");
    expect(sections).toHaveLength(2);
    expect(sections[0]?.getAttribute("data-section-key")).toBe("section-a");
    expect(sections[0]?.querySelectorAll("[data-stable-key]")).toHaveLength(2);

    const visibilities = container.querySelectorAll('[data-role="visibility"]');
    expect(visibilities[0]?.textContent).toBe("公開");
    expect(visibilities[1]?.textContent).toBe("会員のみ");
    expect(visibilities[2]?.textContent).toBe("管理者のみ");

    const required = container.querySelectorAll('[data-role="required"]');
    expect(required).toHaveLength(1);
    expect(required[0]?.textContent).toBe("必須");
  });

  it("renders only header copy when fields=[] (empty)", () => {
    const preview = buildPreview({ fields: [], sectionCount: 6 });
    const { container } = render(<FormPreviewSections preview={preview} />);
    expect(container.querySelectorAll("[data-section-key]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-stable-key]")).toHaveLength(0);
    const p = container.querySelector("p");
    expect(p?.textContent).toContain("6");
  });

  it("falls back to raw visibility string when label map miss (variant)", () => {
    const preview = buildPreview({
      fields: [
        {
          ...buildFormField({
            stableKey: "section-x:f1",
            sectionKey: "section-x",
            label: "未知",
          }),
          // 異常系の defensive fallback (`?? field.visibility`) を発火させるため bypass
          visibility: "unknown" as unknown as "public",
        },
      ],
      fieldCount: 1,
    });
    const { container } = render(<FormPreviewSections preview={preview} />);
    const visibility = container.querySelector('[data-role="visibility"]');
    expect(visibility?.textContent).toBe("unknown");
    expect(visibility?.getAttribute("data-visibility")).toBe("unknown");
  });
});
