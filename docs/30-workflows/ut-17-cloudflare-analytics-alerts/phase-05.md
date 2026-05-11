# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (テスト戦略) |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 4 で固定した T1〜T11 のうち T3〜T7（コア実装）は `apps/api` 配下に新規モジュール 4 つ + route 1 本 + middleware 1 本 + 型定義 1 本 + vitest 3 本を **実コードとして実装する**。本 Phase はそのコード実装の着手前計画として、変更対象ファイル・関数シグネチャ・型・依存・実装順序を CONST_005 必須項目に沿って固定する。 |

---

## 目的

Phase 4 のサブタスク T1〜T11 を、Phase 06（テスト戦略）以降が即着手できる粒度まで具体化する。
本 Phase の出力は CONST_005（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序）の
全項目を満たす `outputs/phase-05/implementation-plan.md` を中心に構成する。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 新規 | `apps/api/src/routes/internal/alert-relay.ts` | Cloudflare Notification 受信 route handler（Hono） | T3 |
| 新規 | `apps/api/src/middleware/verify-cf-webhook-auth.ts` | cf-webhook-auth fixed-secret 検証 middleware（Hono） | T4 |
| 新規 | `apps/api/src/lib/cf-webhook-auth.ts` | cf-webhook-auth 検証 pure function（timing-safe 比較） | T4 |
| 新規 | `apps/api/src/lib/cloudflare-alert-formatter.ts` | Cloudflare Notification payload → Slack Block Kit formatter | T5 |
| 新規 | `apps/api/src/lib/slack-sender.ts` | Slack Incoming Webhook 送信 + リトライ | T6 |
| 新規 | `apps/api/src/types/cloudflare-notification.ts` | Cloudflare Notification payload 型定義 | T5 |
| 型定義 | `apps/api/src/lib/cloudflare-alert-formatter.ts` | Slack Block Kit message 型を formatter と同居 | T5 |
| 編集 | `apps/api/src/index.ts` | `app.route('/internal/alert-relay', alertRelayRouter)` 登録 | T3 |
| 外部操作 | `apps/api/wrangler.toml` / Cloudflare Secrets | Secret 値は `wrangler.toml` に宣言しない。T2 で `bash scripts/cf.sh secret put` | T2 |
| 外部操作 | `.dev.vars.example` | 本サイクルでは未編集。ローカル値はユーザー環境で `op://` 参照を使う | T1 |
| 新規 | `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | route 結合テスト | T7 |
| 新規 | `apps/api/src/lib/__tests__/cloudflare-alert-formatter.test.ts` | formatter ユニットテスト | T7 |
| 新規 | `apps/api/src/lib/__tests__/cf-webhook-auth.test.ts` | cf-webhook-auth verifier ユニットテスト | T7 |
| 新規 | `apps/api/src/lib/__tests__/slack-sender.test.ts` | Slack sender retry / redaction テスト | T7 |
| 新規 | `outputs/phase-09/notification-policy-config.md` | Cloudflare Dashboard 設定 evidence（4 policy の値テーブル + スクショパス） | T9 |
| 新規 | `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md` | アラート受信時の一次対応手順 | T11 |
| 新規 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 月次 webhook ヘルスチェック手順 | T11 |

> 削除ファイルなし。`apps/web/` 配下は変更しない（D1 直アクセス禁止条件と独立だが、本タスクスコープ外）。

---

## 5-2. 主要関数シグネチャ・型定義

### 5-2-1. 型定義（`apps/api/src/types/cloudflare-notification.ts`）

```ts
/**
 * Cloudflare Notification webhook payload（Workers / D1 / Pages / R2 共通エンベロープ）
 * 公式 docs: https://developers.cloudflare.com/notifications/get-started/configure-webhooks/
 */
export type CloudflareNotificationPayload = {
  name: string;                    // 例: "Workers Requests > 80%"
  text: string;                    // Cloudflare 既定の英語本文
  data: {
    alert_type: string;            // "billing_usage_alert" 等
    metric?: string;               // "workers_requests" | "d1_rows_read" | "pages_builds" | "r2_class_a_operations" | string
    threshold_pct?: number;        // 80
    current_value?: number;
    quota?: number;
    account_id?: string;
    [key: string]: unknown;
  };
  ts: number;                      // unix epoch ms
};

export type SupportedMetric =
  | 'workers_requests'
  | 'd1_rows_read'
  | 'pages_builds'
  | 'r2_class_a_operations';
```

### 5-2-2. 型定義（formatter 内部）

```ts
export type SlackBlock =
  | { type: 'header'; text: { type: 'plain_text'; text: string } }
  | { type: 'section'; text: { type: 'mrkdwn'; text: string } }
  | { type: 'context'; elements: Array<{ type: 'mrkdwn'; text: string }> }
  | { type: 'divider' };

