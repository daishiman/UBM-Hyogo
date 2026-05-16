# Phase 4: テスト作成（vitest spec / Red 段階）

## メタ情報

- **ワークフロー**: serial-05-step-02-identity-conflicts-merge
- **Phase**: 4 / 13
- **実装区分**: 実装仕様書
- **直列順序**: 2/5 (前提: step-01 `useAdminMutation` hook)
- **作成日**: 2026-05-16
- **CONST_007**: TODO marker 残留禁止。Red は実 assertion の失敗で表現する。

## 目的

既存 `IdentityConflictRow` の hardening に対する focused unit spec を Red 段階で用意する。
旧分割 component spec は作らない。

## 実行タスク

- タスク1: `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` を作成または更新する
- タスク2: `useAdminMutation` を mock し、merge / dismiss の payload と loading / error 表示を assertion する
- タスク3: `it.todo` / `test.todo` / `expect(true).toBe(false)` を使わず、実 assertion で Red を確認する
- タスク4: `outputs/phase-04/test-matrix.md` に TC 番号と assertion を記録する

## 参照資料

- `apps/web/src/components/admin/IdentityConflictRow.tsx`
- `apps/web/src/features/admin/hooks/useAdminMutation.ts`
- `packages/shared/src/schemas/identity-conflict.ts`
- `apps/api/src/routes/admin/identity-conflicts.ts`

## テストマトリクス

| TC 番号 | assertion | 対象 |
| --- | --- | --- |
| TC-R-01 | conflict id / source / target / masked email を表示 | `IdentityConflictRow` |
| TC-R-02 | merge button click で `merge-confirm` を表示 | `IdentityConflictRow` |
| TC-R-03 | 次へ click で `merge-final` と reason textarea を表示 | `IdentityConflictRow` |
| TC-R-04 | reason 空では merge 実行 disabled | `IdentityConflictRow` |
| TC-R-05 | merge 実行で `{ targetMemberId: candidateTargetMemberId, reason }` を `trigger` | `IdentityConflictRow` |
| TC-R-06 | 409 / 400 で stage 維持、reason 保持、error 表示 | `IdentityConflictRow` |
| TC-R-07 | dismiss で `{ reason }` を dismiss trigger | `IdentityConflictRow` |

## 実行手順

```bash
rg -n "useAdminMutation|callJson|candidateTargetMemberId" apps/web/src/components/admin/IdentityConflictRow.tsx
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx
```

## 成果物

- `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
- `outputs/phase-04/test-matrix.md`
- `outputs/phase-04/red-run.log`

## 完了条件

- [ ] focused spec が物理的に存在する
- [ ] TC-R-01..07 が実 assertion として存在する
- [ ] Red 実行ログに対象 assertion の fail が記録されている
- [ ] TODO marker が 0 件
- [ ] `*.test.tsx` 拡張子を使っていない

## タスク100%実行確認【必須】

- [ ] `rg -n "it\\.todo|test\\.todo|expect\\(true\\)\\.toBe\\(false\\)" apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` が 0 件
- [ ] `pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx` の Red ログを `outputs/phase-04/red-run.log` に保存
- [ ] CONST_007: テストケース列挙の先送りなし

## 次 Phase

Phase 5: 既存 `IdentityConflictRow` hardening で Red → Green 化する。
