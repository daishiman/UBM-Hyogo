# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (テスト戦略) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 4 で固定した T1〜T9 のうち T3〜T5（コア実装）は `apps/api/src/scheduled/healthcheck.ts` 新規モジュール、`apps/api/src/env.ts` 編集、`apps/api/src/index.ts` 編集、vitest 1 本を **実コードとして実装する**。本 Phase はそのコード実装の着手前計画として、変更対象ファイル・関数シグネチャ・型・依存・実装順序を CONST_005 必須項目に沿って固定する。 |

---

## 目的

Phase 4 のサブタスク T1〜T9 を、Phase 06（テスト戦略）以降が即着手できる粒度まで具体化する。
本 Phase の出力は CONST_005（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序）の
全項目を満たす `outputs/phase-05/implementation-plan.md` を中心に構成する。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 新規 | `apps/api/src/scheduled/healthcheck.ts` | 週次 healthcheck 主処理（payload 構築 + alert-relay 内部呼び出し + Slack 戻り値判定 + mail fallback） | T3 |
| 新規 | `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | vitest 3 ケース（Slack OK / Slack fail-mail OK / Slack fail-mail fail） | T5 |
| 編集 | `apps/api/src/env.ts` | Env interface に `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?`（必要時 `RESEND_API_KEY?`）を optional 追加 | T1 |
| 編集 | `apps/api/src/index.ts` | `scheduled` handler の `0 18 * * *` 分岐に Monday gate (`getUTCDay() === 1`) で `runAlertRelayHealthcheck` を `ctx.waitUntil` 起動する | T4 |
| 編集（任意） | `apps/api/wrangler.toml` | `[triggers] crons` 行直上にコメント「daily branch: schema sync / retention purge / weekly healthcheck(Mon)」を追加（cron 値は変更しない） | T7 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | cron 自動化との役割分担追記・連続失敗閾値定義 | T8 |
| 外部操作 | Cloudflare Secrets | `SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL`（Var でも可）/ `RESEND_API_KEY`（`MAIL_PROVIDER_KEY` 流用時は不要）を staging / production 両方に投入 | T2 |
| 外部操作 | `.dev.vars.example` | `op://` 参照を追記（必要時） | T2 |
| 新規（任意） | `outputs/phase-08/staging-evidence.md` | staging 動作確認ログ | T6 |

> 削除ファイルなし。`apps/web/` 配下は変更しない。新規 cron は **追加せず**、既存 `0 18 * * *` daily branch へ相乗りする（Workers 無料枠の cron 3 本上限維持）。

---

## 5-2. 主要関数シグネチャ・型定義

### 5-2-1. env schema 拡張（`apps/api/src/env.ts`）

```ts
// 既存 schema へ optional 追加（diff のみ）
export const envSchema = z.object({
  // ... 既存 fields ...
  SLACK_WEBHOOK_URL_HEALTHCHECK: z.string().url().optional(),
  HEALTHCHECK_FALLBACK_EMAIL: z.string().email().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),  // 既存 MAIL_PROVIDER_KEY 流用時は追加不要
});
```

> `SLACK_WEBHOOK_URL_HEALTHCHECK` 未設定時は本タスクが no-op となる（healthcheck をスキップして cron は fail させない）。

### 5-2-2. healthcheck 主処理（`apps/api/src/scheduled/healthcheck.ts`）

```ts
import type { Env } from "../env";

/**
 * UT-17 weekly healthcheck エントリポイント。
 *
 * 入力: env（scheduled handler の env を共有）, ctx（ExecutionContext）
 * 出力: Promise<void>（cron 自体は fail させない設計）
 * 副作用:
 *   1. alert-relay 内部処理関数を直接呼び出し（service binding ではなく関数 import）
 *   2. Slack Incoming Webhook へ POST（戻り値 status === 200 && body.trim() === "ok" のみ成功）
 *   3. Slack 失敗時のみ Resend (or MailChannels) でフォールバックメール送信
 * エラー:
 *   - SLACK_WEBHOOK_URL_HEALTHCHECK 未設定 → 即 return（no-op）
 *   - Slack 200 だが body !== "ok" → fail とみなして mail fallback
 *   - Slack 非 200 → mail fallback
 *   - mail fallback も失敗 → console.error のみ（throw しない）
 */
export async function runAlertRelayHealthcheck(
  env: Env,
  ctx: ExecutionContext,
): Promise<void>;

/**
 * healthcheck 用 payload を構築する pure function。
 * 本物アラートと識別可能なマーカー: name / severity / data.healthcheck = true を固定。
 */
export function buildHealthcheckPayload(now: Date): HealthcheckPayload;

/**
 * Slack Incoming Webhook 戻り値判定。
 * 公式仕様: 成功時 body = plain text "ok"。revoke 後でも 200 を返すケースがあるため body も必ず確認する。
 */
export function isSlackResponseOk(status: number, body: string): boolean;

/**
 * Resend 経由のフォールバックメール送信。
 * 入力: apiKey, to, subject, text
 * 出力: { ok: boolean; status: number; bodySnippet: string }
 * 副作用: HTTPS POST https://api.resend.com/emails
 */
export async function sendFallbackMail(args: {
  apiKey: string;
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: boolean; status: number; bodySnippet: string }>;
```

