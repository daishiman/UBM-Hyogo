import { describe, it, expect } from "vitest";
import * as UI from "../index";

describe("components/ui/index barrel", () => {
  it("公開する全ての primitive export が存在する", () => {
    const expected = [
      "Chip",
      "Avatar",
      "Button",
      "Switch",
      "Segmented",
      "Field",
      "Input",
      "Textarea",
      "Select",
      "Search",
      "Drawer",
      "Modal",
      "ToastProvider",
      "useToast",
      "KVList",
      "LinkPills",
    ];
    for (const k of expected) {
      expect((UI as Record<string, unknown>)[k]).toBeDefined();
    }
  });
});
