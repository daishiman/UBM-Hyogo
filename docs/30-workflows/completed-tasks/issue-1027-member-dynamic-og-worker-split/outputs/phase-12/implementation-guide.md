# Phase 12: 実装ガイド — member 動的 OG（OG 専用 Worker 分離）

`[実装区分: implementation]`
status: `implemented_local_runtime_pending`

## Part1: 中学生にもわかる説明

### なぜ必要なの？

SNS（X / Facebook / LINE / Slack など）に会員ページの URL を貼ると、
小さなプレビュー画像（サムネ）が出ます。これを **OGP 画像** と呼びます。
以前は「その会員の名前入りのサムネ」を毎回自動で描いていました。

ところが、その「絵を描く道具」がとても重く（約 1.5MB のプログラム部品）、
サイト本体（Cloudflare の無料サーバー）の **荷物の上限 3MB** を超えてしまい、
公開（デプロイ）が止まりました。応急処置として「共通の 1 枚の絵」に差し替えて、
今は会員ごとのサムネが出ない状態です（別タスク `web-worker-size-limit-fix` で対応済み）。

### どうするの？（例え話）

重い「絵を描く道具」を **サイト本体の倉庫から追い出し、専用の別の小屋に置く** ことにします。

- サイト本体（`apps/web`）= お店。荷物の上限 3MB を守りたい。
- OG 専用の小屋（新しい `apps/og`）= 絵を描く道具専用の作業小屋。**この小屋にも別枠で 3MB の上限がもらえる**ので、重い道具を置いても大丈夫。
- お店のページには「この会員のサムネは、あの作業小屋の住所（URL）にあるよ」とだけ書いておく。
- 月額のお金（Paid プラン）を払わなくても、無料のまま会員ごとのサムネが復活します。

### 何をするの？

1. 新しい作業小屋 `apps/og` を作る（絵を描く道具 `workers-og` を入れる）。
2. 「会員の id を渡すと、その会員の名前入りの絵（1200×630）を返す」窓口 `GET /members/:id` を作る。
3. お店（`apps/web`）の会員ページに「サムネは作業小屋の URL」と書く。
4. 公開の前に「作業小屋の荷物が 3MB を超えていないか」を自動で量る仕組み（CI）を付ける。

これで、無料のまま・サイト本体を太らせずに、会員ごとの SNS サムネが戻ります。

## Part2: 技術者向け実装詳細

### アーキテクチャ

OG 生成（satori + resvg-wasm ≒ 1.5MB）を新規 Worker `apps/og`(`@ubm-hyogo/og`) に隔離し、
main web Worker(`ubm-hyogo-web`) の Free 3MiB 予算を侵さない。各 Worker は独立した bundle 予算を持つ。
`apps/web` は OG 画像の **絶対 URL を metadata に書くだけ**で、`next/og` を一切 import しない（回帰ガード維持）。

### OG Worker 契約（`apps/og`）

```ts
// apps/og/src/index.ts (Hono)
const app = new Hono<{ Bindings: OgEnv }>();
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/members/:id", async (c) => {
  const id = c.req.param("id");
  const member = await fetchMemberSummary(c.env, id); // service binding or public fetch, read-only
  return renderMemberOg(member); // workers-og ImageResponse, 1200x630, image/png
});
export default app;

// 型
interface OgEnv {
  API_SERVICE?: Fetcher;        // service binding (staging/production)
  PUBLIC_API_BASE_URL?: string; // fallback fetch base
}
interface MemberOgSummary { fullName: string; occupation?: string }
```

- 失敗時（不明 member / API エラー / fetch 例外）は `renderDefaultOg()` を返し常に 200。
- `Content-Type: image/png` / `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`。

### apps/web 統合

```ts
// apps/web/src/lib/env.ts — publicEnvSchema に追加
OG_IMAGE_BASE_URL: z.string().url().optional(),

// apps/web/src/lib/seo/site-metadata.ts — 追加
export function buildMemberOgImageUrl(id: string): string | undefined {
  const base = getPublicEnv().OG_IMAGE_BASE_URL;
  return base ? `${base.replace(/\/$/, "")}/members/${encodeURIComponent(id)}` : undefined;
}

// apps/web/src/app/(public)/members/[id]/page.tsx — generateMetadata 内
return buildPageMetadata({
  title: profile.summary.fullName,
  description: `${profile.summary.fullName}${occ ? `（${occ}）` : ""}の UBM 兵庫支部会プロフィール`,
  path: `/members/${id}`,
  ogImagePath: buildMemberOgImageUrl(id),  // undefined → DEFAULT_OG_IMAGE
  twitterCard: "summary_large_image",
});
```

