# Phase 13 — PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase | 13 |
| 状態 | pending |
| user_approval_required | true |

## 目的

ローカル実装と検証が完了した変更を、ユーザー承認後に `dev` 向け PR として提出する。commit / push / PR / staging deploy / staging visual capture はユーザーの明示指示があるまで実行しない。

## 現在の状態

| 項目 | 状態 |
| --- | --- |
| 実装 | completed（apps/web 表現層） |
| focused Vitest | PASS（3 files / 27 tests） |
| typecheck / lint | PASS |
| design token gate | PASS |
| Phase 12 compliance | PASS |
| staging visual capture | pending_user_gate |
| commit / push / PR | pending_user_gate |

## 成果物

| 成果物 | パス |
| --- | --- |
| ローカル検証結果 | `outputs/phase-13/local-check-result.md` |
| 変更概要 | `outputs/phase-13/change-summary.md` |
| PR テンプレート | `outputs/phase-13/pr-template.md` |

## 完了条件

- [x] ローカル検証結果を実測値で記録した。
- [x] 変更ファイルと AC 充足を記録した。
- [x] user-gated 境界を明記した。
- [ ] ユーザー承認後に commit / push / PR を作成する。
