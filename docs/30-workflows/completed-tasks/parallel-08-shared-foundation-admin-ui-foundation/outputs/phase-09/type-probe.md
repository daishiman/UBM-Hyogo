# Phase 9 — serial-05/step-01 連携 type-only 先行検証

## 目的

serial-05/step-01 が `import { useAdminMutation } from "@/features/admin/hooks"` を type-only で resolve できることを `tsc --noEmit` で先行検証する。

## 確認方法

probe ファイルを実装下に常設するのではなく、本 Phase の検証は contract test (`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`) の以下 import で代替する:

```ts
import {
  useAdminMutation,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "../useAdminMutation";
```

加えて barrel re-export (`../index`) も `await import("../index")` で dynamic resolve 済 (test ケース 3)。

## 結果

- `mise exec -- pnpm tsc --noEmit` exit 0
- contract test 3 / 3 passed
- barrel `@/features/admin/hooks` から `useAdminMutation` / `AdminMutationOptions` / `AdminMutationResult` の 3 export を解決可能

## 結論

serial-05/step-01 が type-only で先行 import 可能。実装本体投入時に API surface 破壊なし。
