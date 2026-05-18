# Phase 13 — リリース / クローズ

## 1. リリース対象

- 単一 PR を `dev` に向けて作成（CLAUDE.md PR 既定方針）
- `main` への昇格は別 release wave（dev → main 統合タイミング）

## 2. PR 仕様

| 項目 | 値 |
| --- | --- |
| Base branch | `dev` |
| Head branch | `feat/issue-730-phase11-evidence-existence-validator` |
| Title (≤70 chars) | `feat(skill): Phase 11 evidence existence validator (Refs #730)` |
| Issue 紐付け | `Refs #730`（Issue は CLOSED 維持。`Closes` 等は使用しない） |
| 必須レビュアー | 0（solo 開発・CI gate のみ） |

## 3. PR body 構成

```markdown
## Summary

- `scripts/lib/phase12-compliance/` に Phase 11 evidence 実在性 validator を追加
- `phase12-task-spec-compliance-check.md` の `## 4. Phase 11 evidence file inventory` 表で `status === "present"` 宣言の path が実体未生成の場合に CI gate fail
- docs-only 3 点（`manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md`）を test fixture で網羅
- `references/phase-11-non-visual-alternative-evidence.md` に validator 仕様セクションを追記

## Test plan

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts`
- [ ] `pnpm test:phase12-compliance`
- [ ] `pnpm verify:phase12-compliance`（本タスク root に対して exit 0）
- [ ] 手動 red 化確認: `outputs/phase-11/manual-test-result.md` を一時退避して validator が exit 1

Refs #730
```

## 4. quick-summary 必須成果物

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-13/main.md` | 作成 |
| `outputs/phase-13/release-notes.md` | 作成（dev 環境 deploy では特記事項無し。validator 追加のみ） |
| `outputs/phase-13/local-check-result.md` | 上記検証コマンドの exit code 一覧 |
| `outputs/phase-13/post-merge-followup.md` | required status check 候補追加（別タスク）への引継ぎメモ |

## 5. close-out

- Issue #730 は CLOSED 維持
- 本タスク workflow root を `completed-tasks/` 配下へ移動するかどうかは、`dev` merge 後の整列で別途判断（CLAUDE.md / skill 運用に従う）
- `unassigned-task/task-27-followup-002-phase11-evidence-existence-validator.md` の `currentViolations = 0` を Phase 12 で記録済み

## 6. follow-up

- `pull_request` トリガー復活
- `dev` / `main` required status check への `verify-phase12-compliance` 追加（実 `gh api -X PUT` はユーザー承認後）
- 表記揺れ吸収（`Present` / `〇` / `OK` 等）を要望次第で別 PR
