# Phase 1: 要件定義

## メタ情報

| 項目 | 内容 |
|------|------|
| workflow | issue-1036-bulk-member-tag-assign |
| 実装区分 | **実装仕様書**（apps/api + apps/web のコード変更を伴う） |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION（admin members 一覧の bulk UI を変更する） |
| implementation_mode | `new`（RED/GREEN サイクルで新規実装） |
| GitHub Issue | #1036（CLOSED 維持） |

## 目的

admin members 一覧で複数 member を選択し、複数 tag を一括で付与/解除する batch endpoint と
bulk UI を実装する。issue-982（単一 member drawer の手動 tag 編集）の選択基盤・audit・冪等性を
再利用し、最新コードに最適化して 1 サイクルで完結させる。

## P50 前提確認チェック

| 確認項目 | 判定 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No | 通常の実装 Phase（TDD Red→Green）とする |
| upstream（dev）にマージ済み | No（未実装） | 再実装不要扱いにしない |
| 前提タスク（依存タスク）が完了済み | issue-982（単一 endpoint・選択基盤）= **完了済み（dev merged）** / #913（idempotency store）= **未実装だが DB 自然冪等で代替し依存解消** | 依存チェック省略可。#913 を前提から外す最適化を Phase 2 で確定 |

> **implementation_mode = `new`**: 既実装は存在しないため Phase 4 で通常の TDD Red を設計し、Phase 5 で新規実装を行う。

## タスク分類

- **UI task（VISUAL_ON_EXECUTION）**: task-B（BulkActionBar 拡張）は admin members 一覧の見た目・操作を変更するため、Phase 11 で screenshot 証跡を取得する（実行時 user-gated）。
- **API task（NON_VISUAL）**: task-A は endpoint/repository/audit の追加で UI を持たない。
- **docs task**: task-C は不変条件 #13 の再定義と visual baseline 整合。

## 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 対象 | 既存の命名規則 | 本タスクで踏襲する命名 |
|------|----------------|------------------------|
| repository 関数（admin 手動 tag） | `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin`（camelCase, `…ByAdmin` suffix） | `bulkApplyMemberTagsByAdmin`（bulk admin write 入口・`…ByAdmin` suffix 継承） |
| repository 関数（read） | `getTagDefinitionMaster` / `listAssignedTagsForMember` / `getMemberDeletedFlag` | tag master list は既存 `getTagDefinitionMaster` を再利用 |
| audit action | `admin.member.tag_assigned` / `admin.member.tag_unassigned`（dot-delimited） | **同一 action 名を再利用**（AC-3 parity） |
| endpoint パス | `/admin/members/:memberId/tags`（kebab/segment） | bulk: `/admin/members/tags/bulk`、tag master read: `/admin/tags` |
| web API client | `patchMemberStatus` / `assignMemberTag` / `unassignMemberTag`（camelCase, `apps/web/src/lib/admin/api.ts`・`features/admin/api/members.ts`） | `bulkApplyMemberTags`（camelCase 継承） |
| web component | `BulkActionBar` / `MembersTable` / `TagPill`（PascalCase, `_members/` 配下） | `BulkActionBar` 拡張 + `BulkTagPicker`（新規 primitive を生やさず TagPill 再利用） |

## 不変条件チェック（CLAUDE.md）

| # | 不変条件 | 本タスクでの扱い |
|---|----------|------------------|
| #5 | D1 直接アクセスは apps/api に閉じる | bulk write は apps/api repository に閉じる。apps/web は fetch 経由のみ |
| #9 | admin form input は FormField 経由 | tag picker は既存 `TagPill` / `FormField` / `Select` primitive を使い、`<input>` を直接増やさない |
| #10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | bulk 実行は `useAdminMutation` 経由（legacy `@/lib/useAdminMutation` は使わない） |
| #13 | member_tags write は限定経路（issue-982 で 2 経路に再定義） | **第3の write 入口（bulk admin）として再定義**。`bulkApplyMemberTagsByAdmin` を追加し、type-level gate allow list を更新（task-C で不変条件コメントを更新） |

## 受入条件 (AC)

| ID | 受入条件 | 担当 task | 検証 Phase |
|----|----------|-----------|-----------|
| AC-1 | batch endpoint で複数 memberId × 複数 tagId を `op:"assign"`/`op:"unassign"` で一括処理 | task-A | Phase 4/6 contract test |
| AC-2 | 部分失敗時 `{ results: [{ memberId, tagId, status }] }`（status ∈ assigned/unassigned/noop/skipped_deleted/tag_not_found） | task-A | Phase 4/6 contract test |
| AC-3 | 実 mutation した member×tag 単位で audit 1 件（既存 action 名 parity） | task-A | Phase 4/6 contract test（audit_log 行数アサート） |
| AC-4 | 削除済み member は `skipped_deleted` で skip、他 member は継続 | task-A | Phase 4/6 contract test |
| AC-5 | 同一 bulk 再送が冪等（既成功分は noop、追加 audit/副作用なし） | task-A | Phase 4/6 contract test（再送で audit 増えない） |
| AC-6 | 既存単一 endpoint・既存 BulkActionBar に regression 無し | task-A/B | Phase 9 既存 spec 全 green |
| AC-7 | 既存複数選択を再利用し BulkActionBar に tag picker + 一括付与/解除 + 部分失敗表示を追加 | task-B | Phase 11 visual + component spec |

