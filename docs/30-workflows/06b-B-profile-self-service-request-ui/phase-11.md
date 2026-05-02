# Phase 11: 手動 smoke / 実測 evidence — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 11 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

人手または外部環境でしか確認できない証跡を定義する。

## 実行タスク

1. 06b-A の session resolver evidence を確認する。完了条件: 未完了なら本 Phase は `blocked_by_06b-A` と記録する。
2. 実装後 smoke evidence を取得する。完了条件: visibility / delete / duplicate 409 の3ログが保存される。
3. screenshot / E2E handoff を 06b-C と 08b に渡す。完了条件: visual evidence をこの docs-only close-out で PASS と断言しない。

## runtime evidence paths

| Evidence | Path | Status before execution |
| --- | --- | --- |
| Visibility request smoke | `outputs/phase-11/profile-visibility-request-smoke.md` | blocked until 06b-A |
| Delete request smoke | `outputs/phase-11/profile-delete-request-smoke.md` | blocked until 06b-A |
| Duplicate 409 smoke | `outputs/phase-11/profile-request-duplicate-409.md` | blocked until 06b-A |
| Visual screenshots | `../02-application-implementation/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` | downstream |
| E2E report | `../08b-parallel-playwright-e2e-and-ui-acceptance-smoke/outputs/phase-11/` | downstream |

## blocker

Runtime smoke is blocked until `06b-A-me-api-authjs-session-resolver` proves that a logged-in `/profile` session can be resolved in the target environment.

## 参照資料

- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- apps/web/app/profile/page.tsx
- apps/web/app/profile/_components/EditCta.tsx
- apps/api/src/routes/me/index.ts

## 実行手順

- 対象 directory: docs/30-workflows/06b-B-profile-self-service-request-ui/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 04b /me self-service API, 06b profile page, 06b Auth.js session resolver follow-up
- 下流: 06b logged-in profile visual evidence, 08b profile E2E full execution

## 多角的チェック観点

- #4 profile body edit forbidden
- #5 apps/web D1 direct access forbidden
- #11 member self-service boundary
- 未実装/未実測を PASS と扱わない。
- プロトタイプと仕様書の採用/不採用を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- outputs/phase-11/main.md

## 完了条件

- マイページから公開停止/再公開申請を送れる
- マイページから退会申請を送れる
- 二重申請 409 をユーザーに分かる形で表示する
- 本文編集 UI は追加しない
- 申請 UI のスクリーンショット/E2E が保存される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、AC、blocker、evidence path、approval gate を渡す。
