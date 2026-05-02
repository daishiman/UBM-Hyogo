# Phase 7: AC マトリクス — 06b-B-profile-self-service-request-ui

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-B-profile-self-service-request-ui |
| phase | 7 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

受入条件と evidence path を一対一に対応付ける。

## 実行タスク

1. AC と runtime evidence を 1:1 で対応付ける。完了条件: evidence owner が空欄でない。
2. spec evidence と runtime evidence を分離する。完了条件: spec_created を実測 PASS と書かない。
3. 06b-C / 08b への handoff を確認する。完了条件: downstream owner が evidence path を参照できる。

## AC evidence matrix

| AC | Spec evidence | Runtime evidence | Owner |
| --- | --- | --- | --- |
| 公開停止/再公開申請を送れる | Phase 5 implementation sequence | `outputs/phase-11/profile-visibility-request-smoke.md` | 06b-B execution |
| 退会申請を送れる | Phase 5 implementation sequence | `outputs/phase-11/profile-delete-request-smoke.md` | 06b-B execution |
| 409 duplicate を表示する | Phase 6 error case matrix | `outputs/phase-11/profile-request-duplicate-409.md` | 06b-B execution |
| 本文編集 UI は追加しない | invariant touched #4 | focused invariant test / static review | 06b-B execution |
| screenshot/E2E が保存される | handoff row | 06b-C / 08b phase 11 artifacts | 06b-C / 08b |

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
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

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

Phase 8 へ、AC、blocker、evidence path、approval gate を渡す。
