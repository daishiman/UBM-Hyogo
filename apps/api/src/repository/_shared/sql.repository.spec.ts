import { describe, expect, it } from "vitest";

import { escapeLikePattern, placeholders } from "./sql";

describe("repository sql helpers", () => {
  it("builds positional placeholders", () => {
    expect(placeholders(3)).toBe("?1,?2,?3");
  });

  it("builds positional placeholders with an offset", () => {
    expect(placeholders(2, 3)).toBe("?3,?4");
  });

  it("escapes LIKE wildcard characters", () => {
    expect(escapeLikePattern(String.raw`100%_done\ok`)).toBe(
      String.raw`100\%\_done\\ok`,
    );
  });
});
