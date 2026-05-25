# Phase 6: テスト拡充

## 目的

fail path / 回帰 guard / 補助 command を追加する。

## 追加する fail path test

| ID | 対象 | 追加ケース |
| -- | ---- | ---------- |
| FP-1 | runner | `cf.sh tail` が空出力（log 取得失敗）でも probe 200 なら PASS（tail は best-effort、`|| true`） |
| FP-2 | runner | tail に digest はないが marker のみ → `server-components-render-error` で FAIL |
| FP-3 | runner | `STAGING_ADMIN_SESSION_COOKIE` が空 → exit 2（required env） |
| FP-4 | mint | `signSessionJwt` が throw（不正 secret）→ 例外伝播し job fail |
| FP-5 | cf.sh tail | `timeout` で stream 打ち切り後 exit code 124 を 0 扱いに正規化（capture は成功） |
| FP-6 | web-cd job | `STAGING_AUTH_SECRET` 未設定 → job が skip し成功扱い（dev push をブロックしない） |

## 回帰 guard（不変条件固定）

| Guard | 内容 |
| ----- | ---- |
| G-1 | runner / mint helper に `wrangler` 直書きが無い（`grep -L 'wrangler ' scripts/smoke/runtime-admin-web.sh`） |
| G-2 | mint helper が JWT/cookie を stdout/console に echo しない（spy で 0 回） |
| G-3 | summary.json / log に Bearer/Cookie/`__Secure-authjs` 値が残らない（redaction grep） |
| G-4 | runner が `staging` 以外の env 引数で exit 2（production 誤接続防止） |

## 補助 command

```bash
# local dry-run（curl/wrangler stub 下での runner 全ケース）
bash scripts/smoke/__tests__/runtime-admin-web.test.sh

# mint helper round-trip（分岐 B 時）
pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts
```

## 完了判定

- [x] fail path FP-1〜FP-6 を test 化
- [x] 回帰 guard G-1〜G-4 を test 化
