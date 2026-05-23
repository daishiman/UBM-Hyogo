# Phase 10: デプロイ準備

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. デプロイ対象

**なし**（test 1 ファイル新規 + route 3 ファイルの named export 化のみ。runtime artifact / Cloudflare Workers deploy bundle に変化なし）。

| 観点 | 判定 |
|------|------|
| Cloudflare Workers deploy 必要性 | 不要 |
| D1 migration | なし |
| Secret rotation | なし |
| Variables 追加 | なし |
| `wrangler.toml` 変更 | なし |
| route の export 追加が production bundle に与える影響 | tree-shake 対象。既存の use 経路（route handler 内部参照）は変わらないため、production bundle size は同等 |

## 2. CI への影響

| # | gate | 影響 |
|---|------|------|
| 1 | `pnpm typecheck` | spec 含めて pass 維持 |
| 2 | `pnpm --filter @ubm-hyogo/api lint` | pass 維持 |
| 3 | `apps/api` Vitest job | spec 1 ファイル追加で 7 describe / 22 it が追加。実行時間 +1〜2 秒程度 |
| 4 | `verify-design-tokens` | 影響なし（contract test は色を扱わない） |
| 5 | `verify-indexes-up-to-date` | 影響なし（skill indexes 変更なし） |
| 6 | E2E lines coverage gate | 影響なし（contract test 単体は coverageTier `standard` の加点対象外） |

## 3. ロールバック方針

| 症状 | 対応 |
|------|------|
| spec が flaky で CI 不安定 | pure unit のため flaky 発生は構造的にあり得ない（mock すらない）。万一観測されたら Vitest 環境（Node version 等）の差異を疑う |
| shared schema 仕様変更で test が一斉 red | shared schema 正本に追従して fixture を補正。schema 自体の変更は別 PR |
| route 3 ファイルの export 化で他 test が壊れた | export 付与・別名 re-export 単体は破壊的変化を起こさない設計。Phase 7 §5 で再確認の上、必要なら 1 ファイル単位で revert |

## 4. 事前確認コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts
mise exec -- pnpm --filter @ubm-hyogo/api test
```

すべて exit 0 を確認後 Phase 11 へ進む。
