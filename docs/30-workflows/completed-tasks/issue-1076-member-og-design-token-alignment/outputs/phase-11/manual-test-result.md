# Phase 11 — 手動テスト結果（implemented_local_evidence_captured / VISUAL_ON_EXECUTION）

## メタ情報

| key | value |
| --- | --- |
| タスクID | `issue-1076-member-og-design-token-alignment` |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 実施日 | 2026-06-03 |
| 証跡の主ソース | 設計時点では自動テスト設計（`og-tokens.spec.ts` / `render-html.spec.ts` / `render-smoke.spec.ts`）。実 OG 画像 screenshot はstaging runtime cycleで取得 |
| スクリーンショットを今作らない理由 | OG 画像は Cloudflare Workers ランタイムの Satori（`workers-og` の `ImageResponse`）でのみ実描画される。Node/jsdom テスト環境では `HTMLRewriter` 不在のため 1×1 PNG fallback に分岐し、意匠は描画されない（`render.tsx:62-83` の v8-ignore 区間）。実意匠の screenshot は実装後に `wrangler dev` / staging の `apps/og` エンドポイントから取得する |

## VISUAL_ON_EXECUTION 宣言

本タスクは UI/意匠変更を伴う VISUAL タスクだが、`implemented_local_evidence_captured` 段階のため実 OG 画像の screenshot は未取得（`pending`）。
代替の設計時証跡として、`buildHtml` 出力 HTML 文字列に対する自動 assert（色・構造・名あり/なし分岐）を Phase 4 で設計する。

## staging runtime cycleで取得予定の screenshot（pending）

| ファイル | シナリオ | 取得方法 |
| --- | --- | --- |
| `screenshots/og-default-token-aligned.png` | default OG（member なし） | 実装後 `apps/og` の `/og`（default）を `wrangler dev` で取得 |
| `screenshots/og-member-with-tagline.png` | member（occupation/zone/type あり） | `/og/member/:id`（fixture: occupation 有） |
| `screenshots/og-member-fallback-tagline.png` | member（フィールド欠落 → "UBM Hyogo member" フォールバック） | `/og/member/:id`（fixture: summary 最小） |

## 設計時点の自動検証（staging runtime cycleで実走）

| 検証 | 期待 |
| --- | --- |
| `og-tokens.spec.ts`: OG_BRAND が tokens.css 正本 hex と一致 | PASS |
| `og-tokens.spec.ts`: `titleFontSize` 境界（14文字以下→76 / 15〜28文字→64 / 29文字以上→54） | PASS |
| `render-html.spec.ts`: `buildHtml` が `#f5f4f1` / `#b08049` 等を含み青系 `#0068a9` / `#172033` を含まない | PASS |
| `render-html.spec.ts`: default / member / フォールバック 3 ケースの title・subtitle | PASS |
| `render-smoke.spec.ts`: default / member 両 OG が `image/png` を返す（fallback path 維持） | PASS |
| `router.spec.ts` / `member-source.spec.ts`（既存） | 非回帰 PASS |
| `pnpm --filter @ubm-hyogo/og build` + `check-worker-size.sh apps/og/dist` | Free 3MiB 上限内 |

## 既知の制限

- Node/jsdom では Satori 実描画不可（ランタイム限定）。意匠の最終確認は staging `apps/og` で行う（Phase 13 user-gated）。
