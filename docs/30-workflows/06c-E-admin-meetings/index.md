# 06c-E-admin-meetings

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| 状態 | implementation_complete_pending_pr / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

管理者向け `/admin/meetings` 画面と `/api/admin/meetings*` の最小実装 follow-up を仕様化する。支部会の開催日と参加履歴を Google Form schema 外の admin-managed data として登録・編集・CSV export できるよう、UI と API、D1 テーブル設計を確定する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、`11-admin-management.md` で `/admin/meetings` の存在は規定済みだが、開催日 (`meetings`) と参加履歴 (`meeting_attendances`) の D1 schema、API endpoint、UI 構成が follow-up gate として未確定なまま 06c admin pages 本体タスクで `/admin/members` `/admin/tags` `/admin/schema` のみ閉じられたため、残存する meetings 機能だけを切り出して実装仕様書化する。

## scope in / out

### Scope In
- D1 tables `meeting_sessions` / `member_attendance` の schema 定義（admin-managed data 分離）
- `apps/api` `/admin/meetings`（GET 一覧、POST 作成）
- `apps/api` `/admin/meetings/:id`（PATCH 更新 / 論理削除）
- `apps/api` `/admin/meetings/:id/attendances`（POST `{ memberId, attended }` による参加メンバー記録 / 解除）
- `apps/api` `/admin/meetings/:id/export.csv`（CSV export）
- `apps/web` `/admin/meetings` 画面（一覧 / 作成 / 編集 / 参加記録 / CSV ダウンロード）
- `requireAdmin` middleware 適用（API gate 第2段）
- `apps/web/middleware.ts` `/admin/:path*` matcher への合流（UI gate 第1段）
- audit log entry（admin.meeting.created / meetings.update / meetings.delete / attendance.add / attendance.remove）

### Scope Out
- 開催日に紐づく決済 / 会費連動
- 出欠の本人セルフ申告 UI（管理者操作のみ）
- Google Form 同期対象への昇格（admin-managed 分離維持）
- 物理削除（論理削除のみ、`deletedAt` で表現）
- meetings の自動繰り返しルール（cron 生成等）
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On
- 06c-D-admin-schema（admin shell 共通基盤）
- 06c admin pages 本体（`/admin` shell、admin layout、左 nav）
- 06b-A-me-api-authjs-session-resolver（session resolver の本番接続）
- `apps/api/src/middleware/require-admin.ts`（API gate 第2段）
- `apps/web/middleware.ts` の `/admin/:path*` matcher
- D1 binding（apps/api の `DB`）
- `11-admin-management.md` `/admin/meetings` 規定

### Blocks
- 08b-A-playwright-e2e-full-execution（admin meetings E2E）
- 09a-A-staging-deploy-smoke-execution（staging admin smoke）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06b-A → 06c admin shell → 06c-E** の serial。
- 本タスクは meetings 単独 SRP を担い、08b-A / 09a-A の前提条件を確定する。
- 06c-A〜E（admin 5 件）は実態として admin shell 共通基盤を共有する parallel-eligible だが、命名規則「sort 順 = 実行順」に従い名目上 serial として A → B → C → D → E の順で実行する。

## refs

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/05-pages.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/api/src/middleware/require-admin.ts
- apps/web/middleware.ts
- apps/api/src/index.ts

## AC

- `/admin/meetings` が admin session で 200 を返し、未ログイン / 非 admin は `/login?gate=admin_required` または 403 になる
- `POST /api/admin/meetings` が `{ heldOn, title, note? }` を受け取り `meeting_sessions` 行を作成する
- `PATCH /api/admin/meetings/:id` が title / note / heldOn / deletedAt を更新できる
- `POST /api/admin/meetings/:id/attendances` が `{ memberId, attended }` を受け取り `member_attendance` を upsert / delete する
- `GET /api/admin/meetings/:id/export.csv` が `meetingId, heldOn, memberId, displayName, attended` を含む CSV を返す
- `meeting_sessions` / `member_attendance` は Google Form 同期対象にならない（admin-managed 分離）
- 全 mutation が audit log に記録される
- apps/web は D1 を直参照せず、cookie forwarding で `apps/api` を呼ぶ

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## services / secrets

- Cloudflare Workers（apps/api / apps/web）
- Cloudflare D1（`DB` binding、tables: `meeting_sessions`, `member_attendance`）
- AUTH_SECRET（既存、追加発行なし）
- 本タスクは新規 secret を導入しない

## invariants touched

- #4 admin-managed data 分離（meetings は Form schema 外）
- #5 apps/web D1 direct access forbidden
- #7 memberId/responseId separation
- #13 audit log
- #15 Auth session boundary（admin gate 二段防御）

## completion definition

全 phase 仕様書、Phase outputs、実装差分、focused tests、Phase 12 strict 7 files が揃い、deploy / visual evidence / commit / push / PR 作成が user approval gate に分離されていること。
