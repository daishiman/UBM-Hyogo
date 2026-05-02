# Implementation Guide

## Part 1: 中学生レベル

なぜ必要かというと、練習で動いた画面が本番と同じ道で動くとは限らないからです。たとえば学校祭のお店で、練習用の空箱だけを使うと、売り場の動きは確認できます。でも本番の日に本物の倉庫の鍵が合わなかったり、倉庫の場所を間違えたりすると、お客さんに商品を渡せません。何をするかというと、本番と同じ道で画面、受付、データ置き場をつないで試運転します。

このタスクで確かめたいのは同じことです。練習用の偽データで画面が動いても、本番と同じ道を通って本物のデータ置き場から会員情報を取れるとは限りません。だから公開ページを開く前に、画面、裏側の受付、本物のデータ置き場までの道を一度通して確認します。

やることは、開店前の試運転です。トップページ、会員一覧、会員詳細、登録ページを実際に開き、うまく返事が返るかを記録します。うまくいかなかった場合は、住所が間違っているのか、鍵がないのか、データが空なのかを切り分けます。

### 今回作ったもの

- 実行用の Phase 1-13 仕様書
- Phase 11 で保存する curl log / screenshot / HTML evidence の置き場所
- Phase 12 の7成果物と root / outputs `artifacts.json` の同期

| 専門用語 | 日常語での言い換え |
| --- | --- |
| mock | 練習用の偽の箱 |
| D1 | 本物のデータ置き場 |
| binding | 本物のデータ置き場を開ける鍵 |
| smoke | 開店前の短い試運転 |
| `PUBLIC_API_BASE_URL` | 裏側の受付へ行く住所 |

## Part 2: 技術者レベル

本 workflow は `apps/web -> apps/api -> D1` の実 Workers/D1 経路を local と staging の 2 環境で検証する実行仕様である。実測そのものは Phase 11 の user approval gate 後に実施し、この仕様作成 wave では runbook と evidence path を固定する。

### Runtime Contract

```ts
type SmokeTarget = {
  environment: "local" | "staging";
  webBaseUrl: string;
  apiBaseUrl: string;
  expectedRoutes: Array<{
    path: "/" | "/members" | "/members/:id" | "/register";
    expectedStatus: 200 | 404;
    evidencePath: string;
  }>;
};
```

### CLIシグネチャ

```bash
bash scripts/cf.sh <wrangler-subcommand> [args...]
curl -i <url>
rg "env.DB|D1Database" apps/web/app apps/web/src
```

### 使用例

```bash
PUBLIC_API_BASE_URL=http://localhost:8787 \
INTERNAL_API_BASE_URL=http://localhost:8787 \
pnpm --filter @repo/web dev

curl -i http://localhost:3000/members
rg "env.DB|D1Database" apps/web/app apps/web/src
```

主要 API 経路:

- `GET /public/members`: seeded member の存在確認。`items.length >= 1` を実 D1 主証跡にする。
- `GET /public/members/:id`: seeded ID で web `/members/{id}` が `200` を返すことを確認する。
- `GET /members/UNKNOWN`: 異常系 `404`。実 D1 主証跡ではなく route boundary 確認として扱う。

### Execution Boundary

- `wrangler` は直接呼ばず、必ず `bash scripts/cf.sh ...` 経由で起動する。
- local web 起動時は `PUBLIC_API_BASE_URL=http://localhost:8787` と `INTERNAL_API_BASE_URL=http://localhost:8787` を shell env で渡す。
- staging は `apps/web/wrangler.toml` の `[env.staging.vars] PUBLIC_API_BASE_URL` が staging API URL を指すことを evidence 化する。
- `apps/web` から `D1Database` / `env.DB` へ直接触れないことを `rg` で検証する。

### エラーハンドリング

`curl` が `5xx` を返す場合は API Worker / D1 binding / seed data の順に切り分ける。`4xx` の場合は route、auth、query validation を確認する。`scripts/cf.sh` で起動できない場合は 1Password env 注入、Node / pnpm version、esbuild binary path を確認する。

### エッジケース

| ケース | 期待する扱い |
| --- | --- |
| seeded member が 0 件 | Phase 11 NO-GO。mock と実 D1 の区別ができないため seed / migration 状態を確認する |
| staging vars が localhost を指す | Phase 11 NO-GO。staging API URL へ修正する別差分が必要 |
| `scripts/cf.sh` 経由でも esbuild mismatch | Phase 6 の異常系へ分岐し、wrapper と pinned binary を確認する |
| screenshot が取得できない | HTML evidence をフォールバックとして保存し、VISUAL evidence は後続実行で再取得する |

### 設定項目と定数一覧

| 項目 | 用途 |
| --- | --- |
| `PUBLIC_API_BASE_URL` | web から public API Worker へ向かう外向き URL |
| `INTERNAL_API_BASE_URL` | server-side fetch の API Worker URL |
| `DB` | apps/api Worker に注入される D1 binding |
| `CLOUDFLARE_API_TOKEN` | `scripts/cf.sh` が 1Password 経由で注入する Cloudflare API token |

### テスト構成

| 層 | 検証 |
| --- | --- |
| static | `rg "env.DB|D1Database" apps/web/app apps/web/src` |
| local smoke | local web/API 起動、公開4 route curl、seeded member 確認 |
| staging smoke | staging URL curl、staging screenshot、`PUBLIC_API_BASE_URL` 確認 |
