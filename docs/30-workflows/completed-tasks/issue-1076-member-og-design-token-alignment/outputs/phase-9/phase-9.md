# Phase 9 — 品質保証

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 9.1 一括判定方針

以下を順に実行し、すべて緑であることを 1 つの品質ゲートとして判定した。

```bash
# 型 / lint（AC-7）
pnpm --filter @ubm-hyogo/og typecheck
pnpm --filter @ubm-hyogo/og lint

# OG パッケージの test parity（AC-1 / AC-3 / AC-4 / AC-6）
pnpm --filter @ubm-hyogo/og test
```

| 判定 | 対象 | AC |
| --- | --- | --- |
| typecheck | `apps/og` 全体（`og-tokens.ts` の `as const` 型 / `titleFontSize` 戻り型 number） | PASS |
| lint | `apps/og` 全体（unused import なし・HEX 直書きの本文残存なし） | PASS |
| test parity | `og-tokens.spec.ts` / `render-html.spec.ts` / `render-smoke.spec.ts` / `router.spec.ts` / `router-error.spec.ts` / `member-source.spec.ts` | PASS（6 files / 23 tests） |

## 9.2 ドリフトガード / 整合 test の期待結果

| test | 期待 | AC |
| --- | --- | --- |
| `og-tokens.spec.ts`: `OG_BRAND` が tokens.css 正本 hex（`:root` の text/surface/border + `@supports` の accent 系）と一致 | PASS | AC-1 |
| `og-tokens.spec.ts`: `titleFontSize` 境界（14文字以下→76 / 15〜28文字→64 / 29文字以上→54） | PASS | AC-3 |
| `render-html.spec.ts`: `buildHtml` 出力に暖色 hex（`#f5f4f1` / `#b08049` 等）を含み青系 hex を含まない | PASS | AC-1 |
| `render-html.spec.ts`: default / member / フォールバック 3 ケースの title・subtitle 構造 | PASS | AC-3 |
| `render-smoke.spec.ts`: default / member 両 OG が `image/png` を返す（Node 環境では 1×1 PNG fallback path 維持） | PASS | AC-4/AC-6 |

## 9.3 bundle size gate（AC-5）

意匠改善後も OG Worker bundle が Cloudflare Workers Free 枠 3MiB 上限内であることを確認する。

```bash
# staging 構成で build
pnpm --filter @ubm-hyogo/og build

# bundle サイズ検証（Free 3MiB 上限）
bash scripts/check-worker-size.sh apps/og/dist
```

| 観点 | 期待 |
| --- | --- |
| `apps/og/dist` の Worker bundle 合計 | PASS（dry-run gzip 719.13 KiB / size gate 718KiB、Free 上限 3072 KiB 以内） |
| font の扱い | `loadGoogleFont` による **runtime fetch のまま**で bundle に焼き込まない（`render.tsx:69-73` の per-request fetch を維持）。font を bundle 化しないことが size 不変の根拠 |
| 定数追加（`og-tokens.ts`）の重量影響 | 文字列 hex / number 定数のみのため bundle 重量へ実質影響なし（Phase 3 §3.3 リスク緩和済み） |

## 9.4 青系 hex 不在 grep 確認（AC-1 補助）

`render.tsx` 本文から暫定の青系 hex を排除したことを機械確認する。

```bash
# 旧 ad-hoc 青系 hex が apps/og/src から消えていること（0 件を期待）
grep -rn "#0068a9\|#172033" apps/og/src
```

| 観点 | 期待 |
| --- | --- |
| `#0068a9`（旧 accent 青）/ `#172033`（旧 ink 紺）の出現 | 0 件 |
| `render.tsx` 本文の hex literal | 0 件（色は `OG_BRAND` 参照のみ） |
| `og-tokens.ts` の hex | 正本 tokens.css 由来の暖色のみ（出典コメント付き） |

> `apps/og` は `verify-design-tokens` gate の scan 対象外（gate は `apps/web` のみ）。OG 側の hex 不在は本 grep と `render-html.spec.ts` の青系不在 assert で担保する（Phase 2 §2.8）。

## 9.5 判定基準

上記 §9.1〜§9.4 はすべて PASS。Phase 10（最終レビュー）へ進行可。
