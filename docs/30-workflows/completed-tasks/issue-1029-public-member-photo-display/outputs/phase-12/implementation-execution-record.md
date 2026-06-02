# Implementation Execution Record — issue-1029 public member photo display

> 実コード実装サイクルの実行記録（2026-06-01）。spec_created → implemented_local_runtime_pending。
> commit / PR / staging deploy / 実 R2 presigned URL screenshot は user-gated（未実施）。local Playwright screenshot は実施済み。

## 実装した実コード差分（apps/ packages/）

### shared（contract）
- `packages/shared/src/zod/viewmodel.ts`: `PublicMemberListItemZ` / `PublicMemberProfileZ` に `photoUrl: z.string().url().optional()` を追加（`.strict()` 維持）。
- `packages/shared/src/types/viewmodel/index.ts`: `PublicMemberListItem` / `PublicMemberProfile` に `photoUrl?: string` 追加。

### apps/api
- `apps/api/src/repository/memberPhotos.ts`: `listMemberPhotosByIds(c, memberIds): Promise<Map<string,string>>` batch helper を追加（空配列は SQL 非発行 / `results ?? []` ガード）。
- `apps/api/src/use-cases/public/list-public-members.ts`: deps に `resolvePhotoUrls?` を追加。抽出 memberId 群で 1 回だけ batch 解決し item source に `photoUrl` 注入（N+1 防止 / 未注入時は後方互換）。
- `apps/api/src/use-cases/public/get-public-member-profile.ts`: deps に `resolvePhotoUrl?` を追加。**公開 gate 通過後にのみ** resolver を呼び profile source に `photoUrl` 注入（gate 不通過 member の写真漏れ防止）。
- `apps/api/src/view-models/public/public-member-list-view.ts` / `public-member-profile-view.ts`: source interface に `photoUrl?` を追加し parse 経路へ通す（view-model は R2 非依存維持）。
- `apps/api/src/routes/public/members.ts`: `MembersEnv` に R2 env 追加 + batch presign resolver を構築して use-case へ DI（secret 未設定 / bucket 未配線 / presign 失敗は fail-soft）。
- `apps/api/src/routes/public/member-profile.ts`: `MemberProfileEnv` に R2 env 追加 + 単一 presign resolver を構築して use-case へ DI。

### apps/web
- `apps/web/src/components/public/MemberCard.tsx`: 全 density の `<Avatar>` に `src={member.photoUrl}` を配線。
- `apps/web/src/components/public/ProfileHero.tsx`: props に `photoUrl?` 追加 → `<Avatar src>`。
- `apps/web/src/components/public/MemberDetail.tsx`: `photoUrl` を ProfileHero へ pass through。
- `apps/web/src/lib/adapters/member-detail.ts`: `MemberDetailProps` に `photoUrl?` 追加・`toMemberDetailProps` で API 正本から写し取り。`[id]/page.tsx` は `PublicMemberProfileWithUnknownKindZ`（PublicMemberProfileZ 派生）で自動伝播のため追加変更なし。

## テスト（lane A–F）

| lane | ファイル | ケース | 結果 |
|------|---------|--------|------|
| A | `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts`（追記） | A-1..A-7 | PASS（shared 全 250 pass） |
| B | `apps/api/src/repository/__tests__/member-photos.batch.spec.ts`（新規） | B-1..B-5 | PASS |
| C | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（追記） | C-1..C-5 | PASS |
| D | `apps/api/src/use-cases/public/__tests__/get-public-member-profile.spec.ts`（追記） | D-1..D-4 | PASS |
| E | `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`（追記） | E-1..E-4 | PASS |
| F | `apps/web/src/components/public/__tests__/ProfileHero.component.spec.tsx`（追記） | F-1/F-2 | PASS |
| G | `apps/web/playwright/tests/issue-1029-public-member-photo-display.spec.ts`（新規） | list/detail/mobile screenshot | PASS |

- lane B/C/D 個別実行: `3 passed / 24 tests`。lane E/F: `2 passed / 11 tests`。
- 構造防衛回帰: `adminNotes.repository.spec.ts` の `PublicMemberProfile` キー集合 Exclude に公開安全 field `photoUrl` を追加（adminNotes 混入禁止の意図は維持）。

## DoD ゲート

- `mise exec -- pnpm typecheck`: **全 package Done**（`exactOptionalPropertyTypes: true` に合わせ optional は `?: T | undefined` で宣言）。
- `mise exec -- pnpm lint`: **全 package Done**。
- invariant #5 grep gate: `grep -rn "member_photos|R2_*|presignMemberPhoto|r2.cloudflarestorage" apps/web/src` = **0 hits（CLEAN）**。
- Playwright visual: `pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/issue-1029-public-member-photo-display.spec.ts` = **1 passed / 3 screenshots**。

## フルラン test の既存フレークについて

`pnpm --filter @ubm-hyogo/api test` / `@ubm-hyogo/web test` のフルランで、本実装と **disjoint な domain**（admin schema rollback/recompute, identities autolink, auditLog export, import-attendance-bulk, MemberDrawer.tags）に失敗が出るが、これらは:
- 変更を stash した状態でも、個別実行では **PASS**（schema.rollback + identities.autolink = 11 pass）。
- 変更込みでも個別実行で **PASS**（対象7ファイル = 38 pass）。

→ worktree フルラン時のテスト間分離フレーク（共有 D1 mock state / 並列順序依存）であり、本実装由来ではない。

## AC 充足

| AC | 状態 |
|----|------|
| AC-1 ポリシー明文化 | `docs/00-getting-started-manual/specs/16-member-photo-public-exposure.md` |
| AC-2 schema optional / .strict() 維持 | lane A PASS |
| AC-3 list gate+写真登録のみ photoUrl | lane C + route resolver |
| AC-4 profile 同 gate | lane D + route resolver（gate 後 resolve） |
| AC-5 写真無 avatar は hue placeholder（pixel diff ゼロ） | lane E-4/F-2 + Avatar 既存 fallback |
| AC-6 bucket/key/audit 非露出 | presigned URL 文字列のみ返却 |
| AC-7 apps/web R2/D1 直接アクセス無し | grep gate 0 hits |
| AC-8 batch 1 query / fail-soft | lane B + C-4/C-5 + route fail-soft 分岐 |

## user-gated 残作業

- commit / push / PR（base=dev）
- staging deploy（`apps/api` / `apps/web`）と R2 secrets 投入
- VISUAL_ON_EXECUTION: staging 上で実 R2 presigned URL を使う写真表示の screenshot 取得（local mock runtime の写真 img 配線 screenshot は取得済み）
