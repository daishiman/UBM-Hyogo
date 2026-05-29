# Phase 9 — QA

## 1. 品質保証 gate（ローカル実行）

| # | コマンド | 期待 |
|---|---------|------|
| 1 | `mise exec -- pnpm typecheck` | exit 0 |
| 2 | `mise exec -- pnpm lint` | exit 0 |
| 3 | `mise exec -- pnpm exec vitest run apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 9 tests passed |
| 4 | `rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/layout/MemberHeader.tsx` | 0 件 |
| 5 | `rg -n "data-testid=\"member-header\"" apps/web/src/components/layout/MemberHeader.tsx` | 1 件以上 |
| 6 | `rg -n "data-role=\"admin-cta\"" apps/web/src/components/layout/MemberHeader.tsx` | 1 件 |
| 7 | `rg -n "await getAuthView" apps/web/app/\(member\)/layout.tsx` | 1 件 |
| 8 | `rg -n "export .*AuthView|export .*getAuthView|export .*resolveAuthView" apps/web/src/lib/auth-view` | 3 件以上 |

## 2. 受け入れ基準（AC）逆引き

| AC | 検証手段 |
|----|---------|
| AC-E1 | TC-1 |
| AC-E2 | TC-2 |
| AC-E3 | TC-3 |
| AC-E4 | TC-4 |
| AC-E5 | TC-5 |
| AC-E6 | gate #7 + layout コード目視 |
| AC-E7 | layout コード目視（既存 data-* 維持） |
| AC-E8 | focused Vitest `resolveAuthView.spec.ts` |

## 3. 既存契約の regression 防止

- 親 workflow の Task G（横断 e2e）で 3 状態 × `/profile` の `data-auth-state` が検証される前提を破壊しない
- `SignOutButton` の `data-testid` 既存契約を変更しない

## 4. ブロッカー判定

- `auth-view` 未公開 → 本 cycle で最小実装済み
- typecheck / lint / vitest いずれか fail → Phase 5 に戻り修正

## 5. QA 完了条件

- [x] gate #1〜#8 全 pass
- [x] AC-E1〜AC-E8 全充足
- [x] index.md `## 完了条件（DoD）` 全項目クリア
