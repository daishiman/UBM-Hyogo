# Phase 8: 統合検証 / 並列タスクとの境界整理

03b は 03a (sheets→D1)・01b (web-crypto JwtSigner)・02b (admin merge)・08b (E2E fixture) と
並列で進行する。本フェーズでは 03b 単独でクローズすべき範囲と、引き渡し境界を確定する。

## 03b の責務（クローズ済み）

- `runResponseSync` 本体・cursor 管理・lock semantics・metrics 形状
- `POST /admin/sync/responses` (authz / 200 / 409 / 500 / param 透過)
- `*/15 * * * *` cron 配線（`apps/api/src/index.ts` / `wrangler.toml`）
- migration 0005（`schema_diff_queue` partial UNIQUE / `response_fields` index）
- `normalizeResponse` / `extractConsent` mapper
- vitest unit / route / type テスト（AC-1〜AC-10 全 green）

## 引き渡し境界

| 相手タスク | 受け渡し物 | 形式 |
|-----------|-----------|------|
| **01b** (web-crypto JwtSigner) | `apps/api/src/index.ts` の `buildFormsClient` | Workers WebCrypto signer を `createGoogleFormsClient(env, { authDeps: { fetchImpl, signer } })` に注入済み |
| **02b** (admin merge / email 衝突解決) | `EMAIL_CONFLICT` 予約 error code、`member_identities` の email UNIQUE 前提 | classifyError の分類のみ |
| **03a** (sheets → D1 sync job) | `sync_jobs` / `sync_locks` の共有スキーマ。`job_type='sheets_sync'` は `'response_sync'` と別 lockId | スキーマのみ共有、I/F 変更なし |
| **08b** (E2E test fixture) | `runResponseSync` を `vi.mock` できる factory 構造、`createAdminResponsesSyncRoute({ buildClient })` | route factory + import path |

## 03b 単独で **やらない** こと

- 実 Google Forms への E2E 呼び出し（08b）
- web-crypto による JWT 署名（01b）
- production への deploy（運用タスク側）
- email 衝突時の admin merge UI（02b）
- `member_responses.search_text` の本格的な整形（後続タスク）

## 統合動作確認（vitest レベル）

`responses-sync.test.ts` で `vi.mock("../../jobs/sync-forms-responses")` により route 層単独
の正常系/異常系をカバー、`sync-forms-responses.test.ts` で job 層を `FakeD1` + mocked client
で網羅。**route × job × mock client × FakeD1** の組み合わせで `apps/api` 内コントラクトは
クローズしている。

実 D1 / 実 Forms API を含む統合テストは 08b の責務。
