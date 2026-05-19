# 2026-05-17 — Verify indexes trigger recovery SOP sync

UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期した。

## Changed

- `docs/00-getting-started-manual/lefthook-operations.md` に `verify-indexes-up-to-date` trigger 条件と復旧 SOP を追加。
- `lefthook.yml` の `indexes-drift-guard.fail_text` に runbook 詳細リンクを追加。
- `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-verify-indexes-trigger/` に root/output artifacts と Phase 12 strict 7 outputs を追加。
- 起票元 `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER.md` は `docs/30-workflows/completed-tasks/` に rename-move し consumed trace を保持。
- `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` に current workflow 導線を追加。

## Boundaries

- `.github/workflows/verify-indexes.yml` と `scripts/hooks/indexes-drift-guard.sh` は current contract と一致しているため変更なし。
- Issue #289 は CLOSED 維持。PR 文脈は `Refs #289` のみ。
- commit / push / PR は user-gated。
