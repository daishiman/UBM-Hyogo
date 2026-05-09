// UT-15 Phase 4 F-04: cf-waf-apply.sh の dry-run スナップショット検証。
// 実 Cloudflare API は呼ばず、CF_WAF_SKIP_TOKEN_CHECK=1 で preflight を通す。

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..");
const SCRIPT = resolve(REPO_ROOT, "scripts/cf-waf-apply.sh");
const FIXTURE = resolve(
  REPO_ROOT,
  "scripts/cf-waf-apply/__fixtures__/dry-run.snapshot.json",
);

function runDryRun(args: string[]): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  const r = spawnSync("bash", [SCRIPT, ...args], {
    env: { ...process.env, CF_WAF_SKIP_TOKEN_CHECK: "1" },
    encoding: "utf8",
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

describe("cf-waf-apply.sh dry-run", () => {
  it("S-01: simulate --dry-run は固定 fixture と一致する", () => {
    const r = runDryRun(["--mode", "simulate", "--dry-run", "--env", "staging"]);
    expect(r.status).toBe(0);
    const expected = JSON.parse(readFileSync(FIXTURE, "utf8")) as unknown;
    const actual = JSON.parse(r.stdout) as unknown;
    expect(actual).toEqual(expected);
  });

  it("S-02: enforce --dry-run では mode が enforce になる", () => {
    const r = runDryRun(["--mode", "enforce", "--dry-run"]);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout) as { mode: string; expected: { managedRuleset: { mode: string } } };
    expect(j.mode).toBe("enforce");
    expect(j.expected.managedRuleset.mode).toBe("on");
  });

  it("S-03: --mode 不正は exit 1", () => {
    const r = runDryRun(["--mode", "bogus", "--dry-run"]);
    expect(r.status).toBe(1);
  });

  it("S-04: --mode 省略は exit 1", () => {
    const r = runDryRun(["--dry-run"]);
    expect(r.status).toBe(1);
  });

  it("S-05: CF_WAF_FORCE_DIFF=1 では dry-run でも EXIT_DIFF=14 を返す（CI gate 用）", () => {
    const r = spawnSync(
      "bash",
      [SCRIPT, "--mode", "simulate", "--dry-run"],
      {
        env: {
          ...process.env,
          CF_WAF_SKIP_TOKEN_CHECK: "1",
          CF_WAF_FORCE_DIFF: "1",
        },
        encoding: "utf8",
      },
    );
    expect(r.status).toBe(14);
  });

  it("S-06: token 未注入かつ skip なしなら EXIT_TOKEN=11", () => {
    const {
      CLOUDFLARE_API_TOKEN: _token,
      CF_WAF_SKIP_TOKEN_CHECK: _skip,
      ...env
    } = process.env;
    const r = spawnSync("bash", [SCRIPT, "--mode", "simulate", "--dry-run"], {
      env,
      encoding: "utf8",
    });
    expect(r.status).toBe(11);
    expect(r.stderr).toContain("CLOUDFLARE_API_TOKEN is not injected");
    expect(r.stdout).not.toContain("CLOUDFLARE_API_TOKEN");
  });

  it("S-07: non-dry-run は G1 実装前に false green せず EXIT_API=13", () => {
    const r = spawnSync("bash", [SCRIPT, "--mode", "simulate"], {
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: "dummy-token-that-must-not-leak",
      },
      encoding: "utf8",
    });
    expect(r.status).toBe(13);
    expect(r.stderr).toContain("non-dry-run Cloudflare mutation is not implemented");
    expect(r.stderr).not.toContain("dummy-token-that-must-not-leak");
    expect(r.stdout).not.toContain("dummy-token-that-must-not-leak");
  });
});
