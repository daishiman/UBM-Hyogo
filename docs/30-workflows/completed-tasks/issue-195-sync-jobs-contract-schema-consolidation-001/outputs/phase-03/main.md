# Phase 3 — 実装計画

## 変更ファイル一覧
1. `docs/30-workflows/_design/sync-jobs-spec.md` — ADR-001 + §2/§3/§5 リンク + 履歴追記
2. `docs/30-workflows/_design/sync-shared-modules-owner.md` — alias 行 + owner 表行追加 + 解消済み未割当節
3. `apps/api/src/jobs/_shared/sync-jobs-schema.ts` — エラーメッセージ強化 / email 形式検出
4. `apps/api/src/jobs/_shared/sync-jobs-schema.test.ts` — canonical 値断言 + email 拒否ケース
5. `.claude/skills/aiworkflow-requirements/references/database-schema.md` — sync_jobs 節を `_design/` 参照で統一
6. `docs/30-workflows/unassigned-task/task-issue195-...md` — status: resolved
7. `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` — `pnpm indexes:rebuild` で再生成

## 編集順序
spec.md → owner.md → schema.ts → schema.test.ts → database-schema.md → unassigned-task → indexes:rebuild

## ロールバック手順
`git revert <commit>` で全変更を戻す。runtime コードは追加のみ・破壊的変更なしのため安全。
