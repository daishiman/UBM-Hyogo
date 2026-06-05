import { describe, expect, it } from "vitest";

import { renderDefaultOg, renderMemberOg } from "../render";

describe("render smoke", () => {
  it("returns PNG responses in the Node test runtime fallback path", async () => {
    const defaultImage = await renderDefaultOg();
    const memberImage = await renderMemberOg({
      id: "m-1",
      fullName: "山田 太郎",
      occupation: "Engineer",
    });

    expect(defaultImage.headers.get("content-type")).toContain("image/png");
    expect(memberImage.headers.get("content-type")).toContain("image/png");
    expect((await defaultImage.arrayBuffer()).byteLength).toBeGreaterThan(0);
    expect((await memberImage.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it("keeps fallback-tagline member rendering on the PNG response path", async () => {
    const memberImage = await renderMemberOg({
      id: "m-2",
      fullName: "佐藤 花子",
    });

    expect(memberImage.headers.get("content-type")).toContain("image/png");
    expect((await memberImage.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
});
