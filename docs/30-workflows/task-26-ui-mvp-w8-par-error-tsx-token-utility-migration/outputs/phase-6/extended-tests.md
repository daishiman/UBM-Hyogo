# Phase 6 — テスト拡充

## 追加検証

### TC-EXT-01: 全 app 直下 boundary の arbitrary value 0 件

```bash
grep -rnE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/src/app/error.tsx apps/web/src/app/global-error.tsx apps/web/src/app/not-found.tsx apps/web/src/app/loading.tsx 2>/dev/null | wc -l
# expected: 0
```

### TC-EXT-02: 未定義 token 参照 0 件

```bash
grep -rnE 'ubm-color-fg-muted' apps/web/src/app/ 2>/dev/null | wc -l
# expected: 0
```

### TC-EXT-03: 副次対象テストファイルの存在確認

`apps/web/src/app/__tests__/error.spec.tsx` が存在する場合、render 後の DOM に対する className assertion を追加する（task-05 で既存テストがあればそれを活用）。

### TC-EXT-04: Tailwind v4 build の class 解決確認

`apps/web/.next` または OpenNext build artifact 内に該当 utility（`text-text-3` 等）の生成された CSS が存在することを smoke check。

### TC-EXT-05: theme switch invariant（warm / cool）

token bridge を介しているため `data-theme="warm"` / `data-theme="cool"` でも同じ utility が解決される。visual baseline でテーマ別 screenshot がある場合は同一性確認。

## 回帰 guard

- grep gate を pre-commit（lefthook）の対象に登録する案 → task-18 verify-design-tokens で代替可能なので scope out
