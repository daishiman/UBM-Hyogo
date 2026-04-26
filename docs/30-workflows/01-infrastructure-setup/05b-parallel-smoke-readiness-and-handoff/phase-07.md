# Phase 7: 検証項目網羅性

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | smoke-readiness-and-handoff |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 検証項目網羅性 |
| 作成日 | 2026-04-23 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (設定 DRY 化) |
| 状態 | completed |

## 目的

smoke readiness と実装引き継ぎ における Phase 7 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | web/api/data boundary |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | handoff / unassigned |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | same-wave sync |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-07/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 7 | completed | upstream を読む |
| 2 | 成果物更新 | 7 | completed | outputs/phase-07/main.md |
| 3 | 4条件確認 | 7 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 8 (設定 DRY 化)
- 引き継ぎ事項: smoke readiness と実装引き継ぎ の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## AC × 検証項目マトリクス
| AC | 検証観点 | 検証方法 | Phase |
| --- | --- | --- | --- |
| AC-1 | readiness checklist complete | `outputs/phase-02/readiness-definition.md` の PASS 表を確認 | 2, 7, 10 |
| AC-2 | rollback / break-glass / incident entrypoint | `outputs/phase-10/final-readiness-gate.md` と deployment 参照を確認 | 6, 10 |
| AC-3 | 未解決事項 formalize | `outputs/phase-12/unassigned-task-detection.md` で既存照合 / 新規作成 / 不要理由を確認 | 7, 12 |
| AC-4 | local / dev / main の説明可能性 | `outputs/phase-05/handoff-checklist.md` と branch/env 記述を確認 | 5, 11 |
| AC-5 | 4条件 PASS | `outputs/phase-10/final-readiness-gate.md` の4条件を確認 | 10, 12 |

## 未カバー AC とフォロー方針
- 実環境前提の AC は docs-first 前提で runbook completed に言い換える。
- カバーできないものは Phase 12 で unassigned 化する。
