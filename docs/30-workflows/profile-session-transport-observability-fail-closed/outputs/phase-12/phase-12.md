# Phase 12: ドキュメント更新（インデックス）

## メタ情報
正本: `outputs/phase-12/phase-12.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| visualEvidence | NON_VISUAL（証跡は focused tests + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured` |
| 想定 PR base | `dev` |

## 目的
実装ガイド・SSOT 同期判定・未タスク検出・skill フィードバック・コンプライアンス確認の各 strict 成果物を生成し、本ワークフローの local 実装証跡・正本同期・運用引き継ぎ情報を一箇所に集約する。staging 実機ログと PR 操作のみ user-gated に残す。

## Phase 12 成果物一覧（strict 6+）

| # | 成果物 | パス | 役割 |
|---|--------|------|------|
| 1 | メイン | `outputs/phase-12/main.md` | Phase 12 サマリ・変更ファイル分類・user-gated 境界 |
| 2 | 実装ガイド | `outputs/phase-12/implementation-guide.md` | Part 1（概念）+ Part 2（技術）+ 視覚証跡 |
| 3 | システム仕様更新サマリ | `outputs/phase-12/system-spec-update-summary.md` | Step1-A/1-B/1-C/Step2 判定 |
| 4 | ドキュメント変更ログ | `outputs/phase-12/documentation-changelog.md` | 全 Step 結果（workflow-local / global sync 別ブロック） |
| 5 | 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | current / baseline 分離・既存 #1189-1192 重複チェック |
| 6 | skill フィードバック | `outputs/phase-12/skill-feedback-report.md` | 改善点（なしでも出力） |
| 7 | コンプライアンス確認 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 見出し / Phase11 evidence / CONST-005 / artifacts parity |

## 完了条件
- [x] Phase 12 strict 6+ 成果物へのリンクを集約した。

## 成果物
- `outputs/phase-12/phase-12.md`（本ファイル）

## 参照資料
- `../../_shared-context.md`（SSOT）
- 各 Phase 12 strict 成果物

## 統合テスト連携
Phase 12 成果物は Phase 11 の証跡計画（T1〜T5 + MT-A〜MT-D）と Phase 13 の PR 作成計画を引き継ぐ。
