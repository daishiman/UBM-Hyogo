# Phase 10 main — 最終レビューサマリ

> 正本: `_shared-context.md` §4 DoD / §2 不変条件 / §3 変更ファイル。

## レビュー対象

ホーム画面（公開トップ `/`）の英語表記日本語化 + 英語 overline 削除の実装仕様書（implemented_local_evidence_captured）。
Phase 1〜9 で確定した内容（要件・設計・テスト・実装手順・カバレッジ・リファクタ・品質保証）を統合し、
「後続実装者がそのまま着手できる完成仕様か」を最終確認する。

## 判定根拠サマリ

| 観点 | 根拠 |
| --- | --- |
| 文字列マッピングが一意 | SSOT §1 A/B/C に旧→新文言・対象 data-role・行番号（参考）を確定 |
| 変更ファイルが確定 | SSOT §3 に実装7（F1〜F7）+ テスト6（T1〜T6）を列挙 |
| 検証手段が確定 | SSOT §4 に focused vitest / typecheck / lint / verify-design-tokens / 回帰 grep / diff 空チェック |
| 不変条件が明示 | SSOT §2（apps/web 内のみ・DOM contract 保持・HEX 0・新規 component 0・単一 PR） |
| 波及無し | Hero/AboutUbm/Timeline/CallToActionCTA は home 専用（grep 確認済）で eyebrow 削除が他画面へ波及しない |

## 受入条件 AC-1〜AC-8

phase-10.md 本体の表を正本とする。AC-1〜AC-3・AC-5 はコンポーネントテスト、AC-4 は CSS 構造検証 + 視覚証跡、
AC-6 は回帰 grep、AC-7 は diff 空、AC-8 は verify-design-tokens で検証する。すべて仕様レベルで確定。

## blocker

0 件。仕様の矛盾・漏れ・不変条件違反は無い。実装サイクルへ進める完成度に達している。

## user-gated

focused vitest 実行・ローカルスクリーンショット取得は完了、commit/push/PR は本サイクルの責務外（Phase 13・user-gated）。
本 Phase はこの境界を越えない。
