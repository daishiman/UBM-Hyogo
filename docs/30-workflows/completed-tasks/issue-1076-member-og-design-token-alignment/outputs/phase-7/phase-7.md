# Phase 7 — カバレッジ確認

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 7.1 カバレッジ対象範囲

本タスクの変更は `apps/og` の pure 関数 + 定数に閉じる。カバレッジ評価対象は **変更ファイルのみ**とする。

| ファイル | カバレッジ対象 | 担当テスト |
| --- | --- | --- |
| `apps/og/src/og-tokens.ts` | `OG_BRAND` / `OG_TYPO` / `OG_LAYOUT` 定数参照 + `titleFontSize`（line / branch） | `og-tokens.spec.ts`（TC-OGT-02..16） |
| `apps/og/src/render.tsx` | `buildHtml`（OG_BRAND/OG_LAYOUT/OG_TYPO/titleFontSize 消費）/ `tagLine` / `escapeHtml` | `render-html.spec.ts`（TC-HTML-03..08）/ `render-smoke.spec.ts`（経路） |

## 7.2 カバレッジ対象外（v8-ignore の理由）

| 範囲 | 理由 | 既存処置 |
| --- | --- | --- |
| `render.tsx` の `imageResponse` 内 `ImageResponse` / `loadGoogleFont` path | `workers-og` の `ImageResponse`/`loadGoogleFont` は Cloudflare Workers ランタイム（HTMLRewriter / Satori）依存で Node/jsdom テスト環境では実行不能。HTML 組成ロジック（`buildHtml`/`tagLine`/`escapeHtml`）は直接 unit test 済み | 既存 `/* v8 ignore start ... stop */`（`render.tsx:66-82`）を維持。新規 ignore は増やさない |
| `renderStaticFallbackOg` 内の 1x1 PNG バイト列 | 定数バイト列。応答契約は `render-smoke.spec.ts` の fallback path（`HTMLRewriter` 不在分岐）が間接カバー | smoke で content-type / byteLength を assert |

> ImageResponse path を v8-ignore とする方針は既存 render.tsx の確立済み処置を踏襲する（範囲を広げない）。font は runtime fetch のまま（bundle しない＝AC-5）なので、フォント取得ロジックもランタイム依存として ignore 範囲内。

## 7.3 高カバレッジを狙う方針（pure 関数）

| 関数 / 値 | line | branch | 担保テスト |
| --- | --- | --- | --- |
| `titleFontSize` | 全行 | 3 分岐すべて（≤14→76 / ≤28→64 / else→54）を境界値で踏破 | TC-OGT-11..16（14/14/15/28/29/サロゲート） |
| `OG_BRAND` 参照 | 9 key 全て | （定数・分岐なし） | TC-OGT-02..10 で全 key を tokens.css 正本と照合 / TC-HTML-04 で出力含有 |
| `buildHtml` | 全行（単一 return） | escape 経由の文字列組成 | TC-HTML-03..08（escape / 正本 hex / default / member 有 / フォールバック） |
| `tagLine` | 全行 | present / trim / フォールバックの 3 分岐 | render-html.spec.ts の既存 tagLine 3 ケース（非回帰維持）+ member-source.spec.ts |
| `escapeHtml` | 全行 | `&` `<` `>` `"` 各置換 | render-html.spec.ts の既存 escapeHtml 2 ケース（非回帰維持） |

## 7.4 確認コマンド

```bash
# カバレッジ付き実行（apps/og の vitest 設定に coverage がある場合）
mise exec -- pnpm --filter @ubm-hyogo/og test -- --coverage

# カバレッジ未設定なら通常実行で全 PASS を確認（pure 関数は TC で網羅）
mise exec -- pnpm --filter @ubm-hyogo/og test
```

## 7.5 Phase 7 完了条件

- 変更ファイル（`og-tokens.ts` / `render.tsx` の pure 部）の line/branch が TC-OGT・TC-HTML で網羅されている。
- ImageResponse / loadGoogleFont / 1x1 PNG path は Workers runtime 限定として v8-ignore（既存処置維持・新規 ignore を増やさない）理由が明記されている。
- `titleFontSize` の 3 分岐が境界値（14/15/28/29 + サロゲート）で全踏破されている。
