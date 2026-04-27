# UT-12 Implementation Guide — Cloudflare R2 ストレージ

> 本ガイドは Part 1（中学生レベル概念説明）と Part 2（技術詳細）の 2 部構成で、将来のファイルアップロード実装タスク（future-file-upload-implementation）が迷わず着手できるよう設計されている。

---

## Part 1: 中学生レベル概念説明（日常の例え話）

### なぜ R2 ストレージが必要か

UBM サイトでは、会員の写真や PDF 書類などのファイルを安全に保存する場所が必要です。データベース（D1）はテキスト情報には向いていますが、大きなファイルを扱うには「ファイル専用の置き場所」が必要になります。Cloudflare R2 はその役割を担います。

### 何が変わるか

R2 を使うことで、ファイルをインターネット上の専用倉庫に保存できるようになります。これにより、将来のファイルアップロード機能（future-file-upload-implementation）の土台が整います。

### 日常の例えで理解する R2

たとえば、学校に例えると：
- **R2 = 学校の倉庫**（大きな荷物を預かってくれる場所）
- **バケット = 倉庫の中の棚**（「本番用」と「練習用」で棚を分けている）
- **API Token = 倉庫の鍵**（特定の棚しか開けられない専用の鍵）
- **CORS = 受付ルール**（どの教室からの荷物を受け取るか決めたルール）

このイメージを持つと、次の説明が理解しやすくなります。

### R2 = インターネット上の倉庫

Cloudflare R2 は、インターネットの向こう側にある大きな倉庫のようなものです。写真や PDF などの「荷物」を置いておき、必要なときに取り出して使います。自分の家のタンスに入れるのと違い、世界中のどこからでも荷物を出し入れできるのが特徴です。

### バケット = 倉庫の中の部屋（本番用 / 練習用）

倉庫の中は「部屋」で区切られていて、UBM では **本番用の部屋（`ubm-hyogo-r2-prod`）** と **練習用の部屋（`ubm-hyogo-r2-staging`）** を分けています。練習中の荷物を本番に間違って置く事故を防ぐためで、部屋を分けるだけでもとても安全になります。

### API Token = 鍵（最低限の部屋しか開けない）

倉庫の鍵（API Token）は、どの部屋を開けられるかを限定して作ります。UBM では「R2 の部屋しか開けられない専用の鍵」を新しく作る方針にしました（採用案 D）。万が一鍵をなくしても、被害が一つの部屋だけで済むようにする工夫です。これを最小権限といいます。

### CORS = どのお店から荷物を運び込んでよいかのルール

倉庫には「どのお店からの荷物を受け付けてよいか」を書いた受付ルールがあります。これが CORS です。許可していないお店から届いた荷物は門前払いします。UBM では本番のお店と練習のお店を別々に登録し、知らないお店からの荷物は受け取らないようにします。

### 無料枠 = 1 か月の開け閉め回数の上限 / UT-17 と組み合わせ

倉庫を「ひと月に何回開け閉めしていいか」という上限が決まっています（無料枠）。上限に近づいたら知らせてくれる仕組み（UT-17 のアラート）と組み合わせて、気づかずに超えてお金を払う事故を防ぎます。

### 今回作ったもの

- `ubm-hyogo-r2-prod` / `ubm-hyogo-r2-staging` バケットの命名規約と作成 Runbook
- `wrangler.toml` への R2 バインディング差分定義（環境別）
- 専用 API Token の最小権限スコープ方針（採用案 D）
- CORS JSON テンプレート（AllowedOrigins はプレースホルダ、UT-16 完了後に確定）
- 下流実装タスク（future-file-upload-implementation）への申し送り書

---

## Part 2: 技術詳細

### 2-1. `wrangler.toml` schema（production / staging 完全版）

```toml
# apps/api/wrangler.toml — R2 バインディング部分のみ抜粋

name = "ubm-api"
main = "src/index.ts"
compatibility_date = "2026-04-01"

[env.production]
# 既存 D1 バインディング等は省略

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
preview_bucket_name = "ubm-hyogo-r2-staging"

[env.staging]

[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"
preview_bucket_name = "ubm-hyogo-r2-staging"
```

> 不変条件 5 に基づき、`apps/web` には R2 バインディングを設定しない。R2 アクセスは `apps/api` に閉じる。

### 2-2. CORS JSON テンプレ（環境別 AllowedOrigins / プレースホルダ）

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- `<env-specific-origin>` は production / staging で別ファイル管理
- production: 公開ドメインの URL（UT-16 完了後に正式値へ更新）
- staging: staging サブドメインの URL
- 機密性の観点から実値はリポジトリにコミットせず、`1Password Environments` を正本とする

### APIシグネチャ（R2 Workers binding / TypeScript 型）

