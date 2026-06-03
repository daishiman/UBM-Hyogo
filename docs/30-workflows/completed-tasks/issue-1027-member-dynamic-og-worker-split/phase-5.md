# Phase 5 — 実装（TDD Green）

[実装区分: implementation]

> Phase 4 で Red になったテストを GREEN にする実装仕様。CONST_005 必須項目（変更対象ファイル / シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド / DoD）を本 Phase で網羅する。
> 正本アーキテクチャは `index.md` / `phase-1.md`〜`phase-3.md` で確定済み。本 Phase はそれを実装可能な粒度に落とす。

---

## 5.1 変更対象ファイル一覧（index.md 俯瞰表と整合）

### 新規作成（apps/og: 6 ファイル）

| # | パス | 役割 |
|---|------|------|
| N-1 | `apps/og/package.json` | パッケージ定義（`@ubm-hyogo/og`、deps: hono / workers-og、build / deploy scripts） |
| N-2 | `apps/og/wrangler.toml` | Worker 定義（`ubm-hyogo-og` / `-staging` / `-production`、service binding `API_SERVICE`、vars `PUBLIC_API_BASE_URL`） |
| N-3 | `apps/og/tsconfig.json` | TS 設定（workers-types / jsx satori 用 `jsxImportSource`） |
| N-4 | `apps/og/src/index.ts` | Hono ルーター本体（エントリ）。`GET /members/:id` / `GET /health` |
| N-5 | `apps/og/src/render.tsx` | workers-og レンダリング。`renderMemberOg(summary): Promise<Response>`。brand color 定数・HTML template |
| N-6 | `apps/og/src/member-source.ts` | member 取得層。`fetchMemberSummary(id, env): Promise<MemberSummary \| null>` |

> テストファイル（`src/__tests__/*.spec.ts`）は Phase 4 で定義済みで本枠とは別。テスト数を含めた最終ツリーは 5.8 に図示。

### 編集（apps/web: 4 ファイル）

| # | パス | 変更内容 |
|---|------|----------|
| E-1 | `apps/web/src/lib/env.ts` | `publicEnvSchema` に `OG_IMAGE_BASE_URL: z.string().url().optional()` 追加 |
| E-2 | `apps/web/src/lib/seo/site-metadata.ts` | `buildMemberOgImageUrl(id): string \| undefined` 追加（`getPublicEnv()` 経由） |
| E-3 | `apps/web/src/app/(public)/members/[id]/page.tsx` | `ogImagePath = buildMemberOgImageUrl(id)`、`twitter.card = "summary_large_image"` |
| E-4 | `apps/web/wrangler.toml` | 各環境 `[vars]` / `[env.staging.vars]` / `[env.production.vars]` に `OG_IMAGE_BASE_URL` + #1027 コメント |

### CI / スクリプト

| # | パス | 変更内容 |
|---|------|----------|
| C-1 | `.github/workflows/og-cd.yml`（新規） | build → size gate → deploy。size gate は `scripts/check-worker-size.sh` を `WORKER_FILE` 指定で OG bundle に適用 |
| C-2 | `scripts/check-worker-size.sh`（**後方互換で拡張**） | 位置引数にディレクトリを許容し配下 `*.js`/`*.wasm` を合算（`bash scripts/check-worker-size.sh apps/og/dist`）。index.js + wasm を一括測定し wasm/フォント肥大を捕捉。単一ファイル・OpenNext 無引数パスは不変 |

### 確認のみ（変更不要）

- `pnpm-workspace.yaml`: 既に `apps/*` glob 済み。`apps/og` 追加で自動認識される。**編集不要・存在確認のみ**。

---

## 5.2 `apps/og/src/member-source.ts`

```
export type MemberSummary = {
  fullName: string;
  occupation?: string;
};

export interface OgEnv {
  API_SERVICE?: Fetcher;          // service binding（推奨経路）
  PUBLIC_API_BASE_URL?: string;   // fetch フォールバック
}

export async function fetchMemberSummary(
  id: string,
  env: OgEnv,
): Promise<MemberSummary | null>;
```

