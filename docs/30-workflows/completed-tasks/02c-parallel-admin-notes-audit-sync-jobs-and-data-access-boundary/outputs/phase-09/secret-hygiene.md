# Phase 9 — Secret 衛生

## 1. 本タスクで導入する secret

**なし**。

- Magic Link の HMAC 鍵 → 05b で導入予定（本タスクは repository signature のみ）
- Auth.js の AUTH_SECRET → 既存（既に `.env` / Cloudflare Secrets 管理）
- D1 binding（DB） → wrangler.toml で declare、secret ではない

## 2. `.env` / リポジトリ平文確認

```
$ git diff --stat .env
（変更なし）
```

- `.env` を改変していない
- `apps/api/wrangler.toml` も改変していない
- `__fixtures__/admin.fixture.ts` の `owner@example.com` / `manager@example.com` は **架空値**（GAS prototype data.jsx 相当）。秘匿情報ではない。

## 3. shell history / 一時ファイル

- 1Password CLI 認証は本タスクでは行っていない（test に `with-env.sh` を使わず `npx vitest` 直接呼び出し）
- secret を含む一時ファイルなし

## 4. boundary 違反 risk

`scripts/lint-boundaries.mjs` が `apps/api` / `D1Database` 等の token を検出する。これは secret leak 防止には不十分（生 API key 文字列まではブロックしない）。Phase 11 で `gitleaks` / `trufflehog` の導入を別途検討する候補とする。