```ts
// apps/api/src/types.ts（不変条件 5: D1 / R2 直接アクセスは apps/api に閉じる）
export interface Env {
  R2_BUCKET: R2Bucket;
}

// PUT — オブジェクト書き込み
await env.R2_BUCKET.put(key, body, {
  httpMetadata: { contentType },
  customMetadata: { uploadedBy: userId },
});

// GET — オブジェクト取得（戻り値は R2ObjectBody | null）
const obj = await env.R2_BUCKET.get(key);
if (obj === null) {
  return new Response("Not Found", { status: 404 });
}
return new Response(obj.body, {
  headers: { "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream" },
});

// DELETE — オブジェクト削除
await env.R2_BUCKET.delete(key);

// LIST — プレフィックス一覧
const list = await env.R2_BUCKET.list({ prefix: "uploads/", limit: 100 });
```

### 使用例

`apps/api` ルートハンドラでのファイルアップロード・取得例：

```ts
// PUT: ファイルアップロード（Hono ルートハンドラ例）
app.put("/files/:key", async (c) => {
  const key = c.req.param("key");
  const body = c.req.raw.body;
  const contentType = c.req.header("Content-Type") ?? "application/octet-stream";
  await c.env.R2_BUCKET.put(key, body, { httpMetadata: { contentType } });
  return c.json({ ok: true, key });
});

// GET: ファイル取得
app.get("/files/:key", async (c) => {
  const key = c.req.param("key");
  const obj = await c.env.R2_BUCKET.get(key);
  if (!obj) return c.notFound();
  return new Response(obj.body, {
    headers: { "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream" },
  });
});
```

```bash
# wrangler CLI でのオブジェクト操作確認
wrangler r2 object get ubm-hyogo-r2-staging uploads/test.txt --env staging
wrangler r2 object put ubm-hyogo-r2-staging uploads/test.txt --file ./test.txt --env staging
wrangler r2 object delete ubm-hyogo-r2-staging uploads/test.txt --env staging
```

### エラーハンドリング

| エラー条件 | 原因 | 対処 |
| --- | --- | --- |
| `R2_BUCKET` binding が undefined | `wrangler.toml` の binding 未設定 / デプロイ前に local env が未設定 | `.dev.vars` に `R2_BUCKET` を追加、または `wrangler dev --remote` で実 bucket を使用 |
| PUT が 403 | API Token の権限不足 | Token に `Account > Workers R2 Storage > Edit` 権限を付与 |
| CORS エラー（preflight 失敗） | `AllowedOrigins` に要求元ドメインが未登録 | `wrangler r2 bucket cors put` で AllowedOrigins を更新 |
| `get()` が null | 指定キーのオブジェクトが存在しない | 404 を返す / アップロード前に存在確認ロジックを追加 |
| Token 漏洩疑い | Secrets が外部流出した可能性 | Cloudflare Dashboard で Token を即時 Revoke → 1Password で新規発行 |

### エッジケース

| ケース | 対応方針 |
| --- | --- |
| 同一キーに PUT を重複実行 | R2 は上書き可能。意図しない上書きを防ぐ場合は事前に `HEAD` でキー存在確認 |
| オブジェクトサイズが大きい（100MB 超） | Multipart Upload を使用（Workers binding の `createMultipartUpload()` API） |
| staging bucket で production データを誤使用 | binding 名は両環境とも `R2_BUCKET` だが `wrangler.toml` で env 別 bucket_name を固定するため誤指定は起きない |
| `AllowedOrigins` に `*` を設定 | 本番では禁止。プレースホルダ `<env-specific-origin>` を使い環境別に限定 |
| 無料枠超過 | Class A: 100万req/月、Class B: 1000万req/月、Storage: 10GB が上限。UT-17 アラートで事前検知 |

### 設定項目と定数一覧

| 定数 / 設定項目 | 値 | 管理場所 |
| --- | --- | --- |
| production bucket | `ubm-hyogo-r2-prod` | `wrangler.toml` `env.production` |
| staging bucket | `ubm-hyogo-r2-staging` | `wrangler.toml` `env.staging` |
| Workers binding 名 | `R2_BUCKET` | `wrangler.toml` / `apps/api/src/types.ts` の `Env` interface |
| API Token 権限スコープ | `Account > Workers R2 Storage > Edit` | 採用案 D（専用 Token） |
| CORS MaxAgeSeconds | `3600` | `cors-*.json` CORS ルール |
| CORS AllowedMethods | GET, PUT, POST, HEAD | `cors-*.json` CORS ルール |
| 無料枠 Storage | 10 GB / 月 | Cloudflare 公式（UT-17 アラート対象） |
| 無料枠 Class A | 100 万 req / 月 | Cloudflare 公式（UT-17 アラート対象） |
| 無料枠 Class B | 1,000 万 req / 月 | Cloudflare 公式（UT-17 アラート対象） |

### テスト構成

本タスクは `spec_created`（docs-only）のため実コードは未適用。将来の実装タスクに向けたテスト方針を記録する。

