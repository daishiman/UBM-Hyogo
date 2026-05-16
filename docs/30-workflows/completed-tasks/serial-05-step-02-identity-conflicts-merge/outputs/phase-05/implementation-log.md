# Phase 5 implementation log — serial-05-step-02 identity-conflicts merge UI

## 変更ファイル

- `apps/web/src/components/admin/IdentityConflictRow.tsx`
  - 直書き `callJson()` helper / `useTransition` / `useRouter` を撤去
  - `useAdminMutation<MergeIdentityResponse>` と `useAdminMutation<DismissIdentityConflictResponse>` を import し merge / dismiss の通信を集約
  - `successMessage`: merge は `"✓ 統合しました"`、dismiss は `"✓ 別人として確定しました"`
  - `onSuccess` で stage を `idle` に戻し、対応する reason を空に reset
  - merge / dismiss それぞれ独立した `mergeReason` / `dismissReason` を保持し、エラー時にも入力が消えない
  - エラー表示は `mutation.error?.message` を `role="alert"` + `aria-live="polite"` で render し、textarea に `aria-invalid` / `aria-describedby` を付与
  - merge body: `{ targetMemberId: item.candidateTargetMemberId, reason: mergeReason.trim() }`
- `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
  - `useAdminMutation` を `vi.mock` で stub し、endpoint 別に `trigger` / `isLoading` / `error` を制御する pattern を採用
  - happy path / 400 / 409 / dismiss happy / dismiss 409 / cancel reset / a11y inline alert を網羅（9 ケース）

## 実行コマンドと結果

```bash
ESBUILD_BINARY_PATH=$(pwd)/node_modules/@esbuild/darwin-arm64/bin/esbuild \
  pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx
# → Test Files 1 passed (1) / Tests 9 passed (9)

pnpm typecheck         # → all 6 projects pass
pnpm lint              # → all 6 projects pass (eslint / tsc / dependency-cruiser / stablekey)
pnpm verify:tokens     # → ✓ design tokens in sync (88 tracked)
```

## 完了条件 self-check

- [x] `callJson()` 撤去済
- [x] `useAdminMutation` API surface (`trigger` / `isLoading` / `error`) に統一
- [x] merge body が `{ targetMemberId, reason }` のみ
- [x] 400 / 409 で inline panel 閉じず、reason 保持
- [x] focused unit test 9/9 green
- [x] `page.tsx` は server component のまま、D1 直接アクセス追加なし
