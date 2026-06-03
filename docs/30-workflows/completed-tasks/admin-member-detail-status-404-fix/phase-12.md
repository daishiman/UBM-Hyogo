# Phase 12: ドキュメント更新

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本 workflow は implemented_local_evidence_captured。本 Phase は local implementation close-out として 6 成果物を確定する。

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | admin-member-detail-status-404-fix |
| Phase | 12（ドキュメント更新） |
| workflow_state | **implemented_local_evidence_captured**（commit・PR・remote migration apply・deploy は全てユーザーゲート） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更 = AC-8） |
| implementation_mode | `new` |
| 主成果物 | Phase 12 strict 7 ファイル（本ファイル + outputs/phase-12 の 6 ファイル） |

## 目的

本 workflow が実装した F-1〜F-5 を、運用・将来タスクへ正しく引き渡すためのドキュメントを整備する。各成果物は local PASS と user-gated external ops を分離して記録する。

## 実行タスク

### 12-1. 実装ガイド（implementation-guide.md）

- Part 1（中学生レベル・日常の例え話）で「会員台帳に名前は載っているのに、その人の“状態カード”が無いせいで詳細が開けない。だから状態カードが無ければ既定の状態カードを自動で用意する」という主旨を専門用語なしで説明する。
- Part 2（技術者レベル）で `ensureMemberStatusRow` のシグネチャと SQL、builder の degraded view 分岐、route の 404 境界変更、migration 0024 の DDL 全文、エラー/エッジケース、member_status の DEFAULT 値一覧を確定する。
- `## 視覚証跡` セクションで「UI/UX 変更なし（apps/web 無変更）のため Phase 11 スクリーンショット不要。代替証跡=自動テスト + staging はユーザーゲート」を明記する。

### 12-2. システム仕様更新サマリ（system-spec-update-summary.md）

- **Step 1-A（完了タスク記録）**: 本 workflow を implemented_local_evidence_captured として記録。
- **Step 1-B（実装状況テーブル）**: local 実装状況と focused evidence を記録。
- **Step 1-C（関連タスク）**: 関連 workflow・依存の有無を記録。
- **Step 2（新規インターフェース追加）**: **N/A**。理由 = `ensureMemberStatusRow` は内部 repository helper であり、公開 API surface（endpoint / リクエスト / レスポンス shape）は不変。member_status 既定行生成は内部実装の挙動であり、外部契約（IPC / API contract）に追加は無い。aiworkflow-requirements への spec 更新は本タスクでは不要（API contract 不変）。

### 12-3. ドキュメント変更ログ（documentation-changelog.md）

全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に明記（「該当なし」も記録）。workflow-local 同期と global skill sync を別ブロックで記録する（Feedback BEFORE-QUIT-003）。

### 12-4. 未タスク検出（unassigned-task-detection.md）

0 件でも必須出力。current / baseline を分離。Phase 10 の MINOR-FUT-1（member 作成経路統一）/ MINOR-FUT-2（member_status への FK 制約導入）を未タスク化候補として記録する（実施時期=将来・実施場所=別 Issue/backlog、本サイクル分離理由=独立した大規模スコープで CONST_007 例外1に該当）。GitHub Issue 起票はユーザーゲート。

### 12-5. スキルフィードバック（skill-feedback-report.md）

改善点なしでも必須。テンプレート / ワークフロー / ドキュメント観点で記録。特に NON_VISUAL bugfix での Phase 11 代替証跡運用と、データ整合性 bugfix における「耐性化＋予防＋backfill」3 層パターンの再利用可能性を記録する。

### 12-6. compliance チェック（phase12-task-spec-compliance-check.md）

canonical 9 見出しを逐語で使用し、CI gate `verify-phase12-compliance` の SSOT 照合に整合させる。見出し 4 は `| Classification | Path | Status |` の 3 列テーブルで、local evidence present / staging user-gated を分離する。

## 参照資料

- Phase 5（F-1〜F-5 実装仕様）/ Phase 10（AC 充足判定・MINOR 候補）/ Phase 11（NON_VISUAL 証跡）
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（canonical 9 見出し SSOT）

## 成果物

- 本ファイル（phase-12.md）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 統合テスト連携

- 本 Phase の 6 成果物は local evidence（manual-test-result.md の PASS 件数）と整合済み。
- compliance-check の canonical 9 見出しは `verify-phase12-compliance` gate で機械照合され、Phase 13 の PR pre-flight（`verify-pr-ready.sh`）の通過条件となる。

## 完了条件

- [x] 実装ガイド（中学生レベル Part 1 + 技術者 Part 2 + 視覚証跡）を作成した
- [x] システム仕様更新サマリ（Step 1-A/1-B/1-C を implemented local で記録・Step 2 = N/A）を作成した
- [x] ドキュメント変更ログ（全 Step + workflow-local / global skill sync 別ブロック）を作成した
- [x] 未タスク検出（0 件でも出力・MINOR 2 件を将来層候補化）を作成した
- [x] スキルフィードバック（3 層パターン / NON_VISUAL 代替証跡）を作成した
- [x] compliance-check（canonical 9 見出し逐語）を作成した
