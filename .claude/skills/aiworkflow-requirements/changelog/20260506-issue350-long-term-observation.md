# 2026-05-06 Issue #350 Long-term Production Observation

## Summary

Issue #350 を `spec_created / implementation / NON_VISUAL / runtime pending` として同期した。09c の 24h verification 後に残る D+7 / D+30 継続観測を、GitHub Actions reminder Issue、runbook、SSOT reference、09c consumed trace に接続する。

## Updated Canonical Files

- `.github/workflows/post-release-observation-reminder.yml`
- `scripts/observation/create-reminder-issue.sh`
- `scripts/observation/reminder-issue-template.md`
- `scripts/observation/check-thresholds.md`
- `docs/runbooks/post-release-long-term-observation.md`
- `.claude/skills/aiworkflow-requirements/references/post-release-long-term-observation.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-350-long-term-observation-2026-05.md`（新規追加予定）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/changelog/20260506-issue350-long-term-observation.md`（自身）
- `docs/30-workflows/issue-350-long-term-production-observation/`（タスク仕様一式）
- `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md`
- `docs/30-workflows/unassigned-task/ut-350-fu-02-post-merge-runtime-evidence.md`
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-12/main.md`（consumed trace）
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-12.md`
- `docs/30-workflows/unassigned-task/task-09c-long-term-production-observation-001.md`

## Lessons Learned

- Cloudflare Workers cron 無料枠が既に 3 本で満杯のため、追加 cron を載せられず GitHub Actions `schedule` を採用する判断に至った（cron 枠の事前確認を deploy reference に追記）。
- D+7 / D+30 reminder の重複起票回避には idempotency キー設計が必要で、`gh issue list --search` での既存検索だけでは race condition が残る点が落とし穴。release tag を idempotency key にして title/label に埋め込む方式で収束。
- PII / evidence boundary の運用境界明文化に時間を要した。保存可（aggregate metrics, redacted CSV）と保存禁止（URL query, body, IP, UA, email, member ID, token）を runbook と reference の両方に同一表現で固定する必要があった。
- 09c Phase 12 の long-term observation 行から Issue #350 への consumed trace 接続で、`main.md` / `unassigned-task-detection.md` ×2（A 系列・serial 系列）/ `phase-12.md` の 4 ファイルを同時更新する必要があり、片側だけ更新すると trace が断絶する構造的リスクが判明。
- `workflow_dispatch` と `schedule` の二重トリガで Issue が重複生成される事故を防ぐため、release tag を idempotency key にして既存 Issue があれば skip する分岐を必須化した。

## Follow-up Unassigned Tasks

- `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` — actionlint / shellcheck CI gate の追加。
- `docs/30-workflows/unassigned-task/ut-350-fu-02-post-merge-runtime-evidence.md` — マージ後 runtime evidence（実 reminder Issue / workflow run log）の取得。

## Boundary

Commit、push、PR、real workflow dispatch、実 reminder Issue 作成 evidence は user approval 後に取得する。Cloudflare Workers cron は追加しない。