### 5-2-3. healthcheck payload 型

```ts
export type HealthcheckPayload = {
  name: "UT-17 weekly healthcheck";
  severity: "info";
  ts: number;            // unix epoch ms
  data: {
    healthcheck: true;
    triggeredAt: string; // ISO8601
  };
};
```

### 5-2-4. scheduled handler 分岐（`apps/api/src/index.ts`）

擬似 diff（既存 `0 18 * * *` 分岐に Monday gate を追加）:

```ts
if (cron === "0 18 * * *") {
  // 既存: schema sync
  ctx.waitUntil((async () => { /* runSchemaSync */ })());
  // 既存: retention purge
  ctx.waitUntil((async () => { /* runRetentionPurge */ })());

  // 追加（UT-17 followup-003）: 月曜のみ weekly healthcheck
  const today = new Date(event.scheduledTime ?? Date.now());
  if (today.getUTCDay() === 1) {  // 1 = Monday (UTC)
    ctx.waitUntil(runAlertRelayHealthcheck(env, ctx));
  }
  return;
}
```

> `event.scheduledTime` が使えるなら優先（テスト容易性）。なければ `Date.now()` で代替。

---

## 5-3. 入出力・副作用・エラーハンドリング

| 関数 | 入力 | 出力 | 副作用 | エラー時の挙動 |
| --- | --- | --- | --- | --- |
| `runAlertRelayHealthcheck` | env, ctx | Promise<void> | Slack POST + 失敗時 Resend POST + console log | 全分岐で throw しない（cron 自体を fail させない）。失敗は console.error で記録 |
| `buildHealthcheckPayload` | now (Date) | HealthcheckPayload | なし | 入力不正は throw しない（now を信頼） |
| `isSlackResponseOk` | status, body | boolean | なし | なし |
| `sendFallbackMail` | apiKey, to, subject, text | result object | HTTPS POST | 4xx/5xx でも throw せず `{ ok: false, ... }` 返却。呼び出し側で console.error |

### エラー分岐と最終的な観測点

| シナリオ | Slack 結果 | Mail 結果 | 観測 |
| --- | --- | --- | --- |
| 正常 | 200 / "ok" | （呼ばない） | Slack 通知が届く |
| Slack revoke | 200 / "no_service" | 200 OK | Slack 届かず + Mail 届く |
| Slack URL drift | 404 | 200 OK | 同上 |
| Slack + Mail 両失敗 | 500 | 500 | Cloudflare Workers logs (`wrangler tail`) のみが最後の砦 |
| env 未設定 | （呼ばない） | （呼ばない） | console.warn のみ |

---

## 5-4. 依存ライブラリ方針

| 用途 | 採用 | 理由 |
| --- | --- | --- |
| HTTP framework | （不要、scheduled handler 内で完結） | route ではなく cron 経路 |
| Slack 投稿 | `fetch`（Workers 標準） | UT-17 本体の `slack-sender.ts` パターンを踏襲 |
| メール送信 | `fetch` で Resend `/emails` を直接 POST | 追加 npm 依存ゼロ |
| 環境変数検証 | 既存 `apps/api/src/env.ts` の Env interface | 既存方針継続 |

> **追加依存ゼロ**を原則とする。`@slack/web-api` / `resend` SDK 等は採用しない。

### Slack-sender 再利用方針

可能なら既存 `apps/api/src/lib/slack-sender.ts` の `sendSlackMessage` を再利用する。
ただし healthcheck は戻り値判定 (`status === 200 && body.trim() === "ok"`) を厳密化したいため、
既存実装が body を読まない場合は本タスクで **読み取り対応の薄いラッパーを `healthcheck.ts` 内に置く**（既存 `slack-sender.ts` は変更しない、独立 PR の最小差分維持）。

---

## 5-5. wrangler.toml の編集差分

