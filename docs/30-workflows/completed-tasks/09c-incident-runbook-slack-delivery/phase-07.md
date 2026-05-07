# Phase 7: テスト実装 — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: 本 Phase は Phase 6 で確定したコード骨格に対する Vitest 単体テスト（`scripts/notify/__tests__/slack-incident-runbook.test.ts`）の `describe` / `it` ブロック骨格、`@slack/web-api` の `WebClient` モック手順、フィクスチャ配置、`vitest.config` 連携を新規作成する。テストファイル新規追加は CONST_004 に従い実装仕様書扱いとする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 7 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 6 で確定した実装コード骨格について、(a) 正常系の I/O 契約 (b) channel 誤配信ガード (c) production approval 欠落時の fail-fast (d) Slack API エラーハンドリング (e) token leak ゼロ assertion の各観点を網羅する Vitest 単体テスト骨格を確定する。実テスト実行は Phase 8 で行う。

## テスト対象と網羅マトリクス

| 関数 / モジュール | 観点 | テストケース ID |
| --- | --- | --- |
| `renderTemplate` | プレースホルダ全置換、未置換時 throw | T1, T2 |
| `resolveChannelId` | dryrun / production 切替、欠落 throw、production==dryrun の混同 throw | T3, T4, T5 |
| `loadRunbookPermalink` | URL に commit SHA が含まれる | T6 |
| `loadEnv` | 必須キー欠落時 throw、production gate トークン欠落 throw | T7, T8 |
| `saveEvidence` / `assertNoToken` | xox[b]- / Bearer などが含まれると throw | T9, T10 |
| `postIncidentRunbook` (E2E モック) | dryrun → dryrun channel 使用、evidence schema 準拠 | T11, T12 |
| `postIncidentRunbook` (異常系) | Slack 401 token missing、5xx retry once → 再失敗 fail | T13, T14 |
| ログ / Error message | token 値が含まれない | T15 |

## ファイル構成

```
scripts/notify/__tests__/
├── slack-incident-runbook.test.ts          # 新規
└── __fixtures__/
    ├── runbook.template.expected.json      # rendered snapshot 期待値
    ├── slack-postMessage-success.json      # WebClient.chat.postMessage の戻り値モック
    ├── slack-postMessage-401.json          # token missing
    ├── slack-postMessage-5xx.json          # server error
    └── slack-getPermalink-success.json     # chat.getPermalink の戻り値モック
```

## `vitest.config` への追加

monorepo root の `vitest.workspace.ts`（または該当 workspace config）に以下プロジェクトを追加する。`scripts/` は既存 workspace 配下にない場合は独立 project として登録する。

```typescript
// vitest.workspace.ts に追加
{
  test: {
    name: "scripts-notify",
    root: "./scripts/notify",
    include: ["__tests__/**/*.test.ts"],
    environment: "node",
    globals: false,
    coverage: {
      include: ["*.ts"],
      exclude: ["__tests__/**", "*.template.json"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
},
```

## テストファイル骨格

