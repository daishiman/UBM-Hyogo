# UT-17-followup-003 Phase 12 Main

[実装区分: 実装仕様書]

## Status

`CODE_COMPLETE_EXTERNAL_OPS_PENDING`

本タスクは Cloudflare Workers `scheduled` handler 追加 + 既存 `[triggers]` cron への相乗り +
Resend メールフォールバック実装 + 月次 runbook 更新の小規模タスク。
ローカルコード実装は完了済みとして正本同期 (Phase 12) を行うが、
Cloudflare secrets 投入 / staging deploy / production deploy / staging cron 実発火確認 /
commit / push / PR は本サイクル外（ユーザー実施）として残す。

## Canonical Outputs

本タスクは UT-17 親ワークフローの小規模 followup だが、Phase 12 strict 7 ファイルをすべて出力する:

1. `main.md`
2. `implementation-guide.md`
3. `system-spec-update-summary.md`
4. `documentation-changelog.md`
5. `unassigned-task-detection.md`
6. `skill-feedback-report.md`
7. `phase12-task-spec-compliance-check.md`

## 主な変更領域

| 領域 | 内容 |
| --- | --- |
| `apps/api` ランタイム | `scheduled` handler 追加 / `Env` interface 拡張 / 既存 wrangler.toml cron trigger への相乗り |
| `apps/api` 補助モジュール | Resend メールフォールバック関数 |
| runbook | 月次 runbook を「cron 自動化との役割分担」記述で更新 |
| skill 正本 | `aiworkflow-requirements/references/deployment-cloudflare.md` に週次 healthcheck セクション追記 / `indexes/keywords.json` 更新 |
| unassigned-task | task-completion 後 `completed-tasks/` 配下へ移動 |

## 不変条件チェック

- D1 直接アクセスは `apps/api` に閉じる → 本タスクは D1 アクセスなし
- Cloudflare CLI は `bash scripts/cf.sh` 経由のみ → secrets 投入 / deploy / rollback すべて wrapper 経由
- `apps/web` 配下に変更なし → cron handler は `apps/api` 内で完結
- UT-08-IMPL（WAE custom alerts）と責務重複なし → 本タスクは Cloudflare native usage alerts 経路の生死確認に限定
- 1Password → Cloudflare Secrets / `.env` は `op://` のみ。対象 local env sample が存在しないため本タスクでは `.dev.vars.example` を追加しない
