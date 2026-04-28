---
timestamp: 2026-04-28T17:01:31Z
branch: feat/issue-130-skill-ledger-a2-fragment-task-spec
author: claude-code
type: changelog
---

# task-specification-creator changelog (2026-04-28)

A-2 fragment 化（skill ledger を 1 entry = 1 file に移行）に伴う本 skill の SKILL 機能差分を記録する。

## Changed

- `SKILL.md` 入口記述・Phase 12 Step 1-A 周辺・チェックリスト・末尾参照リンクを fragment + render CLI 表記へ更新（L23 / L214 / L226 / L247 / L296 / L320 / L350 / L362 / L364 / L464 / L517）
- 「LOGS.md ×2 ファイル更新」表現を「LOGS fragment ×2 作成 + `pnpm skill:logs:render` で集約検証」へ統一
- `[SKILL-changelog.md](SKILL-changelog.md)` リンクを `[changelog/](changelog/)` ディレクトリリンクへ置換（旧 monolith は `changelog/_legacy.md` に退避済み）

## Added

- 本 fragment 群を本 PR で新規作成: LOGS fragment 1 件 / 本 changelog fragment

## Notes

- `references/` 配下の Phase 12 系ガイド（phase-12-guide.md / spec-update-workflow-advanced.md / phase12-checklist-definition.md など）の `LOGS.md` 言及は本 PR では未変更。次 wave で同期予定
- 旧 `LOGS.md` / `SKILL-changelog.md` への直接 append は writer 経路ガード CI で禁止予定（unassigned-task UT-A2-CI-001）
