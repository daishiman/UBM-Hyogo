# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

Phase 1〜11 を 6 種ドキュメントに集約し、実装担当 / 別エージェントへの引き継ぎコストを最小化する。

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

- [ ] implementation-guide.md
- [ ] system-spec-update-summary.md
- [ ] documentation-changelog.md
- [ ] unassigned-task-detection.md
- [ ] skill-feedback-report.md
- [ ] phase12-task-spec-compliance-check.md

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/main.md | 元データ |
| 必須 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 意味 |
| 必須 | doc/02-application-implementation/README.md | Wave 一覧 |

## 6 ドキュメント生成方針

### 1. implementation-guide.md
- runbook 7 step + 5 種 suite signature + fixture / helper 配置 + coverage 閾値 + CI yml
- 「30 endpoint × 6〜7 ケース ≒ 200 test」のスケール感を明示

### 2. system-spec-update-summary.md
- 本タスクで触れた spec の差分提案
  - 09-ui-ux.md: a11y は 08b 担当として明記
  - 13-mvp-auth.md: AuthGateState の test 観測を contract test 例として追記
  - 16-component-library.md: test 名の suffix 規約 (`*.contract.spec.ts` 等) を補足

### 3. documentation-changelog.md
- 本 task 配下 15 ファイル + outputs/* 一覧

### 4. unassigned-task-detection.md
- visual regression (`@playwright/test --update-snapshots`) → 未割当（08b の scope out にも記載）
- production 環境負荷 test → 未割当（運用フェーズ）
- D1 migration test → 02b で完了している前提だが、追加 migration 時の test 化が未割当

### 5. skill-feedback-report.md
- task-specification-creator skill 改善提案: contract / authz / type / lint の 4 軸テンプレを skill に追加
- msw handler テンプレを skill resource に同梱推奨

### 6. phase12-task-spec-compliance-check.md
- Phase 1〜11 の必須セクション準拠確認
- 不変条件 #1 / #2 / #5 / #6 / #7 / #11 が test として記述されているか確認

## 中学生レベル概念説明（補助）

- contract test は「契約書通りの形で答えが返るか確認」、authz test は「鍵の付いた扉を間違った人が開けないか確認」、type test は「設計図段階で間違いを止める」、lint test は「禁止された部品を使っていないか確認」、coverage は「テストでどれだけコードを通したか」と例える

## Phase 12 必須成果物

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
| Phase 13 | PR 本文に 6 ドキュメントへのリンク |
| 下流 09a / 09b | unassigned 項目を考慮 |

## 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11** が implementation-guide / compliance-check に記述
- spec_created なので spec 本体は提案のみ
- 中学生レベル概念で運用引き継ぎ容易

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | runbook + signature |
| 2 | system-spec-update | 12 | pending | spec 差分 |
| 3 | changelog | 12 | pending | ファイル一覧 |
| 4 | unassigned | 12 | pending | 3 件以上 |
| 5 | skill-feedback | 12 | pending | skill 改善 |
| 6 | compliance-check | 12 | pending | 必須セクション + 不変条件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | guide |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 差分 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | changelog |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | unassigned |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance |
| メタ | artifacts.json | phase 12 status |

## 完了条件

- [ ] 6 種ドキュメント生成
- [ ] compliance-check で不変条件 100%
- [ ] unassigned 3 件以上

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物 6 種配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 12 を completed

## 次 Phase

- 次: Phase 13 (PR 作成 — user 承認後)
- 引き継ぎ: 6 ドキュメントへのリンク
- ブロック条件: 6 ドキュメントいずれか欠落なら Phase 13 不可
