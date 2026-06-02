# Phase 1: 要件定義

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト）。本 Phase は要件・スコープ・命名規約・受入条件を固定する。

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / implementation_mode: `new` / visualEvidence: `VISUAL_ON_EXECUTION`
- GitHub Issue: #1029（**CLOSED** のまま仕様作成 / reopen しない / mutation 無し）

## 目的

Issue #1029（public member photo display）の実装要件・スコープ・不変条件・成果物名を、最新コード事実（#983 で landed した `member_photos` / `presignMemberPhotoGetUrl` / `Avatar src?`）に整合させて実装前に固定する。

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | **No**（public 側 photoUrl は schema/route/UI のいずれにも無し） | 通常の新規実装 Phase（`implementation_mode: "new"`） |
| upstream（dev/main）にマージ済み | **No**（`git log --grep=1029` = 0 件） | 未マージとして扱う |
| 前提タスク（依存）完了済み | #983（admin photo + R2 storage）は **completed**（commit `ae773ba38` / migration `0022_member_photos.sql`） | 依存解消不要。本 task は #983 資産の public 拡張 |

## タスク分類

- **UI task**（公開 avatar の写真 render を含むため VISUAL）。`visualEvidence: VISUAL_ON_EXECUTION`。
- docs-only ではない（shared schema / API route / use-case / view-model / web UI のコード変更が必須）。CONST_004 のデフォルト＝実装仕様書。

## 既存コード命名規約（Phase 4 TDD 前に整合確認する基準）

| 領域 | 規約 | 実例 |
|------|------|------|
| apps/api route file | kebab-case `.ts`、Hono app export | `routes/public/members.ts` / `routes/public/member-profile.ts` |
| apps/api use-case | camelCase `xxxUseCase` | `listPublicMembersUseCase` / `getPublicMemberProfileUseCase` |
| apps/api repository | camelCase 関数、`repository/` 配下 | `getMemberPhoto` / `listPublicMembers` |
| apps/api view-model | `toXxxView` + `XxxSource` interface | `toPublicMemberListView` / `PublicMemberListItemSource` |
| shared zod | PascalCase + `Z` suffix | `PublicMemberListItemZ` / `PublicMemberProfileZ` |
| shared type | PascalCase interface | `PublicMemberListItem` / `PublicMemberProfile` |
| web component | PascalCase `.tsx` | `MemberCard` / `ProfileHero` / `Avatar` / `MemberDetail` |
| web adapter | `toXxxProps` camelCase | `toMemberDetailProps` |
| test file | `*.spec.{ts,tsx}`（invariant #8。`*.test.*` 禁止） | `list-public-members.spec.ts` / `MemberCard.spec.tsx` |

## 受入条件（index.md §2 を Phase 検証にマップ）

| ID | 受入条件 | 検証 Phase |
|----|---------|-----------|
| AC-1 | 写真公開ポリシーが specs に明文化（gate / TTL 300s / R2 read タイミング / Cache-Control） | Phase 12 |
| AC-2 | `PublicMemberListItemZ` / `PublicMemberProfileZ` に `photoUrl?` 追加で既存 parse 不変（`.strict()` 維持） | Phase 4/5 |
| AC-3 | public list API は公開 gate 通過 かつ 写真登録済み member のみ presigned `photoUrl` 返却 | Phase 4/5/6 |
| AC-4 | public profile API も同 gate で `photoUrl` 返却。非公開・写真未登録は省略 | Phase 4/5/6 |
| AC-5 | photoUrl 未取得 member の avatar は現行 hue placeholder と pixel diff ゼロ | Phase 11 |
| AC-6 | public route に R2 bucket 名・object key・admin audit data が露出しない（presigned URL 文字列のみ） | Phase 5/9 |
| AC-7 | `apps/web` から R2/D1 直接アクセス無し（presign は apps/api route 層・invariant #5） | Phase 9 grep gate |
| AC-8 | list は `listMemberPhotosByIds` で 1 query batch（N+1 無し）。secret 未設定／presign 失敗は fail-soft（200 維持） | Phase 4/5/6 |

## 成果物インベントリ（artifact 命名 canonical — Phase 12 drift 防止）

### 新規作成

| パス | 種別 |
|------|------|
| `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` | 写真公開ポリシー ADR（specs 連番。既存最大 = `15-infrastructure-runbook.md`） |
| `apps/api/src/repository/__tests__/member-photos.batch.spec.ts` | `listMemberPhotosByIds` unit test |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | photoUrl → Avatar src render test |
| `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx` | photoUrl → Avatar src render test |

### 編集

