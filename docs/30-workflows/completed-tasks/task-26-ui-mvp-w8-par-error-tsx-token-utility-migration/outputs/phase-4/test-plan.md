# Phase 4 — テスト作成

`implementation_mode: "verify_existing"` のため、TDD RED の代わりに **diff check + grep gate + regression check** を targeted test として設計する。

## テストスイート

### TS-01: grep gate（再発防止）

```bash
# 対象ファイルに arbitrary value が残っていないこと
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/app/error.tsx
# expected: exit 1（マッチなし）
```

副次対象 grep:

```bash
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/app/global-error.tsx 2>/dev/null
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/app/not-found.tsx 2>/dev/null
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/app/loading.tsx 2>/dev/null
# expected: 各々 exit 1（マッチなし）— 対象ファイル不在は許容
```

### TS-02: fg-muted 参照 0 件

```bash
grep -n 'ubm-color-fg-muted' apps/web/app/error.tsx
# expected: exit 1（マッチなし）
```

### TS-03: utility 適用確認（snapshot/structure test）

`apps/web/app/__tests__/error.component.spec.tsx` で:

- `error.tsx` / `not-found.tsx` / `loading.tsx` render 結果に `text-danger` / `text-text-3` / `bg-surface-2` / `bg-accent` / `text-panel` / `border-border` が含まれることを assertion
- `--ubm-color-fg-muted` literal が render output に含まれないこと

### TS-04: typecheck / lint

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
# expected: completed
```

### TS-05: verify-design-tokens

```bash
pnpm --filter @ubm-hyogo/web verify-design-tokens
# expected: completed
```

### TS-06: visual baseline regression（task-18 playwright-smoke / visual）

```bash
pnpm --filter @ubm-hyogo/web exec playwright test --grep "@visual"
# expected: runtime_pending（downstream broad visual gate）
```

## 期待結果サマリ

| Test | 期待 |
|------|------|
| TS-01 | 0 件 |
| TS-02 | 0 件 |
| TS-03 | completed |
| TS-04 | completed |
| TS-05 | completed |
| TS-06 | runtime_pending（downstream） |