> `buildPageMetadata` の既存実装は `ogImagePath` 省略時に `/og-default.png` を採用し、`startsWith("http")` で絶対 URL を透過するため、追加分岐は不要。

### エラーハンドリングとエッジケース

| ケース | 挙動 |
|--------|------|
| `OG_IMAGE_BASE_URL` 未設定 | `buildMemberOgImageUrl` が `undefined` → 静的 `/og-default.png`（fail-open） |
| member 不明 / API 404 | OG worker が default 画像で 200 |
| API fetch 例外 / timeout | OG worker が default 画像で 200（throw しない） |
| `id` に特殊文字 | `encodeURIComponent` でエスケープ |
| OG bundle 3MiB 超 | CI `check-worker-size.sh` が deploy 前に FAIL |

### 設定可能パラメータ

| 名前 | 場所 | 既定 |
|------|------|------|
| `OG_IMAGE_BASE_URL` | `apps/web/wrangler.toml` [vars]（環境別） | OG worker 各環境 URL |
| `API_SERVICE` | `apps/og/wrangler.toml` services binding | `ubm-hyogo-api(-staging)` |
| `WORKER_SIZE_LIMIT_KIB` | CI env | 3072 |
| OG 寸法 | `apps/og/src/render.tsx` | 1200×630 |
| Cache-Control | `apps/og/src/index.ts` | max-age=3600 / s-maxage=86400 / stale-while-revalidate=604800 |
| OG フォント | `apps/og/src/render.tsx` | `workers-og` `loadGoogleFont()` による `Noto Sans JP` runtime subset |

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `issue-1027-member-dynamic-og-worker-split` |
| task_type | `VISUAL` / `implementation` |
| implementation_mode | `new` |
| architecture | OG 専用 Worker 分離（Free プラン維持・ユーザー決定済み） |
| GitHub Issue | #1027（OPEN 維持） |
| implementation_targets | 新規（apps/og: package.json/wrangler.toml/tsconfig.json/src{index.ts,render.tsx,member-source.ts}/__tests__×3）+ 編集 4（apps/web）+ CI 1（og-cd.yml）+ 編集 1（check-worker-size.sh: ディレクトリ合算対応）|

## 変更ファイル

| ファイル | 操作 | 内容 |
|---------|------|------|
| `apps/og/package.json` | 新規 | `@ubm-hyogo/og`（hono / workers-og 依存） |
| `apps/og/wrangler.toml` | 新規 | `ubm-hyogo-og` + staging/production + API_SERVICE binding |
| `apps/og/tsconfig.json` | 新規 | TS 設定 |
| `apps/og/src/index.ts` | 新規 | Hono ルーター（`/members/:id`, `/health`） |
| `apps/og/src/render.tsx` | 新規 | satori OG テンプレート + default |
| `apps/og/src/member-source.ts` | 新規 | member summary 取得（binding/fetch） |
| `apps/og/src/__tests__/*.spec.ts` | 新規 | OG worker unit テスト |
| `apps/web/src/lib/env.ts` | 編集 | `OG_IMAGE_BASE_URL` を publicEnvSchema に追加 |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集 | `buildMemberOgImageUrl()` 追加 |
| `apps/web/src/app/(public)/members/[id]/page.tsx` | 編集 | `ogImagePath` 切替 + `twitterCard` |
| `apps/web/wrangler.toml` | 編集 | `OG_IMAGE_BASE_URL` var + #1027 コメント更新 |
| `.github/workflows/og-cd.yml` | 新規 | OG worker CI（build/size gate/deploy） |
| `scripts/check-worker-size.sh` | 編集 | 位置引数にディレクトリを許容し配下 `*.js`/`*.wasm` を合算（OG worker の index.js + wasm を一括測定）。単一ファイル / OpenNext 無引数パスは後方互換 |