export type SlackMessageBlocks = {
  blocks: SlackBlock[];
  text: string;          // fallback（プッシュ通知用の plain text）
};
```

### 5-2-3. cf-webhook-auth verifier（`apps/api/src/lib/cf-webhook-auth.ts`）

```ts
/**
 * Cloudflare Notification webhook の cf-webhook-auth 固定シークレット検証。
 * 文字列は timing-safe に比較し、追加 npm 依存は不要。
 *
 * 入力: cf-webhook-auth ヘッダ値と共有 secret
 * 出力: ok / missing-secret / missing-header / mismatch
 * 副作用: なし（pure function）
 */
export function verifyCfWebhookAuth(
  headerValue: string | null | undefined,
  expectedSecret: string | null | undefined,
): CfWebhookAuthResult;
```

### 5-2-4. Formatter（`apps/api/src/lib/cloudflare-alert-formatter.ts`）

```ts
/**
 * Cloudflare Notification payload を日本語の Slack Block Kit メッセージに整形する pure function。
 * 既知メトリクス 4 種は専用テンプレ、未知メトリクスは generic テンプレでフォールバック。
 *
 * 入力: CloudflareNotificationPayload
 * 出力: SlackMessageBlocks（header / section / context / divider）
 * 副作用: なし（pure function）
 */
export function formatCloudflareAlertToJa(
  payload: CloudflareNotificationPayload,
): SlackMessageBlocks;
```

メトリクス別の日本語ラベル / 単位（formatter 内部定数）:

| metric | 日本語ラベル | 単位 | 無料枠基準 |
| --- | --- | --- | --- |
| `workers_requests` | Workers リクエスト数 | req/日 | 100,000 |
| `d1_rows_read` | D1 読み取り行数 | rows/日 | 5,000,000 |
| `pages_builds` | Pages ビルド数 | builds/月 | 500 |
| `r2_class_a_operations` | R2 Class A 操作数 | ops/月 | 1,000,000 |
| 未知 metric | （payload の生 metric 名） | （単位記載なし） | （quota / current_value から自動算出） |

### 5-2-5. Slack sender（`apps/api/src/lib/slack-sender.ts`）

```ts
/**
 * Slack Incoming Webhook へ Block Kit メッセージを送信する。
 * 429 / 5xx / network error は最大 3 回 exponential backoff（200ms / 500ms / 1500ms）でリトライ、その他 4xx は即時失敗。
 *
 * 入力: webhookUrl, blocks
 * 出力: Response（最終応答）
 * 副作用: HTTPS POST（fetch）。webhookUrl はログに出力しない（PII 同等扱い）
 * エラー: 4xx / 3 回連続 5xx で throw（route handler 側で 502 を返す）
 */
export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackBlockKitMessage,
): Promise<SendSlackResult>;
```

### 5-2-6. Middleware + Route（`apps/api/src/middleware/verify-cf-webhook-auth.ts` / `apps/api/src/routes/internal/alert-relay.ts`）

```ts
// middleware
export const verifyCfWebhookAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  // cf-webhook-auth header → verifyCfWebhookAuth() → 不一致時 401
};

// route
const alertRelayRouter = new Hono<{ Bindings: Env }>();
alertRelayRouter.post('/', verifyCfWebhookAuth, async (c) => {
  // payload parse → formatCloudflareAlertToJa() → sendSlackMessage()
  // 成功 200、formatter throw 時 422、sender throw 時 502
});
export default alertRelayRouter;
```

---

## 5-3. 入出力・副作用・エラーハンドリング

| 関数 | 入力 | 出力 | 副作用 | エラー時の挙動 |
| --- | --- | --- | --- | --- |
| `verifyCfWebhookAuth` | header, secret | CfWebhookAuthResult | なし | header 欠落 → missing-header（throw しない） |
| `formatCloudflareAlertToJa` | payload | SlackMessageBlocks | なし | payload.data.metric が未知 → generic テンプレで継続（throw しない） |
| `sendSlackMessage` | url, message | SendSlackResult | HTTPS POST | 429 / 5xx / network retry、その他 4xx 即時 failure |
| route handler | Request | Response (200 / 401 / 422 / 502) | sender 経由で Slack 送信 | 401（cf-webhook-auth 不一致）/ 422（payload 不正）/ 502（Slack 配信失敗） |

---

## 5-4. 依存ライブラリ方針

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| HTTP framework | 既存 `hono` | `apps/api` で既に採用済み |
| cf-webhook-auth | Workers 互換の timing-safe string comparison | Cloudflare generic webhook は fixed-secret header 契約。body HMAC は採用しない |
| Slack 送信 | `fetch`（Workers 標準） | 同上。`@slack/web-api` 等は使用しない |
| 型バリデーション | 既存採用済みなら `zod`、未採用なら任意（最小限） | 既存方針に従う。本 Phase 5 では「既存方針に従う」と固定し、Phase 9 品質保証で確認 |

> **追加依存ゼロ**を原則とする。`pnpm-lock.yaml` の差分は `wrangler.toml` 編集に伴う既存依存の解決のみ想定。

---

## 5-5. wrangler.toml 編集差分（擬似 TOML）

```toml
# apps/api/wrangler.toml — 既存設定への追記想定
[env.staging]
# ... 既存設定 ...
# Secret は wrangler.toml に直接書かない（cf.sh secret put で投入）
# 宣言だけ必要な場合は [[env.staging.secrets]] のような擬似宣言ではなく
# 実体は scripts/cf.sh secret put で staging / production 両方に投入する

