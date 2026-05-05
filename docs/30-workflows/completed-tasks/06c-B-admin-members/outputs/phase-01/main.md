# Phase 01 Main — 要件定義

## Classification

| Field | Value |
| --- | --- |
| task | `06c-B-admin-members` |
| phase | `01 / 13` |
| taskType | `implementation-spec / docs-only` |
| docs_only | `true` |
| visualEvidence | `VISUAL_ON_EXECUTION` |

## 目的

`/admin/members` 一覧と右ドロワー詳細の真の未完了境界を確定し、検索/フィルタ・論理削除/復元・audit 表示を `11-admin-management.md` / `07-edit-delete.md` / `12-search-tags.md` に整合させる。

## Scope（確定境界）

### Scope In
- `/admin/members` 一覧 UI（検索フォーム、zone/status/tag フィルタ、sort、ページング）
- `/admin/members` 右ドロワー詳細 UI（基本情報・audit log・論理削除/復元導線）
- API contract: `GET /api/admin/members?filter&q&zone&tag&sort&density&page` / `GET /:memberId` / `POST /:memberId/delete` / `POST /:memberId/restore`
- apps/web middleware + apps/api `requireAdmin` の二段防御

### Scope Out
- public/会員側検索 UI、CSV export、一括操作、統計
- Google Form 再回答（本人更新は Form を正本）
- admin user 招待/作成、admin role 変更 UI/API
- production secret 値の記録、commit/push/PR

## AC × evidence path 対応

| AC | evidence path |
| --- | --- |
| filter+q+zone+tag+sort+density 組合せ検索 | outputs/phase-11/curl/admin-members-list.txt + screenshots/admin-members-list.png |
| `/admin/members` ドロワー詳細 + delete/restore | outputs/phase-11/curl/admin-members-detail.txt + admin-members-{delete,restore}.txt |
| admin 以外で 403 / 未ログインで 401 | outputs/phase-11/curl の authz セクション |
| 論理削除/復元が `member_status.is_deleted` / `deleted_members` 準拠 | outputs/phase-11/d1/audit-log.txt |
| 不変条件 #4/#5/#11/#13 違反なし | outputs/phase-09/main.md の secret hygiene + Phase 10 GO/NO-GO |

## 自走禁止操作（user approval / 上流 gate）

- アプリケーションコード実装、deploy、commit、push、PR 作成
- production 環境での smoke 実行（staging 限定）
- 06b-A session resolver / audit_log migration / require-admin role 表 が未着地時は Phase 11 実測を行わない

## 完了条件チェック

- [x] 検索 query (`q` / `zone` / `status` / `tag` / `sort` / `density`) 契約が `12-search-tags.md` に整合
- [x] delete / restore が `07-edit-delete.md` の論理削除ポリシーに従う
- [x] admin 以外で 403 / 未ログインで 401
- [x] audit log に actor / 対象 memberId / 操作種別 / timestamp を記録
- [x] production secret 値が仕様書中に登場しない

## 次 Phase への引き渡し

Phase 2 へ、確定した AC・blocker（B1: 06b-A 未着地 / B2: audit_log migration / B3: admin role 判定 / B4: 検索 index）・evidence path・自走禁止操作の境界を引き渡す。
