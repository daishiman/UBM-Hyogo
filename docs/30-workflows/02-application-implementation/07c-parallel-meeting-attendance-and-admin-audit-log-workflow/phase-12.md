# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

Phase 1〜11 の成果を 6 種ドキュメントに集約し、後続 task / 別エージェントが最少コストで本タスクを再現 / 引き継げる状態にする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

- [ ] implementation-guide.md の作成
- [ ] system-spec-update-summary.md の作成
- [ ] documentation-changelog.md の作成
- [ ] unassigned-task-detection.md の作成
- [ ] skill-feedback-report.md の作成
- [ ] phase12-task-spec-compliance-check.md の作成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/main.md | 元データ |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 必須 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 意味 |
| 必須 | doc/02-application-implementation/README.md | Wave 一覧 |

## 6 ドキュメント生成方針

### 1. implementation-guide.md
- 実装担当が見れば手順通り進められる guide
- 内容: 6 ステップ runbook + 擬似コード + sanity check + verify suite + a11y / sanitize 規約

### 2. system-spec-update-summary.md
- 本タスクで触れた spec の差分を要約（`08-free-database.md` に audit_log 言及、`11-admin-management.md` に attendance 重複阻止追記等、条件を満たす場合は次 wave で）
- 本 task は spec_created なので spec 本体改訂は提案のみ

### 3. documentation-changelog.md
- `doc/02-application-implementation/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/` 配下の生成ファイル一覧と日付

### 4. unassigned-task-detection.md
- 本 task scope out 項目で別 task に紐付かないものを列挙
  - audit log 閲覧 UI（`/admin/audit` 等）→ 未割当
  - 外部 SIEM 連携 → 未割当（運用フェーズで再検討）
  - attendance 一括 import → 未割当

### 5. skill-feedback-report.md
- task-specification-creator skill 利用時の改善提案（例: audit / hook の共通記述テンプレを skill に追加すべき）

### 6. phase12-task-spec-compliance-check.md
- Phase 1〜11 の成果物が `_templates/phase-template-app.md` の必須セクションを満たしているかチェック
- 不変条件 #5 / #7 / #11 / #13 / #15 が記述されているかチェック

## 中学生レベル概念説明（補助）

- attendance は「出席簿」、audit log は「変更ノート」、UNIQUE 制約は「同じ人を 2 回書けないルール」、admin gate は「鍵付きの扉」、削除済み除外は「やめた人は呼ばないリスト」と例えて新規メンバーへ説明できるようにする

## Phase 12 必須成果物表

| 成果物 | パス |
| --- | --- |
| implementation guide | outputs/phase-12/implementation-guide.md |
| system spec update | outputs/phase-12/system-spec-update-summary.md |
| changelog | outputs/phase-12/documentation-changelog.md |
| unassigned | outputs/phase-12/unassigned-task-detection.md |
| skill feedback | outputs/phase-12/skill-feedback-report.md |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR 本文に implementation-guide / changelog のリンクを引用 |
| 下流 08a / 08b | unassigned に挙がった項目を考慮 |
| 全 Wave | compliance-check で不変条件カバレッジを保証 |

## 多角的チェック観点

- 不変条件 **#5** / **#7** / **#11** / **#13** / **#15** が implementation-guide / compliance-check で記述
- spec_created なので spec 本体改訂はせず、提案のみ system-spec-update-summary に
- 中学生レベル概念で運用引き継ぎ可能性を担保

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | runbook + 擬似コード集約 |
| 2 | system-spec-update-summary | 12 | pending | spec 改訂提案 |
| 3 | documentation-changelog | 12 | pending | ファイル一覧 |
| 4 | unassigned-task-detection | 12 | pending | 3 項目以上 |
| 5 | skill-feedback-report | 12 | pending | skill 改善提案 |
| 6 | phase12-task-spec-compliance-check | 12 | pending | 必須セクション + 不変条件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 差分 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 生成ファイル一覧 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill 改善 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 準拠チェック |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種ドキュメント全て生成
- [ ] compliance-check で不変条件カバレッジ 100%
- [ ] unassigned に最低 3 項目記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物 6 種配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 12 を completed

## 次 Phase

- 次: Phase 13 (PR 作成 — user 承認後)
- 引き継ぎ: 6 ドキュメントへのリンク
- ブロック条件: 6 ドキュメントいずれか欠落なら Phase 13 不可
