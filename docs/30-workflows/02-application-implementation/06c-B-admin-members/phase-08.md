# Phase 8: DRY 化 — 06c-B-admin-members

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members |
| phase | 8 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

命名・型・path・endpoint の Before/After を整え、admin 配下と me 配下の重複を抑制する。

## Before / After

| 領域 | Before | After |
| --- | --- | --- |
| 検索 query 型 | route 内に inline 定義 | `packages/shared/src/admin/search.ts` で `AdminMemberSearch` 型に集約 |
| audit writer | handler 内で直接 INSERT | `apps/api/src/lib/audit.ts` に `writeAudit(actor, target, action)` を抽出 |
| require-admin | 各 route で都度 check | middleware 1 箇所に統一（既存維持） |
| apps/web fetch | route ごとに fetch 文を生 | `apps/web/src/lib/fetch/admin.ts` で `fetchAdminMembers()` |
| endpoint path | `/api/admin/members/:id/delete` 等の混在 | `/api/admin/members/:id/soft-delete` `/restore` `/role` に統一 |
| 命名 | `removeMember` / `disableMember` | `softDeleteMember` / `restoreMember` に統一（07-edit-delete 準拠） |

## 実行タスク

1. 重複 code path を列挙する。完了条件: refactor 対象が決まる。
2. 命名と path を 11/07/12 に整合させる。完了条件: After に統一名が決まる。
3. shared 化対象を packages/shared に切り出す方針を決める。完了条件: 配置先が決まる。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- packages/shared/src/

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-B-admin-members/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: Phase 7 AC マトリクス
- 下流: Phase 9 品質保証

## 多角的チェック観点

- #5 apps/web D1 direct access forbidden（fetch helper 経由）
- #13 audit 書込みが 1 箇所に集約される
- 命名が 07-edit-delete / 12-search-tags の語彙と一致する

## サブタスク管理

- [ ] Before/After 表を確定する
- [ ] shared 化対象を決める
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- outputs/phase-08/main.md

## 完了条件

- 命名・path・endpoint が正本仕様の語彙に統一される
- 重複が packages/shared または lib/ に集約される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 9 へ、Before/After と shared 化方針を渡す。
