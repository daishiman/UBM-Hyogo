---
phase: 13
title: Commit / PR draft
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

CLAUDE.md「PR作成の完全自律フロー」を厳格に遵守。base は **`dev`** 固定。

## 1. ブランチ戦略

- 作業ブランチ: `feat/issue-880-public-segment-error-loading-boundary`
- base: `dev`
- target: `dev` への PR

ワークツリー: `.worktrees/task-20260524-221856-wt-8`（本仕様書作成 worktree）

## 2. Commit 分割

| # | scope | subject |
|---|-------|---------|
| C-01 | feat | `(public)/error.tsx` / `loading.tsx` 新規追加 |
| C-02 | feat | `(public)/error-boundary-smoke/page.tsx` 追加（dev/test 限定 force-throw） |
| C-03 | test | Playwright `public-error-boundary.spec.ts` 追加（force-throw + focus 2 ケース） |
| C-04 | docs | serial-06 への backfill note + 本 workflow spec + unassigned-task ファイル更新 |

solo 開発のため単一 commit でも可（revert 容易性のみ考慮）。

## 3. PR title

```
feat(issue-880): (public) segment 専用 error/loading boundary 明示配置
```

70 文字以内。

## 4. PR 本文（template）

```markdown
## Summary

- `apps/web/app/(public)/error.tsx` / `loading.tsx` を新規配置し、serial-06 Phase 5 §0 precondition drift を解消
- `(admin)` 既存パターンに対称化（`logger.error` の `scope: "public"`、focus 移動、design tokens のみ）
- Playwright force-throw smoke 1 spec / 2 ケース追加（dev/test 限定 `error-boundary-smoke` route 経由）

## Why（中学生レベル）

ウェブサイトの「一般向けエリア専用のエラー画面・読み込み画面」が無く、エラー時に
「会員一覧へ戻る」等の segment 固有導線を出せない構造でした。今回これを追加し、
ユーザーが迷子にならないようにします。実害は無かったが、serial-06 仕様書の
precondition と実装の drift が解消されレビュー摩擦が消えます。

## 変更点

- 新規: `apps/web/app/(public)/error.tsx`
- 新規: `apps/web/app/(public)/loading.tsx`
- 新規: `apps/web/app/(public)/error-boundary-smoke/page.tsx`（dev/test 限定）
- 新規: `apps/web/playwright/tests/public-error-boundary.spec.ts`
- 追記: `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-12-compliance-check.md`
- 仕様: `docs/30-workflows/issue-880-public-segment-error-loading-boundary/`

## Screenshots

![public error boundary](docs/30-workflows/issue-880-public-segment-error-loading-boundary/outputs/phase-11/screenshots/public-error-boundary.png)

## Test plan

- [x] `mise exec -- pnpm typecheck`
- [x] `mise exec -- pnpm lint`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web build`
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts` (2/2 PASS)
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens`
- [x] `bash scripts/verify-pr-ready.sh`

## 残課題

- 親 `apps/web/app/error.tsx` の `useAutoFocusOnMount` 二重呼び出し（L13/L32）は別 followup issue 候補（本 PR スコープ外）

Closes #880
```

## 5. PR pre-flight

```bash
bash scripts/verify-pr-ready.sh
```

`gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift の 3 検証を pass させてから `gh pr create --base dev`。

## 6. user-gated steps（自動実行禁止）

- `git push`
- `gh pr create`
- `gh issue close 880`（PR merge 後に自動 close が走る想定）
- `docs/30-workflows/completed-tasks/` への workflow 移動

## 7. 完了後の closeout チェック

- [ ] PR merge 確認
- [ ] issue #880 が `Closes #880` で自動 close されたこと確認
- [ ] `docs/30-workflows/issue-880-public-segment-error-loading-boundary/` を `completed-tasks/` 配下へ移動
- [ ] `docs/30-workflows/unassigned-task/serial-06-followup-001-*.md` を `completed-tasks/` 配下へ移動
- [ ] stale 参照 grep で残骸ゼロ確認
- [ ] `pnpm indexes:rebuild` で diff 空確認
