# Phase 4 — テスト作成（TDD Red）

[実装区分: implementation]

> 本 Phase は issue #1027「member 動的 OG 画像 — OG 専用 Worker 分離（Free プラン維持）」の TDD Red フェーズ仕様。
> ここではテストスイートの構造・ケース名・期待値・モック方針を確定する。実装コードは Phase 5 で記述する。
> 正本アーキテクチャは `index.md` / `phase-1.md`〜`phase-3.md` で確定済み。本 Phase はそれを前提とする。

---

## 4.0 前提と不変条件（テスト設計に効くもの）

| # | 不変条件 | テスト上の含意 |
|---|----------|----------------|
| INV-1 | 既存 API surface のみ利用（新 endpoint / 新フィールド追加禁止） | member 取得は `GET /public/members/:id` の現行レスポンス（`fullName` / `occupation`）のみ参照。テストのモックも現行 shape で固定する。 |
| INV-2 | `apps/web` から D1 直接アクセス禁止 | OG worker は member 取得を service binding / fetch 経由に限定。テストで D1 binding を mock しない（存在しないことを前提）。 |
| INV-3 | `apps/web` に `next/og` / `ImageResponse` を入れない | 回帰ガード `rg "next/og\|ImageResponse" apps/web` が 0 件であることをテスト化。 |
| INV-4 | test は `*.spec.ts` のみ（`*.test.ts` 禁止） | 新規テストファイルは全て `*.spec.ts` / `*.spec.tsx`。 |
| INV-5 | フォールバック必須（不明 member / API 失敗時も 200） | OG worker は例外時でも `200 image/png`（default OG 画像）を返す。エラーで 4xx/5xx を返さない。 |

---

## 4.1 wasm 初期化 smoke（最初に書く・Red の起点）

`workers-og`（内部で satori + `@resvg/resvg-wasm` を使う）は Workers ランタイム外（vitest / Node）で wasm 初期化に失敗しうる。
**最初にこの smoke を書き、グリーンにできるかでレンダリング経路の採否を決める。**

- ファイル: `apps/og/src/__tests__/render-smoke.spec.ts`
- ケース:
  - `OG-SMOKE-1`: `renderMemberOg({ fullName: "山田 太郎", occupation: "デザイナー" })` が `Uint8Array`（PNG bytes, length > 0）を解決する。
  - `OG-SMOKE-2`: 返り値先頭バイトが PNG シグネチャ `0x89 0x50 0x4E 0x47`（`\x89PNG`）である。
- フォールバック方針（smoke が `workers-og` で失敗した場合）:
  - レンダリング層を `workers-og` 単体から **`satori`（SVG生成）+ `@resvg/resvg-wasm`（SVG→PNG）の直叩き** へ切り替える。
  - その場合も公開シグネチャ `renderMemberOg(summary): Promise<Uint8Array>` は不変に保ち、本 smoke のケース名・期待値は据え置く（実装差し替えのみ）。
  - vitest 環境では root `vitest.config.ts` を再利用し、wasm ロード部は smoke test と runtime build で担保する。

---

## 4.2 OG worker unit テスト

ファイル: `apps/og/src/__tests__/router.spec.ts`（Hono ルーターの統合的 unit テスト）

共通モック方針:
- member 取得層 `member-source.ts` の `fetchMemberSummary(id, env)` を **vi.mock でスタブ化**し、API 実通信を排除する。
  - 成功: `{ fullName: "山田 太郎", occupation: "デザイナー" }` を resolve。
  - 不明 member: `null` を resolve（API が 404 を返したケースに相当）。
  - API 失敗: `fetchMemberSummary` が throw、または `null` を resolve（実装では throw を内部で握り潰し null 化する方針も可。テストは両系統を別ケースで検証）。
- `app.request(path, init, env)` 形式（Hono のテストユーティリティ）で `Response` を得る。env には service binding スタブ or `PUBLIC_API_BASE_URL` を渡す。

