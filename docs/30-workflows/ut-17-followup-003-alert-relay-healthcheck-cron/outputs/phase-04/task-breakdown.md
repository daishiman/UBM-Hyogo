# Phase 4 成果物: サブタスク分解（T1〜T9）

[実装区分: 実装仕様書]

UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) のサブタスク T1〜T9 を、
単一責務原則（SRP）で固定する。各行は Phase 5 実装計画の「変更対象ファイル一覧」「実装順序」へ
そのまま転記可能な粒度とする。

---

## サブタスク一覧

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | env schema 拡張（zod） | `SLACK_WEBHOOK_URL_HEALTHCHECK?` / `HEALTHCHECK_FALLBACK_EMAIL?` を optional 追加 | 編集 `apps/api/src/env.ts` | Phase 03 GO | 0.5h | schema 拡張後 `pnpm --filter @ubm/api typecheck` PASS |
| T2 | Secret / Var 投入 | 1Password 登録 + Cloudflare Secrets 投入（staging / production 個別） | `bash scripts/cf.sh secret put SLACK_WEBHOOK_URL_HEALTHCHECK --env <env>` 他 | T1 完了 | 0.5h | `cf.sh secret list` に 2 secret × 2 env が表示 |
| T3 | `runAlertRelayHealthcheck` 実装 | cron 発火時の主処理（payload 構築 + alert-relay 内部呼び出し + Slack 戻り値判定 + 失敗時 mail fallback） | 新規 `apps/api/src/scheduled/healthcheck.ts` | T1 完了 | 1.5h | `export async function runAlertRelayHealthcheck(env, ctx): Promise<void>` が export され typecheck PASS |
| T4 | scheduled handler 分岐追加 | 既存 `0 18 * * *` 分岐内に Monday gate を入れ healthcheck を `ctx.waitUntil` で起動 | 編集 `apps/api/src/index.ts` | T3 完了 | 0.5h | `new Date().getUTCDay() === 1` ガード後に呼び出し、Monday 以外は no-op |
| T5 | vitest 新規 3 ケース | Slack OK / Slack fail-mail OK / Slack fail-mail fail を fetch mock で検証 | 新規 `apps/api/src/scheduled/__tests__/healthcheck.test.ts` | T3 完了 | 1.0h | `pnpm --filter @ubm/api test scheduled/healthcheck` 全 PASS、line coverage ≥ 80% |
| T6 | staging 動作確認 | staging deploy + 手動 trigger + Slack URL 不正化で fallback mail 検証 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | T5 完了 | 1.0h | 正常系 / 異常系両方の動作ログを `outputs/phase-08/staging-evidence.md` に記録 |
| T7 | wrangler.toml コメント追記（任意） | cron 本数据置のコメント追加 | 編集 `apps/api/wrangler.toml`（`[triggers]` 行は変更しない） | T6 完了 | 0.25h | `0 18 * * *` 行直上に役割コメントが入る |
| T8 | 月次 runbook 更新 | cron 自動化との役割分担追記・連続失敗閾値定義 | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T6 完了 | 0.5h | 冒頭に役割分担、本文に連続 2 回失敗で月次起動の閾値が記載 |
| T9 | production デプロイ + 確認 | production deploy + 次回月曜発火確認（または Dashboard manual trigger） | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | T8 完了 | 0.5h | production healthcheck channel に通知到達を確認 |

---

## 単一責務原則チェック

- T1〜T9 は **1 サブタスク = 1 責務** で分解されている
- T3（実装）と T5（テスト）は分離（implementation と verification の責務分離）
- T2（Secret 投入）と T9（production deploy）は CLI 副作用伴うため独立サブタスク化
- T7（wrangler コメント追記）は cron 本数据置の明示化のみ。任意であり、省略しても DoD 影響なし

## 上流依存グラフ

```
T1 ──┬─► T3 ──┬─► T4 ──► (handler 配線完了)
     │       │
     │       └─► T5 ──► T6 ─► T7 (任意)
     │                  │      │
     └─► T2 ────────────┘      └─► T8 ─► T9
```

T2 は実行時の前提だが、code path 上は T3 と並行可能（typecheck は env のみで通る）。

## CONST_005 必須項目への引き継ぎ

| 項目 | 引き継ぎ先（Phase 5） |
| --- | --- |
| 変更対象ファイル | 5-1 ファイル一覧 |
| 関数シグネチャ | 5-2 主要関数 |
| 入出力・副作用 | 5-3 入出力 |
| 依存ライブラリ | 5-4 依存方針（追加依存ゼロ前提） |
| 実装順序 | 5-6 実装順序（T1〜T9） |
