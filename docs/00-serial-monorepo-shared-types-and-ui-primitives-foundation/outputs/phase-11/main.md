# Phase 11 成果物: 手動 smoke

## Smoke 手順と Evidence

### 1. pnpm install

```bash
$ pnpm install
# Done in 13.4s using pnpm v10.33.2
```

evidence: `outputs/phase-11/install.log`

### 2. pnpm -r typecheck

```bash
$ pnpm -r typecheck
# packages/shared typecheck: Done
# packages/integrations/google typecheck: Done
# packages/integrations typecheck: Done
# apps/web typecheck: Done
# apps/api typecheck: Done
```

evidence: `outputs/phase-11/typecheck.log`

### 3. GET /healthz

```bash
$ pnpm --filter @ubm-hyogo/api dev &
$ curl http://localhost:8787/healthz
# {"ok":true}
```

evidence: `outputs/phase-11/healthz.curl`

### 4. Next.js dev 起動

```bash
$ pnpm --filter @ubm-hyogo/web dev
# ▲ Next.js 16.2.4
# - Local: http://localhost:3000
$ curl -I http://localhost:3000
# HTTP/1.1 200 OK
```

evidence: `outputs/phase-11/web-dev.log`

### 5. pnpm test

```bash
$ pnpm test
# ✓ packages/shared/src/types/ids.test.ts (4 tests)
# ✓ apps/web/src/lib/tones.test.ts (7 tests)
# ✓ apps/web/src/components/ui/__tests__/primitives.test.tsx (19 tests)
# Test Files  3 passed (3)
# Tests  30 passed (28)
```

evidence: `outputs/phase-11/test.log`

### 6. UI Primitives スクリーンショット

実装フェーズ（Wave 06a/b/c）で取得。spec phase では path 確保のみ。

- `outputs/phase-11/screenshots/chip.png`
- `outputs/phase-11/screenshots/avatar.png`
- （15 種）
