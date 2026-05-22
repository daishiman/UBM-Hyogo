# Phase 9: regression / grep gate

## HEX 直書き禁止 grep

```bash
grep -nE "#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#|border-\[#" \
  apps/web/app/profile/loading.tsx apps/web/app/profile/loading.spec.tsx \
  || echo "OK: no HEX literals"
```

期待: マッチ 0 件 / "OK: no HEX literals" 出力。`verify-design-tokens` CI gate の事前確認に相当。

## token utility のみ使用

```bash
grep -nE "bg-\[oklch|bg-\[hsl|bg-\[rgb" \
  apps/web/app/profile/loading.tsx \
  || echo "OK: no arbitrary color"
```

期待: マッチ 0 件。

## design tokens 整合性

`apps/web/src/styles/tokens.css` または `globals.css` に `--color-surface-2` / `--ubm-color-surface-bg-2` が定義済みであることを再確認。

```bash
grep -n "color-surface" apps/web/src/styles/globals.css
```

## 既存 page 不変

`apps/web/app/profile/page.tsx` / `error.tsx` / `not-found.tsx` に変更が入っていないこと:

```bash
git diff --name-only dev...HEAD -- apps/web/app/profile/ \
  | grep -vE "loading\.(tsx|spec\.tsx)$" \
  | grep -E "apps/web/app/profile/" \
  && echo "FAIL: out-of-scope diff" \
  || echo "OK: scope intact"
```

## evidence 保存

上記 3 grep 結果を `outputs/phase-11/evidence/grep-gate.log` に集約保存する。

## 完了条件

- [ ] HEX 直書き 0 件
- [ ] arbitrary color value 0 件
- [ ] scope intact （loading.{tsx,spec.tsx} 以外 0 diff）
- [ ] grep-gate.log を evidence に保存
