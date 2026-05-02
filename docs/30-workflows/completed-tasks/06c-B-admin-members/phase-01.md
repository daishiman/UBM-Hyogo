# Phase 1: 要件定義 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 1 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/admin/members` 一覧と右ドロワー詳細の真の未完了境界を確定する。検索/フィルタ・論理削除/復元・audit 表示を `11-admin-management.md` / `07-edit-delete.md` / `12-search-tags.md` に整合させるため、scope と AC、依存・evidence path を明確化する。

## 実行タスク

1. 正本仕様（11/07/12 + 06/09）と prototype の admin members section を確認する。完了条件: 検索パラメータ・論理削除/復元・audit 表示の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/(admin)/admin/members/page.tsx
- apps/web `MembersClient` / `MemberDrawer`
- apps/api/src/routes/admin/members.ts
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver, 07-edit-delete API, require-admin middleware, 12-search-tags 検索契約
- 下流: 08b admin members E2E, 09a admin staging smoke

## 多角的チェック観点

- #4 本文編集禁止（admin も同じ）
- #5 apps/web D1 direct access forbidden
- #11 admin も他人本文編集不可
- #13 admin 操作の audit log 必須
- 4条件（価値性: admin 運用必須機能 / 実現性: 既存 require-admin で接続可 / 整合性: 11/07/12 の正本仕様準拠 / 運用性: audit log で操作追跡可能）
- 未実装/未実測を PASS と扱わない。

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] blocker / approval gate を明記する
- [x] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- [x] 検索 query (`q` / `zone` / `status` / `tag` / `sort`) の契約が `12-search-tags.md` に整合する。
- [x] delete / restore が `07-edit-delete.md` の論理削除ポリシーに従う。
- [x] admin 以外で 403、未ログインで 401 を返す。
- [x] audit log に操作主体・対象 memberId・操作種別・timestamp が記録される。
- [x] production secret 値が仕様書中に登場しない。

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate を渡す。
