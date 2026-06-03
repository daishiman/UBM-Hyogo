# Phase 1: 要件定義

> **実装区分: 実装仕様書**（CONST_004 デフォルト）。issue #1035 は CLOSED だが、調査の結果 tag master CRUD は **完全に未実装**（別タスクでも未解決）であり、目的達成にはコード実装が必須のため実装仕様書として作成する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | **No** | 通常の実装 Phase（TDD RED/GREEN）とする |
| upstream（dev/main）にマージ済み | **No** | tag master write は dev 先端（commit `049807984`）に存在しない |
| 前提タスク（issue-982）完了済み | **Yes** | member_tags write + tag master read は実装済み。本タスクはその上に tag master write を積む |

`implementation_mode: "new"`。

## 調査結論（issue 最適化）

`apps/api` を grep + Explore 調査した結果:

- `apps/api/src/repository/tagDefinitions.ts` は **read 専用 3 関数のみ**（`listAllTagDefinitions` / `listByCategory` / `findByCode`）。48 行目に `// 不変条件 #13: write API は提供しない。seed は 01a で投入済み。`
- `/admin/tags/queue` 系（tag assignment queue）は存在するが、これは tag master CRUD **ではない**。
- audit action 命名は `admin.member.tag_assigned` 等。tag master 用 action（`admin.tag.*`）は未定義。`AuditTargetType`（`auditLog.ts:8-14`）に `"tag"` は無い。
- migration 0002（`0002_admin_managed.sql:34-41`）に `tag_definitions` 定義済み、**`active INTEGER NOT NULL DEFAULT 1` カラムは既存**。

→ **issue #1035 は未解決・陳腐化していない。実装が必要。** 元 followup-002 仕様の 2 つの未確定点（code immutability / 論理削除の available 乖離）を現状コードに最適化して確定する（[../index.md](../index.md) `issue_optimization_note` 参照）。

## 受入条件（AC）— issue #1035 原文準拠

- **AC-1**: `POST /admin/tags { code, label, category }` で persist。既存 `code` 衝突は 409 `tag_code_conflict`。
- **AC-2**: `PATCH /admin/tags/:tagId { label?, category? }` で更新。**`code` は immutable**（本仕様で確定）。
- **AC-3**: `DELETE /admin/tags/:tagId` は論理削除（`active=0`）。assigned 済 `member_tags` row は保持。
- **AC-4**: `GET /admin/tags` が pagination + search を受理し `{ total, items }` を返す。
- **AC-5**: write で audit `admin.tag.created` / `admin.tag.updated` / `admin.tag.deactivated` を actor + tagId で 1 件記録。state 変化時のみ。
- **AC-6**: D1 直接アクセスは `apps/api` に閉じる（CLAUDE.md invariant #5）。`apps/web` 非接触。
- **AC-7**: 既存 `GET /admin/members/:memberId/tags`（issue-982）の response shape に regression 無し。

## タスク分類

- **task type**: implementation（API endpoint 新設）
- **visual classification**: **NON_VISUAL**（API only。UI 変更なし。Phase 11 screenshot 不要、`outputs/phase-11/manual-test-result.md` を一次証跡とする）
- **docs-only ではない**: コード変更（repository write 関数・新規 route・audit 型・index.ts mount）を伴う。

## inventory（変更対象ファイル一覧・確定）

| # | パス | 変更種別 | 概要 |
|---|------|---------|------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 編集 | write 関数 5 種追加 + 不変条件 #13 コメント改訂 |
| 2 | `apps/api/src/repository/auditLog.ts` | 編集 | `AuditTargetType` に `"tag"` 追加 |
| 3 | `apps/api/src/routes/admin/tags.ts` | 新規 | tag master CRUD route（GET/POST/PATCH/DELETE） |
| 4 | `apps/api/src/index.ts` | 編集 | `adminTagsRoute` の import + `app.route("/admin", adminTagsRoute)` |
| 5 | `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | 不変条件 #13 に tag master CRUD（第3経路）節を追加 |
| 6 | `apps/api/src/routes/admin/tags.contract.spec.ts` | 新規 | route contract test（AC-1..AC-7） |
| 7 | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 新規 | repository write 関数 test |

> **新規 migration は不要**（`active` カラムは既存）。code 検索は UNIQUE index（暗黙）で足り、label 部分一致は現規模で full scan 許容のため index 追加もしない。

## 既存コードの命名規則（記録）

- repository 関数: camelCase。read は `listXxx` / `findByXxx`。member_tags write は `assignTagToMemberByAdmin`（`assign*`）/ `unassignTagFromMemberByAdmin`。
- **tag master 用 write 関数命名**: `createTagDefinition` / `updateTagDefinition` / `deactivateTagDefinition` / `listTagDefinitionsPaged` / `getTagDefinitionByIdRaw`。
  - ⚠️ **type-level readonly gate は `memberTags.ts` のみ**（`memberTags.readonly.test-d.ts`）。`tagDefinitions.ts` には gate が無いため、`create*`/`update*`/`delete*` 接頭辞の write 関数を追加しても type-d test は FAIL しない（[Phase 3](../phase-3/phase-3.md) 整合性確認参照）。
- route ファイル: `createAdminXxxRoute()` factory + `adminXxxRoute` instance を export。
- zod schema: route ファイル内インライン `XxxBodyZ` / `XxxQueryZ`。
- error response: `{ ok: false, error: "<code>" }` + status code。成功 GET は `c.json(data, 200)`、DELETE は `c.body(null, 204)`。
- audit action: `auditAction("admin.tag.created")`（`AuditAction = RepoBrand<string>` なので任意文字列を brand 化、enum 制約なし）。

## targeted test run ファイルリスト（FB-UI-02-2 / メモリ制約対策）

全件 `pnpm test` は重いため、本タスクの検証は対象指定で行う:

```
apps/api/src/routes/admin/tags.contract.spec.ts
apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts
apps/api/src/routes/admin/members.tags.contract.spec.ts   # AC-7 regression
apps/api/src/repository/__tests__/auditLog.repository.spec.ts  # audit regression
```

## carry-over 確認

直前コミット（`git log --oneline -5`）は auth-view / members SelectedFiltersBar / AdminFetchError 系で、tag master とは独立。本タスクの新規作業（tag master CRUD）と重複なし。
