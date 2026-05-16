# Phase 5: 実装（既存 IdentityConflictRow hardening / Green 段階）

## メタ情報

- **ワークフロー**: serial-05-step-02-identity-conflicts-merge
- **Phase**: 5 / 13
- **実装区分**: 実装仕様書
- **前提 Phase**: Phase 4（focused spec Red）
- **作成日**: 2026-05-16
- **CONST_007**: 先送り禁止（既存 row hardening と focused spec green まで本 Phase 内で完了）

## 目的

既存 `IdentityConflictRow.tsx` を最小変更で hardening し、`callJson()` による重複 fetch 実装を
`useAdminMutation` へ統合する。`page.tsx` は server component のまま維持し、新規 `_components/`
は作らない。

## 実行タスク

- タスク1: `IdentityConflictRow.tsx` の `callJson()` を撤去する
- タスク2: `useAdminMutation<MergeIdentityResponse>` / `useAdminMutation<DismissIdentityConflictResponse>` を import する
- タスク3: merge body を `{ targetMemberId: item.candidateTargetMemberId, reason: reason.trim() }` に固定する
- タスク4: 400 / 409 error mapping を画面内 error と toast の両方で確認できるようにする
- タスク5: focused unit test を green にする
- タスク6: `page.tsx` に D1 直接アクセス・client 化・追加 fetch が無いことを確認する

## 実装契約

```typescript
import type {
  DismissIdentityConflictResponse,
  MergeIdentityResponse,
} from "@ubm-hyogo/shared";
import { useAdminMutation } from "../../features/admin/hooks";

const mergeMutation = useAdminMutation<MergeIdentityResponse>(
  `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/merge`,
  "POST",
  { successMessage: "✓ 統合しました" },
);

await mergeMutation.trigger({
  targetMemberId: item.candidateTargetMemberId,
  reason: reason.trim(),
});
```

`targetMemberId` は `conflictId` から派生させない。API handler は
`targetMemberId !== parseConflictId(id).target` を 400 `TARGET_MEMBER_MISMATCH` とするため、
`item.candidateTargetMemberId` が唯一の正しい入力源である。

## 実行手順

```bash
# 1. 実装前 inventory
rg -n "callJson|useAdminMutation|candidateTargetMemberId|TARGET_MEMBER_MISMATCH|ALREADY_MERGED" \
  apps/web/src/components/admin/IdentityConflictRow.tsx \
  apps/api/src/routes/admin/identity-conflicts.ts \
  packages/shared/src/schemas/identity-conflict.ts

# 2. focused test
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx

# 3. type / lint
pnpm typecheck
pnpm lint

# 4. token gate
pnpm verify:tokens
```

## 成果物

- `apps/web/src/components/admin/IdentityConflictRow.tsx`
- `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
- `outputs/phase-05/implementation-log.md`

## 完了条件

- [ ] `callJson()` が `IdentityConflictRow.tsx` から消えている
- [ ] `useAdminMutation` API surface が `trigger` / `isLoading` / `error` で統一されている
- [ ] merge body が `{ targetMemberId: item.candidateTargetMemberId, reason: reason.trim() }` のみ
- [ ] 400 / 409 で UI が閉じず、reason が保持される
- [ ] focused unit test green
- [ ] `page.tsx` は server component 維持、D1 直接アクセスなし

## タスク100%実行確認【必須】

- [ ] 実行タスク 1〜6 完了
- [ ] `outputs/phase-05/implementation-log.md` に変更ファイル / コマンド / exit code を記録
- [ ] CONST_007: 「Phase 6 で adapter 追加」などの残課題を残していない

## 次 Phase

Phase 6: 品質ゲート（typecheck / lint / coverage / token gate）へ進む。
