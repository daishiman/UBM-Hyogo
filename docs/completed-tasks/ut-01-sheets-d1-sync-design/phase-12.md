# Phase 12: ドキュメント更新・正本同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| タスク種別 | docs-only（設計文書作成のみ。コード・テスト実装なし） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新・正本同期 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動確認・ウォークスルー) |
| 次 Phase | 13 (PR作成・完了処理) |
| 状態 | completed |

## 目的

Phase 12 の必須6成果物を作成し、aiworkflow-requirements スキルの参照資料との整合性を same-wave で閉じる。
設計文書（outputs/phase-05/ 配下）の内容を正本仕様（references/ 配下）に同期させ、他タスクや将来の開発者が正本を参照できる状態にする。

## 実行タスク

- implementation-guide.md の作成（Part 1: 中学生レベル / Part 2: 技術者向け）
- system-spec-update-summary.md の作成（Step 1-A〜1-G、Step 2A/2B 判定）
- documentation-changelog.md の作成（変更ファイル、validator 結果、current/baseline）
- unassigned-task-detection.md の作成（0件でも出力必須）
- skill-feedback-report.md の作成（改善点なしでも出力必須）
- phase12-task-spec-compliance-check.md の作成（Task 12-1〜12-6 の全完了確認）
- artifacts.json の最終更新

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-11/walkthrough-report.md | ウォークスルーで判明した残課題 |
| 必須 | outputs/phase-05/sync-method-comparison.md | 正本同期の対象 |
| 必須 | outputs/phase-05/sync-audit-contract.md | 正本同期の対象 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | 関連正本仕様の特定 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | 更新先セクションの確認 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1 / Step 2 / validation ルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | Phase 12 必須成果物 |

## 実行手順

### ステップ 1: implementation-guide.md 作成

- Part 1 では、日常生活の例えで「なぜ Sheets の情報を D1 に写す必要があるか」を先に説明する。
- Part 2 では、sync_audit 論理スキーマ、同期方式、API シグネチャ案、エラー処理、設定可能パラメータを開発者向けに記載する。

### ステップ 2: system-spec-update-summary.md 作成

- Step 1-A〜1-G の完了記録を行う。LOGS.md x2、topic-map、関連タスクテーブル、実装状況 `spec_created` を同一 wave で確認する。
- Step 2A として、Sheets → D1 同期方式・sync_audit・API 署名案が domain spec sync 対象かを判定する。
- Step 2B として、必要な `.claude/skills/aiworkflow-requirements/references/` の実更新を行い、後追い更新を示す文言を残さない。

### ステップ 3: documentation-changelog.md 作成

- 変更ファイル一覧、validator 実行結果、baseline/current の区別、Phase 10 MINOR 追跡結果を記録する。
- Phase 12 成果物に未実更新を示す保留表現が残っていないことを確認する。

### ステップ 4: unassigned-task-detection.md 作成

- 設計タスク特有の4パターン（型定義→実装、契約→テスト、UI仕様→コンポーネント、仕様書間差異→設計決定）を確認する。
- 0件でも「設計タスクパターン確認済み、0件」と明記する。

### ステップ 5: skill-feedback-report.md 作成

- task-specification-creator と aiworkflow-requirements への改善点を記録する。
- 改善点がない場合も「改善点なし」として出力する。

### ステップ 6: phase12-task-spec-compliance-check.md と handoff

- 本タスクの全 Phase の status を確認し、artifacts.json を最終状態に更新する。
- Task 12-1〜12-6 の全成果物が存在し、正式ファイル名であることを確認する。
- 次 Phase（PR 作成）に渡す情報（変更ファイル一覧・PR タイトル案等）を明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | Phase 12 の6成果物と artifacts.json を PR 作成の入力として使用 |

## 多角的チェック観点（AIが判断）

- 価値性: 正本仕様が設計成果物と同期することで、他開発者・他タスクが正確な情報を参照できるか。
- 実現性: 参照資料の更新が既存の記述と矛盾しないか。
- 整合性: 設計成果物と参照資料が一致しているか。
- 運用性: 正本同期後の参照資料が将来の開発者に有用か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md 作成 | 12 | completed | Part 1 / Part 2 必須 |
| 2 | system-spec-update-summary.md 作成 | 12 | completed | Step 1-A〜1-G、Step 2A/2B |
| 3 | documentation-changelog.md 作成 | 12 | completed | validator と変更履歴 |
| 4 | unassigned-task-detection.md 作成 | 12 | completed | 0件でも出力 |
| 5 | skill-feedback-report.md 作成 | 12 | completed | 改善点なしでも出力 |
| 6 | phase12-task-spec-compliance-check.md 作成 | 12 | completed | Task 12-1〜12-6 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 初学者向け概念説明と技術者向け仕様 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1 / Step 2 の正本同期結果 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴と validator 結果 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出結果 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill へのフィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Phase 12 必須タスク準拠チェック |
| メタ | artifacts.json | 全 Phase の最終状態記録 |

## 完了条件

- Phase 12 必須6成果物が正式ファイル名で作成済み
- 参照資料との差分確認結果と Step 2 要否が記録されている
- 必要な `.claude/skills/aiworkflow-requirements/references/` 更新が完了している（または更新不要と根拠付きで明記）
- `spec_created` ステータスとして Step 1-A〜1-C が N/A ではなく same-wave sync で閉じられている
- artifacts.json が最終状態に更新されている
- Phase 13 への handoff 事項が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 正本仕様と設計成果物が同期している
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成・完了処理)
- 引き継ぎ事項: Phase 12 の6成果物、変更ファイル一覧、PR タイトル案を Phase 13 で使用する。
- ブロック条件: Phase 12 の6成果物のいずれかが未作成なら次 Phase に進まない。

## 正本同期チェックリスト

| 確認項目 | 状態 | 備考 |
| --- | --- | --- |
| Sheets → D1 同期方式の記述が references/ に存在するか | completed | quick-reference / LOGS / changelog に current facts として記録 |
| sync_audit スキーマが参照資料に記載されているか | completed | 既存 migration の `run_id` / `trigger_type` / `rows_upserted` 契約へ合わせた |
| 採用方式の選定理由が参照資料に反映されているか | completed | Cron pull を採用、manual/backfill は同じ core runner を使う |
| artifacts.json の全 Phase が completed になっているか | completed | Phase 1-12 completed、Phase 13 pending |

## Phase 12 正式成果物チェックリスト

| 成果物 | 状態 | 備考 |
| --- | --- | --- |
| implementation-guide.md | completed | Part 1 / Part 2 |
| system-spec-update-summary.md | completed | Step 1 / Step 2 |
| documentation-changelog.md | completed | validator 結果を含む |
| unassigned-task-detection.md | completed | 0件でも必須 |
| skill-feedback-report.md | completed | 改善点なしでも必須 |
| phase12-task-spec-compliance-check.md | completed | Task 12-1〜12-6 |