```typescript
// scripts/notify/__tests__/slack-incident-runbook.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

// --- WebClient モック ---
const postMessageMock = vi.fn();
const getPermalinkMock = vi.fn();
vi.mock("@slack/web-api", () => ({
  WebClient: vi.fn().mockImplementation(() => ({
    chat: { postMessage: postMessageMock, getPermalink: getPermalinkMock },
  })),
  ErrorCode: { PlatformError: "slack_webapi_platform_error" },
}));

// SUT は mock 設定後に import
import {
  renderTemplate,
  resolveChannelId,
  loadRunbookPermalink,
  loadEnv,
  postIncidentRunbook,
  type RuntimeEnv,
  type CliArgs,
} from "../slack-incident-runbook";
import { saveEvidence, assertNoToken } from "../save-slack-evidence";

const FIX = (name: string) => join(__dirname, "__fixtures__", name);
const TPL = "scripts/notify/slack-incident-runbook.template.json";

beforeEach(() => {
  postMessageMock.mockReset();
  getPermalinkMock.mockReset();
});

describe("renderTemplate", () => {
  it("T1: 全プレースホルダを値で置換した JSON を返す", () => {
    const r = renderTemplate(TPL, {
      mode: "dryrun",
      releaseVersion: "v1.0.0",
      deployedAt: "2026-05-06T10:00:00Z",
      oncallHandle: "@manju",
      runbookPermalink: "https://github.com/x/y/blob/abc/runbook.md",
      commitSha: "abc",
      runbookOwnerPath: "docs/.../runbook.md",
    });
    expect(JSON.stringify(r)).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
    expect(JSON.stringify(r)).toContain("v1.0.0");
  });

  it("T2: プレースホルダ未解決時に throw する", () => {
    expect(() =>
      renderTemplate(TPL, { mode: "dryrun" } as never)
    ).toThrow(/unresolved placeholder/);
  });
});

describe("resolveChannelId", () => {
  const baseEnv: RuntimeEnv = {
    SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "xox[b]-test",
    SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
    SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
  };

  it("T3: dryrun は dryrun channel id を返す", () => {
    expect(resolveChannelId("dryrun", baseEnv)).toBe("C_DRY");
  });

  it("T4: production の channel id 欠落で throw", () => {
    expect(() =>
      resolveChannelId("production", { ...baseEnv, SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "" })
    ).toThrow(/channel id missing/);
  });

  it("T5: production と dryrun の channel id が同一なら throw（誤配信ガード）", () => {
    expect(() =>
      resolveChannelId("production", { ...baseEnv, SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_DRY" })
    ).toThrow(/must differ/);
  });
});

describe("loadRunbookPermalink", () => {
  it("T6: 戻り値の url に commit SHA を含む", () => {
    const r = loadRunbookPermalink("docs/30-workflows/x/incident-runbook.md");
    expect(r.commitSha).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.url).toContain(r.commitSha);
    expect(r.url).toContain("incident-runbook.md");
  });
});

describe("loadEnv / production gate", () => {
  it("T7: SLACK_BOT_TOKEN_INCIDENT_RUNBOOK 欠落で throw", () => {
    expect(() => loadEnv({} as NodeJS.ProcessEnv)).toThrow(/SLACK_BOT_TOKEN_INCIDENT_RUNBOOK/);
  });

  it("T8: production mode で PRODUCTION_APPROVAL_TOKEN 欠落 → main で fail-fast", async () => {
    const env: RuntimeEnv = {
      SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "xox[b]-test",
      SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
      SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
      // PRODUCTION_APPROVAL_TOKEN 欠落
    };
    const args: CliArgs = {
      mode: "production", releaseVersion: "v1", deployedAt: "2026-05-06T10:00:00Z",
      runbookPath: "docs/x.md", oncallHandle: "@m", evidenceOut: "/tmp/ev.json",
    };
    await expect(postIncidentRunbook(/* client */ {} as never, args, env))
      .rejects.toThrow(/PRODUCTION_APPROVAL_TOKEN/);
  });
});

describe("saveEvidence / assertNoToken", () => {
  const tmp = "/tmp/slack-ev-test.json";
  afterEach(() => { if (existsSync(tmp)) rmSync(tmp); });

  it("T9: schema を満たす JSON が書き出される", () => {
    saveEvidence(tmp, {
      ok: true, ts: "1700000000.000100", channel: "C_DRY",
      message: { permalink: "https://slack.com/..." }, mode: "dryrun",
      releaseVersion: "v1", deployedAt: "2026-05-06T10:00:00Z",
      commitSha: "abc1234", runbookPermalink: "https://github.com/...",
      deliveredAt: "2026-05-06T10:00:01Z",
    });
    const j = JSON.parse(readFileSync(tmp, "utf-8"));
    expect(j).toMatchObject({ ok: true, ts: expect.any(String), channel: expect.any(String), message: { permalink: expect.any(String) } });
  });

  it("T10: token 文字列を含む値で throw", () => {
    expect(() => assertNoToken({ leak: "xox[b]-AAAA-BBBB" })).toThrow(/forbidden token/);
    expect(() => assertNoToken({ auth: "Bearer abc" })).toThrow(/forbidden token/);
  });
});

describe("postIncidentRunbook (E2E with mocked WebClient)", () => {
  const env: RuntimeEnv = {
    SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "xox[b]-test",
    SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
    SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
    PRODUCTION_APPROVAL_TOKEN: "approved",
  };
  const baseArgs: CliArgs = {
    mode: "dryrun", releaseVersion: "v0.0.0-test",
    deployedAt: "2026-05-06T10:00:00Z",
    runbookPath: "docs/30-workflows/x/incident-runbook.md",
    oncallHandle: "@manju", evidenceOut: "/tmp/ev-dry.json",
  };

  it("T11: dryrun mode で dryrun channel id に postMessage する", async () => {
    postMessageMock.mockResolvedValue({ ok: true, ts: "1700.000", channel: "C_DRY" });
    getPermalinkMock.mockResolvedValue({ ok: true, permalink: "https://slack.com/x" });
    const { WebClient } = await import("@slack/web-api");
    await postIncidentRunbook(new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK), baseArgs, env);
    expect(postMessageMock).toHaveBeenCalledWith(expect.objectContaining({ channel: "C_DRY" }));
  });

  it("T12: evidence JSON が schema 準拠 + permalink/ts/channel を含む", async () => {
    postMessageMock.mockResolvedValue({ ok: true, ts: "1700.000", channel: "C_DRY" });
    getPermalinkMock.mockResolvedValue({ ok: true, permalink: "https://slack.com/x" });
    const { WebClient } = await import("@slack/web-api");
    await postIncidentRunbook(new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK), baseArgs, env);
    const j = JSON.parse(readFileSync(baseArgs.evidenceOut, "utf-8"));
    expect(j.ts).toBe("1700.000");
    expect(j.channel).toBe("C_DRY");
    expect(j.message.permalink).toBe("https://slack.com/x");
  });

  it("T13: Slack 401 (invalid_auth) で throw、token 値を message に含めない", async () => {
    postMessageMock.mockResolvedValue({ ok: false, error: "invalid_auth" });
    const { WebClient } = await import("@slack/web-api");
    await expect(
      postIncidentRunbook(new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK), baseArgs, env)
    ).rejects.toThrow(/invalid_auth/);
    expect(postMessageMock).toHaveBeenCalledTimes(1);
  });

  it("T14: 5xx で 1 回 retry、再失敗で fail", async () => {
    postMessageMock
      .mockRejectedValueOnce(Object.assign(new Error("server_error"), { code: "slack_webapi_platform_error", data: { error: "server_error" } }))
      .mockRejectedValueOnce(Object.assign(new Error("server_error"), { code: "slack_webapi_platform_error", data: { error: "server_error" } }));
    const { WebClient } = await import("@slack/web-api");
    await expect(
      postIncidentRunbook(new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK), baseArgs, env)
    ).rejects.toThrow();
    // WebClient 側 retryConfig.retries=1 により 2 回呼ばれる
    expect(postMessageMock).toHaveBeenCalledTimes(2);
  });
});

describe("token leak assertion (cross-cutting)", () => {
  it("T15: throw された Error message に xox[b]- が含まれない", async () => {
    postMessageMock.mockRejectedValue(new Error("auth failed token=xox[b]-leaky-AAA"));
    const { WebClient } = await import("@slack/web-api");
    try {
      await postIncidentRunbook(new WebClient("xox[b]-leaky-AAA"), {
        mode: "dryrun", releaseVersion: "v1", deployedAt: "2026-05-06T10:00:00Z",
        runbookPath: "docs/x.md", oncallHandle: "@m", evidenceOut: "/tmp/ev-leak.json",
      }, {
        SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "xox[b]-leaky-AAA",
        SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
        SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
      });
      expect.fail("should have thrown");
    } catch (e: unknown) {
      expect(String((e as Error).message)).not.toContain("xox[b]-leaky");
    }
  });
});
```

