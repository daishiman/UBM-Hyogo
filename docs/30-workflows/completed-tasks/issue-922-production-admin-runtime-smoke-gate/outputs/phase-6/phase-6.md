# Phase 6: テスト拡充

## 目的

fail path / 回帰 guard / cross-env leak 防止を追加する。

## 追加する fail path test

| ID | 対象 | 追加ケース |
| -- | ---- | ---------- |
| FP-P1 | runner | env=production + `PRODUCTION_AUTH_SECRET` のみ設定 + `PRODUCTION_WEB_BASE` 未設定 → exit 2（required env 名）|
| FP-P2 | runner | env=production + curl stub で 200 + tail stub 空（log 取得失敗）→ probe 200 なら PASS（best-effort）|
| FP-P3 | runner | env=production + tail stub に staging digest（167275886）→ `server-components-render-error` で FAIL |
| FP-P4 | runner | env=production + production cookie が staging cookie 値で渡された場合（=不正 cookie で 401/403）→ `auth-not-admin` 系で FAIL（cross-env cookie leak の検出代理）|
| FP-P5 | mint | env=production + `signSessionJwt` が throw（不正 secret）→ 例外伝播 + GITHUB_OUTPUT 未追記 |
| FP-P6 | mint | CLI `preview` → `resolveEnvPrefix` throw、exit non-zero |
| FP-P7 | web-cd job | `PRODUCTION_AUTH_SECRET` 未設定 → prereq step が skip_reason を出し成功扱い（main push をブロックしない）。workflow static validation + Phase 11 Gate-B 手順で固定 |
| FP-P8 | web-cd job | `if: github.ref_name == 'main'` が false（dev push）→ production job が skip される。actionlint + Phase 10 AC-2 で固定 |

## 回帰 guard（不変条件固定）

| Guard | 内容 |
| ----- | ---- |
| G-P1 | production runner / mint helper / job いずれも `wrangler` 直書きなし（`grep -L 'wrangler ' scripts/smoke/runtime-admin-web.sh scripts/smoke/mint-staging-session-cookie.mts .github/workflows/web-cd.yml`）|
| G-P2 | mint helper が production secret を stdout/console に echo しない（spy で 0 回、env=production でも同じ）|
| G-P3 | summary.json / log に Bearer/Cookie/`__Secure-authjs` 値が残らない（redaction grep）|
| G-P4 | runner が `staging`/`production` 以外の env 引数で exit 2（誤接続防止、TC-PH）|
| G-P5 | runner env=production 時 `STAGING_WEB_BASE` を読まない（cross-env leak 防止、TC-PE）|
| G-P6 | mint env=production 時 `STAGING_AUTH_SECRET` を読まない（cross-env leak 防止、TC-P3）|
| G-P7 | staging gate の挙動が一切変わらない後方互換（既存 staging test 全件 GREEN 維持）|

## 補助 command

```bash
# local dry-run（curl/wrangler stub 下での runner 全ケース、staging + production）
bash scripts/smoke/__tests__/runtime-admin-web.test.sh

# mint helper env prefix routing
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

## 完了判定

- [x] fail path FP-P1〜FP-P6 を focused tests 化、FP-P7〜FP-P8 を workflow static validation / Gate-B 手順で固定
- [x] 回帰 guard G-P1〜G-P7 を focused tests / grep guard / actionlint で固定
- [x] 後方互換（既存 staging test 維持）を guard 化
