# Artifact Inventory: web-worker-size-limit-fix

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/` |
| state | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| date | 2026-05-29 |

## Implementation Targets

- `apps/web/app/opengraph-image.tsx` deleted
- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` deleted
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` deleted
- `apps/web/public/og-default.png` added
- `apps/web/src/lib/seo/site-metadata.ts`
- `apps/web/app/(public)/members/[id]/page.tsx`
- `apps/web/playwright/tests/public-metadata.spec.ts`
- `apps/web/__tests__/opennext-config-regression.spec.ts`
- `scripts/check-worker-size.sh`
- `.github/workflows/web-cd.yml`

## Evidence

- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo/web test`: 188 files PASS, 1293 tests PASS, 2 skipped
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`: PASS
- `bash scripts/check-worker-size.sh`: PASS, OpenNext worker/handler 5 files gzip 2100KiB
- `rg -n "next/og|ImageResponse" apps/web/app apps/web/src`: 0 matches
- `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm' -o -name 'Geist-Regular.ttf.bin'`: 0 matches
- `mise exec -- pnpm lint`: PASS
- `pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/web-worker-size-limit-fix`: PASS
- `pnpm gate-metadata:validate docs/30-workflows/completed-tasks/web-worker-size-limit-fix/artifacts.json`: ERROR 0

## User-Gated Boundary

Commit, push, PR creation, staging deploy, and production deploy remain user-gated.

## Lessons Learned

- **L-WWSL-001（spec-only close 禁止）**: implementation workflow が具体的な code target を特定できる場合、同サイクルで安全に実装できる限り docs-only / spec-only として close しない。本タスクは Task A/B の 10 ファイルを実装まで完遂し `implemented_local_evidence_captured` とした。
- **L-WWSL-002（adapter config key を install 済み型定義で検証）**: spec 記述前に adapter の config key を実際の型定義で確認する。`@opennextjs/cloudflare@1.19.4` には `minify` config key が存在せず、`minify:true` は無効な remediation。無効設定を足さず、production 既定 minify を維持し `OPEN_NEXT_DEBUG`/`debug:true` 禁止を regression spec で担保した。
- **L-WWSL-003（重量依存の除去 + 静的 fallback）**: Worker Free 3MiB gzip 上限が支配的制約のとき、`next/og` / `ImageResponse` は wasm/font 焼き込み（resvg 1346KB + yoga 70KB + Geist 123KB ≒ 1539KB）で bundle を肥大化させる。依存撤去 + 静的 PNG fallback（`public/og-default.png`）を優先する。
- **L-WWSL-004（gzip 計測対象は handler.mjs、bootstrap ではない）**: size gate は `apps/web/.open-next/server-functions/default/apps/web/handler.mjs` 等の server function bundle を gzip 合算計測する。`.open-next/worker.js` は小さな bootstrap であり計測対象として不適。閾値（hard 3072KiB / warn 2800KiB）を script・CI・spec・正本ドキュメントで一貫させる。

anti-pattern:
- ❌ 制約根拠（無料プラン 3MiB 上限）が確定しているのに、実装可能な fix を spec-only で先送りする。
- ❌ adapter の存在しない config key（`minify`）を「効きそう」という推測で追加する。
- ❌ size gate を bootstrap `worker.js` に当てて「軽い」と誤判定する。
