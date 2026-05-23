/**
 * Phase 7 §7-5 S1〜S13: `cf.sh alerts` シェル統合テスト (vitest + child_process 版)
 *
 * bats-core を dev dependency に入れない判断のため (CI に bats を入れる追加コスト回避)、
 * vitest + child_process で同等の振る舞いを検証する。
 *
 * stub: CF_ALERTS_MOCK_DIR を tests/fixtures/cloudflare-alerts に向けることで
 * api-client が fixture を返す経路に切り替わる (Phase 8 §8-9)。
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "../..");
const CF_SH = path.join(REPO_ROOT, "scripts/cf.sh");
const FIXTURE_DIR = path.join(REPO_ROOT, "tests/fixtures/cloudflare-alerts");

interface RunOptions {
  mockDir?: string;
  driftMock?: boolean;
  extraEnv?: Record<string, string | undefined>;
}

function makeIsolatedMockDir(useDriftPolicies = false): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cf-alerts-mock-"));
  // copy webhooks + (drift or normal) policies
  const policiesSrc = useDriftPolicies
    ? path.join(FIXTURE_DIR, "api-drift-policies.json")
    : path.join(FIXTURE_DIR, "api-list-policies.json");
  fs.copyFileSync(policiesSrc, path.join(tmp, "api-list-policies.json"));
  fs.copyFileSync(
    path.join(FIXTURE_DIR, "api-list-webhooks.json"),
    path.join(tmp, "api-list-webhooks.json"),
  );
  return tmp;
}

function runCf(args: string[], opts: RunOptions = {}) {
  const env: Record<string, string> = {
    ...process.env,
    // Bypass `op` / `mise` dependency requirement when running tests
    CF_SH_SKIP_WITH_ENV: "1",
    // Avoid leaking real alert tokens by setting stable dummies
    CLOUDFLARE_ALERTS_TOKEN_READ: process.env.CLOUDFLARE_ALERTS_TOKEN_READ ?? "test-read-token",
    CLOUDFLARE_ALERTS_TOKEN_APPLY: process.env.CLOUDFLARE_ALERTS_TOKEN_APPLY ?? "test-apply-token",
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? "test-account",
  };
  if (opts.mockDir) env.CF_ALERTS_MOCK_DIR = opts.mockDir;
  if (opts.extraEnv) {
    for (const [k, v] of Object.entries(opts.extraEnv)) {
      if (v === undefined) delete env[k];
      else env[k] = v;
    }
  }
  return spawnSync("bash", [CF_SH, "alerts", ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: "utf-8",
  });
}

describe("cf.sh alerts subcommand", () => {
  let mockDir: string | undefined;
  afterEach(() => {
    if (mockDir && fs.existsSync(mockDir)) {
      fs.rmSync(mockDir, { recursive: true, force: true });
      mockDir = undefined;
    }
  });

  it("S1: サブコマンドなしで usage 表示 (exit 64)", () => {
    const r = runCf([]);
    expect(r.status).toBe(64);
    expect(r.stderr).toMatch(/usage: cf\.sh alerts \{list\|diff\|apply\|plan\}/);
  });

  it("S2: 未知サブコマンドで usage 表示 (exit 64)", () => {
    const r = runCf(["unknown"]);
    expect(r.status).toBe(64);
    expect(r.stderr).toMatch(/unknown subcommand: unknown/);
  });

  it("S3: list が 5 policy + 1 webhook の名前を表示", () => {
    mockDir = makeIsolatedMockDir(false);
    const r = runCf(["list"], { mockDir });
    expect(r.status).toBe(0);
    for (const n of [
      "workers-requests",
      "d1-read-queries",
      "d1-write-queries",
      "pages-build",
      "r2-class-a",
      "ut-17-relay",
    ]) {
      expect(r.stdout).toContain(n);
    }
  });

  it("S4: diff 一致時 exit 0 + no drift detected", () => {
    mockDir = makeIsolatedMockDir(false);
    const r = runCf(["diff"], { mockDir });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("no drift detected");
  });

  it("S5: diff 不一致時 exit 2 + drift 一覧", () => {
    mockDir = makeIsolatedMockDir(true);
    const r = runCf(["diff"], { mockDir });
    expect(r.status).toBe(2);
    expect(r.stdout).toContain("changed: workers-requests");
    expect(r.stdout).toContain("conditions.threshold");
    expect(r.stdout).toContain("expected=80000");
    expect(r.stdout).toContain("actual=90000");
  });

  it("S6: diff --json で JSON 配列出力", () => {
    mockDir = makeIsolatedMockDir(true);
    const r = runCf(["diff", "--json"], { mockDir });
    expect(r.status).toBe(2);
    const parsed = JSON.parse(r.stdout);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it("S7: plan は diff と同じ判定だが exit code は常に 0", () => {
    mockDir = makeIsolatedMockDir(true);
    const r = runCf(["plan"], { mockDir });
    expect(r.status).toBe(0);
  });

  it("S8: apply は --yes なしで dry-run (write-log が空)", () => {
    mockDir = makeIsolatedMockDir(false);
    const r = runCf(["apply"], { mockDir });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/dry-run/);
    const logPath = path.join(mockDir, "write-log.txt");
    expect(fs.existsSync(logPath)).toBe(false);
  });

  it("S9: apply --yes は webhook → policy の順で適用", () => {
    mockDir = makeIsolatedMockDir(false);
    const r = runCf(["apply", "--yes"], { mockDir });
    expect(r.status).toBe(0);
    const logPath = path.join(mockDir, "write-log.txt");
    expect(fs.existsSync(logPath)).toBe(true);
    const log = fs.readFileSync(logPath, "utf-8").split("\n").filter(Boolean);
    // first line must be a webhook call, then a policy call must appear after
    const firstWebhookIdx = log.findIndex((l) => l.includes("destinations/webhooks"));
    const firstPolicyIdx = log.findIndex(
      (l) => l.includes("/alerting/v3/policies") && !l.includes("destinations"),
    );
    expect(firstWebhookIdx).toBeGreaterThanOrEqual(0);
    expect(firstPolicyIdx).toBeGreaterThan(firstWebhookIdx);
  });

  it("S10: drift fixture に apply --yes すると diff が exit 0 に収束する", () => {
    mockDir = makeIsolatedMockDir(true);
    runCf(["apply", "--yes"], { mockDir });
    const r = runCf(["diff"], { mockDir });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("no drift detected");
  });

  it("S11: --ci で CLOUDFLARE_ALERTS_TOKEN_READ 未設定なら exit 78", () => {
    const r = runCf(["diff", "--ci"], {
      extraEnv: { CLOUDFLARE_ALERTS_TOKEN_READ: undefined },
    });
    expect(r.status).toBe(78);
    expect(r.stderr).toContain("CLOUDFLARE_ALERTS_TOKEN_READ is required");
  });

  it("S12: --ci で op run がスキップされる", () => {
    mockDir = makeIsolatedMockDir(false);
    const r = runCf(["diff", "--ci"], {
      mockDir,
      extraEnv: { CLOUDFLARE_ALERTS_TOKEN_READ: "dummy-read-token" },
    });
    expect([0, 2]).toContain(r.status);
    expect(r.stderr).toContain("CI mode: skipping op run");
  });

  it("S12b: apply --ci は read-only CI 経路として拒否される", () => {
    const r = runCf(["apply", "--ci"], {
      extraEnv: { CLOUDFLARE_ALERTS_TOKEN_READ: "dummy-read-token" },
    });
    expect(r.status).toBe(78);
    expect(r.stderr).toContain("alerts apply is forbidden in --ci mode");
  });

  it("S13: secret 値が stdout/stderr に出ない (token 文字列が漏れない)", () => {
    mockDir = makeIsolatedMockDir(false);
    const sentinel = "DO-NOT-LEAK-SENTINEL-TOKEN-XYZ";
    const r = runCf(["list"], {
      mockDir,
      extraEnv: { CLOUDFLARE_ALERTS_TOKEN_READ: sentinel },
    });
    expect(r.stdout).not.toContain(sentinel);
    expect(r.stderr).not.toContain(sentinel);
  });
});
