# Phase 1: 要件定義

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト）。本 Phase は要件・スコープ・命名規約・受入条件を固定する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | **No** | 通常の新規実装 Phase（`implementation_mode: "new"`） |
| upstream（dev/main）にマージ済み | **No**（`grep photoUrl apps/` = 0 件） | 未マージとして扱う |
| 前提タスク（依存）完了済み | 親 `admin-members-prototype-redesign` は completed（hue avatar まで実装済み） | 依存解消不要。本 task は photo 拡張 |

## タスク分類

- **UI task**（avatar の写真 render を含むため VISUAL）。`visualEvidence: VISUAL_ON_EXECUTION`。
- docs-only ではない（storage/API/D1/UI のコード変更が必須）。

## 既存コード命名規約（Phase 4 TDD 前に整合確認する基準）

| 領域 | 規約 | 実例 |
|------|------|------|
| apps/api route file | kebab-case `.ts`、Hono app export | `routes/admin/members.ts` |
| apps/api repository | camelCase 関数、`repository/` 配下 | `findMemberById` / `getStatus` |
| D1 migration | `NNNN_snake_case.sql` 連番 | 次番号 = `0022_member_photos.sql` |
| D1 table/column | snake_case | `member_photos` / `object_key` |
| shared zod | PascalCase + `Z` suffix | `AdminMemberDetailViewZ` |
| web component | PascalCase `.tsx` | `MemberAvatar` / `Avatar` |
| web hook | `useXxx` camelCase | `useAdminMutation` |
| audit action | dot 区切り | `admin.member.photo_uploaded` |
| test file | `*.spec.{ts,tsx}`（invariant #8。`*.test.*` 禁止） | `members.contract.spec.ts` |

## 受入条件（issue #983 AC を最新コードに最適化）

| ID | 受入条件 | 検証 Phase |
|----|---------|-----------|
| AC-1 | storage contract が `docs/00-getting-started-manual/specs/` に明文化（R2 bucket 名 / presign TTL 300s / object key `members/{memberId}/avatar` / 上限 256KB / MIME 3 種） | Phase 12 |
| AC-2 | `AdminMemberDetailViewZ.photoUrl?: string`（url 形式 optional）追加で既存 parse が壊れない（`.strict()` 維持） | Phase 4/5 |
| AC-3 | `MemberAvatar` は photoUrl 有 → `<img>`、未取得/`onError` → hue placeholder | Phase 4/5/11 |
| AC-4 | 写真未登録 member の avatar は現行 hue placeholder と pixel diff ゼロ | Phase 11 |
| AC-5 | R2 アクセスは presigned URL のみ。bucket public list 禁止 | Phase 5/9 |
| AC-6 | upload は admin 限定 endpoint で MIME/サイズ検証 + audit `admin.member.photo_uploaded` / 削除時 `admin.member.photo_deleted` | Phase 4/5/6 |
| AC-7 | `apps/web` から R2/D1 直接アクセスが無い（全て `apps/api` 経由） | Phase 9 grep gate |

## 成果物インベントリ（artifact 命名 canonical — Phase 12 drift 防止）

### 新規作成

| パス | 種別 |
|------|------|
| `apps/api/migrations/0022_member_photos.sql` | D1 migration |
| `apps/api/src/lib/r2/member-photo-presign.ts` | R2 presign util |
| `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` | unit test |
| `apps/api/src/repository/memberPhotos.ts` | D1 repository |
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | route contract test |
| `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | avatar render test |
| `apps/web/tests/e2e/admin-member-photo-avatar.spec.ts` | Playwright visual（配置は既存 e2e 慣習に合わせる） |

### 編集

| パス | 変更概要 |
|------|---------|
| `apps/api/src/env.ts` | `MEMBER_PHOTOS?: R2Bucket` + presign 用 secret 宣言 |
| `apps/api/wrangler.toml` | staging/production `[[env.*.r2_buckets]]` binding `MEMBER_PHOTOS` |
| `apps/api/src/routes/admin/members.ts` | POST/DELETE photo route + detail に photoUrl 同梱 |
| `apps/api/src/repository/_shared/builder.ts` | `buildAdminMemberDetailView` に photoUrl 解決 hook（presign 呼び出し or 上位注入） |
| `packages/shared/src/zod/viewmodel.ts` | `AdminMemberDetailViewZ` に `photoUrl` 追加 |
| `packages/shared/src/types/viewmodel/index.ts` | `AdminMemberDetailView` interface に `photoUrl?` |
| `apps/web/src/components/ui/Avatar.tsx` | `src?: string` 対応（`<img>` + onError fallback） |
| `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `photoUrl?` prop → 二段 render |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | upload/delete affordance（`useAdminMutation`） |
| `docs/00-getting-started-manual/specs/08-free-database.md`（or 新規 `specs/15-member-photo-storage.md`） | storage contract |

## carry-over 確認

- `git log --oneline -5`: 直近は admin fetch service-binding 系（#1003/#1001/#999）。photo 関連の先行成果物は無い。本 task は完全新規追加。
- 親 workflow 成果物（hue avatar）は本 task の fallback として再利用する（破棄しない）。

## 完了条件（Phase 1）

- [ ] scope（含む/含まない）が CONST_007 に沿って 1 サイクル完了可能な単位で固定されている
- [ ] AC-1..7 が最新コード事実（migration 0021 / `.strict()` schema / 既存 R2 binding）に整合
- [ ] artifact 命名 canonical 一覧が確定（Phase 12 で照合する）
- [ ] UI task / VISUAL_ON_EXECUTION 判定が記録されている

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Issue #983 の実装要件、スコープ、不変条件、成果物名を実装前に固定する。

## 実行タスク
- current codebase に photo 実装が無いことを確認する。
- AC-1..7 と artifact 命名を固定する。

## 参照資料
- `index.md`
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物
- Phase 1 要件定義

## 統合テスト連携
Phase 4-9 のテスト設計が本 Phase の AC-1..7 を参照する。
