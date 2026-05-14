# Phase 6 成果物: 実装手順書（S1〜S9 ステップバイステップ）

[実装区分: 実装仕様書]

UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) の実装手順。
本ドキュメント単体を見ながら手を動かせる粒度で記述する。

---

## S1. `apps/api/src/env.ts` の Env interface 拡張

### 対象
- ファイル: `apps/api/src/env.ts`
- 関数: 既存 `envSchema`（zod object）

### 手順
1. 既存 schema 内に以下 3 項目を `.optional()` で追加する。
2. 既存 secret には触らない。

### 挿入する snippet
```ts
SLACK_WEBHOOK_URL_HEALTHCHECK: z.string().url().optional(),
HEALTHCHECK_FALLBACK_EMAIL: z.string().email().optional(),
RESEND_API_KEY: z.string().min(1).optional(),  // MAIL_PROVIDER_KEY 流用時は省略可
```

### 完了判定
- `mise exec -- pnpm --filter @ubm/api typecheck` PASS

---

## S2. Cloudflare Secrets の投入

### 対象
- Cloudflare Workers Secrets（staging / production）
- 1Password Personal Vault `cloudflare-alert-relay`

### 手順
1. 1Password で healthcheck 用 Slack channel の Incoming Webhook URL を発行・登録（item: `SLACK_WEBHOOK_URL_HEALTHCHECK`）。
2. 1Password に運用者メールアドレスを登録（item: `HEALTHCHECK_FALLBACK_EMAIL`）。
3. Resend を新規鍵で運用する場合のみ、1Password に Resend API key を登録（item: `RESEND_API_KEY`）。
4. 以下を実行:

```bash
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL    --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL    --config apps/api/wrangler.toml --env production
# 必要時のみ
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env production
```

### 完了判定
- `bash scripts/cf.sh secret list --env staging` / `--env production` に上記 secret が表示

---

## S3. `apps/api/src/scheduled/healthcheck.ts`（新規）

### 対象
- ファイル: 新規 `apps/api/src/scheduled/healthcheck.ts`

### 実装順
1. import: `import type { Env } from "../env";`
2. 型定義: `HealthcheckPayload` / `SlackResult` / `MailResult`
3. pure 関数: `buildHealthcheckPayload(now)` / `isSlackResponseOk(status, body)`
4. fetch ラッパ: `postSlackHealthcheck` / `sendFallbackMail`
5. エントリ: `runAlertRelayHealthcheck(env, ctx)`

### コード骨子
```ts
import type { Env } from "../env";

export type HealthcheckPayload = {
  name: "UT-17 weekly healthcheck";
  severity: "info";
  ts: number;
  data: { healthcheck: true; triggeredAt: string };
};
export type SlackResult = { ok: boolean; status: number; body: string };
export type MailResult  = { ok: boolean; status: number; bodySnippet: string };

export function buildHealthcheckPayload(now: Date): HealthcheckPayload {
  return {
    name: "UT-17 weekly healthcheck",
    severity: "info",
    ts: now.getTime(),
    data: { healthcheck: true, triggeredAt: now.toISOString() },
  };
}

export function isSlackResponseOk(status: number, body: string): boolean {
  return status === 200 && body.trim() === "ok";
}

export async function postSlackHealthcheck(
  webhookUrl: string,
  payload: HealthcheckPayload,
): Promise<SlackResult> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `UT-17 weekly healthcheck OK at ${payload.data.triggeredAt}`,
    }),
  });
  const body = await res.text();
  return { ok: isSlackResponseOk(res.status, body), status: res.status, body };
}

export async function sendFallbackMail(args: {
  apiKey: string;
  to: string;
  from?: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      from: args.from ?? "onboarding@resend.dev",
      to: [args.to],
      subject: args.subject,
      text: args.text,
    }),
  });
  const text = await res.text();
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    bodySnippet: text.slice(0, 200),
  };
}

export async function runAlertRelayHealthcheck(
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const url = env.SLACK_WEBHOOK_URL_HEALTHCHECK;
  if (!url) {
    console.warn("[alertRelayHealthcheck] skipped: SLACK_WEBHOOK_URL_HEALTHCHECK not set");
    return;
  }
  const payload = buildHealthcheckPayload(new Date());
  let slack: SlackResult;
  try {
    slack = await postSlackHealthcheck(url, payload);
  } catch (err) {
    slack = { ok: false, status: 0, body: err instanceof Error ? err.message : String(err) };
  }
  if (slack.ok) {
    console.info("[alertRelayHealthcheck] slack ok", { status: slack.status });
    return;
  }
  console.warn("[alertRelayHealthcheck] slack failed", { status: slack.status });

  const apiKey = env.RESEND_API_KEY ?? env.MAIL_PROVIDER_KEY;
  const to = env.HEALTHCHECK_FALLBACK_EMAIL;
  if (!apiKey || !to) {
    console.error("[alertRelayHealthcheck] mail fallback unavailable: missing apiKey or to");
    return;
  }
  let mail: MailResult;
  try {
    mail = await sendFallbackMail({
      apiKey,
      to,
      subject: "[UT-17] healthcheck failed",
      text: `UT-17 weekly healthcheck failed at ${payload.data.triggeredAt}. Slack status=${slack.status}.`,
    });
  } catch (err) {
    console.error("[alertRelayHealthcheck] mail fallback threw", {
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }
  if (mail.ok) {
    console.info("[alertRelayHealthcheck] mail fallback sent", { status: mail.status });
  } else {
    console.error("[alertRelayHealthcheck] mail fallback failed", { status: mail.status });
  }
}
```

