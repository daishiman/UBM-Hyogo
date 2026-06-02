# Phase 9 — 品質保証

[実装区分: implementation]

apps/og（新規 Worker）と apps/web（統合）双方の lint / typecheck / build / size gate を通し、
既存不変条件の回帰がないことを確認する。skill 変更はないため mirror parity は不要。

## 1. apps/og（新規 Worker）

| # | チェック | コマンド | 合格基準 |
|---|---------|---------|---------|
| 1 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/og typecheck` | エラー 0 |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/og lint` | エラー 0（HEX 直書き / process.env 直参照なし） |
| 3 | build | `mise exec -- pnpm --filter @ubm-hyogo/og build` | 成功（workers-og / satori / resvg-wasm が bundle） |
| 4 | unit test | `mise exec -- pnpm --filter @ubm-hyogo/og test` | og-image / member-source / routes が GREEN（`*.spec.ts` のみ） |
| 5 | size gate | apps/og bundle gzip サイズが Worker 上限内 | CI `og-cd.yml` の size gate PASS |

## 2. apps/web（統合）

| # | チェック | コマンド | 合格基準 |
|---|---------|---------|---------|
| 6 | typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | エラー 0 |
| 7 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | エラー 0 |
| 8 | next/og 回帰 grep | `rg "next/og\|ImageResponse" apps/web` | **0 件**（next/og 混入なし） |
| 9 | 回帰ガード | opennext-config-regression.spec.ts | GREEN 維持 |
| 10 | env アクセサ grep | apps/web src で `OG_IMAGE_BASE_URL` が `getPublicEnv()` 経由のみ | process.env 直参照 0 件（AC-8） |
| 11 | web size gate | apps/web bundle が Free plan 上限内（next/og 不混入で不変） | size gate PASS |

## 3. monorepo 全体（統合確認）

| # | チェック | コマンド | 合格基準 |
|---|---------|---------|---------|
| 12 | 全体 typecheck | `mise exec -- pnpm typecheck` | 全パッケージ エラー 0 |
| 13 | 全体 lint | `mise exec -- pnpm lint` | エラー 0 |
| 14 | test suffix | 新規テストが `*.spec.ts` のみ | `*.test.ts` 0 件（不変条件 #8） |

## 4. 品質ゲートチェックリスト

- [ ] apps/og typecheck / lint / build / test 全 GREEN
- [ ] apps/og size gate PASS
- [ ] apps/web typecheck / lint GREEN
- [ ] `rg "next/og|ImageResponse" apps/web` が 0 件
- [ ] opennext-config-regression.spec.ts GREEN 維持
- [ ] OG_IMAGE_BASE_URL が env アクセサ経由のみ（process.env 直参照 0）
- [ ] 全体 typecheck / lint GREEN
- [ ] 新規テストが `*.spec.ts` のみ
- [ ] mirror parity 不要（skill 変更なし）を確認

> 詳細結果は `outputs/phase-9/quality-assurance.md` 参照。implemented_local_runtime_pending 時点では確定済み。
