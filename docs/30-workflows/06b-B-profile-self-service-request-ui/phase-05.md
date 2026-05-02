# Phase 5: 実装ランブック — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 5 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実装または運用実行時の手順を定義する。

## 実行タスク

1. 06b-A の session resolver evidence を確認する。完了条件: 未解決なら runtime 実行を blocked にする。
2. profile request client helper を実装する。完了条件: `/me/visibility-request` と `/me/delete-request` 以外を増やさない。
3. 申請 UI を既存 `/profile` read-only 表示に追加する。完了条件: `EditCta` と本文表示を壊さず、本文編集 UI を作らない。
4. pending / duplicate 409 / success / retryable error / auth error の state を実装する。完了条件: 409 を unknown error として表示しない。
5. 06b-C へ screenshot / E2E handoff を渡す。完了条件: Phase 11 の evidence path が揃う。

## implementation sequence

| Step | Target | Required boundary |
| --- | --- | --- |
| 1 | `apps/web/app/profile/` current UI discovery | `StatusSummary`, `EditCta`, `ProfileFields`, `AttendanceList` の責務を維持 |
| 2 | API client helper | `POST /me/visibility-request`, `POST /me/delete-request`; direct D1 access forbidden |
| 3 | Request UI component | current visibility に応じて公開停止/再公開文言を切替 |
| 4 | Delete request confirmation | irreversible wording and confirm step required |
| 5 | Tests / static invariants | profile body edit submit と D1 direct import を禁止 |
| 6 | Handoff | 06b-C visual evidence paths に screenshot targets を渡す |

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
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

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

Phase 6 へ、AC、blocker、evidence path、approval gate を渡す。
