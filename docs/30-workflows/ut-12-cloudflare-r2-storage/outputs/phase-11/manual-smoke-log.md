# Manual Smoke Log — UT-12 R2 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| 実施日時 | 未実施 / 将来実装タスク側（future-file-upload-implementation）で追記 |
| 実施者 | 未実施 / 将来実装タスク側で追記 |
| 対象環境 | staging（`ubm-hyogo-r2-staging`）限定。production 適用は実装タスク側で実施 |
| バインディング名 | `R2_BUCKET` |
| 対象 AC | AC-4 (PUT / GET / DELETE) / AC-5 (CORS) |
| 主証跡形式 | CLI 出力テキスト + HTTP レスポンスヘッダ（NON_VISUAL） |

## NON_VISUAL 宣言

本ログは Cloudflare R2 の docs-only タスク（UT-12）の smoke test 手順を確定するものであり、screenshots は取得しない（[UBM-002] [UBM-003]）。証跡は本ファイルに記録される CLI コマンド・期待出力テキスト・HTTP ヘッダのみで完結する。

---

## §1. 前提

- Wrangler が `mise exec -- pnpm` 経由で実行可能
- `apps/api` 配下から `--env staging` で wrangler が staging 設定を解決できる（不変条件 5）
- 専用 R2 Token（採用案 D）が `1Password Environments` から `wrangler login` ないし `CLOUDFLARE_API_TOKEN` 環境変数経由で渡されている
- バケット `ubm-hyogo-r2-staging` が作成済み（Phase 5 runbook 完了済）

---

## §2. PUT / GET / DELETE 手順（staging 限定 / wrangler r2 完全版）

### 2-1. PUT（小ファイル 1KB アップロード）

```bash
# テストファイル生成（タイムスタンプ付与で衝突回避）
TS=$(date +%s)
echo "smoke-test-${TS}" > /tmp/smoke-test-${TS}.txt

# PUT 実行
mise exec -- pnpm --filter @ubm/api exec wrangler r2 object put \
  ubm-hyogo-r2-staging/smoke-test-${TS}.txt \
  --file /tmp/smoke-test-${TS}.txt \
  --env staging
```

**期待出力欄**:

```
Creating object "smoke-test-<TS>.txt" in bucket "ubm-hyogo-r2-staging".
Upload complete.
```

**実出力欄**: （実装タスク側で追記）

### 2-2. GET（オブジェクト取得 / 内容突合）

```bash
mise exec -- pnpm --filter @ubm/api exec wrangler r2 object get \
  ubm-hyogo-r2-staging/smoke-test-${TS}.txt \
  --file /tmp/smoke-test-${TS}-downloaded.txt \
  --env staging

diff /tmp/smoke-test-${TS}.txt /tmp/smoke-test-${TS}-downloaded.txt && echo "MATCH"
```

**期待出力欄**:

```
Downloading "smoke-test-<TS>.txt" from "ubm-hyogo-r2-staging".
Download complete.
MATCH
```

**実出力欄**: （実装タスク側で追記）

### 2-3. DELETE（後始末）

```bash
mise exec -- pnpm --filter @ubm/api exec wrangler r2 object delete \
  ubm-hyogo-r2-staging/smoke-test-${TS}.txt \
  --env staging
```

**期待出力欄**:

```
Deleting object "smoke-test-<TS>.txt" from "ubm-hyogo-r2-staging".
Delete complete.
```

**実出力欄**: （実装タスク側で追記）

---

## §3. CORS 動作確認（curl / 許可・不許可 origin の両方）

### 3-1. 許可 origin（preflight OPTIONS）

```bash
curl -i -X OPTIONS \
  -H "Origin: https://staging.<env-specific-origin>" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://<r2-endpoint>/ubm-hyogo-r2-staging/smoke-test.txt
```

**期待 HTTP ヘッダ**:

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://staging.<env-specific-origin>
Access-Control-Allow-Methods: GET, PUT, POST, HEAD
Access-Control-Allow-Headers: Content-Type, Content-Length, Authorization
Access-Control-Max-Age: 3600
```

**実ヘッダ欄**: （実装タスク側で追記）

### 3-2. 不許可 origin（preflight OPTIONS / 拒否確認）

```bash
curl -i -X OPTIONS \
  -H "Origin: https://malicious.example" \
  -H "Access-Control-Request-Method: PUT" \
  https://<r2-endpoint>/ubm-hyogo-r2-staging/smoke-test.txt
```

**期待 HTTP ヘッダ**:

- `Access-Control-Allow-Origin` が **返却されない** こと、または
- ステータスが 403 系で CORS 許可ヘッダが付与されないこと

**実ヘッダ欄**: （実装タスク側で追記）

### 3-3. ブラウザ直接アップロード経路の検証観点（AC-5）

- ブラウザ実行コンテキスト（許可 origin）からの `fetch(PUT)` が CORS preflight を成功し、本リクエストが 200 を返すこと
- 不許可 origin からの `fetch(PUT)` がブラウザ側で `TypeError: Failed to fetch` 系で拒否されること
- `ExposeHeaders: ["ETag"]` によりクライアントから `ETag` が読み取れること

---

## §4. CORS ルール確認（`wrangler r2 bucket cors get`）

```bash
mise exec -- pnpm --filter @ubm/api exec wrangler r2 bucket cors get \
  ubm-hyogo-r2-staging --env staging
```

**期待出力欄（JSON 構造の突合）**:

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

**実出力欄**: （実装タスク側で追記）

突合観点:

- `AllowedOrigins` が Phase 2 `cors-policy-design.md` で定義した環境別プレースホルダと一致
- `AllowedMethods` が `GET / PUT / POST / HEAD` を網羅
- `MaxAgeSeconds` が 3600 で一致

---

## §5. AC 証跡パス記録

| AC | 証跡パス（本ファイル内のセクション） |
| --- | --- |
| AC-4 (PUT / GET / DELETE) | §2-1 / §2-2 / §2-3 |
| AC-5 (CORS) | §3-1 / §3-2 / §3-3 / §4 |

> 本 `manual-smoke-log.md` 自体が AC-4 / AC-5 の証跡パスである。実出力欄は実装タスク側で追記される運用ハンドオフ。
