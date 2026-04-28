---
timestamp: 2026-04-28T12:15:40Z
branch: feat/issue-130-skill-ledger-a2-fragment-task-spec
author: daishimanju@gmail.com
type: changelog
---
# aiworkflow-requirements changelog (2026-04-28)

A-2 fragment 化（skill ledger を 1 entry = 1 file に移行）に伴う本 skill の SKILL 機能差分を記録する。

## Added

- `indexes/resource-map.md` の skill-ledger ブロックに「A-2 fragment 化（2026-04-28 移行完了 / Changesets パターン）」サブセクションを追加。旧 path → 新 canonical path（`LOGS/<fragment>.md` / `changelog/<fragment>.md` / `lessons-learned/<fragment>.md`）の対応表と CLI / lib スクリプト一覧を新規掲載
- `indexes/quick-reference.md` の skill-ledger 早見表に fragment 経路 3 行を追加（canonical 切替宣言 / `pnpm skill:logs:append`・`pnpm skill:logs:render` / 命名規則）
- `references/legacy-ordinal-family-register.md` に以下を追加:
  - Current Alias Overrides に 2026-04-28 entry × 3（LOGS / changelog / lessons-learned）
  - Family Summary に `lessons-learned-fragment-2026-04-*` family
  - 「Fragment Migration Register (2026-04-28)」新節（ledger 3 種の rename one-shot 記録）
- LOGS fragment / 本 changelog fragment / lessons-learned fragment（L-SLR-A2-010〜012）を本 PR で同時新規作成

## Changed

- skill ledger の canonical 経路を fragment ディレクトリに切替。旧 monolith は `_legacy*.md` として retention、新規 entry はすべて `pnpm skill:logs:append` 経由で fragment ファイルを生成

## Notes

- `topic-map.md` (5047 行) は本 PR では非変更。別タスクで同期予定
- `_legacy*.md` は履歴参照のみ。新規 entry を直接 `_legacy*` に追記しないこと
