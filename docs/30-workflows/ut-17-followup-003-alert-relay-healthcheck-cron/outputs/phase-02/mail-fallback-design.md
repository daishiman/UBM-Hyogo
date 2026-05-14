# Phase 2 / mail-fallback-design — outputs

[実装区分: 実装仕様書]

> **AC 紐付け**: AC-5

## 1. 採用方針

Slack 投稿失敗時のフォールバック通知は **Resend** (https://resend.com) を採用する。

| 評価軸 | Resend | MailChannels | Cloudflare Email Routing |
| --- | --- | --- | --- |
| 無料枠 | 3,000 通/月 | 制限なし | inbound only |
| SPF/DKIM | Resend 所有ドメイン使用で **検証不要** | 自社ドメイン検証必須 | outbound 不可 |
| 認証 | API key Bearer | 不要 | — |
| 送信元 | `onboarding@resend.dev` 等 | カスタムドメイン | — |
| 採用 | **採用** | 不採用 | 不採用 |

想定使用量: 週 1 回 healthcheck × Slack 失敗率（実態 0〜数 % 想定）≪ 月数通。3,000 通枠に対し誤差レベル。

## 2. 関数シグネチャ

```typescript
// apps/api/src/scheduled/healthcheck.ts (同ファイル内に併設)

export interface MailFallbackEnv {
  readonly HEALTHCHECK_FALLBACK_EMAIL?: string;
  readonly RESEND_API_KEY?: string;
  readonly ENVIRONMENT?: "production" | "staging" | "development";
}

export interface MailFallbackResult {
  readonly ok: boolean;
  readonly status?: number;
  readonly body?: string;
  readonly reason?: string;
}

export async function sendMailFallback(
  env: MailFallbackEnv,
  context: {
    readonly reason: string;
    readonly policyId: string;
    readonly slackStatus?: number;
    readonly slackBody?: string;
    readonly now: Date;
  },
  deps?: { fetch?: typeof fetch },
): Promise<MailFallbackResult>;
```

## 3. Resend API リクエスト仕様

| 項目 | 値 |
| --- | --- |
| Method | `POST` |
| URL | `https://api.resend.com/emails` |
| Header | `Authorization: Bearer ${env.RESEND_API_KEY}` |
| Header | `Content-Type: application/json` |
| Body | 下記 JSON |
| timeout | 10 秒（`AbortSignal.timeout(10_000)`） |
| retry | なし（healthcheck 自体が週 1 回のため、単発失敗は次週検出に委ねる）|

```json
{
  "from": "UBM-Hyogo Alerts <onboarding@resend.dev>",
  "to": ["${env.HEALTHCHECK_FALLBACK_EMAIL}"],
  "subject": "[UBM-Hyogo] UT-17 weekly healthcheck failed (${env.ENVIRONMENT})",
  "text": "UT-17 alert-relay 週次 healthcheck が失敗しました。\n\npolicy_id: ${policyId}\ntimestamp: ${now.toISOString()}\nreason: ${reason}\nslackStatus: ${slackStatus ?? 'n/a'}\nslackBody: ${slackBody ?? 'n/a'}\n\nSlack Incoming Webhook の revoke / drift / SLACK_WEBHOOK_URL secret 誤投入を疑い、月次 runbook (docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md) に従い trace してください。"
}
```

> `from` の固定値 `onboarding@resend.dev` は Resend のデフォルト sandbox 送信元。
> 本番運用で自社ドメイン経由送信に切り替えたい場合は Resend ドメイン認証を別途行い、`from` を差し替える（本タスク範囲外）。

## 4. 内部フロー

```
sendMailFallback(env, context, deps)
  │
  ├─ if (!env.RESEND_API_KEY)
  │     console.error("[ut17-healthcheck] resend key missing")
  │     return { ok: false, reason: "resend_key_missing" }
  │
  ├─ if (!env.HEALTHCHECK_FALLBACK_EMAIL)
  │     console.error("[ut17-healthcheck] fallback email missing")
  │     return { ok: false, reason: "fallback_email_missing" }
  │
  ├─ const fetcher = deps?.fetch ?? fetch
  ├─ try {
  │     const res = await fetcher("https://api.resend.com/emails", {
  │       method: "POST",
  │       headers: {
  │         "Authorization": `Bearer ${env.RESEND_API_KEY}`,
  │         "Content-Type": "application/json",
  │       },
  │       body: JSON.stringify(payload),
  │       signal: AbortSignal.timeout(10_000),
  │     })
  │     const body = await res.text()
  │     return { ok: res.ok, status: res.status, body }
  │   } catch (err) {
  │     return { ok: false, reason: "fetch_throw: ${err.message}" }
  │   }
```

## 5. エラー分類と運用挙動

| Resend 戻り値 | 判定 | healthcheck.ts 側結果 |
| --- | --- | --- |
| 200 / 202 | OK | `status: "slack_failed_mail_sent"` |
| 401 / 403 | API key 不正 / 失効 | `status: "slack_failed_mail_failed"`, `reason: "resend_auth"` |
| 422 | payload 不正 | `status: "slack_failed_mail_failed"`, `reason: "resend_validation"` |
| 429 | quota 枯渇 | `status: "slack_failed_mail_failed"`, `reason: "resend_quota"` |
| 5xx / timeout | Resend 側障害 | `status: "slack_failed_mail_failed"`, `reason: "resend_5xx_or_timeout"` |

すべての失敗ケースは Cloudflare Workers Logs に `console.error` で出る。Cloudflare Logs を tail することで最終検知点として使える。

## 6. テストケース対応

| ID | テスト内容 |
| --- | --- |
| T-04 | Slack 500 / Resend 200 → `slack_failed_mail_sent` |
| T-05 | Slack 500 / Resend 401 → `slack_failed_mail_failed` |
| T-07 | env.RESEND_API_KEY 未設定 → `mail_fallback_failed`, reason="resend_key_missing" |
| 追加 | Resend timeout (10s 超過) → `slack_failed_mail_failed`, reason="resend_5xx_or_timeout" |

モック方針: `deps.fetch` を `vi.fn()` で URL 別に振り分け、Resend エンドポイントのみ任意の Response を返す。

## 7. 変更対象ファイル

| パス | 区分 | 概要 |
| --- | --- | --- |
| `apps/api/src/scheduled/healthcheck.ts` | 新規（同ファイル内） | `sendMailFallback` を併設 |
| `apps/api/src/env.ts` | 編集 | `HEALTHCHECK_FALLBACK_EMAIL?` / `RESEND_API_KEY?` 追加（`env-binding-design.md` 参照） |
| `apps/api/src/scheduled/healthcheck.test.ts` | 新規 | T-04 / T-05 / T-07 + timeout ケース |

## 8. 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test src/scheduled/healthcheck.test.ts

# 手動 staging 確認（Slack 経路を一時的に不正値にして fallback を発火させる）
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
# 値: https://hooks.slack.com/services/INVALID
# Cloudflare Dashboard から "Trigger Cron" で "0 18 * * *" を月曜 UTC に手動発火
# Resend 宛にメールが届くことを確認
# 終了後、正しい URL に戻す
```

## 9. DoD

- [x] Resend 採用根拠と他案比較が記録されている
- [x] API リクエスト仕様（URL / headers / body / timeout）が示されている
- [x] 関数シグネチャ・I/O が TypeScript で明示
- [x] エラー分類と log 出力先が示されている
- [x] テストケース対応表（T-04, T-05, T-07, timeout）が示されている
- [x] 月間 quota 評価（週 1 × Slack 失敗率 ≪ 3,000 通/月）が記録されている
