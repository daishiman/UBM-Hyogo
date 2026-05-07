# Phase 4 — テスト戦略

## 方針

- unit test は `apps/web/src/lib/__tests__/env.test.ts` に集約。Workers context 注入は vi.mock で制御。
- grep-based smoke gate（AC-5 / AC-6 / AC-9）は phase-09 で `grep -rn` を直接実行し、結果を 0 件で記録。
- 上位 e2e は task-18 regression smoke に委譲（本タスクは `getEnv()` 公開 API の契約までを担保）。

詳細は `test-matrix.md`。
