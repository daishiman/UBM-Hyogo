# Phase 4 — テスト作成

`implementation_mode: "verify_existing"` のため、TDD RED の代わりに **diff check + grep gate + regression check** を targeted test として設計する。

## テストスイート

### TS-01: grep gate（再発防止）

```bash
# 対象ファイルに arbitrary value が残っていないこと
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/src/app/error.tsx
# expected: exit 1（マッチなし）
```

副次対象 grep:

```bash
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/src/app/global-error.tsx 2>/dev/null
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/src/app/not-found.tsx 2>/dev/null
grep -nE 'text-\[var\(|bg-\[var\(|border-\[var\(' apps/web/src/app/loading.tsx 2>/dev/null
# expected: 各々 exit 1（マッチなし）— 対象ファイル不在は許容
```

### TS-02: fg-muted 参照 0 件

```bash
grep -n 'ubm-color-fg-muted' apps/web/src/app/error.tsx
# expected: exit 1（マッチなし）
```

### TS-03: utility 適用確認（snapshot/structure test）

`apps/web/src/app/__tests__/error.spec.tsx`（既存テスト想定）で:

- error.tsx render 結果に `class="...text-text-3..."` または該当 utility が含まれることを assertion
- `--ubm-color-fg-muted` literal が render output に含まれないこと

### TS-04: typecheck / lint

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
# expected: PASS
```

### TS-05: build（OpenNext Workers）

```bash
pnpm --filter @ubm-hyogo/web build
# expected: PASS（Cloudflare Workers compatible bundle 生成）
```

### TS-06: task-18 CI gate（verify-design-tokens）

```bash
# task-18 で導入される verify-design-tokens の grep ルール上で error.tsx が PASS
node scripts/verify-design-tokens.js apps/web/src/app/error.tsx
# expected: PASS
```

### TS-07: visual baseline regression（task-18 playwright-smoke / visual）

```bash
pnpm --filter @ubm-hyogo/web exec playwright test --grep "@visual"
# expected: diff 0（同一 viewport / same theme）
```

## 期待結果サマリ

| Test | 期待 |
|------|------|
| TS-01 | 0 件 |
| TS-02 | 0 件 |
| TS-03 | PASS |
| TS-04 | PASS |
| TS-05 | PASS |
| TS-06 | PASS |
| TS-07 | diff 0 |
