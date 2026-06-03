# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| merge pattern の対称適用（兄弟タスク再利用） | 親 #988（merge optimistic）の Phase 12 フォーマットと確定コードを正本として、dismiss 経路へ対称適用できた。`onMerge`→`onDismiss`、`optimisticMerged`→`optimisticDismissed` の 1:1 写像で設計コストを最小化 | 既存「兄弟タスクのフォーマット踏襲」運用で吸収可能。新規 skill 変更は no-op |
| optimistic state は操作種別ごとに分離し render guard でのみ合流 | dismiss と merge の rollback 責務を独立させるため state を分離し、可視性判定だけを `if (optimisticMerged || optimisticDismissed) return null;` で合流させる設計が明快だった | 既存 SRP / component-local state guidance で説明可能。新規 reference 追加は過剰 |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| implemented VISUAL タスクの screenshot captured 扱い | VISUAL タスクとして canonical 名を固定し、実装同一サイクルで screenshot を captured へ昇格した。親 #988（implemented・present）との差分を compliance §4 で明示する | 既存 FB-VISUAL-CAP-001 / VISUAL_ON_EXECUTION boundary で十分。追加改善なし |
| Issue 状態の温存（CLOSED 維持） | Issue #1042 は CLOSED だが、本ワークフローは open/close を変更しない。reopen せず CLOSED のまま仕様書を作成する判断が一貫 | 既存「Issue 状態は user-gated で変更」ルールで十分。新規ルール化は no-op |
| hook 拡張回避の判断 | `useAdminMutation` に optimistic option を追加せず component-local state で完結させる判断が最小差分だった（merge 側と同一方針） | 既存「implementation target が明確なら同一 cycle で実装」ルールに従い、hook 汎化はしない |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | implementation-guide の確定コード（`optimisticDismissed` / `setOptimisticDismissed` / `onDismiss` / `dismissMutation` / `dismissReason`）を Phase 1 設計および既存コード規則と一致させ、実装時に grep 確認する運用は drift 防止に有効 | 現行 W1-02b-3 ルールで十分。追加改善なし |
| screenshot canonical 名の早期固定 | 3 枚の screenshot 名（`dismiss-confirm` / `dismiss-optimistic-removed` / `dismiss-rollback-error`）を Phase 1 spec で先に確定し implementation-guide でも同名参照したため、Phase 11 実行時の名前ドリフトを予防できる | 現行 FB-VISUAL-CAP-001 ルールで十分。追加改善なし |

---

## 総括

SKILL.md 本体へ昇格すべき新ルール（gate / policy）は検出されなかった。本タスクの主要知見は以下 3 点で、いずれも既存 reference 層 / 運用ルールで吸収可能:

- **merge pattern の対称適用**: 兄弟タスク（#988）のフォーマット・確定コードを再利用し、dismiss 経路へ対称写像する設計。
- **optimistic state の操作種別分離**: state は分離し render guard でのみ合流（rollback 責務の独立化）。
- **implemented VISUAL の screenshot captured 扱い**: canonical 名を維持したまま実装同一サイクルで status=captured へ昇格した。

実コード wave で新たな苦戦箇所は発生しなかった。今後発生した場合は aiworkflow-requirements の lessons-learned / task-specification-creator の patterns-lessons へ体系化する（本サイクルの追加 rule は no-op）。

## 完了条件

- テンプレート / ワークフロー / ドキュメントの 3 観点が記録されていること。
- 本タスク固有知見（merge pattern 対称適用 / state 分離 + render guard 合流 / implemented VISUAL の screenshot captured）が記載されていること。
