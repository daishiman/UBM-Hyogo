# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 12 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 11 (手動 smoke) |
| 下流 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

implementation guide / changelog / unassigned task / compliance / skill feedback の 6 種を生成し、Wave 2/3/4 への引き渡しを完成。

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

1. implementation-guide.md 生成
2. system-spec-update-summary.md
3. documentation-changelog.md
4. unassigned-task-detection.md
5. skill-feedback-report.md
6. phase12-task-spec-compliance-check.md
7. outputs/phase-12/main.md 集約

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/ | 全 phase |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave matrix |

## 実行手順

### 6 ドキュメント生成 → 集約

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 13 | PR description |
| Wave 2/3/4 | implementation-guide |

## 多角的チェック観点（不変条件参照）

- 全 6 不変条件を Wave 2/3/4 に伝播

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1〜6 | 6 ドキュメント | 12 | pending |
| 7 | 集約 | 12 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-12/main.md |
| ドキュメント | outputs/phase-12/implementation-guide.md |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md |
| ドキュメント | outputs/phase-12/documentation-changelog.md |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md |
| ドキュメント | outputs/phase-12/skill-feedback-report.md |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 6 ドキュメント生成

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-12/ 7 ファイル配置
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 13
- 引き継ぎ事項: changelog
- ブロック条件: 6 ドキュメント不足

## implementation-guide.md（要約）

| 後続 Wave | 確認項目 |
| --- | --- |
| 02a | `MemberId` / `ResponseId` / `ResponseEmail` branded、`MemberIdentity` / `MemberStatus` / `FormResponse` 型を import |
| 02b | `TagId` / `StableKey` branded、`tag_definitions` 関連 viewmodel を import |
| 02c | `AdminId` branded、`AdminDashboardView` / `AdminMemberListView` / `AdminMemberDetailView` viewmodel を import |
| 03a | `getForm()` を呼び出し、`FormSchemaZ` で parse、`StableKey` 比較 |
| 03b | `listResponses()` を呼び出し、`FormResponseZ` で parse、`responseEmail` で identity 紐付け |
| 04a/b/c | viewmodel 10 種を Hono ハンドラ response に使用、`*RequestZ` / `*ResponseZ` で boundary validation |
| 05a/b | `SessionUser` を session callback で組み立て |
| 06a/b/c | viewmodel 10 種を Server Component fetch result として使用 |

## system-spec-update-summary.md（要約）

- specs/04 への更新: なし（spec を消費）
- specs/01 への更新: なし

## documentation-changelog.md（要約）

- 新規: 01b 配下 15 ファイル
- 既存変更: なし

## unassigned-task-detection.md（要約）

- 0 件

## skill-feedback-report.md（要約）

- task-specification-creator skill: zod schema を境界 4 点で適用する分類が後続実装の指針として有効

## phase12-task-spec-compliance-check.md（要約）

| Phase | 準拠 | 追加セクション |
| --- | :---: | :---: |
| 1〜13 | OK | 全準拠 |
