# Phase 10 — Root Cause (H1/H2/H3 切り分け)

Status: **切り分け留保 / staging deploy user-gated**

## 切り分け結果

本実装サイクル内では staging への deploy / `wrangler tail` 採取は user-gated のため未実施。コードレベル静的監査の結果は以下:

| Hypothesis | コードレベル静的監査の所見 |
|------------|-----------------------------|
| **H1** (`INTERNAL_API_BASE_URL` 未設定 → localhost resolve) | `apps/web/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` を未読み込み。設定の有無は staging deploy 時に `bash scripts/cf.sh tail` で URL 末尾を採取して確定する必要あり。 |
| **H2** (401 → safeServerFetch が 404 にマスク) | `apps/web/src/lib/server-fetch/safe-fetch.ts` の `normalizeError` を読み合わせた結果、`${codePrefix}_${status}` で 401/404 は別 code に正規化される。**コード上は 401 を 404 にマスクしていない。** 回帰防止 spec `apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts` を追加し、混同しないことを assert 済。 |
| **H3** (route prefix 解釈ずれ) | `apps/web/src/lib/admin/server-fetch.ts` の `resolveApiBase()` は trailing slash を strip、`${apiBase}${path}` で結合。URL 組み立て regression spec `server-fetch-url.spec.ts` を追加。**コード上は二重 slash / prefix ずれは発生しない。** |

## 暫定結論

静的監査上、H2 / H3 はコード上既に防御されている (regression spec 追加済)。**残候補は H1 (環境変数設定不足)** が最も確率高い。staging deploy 時に `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` で `127.0.0.1:8787` ログが出るか確認し、出れば H1 確定 → `apps/web/wrangler.toml` の `[env.staging.vars]` に `INTERNAL_API_BASE_URL` を追加する。

## 本サイクルで行ったコード変更

- shared zod `byZone` optional 追加
- api `_shared/byZone.ts` 新規 + `dashboard.ts` の `byZone` response 同梱
- web mapper / `ZoneDistribution.tsx` の プロトタイプ準拠 DOM 書き換え
- token `--ubm-color-bg` alias 追加 (component 直接依存の最小 alias)
- 回帰防止 spec 5 件追加 (T-B-01..T-B-06 / safe-server-fetch-404-vs-401 / server-fetch-url)

## 次フェーズ (user-gated)

1. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
2. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`
3. `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging` でログ採取
4. H1 確定なら `apps/web/wrangler.toml` の `[env.staging.vars]` に `INTERNAL_API_BASE_URL` を追加し再 deploy
5. AC-B1 / AC-B2 / AC-B4 を curl + Playwright で検証 → `outputs/phase-11/` に evidence 配置
