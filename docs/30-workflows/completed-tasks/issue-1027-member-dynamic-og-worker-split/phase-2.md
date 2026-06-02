# Phase 2: 設計 — OG 専用 Worker 分離

`[実装区分: implementation]`
status: `completed`（設計直列フェーズ）

## 1. トポロジー

```
[SNS クローラ]
     │ GET https://ubm-hyogo-og(.staging).workers.dev/members/<id>
     ▼
┌────────────────────────────┐     service binding (API_SERVICE) または
│ apps/og  (ubm-hyogo-og)     │ ──► PUBLIC_API_BASE_URL fetch
│  Hono router               │       GET /public/members/<id>
│  + workers-og ImageResponse│            │
└────────────────────────────┘            ▼
     ▲                              ┌──────────────────┐
     │ og:image 絶対URL              │ apps/api         │ ──► D1 (read-only)
     │                              │ (ubm-hyogo-api)  │
┌────────────────────────────┐     └──────────────────┘
│ apps/web (ubm-hyogo-web)   │
│  member 詳細 generateMetadata│
│  ogImagePath = OG worker URL│
└────────────────────────────┘
```

- **責務分離**: OG 生成（satori+resvg wasm = 重い bundle）は `apps/og` に隔離。`apps/web` は軽量のまま（size gate 維持）。
- **状態所有権**: member データの正本は D1（`apps/api` 所有）。OG worker は read-only consumer。`apps/web` も同様に read-only。
- **bundle 予算**: Worker ごとに独立した Free 3MiB。OG worker は wasm+font を持っても自前予算内に収める。

## 2. ライブラリ選定

| 候補 | 採否 | 理由 |
|------|------|------|
| `workers-og` | **採用** | Cloudflare Workers ネイティブ（satori + resvg-wasm を Workers ランタイム向けに最適化）。`ImageResponse` 互換 API。単一 worker に閉じる。 |
| `next/og`（@vercel/og） | 不採用 | Next.js ランタイム前提。standalone worker では取り回しが悪く、`apps/web` 回帰ガードの禁止対象でもある。 |
| Hono | **採用** | `apps/api` と同じ薄いルーター。`GET /members/:id` / `/health` を簡潔に定義。 |

> **[FB-CRONVL-001 類似の事前実測]**: `workers-og` の `ImageResponse` が Workers の `compatibility_flags=["nodejs_compat"]` 下で wasm を初期化できることを Phase 4 の最初に smoke で確認する（wasm import 方式が wrangler バージョンに依存するため）。失敗時は `@cloudflare/pages-plugin`/`satori` + `@resvg/resvg-wasm` 直叩きへフォールバックする方針を Phase 2 で確定済みとする。

## 3. OG Worker API 契約

| メソッド | パス | 入力 | 出力 | 副作用 |
|----------|------|------|------|--------|
| GET | `/members/:id` | path `id`（member id） | `200 image/png`（1200×630）/ 失敗時も default 画像で 200 | API への read-only fetch のみ |
| GET | `/health` | — | `200 application/json {"status":"ok"}` | なし |
| GET | `/og-default.png`（任意） | — | 共通 default OG（`apps/web/public/og-default.png` と同一意匠） | なし |

### レスポンスヘッダ

