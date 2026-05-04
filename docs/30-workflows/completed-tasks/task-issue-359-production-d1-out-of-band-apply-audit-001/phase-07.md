# Phase 7: AC マトリクス

[実装区分: ドキュメントのみ仕様書]

## 目的

`index.md` で定義された AC-1〜AC-9 に対し、Phase 別の評価ステージ・evidence path・期待値を一覧化する。

## マトリクス

| AC | 概要 | 主担当 Phase | evidence path | 期待値 / 検証方法 |
| --- | --- | --- | --- | --- |
| AC-1 | 対象 2 migration の applied timestamp が Phase 13 evidence と一致 | Phase 11 Step 1 | `outputs/phase-11/d1-migrations-ledger.md` | `2026-05-01 08:21:04` / `2026-05-01 10:59:35` 両方を含む / Phase 13 evidence と一致 |
| AC-2 | 候補 inventory 表が完備 | Phase 11 Step 2-5 | `outputs/phase-11/operation-candidate-inventory.md` | 表に `command_evidence` / `approval_evidence` / `target_evidence` 列が全候補で埋まる（空欄は `none` 明記） |
| AC-3 | 出所判定が二値で確定 | Phase 11 Step 6 | `outputs/phase-11/attribution-decision.md` | 末尾に `decision: confirmed (...)` または `decision: unattributed (no evidence found)` が 1 行 |
| AC-4 | confirmed 時 cross-reference 追加方針が定義済み | Phase 12 | `outputs/phase-12/cross-reference-plan.md` | 親 workflow Phase 13 evidence への追記内容が記載 (confirmed 時のみ必須) |
| AC-5 | unattributed 時 再発防止策が formalize | Phase 12 | `outputs/phase-12/recurrence-prevention-formalization.md` | runbook / lessons-learned / aiworkflow-requirements の反映先が確定 (unattributed 時のみ必須) |
| AC-6 | 単一レコード化 | Phase 11 Step 7 | `outputs/phase-11/single-record.md` | timestamp / command / approver / target / classification が 1 つの表に集約 |
| AC-7 | redaction PASS | Phase 11 Step 9 | `outputs/phase-11/redaction-checklist.md` | rg スキャン 0 件 |
| AC-8 | read-only PASS | Phase 11 Step -1/0/8 | `outputs/phase-11/commands-executed.md` / `outputs/phase-11/read-only-checklist.md` | mutation command 0 件 + 可能なら監査前後 ledger row 数の差分 0。local wrangler blocked 時は parent ledger snapshot + GitHub/git read-only transcript で代替 |
| AC-9 | Phase 12 7 固定成果物実体配置 | Phase 12 | `outputs/phase-12/*.md` | 7 ファイル全てが実体存在 |

## 排他条件

- AC-4 と AC-5 は排他: `decision == confirmed` なら AC-4 必須・AC-5 不要、`decision == unattributed` なら逆
- いずれの場合も `attribution-decision.md` の `decision` 行が排他根拠となる

## 出力 (`outputs/phase-07/main.md`)

- 上記マトリクス表
- 排他条件の明示

## 完了条件

- [ ] 全 AC に主担当 Phase / evidence path / 期待値が紐付く
- [ ] 排他条件が文書化されている

## メタ情報

- taskType: docs-only
- visualEvidence: NON_VISUAL
- workflow_state: spec_created

## 実行タスク

- 詳細は本 Phase の既存セクションを参照する。

## 参照資料

- index.md
- artifacts.json
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 成果物

- 対応する `outputs/phase-*` 配下の `main.md`。

## 統合テスト連携

- docs-only / NON_VISUAL のため UI 統合テストは対象外。Phase 11 の read-only audit evidence と Phase 12 compliance check で検証する。
