import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, statSync, utimesSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALLOWED_METRIC_FIELDS,
  atomicWriteJson,
  fetchAnalytics,
  formatOutputFilename,
  rotateArchive,
  SCHEMA_VERSION,
  REDACTED_CLOUDFLARE_IDENTIFIER,
  whitelistFields,
  type AnalyticsExport,
} from "../fetch-cloudflare-analytics";

const REDACTION_SCRIPT = join(__dirname, "..", "redaction-check-analytics.sh");

function makeValidExport(overrides: Partial<AnalyticsExport> = {}): AnalyticsExport {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: "2026-05-01T02:00:00.000Z",
    periodStart: "2026-04-01T00:00:00.000Z",
    periodEnd: "2026-05-01T00:00:00.000Z",
    zoneTag: "zone-abc",
    accountTag: "acct-xyz",
    metrics: {
      requests: 100,
      totalRequests: 100,
      errors5xx: 1,
      readQueries: 50,
      writeQueries: 5,
      invocations: 200,
    },
    ...overrides,
  };
}

function mockGraphqlResponse(): unknown {
  return {
    data: {
      viewer: {
        zones: [
          {
            httpRequests1dGroups: [{ sum: { requests: 1000 } }, { sum: { requests: 234 } }],
            totalRequestsGroups: [{ sum: { requests: 1000 } }, { sum: { requests: 234 } }],
            errorsGroups: [{ count: 5 }, { count: 2 }],
            // 余剰 field（whitelist で drop されるべき）
            clientIP: "192.168.1.1",
          },
        ],
        accounts: [
          {
            d1AnalyticsAdaptiveGroups: [
              { sum: { readQueries: 400, writeQueries: 10 } },
              { sum: { readQueries: 100, writeQueries: 2 } },
            ],
            workersInvocationsAdaptive: [{ sum: { requests: 9000 } }, { sum: { requests: 999 } }],
          },
        ],
      },
    },
  };
}

describe("formatOutputFilename", () => {
  it("TC-FN-01: ISO 時刻を期待形式に整形", () => {
    expect(formatOutputFilename(new Date("2026-05-01T02:30:00Z"))).toBe(
      "analytics-export-20260501-0230-UTC.json",
    );
  });
  it("TC-FN-02: 1 桁を zero-pad", () => {
    expect(formatOutputFilename(new Date("2026-01-02T03:04:00Z"))).toBe(
      "analytics-export-20260102-0304-UTC.json",
    );
  });
  it("TC-FN-03: ローカルタイムゾーン非依存（UTC で固定）", () => {
    const d = new Date(Date.UTC(2026, 11, 31, 23, 59));
    expect(formatOutputFilename(d)).toBe("analytics-export-20261231-2359-UTC.json");
  });
});

describe("whitelistFields", () => {
  it("TC-WL-01: ALLOWED_METRIC_FIELDS のみ抽出（余剰 field は drop）", () => {
    const valid = makeValidExport();
    const noisy = {
      ...valid,
      metrics: { ...valid.metrics, clientIP: "1.2.3.4", email: "x@y.z" },
    };
    const result = whitelistFields(noisy);
    expect(Object.keys(result.metrics).sort()).toEqual([...ALLOWED_METRIC_FIELDS].sort());
  });
  it("TC-WL-02: 必須 field 欠落で throw", () => {
    const broken = makeValidExport();
    delete (broken.metrics as Partial<typeof broken.metrics>).readQueries;
    expect(() => whitelistFields(broken)).toThrow(/readQueries/);
  });
  it("TC-WL-03: schemaVersion が異なれば throw", () => {
    expect(() => whitelistFields({ ...makeValidExport(), schemaVersion: "0.9.0" })).toThrow(
      /schemaVersion/,
    );
  });
  it("TC-WL-04: metrics 値が number でなければ throw", () => {
    const broken = makeValidExport();
    (broken.metrics as Record<string, unknown>).requests = "1234";
    expect(() => whitelistFields(broken)).toThrow(/requests/);
  });
});

