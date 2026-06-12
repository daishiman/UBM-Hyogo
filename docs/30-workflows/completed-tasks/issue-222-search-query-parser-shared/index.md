# issue-222: 公開検索 query parser primitives の packages/shared 集約

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト。コード変更を伴う）
> 関連 issue: [#222](https://github.com/daishiman/UBM-Hyogo/issues/222)（CLOSED のまま運用。再オープンしない）

## ステータス

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured`（実コード実装・focused tests・typecheck・lint 完了。commit・PR は user-gated） |
| taskId | `ISSUE-222-SEARCH-QUERY-PARSER-SHARED` |
| taskType | refactoring |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| ブランチ | `refactor/issue-222-search-query-parser-shared` |

## 概要

公開メンバー検索（`/members`）の query 正規化ロジックが `apps/api` と `apps/web` の 2 箇所で独立に再定義されていたため、真に重複している共通プリミティブ（zone/status/sort/density の値集合・制限値・q/tag 正規化・limit clamp）を `packages/shared/src/public-search` に SSOT 化し、両 app がそれを import して app 固有のパーサ/シリアライザを構築する実装へ切替済み。

## issue 調査結論（現コードへの最適化）

- issue #222 は CLOSED だが**実コードは未実施**。parser は今も `apps/api/src/_shared/search-query-parser.ts` に存在し、`packages/shared` へ未移設。completed-tasks の doc 本文も「ステータス: 未実施」。
- 着手条件「06a で apps/web に同等パーサが必要になる時点」は**到達済み**（`apps/web/src/lib/url/members-search.ts` が存在し重複が現実化）。
- issue 原案「parser 全体移設＋薄ラッパ化」「不正値で 400」は**古い**。現コードは web/api で責務が異なり、不正値は silent fallback（200）が正しい仕様。→ **共通プリミティブの抽出**へ最適化。

## Phase 一覧

| Phase | 名称 | 成果物 | ステータス |
| --- | --- | --- | --- |
| 1 | 要件定義 | `outputs/phase-1/phase-1.md` | completed |
| 2 | 設計 | `outputs/phase-2/phase-2.md` | completed |
| 3 | 設計レビュー | `outputs/phase-3/phase-3.md` | completed |
| 4 | テスト作成 | `outputs/phase-4/phase-4.md` | completed |
| 5 | 実装 | `outputs/phase-5/phase-5.md` | completed |
| 6 | テスト拡充 | `outputs/phase-6/phase-6.md` | completed |
| 7 | カバレッジ確認 | `outputs/phase-7/phase-7.md` | completed |
| 8 | リファクタリング | `outputs/phase-8/phase-8.md` | completed |
| 9 | 品質保証 | `outputs/phase-9/phase-9.md` | completed |
| 10 | 最終レビュー | `outputs/phase-10/phase-10.md` | completed |
| 11 | 手動テスト | `outputs/phase-11/manual-test-result.md` | completed |
| 12 | ドキュメント更新 | `outputs/phase-12/main.md` | completed |
| 13 | PR作成 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## SSOT

仕様の正本は [`shared-context.md`](shared-context.md)。全 Phase はここから逸脱しない。

## 三レーン構成

| Lane | 担当 | 主ファイル | 依存 |
| --- | --- | --- | --- |
| A | shared SSOT | `packages/shared/src/public-search/*` + `package.json` exports | なし（先行） |
| B | apps/api 切替 | `apps/api/src/_shared/search-query-parser.ts` | A |
| C | apps/web 切替 | `apps/web/src/lib/url/members-search.ts` | A |

## 不変条件

CLAUDE.md 不変条件 #5（D1 は apps/api 限定）・UI workflow 不変条件 #1（既存 API のみ・D1 schema/endpoint 変更禁止）・#8（`*.spec.ts` のみ）を厳守。詳細は SSOT §7。