## テスト方針

- **OG worker unit**（`apps/og/src/__tests__/*.spec.ts`、`*.spec.ts` のみ）:
  - `/members/:id` 有効 member → `200` / `image/png`。
  - 不明 member / API 404 / fetch 例外 → default 画像 200。
  - `/health` → 200 json。
  - `fetchMemberSummary` の binding / fetch フォールバック分岐。
  - `Cache-Control` ヘッダ付与。
- **web 統合**（`apps/web` 既存テスト基盤）:
  - `buildMemberOgImageUrl`: 未設定→`undefined` / 設定→`<base>/members/<id>`（id エスケープ）。
  - member 詳細 `generateMetadata`: `og:image` / `twitter:image` が OG URL、`twitter:card=summary_large_image`。
- **回帰**: `apps/web/__tests__/opennext-config-regression.spec.ts` GREEN（`next/og` / `ImageResponse` 0 件）。
- **size**: web / og 双方の `check-worker-size.sh` PASS。

## ローカル実行・検証コマンド

```bash
# OG worker
mise exec -- pnpm --filter @ubm-hyogo/og install
mise exec -- pnpm --filter @ubm-hyogo/og typecheck
mise exec -- pnpm --filter @ubm-hyogo/og test
mise exec -- pnpm --filter @ubm-hyogo/og build
bash scripts/check-worker-size.sh apps/og/dist   # OG bundle (index.js + wasm 合算) 3MiB 確認

# web 側
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/check-worker-size.sh                                     # web bundle 3MiB 維持

# 回帰
rg -n "next/og|ImageResponse" apps/web/app apps/web/src   # 0 件であること

# 手動（実行サイクル）
curl -s -o /tmp/og.png "https://ubm-hyogo-og-staging.daishimanju.workers.dev/members/<id>" && file /tmp/og.png
```

## 完了条件（DoD）

- [ ] `apps/og` が新規パッケージとして追加され、`pnpm --filter @ubm-hyogo/og build` が成功する。
- [ ] OG worker bundle gzip が 3072KiB 以内（`check-worker-size.sh` PASS）。
- [ ] `apps/web` bundle gzip が 3072KiB 以内のまま（OG 追加で増えない）。
- [ ] `rg "next/og|ImageResponse" apps/web` が 0 件（回帰ガード GREEN）。
- [ ] `GET /members/:id` が有効 member で `200 image/png`(1200×630)、不明/失敗で default 画像 200。
- [ ] member 詳細 HTML の `og:image` / `twitter:image` が OG worker URL を指す。`twitter:card=summary_large_image`。
- [ ] `apps/web` の `OG_IMAGE_BASE_URL` 参照が `env.ts` アクセサ経由（`process.env` 直参照 0 件）。
- [ ] `og-cd.yml` が staging/production へ deploy し、deploy 前に size gate を通す。
- [ ] `pnpm typecheck` / `pnpm lint` 全 PASS。

## 視覚証跡

VISUAL タスク（VISUAL_ON_EXECUTION）。OG 画像は視覚成果物のため、本実装サイクル（Phase 11）で以下を `outputs/phase-11/screenshots/` に証跡化する:

- `member-og-image-named.png` — 有効 member の名前入り OG（1200×630）。
- `member-og-image-default.png` — 不明 member / フォールバック時の default OG。
- SNS シェアプレビュー（Twitter Card Validator 等）または `<meta>` 抽出結果。

> local Wrangler + mock API で `member-og-image-named.png` / `member-og-image-default.png` を取得済み。Cloudflare staging での SNS preview は user-gated runtime evidence として残す。

## 関連リンク

- Issue: [#1027](https://github.com/daishiman/UBM-Hyogo/issues/1027)（OPEN 維持）
- 元 unassigned task: `docs/30-workflows/unassigned-task/member-dynamic-og-paid-or-worker-split.md`
- Source workflow: `docs/30-workflows/completed-tasks/web-worker-size-limit-fix/`
- 関連クローズド Issue: #806（dynamic member OG 初版）
- 仕様: `docs/00-getting-started-manual/specs/08-free-database.md`
- 回帰ガード: `apps/web/__tests__/opennext-config-regression.spec.ts`
