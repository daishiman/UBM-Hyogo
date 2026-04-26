# Manual Smoke Log

## Scope

- Task type: `code_and_docs`
- Visual evidence: `VISUAL_STUB`
- Primary evidence source: document path, artifact map, source-of-truth sync checks, and local web UI screenshot

## Checks

- [x] `index.md` links to all Phase 1-13 files.
- [x] `artifacts.json` and `outputs/artifacts.json` are synchronized（Phase 12 で最終確認）.
- [x] Phase 12 carries Step 2 domain sync for runtime version (TypeScript 6.x) and Cloudflare adapter policy (@opennextjs/cloudflare).
- [x] version-policy.md: Node 24.x / pnpm 10.x / Next.js 16.x / React 19.2.x / TypeScript 6.x を記録。
- [x] runtime-topology.md: apps/web（@opennextjs/cloudflare）/ apps/api（Hono Workers）の分離構成を明記。
- [x] @cloudflare/next-on-pages: 廃止理由を phase-03 代替案に記録済み。リポジトリ内に残存なし。
- [x] AUTH_* 環境変数プレフィックス: phase-02 環境変数設計に記録済み。NEXTAUTH_* は使用しない。
- [x] pnpm 9 EOL（2026-04-30）: phase-01 既存資産インベントリに記録済み。pnpm 10.x を採用。
- [x] 正本仕様との差分（B-01, B-02）: Phase 10 blocker 一覧に記録し、Phase 12 Step 2 で解消予定。
- [x] `apps/web` home: `pnpm dev:web` で `http://localhost:3000/` を起動し、`outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png` を取得。
- [x] `apps/web/wrangler.toml`: OpenNext Workers 形式（`main = ".open-next/worker.js"` / `[assets] directory = ".open-next/assets"`）を確認。
- [x] `pnpm typecheck`: PASS（Node v24.15.0 / pnpm 10.33.2 で実行）。
- [x] `pnpm --filter @ubm-hyogo/web build:cloudflare`: PASS（Node v24.15.0 / pnpm 10.33.2 で実行）。
- [x] Workers bundle size: `.open-next/worker.js` 2,278 bytes、assets 約 644KB。

## Screenshot Evidence

| ID | Path | Viewport | Result |
| --- | --- | --- | --- |
| RF-01 | `outputs/phase-11/screenshots/RF-01-runtime-foundation-home-after.png` | 1280x720 | PASS |

## 確認日

2026-04-26