describe("fetchAnalytics", () => {
  it("TC-FT-01/04/05: 正常レスポンスを AnalyticsExport へ整形し、Bearer ヘッダ付与、余剰 field drop", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGraphqlResponse(),
    } as Response);
    const result = await fetchAnalytics({
      token: "test-token",
      zoneTag: "zone-abc",
      accountTag: "acct-xyz",
      period: { start: new Date("2026-04-01T00:00:00Z"), end: new Date("2026-05-01T00:00:00Z") },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: new Date("2026-05-01T02:00:00Z"),
    });
    expect(result.metrics.requests).toBe(1234);
    expect(result.metrics.errors5xx).toBe(7);
    expect(result.metrics.readQueries).toBe(500);
    expect(result.metrics.writeQueries).toBe(12);
    expect(result.metrics.invocations).toBe(9999);
    expect(result.zoneTag).toBe(REDACTED_CLOUDFLARE_IDENTIFIER);
    expect(result.accountTag).toBe(REDACTED_CLOUDFLARE_IDENTIFIER);
    expect(Object.keys(result.metrics).sort()).toEqual([...ALLOWED_METRIC_FIELDS].sort());

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });

  it("TC-FT-02: HTTP 5xx で throw", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response);
    await expect(
      fetchAnalytics({
        token: "t",
        zoneTag: "z",
        accountTag: "a",
        period: { start: new Date(), end: new Date() },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 503/);
  });

  it("TC-FT-03: GraphQL errors で throw（rate limit 模擬）", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: "rate limit", code: "RATE_LIMITED" }] }),
    } as Response);
    await expect(
      fetchAnalytics({
        token: "t",
        zoneTag: "z",
        accountTag: "a",
        period: { start: new Date(), end: new Date() },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/GraphQL errors/);
  });
});

describe("atomicWriteJson", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "analytics-aw-"));
  });

  it("TC-AW-01/02: 出力ディレクトリ未作成でも mkdir-p し、本体ファイルが残る", async () => {
    const target = join(tmp, "nested", "analytics-export-20260501-0200-UTC.json");
    await atomicWriteJson({ outputPath: target, data: makeValidExport() });
    const content = JSON.parse(readFileSync(target, "utf8")) as AnalyticsExport;
    expect(content.schemaVersion).toBe(SCHEMA_VERSION);
    const remaining = readdirSync(join(tmp, "nested")).filter((n) => n.includes(".tmp-"));
    expect(remaining).toHaveLength(0);
  });

  it("TC-AW-03: writeFile が throw した場合、本体ファイルは存在せず tmp も残らない", async () => {
    // 親パスを通常ファイルとして配置 → mkdir/writeFile が ENOTDIR で fail する
    const blocker = join(tmp, "blocker");
    writeFileSync(blocker, "x", "utf8");
    const target = join(blocker, "child", "analytics-export-20260501-0200-UTC.json");
    await expect(
      atomicWriteJson({ outputPath: target, data: makeValidExport() }),
    ).rejects.toBeInstanceOf(Error);
    // tmp 直下には blocker のみ（tmp file が漏れていないこと）
    expect(readdirSync(tmp).sort()).toEqual(["blocker"]);
  });
});

describe("rotateArchive", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "analytics-ra-"));
  });

  async function placeFile(name: string, mtimeSeconds: number): Promise<void> {
    const full = join(tmp, name);
    await writeFile(full, "{}", "utf8");
    utimesSync(full, mtimeSeconds, mtimeSeconds);
  }

  it("TC-RA-01: 12 件以下なら moved=[]", async () => {
    for (let i = 0; i < 5; i++) {
      await placeFile(
        `analytics-export-202604${String(i + 1).padStart(2, "0")}-0000-UTC.json`,
        1700000000 + i,
      );
    }
    const result = await rotateArchive({ outputDir: tmp, retentionCount: 12 });
    expect(result.moved).toEqual([]);
    expect(result.kept).toHaveLength(5);
  });

  it("TC-RA-02/03: 13 件目から archive/YYYY-MM/ へ移動", async () => {
    // 12 件を 2025-01..2025-12、最新 1 件を 2026-01 に配置（合計 13 件、最古は 2025-01）
    for (let i = 0; i < 12; i++) {
      const month = i + 1;
      const name = `analytics-export-2025${String(month).padStart(2, "0")}01-0000-UTC.json`;
      await placeFile(name, 1700000000 + i);
    }
    await placeFile("analytics-export-20260101-0000-UTC.json", 1700000000 + 12);
    const beforeNames = readdirSync(tmp).sort();
    expect(beforeNames).toHaveLength(13);
    // 13 件のうち 12 件が同月名で重複しないように調整：上で month を変えているので OK
    const result = await rotateArchive({ outputDir: tmp, retentionCount: 12 });
    expect(result.moved).toHaveLength(1);
    expect(result.kept).toHaveLength(12);
    const moved = result.moved[0];
    const match = /^analytics-export-(\d{4})(\d{2})/.exec(moved);
    expect(match).not.toBeNull();
    const yearMonth = `${match![1]}-${match![2]}`;
    const archivedFiles = readdirSync(join(tmp, "archive", yearMonth));
    expect(archivedFiles).toContain(moved);
  });

  it("TC-RA-04: 不正な拡張子 / 命名は無視される", async () => {
    await placeFile("analytics-export-20260501-0200-UTC.json", 1700000000);
    await writeFile(join(tmp, "README.md"), "# hi", "utf8");
    await writeFile(join(tmp, "random.json"), "{}", "utf8");
    const result = await rotateArchive({ outputDir: tmp, retentionCount: 12 });
    expect(result.kept).toEqual(["analytics-export-20260501-0200-UTC.json"]);
    expect(result.moved).toEqual([]);
  });
});

