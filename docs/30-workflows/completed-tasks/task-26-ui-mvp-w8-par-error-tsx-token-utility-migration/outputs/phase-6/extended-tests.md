# Phase 6 — テスト拡充

## 追加検証

### TC-EXT-01: 全 app 直下 boundary の arbitrary value 0 件

```bash
grep -rnE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/app/error.tsx apps/web/app/global-error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx 2>/dev/null | wc -l
# expected: 0
```

### TC-EXT-02: stale runtime token 参照 0 件

```bash
grep -rnE 'ubm-color-fg-muted' apps/web/app/ 2>/dev/null | wc -l
# expected: 0
```

### TC-EXT-03: 副次対象テストファイルの存在確認

`apps/web/app/__tests__/error.component.spec.tsx` に `RouteError` / `Loading` / `NotFound` の render 後 DOM className assertion を追加する。

### TC-EXT-04: Tailwind v4 build の class 解決確認

`apps/web/.next` または OpenNext build artifact 内に該当 utility（`text-text-3` 等）の生成された CSS が存在することを smoke check。

### TC-EXT-05: theme switch invariant（warm / cool）

token bridge を介しているため `data-theme="warm"` / `data-theme="cool"` でも同じ utility が解決される。広域テーマ別 visual baseline は task-18 downstream gate で確認する。

## 回帰 guard

- grep gate を pre-commit（lefthook）の対象に登録する案 → task-18 verify-design-tokens で代替可能なので scope out
