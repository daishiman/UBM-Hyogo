# Phase 11: 手動テスト — main

## 概要

本 Phase は `docs-only` / `visualEvidence: NON_VISUAL` タスクの「手動テスト」を、UI 視覚検証ではなく **ドキュメント整合性の手動検査ログ**として実施する記録である。
Phase 1-10 で生成された Markdown 群（合計 1500 行超）に対し、リンク切れ・用語ゆれ・status 同期・受入条件の重複明記・想定読者の到達経路の 5 観点を機械的・目視的に確認する。

## 入力（参照する前 Phase 出力）

| 入力元 | 用途 |
| --- | --- |
| `outputs/phase-2/design.md` | 用語の正本（trusted/untrusted 境界、`pull_request_target` safety gate 草案）。表記ゆれ照合の基準。 |
| `outputs/phase-6/failure-cases.md` | 失敗シナリオの引用元として、Phase 4 test-matrix と整合しているか確認。 |
| `outputs/phase-7/coverage.md` | AC-1〜AC-9 のカバレッジ表と本文章節の対応確認。 |
| `outputs/phase-8/before-after.md` | リファクタ前後の章番号変更が link-checklist に反映されているか確認。 |
| `index.md` / `artifacts.json` | 13 Phase の status / outputs パスの最終正本。 |

## 出力（本 Phase で作成する成果物）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | 本ファイル。Phase 11 の概要・入出力・実施結果サマリー。 |
| `outputs/phase-11/manual-smoke-log.md` | 手動整合性検査ログ（5 観点 × 結果）。 |
| `outputs/phase-11/link-checklist.md` | 内部・外部リンクのチェック表。 |

## NON_VISUAL の根拠

本タスクは workflow ファイルの編集も UI 変更も含まない `spec_created` タスクである。検証対象は Markdown のみであり、スクリーンショット・HTML レンダリング差分は不要。視覚証跡が必要となるのは後続実装タスク（実 dry-run 実走 / GitHub Actions UI のジョブ表示確認）であり、本 Phase ではその引き継ぎ事項のみ記録する。

## 結果サマリー

- 内部リンク切れ: 0 件
- 外部リンク（GitHub Security Lab / GitHub Docs）: 2 件、いずれも到達可能
- 用語表記ゆれ: 0 件（4 用語すべて統一）
- artifacts.json と本文の status 同期: 一致
- 想定読者の 2 経路（レビュアー / 後続実装担当）: いずれも到達可能

詳細は `manual-smoke-log.md` / `link-checklist.md` を参照。

## 後続タスクへの引き継ぎ

- 実 dry-run 実走時の証跡は `outputs/phase-9/dry-run-log.md`（後続実装タスク側で新設）に追加する。
- GitHub Actions UI のスクリーンショットは後続実装タスクで `visualEvidence: VISUAL` として収集する。
