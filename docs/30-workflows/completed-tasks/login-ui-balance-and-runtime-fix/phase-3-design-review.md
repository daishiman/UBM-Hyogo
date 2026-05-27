# Phase 3 — 設計レビュー

## 判定: GO（Phase 4 へ進行可）

## 4 条件評価

| 観点 | 評価 | 根拠 |
| ---- | ---- | ---- |
| 価値性 | High | ユーザーの login flow を実際に破綻させている 3 系統（UI バランス・ブランドアイコン・magic-link 404）を 1 サイクルで解消する。ログイン成功率に直結。 |
| 実現性 | High | 修正対象は CSS 2 ファイル + route 2 ファイル + env schema 1 行（必要時）。全て既存抽象内。新規依存ゼロ。 |
| 整合性 | High | CLAUDE.md invariant #11（apps/web env アクセス）に整合させる修正。新規 endpoint なし。D1 直アクセス追加なし。OKLch token のみ。 |
| 運用性 | High | grep gate を 1 つ追加（regression smoke）。playwright visual baseline を 1 回更新。staging deploy で AC-7 を確認可能。 |

## 真の論点

ユーザーが見ているのは「ログインが動かない」体験。視覚バランスとアイコン破綻は「動く UI が荒い」課題、magic-link 404 は「そもそも flow が完了しない」課題。後者がブロッカーで、UI 課題は同 surface のため併合修正が合理的（責務境界は CSS / route で完全分離）。

## 因果ループ

- 強化ループ: `process.env` 直参照を許容する → Workers ランタイムで undefined → fallback localhost → staging で 404 → ユーザー login 不能 → サポート負荷増。invariant 違反を grep gate で固定すれば強化ループを断ち切れる。
- バランスループ: CSS のワイルドカード `[data-size]` を放置 → 新規 `<img data-size>` が増えるたびに視覚破綻が連鎖。negative selector で局所化して停止。

## 価値とコストの不均衡

- 高価値・低コスト: C-1/C-2/C-3（env 修正 + grep gate）。staging で即効果。
- 高価値・中コスト: A-1（input balance）+ B-1/B-2（legacy セレクタ scope 化）。視覚回帰のため playwright baseline 更新が伴う。
- 低価値項目なし（scope を最小に保った結果）。

## 改善優先順位

1. C-1（magic-link route の env）— ブロッカー
2. C-2（verify route）— C-1 と同パターン
3. C-3（grep gate）— 再発防止
4. B-1/B-2（Google アイコン）— 視覚的に最も目立つ
5. A-1（input balance）— 改善体感

## 責務境界の確認

| 修正 | 責務 | 干渉 |
| ---- | ---- | ---- |
| `auth.css` 編集 | `/login` カード内の input サイズ | なし（`.auth-card` scope 内） |
| `legacy-public.css` negative selector | legacy public 領域の `[data-size]` 適用範囲 | `:not(...)` 列挙のみ。値は不変 |
| `GoogleBrandIcon.tsx` | brand icon 描画契約 | 触らない（Decision） |
| `magic-link/route.ts` | web → api proxy の base URL 解決 | 既存 fetch 形態は不変、解決経路のみ変更 |

## リスクと緩和

| リスク | 緩和 |
| ------ | ---- |
| `:not(.ui-input):not(.ui-button)` で legacy 内の他要素のスタイルが副次的に変わる | Phase 11 で `/`, `/members`, `/(public)/*` のプロトタイプ準拠 visual を確認。差分があれば negative selector を `[data-component="google-brand-icon"]` のみに絞る |
| `getAuthEnv()` が unset を返す | auth/proxy path は local fallback `http://127.0.0.1:8787` を維持。`vitest` は `vi.stubEnv("INTERNAL_API_BASE_URL", ...)` で検証 |
| `INTERNAL_API_BASE_URL` の env.ts schema 追加が忘れられる | Phase 5 タスクで env.ts 確認を必須ステップに含める |
| playwright baseline 差分が大きすぎる | Phase 11 で diff を目視確認し、AC-1/AC-2 起因部分のみであることを記録 |

## レビュー結論

- 設計は実装に十分な粒度に到達。
- Phase 4（テスト計画）へ進行可。