### 完了判定
- typecheck PASS / lint PASS
- 5 export が外部から import 可能

---

## S4. `apps/api/src/index.ts` の handler 配線

### 対象
- ファイル: `apps/api/src/index.ts`
- 箇所: `if (cron === "0 18 * * *") { ... return; }` 分岐の末尾 `return;` の直前

### 手順
1. ファイル冒頭の import 群に追加:
   ```ts
   import { runAlertRelayHealthcheck } from "./scheduled/healthcheck";
   ```
2. `0 18 * * *` 分岐の `return;` 直前に挿入:
   ```ts
   // UT-17 followup-003 (Issue #635): 月曜のみ weekly healthcheck
   const scheduledAt = new Date(
     (event as ScheduledController & { scheduledTime?: number }).scheduledTime ?? Date.now(),
   );
   if (scheduledAt.getUTCDay() === 1) {
     ctx.waitUntil(runAlertRelayHealthcheck(env, ctx));
   }
   ```

### 完了判定
- typecheck / lint PASS
- 既存 `runSchemaSync` / `runRetentionPurge` の `ctx.waitUntil` 呼び出しに干渉していない

---

## S5. vitest 新規 3 ケース

### 対象
- ファイル: 新規 `apps/api/src/scheduled/__tests__/healthcheck.test.ts`

### テストケース

| # | シナリオ | fetch mock | 期待 |
| --- | --- | --- | --- |
| HC-01 | Slack 200 / "ok" | 1 回呼 200 / body="ok" | console.info 1 回、mail 未呼出 |
| HC-02 | Slack 200 / "no_service" → Mail OK | 1 回目 Slack 200/"no_service"、2 回目 Resend 200 | console.warn + mail fallback sent |
| HC-03 | Slack 404 → Mail 500 | 1 回目 Slack 404、2 回目 Resend 500 | console.error 1 回（mail failed） |

### コード骨子
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runAlertRelayHealthcheck } from "../healthcheck";

const env = {
  SLACK_WEBHOOK_URL_HEALTHCHECK: "https://hooks.slack.com/services/T/B/X",
  HEALTHCHECK_FALLBACK_EMAIL: "ops@example.com",
  RESEND_API_KEY: "re_test_xxx",
} as unknown as Parameters<typeof runAlertRelayHealthcheck>[0];
const ctx = { waitUntil: vi.fn() } as unknown as ExecutionContext;

