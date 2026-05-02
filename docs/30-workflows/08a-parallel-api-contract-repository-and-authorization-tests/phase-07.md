# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 AC × Phase 4 verify suite × Phase 5 実装ステップ × Phase 6 failure を 1:1 で対応させる matrix を作る。不変条件 #1/#2/#5/#6/#7/#11 が必ず test として現れているかを最終確認する。

## 実行タスク

- [ ] AC × verify × runbook step × failure の matrix を `outputs/phase-07/ac-matrix.md`
- [ ] 不変条件カバレッジ table（#1/#2/#5/#6/#7/#11）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-04/verify-suite-matrix.md | suite |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | outputs/phase-06/main.md | failure |

## AC マトリクス

| AC | 概要 | verify suite | runbook step | failure cases |
| --- | --- | --- | --- | --- |
| AC-1 | 全 endpoint contract green | contract (~30 endpoint × 3〜4 ケース) | Step 4 | F-3, F-6, F-7 |
| AC-2 | 全 repo unit pass | unit (~16 repo × 5 CRUD) | Step 5 | F-3, F-5 |
| AC-3 | 認可 9 マトリクス 401/403/200 | authz | Step 6 | F-1, F-2 |
| AC-4 | type test responseId !== memberId | type | Step 6 | (compile error 観測) |
| AC-5 | 不変条件 #1/#2/#5/#6/#7/#11 test 化 | contract + lint + type | Step 4-6 | F-4 (#11), F-9 (#7) |
| AC-6 | coverage statements ≥ 85% | (vitest threshold) | Step 2, 7 | — |
| AC-7 | CI workflow yml 配置 | (file 存在) | Step 7 | — |

## 不変条件カバレッジ

| 不変条件 | test 種別 | test ファイル / ケース | failure 関連 |
| --- | --- | --- | --- |
| #1 schema 固定しすぎない | contract | `responses.contract.spec.ts` で `extraFields` 経路 | F-8 sync 失敗時も extraFields 退避 |
| #2 responseEmail system field | contract + type | `members.contract.spec.ts`、`type-tests.ts` で `@ts-expect-error` | — |
| #5 3 層分離 | contract + authz | `authz.spec.ts` 9 マトリクス | F-1 401, F-2 403 |
| #6 apps/web → D1 直接禁止 | lint | `import-boundary.spec.ts` で grep | (lint 失敗自体が test fail) |
| #7 論理削除 | contract + unit | `members.spec.ts` で deleted_members、`/public/members` で除外 | F-9 consent 撤回, F-11 deleted login |
| #11 profile 編集なし | contract | `PATCH /admin/members/:id/profile` に対し 404 expect | F-4 404 route |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | matrix から重複 fixture / helper を抽出 |
| Phase 9 | 不変条件カバレッジ → QA 観点 |
| Phase 10 | matrix が GO 前提 |
| 下流 09a | matrix の verify suite を staging deploy 前提 |

## 多角的チェック観点

- 不変条件 **#1 / #2 / #5 / #6 / #7 / #11** が AC-1〜5 のいずれかで覆われていることを最終確認
- AC-6 coverage 達成のため Phase 8 で fixture DRY 化が前提
- AC-7 CI workflow yml が outputs/phase-11/evidence/ にも存在

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC matrix | 7 | pending | ac-matrix.md |
| 2 | 不変条件カバレッジ table | 7 | pending | #1〜#11 |
| 3 | failure 紐付け | 7 | pending | F-1〜F-12 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC matrix 本文 |
| matrix | outputs/phase-07/ac-matrix.md | 詳細 |
| メタ | artifacts.json | phase 7 status |

## 完了条件

- [ ] AC matrix 全行埋まる
- [ ] 不変条件カバレッジ table

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 不変条件 #1/#2/#5/#6/#7/#11 すべてカバー
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: 共通化候補（fixture / helper / brand 型 import）
- ブロック条件: matrix 未完なら Phase 8 不可
