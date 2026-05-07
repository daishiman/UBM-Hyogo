# Phase 13: PR 作成

`[実装区分: 実装仕様書]`

> **G1 承認ゲート**: 本フェーズは Phase 12 完了 + ユーザー明示承認後に実行する。本サイクルでは commit / push / PR は作成しない。

## 1. PR 作成条件

- Phase 9 で typecheck / lint / test すべて GREEN
- Phase 11 で component test evidence + 4 状態 screenshot（deferred の場合は `PENDING_RUNTIME_EVIDENCE` と再取得条件を記録し、PR 本文では未取得を明示）
- Phase 12 で 6 必須タスク完了
- ユーザーから PR 作成の明示的指示

## 2. ブランチ運用

- 作業ブランチ: 現ワークツリーのブランチ
- ベース: `main`

## 3. PR タイトル / body テンプレ

### タイトル

```
feat(admin-ui): UT-07B-FU-02 schema alias retryable back-fill label
```

70 字以内。

### body

```
## Summary
- Refs #362
- HTTP 202 + backfill.status='exhausted' + retryable=true を retryable continuation として
  管理 UI (SchemaDiffPanel) で「続きから再試行できる状態」として表示する。
- API contract (apps/api/) は不変。web 側 4 ファイルの修正のみ。

## Changes
- apps/web/src/lib/admin/api.ts: postSchemaAlias 戻り値型拡張、isSchemaAliasRetryableContinuation 追加
- apps/web/src/components/admin/SchemaDiffPanel.tsx: feedback state 置換、4 状態分岐
- apps/web/src/lib/admin/__tests__/api.test.ts: API-01〜05 追加
- apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx: UI-01〜05 追加

## Test plan
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web typecheck PASS
- [ ] mise exec -- pnpm --filter @ubm-hyogo/web lint PASS
- [x] mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.test.ts apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx PASS
- [ ] git diff main...HEAD apps/api/ が空（API contract 不変）
- [ ] manual screenshot 4 枚（outputs/phase-11/）

## Screenshots
（outputs/phase-11/01-success.png 〜 04-conflict-error.png を本文に貼る）

## References
- docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/index.md
- docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/outputs/phase-12/implementation-guide.md
- docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md
```

> Issue #362 は CLOSED のまま。`Refs #362` のみで `Closes` / `Fixes` は使わない。

## 4. 完了条件

- [ ] `outputs/phase-13/local-check-result.md` 作成
- [ ] `outputs/phase-13/change-summary.md` 作成
- [ ] `outputs/phase-13/pr-info.md` 作成（PR 未作成時は user-gated と明記）
- [ ] `outputs/phase-13/pr-creation-result.md` 作成（PR 未作成時は NOT_EXECUTED_USER_APPROVAL_REQUIRED）
- [ ] Phase 9〜12 完了
- [ ] ユーザー承認取得
- [ ] PR 作成（`gh pr create`）
- [ ] CI（typecheck / lint / test）GREEN
