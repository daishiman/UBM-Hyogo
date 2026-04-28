# Phase 12 — 仕様反映 総括

| 項目 | 値 |
| --- | --- |
| タスク | task-conflict-prevention-skill-state-redesign |
| Phase | 12 / 13 |
| ワークフロー | spec_created（status は `completed` に置き換えない） |
| 視覚証跡区分 | NON_VISUAL |
| 状態 | spec_created |

## サマリー

skill ledger コンフリクト対策 4 施策（A-1 / A-2 / A-3 / B-1）の仕様書群について、
後続実装タスクが参照する **実装ガイド**、`docs/00-getting-started-manual/specs/` への
追記方針、ドキュメント変更履歴、未タスク検出、skill フィードバックを Phase 12 にまとめる。

本ワークフローは spec_created のため、specs 配下の実テキストは別タスク（A-1〜B-1 実装後）で
書き込む。Phase 12 では「何を / どこに / どう書くか」を凍結する。

## サブドキュメント Index

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `implementation-guide.md` | A-1〜B-1 実装担当者向け作業ガイド（PR メッセージ元） |
| 2 | `system-spec-update-summary.md` | `docs/00-getting-started-manual/specs/skill-ledger.md` 追記方針（AC-7） |
| 3 | `documentation-changelog.md` | 本タスク全 outputs の変更履歴 |
| 4 | `unassigned-task-detection.md` | 派生未タスクの検出（A-1〜B-1 実装 / render script / hook / 移行） |
| 5 | `skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements への改善提案 |
| 6 | `phase12-task-spec-compliance-check.md` | 本タスク自体の規約準拠 self-check（root evidence） |

## AC トレース

| AC | 充足ファイル |
| --- | --- |
| AC-7 | `system-spec-update-summary.md` ↔ `documentation-changelog.md` |
| AC-9 | コード変更なし（本 phase 内すべて Markdown） |

## 完了条件

- [ ] 7 ファイル（本書 + 上記 6）作成
- [ ] AC-7 が満たされる（specs 追記手順が changelog と整合）
- [ ] spec_created status が `completed` に置き換わっていない
- [ ] artifacts.json の Phase 12 を completed に更新

## 次 Phase

- 次: Phase 13（完了確認）— ユーザー承認なしでは実行しない
- 引き継ぎ: `implementation-guide.md` を後続 PR テンプレートの基礎として使用
