# Phase 6: 実装手順（ステップバイステップ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 5 の関数シグネチャに従い、`apps/api/src/scheduled/healthcheck.ts` 等の **実コードを順序立てて記述する手順書**を確定する。実装行為そのものは次サイクルの coding phase で行うが、本 Phase の手順書がそのまま再現可能となるよう実装仕様レベルまで詳細化する。 |

---

## 目的

Phase 5 で確定した変更対象・関数シグネチャ・実装順序 (T1〜T9) を、
ファイル単位・ステップ単位の **実装手順書** に展開する。
本 Phase の成果物 `outputs/phase-06/implementation-steps.md` は、
担当者（または LLM coding agent）がそれ単体を見れば手を動かせる粒度で記述する。

---

## 6-1. 実装ステップ概要

| ステップ | 対象 | 主な作業 |
| --- | --- | --- |
| S1 | `apps/api/src/env.ts` | Env interface に optional 3 項目追加 |
| S2 | Cloudflare Secrets | `cf.sh secret put` で staging / production 投入 |
| S3 | `apps/api/src/scheduled/healthcheck.ts`（新規） | 5 export を上から順に実装 |
| S4 | `apps/api/src/index.ts` | `0 18 * * *` 分岐に Monday gate + `ctx.waitUntil` 追加 |
| S5 | `apps/api/src/scheduled/__tests__/healthcheck.test.ts`（新規） | vitest 3 ケース |
| S6 | `apps/api/wrangler.toml` | `[triggers]` 直上にコメント追記（任意） |
| S7 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 役割分担・閾値追記 |
| S8 | staging deploy | `bash scripts/cf.sh deploy ... --env staging` + 動作確認 |
| S9 | production deploy | 同 `--env production` |

---

## 6-2. 各ステップの実装ポイント

### S1: env schema

- `apps/api/src/env.ts` の `envSchema` に以下 3 項目を `.optional()` で追加する。
  - `SLACK_WEBHOOK_URL_HEALTHCHECK`: `z.string().url().optional()`
  - `HEALTHCHECK_FALLBACK_EMAIL`: `z.string().email().optional()`
  - `RESEND_API_KEY`: `z.string().min(1).optional()`（`MAIL_PROVIDER_KEY` 流用時は省略可）
- 既存 `getEnv()` の戻り値型に自動で乗ること（`z.infer` 経由）。
- 既存 secret は触らない。

### S3: `healthcheck.ts` 実装順

1. import: `import type { Env } from "../env";`
2. type 定義: `HealthcheckPayload` / `SlackResult` / `MailResult`
3. pure 関数: `buildHealthcheckPayload(now)` / `isSlackResponseOk(status, body)`
4. fetch ラッパ: `postSlackHealthcheck(url, payload)` / `sendFallbackMail(args)`
5. エントリ: `runAlertRelayHealthcheck(env, ctx)`

戻り値判定の厳密化:

```ts
export function isSlackResponseOk(status: number, body: string): boolean {
  return status === 200 && body.trim() === "ok";
}
```

Slack body の読み取り:

```ts
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const body = await res.text();   // 最大数 byte。必ず読む（revoke 検知のため）
return { ok: isSlackResponseOk(res.status, body), status: res.status, body };
```

### S4: handler 配線

`apps/api/src/index.ts` の `if (cron === "0 18 * * *") { ... }` 分岐の **末尾の `return;` の直前**に以下を挿入:

```ts
// UT-17 followup-003 (Issue #635): 月曜のみ weekly healthcheck
const scheduledAt = new Date((event as ScheduledController & { scheduledTime?: number }).scheduledTime ?? Date.now());
if (scheduledAt.getUTCDay() === 1) {
  ctx.waitUntil(runAlertRelayHealthcheck(env, ctx));
}
```

`runAlertRelayHealthcheck` の import を `apps/api/src/index.ts` 冒頭に追加:

```ts
import { runAlertRelayHealthcheck } from "./scheduled/healthcheck";
```

### S5: vitest 3 ケース

- Vitest の `vi.stubGlobal('fetch', ...)` で `fetch` を mock。
- env は最小オブジェクトを inline 構築 (`{ SLACK_WEBHOOK_URL_HEALTHCHECK: "https://hooks.slack.com/...", HEALTHCHECK_FALLBACK_EMAIL: "ops@example.com", RESEND_API_KEY: "re_xxx" } as unknown as Env`)。
- `ctx` は `{ waitUntil: vi.fn() } as unknown as ExecutionContext`。

### S6: wrangler.toml（任意）

`[triggers]` の直上にコメントを 3 行追加するのみ。`crons` 配列は触らない。

### S7: 月次 runbook 更新

冒頭セクションを以下のように追記:

```md
> **役割分担**:
> - 定常監視: Cloudflare Workers cron `0 18 * * *` (Mon UTC) による週次自動 healthcheck（UT-17 followup-003, Issue #635）
> - 本 runbook: 四半期に 1 回の詳細確認 + Cron 連続 2 回失敗時の deep-dive
>
> 連続 2 回（= 2 週間）失敗時は本 runbook を即時起動する。
```

---

## 6-3. 不変条件チェック（実装中に守るべき）

- [ ] `apps/web/` 配下のファイルを変更していない
- [ ] D1 直接アクセスを追加していない
- [ ] Slack Webhook URL / Resend API key をログ・docs・コード comment に書いていない
- [ ] cron 値（配列長 3）を変更していない
- [ ] `pnpm-lock.yaml` に新規依存が増えていない
- [ ] `wrangler` を直接呼んでいない（`bash scripts/cf.sh` 経由のみ）

---

## 6-4. 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-05.md | 関数シグネチャ・型 |
| 必須 | docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-05/implementation-plan.md | A〜H 集約 |
| 必須 | apps/api/src/index.ts | scheduled handler の挿入位置 |
| 必須 | apps/api/src/env.ts | schema 拡張位置 |
| 必須 | apps/api/src/lib/slack-sender.ts | Slack 投稿実装パターン |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/ | ScheduledController.scheduledTime |
| 参考 | https://resend.com/docs/api-reference/emails/send-email | Resend 公式 |

---

## 6-5. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | S1〜S9 のステップバイステップ実装手順 |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 6-6. 完了条件

- [ ] S1〜S9 のステップが、ファイル単位で再現可能な粒度に展開されている
- [ ] 各ステップに「対象ファイル」「挿入箇所」「コード snippet」が含まれている
- [ ] 不変条件 6 項目が手順内チェックリストとして埋め込まれている
- [ ] ローカル実行コマンド（typecheck / lint / test）が記載されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（テスト計画）
- 引き継ぎ事項:
  - S5 vitest 3 ケースの詳細仕様（mock 構成・期待戻り値）を Phase 7 が詳細化
  - S8 staging 動作確認の手順を Phase 7 の統合テスト節にて固定化
- ブロック条件: S3〜S5 の実装が Phase 5 の関数シグネチャから乖離する設計を含む場合
