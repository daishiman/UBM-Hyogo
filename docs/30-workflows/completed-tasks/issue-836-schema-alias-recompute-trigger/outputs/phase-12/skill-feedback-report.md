# Phase 12 output: skill feedback report

[実装区分: 実装仕様書]

task-specification-creator skill を本タスクに適用した結果のフィードバック。改善点がない観点は「改善点なし」と明記しつつ、本タスク固有の知見を記録する。

## task-specification-creator 改善候補

### 1. 「CLOSED Issue を最新コードに最適化して仕様化する」パターンの知見（記録）

Issue #836 は CLOSED 済（linked PR / comment なし）だが、コード実態を grep で確認すると recompute は未実装だった。本タスクでは以下の手順で「reopen せず最新コードへ最適化して仕様化」を実現した。この手順は #772 / #778 と同じ再起動パターンであり、skill リファレンス（`closed-issue-canonical-workflow-recovery.md`）の有効性が再確認できた。

- 現コードベース実態テーブル（確認対象 / 現実態 / 結論）を index.md「Issue 鮮度調査結論」に必須化
- 原典 Issue の抽象想定（「集計済み表示・派生テーブル」）と現コード実体（`response_fields.stable_key`）のズレを「最新コードへの最適化」テーブルで明示し、recompute = reverse-backfill と再定義
- fold-state sync 語彙（`consumed_via_issue_{N}_*_spec`）で原典 unassigned-task を消化済みに同期し、Issue は CLOSED 維持

> 改善提案: 「CLOSED Issue 鮮度調査結論」テーブル（確認対象 / 現実態 / 結論 + 原典想定 → 現実体 → 最適化方針）を Phase 01 の必須セクションとして skill テンプレートに昇格すると、recovery パターンの再現性が上がる。

### 2. 対称操作（backfill ⇄ reverse-backfill）の設計記述パターン（記録）

recompute は既存 `backfillResponseFields()` の逆操作。Phase 02 で「from / to / 衝突回避 / 単位 / no-op 判定」を backfill と reverse-backfill の対比表で固定したことで、実装漏れ（衝突回避の DELETE → UPDATE 順序）を構造的に防げた。

> 改善提案: 「既存関数の対称（逆）操作を新規実装する」タスク向けに、Phase 02 設計書へ「対称操作対比表（from/to/衝突回避/単位/no-op）」を必須セクション化するテンプレートを追加候補。

### 3. VISUAL タスクの screenshot canonical 名固定（改善点なし・既存運用で十分）

`schema-diff-panel-recompute-<state>.png` の canonical 名を implementation-guide の `## 視覚証跡` / Phase 11 capture script / metadata で一致させる運用は既存 skill 規定（FB-VISUAL-CAP-001 / FB-LLM-MOD-05-001）で十分にカバーされており、追加改善点なし。

## aiworkflow-requirements 改善候補

### 1. recompute job idempotency パターン（記録）

`(alias_id, stable_key, trigger_key)` UNIQUE による job 冪等化 + SQL レベル冪等の二重防御は、admin mutation 一般（再実行可能な batch 操作）に展開可能。

> 改善提案: `references/` に「admin batch job idempotency pattern」（job UNIQUE 制約 + status 遷移 `pending/running/completed/failed` + cursor 継続 + CPU budget exhausted 再開）を MD 化候補。本タスクと bulk rollback（followup-006）で再利用できる。

### 2. `audit_log.after_json.relatedRollbackAuditId` 規約（記録）

recompute audit が元 rollback audit を参照する関係（`relatedRollbackAuditId`）は、rollback / undo（#778 の `relatedAuditId`）と同系統。audit_log spec の「関連 audit 参照 JSON field」semantics を正本化する候補（#778 skill-feedback と同一論点・継続）。

## 横断（task-specification-creator + aiworkflow-requirements）

- skill-fixture-runner との integration: recompute endpoint spec / workflow spec / component spec の fixture テンプレートを fixture-runner に追加すると、bulk recompute（followup-006）で再利用しやすい（#778 skill-feedback の継続提案）。

## まとめ

| 観点 | 改善点 |
| --- | --- |
| テンプレート改善 | Phase 01「CLOSED Issue 鮮度調査結論」必須化 / Phase 02「対称操作対比表」必須化（候補） |
| ワークフロー改善 | admin batch job idempotency pattern の MD 化（候補） |
| ドキュメント改善 | `audit_log.after_json.relatedAuditId` semantics の正本化（継続候補） |
| screenshot canonical 名運用 | 改善点なし（既存規定で十分） |
