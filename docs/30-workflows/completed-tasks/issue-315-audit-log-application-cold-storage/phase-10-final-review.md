# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 10 / 13 |
| 目的 | Phase 11 user-gated 実 mutation 前の GO 判定。sign-off 記録 |
| 依存 | Phase 9 |
| user_approval_required | true |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## レビュー観点

| ID | 項目 | 判定基準 |
|----|------|----------|
| F-1 | AC-1..AC-9 traceability | 全 AC が Phase 4/6 TC に対応 |
| F-2 | local PASS 5 点セット GREEN | Phase 9 evidence 確認 |
| F-3 | redaction grep gate 0 件 | Phase 8 evidence 確認 |
| F-4 | governance mutation list 確定 | artifacts.json `mutation_commands` 3 件と Phase 11 手順一致 |
| F-5 | スコープアウト記録 | 外部 SIEM / Logpush / hash chain の却下が文書化済 |
| F-6 | dry_run default=true | merge 後の意図せぬ本番 PUT を防ぐ |
| F-7 | rollback 手順存在 | `bash scripts/cf.sh rollback <VERSION_ID>` / migration 逆 SQL 手順を runbook に記述 |

## sign-off

| approver | role | sign-off 条件 |
|----------|------|---------------|
| daishiman | owner | F-1..F-7 全 PASS |

## 成果物

- `outputs/phase-10/go-decision.md`
- `outputs/phase-10/sign-off-record.md`（approver / timestamp / next-step = Phase 11 user gate request）

## 完了条件

- [ ] F-1..F-7 全 PASS
- [ ] sign-off 記録存在
- [ ] Phase 11 へ user gate request 文面 draft

## 参照資料

- Phase 9 evidence
- Phase 4 AC traceability