| パス | 変更概要 |
|------|---------|
| `packages/shared/src/zod/viewmodel.ts` | `PublicMemberListItemZ` / `PublicMemberProfileZ` に `photoUrl: z.string().url().optional()` 追加（`.strict()` 維持） |
| `packages/shared/src/types/viewmodel/index.ts` | `PublicMemberListItem` / `PublicMemberProfile` に `photoUrl?: string` 追加 |
| `apps/api/src/repository/memberPhotos.ts` | `listMemberPhotosByIds(c, memberIds): Promise<Map<string,string>>` batch helper 追加 |
| `apps/api/src/routes/public/members.ts` | `MembersEnv` に R2 env 追加 + route 層で batch presign resolver 構築・use-case へ DI |
| `apps/api/src/routes/public/member-profile.ts` | `MemberProfileEnv` に R2 env 追加 + 単一 presign resolver を use-case へ DI |
| `apps/api/src/use-cases/public/list-public-members.ts` | deps に `resolvePhotoUrls?` 追加し item source に `photoUrl` 注入 |
| `apps/api/src/use-cases/public/get-public-member-profile.ts` | deps に `resolvePhotoUrl?` 追加し profile source に `photoUrl` 注入 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | `PublicMemberListItemSource` + parse 経路に `photoUrl?` を通す |
| `apps/api/src/view-models/public/public-member-profile-view.ts` | `ProfileSource` + parse 経路に `photoUrl?` を通す |
| `apps/web/src/components/public/MemberCard.tsx` | `<Avatar ... src={member.photoUrl} />`（list/comfy/dense 全 density） |
| `apps/web/src/components/public/ProfileHero.tsx` | props に `photoUrl?: string` 追加 → `<Avatar ... src={props.photoUrl} />` |
| `apps/web/src/components/public/MemberDetail.tsx` | `photoUrl` を ProfileHero へ pass through |
| `apps/web/src/lib/adapters/member-detail.ts` | `MemberDetailProps` に `photoUrl?: string` + `toMemberDetailProps` で写し取り |

> `apps/web/app/(public)/members/page.tsx` と `[id]/page.tsx` は schema/adapter 経由で photoUrl が流れるため、追加変更は最小（page 側は MemberDetail/MemberGrid に既存 props を渡すのみ。adapter が photoUrl を含めれば自動伝播）。

## 既存資産の再利用（#983 から）

| 資産 | パス | 再利用方法 |
|------|------|-----------|
| presign helper | `apps/api/src/lib/r2/member-photo-presign.ts` | `presignMemberPhotoGetUrl(deps, objectKey, ttl)` をそのまま呼ぶ（純粋関数・fail-soft） |
| TTL 定数 | 同 `MEMBER_PHOTO_PRESIGN_TTL_SECONDS`（300） | public でも同値を使用 |
| object key 規約 | 同 `MEMBER_PHOTO_OBJECT_KEY` / `member_photos.object_key` | DB row の `object_key` を presign に渡す |
| photo 取得 | `apps/api/src/repository/memberPhotos.ts` `getMemberPhoto` | profile は単体取得、list は新規 `listMemberPhotosByIds` |
| Avatar render | `apps/web/src/components/ui/Avatar.tsx` `src?` + `onError` fallback | UI は `src` を渡すだけ（fallback 実装済み・新規 primitive 不要） |
| R2 env / bucket 名解決 | `apps/api/src/routes/admin/members.ts` `resolvePhotoUrl`（L289-318） | public route 用に同等の resolver を構築（bucket 名: `ubm-hyogo-member-photos-{prod,staging}`） |

## carry-over 確認

- `git log --oneline -5`: 直近は #998 / #991 / #987 / #1049 系。photo 関連の先行成果物は #983（landed）のみ。本 task は #983 を public へ拡張する完全新規追加。
- 親 workflow 成果物（hue avatar placeholder）は本 task の fallback として再利用する（破棄しない）。

## 実行タスク

- public 側に photo 実装が無いことを確認する（§0 ベースライン済み）。
- AC-1..8 と artifact 命名 canonical を固定する。
- 写真公開 gate の確定方針（既存 consent+publish_state / D1 schema 不変）を記録する。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | public member API contract |
| security | `.claude/skills/aiworkflow-requirements/references/security-api.md` / `.claude/skills/aiworkflow-requirements/references/security-principles.md` | PII / consent 境界 |
| database | `.claude/skills/aiworkflow-requirements/references/database-*.md` | member_status / member_photos |

- `index.md`（§0 ベースライン / §1 スコープ / §2 AC）
- `docs/30-workflows/issue-983-member-photo-avatar-r2-storage/`（upstream 実装事実）
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物

- Phase 1 要件定義（本ファイル）
- `outputs/phase-1/spec-extraction-map.md`（system spec ↔ current code anchor の 1:1 対応）

## 完了条件

- [ ] scope（含む/含まない）が CONST_007 に沿って 1 サイクル完了可能な単位で固定されている
- [ ] AC-1..8 が最新コード事実（`member_photos` / `presignMemberPhotoGetUrl` / `.strict()` schema / `Avatar src?`）に整合
- [ ] artifact 命名 canonical 一覧が確定（Phase 12 で照合する）
- [ ] UI task / VISUAL_ON_EXECUTION 判定が記録されている
- [ ] 写真公開 gate の確定方針（D1 schema 不変・consent カラム追加なし）が記録されている

## 統合テスト連携

Phase 4-9 のテスト設計が本 Phase の AC-1..8 と命名規約を参照する。Phase 11 visual evidence が AC-3/4/5 を検証する。