> 注: `postIncidentRunbook` 内で Error message を再 throw する際は `String(e?.message ?? "").replace(/xox[bpa]-[A-Za-z0-9-]+/g, "***")` で redact する設計を Phase 6 と整合させる。T15 はこの redact を強制する規約テスト。

## フィクスチャ内容（要点）

`__fixtures__/slack-postMessage-success.json`:

```json
{ "ok": true, "ts": "1714989600.000100", "channel": "C0DRYRUNXX",
  "message": { "text": "[dryrun] UBM兵庫 incident runbook — v0.0.0-test" } }
```

`__fixtures__/slack-postMessage-401.json`:

```json
{ "ok": false, "error": "invalid_auth" }
```

`__fixtures__/slack-getPermalink-success.json`:

```json
{ "ok": true, "channel": "C0DRYRUNXX", "message": { "permalink": "https://ubm-hyogo.slack.com/archives/C0DRYRUNXX/p1714989600000100" } }
```

## カバレッジ目標

- lines / branches / functions / statements: いずれも 80% 以上
- `slack-incident-runbook.ts` / `save-slack-evidence.ts` の export 関数全件にテスト 1 件以上紐付く

## 多角的チェック観点

- すべての `describe` ブロックが Phase 6 関数シグネチャと 1:1 対応
- channel 誤配信ガード（T5）/ production gate 欠落（T8）が必須テストに含まれる
- token leak 検証（T10 / T15）が二重に存在し、片方が壊れても検出可能
- 5xx retry の試行回数が `WebClient` の `retryConfig.retries` 設定と整合（T14）

## Definition of Done（Phase 7）

- [ ] テスト T1〜T15 の骨格が本ファイルに記載されている
- [ ] フィクスチャ 5 種の内容が確定している
- [ ] `vitest.workspace.ts` への追加 diff が記載されている
- [ ] `outputs/phase-07/main.md` に要点サマリ保存

## 参照

- phase-06.md（実装本体）
- `@slack/web-api` 公式 README の retry 設計
- 既存 monorepo の `vitest.workspace.ts`（参考）

## 次 Phase への引き渡し

Phase 8 へ:

- `pnpm --filter` 適切な workspace 名（`scripts-notify` プロジェクト）
- ローカル smoke 手順とフィクスチャの整合
- token leak 検証の `rg -F xox[b]-` ゲートとの二重防御
