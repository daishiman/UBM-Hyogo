# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 8 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（Wave 8 並列開始） |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

contract / repository unit / authorization / type test の 4 種を 1 task で扱い、AC-1〜7 を Phase 4 verify suite と 1:1 で対応させる。

## 真の論点 (true issue)

- contract test と repository test は通常別 task に分けがちだが、本タスクは「app/api 全テスト責務」を 1 task に集約することで、AC・fixture・命名・brand 型 import を一貫させる。
- type test を「実テスト」として扱うか「ドキュメント代用」とするか。本タスクは vitest 上で `expectError` パターン (`@ts-expect-error` + 型違反) を実コミットし、**コンパイル時 fail を CI で必ず観測** する形を採用。
- 全 endpoint 約 30 を 100% カバーすると test 数が多いため、fixture 共通化を Phase 8 で必ず行う。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | 06a public pages | endpoint × view model 対応 | contract test の expect schema |
| 上流 | 06b member pages | `/me/*` view model | contract test |
| 上流 | 06c admin pages | `/admin/*` view model | contract test |
| 上流 | 07a tag queue | `POST /admin/tags/queue/:queueId/resolve` 仕様 | contract / authz test |
| 上流 | 07b schema alias | `POST /admin/schema/aliases` 仕様 | contract / authz test |
| 上流 | 07c attendance / audit | attendance + audit hook 仕様 | contract / authz test |
| 下流 | 09a staging smoke | `pnpm --filter @ubm-hyogo/api test` pass を deploy 前提 | CI workflow yml |
| 下流 | 09b release runbook | CI workflow を runbook に組込 | api-tests.yml |

## 価値とコスト

- **初回価値**: 全 endpoint と全 repository を 1 つの test 体系で恒久固定する。後続 task の修正が contract test を破れば必ず CI で検知される。
- **初回で払わないコスト**: visual regression、production 環境での負荷 test、E2E（08b へ分離）。
- **トレードオフ**: 1 task に 4 種 test を集約するため Phase 4 で test signature 数が多くなる。代わりに fixture や helper を 1 ヶ所に集約できる。

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | 不変条件 #1/#2/#5/#6/#7/#11 を test として固定するか | PASS | 各不変条件に対応する test ケースを 1 つ以上記述 |
| 実現性 | vitest + msw + local sqlite で実装可能か | PASS | apps/api は Workers 互換テストランナー実績、無料枠運用 |
| 整合性 | 上流 06a/b/c, 07a/b/c の AC と矛盾しないか | PASS | endpoint 一覧を artifacts.json に列挙、上流 AC を逐次確認 |
| 運用性 | CI で必ず実行・rollback で test 戻し可能か | PASS | `.github/workflows/api-tests.yml` placeholder で確実 |

## 実行タスク

- [ ] 上流 6 task の AC を読み、endpoint 一覧と view model schema を確定
- [ ] AC-1〜7 を quantitative に記述（endpoint 数 / repository 数 / authz マトリクス 9 / coverage 閾値）
- [ ] 真の論点（type test を実 commit する方針）と非採用案を記録
- [ ] 4 条件評価の根拠を埋める

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | brand 型 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | endpoint × schema |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 8a 詳細 |

## 実行手順

### ステップ 1: 上流 AC 引き取り
- 06a/b/c の view model 一覧、07a/b/c の workflow endpoint を artifacts.json に列挙
- 不足あれば上流に open question

### ステップ 2: AC-1〜7 quantitative 化
- AC-1: 全 endpoint 約 30 contract test green
- AC-2: 全 repository 16 種 unit test green、CRUD 各 5 fixture
- AC-3: authz マトリクス 9 (anonymous × public/member/admin × method)
- AC-4: type test 1 ケース以上で `responseId !== memberId`
- AC-5: 不変条件 #1/#2/#5/#6/#7/#11 各 1 test 以上
- AC-6: coverage statements ≥ 85% / branches ≥ 80%
- AC-7: CI workflow yml を outputs に配置

### ステップ 3: 4 条件評価と handoff
- 4 条件記入
- Phase 2 へ「msw vs local fixture」「CI runner image」を open question

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | endpoint 一覧 / repo 一覧 / authz matrix |
| Phase 4 | AC × test signature の対応 |
| Phase 7 | AC マトリクス |
| Phase 10 | GO 判定 |

## 多角的チェック観点

- 不変条件 **#1**: schema を固定しすぎない（`extraFields` の保存経路を contract で verify、理由: 新規 question を吸収）
- 不変条件 **#2**: `responseEmail` system field を schema enum に固定（理由: フォーム項目に混入させない）
- 不変条件 **#5**: 認可境界 9 マトリクス（理由: 公開 / 会員 / 管理 3 層分離）
- 不変条件 **#6**: apps/web から D1 import 禁止 lint test（理由: 直接アクセス防止）
- 不変条件 **#7**: deleted_members への論理削除 test（理由: 物理削除しない）
- 不変条件 **#11**: profile 編集 endpoint への request が 404 を返す test（理由: 本文編集 endpoint 不在）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 引き取り | 1 | pending | 6 task |
| 2 | AC-1〜7 quantitative 化 | 1 | pending | endpoint / repo / matrix / coverage |
| 3 | 真の論点記録 | 1 | pending | type test を実 commit |
| 4 | 4 条件評価 | 1 | pending | — |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Phase 1 主成果物 |
| メタ | artifacts.json | phase 1 status |

## 完了条件

- [ ] AC-1〜7 quantitative 化済み
- [ ] 真の論点 + 4 条件評価記録
- [ ] Phase 2 への open question 明記

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（権限 / 無料枠 / drift）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 1 を completed

## 次 Phase

- 次: Phase 2 (設計)
- 引き継ぎ: msw vs local fixture、CI runner、type test カバレッジ目標
- ブロック条件: AC-1〜7 quantitative 化未完なら Phase 2 不可
