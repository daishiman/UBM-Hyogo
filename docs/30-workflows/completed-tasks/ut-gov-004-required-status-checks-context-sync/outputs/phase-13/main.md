# Phase 13: PR 作成ゲート

## 状態

`user_approval_required: true` のため、commit / push / PR 作成は未実行。

## PR 作成前チェック

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| Phase 1〜12 成果物 | ready | `artifacts.json` / `outputs/artifacts.json` |
| Phase 12 必須成果物 | ready | `outputs/phase-12/*.md` |
| NON_VISUAL evidence | ready | `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md` |
| branch protection apply | not executed | UT-GOV-001 の責務 |
| commit / push / PR | not executed | ユーザー明示承認待ち |

## PR 本文ソース

PR 本文は `outputs/phase-12/implementation-guide.md` をベースにする。

## 禁止事項

- ユーザー承認なしに commit しない
- ユーザー承認なしに push しない
- ユーザー承認なしに PR を作成しない
- UT-GOV-004 内で branch protection を apply しない

## 引き渡し

UT-GOV-001 は `outputs/phase-08/confirmed-contexts.yml` を唯一の機械可読入力として使用する。

## 依存成果物参照

- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-09/main.md`
- `outputs/phase-09/strict-decision.md`
