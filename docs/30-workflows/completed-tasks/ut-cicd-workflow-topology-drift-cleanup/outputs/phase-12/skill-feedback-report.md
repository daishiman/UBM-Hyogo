# Phase 12 成果物: スキルフィードバックレポート (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 12 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |

## 対象スキル

| スキル | 役割 | 本タスクでの利用面 |
| --- | --- | --- |
| `aiworkflow-requirements` | 正本仕様の検索/参照/更新 | `references/deployment-gha.md` / `deployment-cloudflare.md` の drift 解消編集 |
| `task-specification-creator` | Phase 1〜13 仕様書生成 | docs-only / specification-cleanup タスクの Phase 設計運用 |

## 良かった点（keep）

| # | 観点 | 内容 |
| --- | --- | --- |
| 1 | Progressive Disclosure | `resource-map` / `topic-map` 起点で `deployment-gha.md` / `deployment-cloudflare.md` のみを最小読込で改修できた |
| 2 | docs-only 据え置きルール | `workflow_state = spec_created` 据え置き運用が Phase 11/12 ガイドに明記され、判断ぶれが発生しなかった |
| 3 | same-wave sync の例示 | LOGS ×2 / references ×2 / SKILL ×2 の組合せパターンが事前に明記され、漏れなく追記できた |
| 4 | 派生命名規則 | `UT-CICD-DRIFT-IMPL-<scope>-<short-summary>.md` ルールが明示され、衝突確認が rg 1 行で済んだ |
| 5 | NON_VISUAL 整合 | `screenshots/` 不在の許容が明記され、無駄な画像生成を回避できた |

## 改善提案（improve）

| # | 観点 | 現状 | 提案 |
| --- | --- | --- | --- |
| 1 | yamllint / actionlint 前提 | ローカル未導入の場合 N/A 扱いで通過するが、CI 側でも未配備 | `verify-indexes.yml` 同等 gate として `actionlint` workflow を導入する派生タスクを検討 |
| 2 | 旧 path 検出 | `docs/05a-...` 直下の旧参照は手動 grep で発見 | `task-doc-vs-docs-path-lint-001` を強化し、移設後パス整合を CI で gate |
| 3 | references 変更履歴 | 各 `references/*.md` の末尾「変更履歴」テーブルは手書き | skill 側で「changelog 行追加」ヘルパースクリプト化を検討 |
| 4 | drift matrix schema | 8 列固定スキーマは強力だが、docs-only / impl の二値混在を 1 表現で扱う | 派生委譲列を separate に切り出すテンプレートを task-specification-creator に追加 |
| 5 | LOGS 構造 | active LOGS が `LOGS/_legacy.md` 直下 1 ファイルに集約 | 規模拡大時に YYYY-MM 単位 split できる規約を skill に明記 |

## アンカー / 参照精度

| 参照 | 精度 |
| --- | --- |
| `aiworkflow-requirements/references/deployment-gha.md` | 高（現実体 5 yaml に対する drift を網羅）|
| `aiworkflow-requirements/references/deployment-cloudflare.md` | 高（apps/web Pages / apps/api Workers の二系統判定が明確）|
| `task-specification-creator` Phase 11 / Phase 12 ガイド | 高（NON_VISUAL / docs-only 据え置きが両 phase で一貫）|

## 完了条件チェック

- [x] 対象スキル明示
- [x] keep 5 / improve 5 を表化
- [x] アンカー精度評価
