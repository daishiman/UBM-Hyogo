# スキルフィードバックレポート

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 観点固定: テンプレート改善 / ワークフロー改善 / ドキュメント改善。各 item に promotion target / no-op reason / evidence path を明記する。

## テンプレート改善

| ID | 知見 | routing / promotion target | evidence path |
|----|------|---------------------------|---------------|
| L-ISSUE222-001 | shared 型追加タスクでは「definition + barrel index + package exports + consumer wiring」の 4 点を同一 wave で揃える（[UT-W3]）。仕様書段階でこの 4 点を表で列挙すると実装漏れ（import 不能）を未然に防げる | no-op: 既存 `task-specification-creator` は同一 wave 実装を既に要求済み。本タスクでは 4 点すべてを実装済みとして `system-spec-update-summary.md` に記録 | `outputs/phase-12/system-spec-update-summary.md` |
| L-ISSUE222-002 | drift 解消系リファクタは「真に重複している核」を表（# / 概念 / api 表現 / web 表現）で対比してから抽出対象を確定すると、責務の異なる部分（api の expand whitelist 等）を誤って共有化する事故を防げる | no-op: 汎用テンプレへ即時昇格するほど頻出していない。再発時に `patterns-testing-and-implementation.md` へ昇格検討。本タスクは SSOT §1.3 の重複対比表で具体化 | `docs/30-workflows/completed-tasks/issue-222-search-query-parser-shared/shared-context.md` |

## ワークフロー改善

| ID | 知見 | routing / promotion target | evidence path |
|----|------|---------------------------|---------------|
| L-ISSUE222-003 | **CLOSED issue を再オープンせず spec を作成する運用**: issue #222 は CLOSED だが実コード未着手（doc 移動のみ）と判明。再オープンせず、CLOSED のまま現コード最適化 spec を作成し、PR 本文で「issue #222 の現コード最適化解決」と参照する。判断プロセス（completed-tasks doc 本文「未実施」+ `grep` ヒット 0 + 着手条件 06a 到達済）を Phase 1 に記録 | applied: 本 workflow の Phase 1（`outputs/phase-1/phase-1.md` §1.3）で調査結論を記録。Phase 13 で再オープンせず PR 参照する旨を確定 | `outputs/phase-1/phase-1.md` / `outputs/phase-13/phase-13.md` |
| L-ISSUE222-004 | **issue の古い AC（400）を現コード（silent fallback）に最適化して読み替えた判断プロセス**: issue AC-3「不正値は 400」は現コードの `z.catch()`/`clamp` による silent fallback（200）と乖離。公開検索は「不正値でも安全 default で 200」が正仕様のため、issue の記述を古いものとして是正し、AC-3 を silent fallback へ読み替えた。読み替え根拠を AC 表に明記して追跡可能にする | applied: SSOT §1.2 / §4（AC-3 是正注記）と本タスク AC 表に記録 | `docs/30-workflows/completed-tasks/issue-222-search-query-parser-shared/shared-context.md` |

## ドキュメント改善

| ID | 知見 | routing / promotion target | evidence path |
|----|------|---------------------------|---------------|
| L-ISSUE222-005 | NON_VISUAL の Phase 11 は screenshot 不要だが、「自動テスト名/件数（SP-01〜SP-12 + 既存 2 spec 回帰）」を主証跡として明記し、screenshot を作らない理由（視覚差分ゼロ）を併記する（Feedback 4 / WEEKGRD-03） | applied: `outputs/phase-11/manual-test-result.md` に記録。`screenshots/.gitkeep` は作らない | `outputs/phase-11/manual-test-result.md` |
| L-ISSUE222-006 | source-level の設計 PASS 見込みと実機実行 PASS を混同しない（WEEKGRD-01）。実行済み証跡は計画表とは別にコマンド・件数・PASS 結果で記録する | applied: `outputs/phase-11/manual-test-result.md` の「実行済み証跡」節に記録 | `outputs/phase-11/manual-test-result.md` |
