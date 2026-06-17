# Phase 12: ドキュメント更新（インデックス）

## メタ情報
正本: `outputs/phase-12/phase-12.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | `implementation` |
| visualEvidence | NON_VISUAL（証跡は focused vitest + grep gate + diff + staging 実機ログ。local present/staging pending） |
| workflow_state | `implemented_local_evidence_captured` |
| 想定 PR base | `dev` |

## 目的
実装ガイド・SSOT 同期判定・Issue #1190 現行コード最適化草稿（T04）・未タスク検出・skill フィードバック・コンプライアンス確認の各 strict 成果物を生成し、本ワークフローの仕様書正本・user-gated 境界・運用引き継ぎ情報を一箇所に集約する。コード実装・ローカル証跡取得は完了。GitHub mutation・PR・staging は user-gated に残す。

## Phase 12 成果物一覧（strict 7 + T04）

| # | 成果物 | パス | 役割 |
|---|--------|------|------|
| 1 | メイン | `outputs/phase-12/main.md` | Phase 12 サマリ・変更ファイル分類（計画）・user-gated 境界 |
| 2 | 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念）+ Part 2（技術）+ 視覚証跡（NON_VISUAL） |
| 3 | システム仕様更新サマリ | `outputs/phase-12/system-spec-update-summary.md` | Step1-A/1-B/1-C/Step2 判定（本 WF は更新 N/A・根拠付き） |
| 4 | ドキュメント変更ログ | `outputs/phase-12/documentation-changelog.md` | workflow-local / global sync 別ブロック（該当なしも記録） |
| 5 | 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | current 0 件・baseline（既存 #1189〜#1192 との関係表）・新規起票なし |
| 6 | skill フィードバック | `outputs/phase-12/skill-feedback-report.md` | 改善候補の記録（skill 本体は編集しない） |
| 7 | コンプライアンス確認 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings / Phase 11 evidence inventory / Gate-A 証跡 |
| 8 | Issue 最適化草稿（T04） | `outputs/phase-12/issue-1190-comment-draft.md` | Issue #1190 へ投稿する現行コード最適化コメント草稿（投稿は user-gated） |

## 完了条件
- [x] Phase 12 strict 7 + T04 草稿へのリンクを集約した。

## 成果物
- `outputs/phase-12/phase-12.md`（本ファイル）

## 参照資料
- `../../_shared-context.md`（SSOT）
- 各 Phase 12 strict 成果物 + `issue-1190-comment-draft.md`

## 統合テスト連携
Phase 12 成果物は Phase 11 の証跡計画（TC-1〜TC-4 + MT-1〜MT-6・local present/staging pending）と Phase 13 の PR 作成計画（G1-G4・user-gated）を引き継ぐ。
