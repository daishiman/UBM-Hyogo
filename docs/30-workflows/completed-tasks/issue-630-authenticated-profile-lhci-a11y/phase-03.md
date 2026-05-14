# Phase 3 — アーキテクチャ設計

## モジュール構成

```
apps/web/
├── scripts/
│   ├── lhci-auth-storage.ts          # signSessionJwt → storageState 生成
│   └── __tests__/
│       └── lhci-auth-storage.spec.ts # storageState 構造の unit test
├── lhci/
│   └── lhci-auth.cjs                 # LHCI puppeteerScript (CJS / Node 互換)
└── .lhci/
    └── storage-state.json            # 生成物 (gitignore)

lighthouserc.json                     # unauth: /, /members, /login のみ
lighthouserc.authenticated.json       # auth: /profile のみ

.github/workflows/lighthouse.yml      # 2 段化 (unauth → auth)
```

## 認証フロー

1. CI: `AUTH_SECRET` を GitHub Secrets から env に注入（既存 Cloudflare Secrets と同一値、Phase 6 参照）
2. `pnpm --filter @ubm-hyogo/web lhci:auth-storage` を実行
   - 内部で `signSessionJwt(AUTH_SECRET, { memberId: TEST_MEMBER_ID, email, isAdmin: false, ttlSeconds: 3600 })` を生成
   - `apps/web/.lhci/storage-state.json` に `{ cookies: [{ name: 'authjs.session-token', value: <jwt>, domain: 'localhost', path: '/', ... }] }` を書き出す
3. `lhci autorun --config=lighthouserc.authenticated.json` を起動
   - LHCI が各 URL を計測する直前に `puppeteerScript` (`apps/web/lhci/lhci-auth.cjs`) を実行
   - script は storage-state.json を読み込み、`page.context().addCookies()` 相当で cookie を注入
   - 計測対象 URL (`http://localhost:3000/profile`) にアクセス → 認証済みで描画される

## 設定値

| key | value |
| --- | --- |
| `TEST_MEMBER_ID` | `e2e-lhci-member-0001` (固定 dummy、Phase 4 で型定義) |
| `session.role` | `member` |
| `session.ttl` | 60 分 |
| cookie name | `authjs.session-token` |
| cookie domain | `localhost` |
| target | `http://localhost:3000/profile` |
| numberOfRuns | 1 |
| assertions.accessibility | `["error", { "minScore": 0.90 }]` |

## 設計上の制約

- LHCI v0.13+ の `puppeteerScript` 仕様に準拠（async function export、`{ page, browser, context }` 引数）
- script は CJS（`.cjs`）にする（ESM は LHCI が parse 失敗する報告あり）
