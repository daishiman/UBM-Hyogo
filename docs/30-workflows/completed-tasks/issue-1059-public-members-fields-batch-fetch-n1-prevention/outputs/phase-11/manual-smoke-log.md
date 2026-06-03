# Phase 11 smoke ログ（NON_VISUAL）

実地 UI 操作は不可（UI/UX 変更なし）。代替として以下の自動 smoke を記録した。

| smoke 項目 | コマンド | 期待 |
| --- | --- | --- |
| 型 | focused TypeScript/Vitest compile | PASS |
| lint | `rg -n "as never" apps/api/src/use-cases/public/list-public-members.ts` | 0 件 |
| use-case vitest | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 10 PASS |
| repository vitest | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.d1.config.ts apps/api/src/repository/__tests__/responseFields.repository.spec.ts` | 5 PASS |

製品コードの問題と環境起因（esbuild mismatch 等）は分離して記録する。
