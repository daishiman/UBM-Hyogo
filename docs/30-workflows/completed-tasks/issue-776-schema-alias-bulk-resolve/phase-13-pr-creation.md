# Phase 13: PR Creation

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
本ワークフローの実装を `dev` ブランチへ PR として提出する。

## PR メタ情報

- **base**: `dev`（CLAUDE.md「既定ブランチは dev」原則）
- **head**: `feat/issue-776-schema-alias-bulk-resolve`（または同等の自律生成名）
- **title 案**: `feat(admin-schema): bulk alias resolve UI for SchemaDiffPanel (Refs #776)`
- **labels**: `area:admin-ui`, `type:feature`, `scale:medium`, `priority:medium`

## PR 本文（雛形）

```markdown
## 概要

Issue #776 (closed) で記録されていた SchemaDiffPanel の bulk alias resolve UI を実装。
親 workflow `serial-05-step-03-schema-diff-resolve` Phase 12 unassigned-task §3 を consumed 化。

## 背景

Google Form schema 改訂時に admin が 30 件規模の alias 割当を 1 件ずつ手動 resolve する負荷が問題化していた。
single-resolve 経路は既存のまま、bulk 経路を追加する。

## 主な変更

- `SchemaDiffPanel.tsx` に Bulk Resolve トグル + checkbox 描画分岐
- `SchemaDiffBulkResolveModal.tsx`（新規）: batch confirm modal
- `useSchemaDiffBulkSelection.ts`（新規）: 選択 / modal / submit hook
- `postSchemaAliasBulk` helper（client-side bounded fan-out）
- API 側は **無変更**（CLAUDE.md 不変条件1）

## 設計判断

- bulk endpoint 新設は **却下**。API 変更なしの client fan-out 採用（理由は phase-02 / phase-03 参照）
- state 管理は bulk 専用 hook + sub-component に分離

## テスト

- 新規 / 編集 spec で partial failure / a11y / 境界（0 / 50 / 51 件）を網羅
- jest-axe violations 0
- 既存 single-resolve spec 全件回帰なし

## Evidence

- desktop 1280 / mobile 375 screenshot 6 枚（`outputs/phase-11/`）
- 30 行 submit perf log（NFR-5 30 秒以内）

## 仕様書更新

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- 親 `serial-05-step-03-schema-diff-resolve` の `unassigned-task-detection.md` §3 consumed mark

## チェックリスト

- [x] `pnpm typecheck` / `pnpm lint` green
- [x] `pnpm --filter @ubm-hyogo/web test --coverage` green / 閾値達成
- [x] `pnpm --filter @ubm-hyogo/web build` green
- [x] `bash scripts/verify-pr-ready.sh` green
- [x] `verify-design-tokens` gate green
- [x] design token 違反 0（OKLch のみ）
- [x] API endpoint surface 変更 0

Refs #776（既に closed のため、close keyword は使わない。reopen は行わない）
```

## 実行コマンド

CLAUDE.md「PR作成の完全自律フロー」に従う。`pnpm` 系 4 コマンド + `gh pr create --base dev`。

```bash
git fetch origin dev
git merge origin/dev --no-edit
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git status --porcelain   # 空であること
git diff dev...HEAD --name-only
gh pr create --base dev --title "..." --body "$(cat <<'EOF' ... EOF)"
```

## 完了条件
- [ ] PR が `dev` ベースで作成
- [ ] CI 全件 green
- [ ] reviewer（solo 開発のため self-review）チェック通過
- [ ] 本 workflow を `docs/30-workflows/completed-tasks/` へ移動（merge 後）
