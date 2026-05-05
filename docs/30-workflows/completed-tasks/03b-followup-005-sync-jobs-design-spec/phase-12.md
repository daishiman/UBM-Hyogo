# Phase 12: 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 12 / 13 |
| Phase 名称 | 実装ガイド + 仕様書同期 + 未タスク検出 + skill feedback |
| Wave | 3 |
| Mode | parallel（実装仕様書 / sync 系コード refactor） |
| 作成日 | 2026-05-02 |
| 前 Phase | 11 (NON_VISUAL evidence 収集) |
| 次 Phase | 13 (PR 作成) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

task-specification-creator skill 規約に従い、`outputs/phase-12/` 配下に最低 7 ファイルを作成する。実装結果の振り返り、未タスクの検出、skill feedback、中学生レベル概念説明を含む。

## 必須生成ファイル一覧（最低 7 件）

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | outputs/phase-12/main.md | 全体総括 / AC 達成状況 / 4 条件再評価 |
| 2 | outputs/phase-12/implementation-guide.md | PR 作成時に Phase 13 へ供給する実装ガイド |
| 3 | outputs/phase-12/documentation-changelog.md | 触ったドキュメント全件の before/after サマリ |
| 4 | outputs/phase-12/unassigned-task-detection.md | スコープ外タスク検出（0 件でも出力必須） |
| 5 | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill / aiworkflow-requirements への改善提案 |
| 6 | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements Step 1-A/B/C と Step 2 の同期結果 |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md | 既存 phase 規約への準拠確認 |

## ファイル別ガイド

### 1. main.md

- AC-1〜AC-11 の達成状況サマリ
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終再評価
- 中学生レベル概念説明セクション:
  - **「なぜ enum を 1 か所に集めるのか」**:
    > たとえば `response_sync` という言葉が 4 つのファイルに別々に書かれていると、新しい種類の仕事を増やすときに 4 か所同時に直さないといけない。1 か所だけ書いて他の場所はそこから読むようにすれば、書き換え漏れがなくなる。教科書の用語集を 1 つにまとめるのと同じ。
  - **「なぜ schema 検証で守るのか」**:
    > データベースから読んだ JSON をそのまま型として信じてしまうと、実は中身が壊れていた場合にバグが「データを使う場所」で初めて出る。zod の schema で「読んだ瞬間にチェック」しておけば、おかしなデータは早い段階で `null` になり、原因追跡が楽になる。健康診断を毎年やるのと同じ予防策。
  - **「なぜ PII を metrics に書かないのか」**:
    > metrics（処理件数などの統計）はログとして長期保存される。ここに名前やメールが混ざると、本来見るべきでない人に個人情報が漏れるリスクが高くなる。`assertNoPii` は「うっかり個人情報が混ざらないように見張る門番」。

### 2. implementation-guide.md

PR 本文の元になる材料。次を含む:

- 概要（What / Why / 影響範囲）
- 変更ファイル一覧（新規 2 / 編集 5）
- 主要 diff サンプル（Phase 7 の Before / After 抜粋）
- 動作確認手順（Phase 11 evidence コマンド再掲）
- ロールバック手順
- 関連 Issue: `Refs #198`

### 3. documentation-changelog.md

- `_design/sync-jobs-spec.md`: §3 / §5 / lock 章 への TS 正本リンク追記
- `database-schema.md`: `sync_jobs` 節を `_design/` + TS 正本参照に統一
- 03a / 03b spec に追加した参照リンク（あれば）

各エントリで before / after を 2-4 行で記述。

### 4. unassigned-task-detection.md

0 件でも出力する。`assertNoPii` の `sync_jobs.metrics_json` 書き込み経路適用は `apps/api/src/repository/syncJobs.ts` の `succeed()` で今回サイクル内に完了しているため、未タスク化しない。

### 5. skill-feedback-report.md

- 良かった点: AC × verify command 対応表のフォーマット / phase 13 構成
- 改善提案: 例「docs-only と implementation の境界判定（CONST_004 例外）が運用で曖昧になりやすいため、index.md の `実装区分` 欄に判定根拠を必須記述するチェックリストを skill 側に追加してほしい」
- aiworkflow-requirements への提案: 例「`_design/` ディレクトリへの正本集約 + TS ランタイム正本リンクという二層パターンを reference として明文化してほしい」

## ローカル実行コマンド

```bash
ls outputs/phase-12/        # 最低 5 件あること
```

## DoD

- [x] 必須 7 ファイルが存在
- [x] main.md に中学生レベル概念説明 3 項目以上
- [x] implementation-guide.md が PR 本文として流用可能
- [x] unassigned-task-detection.md が存在し、未タスク 0 件の場合も理由を記載
- [x] skill-feedback-report.md に改善提案 2 項目以上

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 全体総括 / 中学生レベル説明 |
| ドキュメント | outputs/phase-12/implementation-guide.md | PR 用実装ガイド |
| ドキュメント | outputs/phase-12/documentation-changelog.md | ドキュメント変更履歴 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill 改善提案 |
| メタ | artifacts.json | Phase 12 を completed に更新 |

## 統合テスト連携

- ドキュメント生成のみ
- Phase 13 で PR 作成に流用

## 完了条件

- [x] 7 ファイル全件存在
- [x] 中学生レベル説明 3 項目以上
- [x] implementation-guide.md が Phase 13 へ供給可能

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: implementation-guide.md
- ブロック条件: 必須ファイル不足