describe("redaction grep（unit assertion）", () => {
  it("TC-RD-01: 有効な AnalyticsExport には禁止パターンが含まれない", () => {
    const data = makeValidExport();
    const text = JSON.stringify(data);
    expect(text).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(text).not.toMatch(/\b([0-9]{1,3}\.){3}[0-9]{1,3}\b/);
  });
});

describe("integration: redaction shell", () => {
  let tmp: string;
  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "analytics-rs-"));
  });

  it("S-1/S-4: clean export は exit 0、禁止パターン混入は exit 1 + REDACTION VIOLATION", () => {
    const clean = join(tmp, "clean.json");
    writeFileSync(clean, JSON.stringify(makeValidExport()), "utf8");
    expect(() => execFileSync("bash", [REDACTION_SCRIPT, clean], { stdio: "pipe" })).not.toThrow();

    const cases: Array<{ name: string; payload: Record<string, unknown>; pattern: string }> = [
      { name: "email", payload: { leak: "leaked@example.com" }, pattern: "email" },
      { name: "ipv4", payload: { ip: "192.168.1.1" }, pattern: "ipv4" },
      {
        name: "token",
        payload: { token: "abcdefghijklmnopqrstuvwxyz123456" },
        pattern: "bearer-or-token",
      },
      { name: "query", payload: { url: "https://example.test/?member=123" }, pattern: "url-query" },
      { name: "member-id", payload: { memberId: "abc123" }, pattern: "member-id" },
      { name: "member_id", payload: { member_id: "abc123" }, pattern: "member-id" },
      { name: "session", payload: { session: "active" }, pattern: "session-or-cookie" },
    ];
    for (const item of cases) {
      const dirty = join(tmp, `${item.name}.json`);
      writeFileSync(dirty, JSON.stringify({ ...makeValidExport(), ...item.payload }), "utf8");
      let caught: { status?: number; stderr?: Buffer } | undefined;
      try {
        execFileSync("bash", [REDACTION_SCRIPT, dirty], { stdio: "pipe" });
      } catch (e) {
        caught = e as { status?: number; stderr?: Buffer };
      }
      expect(caught?.status).toBe(1);
      expect(caught?.stderr?.toString() ?? "").toContain(`pattern=${item.pattern}`);
    }
  });
});

describe("integration: rotateArchive + atomicWriteJson", () => {
  it("S-2: 12 件 + 新規 1 件で 1 件が archive へ", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "analytics-int-"));
    for (let i = 0; i < 12; i++) {
      const name = `analytics-export-2025${String(i + 1).padStart(2, "0")}01-0000-UTC.json`;
      const full = join(tmp, name);
      await writeFile(full, "{}", "utf8");
      utimesSync(full, 1700000000 + i, 1700000000 + i);
    }
    const newName = "analytics-export-20260601-0200-UTC.json";
    await atomicWriteJson({ outputPath: join(tmp, newName), data: makeValidExport() });
    // 新ファイルは作成直後なので mtime 最新
    const result = await rotateArchive({ outputDir: tmp, retentionCount: 12 });
    expect(result.moved).toHaveLength(1);
    expect(result.kept).toContain(newName);
  });
});

describe("env validation (main contract)", () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("S-5: 必須 env 不足で main() が throw する（token 値は log に出ない）", async () => {
    delete process.env.CLOUDFLARE_ANALYTICS_API_TOKEN;
    process.env.CLOUDFLARE_ZONE_TAG = "z";
    process.env.CLOUDFLARE_ACCOUNT_TAG = "a";
    const { main } = await import("../fetch-cloudflare-analytics");
    await expect(main()).rejects.toThrow(/CLOUDFLARE_ANALYTICS_API_TOKEN/);
  });
});