| テスト種別 | 対象 | 手段 |
| --- | --- | --- |
| Unit（Mock） | Hono ルートハンドラ（PUT/GET/DELETE） | `R2Bucket` の mock object を注入（`vitest` + `vi.fn()`） |
| Integration（staging） | 実 bucket への PUT/GET/DELETE/LIST | `wrangler dev --remote --env staging` 経由で実行 |
| Smoke（manual） | CORS preflight / allowed / denied origin | `curl -X OPTIONS` で確認（`outputs/phase-11/manual-smoke-log.md` 参照） |
| Regression | binding 名 `R2_BUCKET` が wrangler.toml / types.ts で一致 | `grep` で定数不一致を CI で検出（実装タスク側で追加） |

NON_VISUAL タスクのため screenshot は不要。

### 2-4. Runbook 要約

#### A. バケット作成

```bash
mise exec -- pnpm --filter @ubm/api exec wrangler r2 bucket create ubm-hyogo-r2-staging
mise exec -- pnpm --filter @ubm/api exec wrangler r2 bucket create ubm-hyogo-r2-prod
```

#### B. Token 作成（採用案 D: 専用 Token 新規作成）

- Cloudflare Dashboard → My Profile → API Tokens → Create Token
- Permission: `Account` → `Workers R2 Storage` → `Edit`
- リソース: 該当 Account の R2 のみ（D1 / Workers KV 等は付与しない）
- 取得した Token は `1Password Environments` に保管し、`.env` 平文には書かない

#### C. CORS 適用

```bash
mise exec -- pnpm --filter @ubm/api exec wrangler r2 bucket cors put \
  ubm-hyogo-r2-staging --rules cors-staging.json --env staging

mise exec -- pnpm --filter @ubm/api exec wrangler r2 bucket cors put \
  ubm-hyogo-r2-prod --rules cors-production.json --env production
```

#### D. Smoke test（Phase 11 `manual-smoke-log.md` 参照）

- staging で PUT / GET / DELETE → CLI 出力テキストを実出力欄に追記
- curl OPTIONS で許可 / 不許可 origin の挙動確認
- `wrangler r2 bucket cors get` で適用済 JSON を突合

### 2-5. ロールバック手順サマリ

| 場面 | 手順 |
| --- | --- |
| バケット誤作成 | `wrangler r2 bucket delete <name>` で削除（事前に空であることを確認） |
| CORS 誤適用 | 直前バージョンの JSON を再 `cors put`、または `cors delete` で全消去後再適用 |
| Token 漏洩疑い | Cloudflare Dashboard で Token を即時 `Revoke`、`1Password Environments` で新規発行・差し替え、GitHub Secrets / Cloudflare Secrets を順次更新 |
| wrangler.toml 設定誤り | 直前コミットへ revert → `wrangler deploy --env staging` で再展開 |

### 2-6. MINOR 申し送り（Phase 10 から橋渡し）

- **AllowedOrigins 暫定値の正式更新**: UT-16（custom-domain）完了後、本番ドメイン確定値で `cors-production.json` を再適用する未タスクを `unassigned-task-detection.md` に記録済
- **無料枠通知経路の確定**: UT-17（Cloudflare Analytics alerts）着手時に R2 の Class A / Class B / Storage メトリクスをアラート対象に追加。閾値・通知チャネルは UT-17 側で確定
- **Presigned URL 発行ロジック**: アプリケーション層（`apps/api`）で実装。本タスクではバケット側準備のみ完了

### 2-7. AC 充足状況表

| AC | 内容 | 充足状況 | 主証跡パス |
| --- | --- | --- | --- |
| AC-1 | バケット命名（prod / staging）と作成 runbook が 01b と整合 | 充足 | `outputs/phase-05/r2-setup-runbook.md` |
| AC-2 | wrangler.toml `[[r2_buckets]]` バインディング差分定義 | 充足 | 本ガイド §2-1 / `outputs/phase-08/dry-applied-diff.md` |
| AC-3 | API Token スコープ判断（最小権限） | 充足（採用案 D） | `outputs/phase-02/token-scope-decision.md` |
| AC-4 | PUT / GET / DELETE smoke test 手順と証跡パス | 充足（手順確定 / 実行は実装タスク側） | `outputs/phase-11/manual-smoke-log.md` |
| AC-5 | CORS 設定 JSON と適用確認手順、ブラウザ直接アップロード経路の検証観点 | 充足 | 本ガイド §2-2 / `outputs/phase-11/manual-smoke-log.md` |
| AC-6 | 無料枠使用量モニタリング方針と UT-17 連携ポイント | 充足 | 本ガイド §2-6 / `outputs/phase-12/unassigned-task-detection.md` |
| AC-7 | バケット名・バインディング名の下流ドキュメント化 | 充足 | `outputs/phase-05/binding-name-registry.md` |
| AC-8 | パブリック / プライベート選択基準と UT-16 関係 | 充足（プライベート + Presigned URL / 採用案 F） | `outputs/phase-02/r2-architecture-design.md` / 本ガイド §2-6 |
