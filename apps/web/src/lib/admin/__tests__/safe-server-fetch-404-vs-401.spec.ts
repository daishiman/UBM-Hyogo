// H2 回帰防止: 401 と 404 が混同せず別 code に正規化されることを保証
import { describe, it, expect } from "vitest";
import { safeServerFetch } from "../../server-fetch/safe-fetch";

const thunkThrowing = (status: number) => () =>
  Promise.reject(new Error(`admin api /admin/dashboard failed: ${status}`));

describe("safeServerFetch codePrefix=ADMIN_FETCH", () => {
  it("401 -> ADMIN_FETCH_401", async () => {
    const r = await safeServerFetch(thunkThrowing(401), { codePrefix: "ADMIN_FETCH" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_401");
  });

  it("404 -> ADMIN_FETCH_404", async () => {
    const r = await safeServerFetch(thunkThrowing(404), { codePrefix: "ADMIN_FETCH" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("ADMIN_FETCH_404");
  });

  it("401 と 404 の code は混同しない", async () => {
    const r401 = await safeServerFetch(thunkThrowing(401), { codePrefix: "ADMIN_FETCH" });
    const r404 = await safeServerFetch(thunkThrowing(404), { codePrefix: "ADMIN_FETCH" });
    if (!r401.ok && !r404.ok) {
      expect(r401.error.code).not.toBe(r404.error.code);
    }
  });

  it("成功時は ok=true", async () => {
    const r = await safeServerFetch(() => Promise.resolve({ x: 1 }), { codePrefix: "ADMIN_FETCH" });
    expect(r.ok).toBe(true);
  });
});
