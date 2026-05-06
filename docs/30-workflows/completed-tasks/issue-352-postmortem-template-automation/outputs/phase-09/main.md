# Phase 09 — 品質保証

## 実行ログ
```
$ mise exec -- pnpm vitest run scripts/postmortem --coverage.enabled=false
 ✓ scripts/postmortem/__tests__/generate-postmortem.test.ts (13 tests) 81ms
 Test Files  1 passed (1)
      Tests  13 passed (13)

$ mise exec -- pnpm vitest run scripts/postmortem --coverage '--coverage.include=scripts/postmortem/**'
 ✓ scripts/postmortem/__tests__/generate-postmortem.test.ts (13 tests) 67ms
 % Coverage report from v8
 All files / generate-postmortem.ts: statements 89.44%, branches 73.61%, functions 100%, lines 89.44%

$ mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
    --evidence <tmp>/phase-11 --rollback-evidence rollback.md \
    --occurred-at 2026-05-05T00:00:00Z --severity sev2
# Postmortem: v0.0.0 ... (固定見出し 8 つを順序通り含む markdown が stdout に出力)
```

## 結論
- targeted unit test green / coverage AC green / CLI smoke green
- AC-1..AC-10 を充足
