# Implementation Guide — ut-05a-fetchpublic-service-binding-001

## Part 1: 中学生レベルの説明

### 何をするタスクか

ホームページ（`apps/web`）が、裏で動いているデータ提供役（`apps/api`）にデータを取りに行く
やり方を、もっと近道にする作業です。これまでは「家の電話を一度家の外まで持って出て、
そこから自分の家にかけ直す」みたいな遠回りをしていて、その途中で電話が切れて
「ページが開けない（500 エラー）」になっていました。今回はその電話を「同じ建物の中の
内線電話」に切り替えて、確実につながるようにします。

### service-binding って何

Cloudflare Workers で、別の Worker（ここでは `apps/api`）に**外のインターネットを通らず**に
直接呼びかける仕組みです。

たとえに直すと:

- **外線電話（HTTP fetch）**: 一度家を出て、外の電話ボックスから自分の家の電話番号を押す。
  途中で電波が悪いとつながらない。今回 500 エラーになっていた原因はこれ。
- **内線電話（service-binding）**: 同じ建物の中で、内線番号を押すだけでつながる。
  外の天気に左右されない。これに切り替えるのが今回の作業。

### loopback subrequest って何

「自分の家の電話を、家の外まで一度出てから、自分の家にかけ直す」やり方のこと。
Cloudflare の中で同じアカウントの workers.dev に対してこれをすると、404 になることが
あって、それが今回の 500 エラーの原因でした。

### local（自分のパソコン）ではどうするか

自分のパソコンで動かすときは「内線電話（service-binding）」が使えないので、
これまで通り「外線電話（HTTP fetch）」を使います。コードは「内線が使えるなら内線、
使えないなら外線」と自動で切り替えるようにします（fallback）。

### 専門用語セルフチェック

| 用語 | やさしい説明 |
| --- | --- |
| service-binding | 同じ建物の中の内線電話。Worker 同士を直接つなぐ |
| loopback subrequest | 自分の家を出て自分の家にかけ直す遠回り。これが 404 になっていた |
| HTTP fallback | 内線が使えないとき外線（ふつうの HTTP fetch）を使う仕組み |
| wrangler tail | Cloudflare の電話の通話記録をリアルタイムで覗く道具 |
| transport label | 通話記録に「内線で通じたよ」と残すしるし。`transport: 'service-binding'` がそれ |
| `bash scripts/cf.sh` | Cloudflare に話しかけるときの正しい受付窓口。直接 `wrangler` を呼んではいけない |

## Part 2: 技術者向け

### 変更ファイル一覧

| file | 変更内容 |
| --- | --- |
| `apps/web/src/lib/fetch/public.ts` | service-binding を優先し、`env.API_SERVICE` 未注入時のみ `PUBLIC_API_BASE_URL` 経由 HTTP fetch にフォールバックする分岐へ書き換え |
| `apps/web/wrangler.toml` | `[[env.staging.services]]` / `[[env.production.services]]` に `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging" / production `service = "ubm-hyogo-api"`` を確認・追加 |

`apps/api` 側のルーティング、`apps/web/src/lib/auth.ts` の `fetchSessionResolve`
（既存 service-binding pattern）には変更なし。

### 関数シグネチャと分岐ロジック

`fetchPublic(path, options?)` / `fetchPublicOrNotFound(path, options?)`:

1. `getCloudflareContext().env.API_SERVICE` が注入されていれば
   `env.API_SERVICE.fetch("https://service-binding.local" + path, init)` を呼ぶ（service-binding 経路）
2. 未注入（local `pnpm dev` など）であれば
   `fetch(PUBLIC_API_BASE_URL + path, init)` を呼ぶ（HTTP fallback）
3. `fetchPublic` は非 OK 応答で `Error("fetchPublic failed: ...")` を throw する既存契約を維持する
4. `fetchPublicOrNotFound` は 404 のみ `FetchPublicNotFoundError` へ変換し、呼び出し側が `notFound()` に変換できる既存契約を維持する

両経路とも `Accept: application/json` と `revalidate` option を維持する。public read API は
Auth.js session resolve と異なり cookie / `x-forwarded-*` を追加で組み立てない。

### `wrangler.toml` 差分（要点）

```toml
[[env.staging.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api-staging"

[[env.production.services]]
binding = "API_SERVICE"
service = "ubm-hyogo-api"
```

### Deploy & verification 手順

```bash
# 認証確認（実値は出さない）
bash scripts/cf.sh whoami

# ローカル品質ゲート
mise exec -- pnpm typecheck
mise exec -- pnpm --filter web build:cloudflare

# staging deploy → curl → tail
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/
curl -s -o /dev/null -w "%{http_code}\n" https://<staging>/members
bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging
# tail で `transport: 'service-binding'` ログを複数件確認

# production deploy（user 明示指示後のみ）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
curl -s -o /dev/null -w "%{http_code}\n" https://<production>/
curl -s -o /dev/null -w "%{http_code}\n" https://<production>/members

# local fallback regression 確認
mise exec -- pnpm --filter web dev
# `PUBLIC_API_BASE_URL` 経由で `/public/stats` `/public/members` が 200
```

### AC ↔ evidence path 対応表

| AC | 内容 | evidence path |
| --- | --- | --- |
| AC-1 | `apps/web/src/lib/fetch/public.ts` が service-binding 優先 + HTTP fallback | `outputs/phase-11/code-diff-summary.md` |
| AC-2 | `apps/web/wrangler.toml` services に `binding = "API_SERVICE"` | `outputs/phase-11/code-diff-summary.md` |
| AC-3 | staging `/` `/members` が 200 | `outputs/phase-11/staging-curl.log` |
| AC-4 | production `/` `/members` が 200 | `outputs/phase-11/production-curl.log` |
| AC-5 | `wrangler tail` で `transport: 'service-binding'` | `outputs/phase-11/wrangler-tail-staging.log` |
| AC-6 | local `pnpm dev` で HTTP fallback regression なし | `outputs/phase-11/local-dev-fallback.log` |
| AC-7 | focused unit test が service-binding / fallback / 404 contract を固定 | `apps/web/src/lib/fetch/public.test.ts` |

### Definition of Done

- AC-1〜AC-6 が全て PASS
- `redaction-checklist.md` PASS
- `artifacts.json` parity PASS
- Issue #387 が CLOSED のまま維持されている
- system spec（`task-workflow-active.md` / aiworkflow indexes）に決定記録が反映済み
- secret 値が PR diff / log に含まれていない

### 失敗時の切り分け

1. `env.API_SERVICE` undefined → `wrangler.toml` の services 設定と deploy 環境名を確認
2. service-binding 経由でも 4xx/5xx → API 側 route ハンドラのログを
   `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で取得
3. local fallback が壊れる → `.dev.vars` の `PUBLIC_API_BASE_URL` 設定と分岐ロジックを確認
