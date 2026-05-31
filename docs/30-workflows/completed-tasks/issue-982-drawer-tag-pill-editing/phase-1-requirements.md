# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

scope / 受入条件 / inventory / 命名規則 / P50 を固定し、Phase 2 設計の前提を確定する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（tag write endpoint / 編集 UI なし） | 通常の新規実装。`implementation_mode: "new"` |
| upstream（dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク完了済み | API admin 側に idempotency **middleware は未配線**（`useAdminMutation` が `Idempotency-Key` を送るが server no-op）。冪等性は PK `INSERT OR IGNORE` で担保。followup-001（#981 list enrichment）は未実装だが blocker ではない | #981 非依存で進める（drawer は `GET /admin/members/:memberId/tags` で独自取得） |

## タスク分類

- **UI task（VISUAL_ON_EXECUTION）**: MemberDrawer の編集 UI 変更を含むため Phase 11 で screenshot 必須（staging は user-gated）。
- API 層・repository 層・docs 層も含む複合タスク（task-A/B/C で分離）。

## 命名規則（既存コードベース分析）

| 対象 | 規則 | 根拠 |
| --- | --- | --- |
| repository 関数 | camelCase 動詞始まり（`assignTagsToMember`, `getMemberDetailForAdmin`） | `apps/api/src/repository/*` |
| route パスパラメータ | `:memberId`（`:id` ではない） | `members.ts` で `c.req.param('memberId')` |
| audit action | `admin.<entity>.<verb past>`（`admin.tag.queue_resolved`）。`auditLogProvider.append()` 経由 | `tagQueueResolve.ts:183-196` / `auditLog.ts` |
| test ファイル | `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止） | CLAUDE.md invariant #8 |
| web mutation hook | `@/features/admin/hooks/useAdminMutation`（positional: `(endpoint, method, options)`） | CLAUDE.md invariant #10 |
| 中間テーブル | `member_tags`（`tag_assignments` ではない）。master は `tag_definitions` | `migrations/0002_admin_managed.sql:34-51` |

## 受入条件（AC）— 最新コードへ最適化済み

- **AC-1**: `POST /admin/members/:memberId/tags { tagId }`（tagId = `tag_definitions.tag_id`）で `member_tags` に row が persist。再 POST は PK `(member_id, tag_id)` の `INSERT OR IGNORE` で no-op + 200（server idempotency middleware には依存しない）。
- **AC-2**: `DELETE /admin/members/:memberId/tags/:tagId` で row 削除。未存在への再 DELETE は 204 で冪等。
- **AC-3**: Drawer 内 tag pill が click で add / remove でき、楽観更新（component local state）→ 失敗時 `onError` で rollback + toast（`useAdminMutation`）。
- **AC-4**: state 変化時に audit `admin.member.tag_assigned` / `admin.member.tag_unassigned` が actor(email) + memberId + tagId で 1 件記録（`auditLogProvider.append`）。no-op（重複付与 / 未存在削除）は audit を増やさない。
- **AC-5**: `member_status.is_deleted = 1` の member への tag mutation は 409 `member_is_deleted`（Issue AC-5 の 409 契約に準拠）。member 不在は 404。
- **AC-6**: 既存 list / detail endpoint の response shape に regression 無し（detail の `tags` shape `{code,label,category,source}` 不変）。
- **AC-7**: active な tag master 不在の tagId への付与は 404 `tag_not_found`（`tag_definitions` 未存在 / inactive。master write は scope 外）。
- **AC-8**: invariant #13 が「auto-suggest = queue / admin manual = 専用 endpoint（audit 必須）」へ再定義され、`tags-queue.ts` コメント + `01-api-schema.md` に反映。

## inventory（現状コード anchor）

| 系統 | anchor |
| --- | --- |
| route owner | `apps/api/src/routes/admin/members.ts`（`membersRouter`、`/admin/members` に mount） |
| route 集約 / middleware | `apps/api/src/routes/admin/members.ts`（`createAdminMembersRoute()` 内で `requireAdmin` 適用）。server idempotency middleware は未配線のため、本タスクの冪等性は PK `INSERT OR IGNORE` / DELETE no-op で担保 |
| repository | `apps/api/src/repository/memberTags.ts` / `adminMembers.ts` / `_shared/builder.ts`（detail view） |
| audit | `apps/api/src/repository/auditLog.ts`（`append(c, NewAuditLogEntry)`、`c.var.auditLogProvider`） |
| schema | `apps/api/migrations/0002_admin_managed.sql`（`tag_definitions` / `member_tags` / `member_status`） |
| 編集対象 view | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |
| pill primitive | `apps/web/src/features/admin/components/_shared/TagPill.tsx` |
| web client | `apps/web/src/features/admin/api/members.ts` |

## スコープ確定

含む / 含まないは [index.md](index.md#スコープ) に従う。**1 PR サイクル完結（CONST_007）**。先送りなし。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず確認し既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | tag / member 項目定義（本タスクで endpoint 追記） |
| DB 構成 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 構成 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin drawer 規約 |
| API/IPC | `.claude/skills/aiworkflow-requirements/references/api-*.md` | endpoint 契約規約 |

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 本ファイル（AC / inventory / 命名規則 / P50 確定）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 完了条件

- AC-1〜AC-8 が明示列挙されている（達成済み）
- 命名規則・inventory が最新コードと一致（達成済み）
- task-A/B/C への分解が index.md と整合（達成済み）
