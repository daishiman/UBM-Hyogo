# admin-dashboard-recovery-and-byZone: Implementation Guide

## Part 1. 中学生レベルの説明

管理画面のトップページは、サーバーから会員数や最近の動きをまとめて取ってきます。今の仕様では、その取得が失敗した原因をログで確かめてから直します。

もう一つの目的は、会員を「0→1」「1→10」「10→100」の3つの段階に分けて棒グラフで見せることです。新しい画面を増やすのではなく、今ある `GET /admin/dashboard` の返事に `byZone` を足します。

## Part 2. 技術者向け要約

`AdminDashboardViewZ` に optional `byZone` を追加し、API route では既存 `aggregatePublicZones` の結果を canonical 3 buckets に正規化します。Web 側は loose legacy shape を捨て、新 shape だけを `ZoneSlice` として受け入れます。

404 復旧は H1/H2/H3 を `wrangler tail` で切り分け、確定した1系統のみを修正します。これにより憶測で環境変数・cookie・path 結合を同時に触るリスクを避けます。

## Part 3. Scope Boundary

Scope includes `packages/shared/src/zod/viewmodel.ts`,
`apps/api/src/routes/admin/dashboard.ts`, new API helper
`apps/api/src/routes/admin/_shared/byZone.ts`, web mapper, web dashboard
component, and the single confirmed dashboard fetch recovery path.

Scope excludes a new API endpoint, D1 schema migration, Google Form schema
change, and unrelated admin route UI alignment. If required color aliases are
missing, the implementation must add only the minimal tokens needed by this
component in the same cycle instead of creating a backlog-only escape hatch.

## Part 4. Implementation Steps

1. Capture web/api `wrangler tail` while loading staging `/admin`.
2. Classify root cause as H1, H2, or H3 and write `outputs/phase-10/root-cause.md`.
3. Add optional shared schema and pure `buildByZoneSlices` helper.
4. Wire helper into the existing dashboard response and update the web mapper/component.
5. Apply the one confirmed recovery fix and add focused regression specs.

## Part 5. Verification Commands

Run focused package tests first, then whole-repo quality gates:

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

Staging deploy, `wrangler tail`, and staging curl verification remain
user-gated and must not be represented as completed until their evidence files
exist. Local authenticated browser verification is captured in Phase 11.

## Part 6. 本サイクルの実装サマリ (2026-05-26)

| ファイル | 変更種別 | 内容 |
|----------|----------|------|
| `packages/shared/src/zod/viewmodel.ts` | edit | `AdminDashboardViewZ` に optional `byZone` (length=3 / key enum / tone enum) 追加 |
| `apps/api/src/routes/admin/_shared/byZone.ts` | add | `buildByZoneSlices(rawRows, totalMembers): ByZoneSlice[]` pure fn (canonical 3 keys / tone 固定) |
| `apps/api/src/routes/admin/dashboard.ts` | edit | `aggregatePublicZones` を Promise.all に追加し `buildByZoneSlices` で正規化、response に `byZone` 同梱 |
| `apps/web/src/lib/admin/admin-dashboard-ui.ts` | edit | `ZoneSlice` 型再定義 (key/label/hint/count/total/tone) + `parseZoneSlices` を export し新 shape のみ受理 |
| `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx` | edit | プロトタイプ準拠 DOM (Chip + label + hint + count + 8px bar on `var(--ubm-color-bg)`) に書き換え |
| `apps/web/src/styles/tokens.css` | edit | `--ubm-color-bg: var(--ubm-color-surface-bg-2)` 最小 alias 追加 |
| `apps/web/src/lib/admin/dashboard-ui.spec.ts` | edit | 旧 loose shape を undefined に落とすケースに更新 |

### 新規 spec ファイル

- `packages/shared/src/zod/__tests__/admin-dashboard-view-byZone.spec.ts` (T-B-02)
- `apps/api/src/routes/admin/_shared/__tests__/byZone.spec.ts` (T-B-01 pure fn)
- `apps/api/src/routes/admin/__tests__/dashboard-byZone.spec.ts` (T-B-01 integration)
- `apps/web/src/lib/admin/__tests__/admin-dashboard-ui-byZone.spec.ts` (T-B-03)
- `apps/web/src/lib/admin/__tests__/server-fetch-url.spec.ts` (T-B-04 / H3 回帰防止)
- `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` (T-B-05 / H2 回帰防止)
- `apps/web/src/features/admin/components/_dashboard/__tests__/ZoneDistribution.spec.tsx` (T-B-06)

### 検証結果 (local)

- `pnpm --filter @ubm-hyogo/shared test` — 235 passed (`admin-dashboard-view-byZone` 4 件含む)
- `pnpm --filter @ubm-hyogo/api test` — 412 passed (`dashboard-byZone` + `_shared/byZone` 含む)
- `pnpm --filter @ubm-hyogo/web test` — 1168 passed / 1 skipped
- `pnpm typecheck` — pass (6 workspaces)
- `pnpm lint` — pass (boundaries / dep-cruiser / stablekey / eslint)
- `pnpm build` — pass (apps/web `next build --webpack` + apps/api `tsc --noEmit`)
- `pnpm indexes:rebuild` — idempotent (md5 一致, 5161 keywords)
- `bash scripts/verify-pr-ready.sh` — `verify:phase12-compliance` / `gate-metadata:validate` PASS。`indexes:rebuild drift` は uncommitted skill 変更による HEAD diff であり、re-rebuild は no-op (上述 md5 一致)。
- `PLAYWRIGHT_EVIDENCE_TASK=admin-dashboard-recovery-and-byZone PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/admin-dashboard-recovery-and-byZone/outputs/phase-11/evidence mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/admin-dashboard-byzone-screenshots.spec.ts --project=desktop-chromium` — 1 passed。`outputs/phase-11/admin-dashboard-200-overview.png` と `outputs/phase-11/admin-dashboard-byZone-detail.png` を保存。

### H1/H2/H3 切り分け

`outputs/phase-10/root-cause.md` 参照。コード上の静的監査では H2 / H3 は既に防御済 (regression spec 追加)、残候補 H1 (環境変数) は staging deploy 時に `wrangler tail` で確定する user-gated 工程。

### user-gated

- staging deploy / `wrangler tail` ログ採取 / H1 確定時の `wrangler.toml` 環境変数追加
- AC-B1 / AC-B2 の staging curl evidence (`outputs/phase-11/` 配置)
- commit / push / PR 作成
