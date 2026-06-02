# Phase 1: 要件定義 — member 動的 OG（OG 専用 Worker 分離）

`[実装区分: implementation]`
status: `completed`（設計直列フェーズ）

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `issue-1027-member-dynamic-og-worker-split` |
| task_type | `VISUAL` / `implementation` |
| implementation_mode | `new` |
| GitHub Issue | #1027（OPEN 維持） |
| 依存タスク | `web-worker-size-limit-fix`（完了済み・静的 OG 化 + size gate） |

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No | 通常の実装 Phase とする（OG worker は新規） |
| upstream（dev/main）にマージ済み | No（動的 OG は実装済み） | 未マージとして扱う |
| 前提タスク（`web-worker-size-limit-fix`）完了済み | Yes | 静的 OG / size gate / 回帰ガードは done。本タスクはこれに **追加** する形 |

## 真の論点（要件レビュー）

1. **真の論点**: 「動的 member OG を Free プランの 3MiB 制約を破らずに復活させる」。`next/og` の wasm+font ≒1.5MB を main web worker に戻すと size gate FAIL（[code:10027]）になる。
2. **依存・境界**: OG 生成（重い wasm）と web 配信（軽量）の責務を **別 Worker bundle** に分離し、各々が独立した 3MiB 予算を持つことで境界を切る。member データの所有は API（D1）にあり、OG worker は API の read-only consumer に徹する。
3. **価値とコスト**: 価値 = SNS シェア時の member 個別サムネ復活（#806 の価値の回復）。最大コスト部品 = 新規 worker の deploy/routing ops。Paid plan（課金）コストは回避。
4. **改善優先順位**: ① web worker を太らせない（不変条件）→ ② OG worker を Free 上限内に収める → ③ web 統合（metadata）→ ④ CI 自動化。
5. **4条件評価**:
   - 価値性: SNS 流入の質を上げる（個別 OG）。コスト増は ops のみで課金なし。
   - 実現性: `workers-og` で 1 worker 1 cycle 実装可能。
   - 整合性: D1 直アクセス禁止 / web env アクセサ経由 / 回帰ガード維持と矛盾しない。
   - 運用性: OG worker 専用 size gate を CI に組み込み、再肥大を検知。

## 受け入れ条件（AC）

| ID | 条件 | 検証 |
|----|------|------|
| AC-1 | `apps/web` の production build gzip が size gate（3072KiB）内（OG 追加で増えない） | `bash scripts/check-worker-size.sh` PASS |
| AC-2 | `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` が 0 件のまま | 回帰 grep + 既存 regression spec GREEN |
| AC-3 | 新規 OG worker（`ubm-hyogo-og`）が gzip 3MiB 以内でビルドできる | `WORKER_FILE` 指定の `check-worker-size.sh` PASS |
| AC-4 | `GET https://<og>/members/:id` が有効 member で `200 image/png`（1200×630）を返す | OG worker unit test + 手動 curl |
| AC-5 | 不明 member / API 失敗時に default OG 画像（200）でフォールバックする | OG worker unit test |
| AC-6 | member 詳細 HTML の `og:image` / `twitter:image` が OG worker の絶対 URL を指す | web metadata 統合テスト |
| AC-7 | `twitterCard` が `summary_large_image` に戻る（1200×630 を活かす） | web metadata 統合テスト |
| AC-8 | `apps/web` env 参照は `env.ts` アクセサ経由（`OG_IMAGE_BASE_URL`） | grep ガード（`process.env.OG_IMAGE_BASE_URL` 直参照 0 件） |
| AC-9 | CI（`og-cd.yml`）が OG worker を staging/production に deploy し、deploy 前に size gate を通す | CI dry-run / workflow lint |

## タスク分類

- **VISUAL**: OG 画像は視覚成果物。Phase 11 は VISUAL_ON_EXECUTION（実行時に OG 画像 PNG を証跡化）。
- 新規 IPC / Electron 要素なし（Cloudflare Workers + Next.js のため Preload API パターンは非該当）。

## 既存コード命名規則（分析記録）

| 対象 | 規則 | 例 |
|------|------|-----|
| Worker パッケージ名 | `@ubm-hyogo/<app>` | `@ubm-hyogo/web`, `@ubm-hyogo/api` → `@ubm-hyogo/og` |
| Worker 名（wrangler） | `ubm-hyogo-<app>` + `-staging` / `-production` | `ubm-hyogo-api-staging` → `ubm-hyogo-og-staging` |
| env var | SCREAMING_SNAKE_CASE | `PUBLIC_API_BASE_URL` → `OG_IMAGE_BASE_URL` |
| test ファイル | `*.spec.ts`（`*.test.ts` 禁止・不変条件 #8） | `*.spec.ts` |
| web env アクセサ | `getPublicEnv()` / `getPublicFetchEnv()` | 同パターンに `OG_IMAGE_BASE_URL` を追加 |

## inventory（変更対象の事前列挙）

新規 8 + 編集 4 + 確認 2（詳細は phase-5.md / 俯瞰は index.md）。

## スコープ外（先送りではなく不採用 / 別レーン）

- Paid plan 移行（ユーザーが Worker 分離を選択 → 不採用）。
- OG 画像の高度な日本語フォント subset 最適化（初回は単一 font/subset で AC を満たす。さらなる削減は将来候補）。
