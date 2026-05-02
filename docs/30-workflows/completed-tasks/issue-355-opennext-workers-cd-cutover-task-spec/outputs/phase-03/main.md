# Phase 3 成果: テスト戦略サマリ

本ファイルは `phase-03.md` 仕様の close-out 出力。L1〜L4 の 4 層テスト戦略 / NO-GO 条件 / evidence 取得計画を集約する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 3 / 13 |
| Phase 名称 | テスト計画 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 2（技術設計） |
| 次 Phase | 4（タスク分解） |
| 状態 | spec_created |

## テスト戦略概要（4 層）

| レイヤ | 目的 | 主な検証物 | 実行タイミング |
| --- | --- | --- | --- |
| L1 単体 | OpenNext build smoke | `.open-next/worker.js` / `.open-next/assets/` 生成 | ローカル + CI build job |
| L2 統合 | staging deploy + Web→API 連携 | `wrangler deploy --env staging` 成功 / staging URL 200 / service binding 経由 API 応答 | dev branch merge 直後（CD 自動） |
| L3 smoke | UT-06 Phase 11 S-01〜S-10 流用 | 公開ルートの全件 PASS | staging cutover 完了直後 + production cutover 完了直後 |
| L4 rollback | rollback 経路の実行可能性 | `wrangler rollback` の dry / 旧 Pages resume の実行性 | staging で 1 回実証 |

## AC ↔ テスト 対応表

| AC | 主検証 | 補助検証 |
| --- | --- | --- |
| AC-1 | T-01, T-02, T-03 | T-05 |
| AC-2 | T-10, T-11, T-12 | T-15 |
| AC-3 | T-20〜T-30 | — |
| AC-4 | T-13, T-14 | T-15 |
| AC-5 | T-04 | — |
| AC-6 | T-42 | T-40, T-41 |

## 詳細仕様への参照

| 観点 | 個別ドキュメント |
| --- | --- |
| L1〜L4 全テストケース | [`test-cases.md`](./test-cases.md) |
| NO-GO 条件 NG-1〜NG-5 | [`no-go-conditions.md`](./no-go-conditions.md) |
| evidence 取得計画 E-1〜E-5 | [`evidence-plan.md`](./evidence-plan.md) |

## NO-GO 条件サマリ

| ID | 条件 |
| --- | --- |
| NG-1 | smoke S-01〜S-10 のうち 1 件でも FAIL |
| NG-2 | `apps/web/.open-next/worker.js` または `.open-next/assets/` が build 後に未生成 |
| NG-3 | `wrangler deploy --env staging` が binding 解決失敗で失敗 |
| NG-4 | staging URL が HTTP 5xx 連発 / observability ログに critical error |
| NG-5 | rollback 経路（T-40）が staging で実証できない |

## evidence サマリ（visualEvidence = NON_VISUAL）

本タスクは UI 視覚変化なし（NON_VISUAL）のため screenshot は取得しない。代替 evidence は `evidence-plan.md` に列挙する 6 種で構成する（`phase-11-non-visual-alternative-evidence.md` 整合）。

## 多角的チェック観点

- **不変条件 #5 整合**: T-14 で service binding 経由を確認し、apps/web から D1 直接アクセスが発生していないことを実応答経路で間接 gate
- **secret hygiene**: evidence ファイルに API Token / OAuth secret を出力しない。`curl -I` は token を含まないこと、wrangler deploy log は token を mask した状態で保存
- **rollback 実行性**: T-40 / T-41 / T-42 の 3 段で AC-6 を検証
- **CI gate との整合**: T-10 / T-11 は静的 grep のため pre-merge CI でも実行可能。Phase 8 で CI 組込みを検討

## 完了条件

- [x] L1〜L4 全 4 層にテストケースが定義されている（`test-cases.md`）
- [x] AC-1〜AC-6 すべてに主検証テストが対応している（本ファイル AC ↔ テスト 対応表）
- [x] NO-GO 条件 5 件が明記されている（`no-go-conditions.md`）
- [x] evidence 取得計画 6 種が整理されている（`evidence-plan.md`）

## 次の Phase

Phase 4: タスク分解（workflow 改修 / runbook 執筆 / smoke 再実行 / next.config 確認 を実装可能粒度に分解）