| ケースID | リクエスト | モック | 期待 |
|----------|-----------|--------|------|
| OG-U-1 | `GET /members/abc123` | summary 成功 | `status === 200`、`Content-Type === image/png`、body length > 0、PNG シグネチャ一致 |
| OG-U-2 | `GET /members/abc123`（画像寸法） | summary 成功 | 生成 PNG の幅 1200 × 高さ 630（resvg メタ or 既知の固定サイズで検証。寸法直接検証が困難な場合は `render` 呼び出し時の引数 `{ width: 1200, height: 630 }` を spy で検証） |
| OG-U-3 | `GET /members/unknown` | summary が `null` | `status === 200`、`Content-Type === image/png`（**default OG 画像へフォールバック**）。member 名がレンダリングされない（default 経路が選択されたことを spy / 分岐フラグで検証） |
| OG-U-4 | `GET /members/abc123`（API 失敗） | `fetchMemberSummary` が throw | `status === 200`、`Content-Type === image/png`（default フォールバック）。例外が worker 外に漏れない |
| OG-U-5 | `GET /health` | — | `status === 200`、`Content-Type` に `application/json`、body が `{ "status": "ok" }`（または `ok: true`。Phase 5 で health の正本 shape を確定し本ケースに固定） |
| OG-U-6 | `GET /members/`（id 欠落） | — | ルート未マッチ → `404`（Hono デフォルト）。OG 画像は返さない |
| OG-U-7 | `GET /unknown-path` | — | `404` |

補足:
- OG-U-2 の寸法検証は、PNG ヘッダ（IHDR チャンク offset 16〜23）から width/height を読む小ヘルパをテスト内に置くか、`render` への引数 spy を正とする。Phase 5 の `render.tsx` シグネチャに合わせて確定する。
- Cache-Control 等のヘッダ検証は Phase 6（テスト拡充）で扱う。

---

## 4.3 member 取得層（member-source）の falsy ガード網羅

`member-source.ts` は service binding 優先・`PUBLIC_API_BASE_URL` fetch フォールバックの分岐を持つ。
URL / binding 未設定時のガード（`if (!url)` 等）の **全 falsy パターンを列挙**してテストする。

ファイル: `apps/og/src/__tests__/member-source.spec.ts`

| ケースID | env 状態 | 期待 |
|----------|----------|------|
| MS-1 | `API_SERVICE`（service binding）あり | binding.fetch 経由で取得。`PUBLIC_API_BASE_URL` を参照しない |
| MS-2 | binding なし・`PUBLIC_API_BASE_URL` 有効 URL | グローバル fetch で `${base}/public/members/:id` を取得 |
| MS-3 | binding なし・`PUBLIC_API_BASE_URL = undefined` | `null` を返す（フォールバック画像経路へ）。fetch を呼ばない |
| MS-4 | binding なし・`PUBLIC_API_BASE_URL = null` | 同上（null） |
| MS-5 | binding なし・`PUBLIC_API_BASE_URL = ""`（空文字） | 同上（null）。空文字は falsy として弾く |
| MS-6 | binding なし・`PUBLIC_API_BASE_URL = "   "`（空白のみ） | 同上（null）。`.trim()` 後 falsy として弾く |
| MS-7 | fetch が `404` | `null`（不明 member） |
| MS-8 | fetch が `500` / ネットワーク例外 | `null`（または throw。Phase 5 の握り潰し方針に合わせ確定。テストは「worker が 200 フォールバックできる入力」を返すことを保証） |
| MS-9 | fetch 成功・JSON に `fullName` のみ存在 `occupation` 欠落 | `{ fullName, occupation: undefined }`（部分欠落でもレンダリング可能な shape） |

> ガード対象の falsy 集合: `undefined` / `null` / `""` / `"   "`（空白のみ）。`if (!url)` だけでは空白を弾けないため `url?.trim()` を正とする方針を MS-6 で固定する。

---

## 4.4 apps/web 統合テスト

### 4.4.1 `buildMemberOgImageUrl`

