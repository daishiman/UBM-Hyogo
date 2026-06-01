# Phase 12 スキルフィードバックレポート

タスク仕様書作成スキル（task-specification-creator / aiworkflow-requirements）に対する改善点を、
テンプレート / ワークフロー / ドキュメントの 3 観点で記録する。

## 実際の苦戦点（本サイクルで発生）

### F-1: 初回コード調査が実コードと食い違った（最重要）

- **事象**: 初回のコード調査（SubAgent）の結果が実コードと食い違っていた。具体的には
  - helper `listTagsByMemberIds` の返り値を **Map** と誤認していた（実際は **フラット配列**）。
  - query parser のフィールド名（`q` / `limit` 等）が実コードと不一致だった。
  - contract spec のパス（実際は `apps/api/src/routes/public/index.contract.spec.ts`）が不正確だった。
- **影響**: この誤認のまま Phase 2 設計を書くと、groupBy 配線（Map 前提 vs フラット配列前提）が破綻する。
- **対処**: Phase 1〜3 を **実ファイルの verbatim 確認後に全面修正**。helper シグネチャ・フィールド名・spec パスを
  実コードから引用し直し、Phase 2 の groupBy コード例を「フラット配列 → memberId キー Map」に確定させた。
- **教訓 / 提案**: 実装仕様書（コード変更を伴うタスク）では、**Phase 1 の段階で対象 helper / 型 / spec の
  シグネチャを実ファイルから verbatim 引用する**ことを必須ステップにすべき。SubAgent の要約に依存せず、
  少なくとも「変更対象の関数シグネチャ」と「返り値の型（配列 / Map / null 許容）」は原典確認を義務化する。

## テンプレート観点

| ID    | 指摘                                                                                       | 反映先候補 |
| ----- | ------------------------------------------------------------------------------------------ | ---------- |
| T-1   | Phase 1 テンプレートに「変更対象 helper / 型の verbatim シグネチャ表」欄を標準化する（F-1 由来）。 | `task-specification-creator/references/phase-template-phase1.md` に反映済み |
| T-2   | NON_VISUAL タスクの Phase 11 outputs（main / manual-smoke-log / link-checklist）の雛形を NON_VISUAL 用に明示分岐する。 | 既存 `task-type-decision.md` / `phase-template-phase11.md` で既に規定済みのため no-op。根拠: `metadata.visualEvidence=NON_VISUAL` と Phase 11 3点 outputs を本 workflow で配置済み |

## ワークフロー観点

| ID    | 指摘                                                                                       | 反映先候補 |
| ----- | ------------------------------------------------------------------------------------------ | ---------- |
| W-1   | batch helper 再利用パターン（フラット配列 → use-case 層で groupBy）を共通 pattern として登録すると、Map 誤認（F-1）を構造的に予防できる。 | `aiworkflow-requirements/references/database-implementation-core.md` と `lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md` に反映済み |

## ドキュメント観点

| ID    | 指摘                                                                                       | 反映先候補 |
| ----- | ------------------------------------------------------------------------------------------ | ---------- |
| D-1   | `expand` whitelist 方式（未知値は黙って除外・常に配列）の防御方針を public API 契約ドキュメントの標準パターンとして記述する。 | `aiworkflow-requirements/references/api-endpoints.md` に current contract として反映済み |

## まとめ

- 改善点: **あり**（F-1 が最重要。実装仕様書での Phase 1 verbatim 引用を必須化すべき）。
- 反映状態: **同一サイクルで反映済み**。本 workflow は `implemented_local_evidence_captured` のため実コード契約を current API 実装済みとして記録する。
