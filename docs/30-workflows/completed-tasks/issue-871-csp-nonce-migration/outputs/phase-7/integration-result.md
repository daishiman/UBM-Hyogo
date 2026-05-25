# Phase 7: 統合結果

## 1. 統合対象

`apps/web/middleware.ts` で生成した nonce を、request header `x-nonce`、request CSP、response CSPへ同一値で反映する。`apps/web/src/lib/security-headers.ts` は同じ `SecurityHeaderConfig.nonce` から CSP directive を組み立てる。

## 2. 統合確認

focused middleware test で `/` への2リクエストを実行し、nonceがリクエストごとに変化すること、response `x-nonce` とCSP内 `nonce-...` が一致することを確認した。admin/profile guard の redirect / 403 / next 挙動も既存テストで維持を確認した。

## 3. 境界

App Router runtime での実ブラウザCSP violation-zero smoke、staging/production curlは Phase 13 user gate 後に実行する。
