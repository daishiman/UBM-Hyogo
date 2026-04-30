# Phase 4: テスト戦略 詳細

## 1. テスト 3 層

### 1.1 Unit テスト（Vitest + miniflare）

対象モジュール: `packages/integrations/google/src/sheets/auth.ts`

| 関数 | 検証観点 | テストケース数 |
| --- | --- | --- |
| `parseServiceAccountJson(env)` | 正常 parse / 不正 JSON / 必須キー欠落（client_email / private_key / token_uri） | 4 |
| `signJwt(claim, privateKey)` | Web Crypto `RS256` 署名生成 / 無効鍵 rejection | 3 |
| `exchangeJwtForAccessToken(jwt)` | Google OAuth2 token endpoint mock 200 / 400 / 5xx | 4 |
| `getSheetsAccessToken(env)` | キャッシュヒット（TTL 内）/ ミス（TTL 切れ）/ 並列呼び出し（in-flight share） | 4 |
| `redactToken(token)` | log redact が必ず適用されることのテスト | 1 |

### 1.2 契約テスト

`@repo/shared` の int-test-skill 方針に従い、UT-09 / UT-21 が依存する公開 API shape を固定する:

```ts
export type SheetsAuthEnv = {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_SCOPES?: string; // default: "https://www.googleapis.com/auth/spreadsheets.readonly"
};
export function getSheetsAccessToken(env: SheetsAuthEnv): Promise<{
  accessToken: string;
  expiresAt: number; // epoch ms
}>;
```

契約変更時は major bump + 下流タスクへ通知（Schema / 共有コード Ownership 宣言に従う）。

### 1.3 Smoke（Phase 11 委譲）

実 Sheets API への疎通は Phase 11 manual smoke で 1 回のみ実行（quota 浪費防止）。Unit / 契約テストでは `fetch` を miniflare の `Response` mock に差し替える。

## 2. Mock 方針

| Mock 対象 | 実装 |
| --- | --- |
| `crypto.subtle.importKey/sign` | Web Crypto は実装本物を使用（miniflare 同梱）。署名検証は対称的にローカル `verify` で確認 |
| `fetch(token_uri)` | `vi.spyOn(globalThis, 'fetch')` で 200 / 4xx / 5xx を切替 |
| `Date.now` | TTL 境界テストで `vi.useFakeTimers()` |
| `Service Account JSON` | fixture: `tests/fixtures/sa-fake.json`（実値を含めない、`private_key` は test 用 self-signed） |

## 3. Coverage 目標

| 指標 | 目標 |
| --- | --- |
| Line | 80% 以上（プロジェクト基準）かつ auth module に限り 95% |
| Branch | 100%（異常系を全 branch カバー） |
| Function | 100% |

## 4. AC トレース

| AC | 検証手段 |
| --- | --- |
| AC-1 比較表 | docs only（Phase 2 main.md）— test 対象外 |
| AC-2 JWT フロー | Unit `signJwt` / `exchangeJwtForAccessToken` |
| AC-3 シークレット配置 | docs only — Phase 5 runbook |
| AC-4 共有手順 | Phase 11 manual smoke で確認 |
| AC-5 module 構成 | 契約テスト |
| AC-6 疎通確認 | Phase 11 manual smoke |
| AC-7 Node API 非依存 | typecheck + ESLint rule（後段）+ build |
| AC-8 JSON parse 失敗 | Unit `parseServiceAccountJson` |
| AC-9 D1 不接触 | grep 静的検査 + module ownership |
| AC-10 3 環境 secret | docs only — Phase 5 runbook |

## 5. 実行コマンド

```bash
mise exec -- pnpm --filter @repo/integrations test
mise exec -- pnpm --filter @repo/integrations test:coverage
```

## 6. 完了条件

- [ ] 上記 16 件の unit test が `packages/integrations/google/src/sheets/auth.test.ts` に列挙される（Phase 5 で実装）
- [ ] 契約テストが `packages/integrations/google/src/sheets/auth.contract.test.ts` に置かれる
- [ ] coverage 目標を満たす
- [ ] 実 Sheets API quota を unit / 契約テストで消費しない
