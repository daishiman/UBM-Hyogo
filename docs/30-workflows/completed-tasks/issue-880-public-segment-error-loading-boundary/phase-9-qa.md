---
phase: 9
title: QA / 品質ゲート
workflow_id: issue-880-public-segment-error-loading-boundary
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 9 — QA / 品質ゲート

[実装区分: 実装仕様書]

## 1. 必須 gate

| Gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| build (Workers) | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0、bundle に `[project]/...` 仮想 specifier 混入なし |
| Playwright smoke | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts` | 2/2 PASS |
| design tokens grep | `mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens` | exit 0 |
| test suffix grep | `git ls-files 'apps/web/app/(public)/**' \| grep '\.test\.'` | empty |
| PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 (`gate-metadata:validate` + `verify:phase12-compliance` + `indexes:rebuild` drift) |

## 2. 機能検証

| 項目 | 結果 |
|------|------|
| `(public)/error-boundary-smoke` で boundary 発火 | Phase 11 evidence で確認 |
| AppShell `data-route-group="public"` 内描画 | TC-01 で assertion |
| logger に `scope: "public"` payload | コードレビューで確認（Playwright での logger 確認は環境依存のため割愛） |
| reset() で再 mount | 手動確認（reset 後同じ throw が再発するため、boundary が再発火する挙動を観察） |

## 3. セキュリティ

| 観点 | 検証 |
|------|------|
| `error-boundary-smoke` の production 流出 | `process.env.NODE_ENV === "production"` で `notFound()`。Playwright は dev/test 環境でのみ実行 |
| error stack の production 露出 | `isDev = NODE_ENV !== "production"` で `<pre>` 出力をガード |
| logger payload に PII 含めない | `error.message` / `error.stack` / `digest` のみ。req body や user info を含めない |
| design token 純度 | HEX 直書きなし（grep gate） |

## 4. 非機能検証

| 項目 | 結果 |
|------|------|
| OpenNext Workers 互換 | `next build --webpack` で確認 |
| Cold start 影響 | Client Component 1 / Server Component 1。bundle size 増加は数 KB 程度で許容 |
| a11y | `role="alert"` + focus 移動 + sr-only ラベル |

## 5. 障害シナリオ

| シナリオ | 想定挙動 |
|---------|---------|
| `(public)/error.tsx` 自体が throw する | Next.js が `app/global-error.tsx`（or 親 error.tsx）にフォールバック |
| `useAutoFocusOnMount` が `headingRef.current` を null で受け取る | hook 内部で null check 済（既存 hook 仕様） |
| `error.digest` が undefined | `&&` 条件で `<p>` を非表示 |