## Inventory（現行コード — 変更対象の起点）

### apps/api

| ファイル | 役割 | 変更種別 |
|----------|------|----------|
| `apps/api/src/routes/admin/members.ts` | 単一 tag endpoint（L656-744）。bulk endpoint を追記 | 編集 |
| `apps/api/src/routes/admin/tags-queue.ts`（参照） | tag queue endpoint。tag master read は別ファイルへ | 参照のみ |
| `apps/api/src/repository/memberTags.ts` | `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` / `getTagDefinitionMaster` / `getMemberDeletedFlag`。bulk helper を追記 | 編集 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | type-level write gate。allow list に新関数追加 | 編集 |
| `apps/api/src/repository/auditLog.ts`（参照） | `append()` / `AuditTargetType` | 参照のみ |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts`（参照） | 単一 endpoint contract test。bulk は新規 spec へ | 参照のみ |

### apps/web

| ファイル | 役割 | 変更種別 |
|----------|------|----------|
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` | publish/hide/soft-delete のみ。tag picker + bulk tag 操作を追加 | 編集 |
| `apps/web/src/features/admin/components/_members/MembersClientShell.tsx`（参照） | `selected: Set<string>` state owner | 参照のみ（props 受け渡し確認） |
| `apps/web/src/features/admin/components/_shared/TagPill.tsx` | tag pill primitive。tag picker で再利用 | 参照のみ |
| `apps/web/src/features/admin/api/members.ts` | `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag`。bulk API client + tag master fetch を追加 | 編集 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts`（参照） | mutation hook | 参照のみ |
| `apps/web/src/features/admin/hooks/useBulkRepublish.ts`（参照） | 既存 bulk 操作の progress/部分失敗パターン | 参照のみ（パターン流用） |

### docs

| ファイル | 役割 | 変更種別 |
|----------|------|----------|
| `apps/api/src/repository/memberTags.ts`（先頭コメント） | 不変条件 #13 定義 | 編集（task-C） |
| `CLAUDE.md` / 関連 specs | 不変条件 #13 第3経路の整合 | 編集（task-C・必要時） |

## スコープ

### 含む
- bulk tag batch endpoint（`POST /admin/members/tags/bulk`）
- tag master read endpoint（`GET /admin/tags`）
- bulk repository helper（`bulkApplyMemberTagsByAdmin`）
- type-level write gate 更新
- BulkActionBar への tag picker + assign/unassign + 部分失敗表示
- member×tag 単位 audit（batchId 相関）
- 上記すべてのテスト（contract / repository / type gate / component）

### 含まない（scope-out → Phase 12 未タスク候補で記録）
- server idempotency-key middleware（#913・別タスク。本タスクは DB 自然冪等で完結）
- tag master write/CRUD（#1035・別タスク）
- tag master pagination（tag 数が大規模化した場合の将来課題）

> scope-out は「将来の独立した別タスク」であり、本タスク AC の達成には不要。1 サイクル完結を阻害しない。

## 参照資料

- 元仕様書: `…/issue-982-drawer-tag-pill-editing/unassigned-task-specs/issue-982-drawer-tag-pill-editing-followup-003-bulk-member-tag-assign.md`
- 親実装ガイド: `…/issue-982-drawer-tag-pill-editing/outputs/phase-12/implementation-guide.md`
- design tokens: `apps/web/src/styles/tokens.css`（OKLch 正本）

## 実行タスク

1. AC を 7 件確定し、各 AC を task-A/B/C に割り当てる（本書で完了）
2. 命名規則を既存コードから抽出し、新規 identifier を整合させる（本書で完了）
3. 不変条件 #5/#9/#10/#13 への影響を確定する（本書で完了）
4. scope と scope-out を確定し、1 サイクル完結性を確認する（本書で完了）

## 成果物

- `phase-1-requirements.md`（本書）

## 完了条件 (DoD)

- [x] AC 7 件が task に割り当てられている
- [x] 命名規則が既存コードと整合している
- [x] 不変条件への影響が明記されている
- [x] #913 非依存の最適化が記録され、1 サイクル完結性が確認されている
