import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const SCRIPT = resolve(__dirname, "..", "cleanup-issue-399.sh");

describe("cleanup-issue-399.sh env guard", () => {
  it("exits 1 when CLOUDFLARE_ENV is unset", () => {
    const r = spawnSync("bash", [SCRIPT], {
      env: { ...process.env, CLOUDFLARE_ENV: "" },
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/CLOUDFLARE_ENV must be 'staging'/);
  });

  it("exits 1 when CLOUDFLARE_ENV=production", () => {
    const r = spawnSync("bash", [SCRIPT], {
      env: { ...process.env, CLOUDFLARE_ENV: "production" },
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/CLOUDFLARE_ENV must be 'staging'/);
  });
});
