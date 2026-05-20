# Phase 13: PR 作成

## 1. ブランチ

```
feat/issue-777-schema-diff-resolve-history-view
```

`dev` 起点で作成すること（CLAUDE.md「既定ブランチは dev」）。`main` への PR は本タスクでは作成しない。

## 2. ベース

```
dev
```

## 3. PR タイトル

```
feat(issue-777): admin schema diff resolve history view (Refs #777)
```

## 4. PR 本文テンプレート

```markdown
## Summary

- `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` を新規追加（admin が schema diff resolve の過去履歴を閲覧する panel）
- `apps/web/app/(admin)/admin/schema/history/page.tsx` を新規追加（独立 route、案 α 採用）
- `apps/web/src/lib/admin/api.ts` に `fetchSchemaAliasHistory()` を追加（案 A: `/admin/audit?action=schema_diff.alias_assigned` 既存 endpoint 再利用）
- shared primitive (Pagination / FormField / Breadcrumb / EmptyState) を再利用、新規 primitive は生やさない
- filter（操作者 email / 期間 / question text 部分一致）+ cursor pagination（50 件 / page）
- 行に `data-audit-id` を保持（followup-004 rollback 起動 anchor）
- `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` 新規（4 観点: filter / pagination / 空状態 / fetch error）
- `apps/web/src/lib/admin/__tests__/api.spec.ts` へ `fetchSchemaAliasHistory` テスト追加
- `docs/00-getting-started-manual/specs/11-admin-management.md` に履歴閲覧 UI 仕様を追記
- serial-05 step-03 `outputs/phase-12/unassigned-task-detection.md` §3 を consumed に更新

Refs #777
Refs serial-05-step-03-schema-diff-resolve

## 仕様書

- `docs/30-workflows/issue-777-schema-diff-resolve-history-view/index.md`
- Parent: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/`
- 元 task spec: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md`

## 採用判断

- §2.5: **案 A**（既存 `/admin/audit?action=schema_diff.alias_assigned` 再利用）— 既存 audit log payload に before/after stableKey が含まれることを確認済み、新 endpoint 追加なし
- §2.6: **案 α**（独立 route `/admin/schema/history`）— 履歴件数の増加と現 diff page との視覚分離を優先

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffHistoryPanel`（4 観点 PASS）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/src/lib/admin/__tests__/api.spec.ts`
- [ ] HEX 直書き grep 0 件（`grep -nE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`）
- [ ] `.test.tsx` 命名違反 0 件
- [ ] `bash scripts/verify-pr-ready.sh` PASS
- [ ] admin login → `/admin/schema/history` 遷移 → filter / pagination / 空状態 / 履歴行表示の手動確認（Phase 11 §3）
- [ ] `verify-design-tokens` / `verify-test-suffix` / `verify-indexes-up-to-date` / `verify-gate-metadata` / `verify:phase12-compliance` CI gate PASS

## スクリーンショット

`docs/30-workflows/issue-777-schema-diff-resolve-history-view/outputs/phase-11/screenshots/` 配下:

- `schema-history-list.png` — 履歴一覧通常状態
- `schema-history-empty.png` — 空状態
- `schema-history-filter.png` — filter 適用後
- `schema-history-pagination.png` — 2 ページ目遷移後
- `schema-history-breadcrumb.png` — Breadcrumb 拡大

> authenticated browser screenshot は user-gated。staging runtime smoke は user 明示承認後に追加取得。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 前 pre-flight チェックリスト

- [ ] `mise exec -- pnpm install --force`
- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- SchemaDiffHistoryPanel`
- [ ] HEX grep（Phase 9 §1 全項目）
- [ ] `verify-design-tokens` 相当の grep が手元で 0 件
- [ ] `.spec.tsx` のみ存在（`.test.tsx` 不在）
- [ ] coverage-guard `--changed` 閾値低下なし
- [ ] `bash scripts/verify-pr-ready.sh`（Phase 12 strict 7 outputs / canonical 9 headings / artifacts.json zod / indexes drift をまとめて検証）

## 6. 作成コマンド（承認後のみ実行）

```bash
git switch -c feat/issue-777-schema-diff-resolve-history-view

git add apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx \
        apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
        apps/web/app/\(admin\)/admin/schema/history/page.tsx \
        apps/web/src/lib/admin/api.ts \
        apps/web/src/lib/admin/__tests__/api.spec.ts \
        docs/00-getting-started-manual/specs/11-admin-management.md \
        docs/30-workflows/issue-777-schema-diff-resolve-history-view \
        docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md \
        docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md \
        docs/30-workflows/LOGS.md

git commit -m "$(cat <<'EOF'
feat(issue-777): admin schema diff resolve history view (Refs #777)

- SchemaDiffHistoryPanel.tsx 新規（filter + cursor pagination + 空状態）
- /(admin)/admin/schema/history route 追加（独立 page、案 α）
- fetchSchemaAliasHistory() を admin/api.ts に追加（案 A: 既存 /admin/audit 再利用）
- shared primitive (Pagination/FormField/Breadcrumb/EmptyState) を再利用
- component.spec.tsx 4 観点 + api.spec.ts unit test 追加
- 11-admin-management.md に履歴閲覧 UI 仕様を追記
- serial-05 step-03 unassigned-task-detection §3 を consumed に更新

Refs #777

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin feat/issue-777-schema-diff-resolve-history-view

gh pr create --base dev \
  --title "feat(issue-777): admin schema diff resolve history view (Refs #777)" \
  --body-file <PR本文ファイル>
```

## 7. User Approval Gate

- `git commit` / `git push` / `gh pr create` はユーザー明示承認後のみ実行する
- authenticated browser screenshot / staging runtime smoke も user-gated
- AI は承認前に read-only evidence と PR 本文 draft までを扱う

## 8. レビュー方針

solo 開発のため必須レビュアー 0。以下 CI required status check の PASS のみで merge 可:

- `verify-design-tokens`
- `verify-test-suffix`
- `verify-indexes-up-to-date`
- `verify-gate-metadata`
- `verify:phase12-compliance`
- `typecheck` / `lint`
- `playwright-smoke / smoke` (chromium)
- `playwright-smoke / visual` (chromium)

## 9. merge 後

- issue #777 は OPEN 維持。PR 文脈は `Refs #777` のみを使い、自動 close しない
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md` §3 は consumed として確定
- `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md` は consumed trace として保持（削除しない）
- followup-004（rollback / undo）の前提が揃ったため、次サイクルで着手可能
- followup-002（bulk resolve）と組み合わさった bulk badge 表示は別 PR で集約
