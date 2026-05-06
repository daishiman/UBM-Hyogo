# Phase 13: PR 作成

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-13/phase-13.md` |

## 目的
G1-G4 multi-stage approval gate を経て、commit / push / PR と merge 後 production rollout を分離して実行する。**ユーザー明示承認なしに実行禁止**。

## ゲート構成
- G1: workflow YAML 変更（実装変更）
- G2: GitHub Secrets 投入（手動・runbook 実行）
- G3: push / PR 作成（runtime pending を PR body に明記）
- G4: merge 後 production rollout / 旧 Token 失効

各ゲートは独立承認とし、合算承認を禁止する。

## 参照資料
- `outputs/phase-13/phase-13.md`
- `.claude/commands/ai/diff-to-pr.md`

## 成果物
- `outputs/phase-13/pr-body.md`
- `outputs/phase-13/approval-log.md`

## 完了条件
- G3 承認後に PR URL が記録される。G4 は merge 後 production evidence と旧 Token 失効 evidence を記録する。

## 実行タスク
- [ ] commit / push / PR / runtime operations の承認ゲートを分離して記録する。

## 統合テスト連携
- Phase 13 では実行済み local evidence と runtime pending evidence を PR body に接続する。PR 作成はユーザー承認後のみ。
