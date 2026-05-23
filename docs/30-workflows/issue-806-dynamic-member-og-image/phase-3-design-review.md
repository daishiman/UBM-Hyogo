# Phase 3: 設計レビュー

## 1. 整合性チェック

| 観点 | 結果 | 根拠 |
|---|---|---|
| CLAUDE.md 不変条件 #5（apps/web から D1 直接禁止） | ✓ | `fetchPublicOrNotFound` で API 経由 |
| CLAUDE.md 不変条件 #2（consent key 統一） | ✓ | 該当箇所なし |
| `apps/web` env アクセス不変条件 | ✓ | `process.env.*` 直参照なし |
| OpenNext Cloudflare runtime 制約 | ✓ | route-level `runtime = "edge"` は指定しない |
| OKLch token 不変条件 | ⚠ → ✓ | gradient HEX は **root opengraph-image.tsx も同じ HEX 直書き** で実装済み（既存例外）。drift 防止のため root と同じ値を継続使用。新規 HEX 増加なし |
| publicConsent gate | ✓ | API contract に委譲 |
| Phase 12 evidence 表 / canonical 9 headings | ✓ | Phase 12 で対応 |

> root `apps/web/app/opengraph-image.tsx` は HEX を直書きしている既存実装。`next/og` `ImageResponse` 内の inline style では Tailwind class が使えない（DOM ではなく Satori renderer）ため、token CSS variable も resolve できない。本タスクでは root と同じ HEX を hard-code で踏襲し、design token bridge は **後続 followup の検討事項**として記録する。

## 2. リスク再評価

| リスク | 影響 | 対策 | 残存 |
|---|---|---|---|
| `ImageResponse` が OpenNext Cloudflare build で fail | 高 | route-level `runtime = "edge"` を置かず `pnpm --filter @ubm-hyogo/web build:cloudflare` で確認 | 低 |
| 日本語 glyph が default font で欠ける | 中 | TC-4 目視で tofu が出た場合は同一実装サイクル内でフォント埋め込み（cf-fonts 等）を修正。runtime / bundle 制約で破綻する場合のみエスカレーション | 中（Gate-B で判定） |
| publicConsent=false leak | 高 | API contract に依存、Phase 6 の unit test で fixture を 404 にして検証 | 低 |
| og:image URL に未エンコード id | 中 | `encodeURIComponent` 適用 | 低 |
| Playwright snapshot に GeneratedAt 等の揺らぎ | 低 | 画像 byte 比較ではなく meta tag content の path 検証に限定 | 低 |

## 3. レビュー判定

**承認**: Phase 4 へ進む。