[env.production]
# 同上
```

実際の Secret 投入コマンド（Phase 8 デプロイ計画で再掲）:

```bash
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put CF_WEBHOOK_AUTH_SECRET --config apps/api/wrangler.toml --env production
```

`.dev.vars.example` 追記:

```
SLACK_WEBHOOK_URL=op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL
CF_WEBHOOK_AUTH_SECRET=op://Personal/cloudflare-alert-relay/CF_WEBHOOK_AUTH_SECRET
```

---

## 5-6. 実装順序（T1〜T11 詳細）

| 順 | サブタスク | 着手前条件 | 完了判定 |
| --- | --- | --- | --- |
| 1 | T1 | Phase 03 GO + Slack channel 確定 | `.dev.vars.example` 更新 + 1Password 項目存在 |
| 2 | T2 | T1 完了 | `cf.sh secret list` で 2 secret × 2 env が表示 |
| 3 | T3 | T2 完了 | `app.route` 登録 + `pnpm typecheck` PASS |
| 4 | T4 | T3 完了 | `cf-webhook-auth.test.ts` 4 ケース PASS |
| 5 | T5 | Phase 02 spec | `cloudflare-alert-formatter.test.ts` 5 ケース PASS |
| 6 | T6 | T5 完了 | `slack-sender` リトライテスト PASS（mock fetch） |
| 7 | T7 | T4〜T6 完了 | `pnpm --filter @ubm-hyogo/api test` 全 PASS / coverage ≥ 80% |
| 8 | T8 | T7 完了 | staging 環境で curl 投入 → Slack staging channel 受信 |
| 9 | T9 | T8 完了 | Cloudflare Dashboard で 4 policy 設定 + evidence 記録 |
| 10 | T10 | T9 完了 | production 環境で本番 channel 受信 |
| 11 | T11 | T10 完了 | runbook 2 ファイル更新 + Phase 12 same-wave sync 準備完了 |

---

## 5-7. 不変条件チェック

- [ ] `apps/web` には変更を加えない
- [ ] D1 直接アクセスを追加しない（本タスクは relay Worker のみ）
- [ ] Secret は 1Password → Cloudflare Secrets 経由のみ。`.env` 実値書き込み禁止
- [ ] `wrangler` 直接実行禁止。すべて `bash scripts/cf.sh` 経由
- [ ] UT-08-IMPL（WAE custom alerts）と関数 / 経路を共有しない（独立 route `/internal/alert-relay`）
- [ ] PII / Webhook URL は構造化ログに出力しない

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL | 通知先 Slack channel の共有 | channel 名のみ参照（Webhook URL は別 Secret） |
| UT-07 | 通知基盤の正本 | Slack channel 決定の入力 |
| 05a parallel observability | runbook 差分追記 | T11 で追記方式 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-04.md | T1〜T11 の入力 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-02.md | Notification Policy 設定値 / Slack message blocks 仕様 |
| 必須 | apps/api/src/index.ts | route 登録箇所の現状把握 |
| 必須 | apps/api/wrangler.toml | Secret 宣言箇所の現状把握 |
| 参考 | https://developers.cloudflare.com/notifications/get-started/configure-webhooks/ | Cloudflare Notification webhook 公式 |
| 参考 | https://api.slack.com/block-kit/building | Slack Block Kit 構築 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers Web Crypto API |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 必須項目を満たす実装計画書 |
| ドキュメント | outputs/phase-05/file-change-list.md | 変更対象ファイル一覧（Phase 13 PR 本文の元データ） |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] CONST_005 の必須項目（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存 / 実装順序）が全て埋まっている
- [ ] 追加 npm 依存ゼロが確認されている
- [ ] Secret 投入手順が `bash scripts/cf.sh secret put` で記述されている（`wrangler` 直接実行なし）
- [ ] 5-1 ファイル一覧と 5-6 実装順序が T1〜T11 と整合している
- [ ] outputs/phase-05 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（テスト戦略）
- 引き継ぎ事項:
  - 5-2 の関数シグネチャは Phase 6 のユニットテストケース設計の基礎となる
  - 5-3 の入出力・エラーハンドリングは異常系テスト観点に展開される
  - formatter のメトリクス別日本語ラベルは Phase 6 で snapshot test の期待値となる
- ブロック条件: CONST_005 必須項目に欠落がある場合は Phase 4 へ差し戻す