```toml
# apps/api/wrangler.toml — cron 値は据置・コメントのみ追加（T7 任意）

[triggers]
# daily branch (0 18 * * * = 03:00 JST):
#   - schema sync (UT-03a)
#   - retention purge (issue-402)
#   - weekly healthcheck (Mon only, UT-17 followup-003 / Issue #635)
crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]

[env.staging.triggers]
crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]

[env.production.triggers]
crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

Secret 投入コマンド（Phase 8 デプロイ計画で再掲）:

```bash
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL    --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put HEALTHCHECK_FALLBACK_EMAIL    --config apps/api/wrangler.toml --env production
# Resend を新規鍵で運用する場合のみ
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put RESEND_API_KEY --config apps/api/wrangler.toml --env production
```

`.dev.vars.example` 追記（必要時）:

```
SLACK_WEBHOOK_URL_HEALTHCHECK=op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL_HEALTHCHECK
HEALTHCHECK_FALLBACK_EMAIL=op://Personal/cloudflare-alert-relay/HEALTHCHECK_FALLBACK_EMAIL
# RESEND_API_KEY=op://Personal/cloudflare-alert-relay/RESEND_API_KEY
```

---

## 5-6. 実装順序（T1〜T9 詳細）

| 順 | サブタスク | 着手前条件 | 完了判定 |
| --- | --- | --- | --- |
| 1 | T1（env schema） | Phase 03 GO | `pnpm --filter @ubm/api typecheck` PASS |
| 2 | T2（Secret 投入） | T1 完了 | `cf.sh secret list` に新 secret が表示 |
| 3 | T3（runAlertRelayHealthcheck 実装） | T1 完了 | typecheck PASS、`healthcheck.ts` の主要 export が揃う |
| 4 | T4（handler 配線） | T3 完了 | Monday gate を含む分岐追加、typecheck / lint PASS |
| 5 | T5（vitest 3 ケース） | T3 完了 | 3 ケース PASS、line coverage ≥ 80% |
| 6 | T6（staging deploy + 動作確認） | T5 完了 | 正常系 / mail fallback 両系の evidence 取得 |
| 7 | T7（wrangler コメント） | T6 完了（任意） | コメント差分のみ |
| 8 | T8（runbook 更新） | T6 完了 | 役割分担 + 連続失敗閾値の追記 |
| 9 | T9（production deploy） | T8 完了 | 翌月曜発火確認 or Dashboard `Trigger Now` で同等確認 |

---

## 5-7. 不変条件チェック

- [ ] `apps/web` には変更を加えない
- [ ] D1 直接アクセスを追加しない（本タスクは scheduled cron + Slack/Mail HTTP のみ）
- [ ] Secret は 1Password → Cloudflare Secrets 経由のみ。`.env` 実値書き込み禁止
- [ ] `wrangler` 直接実行禁止。すべて `bash scripts/cf.sh` 経由
- [ ] cron 本数据置（無料枠 3 本上限維持）
- [ ] UT-08-IMPL（WAE custom alerts）と関数 / 経路を共有しない
- [ ] Slack Webhook URL / Resend API key は構造化ログに出力しない（Phase 7 grep gate）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 本体（alert-relay） | `slack-sender.ts` 再利用 or 薄いラッパー新設 | 既存実装は触らず、必要なら本タスク内に局所コピー |
| UT-08-IMPL | 通知先 channel | `SLACK_WEBHOOK_URL_HEALTHCHECK` を別 secret に分離（本番 alert URL を上書きしない） |
| Phase 6 テスト戦略 | vitest 3 ケースの境界条件 | 関数シグネチャ・戻り値判定をそのまま入力 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-04.md | T1〜T9 の入力 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 原典・苦戦箇所 6.1〜6.5 |
| 必須 | apps/api/src/index.ts | scheduled handler 既存実装 |
| 必須 | apps/api/src/env.ts | Env interface 追加箇所 |
| 必須 | apps/api/src/lib/slack-sender.ts | Slack 投稿実装パターン |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers / ScheduledEvent.scheduledTime |
| 参考 | https://api.slack.com/messaging/webhooks | Slack body=="ok" 規約 |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend send API |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 必須項目を満たす実装計画書 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] CONST_005 の必須項目（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存 / 実装順序）が全て埋まっている
- [ ] 追加 npm 依存ゼロが確認されている
- [ ] Secret 投入手順が `bash scripts/cf.sh secret put` で記述されている（`wrangler` 直接実行なし）
- [ ] cron 本数据置（既存 `0 18 * * *` 相乗り + Monday gate）の方針が記述されている
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
  - 5-2 の関数シグネチャは Phase 6 のユニットテスト 3 ケースの基礎となる
  - 5-3 の入出力・エラーハンドリングは異常系テスト観点に展開される
  - Monday gate のロジックは Phase 6 で曜日境界の追加テスト観点として参照
- ブロック条件: CONST_005 必須項目に欠落、または cron 本数増加が混入した場合は Phase 4 へ差し戻す
