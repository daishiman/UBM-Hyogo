---
spec_classification: implementation_spec
state: spec_created
phase: 10
phase_name: 最終レビュー
---

# Phase 10 — 最終レビュー

親 workflow trace: followup-001 of `docs/30-workflows/admin-ui-prototype-alignment/`。

## 目的

実装完了直前に 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）で最終 verdict を出す。

## 前提と入力

- Phase 1-9 完了
- `bash scripts/verify-pr-ready.sh` 実行結果

## 作業手順

1. 4 条件 verdict を再評価
2. CLAUDE.md PR 作成完全自律フローの「品質検証」4 コマンドを順番に実行
3. unassigned-task 検出 grep を実行

## 成果物

- `outputs/phase-10/final-review.md`

## 完了条件 (DoD)

| Condition | Verdict |
|-----------|---------|
| 矛盾なし | PASS |
| 漏れなし | PASS |
| 整合性あり | PASS |
| 依存関係整合 | PASS |

## 検証コマンド

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## 想定リスク

- `bash scripts/verify-pr-ready.sh` 失敗時は `pr-pre-flight-ci-gate-checklist.md` の §1-§5 を順に切り分け

## ロールバック

- なし（verify のみ）

## 関連 spec

- `phase-9-qa.md`
- `phase-11-manual-test.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
