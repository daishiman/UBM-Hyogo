# Phase 13: PR 草案 / 承認チェックリスト

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 草案 / 承認チェックリスト |
| 作成日 | 2026-04-30 |
| 前 Phase | 12（ドキュメント更新） |
| 状態 | pending_user_approval |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（merge 後も維持） |
| GitHub Issue | #262（CLOSED 維持 / reopen 禁止） |

## 目的

Phase 13 は実 Git 操作ではなく、PR を作る場合の草案・境界・承認条件を文書化する。`git commit` / `git push` / `gh pr create` はユーザーの明示指示があるまで実行しない。本タスク自体もコード変更・migration・shared 実装を含めない。

## 承認ゲート

| 項目 | 条件 | 状態 |
| --- | --- | --- |
| Phase 10 | `outputs/phase-10/go-no-go.md` が GO | PASS |
| Phase 11 | `main.md` / `manual-evidence.md` / `link-checklist.md` が存在 | PASS |
| Phase 12 | 必須 7 成果物が存在 | PASS |
| workflow state | root / outputs とも `spec_created` | PASS |
| Issue #262 | CLOSED 維持、`Refs #262` のみ | PASS |
| 実コード混入 | `apps/api/` / `apps/web/` / `packages/shared/src/` を含めない | 要PR前確認 |
| 実行承認 | user の明示承認 | 待ち |

## PR 草案

Title:

```text
docs(u-ut01-08): define canonical sync enum contract
```

Body outline:

```markdown
## Summary
- Add docs-only U-UT01-08 workflow for sync `status` / `trigger_type` canonicalization.
- Define `status = pending | in_progress | completed | failed | skipped`.
- Define `trigger_type = manual | cron | backfill` and route actor data to `triggered_by`.

## Scope
- Spec only.
- No D1 migration.
- No API / web implementation.
- No shared package implementation.

## Follow-up owners
- UT-04: migration / CHECK constraints.
- UT-09: sync job literal rewrite.
- U-UT01-10: shared types and Zod schemas.

Refs #262
```

## 禁止事項

- 承認前に commit / push / PR 作成を実行しない。
- `Closes #262` を使わない。
- Issue #262 を reopen しない。
- `apps/api/migrations/`, `apps/api/src/`, `apps/web/`, `packages/shared/src/` を本 PR に混ぜない。

## 完了条件

- PR 草案が `outputs/phase-13/main.md` と一致している。
- 承認待ち状態が明記されている。
- 実 Git 操作が本仕様書から分離されている。
