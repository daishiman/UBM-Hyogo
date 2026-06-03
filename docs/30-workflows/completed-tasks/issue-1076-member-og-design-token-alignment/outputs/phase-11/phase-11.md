# Phase 11 — 手動テスト（VISUAL_ON_EXECUTION）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 11.1 VISUAL_ON_EXECUTION 宣言

| key | value |
| --- | --- |
| タスク種別 | implementation task（UI / 意匠変更を伴う VISUAL タスク） |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 実 screenshot | **pending**（staging `apps/og` からの実PNG取得は user-gated） |

本タスクは OG 画像の配色・レイアウト・タイポグラフィを変更する VISUAL タスクであり、ローカル実装と HTML/token 検証は完了している。実 OG 画像の screenshot は staging deploy と runtime access が必要なため user-gated pending とする。

## 11.2 screenshot を現段階で取得しない理由（runtime 制約）

OG 画像は **Cloudflare Workers ランタイムの Satori（`workers-og` の `ImageResponse` / `loadGoogleFont`）でのみ実描画**される。Node/jsdom のテスト環境では `HTMLRewriter` が存在しないため、`render.tsx` の `imageResponse` が冒頭で `renderStaticFallbackOg()`（1×1 PNG）へ分岐し、意匠は描画されない。

該当根拠は `apps/og/src/render.tsx` の v8-ignore 区間（`/* v8 ignore start ... stop */`）。この区間は Workers ランタイム依存で Node/jsdom では実行不能なため、HTML 組成ロジック（`buildHtml` / `tagLine` / `escapeHtml`）を直接 unit test し、実意匠 screenshot は user 承認後に staging の `apps/og` エンドポイントから取得する。

## 11.3 取得予定 screenshot（pending・3 点）

`manual-test-result.md` / `phase11-capture-metadata.json`（親エージェント作成済み・本ファイルは参照のみ）と一致。

| TC | ファイル | シナリオ | component | runtime |
| --- | --- | --- | --- | --- |
| TC-OG-01 | `screenshots/og-default-token-aligned.png` | default OG（member なし） | `renderDefaultOg` | cloudflare-workers (workers-og Satori) |
| TC-OG-02 | `screenshots/og-member-with-tagline.png` | member（occupation/zone/type あり） | `renderMemberOg` | cloudflare-workers (workers-og Satori) |
| TC-OG-03 | `screenshots/og-member-fallback-tagline.png` | member（フィールド欠落 → `tagLine` フォールバック "UBM Hyogo member"） | `renderMemberOg (tagLine fallback)` | cloudflare-workers (workers-og Satori) |

詳細手順・判定は `manual-test-result.md`、capture メタは `phase11-capture-metadata.json` を参照（capturedAt: null = pending）。

## 11.4 設計時の代替証跡（buildHtml 自動 assert）

実 screenshot 取得前のローカル証跡として、`buildHtml` 出力 HTML 文字列に対する自動 assert を用いる。

| 検証 | 期待 |
| --- | --- |
| `render-html.spec.ts`: `buildHtml` 出力に暖色 hex（`#f5f4f1` / `#b08049` 等）を含み青系 hex（`#0068a9` / `#172033`）を含まない | PASS（AC-1） |
| `render-html.spec.ts`: default / member / フォールバック 3 ケースの title・subtitle 構造 | PASS（AC-3） |
| `og-tokens.spec.ts`: `OG_BRAND` が tokens.css 正本 hex と一致 / `titleFontSize` 境界（14文字以下→76 / 15〜28文字→64 / 29文字以上→54） | PASS（AC-1/AC-3） |
| `render-smoke.spec.ts`: default / member 両 OG が `image/png` を返す（Node では 1×1 PNG fallback path） | PASS（AC-4/AC-6） |

> HTML 文字列 assert は意匠の構造・配色値を機械検証する。実ピクセルの視認性（コントラスト・余白の体感）は staging screenshot（Phase 13 user-gated）で最終確認する。

## 11.5 既知の制限

- Node/jsdom では Satori 実描画不可（ランタイム限定・`render.tsx:62-83`）。意匠の最終確認は staging `apps/og` で行う。
- screenshot 3 点は user 承認後の staging runtime cycle で取得し、本 Phase の visual runtime 証跡を確定する（現段階は pending）。
