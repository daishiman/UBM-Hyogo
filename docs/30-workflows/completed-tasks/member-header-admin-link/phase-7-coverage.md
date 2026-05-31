# Phase 7 — Coverage

## 1. 対象ファイル別 coverage 目標

| ファイル | branch | line | 備考 |
|---------|--------|------|------|
| `apps/web/src/components/layout/MemberHeader.tsx` | 100% | 100% | 関数本体は純関数 + condition 1 branch のみ。TC-1/2 (`isAdmin=false`) と TC-3 (`isAdmin=true`) で両 branch 通過 |
| `apps/web/app/(member)/layout.tsx` | N/A | N/A | async server layout は unit test 対象外。e2e（親 Task G）で実行時検証 |

## 2. coverage 取得コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  src/components/layout/__tests__/MemberHeader.spec.tsx
```

出力先: `apps/web/coverage/` 配下。`coverage-summary.json` の `MemberHeader.tsx` 行を確認。

## 3. coverage gate

- 親リポジトリの coverage gate 既定値（lines ≥ 80%）に従う
- 本コンポーネントは新規 props 追加 + 1 branch のため、TC-1〜3 で 100% 達成可能

## 4. fallback

vitest coverage が collect 不能な場合（`v8` 互換問題等）は、`MemberHeader.tsx` の `isAdmin` branch を `rg -n "isAdmin" apps/web/src/components/layout/MemberHeader.tsx` で 2 箇所参照（定義 + 使用）を確認することで間接的に branch 網羅を担保する。
