# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

Phase 1〜11 の成果物を 6 種ドキュメントに集約し、後続実装者 / 別エージェントへの引き継ぎコストを最小化する。Playwright + axe + screenshot 命名規約 + page object 配置 + CI workflow + 不変条件 #4 / #8 / #9 / #15 の test 化を中心に整理する。

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

- [ ] implementation-guide.md（runbook + 7 spec signature + page object + fixture + helpers + screenshot 命名 + axe 戦略 + CI yml）
- [ ] system-spec-update-summary.md（09-ui-ux / 13-mvp-auth / 16-component-library への提案差分）
- [ ] documentation-changelog.md（本 task 配下 15 ファイル + outputs/* 一覧）
- [ ] unassigned-task-detection.md（未割当 ≥ 3 件）
- [ ] skill-feedback-report.md（task-specification-creator skill 改善）
- [ ] phase12-task-spec-compliance-check.md（Phase 1〜11 必須セクション + 不変条件カバー）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/main.md | 元データ |
| 必須 | outputs/phase-11/evidence/ | screenshot / axe / yml |
| 必須 | doc/02-application-implementation/_templates/phase-meaning-app.md | Phase 意味 |
| 必須 | doc/02-application-implementation/README.md | Wave 一覧 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス（spec 差分提案元） |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState（spec 差分提案元） |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y（spec 差分提案元） |

## 6 ドキュメント生成方針

### 1. implementation-guide.md

- runbook 7 step（依存追加 / playwright.config / fixtures+helpers / D1 seed / page object / spec / CI yml）
- 7 spec signature 一覧（public / login / profile / admin / search / density / attendance）
- page object 5 class（PublicPage / LoginPage / ProfilePage / AdminPage / AttendancePage）
- fixture（adminPage / memberPage / unregisteredPage）
- helpers（snap / runAxe / viewports / seedE2eFixtures）
- screenshot 命名規約（`{viewport}/{scenario}-{state?}.png`）
- a11y 戦略（wcag2aa + wcag21aa、impact: critical/serious のみ FAIL）
- browser matrix（chromium + webkit）/ viewport matrix（desktop + mobile）
- CI workflow yml（`.github/workflows/e2e-tests.yml`）
- 「7 spec × 2 viewport ≒ 70+ tests」のスケール感を明示

### 2. system-spec-update-summary.md

- 本タスクで触れた spec への差分提案
  - **09-ui-ux.md**: 検証マトリクスを Playwright で網羅できる粒度（screen × viewport × state）に再構成、screenshot 命名規約を追記
  - **13-mvp-auth.md**: AuthGateState 5 状態を `/login` 内で出し分け、`/no-access` URL は 404 と明文化（不変条件 #9 を E2E test として固定済の旨）
  - **16-component-library.md**: a11y 受入基準として `@axe-core/playwright` の wcag2aa + wcag21aa rule を明記、impact: critical/serious のみ FAIL とする運用方針を追記
  - **11-admin-management.md**: admin 5 画面の認可境界（admin / member / anonymous）を E2E で 3 軸検証する旨を追記

### 3. documentation-changelog.md

- 本 task 配下 15 ファイル（index.md / artifacts.json / phase-01〜13.md）
- outputs/phase-01〜13/* 配下 30 ファイル超
- 不変条件 #4 / #8 / #9 / #15 の E2E test 化点
- screenshot evidence 30 枚以上の配置

### 4. unassigned-task-detection.md

- visual regression snapshot diff の本格導入（attendance UI 以外も対象化）→ 未割当
- firefox / mobile-chromium browser project 追加 → 未割当（無料枠超過懸念）
- production 環境負荷 / Playwright Cloud 並列実行 → 未割当（運用フェーズ）
- screenshot 自動圧縮 / WebP 変換 → 未割当（artifact 容量対策）
- staging URL を base にした Playwright 実行（本タスクは local 完結）→ 09a 担当

### 5. skill-feedback-report.md

- task-specification-creator skill 改善提案:
  - E2E task テンプレに「page object 命名規約」「screenshot 命名規約」「fixture 分離パターン」をテンプレ化
  - axe-core / browser matrix / viewport matrix を Phase 9 の標準セクションに追加提案
  - external nav (Google Form / Stripe 等) の観測戦略を skill resource に同梱推奨
  - CI workflow yml に `actions/upload-artifact` の path を screenshot evidence 規約と統一

### 6. phase12-task-spec-compliance-check.md

- Phase 1〜11 必須セクション準拠確認（メタ情報 / 目的 / 実行タスク / 参照資料 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / タスク100%実行確認 / 次 Phase）
- 不変条件 #4 / #8 / #9 / #15 が test として記述されているかチェック
- AC-1〜8 が Phase 7 matrix で 1:1 対応しているかチェック
- screenshot 30 枚以上が Phase 11 evidence で実在するかチェック

## 中学生レベル概念説明（補助）

- E2E test は「画面を実際に開いて、ボタンを押して、出てきた答え合わせ」
- a11y test は「目が見えにくい / マウスが使えない人にも使える画面か機械が点検」
- screenshot evidence は「テストの瞬間の画面写真を後で見返せるよう残す」
- AuthGateState は「ログイン画面で『未登録です』『削除されました』等状況に応じた看板を出し分けるしくみ」
- editResponseUrl は「自分のプロフィールを直したいとき、Google Form の回答編集画面に飛ばすリンク」

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
| 下流 09a / 09b | unassigned 項目（visual regression / staging URL Playwright）を考慮 |
| 並列 08a | implementation-guide で fixture / brand 型共有を明記 |

## 多角的チェック観点

- 不変条件 **#4 / #8 / #9 / #15** が implementation-guide / compliance-check に必ず記述
- spec_created なので spec 本体は提案のみ（直接書き換えない）
- 中学生レベル概念で運用引き継ぎ容易（運用担当が非エンジニアでも把握できる用語）
- screenshot evidence の path 規約を documentation-changelog にも明記

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | runbook + signature + page object + helpers + axe + CI |
| 2 | system-spec-update | 12 | pending | 09-ui-ux / 13-mvp-auth / 16-component-library / 11-admin-management |
| 3 | changelog | 12 | pending | ファイル一覧 |
| 4 | unassigned | 12 | pending | 5 件以上 |
| 5 | skill-feedback | 12 | pending | E2E template / axe / browser / viewport / external nav |
| 6 | compliance-check | 12 | pending | 必須セクション + 不変条件 + AC + screenshot 30 枚 |

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
- [ ] compliance-check で不変条件 #4 / #8 / #9 / #15 を 100% カバー
- [ ] unassigned 5 件以上
- [ ] system-spec-update-summary が 4 spec 以上に提案差分

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物 6 種配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 12 を completed

## 次 Phase

- 次: Phase 13 (PR 作成 — user 承認後)
- 引き継ぎ: 6 ドキュメントへのリンクと evidence path
- ブロック条件: 6 ドキュメントいずれか欠落なら Phase 13 不可
