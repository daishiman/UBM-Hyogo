# Phase 11 — 手動テスト サマリ

## 0. NON_VISUAL 宣言（冒頭固定）

- **タスク種別**: docs-only
- **visualEvidence**: NON_VISUAL
- **非視覚的理由**: 草案仕様化のみで UI / 画面遷移 / コマンド実行を伴わない
- **代替証跡**: 文書整合チェック（リンク・命名・artifacts.json 一致）
- **UI/UX 変更なしのため Phase 11 スクリーンショット不要**

## 1. 目的

実装を伴わない docs-only タスクにおいて、Phase 11 の「手動テスト」フェーズ
を文書整合チェックに読み替え、その実行記録と再現可能な手順を残す。

## 2. 検証スコープ

| 区分 | 項目 |
| --- | --- |
| 文書一貫性 | index.md ↔ artifacts.json ↔ phase-NN.md ↔ outputs/phase-N/*.md の整合 |
| 命名 canonical | branch-protection / auto-rebase / pr-target-safety-gate / required-status-checks の draft 識別子 |
| AC トレース | Phase 10 `go-no-go.md` のトレーサビリティ表 |
| 横断依存 | cross_task_order と Phase 1 §6 の責務境界 |
| 承認ゲート | Phase 13 のみ `user_approval_required: true` |

## 3. 不可能事項（実地操作不可）

以下は本タスクでは **実施しない**。実装タスク側で行う。

- `gh api repos/.../branches/main/protection` の dry-run / apply
- GitHub Actions workflow の実走（`auto-rebase` / `pr-target-safety-gate`）
- branch protection 適用後のレビュー数強制テスト
- secrets 露出シナリオの実環境再現

## 4. 成果物

- `outputs/phase-11/main.md`（本書）
- `outputs/phase-11/manual-smoke-log.md`（NON_VISUAL マニュアルテスト記録）
- `outputs/phase-11/link-checklist.md`（リンク整合チェックリスト）

## 5. 完了条件

- [x] NON_VISUAL 宣言が冒頭に明記されている
- [x] 代替証跡が「文書整合チェック」と特定されている
- [x] 実地操作不可の項目が列挙されている
- [x] manual-smoke-log.md / link-checklist.md と整合している
