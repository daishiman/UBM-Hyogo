# Phase 4: テスト戦略 — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 4 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

unit / contract / E2E / authorization の verify suite を実装前に固定する。

## 実行タスク

1. unit: meetings repository / attendances upsert / CSV serializer のテスト観点を列挙する。完了条件: 5 endpoint の正常系・境界系が網羅される。
2. contract: zod schema と API request/response の一致を契約テストで検証する。完了条件: `apps/api/test/admin/meetings.spec.ts` 想定の test ID が記録される。
3. E2E（Playwright）: admin login → 開催日作成 → 参加記録 → CSV 取得の流れを設計する。完了条件: 08b で実行可能なシナリオに落ちる。
4. authorization: 未ログイン / 非 admin / `x-ubm-dev-session` の挙動を仕様化する。完了条件: 401 / 403 境界が確定する。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- apps/api/src/middleware/require-admin.ts
- apps/web/middleware.ts

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
- a11y（Drawer / Form のキーボード操作）。

## サブタスク管理

- [ ] unit 観点を列挙する
- [ ] contract 観点を列挙する
- [ ] E2E シナリオを書く
- [ ] authorization 境界を確定する
- [ ] outputs/phase-04/main.md を作成する

## 実装仕様 (CONST_005)

### 追加するテストファイル

| 区分 | パス | 内容 |
| --- | --- | --- |
| 既存追記 | `apps/api/src/routes/admin/meetings.test.ts` | PATCH 200/400/403/404、export.csv 200/403/404、CSV escape |
| 既存追記 | `apps/api/src/repository/meetings.test.ts` | `updateMeeting` / `softDeleteMeeting` のユニットテスト |
| 新規 | `apps/web/src/components/admin/MeetingPanel.test.tsx` | 編集 Drawer / CSV button rendering、削除確認 dialog |
| placeholder | `apps/web/e2e/admin-meetings.spec.ts` | 08b で実行する E2E スケルトン（admin login → 開催作成 → 参加記録 → CSV 取得） |

### テストケース（境界・網羅）

| 種別 | エンドポイント | ケース | 期待 |
| --- | --- | --- | --- |
| auth | 全 admin endpoint | 未ログイン | 401 |
| auth | 全 admin endpoint | 非 admin session | 403 |
| validation | `PATCH /api/admin/meetings/:id` | heldOn 形式不正 | 422 / zod issues |
| validation | `POST /api/admin/meetings/:id/attendances` | memberId 不在 | 422 or 404 |
| not_found | `PATCH` / `export.csv` | meetingId 未存在 | 404 |
| invariant_15 | `POST /admin/meetings/:id/attendances` | 削除済み member 指定 | 410 (or 404 with body) |
| audit | mutation 全種 | 成功時 | audit log 1 行追加 |
| CSV | export.csv | displayName にカンマ・改行・`"` | RFC 4180 quote / `""` escape |
| 冪等性 | attendance upsert | 同 (meetingId, memberId) 二重 POST | 1 行のみ |

### 検証コマンド（DoD）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test --filter @ubm-hyogo/api
mise exec -- pnpm test --filter @ubm-hyogo/web
```

E2E (`apps/web/e2e/admin-meetings.spec.ts`) は 08b で実行する想定で、本 phase ではシナリオ placeholder のみ。

## 成果物

- outputs/phase-04/main.md

## 完了条件

- [x] 5 endpoint と UI の verify suite が確定する
- [x] 401 / 403 / 404 / 410 / 422 の境界が記録される
- [x] E2E シナリオが 08b で実行可能な粒度になる
- [x] DoD: 上記 4 つの `mise exec -- pnpm test ...` 系コマンドが lint / typecheck と共にパスする想定が記録される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、verify suite と境界仕様を渡す。
