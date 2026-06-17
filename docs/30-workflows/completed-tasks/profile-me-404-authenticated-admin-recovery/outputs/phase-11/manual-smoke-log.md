# Phase 11 Manual Smoke Log

> 本ファイルは diagnose script + smoke probe の実行ログ**雛形**。`implemented_local_runtime_pending` の本 wave ではstaging実値は記録しない。RT-A〜RT-E の実値は **user-gated 実行時に追記**する。secret / cookie / JWT / memberId は一切記載しない（AC-9）。

## Local（本 wave で取得済み — local証跡は実施済み）

- `bash -n scripts/diagnose-profile-session.sh`: pending（T04 実装後・exit 0 を期待）。
- T01 focused vitest（`apps/api/src/middleware/error-handler.spec.ts`・notFound 構造化ログ payload）: pending（実装後）。
- T03 focused vitest（`apps/web/src/lib/server-fetch/safe-fetch.spec.ts`・route-404 → `server_fetch_failed`）: pending（実装後）。
- T02 YAML 構文（`.github/workflows/api-cd.yml`）: pending（実装後・actionlint / yaml lint）。
- redaction grep（全成果物 + 実装コードに secret/cookie/memberId が出力されないこと）: pending（実装後）。

## Staging（user-gated・計画のみ）

```text
# RT-A: api-cd 経由 staging deploy（または手動 cf.sh deploy）
$ bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# 期待: deploy 成功 + api-cd smoke gate（/me/healthz 200 + minted-cookie 認証 /me 200）PASS
# 実値: <pending — user-gated 実行時に追記。version id 等の非機密情報のみ記録>

# RT-B: 拡張 diagnose script（route 存在差分 + deploy parity）
$ bash scripts/diagnose-profile-session.sh
# 期待出力（status のみ・secret 非出力）:
#   GET ${API_BASE}/me/healthz -> 200
#   GET ${API_BASE}/me         -> 401   (未認証・route 存在)   ← 404 なら S1（route 未マッチ）
#   web<->api deploy parity    -> MATCH
# 実値: <pending — user-gated>

# RT-C: minted-cookie 認証で GET {API}/me 200
$ node scripts/smoke/mint-staging-session-cookie.mts   # cookie 実値は出力・記録しない
$ # minted-cookie を Cookie ヘッダに付与し GET ${API_BASE}/me（runtime-admin-web.sh 系流用）
# 期待: 認証 /me -> 200   （401/410 なら S3 = スコープ外候補）
# 実値: <pending — user-gated・認証必須>

# RT-D: ログイン済みブラウザで /profile 正常描画 + screenshot
# 期待: MEMBER_SESSION_404 バナー非表示・会員情報セクション描画
#       screenshot -> outputs/phase-11/screenshots/profile-me-404-recovery-staging.png
# 実値: <pending — user-gated・認証必須>

# RT-E: 非復旧時のみ — 構造化ログ tail で S1〜S3 確定
$ bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging   # API notFound ログ
$ bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging   # web server_fetch_failed
# 期待: S1（UBM-1404 GET /me）/ S2（transportKind=service-binding）/ S3（401/410）のいずれか 1 つに確定
# 実値: <pending — user-gated・RT-D 非復旧時のみ>
```

> 上記コマンドブロックの `${API_BASE}` 等はプレースホルダ。実 cookie / secret / token / memberId は実行ログに転記しない（diagnose script 自体が status と設定 presence のみ出力する read-only 設計）。
