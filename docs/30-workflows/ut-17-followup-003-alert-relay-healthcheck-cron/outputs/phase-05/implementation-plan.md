# Phase 5 成果物: 実装計画書（CONST_005 準拠）

[実装区分: 実装仕様書]

UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) の実装計画。
CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序）を
1 ファイルに集約し、Phase 6 以降が即着手できる粒度で固定する。

---

## A. 変更対象ファイル一覧

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `apps/api/src/scheduled/healthcheck.ts` | `runAlertRelayHealthcheck` / `buildHealthcheckPayload` / `isSlackResponseOk` / `sendFallbackMail` |
| 新規 | `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | vitest（Slack OK / fail-mail OK / fail-mail fail） |
| 編集 | `apps/api/src/env.ts` | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` optional 追加 |
| 編集 | `apps/api/src/index.ts` | `0 18 * * *` 分岐に Monday gate + `ctx.waitUntil(runAlertRelayHealthcheck(env, ctx))` |
| 編集（任意） | `apps/api/wrangler.toml` | `[triggers]` 直上にコメント追加（cron 値は変更しない） |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 役割分担 + 連続失敗閾値 |
| 外部 | Cloudflare Secrets（staging / production） | 上記 secret 投入 |
| 外部 | `.dev.vars.example` | `op://` 参照追記（必要時） |

> 削除なし。`apps/web/` 変更なし。`pnpm-lock.yaml` 変更なし（追加依存ゼロ）。

---

## B. 主要関数・型シグネチャ

```ts
// apps/api/src/scheduled/healthcheck.ts

export type HealthcheckPayload = {
  name: "UT-17 weekly healthcheck";
  severity: "info";
  ts: number;
  data: {
    healthcheck: true;
    triggeredAt: string; // ISO8601
  };
};

export type SlackResult = { ok: boolean; status: number; body: string };
export type MailResult  = { ok: boolean; status: number; bodySnippet: string };

export function buildHealthcheckPayload(now: Date): HealthcheckPayload;

export function isSlackResponseOk(status: number, body: string): boolean;
// 戻り値: status === 200 && body.trim() === "ok"

export async function postSlackHealthcheck(
  webhookUrl: string,
  payload: HealthcheckPayload,
): Promise<SlackResult>;
// Slack Incoming Webhook へ POST。本実装内で fetch を呼び、body を text() で必ず読む。

export async function sendFallbackMail(args: {
  apiKey: string;
  to: string;
  from?: string;       // 既定: Resend onboarding ドメイン
  subject: string;
  text: string;
}): Promise<MailResult>;
// https://api.resend.com/emails への POST。

export async function runAlertRelayHealthcheck(
  env: Env,
  ctx: ExecutionContext,
): Promise<void>;
// エントリポイント。env 未設定時 no-op。throw しない。
```

---

## C. 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `buildHealthcheckPayload` | now | HealthcheckPayload | なし（pure） |
| `isSlackResponseOk` | status, body | boolean | なし（pure） |
| `postSlackHealthcheck` | url, payload | SlackResult | HTTPS POST（fetch）。URL はログ非出力 |
| `sendFallbackMail` | apiKey, to, subject, text | MailResult | HTTPS POST（fetch）。apiKey はログ非出力 |
| `runAlertRelayHealthcheck` | env, ctx | Promise<void> | Slack POST → 必要時 Mail POST → console.{info,warn,error} |

## D. エラーハンドリング

`runAlertRelayHealthcheck` は cron 自体を fail させないため、内部で全 throw を握りつぶす:

```ts
export async function runAlertRelayHealthcheck(env, ctx) {
  const url = env.SLACK_WEBHOOK_URL_HEALTHCHECK;
  if (!url) {
    console.warn("[alertRelayHealthcheck] skipped: SLACK_WEBHOOK_URL_HEALTHCHECK is not set");
    return;
  }
  const payload = buildHealthcheckPayload(new Date());
  let slack: SlackResult;
  try {
    slack = await postSlackHealthcheck(url, payload);
  } catch (err) {
    slack = { ok: false, status: 0, body: err instanceof Error ? err.message : String(err) };
  }
  if (isSlackResponseOk(slack.status, slack.body)) {
    console.info("[alertRelayHealthcheck] slack ok", { status: slack.status });
    return;
  }
  console.warn("[alertRelayHealthcheck] slack failed", { status: slack.status });
  // mail fallback
  const apiKey = env.RESEND_API_KEY ?? env.MAIL_PROVIDER_KEY;
  const to = env.HEALTHCHECK_FALLBACK_EMAIL;
  if (!apiKey || !to) {
    console.error("[alertRelayHealthcheck] mail fallback unavailable: missing apiKey or to");
    return;
  }
  const mail = await sendFallbackMail({
    apiKey,
    to,
    subject: "[UT-17] healthcheck failed",
    text: `UT-17 weekly healthcheck failed at ${payload.data.triggeredAt}. Slack status=${slack.status}.`,
  });
  if (!mail.ok) {
    console.error("[alertRelayHealthcheck] mail fallback failed", { status: mail.status });
  } else {
    console.info("[alertRelayHealthcheck] mail fallback sent", { status: mail.status });
  }
}
```

## E. 依存ライブラリ

| 用途 | 採用 |
| --- | --- |
| HTTP | `fetch`（Workers 標準） |
| 環境変数検証 | 既存 `zod`（既に env.ts で採用済み） |
| Slack 投稿 | 追加 SDK なし |
| メール送信 | 追加 SDK なし（Resend REST 直接 POST） |

**追加 npm 依存ゼロ。`pnpm-lock.yaml` 差分なしを目標。**

---

## F. 実装順序（T1〜T9 の確定版）

```
T1 env schema     → T3 healthcheck.ts → T4 index.ts 配線 → T5 vitest
T2 Secret 投入 ───────────────┐                           │
                              └──────────────────► T6 staging
                                                           ↓
                                                  T7 wrangler コメント (任意)
                                                           ↓
                                                  T8 runbook 更新
                                                           ↓
                                                  T9 production deploy
```

---

## G. ローカル実行コマンド

```bash
# 型チェック
mise exec -- pnpm --filter @ubm/api typecheck

# Lint
mise exec -- pnpm --filter @ubm/api lint

# 新規 vitest（focused）
mise exec -- pnpm --filter @ubm/api test scheduled/healthcheck

# カバレッジ
mise exec -- pnpm --filter @ubm/api test:coverage -- scheduled/healthcheck

# staging deploy（T6）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# production deploy（T9）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

> `@ubm/api` package 名はリポジトリの `apps/api/package.json#name` に従う（`@ubm-hyogo/api` の場合あり）。実行前に確認する。

---

## H. DoD（Definition of Done）

- [ ] `apps/api/src/scheduled/healthcheck.ts` の 5 export が揃い、typecheck PASS
- [ ] `apps/api/src/env.ts` に 2(〜3) optional 項目追加、`getEnv()` 経由で読める
- [ ] `apps/api/src/index.ts` の `0 18 * * *` 分岐に Monday gate + `ctx.waitUntil` 起動が入っている
- [ ] vitest 3 ケース PASS、line coverage ≥ 80%
- [ ] cron 本数据置（`apps/api/wrangler.toml` の `crons` 配列長は変わらない）
- [ ] staging で正常系 + mail fallback 系の動作 evidence あり
- [ ] 月次 runbook に役割分担と連続失敗閾値が記載されている
- [ ] production deploy 後、初回月曜発火 or Dashboard `Trigger Now` で通知到達確認
- [ ] Slack Webhook URL / Resend API key がログ・docs・PR 本文に露出していない
