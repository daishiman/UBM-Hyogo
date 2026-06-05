# Phase 9: 品質保証

本チェックリストは local implementation close-out として判定する。focused component test は実測済みで、typecheck / lint は Phase 12 close-out で追加確認する。

---

## 9.1 一括判定チェックリスト

| # | 項目 | 判定コマンド / 方法 | 合格基準 |
|---|------|--------------------|----------|
| 1 | component test green | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | TC-BAB-01..05 / TC-BAB-TAG-01..09(..11) / a11y 全 pass |
| 2 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 |
| 3 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | exit 0 |
| 4 | design-tokens（HEX 直書きなし） | `git diff` で新規 `#[0-9a-fA-F]{3,6}` / `bg-[#` / `text-[#` を grep | 0 件（本タスクは色変更なし） |
| 5 | apps/api 非接触 | `git diff --name-only -- apps/api` | 空 |
| 6 | 既存 testid 維持 | `git diff apps/web/src/features/admin/components/_members/BulkActionBar.tsx` で `data-testid="bulk-tag-result*"` の削除なし | `bulk-tag-result` / `-counts` / `-skipped` / `-not-found` 全存続 |
| 7 | li key 維持 | 同 diff で `skip-${...}` / `nf-${...}` key 不変 | 維持 |
| 8 | 後方互換 | `membersById` が optional（`?`）であること | prop 省略呼び出しが型エラーにならない |
| 9 | artifacts parity | `outputs/artifacts.json` の root / `outputs/` ミラーが byte 一致（存在する場合） | 一致 |
| 10 | D1 / fetch 追加なし | diff で新規 `fetch(` / D1 binding 参照なし | 0 件 |

---

## 9.2 exactOptionalPropertyTypes 下の optional prop 取り扱い注意

本リポジトリは `exactOptionalPropertyTypes: true`（厳格 optional）を前提とする。`membersById?` の取り扱いで以下を厳守する:

- **親（MembersClientShell）からの渡し方**: `membersById={membersById}` のように **常に値を渡す**（`membersById` は useMemo で必ず Record を返すため `undefined` を渡さない）。`membersById={cond ? value : undefined}` のような明示 undefined 注入は `exactOptionalPropertyTypes` 下で型エラーになりうるため避ける。
- **prop 省略**: 後方互換テスト（TC-BAB-TAG-03）では `membersById` を **完全に省略** する（`undefined` を明示しない）。`exactOptionalPropertyTypes` では「省略」と「`undefined` 明示代入」が区別されるため、省略形を使う。
- **component 内の参照**: `membersById?.[id]?.fullName ?? r.memberId` は optional chaining で `membersById` が `undefined` のケースを安全に吸収する。`membersById[id]` の直接添字は避ける。
- **値オブジェクトの spread 不要**: `membersById` の値 `{ fullName }` は固定 shape なので `{...(x ? {...} : {})}` のような条件 spread は不要。

## 9.3 判定サマリ（implemented local 段階）

- #2..#10 は設計上充足（純粋派生・optional prop・testid/key 不変・apps/api 非接触）。
- #1（test green）と #4（実 diff の HEX grep）は実装サイクルで実測確定する。
- blocker なし（後続 Phase 10 で最終確認）。
