# Phase 9: 品質保証

`[実装区分: 実装仕様書]`

## 実行する gate / コマンド

| Gate | コマンド | 期待 |
|------|---------|------|
| 型チェック | `pnpm --filter @ubm-hyogo/web typecheck` | pass |
| Lint | `pnpm --filter @ubm-hyogo/web lint` | pass |
| Web build (Next webpack) | `pnpm --filter @ubm-hyogo/web build` | pass。`/smoke/error-boundary`, `/smoke/loading-state`, `/smoke/members-list` が route list に含まれること |
| Playwright smoke | `ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging STAGING_BASE_URL=http://localhost:3000 pnpm --dir apps/web exec playwright test tests/e2e/staging-smoke.spec.ts --config playwright.config.ts --project=staging-smoke --grep "staging smoke / loading state"` | TC-01..TC-08 すべて green |
| design token grep gate | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | pass。`bg-[#`/`text-[#` 検出ゼロ |
| 127.0.0.1 焼き込み grep | task-18 既存 gate（`apps/web/src` 配下に local-only endpoint 直書き禁止） | pass |
| test suffix gate | lefthook `block-test-suffix` + GitHub Actions `verify-test-suffix` | pass（`*.spec.ts` のみ追加） |

## 変更対象ファイル（QA フェーズ）

追加コード変更なし。既存変更の検証のみ。

## ローカル一括実行

```bash
pnpm --filter @ubm-hyogo/web typecheck && \
pnpm --filter @ubm-hyogo/web lint && \
pnpm --filter @ubm-hyogo/web build && \
ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging STAGING_BASE_URL=http://localhost:3000 \
  pnpm --dir apps/web exec playwright test tests/e2e/staging-smoke.spec.ts \
  --config playwright.config.ts --project=staging-smoke --grep "staging smoke / loading state"
```

## 失敗時の対応

| 失敗 gate | 想定原因 | 対応 |
|----------|---------|------|
| typecheck | `searchParams` 型変更（Next.js 16）に追従不足 | `Promise<{ delay?: string }>` シグネチャを使用 |
| build | OpenNext での dynamic route 解釈失敗 | `__smoke__/loading-state` を static 化（`export const dynamic = "force-dynamic"` 追加） |
| Playwright flake | navigation race | `waitUntil: "commit"` 利用と locator auto-wait で吸収。`page.waitForLoadState("networkidle")` は使わない |
| verify-design-tokens | utility 違反 | className を root `loading.tsx` と完全一致に揃え直す |

## DoD（Phase 9）

- 上記すべての gate が pass。
- Phase 6 の `--repeat-each=10` smoke 実行で 50/50 pass。