ファイル: `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts`（既存があれば追記、なければ新規）

`getPublicEnv()` を vi.mock し、`OG_IMAGE_BASE_URL` の有無を切り替える。

| ケースID | `OG_IMAGE_BASE_URL` | 入力 id | 期待 |
|----------|---------------------|---------|------|
| WEB-1 | 未設定（undefined） | `"abc123"` | `buildMemberOgImageUrl("abc123") === undefined` |
| WEB-2 | `"https://og.example.com"` | `"abc123"` | `"https://og.example.com/members/abc123"`（絶対 URL） |
| WEB-3 | `"https://og.example.com/"`（末尾スラッシュ） | `"abc123"` | スラッシュ重複なし `"https://og.example.com/members/abc123"` |
| WEB-4 | `""`（空文字） | `"abc123"` | `undefined`（schema で optional・空は未設定扱い） |

### 4.4.2 member metadata 統合

ファイル: `apps/web/src/app/(public)/members/[id]/__tests__/page-metadata.spec.ts`（既存テスト構成に合わせ配置）

`generateMetadata` を呼び、OpenGraph / Twitter フィールドを検証する。`buildMemberOgImageUrl` をモックして OG URL の有無を制御。

| ケースID | OG URL | 期待 |
|----------|--------|------|
| WEB-META-1 | `"https://og.example.com/members/abc123"` | `metadata.openGraph.images` が OG URL を含む（`startsWith("http")` 分岐で絶対 URL がそのまま採用される） |
| WEB-META-2 | 同上 | `metadata.twitter.images` が OG URL を含む |
| WEB-META-3 | 同上 | `metadata.twitter.card === "summary_large_image"`（現状 `"summary"` から戻す） |
| WEB-META-4 | `undefined`（OG worker 未設定） | `openGraph.images` / `twitter.images` が `DEFAULT_OG_IMAGE` へフォールバック。例外を投げない |

### 4.4.3 回帰ガード（next/og 非混入）

ファイル: `apps/web/__tests__/opennext-config-regression.spec.ts`（既存・GREEN 維持）に追補、または新規 `apps/web/__tests__/no-next-og.spec.ts`

| ケースID | 検証 | 期待 |
|----------|------|------|
| WEB-REG-1 | `rg "next/og\|ImageResponse" apps/web/src` 相当の走査（テスト内で fs 走査 or 既存 regression 構造に合流） | マッチ 0 件 |
| WEB-REG-2 | `apps/web/package.json` の deps / devDeps に `next/og` を要求するパッケージ（`@vercel/og` 等）を含まない | 0 件 |

> 既存 `opennext-config-regression.spec.ts` が next/og 系の混入検知を担っている場合は、本 #1027 のスコープ（OG を別 worker へ分離）でその GREEN を壊さないことを CI で担保する。新規ガードを足す場合も既存ガードと役割が重複しないよう合流させる。

---

## 4.5 期待される Red 状態（このフェーズ終了時点）

- `apps/og` のソース実装済みのため `render-smoke` / `router` / `member-source` の全ケースが `import` 解決失敗 or 実装欠如で FAIL（Red）。
- `buildMemberOgImageUrl` 実装済みのため WEB-1〜4 が FAIL（Red）。
- member metadata 統合は `twitterCard` が現状 `"summary"` のため WEB-META-3 が FAIL（Red）。OG URL 経路未配線のため WEB-META-1/2 も FAIL。
- 回帰ガード WEB-REG-1/2 は **最初から GREEN**（next/og は元々 web に無い）。これは「実装で誤って web に next/og を入れていない」ことの常時監視。

## 4.6 DoD（Phase 4）

- 上記テストファイル・ケース名・期待値・モック方針が確定し、Phase 5 実装者がそのまま GREEN 化を目指せる粒度になっている。
- falsy ガード（4.3）の全パターンが列挙されている。
- 回帰ガード（4.4.3）が既存 `opennext-config-regression.spec.ts` と整合している。