挙動:
1. `id` を encodeURIComponent。空 id は呼び出し側でルート未マッチ（5.3）。
2. 取得経路の選択:
   - `env.API_SERVICE` が存在 → `env.API_SERVICE.fetch(new Request("https://api.internal/public/members/" + id))`（service binding。host はダミー、binding がルーティング）。
   - なければ `base = env.PUBLIC_API_BASE_URL?.trim()`。`if (!base) return null;`（falsy ガード: undefined/null/""/空白）→ default フォールバックへ。
   - `fetch(`${base}/public/members/${id}`)`。
3. レスポンス評価:
   - `res.status === 404` → `return null`。
   - `!res.ok` → `return null`（API 失敗を握り潰し、worker は default 200 を返せる）。
   - `res.ok` → JSON parse。`{ fullName: data.fullName, occupation: data.occupation }` を返す。`fullName` 欠落時は `return null`（描画できない）。
4. fetch 自体の例外（ネットワーク）→ try/catch で握り潰し `return null`。

副作用: 外部 HTTP（read-only GET）のみ。新フィールド・新 endpoint 追加なし（INV-1）。

---

## 5.3 `apps/og/src/index.ts`（Hono ルーター）

```
import { Hono } from "hono";
import { fetchMemberSummary, type OgEnv } from "./member-source";
import { renderMemberOg, renderDefaultOg } from "./render";

const app = new Hono<{ Bindings: OgEnv }>();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/members/:id", async (c) => {
  const id = c.req.param("id");
  let png: Uint8Array;
  try {
    const summary = await fetchMemberSummary(id, c.env);
    png = summary ? await renderMemberOg(summary) : await renderDefaultOg();
  } catch {
    png = await renderDefaultOg();   // フォールバック（INV-5）
  }
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
});

export default app;
```

要点:
- いかなる失敗でも `200 image/png`（default OG）を返す。4xx/5xx を返さない（INV-5）。
- `/members/`（id 欠落）や不明パスは default OG 画像 200 に寄せ、crawler preview を fail-open する。
- Cache-Control の具体値は Phase 6 で検証し、実装では成功/default とも `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` に統一する。

---

## 5.4 `apps/og/src/render.tsx`（satori + resvg）

```
export async function renderMemberOg(summary: MemberSummary): Promise<Response>;
export async function renderDefaultOg(): Promise<Response>;
```

- `workers-og` の `ImageResponse` を使用し、1200×630 PNG の `Response` を返す。
- フォント: 専用フォント資産は同梱せず、`workers-og` の `loadGoogleFont()` で `Noto Sans JP` の必要文字サブセットを runtime cache 経由で読み込む。日本語 member 名 / default OG の豆腐化を防ぎつつ bundle size gate には固定バイナリを追加しない。
- `BRAND_COLORS` 定数（tokens.css 由来。satori は CSS 変数非対応のため値を複製）:

```
// NOTE: tokens.css の OKLch トークンを satori 用に複製した値。
// satori は CSS custom property (var(--x)) を解決できないため、ここで確定値を持つ。
// tokens.css 側を更新した場合は本定数も手動同期すること（#1027）。
const BRAND_COLORS = {
  background: "...",  // --color-bg 相当
  foreground: "...",  // --color-fg 相当
  accent: "...",      // --color-accent 相当
} as const;
```

- レイアウト: 背景 `background`、上部に支部名 / ロゴ相当テキスト、中央に `fullName`（大）、下に `occupation`（小・省略可）。`renderDefaultOg` は member 名なしの汎用カード。
- 入出力: 純関数的（同一 summary → 同一 PNG）。副作用なし（フォント読込は module load 時 1 回）。

---

## 5.5 `apps/web` 編集詳細

### E-1 `env.ts`
`publicEnvSchema`（zod object）に 1 行追加:
```
OG_IMAGE_BASE_URL: z.string().url().optional(),
```
`getPublicEnv()` の返り型に自動反映。空文字はそのままだと `.url()` で弾かれるため、空文字を許容したい場合は `.url().or(z.literal("")).optional()` とし、後段（5.5 E-2）で空を undefined 化する。WEB-4 ケースに合わせ確定。

