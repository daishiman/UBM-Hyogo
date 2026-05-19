# Phase 9: QA

## 1. 自動 QA チェックリスト

| 項目 | コマンド | 期待 |
|---|---|---|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| Lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| 単体テスト（対象） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/profile/loading.spec.tsx` | 3 tests exit 0 |
| 単体テスト（profile 配下 regression） | `mise exec -- pnpm --filter @ubm-hyogo/web test -- app/profile` | 全 PASS |
| HEX 直書き grep | `grep -nE "#[0-9a-fA-F]{3,8}\|bg-\[#\|text-\[#" apps/web/app/profile/loading.tsx` | ヒット 0 |
| `.test.tsx` 命名違反 grep | `find apps/web/app/profile -name "*.test.tsx"` | ヒット 0（不変条件 #8） |
| `data-page` 重複 grep | `grep -rn "profile-loading" apps/web` | loading.tsx と spec.tsx の自身参照のみ |

## 2. 設計 QA チェックリスト

- [x] `role="status"` + `aria-busy="true"` + `aria-live="polite"` の 3 点セットを持つ
- [x] `.sr-only` 補助テキストが存在
- [x] 全 placeholder block に `bg-surface-2` + `motion-safe:animate-pulse`
- [x] container は `mx-auto max-w-3xl px-6 py-12 space-y-6`
- [x] avatar は `h-16 w-16 rounded-full`
- [x] heading は `h-8 w-48 rounded`
- [x] KV bars は `h-6` 各幅 `w-full / w-5/6 / w-4/6 / w-3/6`

## 3. CI 連動チェック（pre-push / GitHub Actions）

| Gate | 期待 |
|---|---|
| `verify-design-tokens` | PASS（HEX 直書きなし） |
| `verify-test-suffix` | PASS（`.spec.tsx` 命名のみ） |
| `verify-indexes-up-to-date` | drift なし（本タスクは aiworkflow indexes を same-wave 更新する） |
| `coverage-guard` (`--changed`) | 閾値低下なし |

## 4. 既存 a11y 標準との一致

i05 (LoginLoading) と i07 (ProfileLoading) で同一 a11y pattern が適用されていることを Phase 11 後に grep で確認:

```bash
grep -B1 -A3 'role="status"' apps/web/app/login/loading.tsx apps/web/app/profile/loading.tsx
```

両方が同等の属性セットを持つことを目視確認する。
