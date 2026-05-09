# Phase 4: AC ↔ Test 対応表

| AC | テスト ID | 場所 |
| --- | --- | --- |
| AC-1 | (Phase 9 `pnpm install` exit 0 で確認) | local cmd |
| AC-2 | TC-RED-06 / TC-RED-07 | tokens.test.ts |
| AC-3 | TC-RED-01 | tokens.test.ts |
| AC-4 | TC-RED-04 | tokens.test.ts |
| AC-5 | TC-RED-02 | tokens.test.ts |
| AC-6 | (Phase 9 ファイル存在確認) | git status |
| AC-7 | (Phase 9 typecheck) | local cmd |
| AC-8 | (Phase 9 build:cloudflare) | local cmd |
| AC-9 | (Phase 11 preview:cloudflare + curl) | manual |
| AC-10 | tokens.test.ts 全 it pass | vitest |
| AC-11 | TC-RED-05 (hex-grep-gate.sh) | shell |
| AC-12 | (Phase 10 `git diff main..HEAD --name-only`) | git |
