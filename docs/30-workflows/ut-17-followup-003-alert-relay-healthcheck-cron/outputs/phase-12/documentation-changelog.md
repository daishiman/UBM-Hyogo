# UT-17-followup-003 Documentation Changelog

[実装区分: 実装仕様書]

## Entry Checklist

- `git status --porcelain apps/ packages/ docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron .claude/skills/aiworkflow-requirements`: 実コード、実仕様書、正本仕様の同一 wave 変更を確認する。
- `git diff --stat`: Phase 12 strict 7、root/output artifacts、aiworkflow 同期、runbook 更新が diff に含まれることを確認する。

## Added

- `artifacts.json` / `outputs/artifacts.json`
- Phase 12 strict 7 の欠落ファイル:
  - `outputs/phase-12/documentation-changelog.md`
  - `outputs/phase-12/skill-feedback-report.md`
  - `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 実コード:
  - `apps/api/src/scheduled/healthcheck.ts`
  - `apps/api/src/lib/healthcheck-mail-fallback.ts`
  - `apps/api/src/scheduled/__tests__/healthcheck.test.ts`
  - `apps/api/src/lib/__tests__/healthcheck-mail-fallback.test.ts`

## Corrected

- `index.md` の Phase 4〜13 未作成記述を撤回し、実在する Phase 1〜13 と状態を同期。
- Phase 12 の「strict 7 省略」記述を撤回し、7 ファイル必須へ統一。
- alert-relay 呼び出し方式を Request 偽造 + `createAlertRelayRoute().request(...)` に統一。
- cron 設定を「新規 cron 追加」ではなく既存 `0 18 * * *` への相乗りとして統一。
- UTC/JST 表現を `UTC Monday 18:00 = JST Tuesday 03:00` に統一。
- Phase 13 の検証結果は実行後 evidence として扱い、未実行の外部 ops と分離。

## aiworkflow-requirements Sync

- `references/deployment-cloudflare.md`: API Worker cron 表へ UT-17 weekly healthcheck を追加。
- `indexes/quick-reference.md`: UT-17 followup-003 導線を追加。
- `indexes/resource-map.md`: workflow inventory row を追加。
- `references/task-workflow-active.md`: implemented-local / external ops pending 状態を追加。
- `references/workflow-ut-17-cloudflare-analytics-alerts-artifact-inventory.md`: followup-003 artifact row を追加。
- `LOGS/20260514-ut17-followup-003-healthcheck-cron.md` / `changelog/20260514-ut17-followup-003-healthcheck-cron.md`: 同期履歴を追加。