- `Content-Type: image/png`
- `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
  （SNS クローラ向け CDN キャッシュ。member 更新の反映遅延は許容範囲）
- ETag は member の `updatedAt` ハッシュ（任意・あれば付与）

### member 取得経路（2 案・実装は service binding を第一候補）

1. **service binding `API_SERVICE`**（推奨・本番/staging）: `env.API_SERVICE.fetch("https://internal/public/members/" + id)`。worker 間内部通信でレイテンシ/コスト最小。
2. **`PUBLIC_API_BASE_URL` fetch**（ローカル/フォールバック）: 公開 URL へ HTTPS fetch。

> 取得する shape は公開 `GET /public/members/:id` の `summary`（`fullName`, `occupation` 等）。新フィールド追加なし（不変条件）。

## 4. OG テンプレート設計（`apps/og/src/render.tsx`）

- satori JSX で 1200×630 のカードを描画:
  - 背景: ブランドカラー（OKLch トークン `--color-brand-*` の実 RGB 値を定数化して使用。satori は CSS 変数を解決できないため、`tokens.css` の対応 HEX/RGB を `BRAND_COLORS` 定数として OG worker 内に複製し、コメントで tokens.css 由来を明記）。
  - 中央〜下部: `fullName`（大）、`occupation`（中）、サイト名 `UBM 兵庫支部会`（小）。
  - フォント: 日本語対応のため Noto Sans JP の **subset（常用漢字 + かな + ラテン）** を `.woff`/binary で同梱、または 1 weight に限定。bundle 予算を Phase 7 で実測。
- `member` が無い場合は default レイアウト（サイト名のみ）。

## 5. apps/web 統合設計

### 5-1. `apps/web/src/lib/env.ts`

`publicEnvSchema` に追加:

```ts
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  PUBLIC_API_BASE_URL: z.string().url().optional(),
  OG_IMAGE_BASE_URL: z.string().url().optional(), // 追加: OG worker のベース URL
});
```

- 未設定（optional）の場合は静的 `/og-default.png` にフォールバックする（fail-open）。

### 5-2. `apps/web/src/lib/seo/site-metadata.ts`

- `getPublicEnv()` から `OG_IMAGE_BASE_URL` を読み、`buildPageMetadata` の呼び出し側で member OG URL を組み立てるヘルパー `buildMemberOgImageUrl(id: string): string | undefined` を追加（未設定なら `undefined` → `DEFAULT_OG_IMAGE`）。
- 既存の `ogImagePath.startsWith("http")` 分岐により絶対 URL がそのまま採用される（既存ロジック再利用）。

### 5-3. `apps/web/src/app/(public)/members/[id]/page.tsx`

```ts
const ogUrl = buildMemberOgImageUrl(id); // OG worker URL or undefined
return buildPageMetadata({
  title: profile.summary.fullName,
  description: `${profile.summary.fullName}${occ ? `（${occ}）` : ""}の UBM 兵庫支部会プロフィール`,
  path: `/members/${id}`,
  ogImagePath: ogUrl,                  // 未設定時は内部で DEFAULT_OG_IMAGE
  twitterCard: "summary_large_image",  // summary → 大判へ戻す（AC-7）
});
```

### 5-4. `apps/web/wrangler.toml`

各環境 `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に追加:

```toml
OG_IMAGE_BASE_URL = "https://ubm-hyogo-og(.staging).daishimanju.workers.dev"
```

加えて #1027 の現状コメント（「動的 OG 未導入」）を「OG 専用 worker 経由で復活」に更新する。

## 6. CI 設計（`.github/workflows/og-cd.yml`）

- トリガ: `apps/og/**` 変更時。`web-cd.yml` を踏襲。
- jobs: build（`pnpm --filter @ubm-hyogo/og build`）→ size gate（`WORKER_FILE` を OG bundle に指定して `scripts/check-worker-size.sh`）→ deploy（`scripts/cf.sh deploy --config apps/og/wrangler.toml --env <env>`）。
- size gate を **deploy 前**に置き、3MiB 超で fail。

## 7. SubAgent lane（Phase 4 以降の作成分担）

| lane | 担当 phase 仕様書 | 並列 |
|------|------------------|------|
| lane-1 | phase-4 / phase-5 / phase-6 / phase-7 | par |
| lane-2 | phase-8 / phase-9 / phase-10 / phase-11 | par |
| lane-3 | phase-12（6 成果物）/ phase-13 | par |
| validation | gate 実行（直列で締め） | seq |

## 8. リスクと対策

| リスク | 対策 |
|--------|------|
| `workers-og` の wasm 初期化が wrangler 環境で失敗 | Phase 4 冒頭 smoke。失敗時 satori + `@resvg/resvg-wasm` 直叩きへ切替（Phase 2 決定済み） |
| OG worker bundle が 3MiB 超 | フォント subset / 1 weight 化。Phase 7 で実測し超過時は subset 縮小 |
| `apps/web` 回帰ガードを誤って壊す | `apps/web` には `next/og` を一切入れない。OG 参照は URL 文字列のみ |
| service binding 未設定環境での 取得失敗 | `PUBLIC_API_BASE_URL` fetch フォールバック + default 画像フォールバック |
| OKLch トークンと OG 内配色のドリフト | `BRAND_COLORS` 定数に tokens.css 由来コメントを付け、design-token gate 対象外であることを明記 |
