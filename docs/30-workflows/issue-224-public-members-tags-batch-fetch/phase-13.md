# Phase 13: PR 作成

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象 Issue: #224 公開 members list の tags 一括取得（N+1 防止）

## 目的

実装完了後に dev ブランチへ PR を作成する。**本フェーズは status=blocked（ユーザー承認待ち）**。

## ステータス

`blocked` — commit / push / PR 作成はユーザーの明示承認後にのみ実行する。

## PR 仕様

| 項目 | 値 |
|------|-----|
| base ブランチ | `dev` |
| タイトル | `fix(api): 公開 members list に expand=tags 一括取得を追加 (N+1防止) (#224)` |
| 関連 Issue | #224 |

## PR 本文骨子

- **背景**: 公開 members list で各 member の tags を取得する際、member ごとに query を発行すると N+1 になる。
- **変更**: `expand=tags` クエリを追加し、指定時のみ全 member の tags を `member_id IN (...)` の 1 query（`listTagsByMemberIds`）で一括取得し、memberId で groupBy して各 item に割り当てる。
- **後方互換**: `expand` 未指定時は tags キーを付与しない。`appliedQuery` は `.strict()` を維持し `expand` を含めない。visibility filter は不変。
- **検証**: typecheck / lint / api test / shared test green、N+1 検知（helper 1 回呼び出し）を spec で assert。
- **スコープ外**: web UI の tags 表示（#1006 射程）、fields の N+1 解消（別系統）。

## 含まれる変更ファイル

- `apps/api/src/_shared/search-query-parser.ts`（`expand: ("tags")[]` 追加）
- `packages/shared/src/zod/viewmodel.ts`（`PublicMemberTagZ` 新規 + `PublicMemberListItemZ.tags` optional）
- `packages/shared/src/types/viewmodel/index.ts`（`PublicMemberListItem.tags?`）
- `apps/api/src/view-models/public/public-member-list-view.ts`（`PublicMemberListItemSource.tags?`）
- `apps/api/src/use-cases/public/list-public-members.ts`（expand=tags 時の一括取得 + groupBy）
- `apps/api/src/routes/public/index.contract.spec.ts`（spec）
- `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（spec）

> `apps/api/src/repository/memberTags.ts`（`listTagsByMemberIds`）は再利用のみで **無改変**。

## DoD（Definition of Done）

- [ ] PR base = dev
- [ ] タイトルが規約に沿う（`fix(api): ... (#224)`）
- [ ] 本文に背景/変更/後方互換/検証/スコープ外が含まれる
- [ ] 変更ファイル一覧に helper 無改変が明記される
- [ ] commit/push/PR はユーザー承認後にのみ実行

## 完了条件

ユーザー承認後に PR が作成され、URL が記録されること。
