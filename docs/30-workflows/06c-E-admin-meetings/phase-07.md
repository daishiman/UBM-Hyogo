# Phase 7: AC マトリクス — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 7 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

Phase 1 の AC × Phase 4 の verify × Phase 5 の実装 placeholder を一対一で対応付ける。

## 実行タスク

1. AC を行、検証手段を列とする matrix を作る。完了条件: 各 AC に少なくとも 1 つの verify が紐づく。
2. 未紐付きの AC / 未使用の verify を 0 にする。完了条件: 孤立行・孤立列が無い。
3. Phase 6 の failure case を AC として吸収する。完了条件: 401/403/404/409/422 が matrix に載る。

## 参照資料

- outputs/phase-01/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- AC が定量的（HTTP code / row 数 / column 順）に書かれているか。

## サブタスク管理

- [ ] AC × verify matrix を作る
- [ ] 孤立行 / 孤立列を 0 にする
- [ ] failure case を吸収する
- [ ] outputs/phase-07/main.md を作成する

## 実装仕様 (CONST_005) — AC マトリクス

### AC × 検証手段 × テストファイル × DoD

| AC-ID | 内容 | 検証手段 | テストファイル | DoD |
| --- | --- | --- | --- | --- |
| AC-01 | `/admin/meetings` admin session で 200 | E2E | `apps/web/e2e/admin-meetings.spec.ts` | 200 OK + table render |
| AC-02 | 未ログインで `/login?gate=admin_required` redirect | contract / E2E | `apps/web/middleware.test.ts`（既存）+ E2E | redirect 確認 |
| AC-03 | 非 admin で 403 | contract | `apps/api/src/routes/admin/meetings.test.ts` | status=403 |
| AC-04 | `POST /api/admin/meetings` 作成 | unit + contract | `meetings.test.ts` (api) | 201 + row 追加 + audit log |
| AC-05 | `PATCH /api/admin/meetings/:id` 更新 | unit + contract | `meetings.test.ts` (api) + `meetings.test.ts` (repo) | 200 + 列更新 + audit log |
| AC-06 | `POST /api/admin/meetings/:id/attendances` duplicate guard | unit + contract | `attendance.test.ts` | 409 duplicate + audit log |
| AC-07 | `GET /api/admin/meetings/:id/export.csv` 列順固定 | contract | `meetings.test.ts` (api) | CSV 列 = `meetingId,heldOn,memberId,displayName,attended` + BOM |
| AC-08 | 全 mutation で audit log 1 行 | unit + manual | `audit.test.ts` + Phase 11 manual | audit_log row 確認 |
| AC-09 (failure) | 401 / 403 / 404 / 410 / 422 境界 | contract | `meetings.test.ts` (api) | 各 status / response shape |
| AC-10 (CSV escape) | RFC 4180 escape | unit | `csv.test.ts` or `meetings.test.ts` | カンマ・改行・`"` 正常 escape |
| AC-11 (削除済 member) | attendance 付与で 422 | contract | `attendance.test.ts` | 不変条件 #15 |

孤立行・孤立列が無いこと（全 AC が少なくとも 1 つの verify file に紐づく）を本 phase で確認する。

## 成果物

- outputs/phase-07/main.md

## 完了条件

- [x] AC matrix が完成し、全行・全列に対応がある
- [x] failure case が AC として残らず吸収される
- [x] DoD: AC-01〜AC-11 が全て実テストファイルにマッピングされ、`mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm test` が green

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 8 へ、AC matrix を渡す。
