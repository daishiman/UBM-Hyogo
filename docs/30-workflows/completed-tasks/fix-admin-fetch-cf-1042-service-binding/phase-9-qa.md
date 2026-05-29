# Phase 9: 品質保証

## チェックリスト

| 項目 | 実行 |
|------|------|
| typecheck | `mise exec -- pnpm typecheck` |
| lint | `mise exec -- pnpm lint` |
| 該当 unit tests | `mise exec -- pnpm --filter web test -- --run src/lib/admin/__tests__/server-fetch.binding.spec.ts src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts src/lib/admin/__tests__/server-fetch-url.spec.ts src/lib/admin/__tests__/server-fetch.env.spec.ts` |
| 全体 unit tests（影響範囲確認） | `mise exec -- pnpm --filter web test` |
| build (OpenNext workers bundle) | `mise exec -- pnpm --filter web build`（任意。失敗時のみ調査） |
| PR pre-flight | `bash scripts/verify-pr-ready.sh` |

## 期待値

- focused web regression green（実測: `175 passed | 1 skipped`, `1229 passed | 1 skipped`）
- 既存 `server-fetch.spec.ts` の test は `NODE_ENV=test` 経路で binding を無視するため pass を維持

## 線形 / mirror parity

- skill 同期は対象内。Phase 12 で `task-specification-creator` lesson と `aiworkflow-requirements` 正本・indexes・artifact inventory を同一 wave 反映する。
