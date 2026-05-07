[実装区分: 実装仕様書]
> 根拠: docs-only ラベルだが、目的達成に `apps/api` / `apps/web` / `packages/shared` の実コード変更が必要なため、CONST_004 例外として実装仕様書扱いとする。

# Phase 1: 要件定義 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 1 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/admin/members` 一覧・右ドロワー詳細・delete/restore・audit 表示の「実装実行」を SRP として確定する。Phase 12 implementation-guide で先行確定した契約を要件として再宣言し、AC・blocker・approval gate を実装担当者が単独完遂可能な粒度で固定する。

## 実行タスク

1. 正本仕様（11-admin-management / 07-edit-delete / 12-search-tags / 06-member-auth / 09-ui-ux）と 06c-B 完了済 workflow の Phase 12 implementation-guide を読み合わせる。完了条件: 検索パラメータ・論理削除/復元・audit 表示の境界が確定する。
2. 既存 `apps/api/src/routes/admin/members.ts` / `member-delete.ts` と `apps/web` admin members の現行実装ギャップを列挙する。完了条件: 「現状」「期待」「差分」の表が確定する。
3. user approval / 上流 gate が必要な操作（commit / push / PR / staging deploy）を分離する。完了条件: 自走禁止操作が明記される。
4. `packages/shared` の query parser / Zod schema 抽出可否を判断する。完了条件: 抽出する場合のシンボル名が確定する。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md
- apps/web/app/(admin)/admin/members/page.tsx
- apps/web `MembersClient` / `MemberDrawer`
- apps/api/src/routes/admin/members.ts
- apps/api/src/routes/admin/member-delete.ts
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/06c-B-admin-members-implementation-execution/
- 本仕様書作成では実装、deploy、commit、push、PR を行わない。
- 実装は Phase 5 (ランブック) に従い、evidence 取得は Phase 11 で行う。

## API 入出力契約（要件として固定）

| 端点 | 入力 | 出力 | 不正系 |
| --- | --- | --- | --- |
| `GET /api/admin/members` | `filter` `q` `zone` `tag[]` `sort` `density` `page` `pageSize` | `{ total, members, page, pageSize }` | 401 / 403 / 422 |
| `GET /api/admin/members/:memberId` | path id | `{ member, auditLogs[] }` | 401 / 403 / 404 |
| `POST /api/admin/members/:memberId/delete` | path id, `{ reason }` | `{ id, isDeleted: true, deletedAt }` + audit | 401 / 403 / 404 / 409 / 422 |
| `POST /api/admin/members/:memberId/restore` | path id | `{ id, restoredAt }` + audit | 401 / 403 / 404 / 409 |

### query 検証規則

| param | default | 不正時 |
| --- | --- | --- |
| `filter` | 全件 | 不正値 → 400（旧契約互換） |
| `q` | "" | trim + 連続空白正規化、>200 文字 → 422 |
| `zone` | `all` | `all \| 0_to_1 \| 1_to_10 \| 10_to_100` 以外 → 422 |
| `tag` | `[]` | 6 件以上 → 422、未知 tag は 0 件結果（422 ではない） |
| `sort` | `recent` | `recent \| name` 以外 → 422 |
| `density` | `comfy` | `comfy \| dense \| list` 以外 → 422 |
| `page` | `1` | 0 / 非整数 → 422、過大 → 200 + `members: []` |
| `pageSize` | `50` (固定) | 変更不可（明示指定された場合は無視 or 422、Phase 2 で確定） |

## ギャップ要件（実装着手時の期待値）

| 領域 | 現状 | 期待 |
| --- | --- | --- |
| `GET /admin/members` | `filter=published\|hidden\|deleted` のみ | `q` / `zone` / `tag[]` / `sort` / `density` / `page` 対応 |
| `members.ts` SQL | `WHERE` 単純条件 | `LIKE ESCAPE '\'` + json_extract + `member_tags EXISTS` AND |
| delete endpoint | 仕組み未接続 | 論理削除 + `audit_log` 書込 (`admin.member.deleted`) |
| restore endpoint | 仕組み未接続 | `is_deleted=0` + `audit_log` 書込 (`admin.member.restored`) |
| `MembersClient` | 簡易フィルタ | URL 同期 + 検索 form + 選択 tag 表示 + ページング |
| `MemberDrawer` | 既存表示 | audit log 表示 + delete/restore 結果分岐 |
| `packages/shared` | 未分離 | `admin/search.ts` に zod / 型 / helper 抽出 |

## 統合テスト連携

- 上流: 06c-A admin dashboard / 06c admin pages / 06b-A session resolver / 07-edit-delete API / 12-search-tags / require-admin middleware
- 下流: 08b-A playwright admin E2E / 09a admin staging smoke / 06c-C admin tags

## 多角的チェック観点

- 不変条件 #4（本文編集禁止）/ #5（apps/web D1 直参照禁止）/ #11（admin も他人本文編集不可）/ #13（audit log 必須）
- 4条件
  - 価値性: admin 運用に不可欠な検索・削除・audit
  - 実現性: 既存 `requireAdmin` / `auditAppend()` で接続可能
  - 整合性: 11 / 07 / 12 の正本仕様準拠
  - 運用性: audit log で追跡可能、URL state により共有可能
- 未実装/未実測を PASS と扱わない

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] ギャップ表を確定する
- [ ] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- [ ] 検索 query (`q` / `zone` / `tag` / `sort` / `density` / `page`) の契約が `12-search-tags.md` に整合する
- [ ] delete / restore が `07-edit-delete.md` の論理削除ポリシーに従う
- [ ] admin 以外で 403、未ログインで 401、状態競合で 409、不正 query で 422 を返す
- [ ] audit log に actor / target / action / timestamp / before / after が記録される
- [ ] production secret 値が仕様書中に登場しない
- [ ] commit / push / PR / staging deploy を本 phase で実行しない

## blocker / approval gate

- staging deploy・production deploy は本タスクのスコープ外。Phase 11 evidence は localhost / preview で取得する。
- commit / push / PR 作成はユーザー指示があるまで実行しない（CLAUDE.md 重要不変条件 #7 の運用に準拠）。
- production secret は 1Password / Cloudflare Secrets を正本とし、仕様書・コードに転記しない。

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] 06c-B 完了済 workflow の単純復活ではなく、実装実行を SRP とした新 workflow になっている

## 次 Phase への引き渡し

Phase 2 へ、AC、API 契約、ギャップ表、blocker、approval gate、`packages/shared` 抽出方針を渡す。