### E-2 `site-metadata.ts`
```
export function buildMemberOgImageUrl(id: string): string | undefined {
  const base = getPublicEnv().OG_IMAGE_BASE_URL?.trim();
  if (!base) return undefined;                      // 未設定 → DEFAULT_OG_IMAGE フォールバック
  return `${base.replace(/\/$/, "")}/members/${encodeURIComponent(id)}`;
}
```
- 末尾スラッシュ正規化（WEB-3）。空文字 / 空白は undefined（WEB-1/WEB-4）。
- 既存の `ogImagePath.startsWith("http")` 分岐をそのまま活かす（絶対 URL はそのまま採用、相対は base URL 連結）。

### E-3 `members/[id]/page.tsx`（`generateMetadata`）
- `const ogImagePath = buildMemberOgImageUrl(id);`（undefined なら既存 `DEFAULT_OG_IMAGE` フォールバックに合流）。
- `twitter.card` を `"summary"` → `"summary_large_image"` に戻す（WEB-META-3）。
- `openGraph.images` / `twitter.images` は既存ロジック経由で `ogImagePath`（または default）を採用。

### E-4 `wrangler.toml`
- `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 各々に:
```
# #1027: 動的 OG 画像を OG 専用 Worker (ubm-hyogo-og) に委譲する base URL。
OG_IMAGE_BASE_URL = "https://<og-worker-route>"   # 環境別に置換
```
- 既存 #1027 関連コメントがあれば更新。

---

## 5.6 `apps/og/wrangler.toml` 方針

- `name = "ubm-hyogo-og"`、`main = "src/index.ts"`、`compatibility_date` は他 worker と整合。
- `[env.staging]` → `name = "ubm-hyogo-og-staging"`、`[env.production]` → `name = "ubm-hyogo-og-production"`。
- service binding（推奨）: `[[services]] binding = "API_SERVICE" service = "ubm-hyogo-api"`（環境別に `-staging` / `-production`）。
- vars: `PUBLIC_API_BASE_URL`（service binding が無い環境のフォールバック）。
- wasm / フォント資産はバンドルに含める（`rules` で `.woff` を Data として読む or import）。

## 5.7 `apps/og/package.json` / `tsconfig.json` 方針

- `package.json`: `"name": "@ubm-hyogo/og"`、`"private": true`、scripts: `build`（wrangler / esbuild で `dist/index.js` 生成）、`deploy`（`scripts/cf.sh` 経由）、`test`（vitest）、`typecheck`。deps: `hono`、`workers-og`（または `satori` + `@resvg/resvg-wasm`）。devDeps: `wrangler`、`vitest`、`@cloudflare/workers-types`。
- `tsconfig.json`: `jsx: "react-jsx"`、`types: ["@cloudflare/workers-types"]`。
- Vitest は root config を `--root=../.. --config=vitest.config.ts apps/og` で再利用する。

## 5.8 最終ディレクトリツリー（実コード）

```
apps/og/
├── package.json
├── wrangler.toml
├── tsconfig.json
└── src/
    ├── index.ts            # Hono router
    ├── render.tsx          # workers-og + brand colors
    ├── member-source.ts    # fetchMemberSummary
    └── __tests__/
        ├── render-smoke.spec.ts
        ├── router.spec.ts
        └── member-source.spec.ts
```

## 5.9 ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/og test         # OG worker unit
mise exec -- pnpm --filter @ubm-hyogo/og typecheck
mise exec -- pnpm --filter web test -- site-metadata page-metadata   # web 統合
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 回帰ガード
mise exec -- pnpm --filter web test -- opennext-config-regression
rg "next/og|ImageResponse" apps/web/src   # 0 件であること
```

## 5.10 DoD（Phase 5）

- Phase 4 の全 Red ケースが GREEN（smoke / router / member-source / web 統合 / metadata）。
- 回帰ガード GREEN（next/og が web に無い）。
- `pnpm typecheck` / `pnpm lint` がモノレポ全体で pass。
- `BRAND_COLORS` に tokens.css 由来である旨と手動同期義務のコメントがある。
- `scripts/check-worker-size.sh` のディレクトリ合算分岐は後方互換（既存の単一ファイル / OpenNext 無引数パスを破壊しない・shellcheck PASS）。
