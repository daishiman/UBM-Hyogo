# Documentation Changelog — issue-917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

| Date | Path | Change |
| --- | --- | --- |
| 2026-05-25 | `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` | New — Phase 1-13 + outputs/phase-{11,12} + artifacts.json (root/output) + SCOPE.md + index.md を draft 作成 |
| 2026-05-25 | `apps/api/src/scheduled/sheets-auth-healthcheck.ts` | Changed — relay POST 応答後に `event: "sheets.auth.alert_relay_post"` / `responseStatus` を構造化ログ出力 |
| 2026-05-25 | `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` | Changed — relay POST 200 / 401 responseStatus logging contract を追加 |
| 2026-05-25 | `outputs/phase-11/main.md` | New — NON_VISUAL evidence inventory（docs gate + 後続 runtime evidence 表） |
| 2026-05-25 | `outputs/phase-12/*` | New — strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |
| 2026-05-25 | `.claude/skills/aiworkflow-requirements/**` | Sync — quick-reference / resource-map / task-workflow-active / changelog / artifact-inventory / lessons-learned / LOGS に本 workflow への参照を追加 |

## 後続 runtime サイクルで予定される変更

| Date | Path | Change |
| --- | --- | --- |
| TBD | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md` | New — runtime evidence MD（secret name presence / deploy 前後 tail / SA dry-run / relay POST status） |
| TBD | `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md` | Edit — Runtime Path x Evidence 表「actual alert receipt」行 `pending_user_approval` → `verified` |
| TBD | `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/index.md` | Edit — close-out / 関連 issue へ本 evidence MD への逆参照追記 |
| TBD | `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` | Move / consume — runtime evidence 取得完了サイクルで consumed 化 |
