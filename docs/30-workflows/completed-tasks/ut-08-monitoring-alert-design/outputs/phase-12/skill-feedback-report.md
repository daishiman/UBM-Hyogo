# task-specification-creator / aiworkflow-requirements スキルフィードバック — UT-08

## 対象タスク

UT-08 モニタリング/アラート設計（spec_created / non_visual / design）

## 実施日: 2026-04-27

> SKILL.md「`skill-feedback-report.md` は改善点なしでも必ず出力」遵守。本タスクでは **改善点あり**（4 件）を記録する。

---

## 1. テンプレート改善（task-specification-creator）

### 1.1 phase-12.md の 300 行上限と Phase 12 標準構成の競合（MINOR-01）

| 観点 | 内容 |
| --- | --- |
| 事象 | `phase-12.md` が 380 行で、300 行上限を 80 行超過 |
| 原因 | task-specification-creator の Phase 12 標準構成（Task 1-6 + Step 1-A〜1-C + Step 2 + 同期ルール + 完了条件 + 中学生レベル概念説明）を全部入れると意味的分割不可 |
| 提案 | task-specification-creator の SKILL.md / `phase-12-documentation-guide.md` に「Phase 12 は意味的分割不可ファイルとして 300 行制限を**条件付き許容**」と明記する |
| 優先度 | LOW（運用上の許容範囲、意味的分割すると Step 1-A〜1-C と Task 1-6 の対応が崩れる） |

### 1.2 NON_VISUAL タスクの Phase 11 テンプレート明確化（提案）

| 観点 | 内容 |
| --- | --- |
| 事象 | Phase 11 視覚テンプレ（`manual-test-checklist.md` / `screenshot-plan.json`）と非視覚テンプレ（`manual-smoke-log.md` / `link-checklist.md`）の使い分けが SKILL.md UBM-002 / UBM-003 を読まないと判断しにくい |
| 提案 | Phase 11 テンプレに「タスク種別ごとの必須 outputs 表」を冒頭に追加（visual / non_visual / spec_created で 1 表） |
| 優先度 | MEDIUM（NON_VISUAL タスクが今後増える想定） |

---

## 2. ワークフロー改善

### 2.1 自動チェックスクリプト `validate-phase-output.js` の引数仕様

| 観点 | 内容 |
| --- | --- |
| 事象 | `--workflow` / `--phase` フラグを期待した実行が「ディレクトリが存在しません: --workflow」エラーで停止。実際は positional argument（ディレクトリパス直渡し）が正解だった |
| 提案 | スクリプト冒頭に `--help` オプションを追加し、使用法を出力。または `--workflow <path>` フラグを実装 |
| 優先度 | LOW（仕様書 phase-11.md のコマンド例を実情に合わせ修正でも吸収可） |

### 2.2 `outputs/artifacts.json` ミラー警告

| 観点 | 内容 |
| --- | --- |
| 事象 | `validate-phase-output.js` が「artifacts.json と outputs/artifacts.json が一致していません」警告を出すが、本ワークフローには `outputs/artifacts.json` ミラーが存在しない（必要性が不明） |
| 提案 | ミラー必須なら明文化、不要なら警告を抑制 |
| 優先度 | LOW |

---

## 3. ドキュメント改善（aiworkflow-requirements）

### 3.1 監視関連 references の追加

| 観点 | 内容 |
| --- | --- |
| 事象 | aiworkflow-requirements の `references/` に監視・観測関連の topic がなく、UT-08 着手時に 05a 仕様と Cloudflare 公式を都度開く必要があった |
| 提案 | `references/observability-monitoring.md`（仮）を新設し、WAE / Cloudflare Analytics / UptimeRobot 無料枠仕様・閾値設計の指針を集約 |
| 優先度 | MEDIUM（後続の Wave 2 実装タスクで参照頻度が高い） |
| 反映先 | `topic-map.md` の `monitoring` / `observability` キーワードに UT-08 outputs/phase-02/ を追加（system-spec-update-summary.md Step 1-A 同期で対応） |

---

## 4. NON_VISUAL Phase 11 の改善観点

### 4.1 自動チェック対象の運用

| 項目 | 結果 |
| --- | --- |
| SKILL.md UBM-002 / UBM-003 通り運用できたか | PASS（main.md / manual-smoke-log.md / link-checklist.md の 3 点必須出力を順守、視覚テンプレ非作成） |
| `screenshots/.gitkeep` を残してしまうケースがなかったか | PASS（NON_VISUAL 判定で `outputs/phase-11/screenshots/` 自体を作成せず、`.gitkeep` 残置なし） |
| 自動チェック 4 種（artifact 名 / JSON / line budget / 05a 参照）が全て実施できたか | PASS（実施結果は manual-smoke-log.md §1〜§4） |

### 4.2 改善提案

- NON_VISUAL タスクで「PASS_WITH_OPEN_DEPENDENCY」を明示する記法を SKILL.md に追加（外部依存ファイル未生成の場合の AC 判定ルール）。本タスクでは `link-checklist.md §4` で独自記法を導入したが、共通化されると後続タスクで判定が一貫する

---

## 5. その他（任意）

### 5.1 monitoring-design タスクの Phase 構成所感

- Phase 1〜10 の流れは設計タスクとしてフィット感があった
- Phase 4「テスト計画・事前検証」は実装タスク向け色が強く、設計タスクでは「設計検証 / 査読観点定義」程度で十分。テンプレに「タスク種別ごとの Phase 4 ガイド」追記提案

---

## 6. まとめ

| 種別 | 件数 |
| --- | --- |
| テンプレート改善 | 2 件（MINOR-01 / NON_VISUAL Phase 11 表） |
| ワークフロー改善 | 2 件（スクリプト引数 / ミラー警告） |
| ドキュメント改善 | 1 件（aiworkflow-requirements references 追加） |
| NON_VISUAL Phase 11 観点 | 全 PASS（改善提案 1 件） |
| 改善点なし | **該当しない**（複数の改善点あり） |
