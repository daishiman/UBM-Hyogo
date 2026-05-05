# runbook — local + staging smoke 実行手順

## 重要ポリシー（冒頭明示）

**`wrangler` を直接実行することは CLAUDE.md ポリシーで禁止されている。**
本ランブックのすべての wrangler 系コマンドは **必ず `bash scripts/cf.sh` 経由** で実行する。
`scripts/cf.sh` は以下を保証する:

- `op run --env-file=.env` 経由で 1Password から `CLOUDFLARE_API_TOKEN` 等を動的注入
- `ESBUILD_BINARY_PATH` でグローバル esbuild と wrangler 内蔵 esbuild の version mismatch を解消
- `mise exec --` 経由で Node 24 / pnpm 10 を保証

**禁止事項**: `wrangler dev` / `wrangler deploy` / `wrangler d1 ...` を直接呼ばない。`pnpm dlx wrangler` も同様に禁止。

---

## 0. 事前確認

```bash
# 1Password セッション確認
bash scripts/cf.sh whoami

# Node / pnpm
mise exec -- node -v
mise exec -- pnpm -v
```

`whoami` が成功しない場合は本タスクを中止し、`.env` の op 参照と 1Password セッションを確認する。

## 1. apps/api を local dev 起動（D1 binding 込み）

別ターミナルタブで:

```bash
# scripts/cf.sh の dev 系サブコマンド経由（直接 wrangler dev は禁止）
bash scripts/cf.sh dev --config apps/api/wrangler.toml
```

期待出力:

```
Listening on http://127.0.0.1:8787
```

**2 回連続 fresh 起動で観測できない場合** は phase-06 Case A（esbuild mismatch）に分岐。

## 2. apps/web を local 起動

別ターミナルタブで:

```bash
PUBLIC_API_BASE_URL=http://localhost:8787 \
  mise exec -- pnpm --filter @ubm-hyogo/web dev
```

## 3. local curl matrix 実行

```bash
EVIDENCE=docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-11/evidence/local-curl.log
WEB=http://localhost:3000  # apps/web の dev port

{
  echo "# $(date -u +%FT%TZ) local"
  for path in "/" "/members" "/register"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB$path")
    echo "GET $path -> $code"
  done

  # /members body から seed id を抽出して詳細ページ確認
  # （jq の使用例。実 ID はログでは redacted に置換）
  API=http://localhost:8787/public
  SEEDED_ID=$(curl -s "$API/members" | jq -r '.items[0].id // empty')
  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/members/$SEEDED_ID")
  echo "GET /members/<redacted> -> $code"

  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/members/UNKNOWN")
  echo "GET /members/UNKNOWN -> $code"
} | tee "$EVIDENCE"
```

期待: `/`, `/members`, `/register`, `/members/<seeded>` が `200`、`/members/UNKNOWN` が `404`。

## 4. 実体経路の証跡（seed 含有確認）

```bash
curl -s http://localhost:8787/public/members | jq '.items | length'
# 期待: 1 以上
```

0 の場合は phase-06 Case E に分岐。

## 5. 不変条件 #5 確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec rg -n "D1Database|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**' || echo "OK: 0 hits"
```

## 6. staging deploy 状態確認 / 必要時 deploy

```bash
# 既存デプロイを使う場合は確認のみ
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env staging

# 必要なら deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

## 7. staging vars 確認

```bash
# vars dump（実値は redact してログに保存）
bash scripts/cf.sh vars list --config apps/web/wrangler.toml --env staging
```

Cloudflare deployed vars の `PUBLIC_API_BASE_URL` が staging API の URL を指していることを確認。現状 `apps/web/wrangler.toml` には未定義のため補助確認に留める。未設定 / localhost を指している場合は phase-06 Case B / D に分岐し、Phase 11 は NO-GO。

## 8. staging curl matrix 実行

```bash
EVIDENCE=docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-11/evidence/staging-curl.log
WEB=https://<staging-web-url>  # wrangler.toml の routes / workers_dev から取得

{
  echo "# $(date -u +%FT%TZ) staging"
  for path in "/" "/members" "/register"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB$path")
    echo "GET $path -> $code"
  done
  API="$STAGING_API/public"
  SEEDED_ID=$(curl -s "$API/members" | jq -r '.items[0].id // empty')
  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/members/$SEEDED_ID")
  echo "GET /members/<redacted> -> $code"
  code=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/members/UNKNOWN")
  echo "GET /members/UNKNOWN -> $code"
} | tee "$EVIDENCE"
```

## 9. staging screenshot 保存

ブラウザで staging の `/members` を開き、1 枚を `outputs/phase-11/evidence/staging-screenshot.png` に保存。member 名等の個人情報が表示される場合はモザイク等で redact する。

## 10. 後片付け

- local の `apps/api` / `apps/web` プロセスを停止（Ctrl+C）
- evidence ファイルから secret / D1 ID 実値が残っていないことを `rg` で再確認
