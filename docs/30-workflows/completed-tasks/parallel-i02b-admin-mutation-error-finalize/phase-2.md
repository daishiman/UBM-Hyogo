# Phase 2: 設計（置換マッピング・実装順序）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 種別 | 設計 |
| 入力 | Phase 1 baseline 結果 |
| 出力 | 置換マッピング表、実装順序の確定 |

## 目的

12 箇所の置換を mechanical に・安全な順序で実施するためのマッピング表と適用順序を確定する。

## 置換マッピング

### `apps/web/src/features/admin/hooks/useAdminMutation.ts`

| Line | Before | After |
| --- | --- | --- |
| 28-36 | `export class AdminMutationError extends Error { ... }` ブロック全体 | 削除（前後行が直接隣接） |

### `apps/web/src/components/admin/MeetingPanel.tsx`

| Line | Before | After |
| --- | --- | --- |
| 18 | `import { AdminMutationError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` | `import { FetchAuthedError, useAdminMutation } from "../../features/admin/hooks/useAdminMutation";` |
| 54 | `if (!r.ok) throw new AdminMutationError(r.status, r.error);` | `if (!r.ok) throw new FetchAuthedError(r.status, r.error);` |
| 164 | `if (e instanceof AdminMutationError && e.status === 422) ...` | `if (e instanceof FetchAuthedError && e.status === 422) ...` |
| 165 | `else if (e instanceof AdminMutationError && e.status === 409) ...` | `else if (e instanceof FetchAuthedError && e.status === 409) ...` |

### `apps/web/src/components/admin/SchemaDiffPanel.tsx`

| Line | Before | After |
| --- | --- | --- |
| 26 | `import { AdminMutationError, ... }` | `import { FetchAuthedError, ... }` |
| 122 | `throw new AdminMutationError(r.status, message);` | `throw new FetchAuthedError(r.status, message);` |
| 203 | `if (e instanceof AdminMutationError && e.status === 422)` | `if (e instanceof FetchAuthedError && e.status === 422)` |
| 210 | `if (e instanceof AdminMutationError && e.status === 409)` | `if (e instanceof FetchAuthedError && e.status === 409)` |

### `apps/web/src/components/admin/RequestQueuePanel.tsx`

| Line | Before | After |
| --- | --- | --- |
| 11 | `import { AdminMutationError, ... }` | `import { FetchAuthedError, ... }` |
| 68 | `if (!r.ok) throw new AdminMutationError(r.status, r.error);` | `if (!r.ok) throw new FetchAuthedError(r.status, r.error);` |
| 130 | `if (e instanceof AdminMutationError && e.status === 409)` | `if (e instanceof FetchAuthedError && e.status === 409)` |

## 実装順序（厳守）

source spec §6 の順序を採用:

1. `MeetingPanel.tsx` を `FetchAuthedError` に置換
2. `SchemaDiffPanel.tsx` を `FetchAuthedError` に置換
3. `RequestQueuePanel.tsx` を `FetchAuthedError` に置換
4. `mise exec -- pnpm typecheck`（3 panel が `FetchAuthedError` re-export で通ることを確認）
5. `useAdminMutation.ts:28-36` の class 定義を削除
6. `mise exec -- pnpm typecheck`（全体）
7. `grep -rn "AdminMutationError" apps/web --include='*.ts' --include='*.tsx'` で 0 件確認

**順序を逆転させると panel が一時的に import error になる**ため、必ず panel 3 → typecheck → hook という順で実施する。

## 設計判断

- `FetchAuthedError(status, bodyText)` は `AdminMutationError(status, message)` と引数順が等価。`r.error` は `string` 非 nullable のため defensive `?? ""` は不要。
- `FetchAuthedError.message` は固定文言のため、panel の user-facing fallback は `bodyText` を参照する。
- `useAdminMutation.ts:26` の `export { FetchAuthedError }` が既存のため import path 変更は不要。

## 完了条件


- [x] Phase 2 の完了条件を満たす証跡が保存されている。
- 12 件すべてに Before / After が定義されている
- 実装順序の根拠（typecheck 中間 gate の理由）が記述されている

## 参照資料

- Phase 1 出力
- source spec §設計, §6

## 実行タスク

- Phase 2 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 2 の検証結果と関連ログ。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
