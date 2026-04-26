# Phase テンプレート（app canonical）

各 phase-XX.md は次のセクションを必ず含む。

## 必須セクション

- メタ情報（task name / phase / wave / mode / 作成日 / 上流 / 下流）
- 目的（このフェーズで何を確定させるか）
- 実行タスク（順序付き、各サブタスクに完了条件）
- 参照資料（specs/, prototype/, gas-prototype/, doc/01-infrastructure-setup/）
- 実行手順（具体的な command / file / 確認項目）
- 統合テスト連携（他タスクとの依存・引き渡し）
- 多角的チェック観点（不変条件 #1〜#15、認可境界、無料枠、UI/UX）
- サブタスク管理（チェックリスト）
- 成果物（outputs/phase-XX/main.md ほか）
- 完了条件（AC = Acceptance Criteria）
- タスク100%実行確認（quantitative checklist）
- 次 Phase への引き渡し

## Phase 別追加セクション

| Phase | 必須追加 |
| --- | --- |
| 1 | true issue / 依存境界 / 価値とコスト / 4条件（価値性・実現性・整合性・運用性） |
| 2 | Mermaid 構造図 / env / dependency matrix / module 設計 |
| 3 | alternative 案 3つ以上 / PASS-MINOR-MAJOR 判定 |
| 4 | verify suite（unit / contract / E2E / authorization 設計） |
| 5 | runbook / placeholder / 擬似コード / sanity check |
| 6 | failure cases（401/403/404/422/5xx/sync 失敗等） |
| 7 | AC matrix（Phase 1 AC × Phase 4 検証 × Phase 5 実装） |
| 8 | Before / After（命名・型・path・endpoint） |
| 9 | free-tier 見積もり / secret hygiene チェックリスト / a11y |
| 10 | GO/NO-GO 判定 / blocker 一覧 |
| 11 | manual evidence（screenshot / curl 結果 / wrangler 出力 placeholder） |
| 12 | implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | approval gate / local-check-result / change-summary / PR template |

## 出力先

- `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md`
- 追加成果物（diagram, runbook, evidence など）はサブディレクトリ `outputs/phase-XX/` に配置