const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("runAlertRelayHealthcheck", () => {
  it("HC-01: Slack 200/ok で mail を呼ばない", async () => {
    fetchMock.mockResolvedValueOnce(new Response("ok", { status: 200 }));
    await runAlertRelayHealthcheck(env, ctx);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("HC-02: Slack 200/no_service で mail fallback 成功", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no_service", { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: "x" }), { status: 200 }));
    await runAlertRelayHealthcheck(env, ctx);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.resend.com/emails");
  });
  it("HC-03: Slack 404 で mail も 500（throw しない）", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));
    fetchMock.mockResolvedValueOnce(new Response("err", { status: 500 }));
    await expect(runAlertRelayHealthcheck(env, ctx)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```

### 完了判定
- `mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck` 全 PASS
- line coverage ≥ 80%

---

## S6. `apps/api/wrangler.toml` のコメント追記（任意）

### 対象
- ファイル: `apps/api/wrangler.toml`

### 手順
- `[triggers]` の直上に以下のコメントを追記する。`crons` 値は変更しない。

```toml
# daily branch (0 18 * * * = 03:00 JST):
#   - schema sync (UT-03a)
#   - retention purge (issue-402)
#   - weekly healthcheck (Mon UTC only, UT-17 followup-003 / Issue #635)
```

`[env.staging.triggers]` / `[env.production.triggers]` 直上にも同コメントを追加。

### 完了判定
- `crons` 配列長 3 のまま据置
- `pnpm typecheck` / `pnpm lint` PASS

---

## S7. 月次 runbook 更新

### 対象
- ファイル: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

### 手順
冒頭セクションに以下を追加:

```md
## 役割分担（UT-17 followup-003 / Issue #635 以降）

- **定常監視**: Cloudflare Workers cron `0 18 * * *`（UTC 月曜のみ実発火）による週次 healthcheck。
  Slack `#alerts-healthcheck` への投稿成否でリレー経路の生死を判定する。
- **本 runbook**: 四半期に 1 回の詳細確認、または cron が **連続 2 回（= 2 週間）失敗**したときの deep-dive。
```

連続失敗閾値:

```md
### Cron 失敗時の閾値
- 1 回目失敗: Resend からのフォールバックメールが届く。**ただちに本 runbook を起動しなくてよい**（Slack 一時障害の可能性）。
- 2 回連続失敗（= 2 週間）: 本 runbook を即時起動し、SLACK_WEBHOOK_URL_HEALTHCHECK / Cloudflare Secrets / Slack app の状態を順に確認する。
```

### 完了判定
- runbook 冒頭で役割分担が読める
- 連続 2 回失敗の閾値が明示

---

## S8. staging deploy + 動作確認

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

### 動作確認

1. **正常系**: Cloudflare Dashboard → Workers → 該当 worker → Triggers → Cron Triggers の `0 18 * * *` を `Trigger Now` で発火。
   - 期待: `#alerts-healthcheck` (staging) に「UT-17 weekly healthcheck OK at ...」が到達。
2. **異常系（Slack URL drift）**: `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env staging` で意図的に無効な URL を投入し、`Trigger Now` 再実行。
   - 期待: `HEALTHCHECK_FALLBACK_EMAIL` 宛てに「[UT-17] healthcheck failed」が到達。
3. **復旧**: 元の URL を再投入し `Trigger Now` で正常系を再確認。

### 完了判定
- 正常系 / 異常系の evidence を `outputs/phase-08/staging-evidence.md` に記録
- `wrangler tail` の log に webhook URL 値が出力されていない（Phase 7 のセキュリティ方針）

---

## S9. production deploy

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

### 動作確認
- 翌週月曜 03:00 JST の自動発火を待つ、または Dashboard `Trigger Now` で即時確認。
- production `#alerts-healthcheck` channel に通知到達を確認。

### 完了判定
- production deploy 成功
- 通知到達確認

---

## 不変条件最終チェック

- [ ] `apps/web/` 配下のファイルを変更していない
- [ ] D1 直接アクセス追加なし
- [ ] Slack Webhook URL / Resend API key がログ・docs・コード comment に書かれていない
- [ ] `apps/api/wrangler.toml` の `crons` 配列長は 3 のまま
- [ ] `pnpm-lock.yaml` に新規依存が増えていない
- [ ] `wrangler` 直接実行なし（全て `bash scripts/cf.sh` 経由）

## ローカル実行コマンド集

```bash
mise exec -- pnpm --filter @ubm/api typecheck
mise exec -- pnpm --filter @ubm/api lint
mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck
mise exec -- pnpm --filter @ubm/api test:coverage -- scheduled/healthcheck
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```
