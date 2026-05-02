# Phase 6: 異常系検証 — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 6 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

失敗時、未設定時、権限不足時の挙動を定義する。

## 実行タスク

1. session unresolved / unauthenticated を確認する。完了条件: submit 不可または login flow へ誘導される。
2. duplicate pending request を確認する。完了条件: 409 を利用者向け文言で表示する。
3. validation / server / network error を確認する。完了条件: retry 可否が UI で分かる。
4. current visibility と action の対応を確認する。完了条件: hide/show の逆転がない。

## error case matrix

| Case | Expected UI | Evidence |
| --- | --- | --- |
| no session / expired session | submit blocked or login redirect | Phase 11 auth/session log |
| pending visibility request | duplicate pending message | `profile-request-duplicate-409.md` |
| pending delete request | duplicate pending message | `profile-request-duplicate-409.md` |
| validation error | field-level or form-level correction message | focused UI test |
| 5xx / network | retryable error message and re-enabled controls | focused UI test |

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
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

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

Phase 7 へ、AC、blocker、evidence path、approval gate を渡す。
