# Phase 5: 実装（GREEN）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

Phase 4 の RED を GREEN にする。新規 / 修正ファイルパスを明示し、見落としを防ぐ（FB Feedback RT-03）。

## 新規作成ファイル

| パス | 内容 |
| --- | --- |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | API contract spec |
| `apps/api/src/repository/__tests__/memberTags.repository.spec.ts` | repository spec（既存があれば追補） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberDrawer.tags.spec.tsx` | drawer 編集 spec |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` | visual baseline spec（task-C） |

## 修正ファイル

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/routes/admin/members.ts` | GET/POST/DELETE tag endpoint 3 本追記 |
| `apps/api/src/repository/memberTags.ts` | admin 付与/解除/master read 関数 + 冒頭コメント再定義 |
| `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` | allowlist に `unassignTagFromMemberByAdmin` 追加 |
| `apps/api/src/routes/admin/tags-queue.ts` | invariant #13 コメント再定義 |
| `apps/web/src/features/admin/api/members.ts` | client 3 関数 + 型 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | tag pill 編集可能化 + `ALL_TAGS` 撤去 |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | tag write endpoint + invariant #13 |

## 実装手順（直列）

### Step 1: repository（task-A）

1. `memberTags.ts` に `getTagDefinitionMaster` / `listAssignedTagsForMember` / `findTagDefinitionById` / `getMemberDeletedFlag` / `assignTagToMemberByAdmin` / `unassignTagFromMemberByAdmin` を追加。
2. `INSERT OR IGNORE` + `result.meta.changes` で state 変化を返す。
3. 冒頭コメントを「queue 専用 / admin manual 専用」へ書き分け。
4. `memberTags.readonly.test-d.ts` の allowlist 更新。
5. `memberTags.repository.spec.ts`（R-T1〜R-T7）GREEN 確認。

### Step 2: route（task-A）

1. `members.ts` に zod `assignBodySchema` を定義。
2. GET/POST/DELETE を実装。validation → member 存在/active 判定 → tag master 判定 → repository → audit（state 変化時）。
3. `members.tags.contract.spec.ts`（A-T1〜A-T11）GREEN 確認。

### Step 3: web client + drawer（task-B）

1. `features/admin/api/members.ts` に `fetchMemberTags` / `assignMemberTag` / `unassignMemberTag` 型を定義する。ただし mutation 発火は `useAdminMutation` 標準 fetch 経路を正とし、`Idempotency-Key` は hook option で付与する。
2. `MemberDrawer.tsx`: `ALL_TAGS` 撤去 → fetch `available`、`useAdminMutation` 2 本配線、pill `onClick` + pending disabled、楽観更新 + rollback。
3. `MemberDrawer.tags.spec.tsx`（B-T1〜B-T8）GREEN 確認。

### Step 4: docs + visual（task-C）

1. `tags-queue.ts` / `01-api-schema.md` の invariant #13 反映。
2. `member-drawer-tag-edit.spec.ts` 追加（baseline 取得は Phase 11 user-gated）。

## canUseTool / 副作用境界

- 本タスクに SDK callback / IPC は無し（Cloudflare Workers + Hono）。
- D1 write は `apps/api` に閉じる（invariant #1）。`apps/web` は fetch のみ。

## GREEN 確認コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- members.tags.contract
mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer.tags
mise exec -- pnpm typecheck
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- 上記新規/修正ファイルの実装（全テスト GREEN）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- Phase 4 の全 RED が GREEN
- `pnpm typecheck` green
- 修正ファイルパス一覧が実変更と一致
