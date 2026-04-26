# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 4 (テスト戦略) |
| 下流 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

package init → 型 → zod → Forms client → ESLint → test の 6 step ランブックを発行し、各 step に sanity check を埋め込む。

## 実行タスク

1. 6 step 列挙
2. 各 step のコマンド placeholder
3. sanity check（typecheck / lint / vitest）
4. rollback 戦略
5. outputs/phase-05/implementation-runbook.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/module-design.md | module 設計 |
| 必須 | outputs/phase-04/test-strategy.md | テスト戦略 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 6 | 異常系検証 |
| 11 | 手動 smoke |

## 多角的チェック観点（不変条件参照）

- **#1/#5/#7**: 各 step に不変条件 sanity check

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 6 step | 5 | pending |
| 2 | コマンド | 5 | pending |
| 3 | sanity | 5 | pending |
| 4 | rollback | 5 | pending |
| 5 | outputs | 5 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-05/main.md |
| ドキュメント | outputs/phase-05/implementation-runbook.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 6 step + sanity 完成

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-05/ 2 ファイル
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 6
- 引き継ぎ事項: ランブック
- ブロック条件: 未確定

## 実装ランブック（6 step）

### step 1: package init

```bash
mkdir -p packages/shared/src/{branded,types,zod,utils,test}
mkdir -p packages/integrations/google/src/{forms,test}
pnpm -F @ubm/shared init -y
pnpm -F @ubm/integrations-google init -y
```

sanity:
- `pnpm -w typecheck` PASS（empty barrel）

### step 2: branded type 7 種

ファイル: `packages/shared/src/branded/index.ts`

```ts
type Brand<T, B> = T & { readonly __brand: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;
export type SessionId = Brand<string, "SessionId">;
export type TagId = Brand<string, "TagId">;
export type AdminId = Brand<string, "AdminId">;

export const asMemberId = (s: string): MemberId => s as MemberId;
// 各 branded 用の as* を export
```

sanity:
- type-level test: `MemberId !== ResponseId`

### step 3: 型 4 層

ファイル: `packages/shared/src/types/{schema,response,identity,viewmodels}.ts`

```ts
// schema.ts
export interface FormSchema { formId: string; title: string; sections: FormSection[]; }
// response.ts
export interface FormResponse { responseId: ResponseId; responseEmail: ResponseEmail; ... }
// identity.ts
export interface MemberIdentity { memberId: MemberId; responseEmail: ResponseEmail; currentResponseId?: ResponseId; }
// viewmodels.ts
export interface PublicStatsView { memberCount: number; ...; }
// ... 10 viewmodel
```

sanity:
- `tsc --noEmit` PASS
- `04-types.md` の全型を grep してカバー確認

### step 4: zod schema

ファイル: `packages/shared/src/zod/{field,response,identity,viewmodels}.ts`

```ts
// field.ts
import { z } from "zod";
export const FieldNameZ = z.string().min(1).max(100);
export const FieldEmailZ = z.string().email();
// 31 項目分
// response.ts
export const FormResponseZ = z.object({
  responseId: z.string().brand<"ResponseId">(),
  responseEmail: z.string().email().brand<"ResponseEmail">(),
  submittedAt: z.string().datetime(),
  answers: z.array(FormResponseAnswerZ),
});
// utils/consent.ts
export const normalizeConsent = (raw: Record<string, unknown>) => ({
  publicConsent: !!(raw.publicConsent ?? raw.public_consent ?? raw.shareInfo),
  rulesConsent: !!(raw.rulesConsent ?? raw.rules_consent ?? raw.agreeRules),
});
```

sanity:
- `pnpm -F @ubm/shared test` PASS
- 31 fixture parse 成功

### step 5: Forms client

ファイル: `packages/integrations/google/src/forms/{auth,client,backoff,mapper}.ts`

```ts
// auth.ts
export async function getAccessToken(env: { FORMS_SA_KEY: string; FORMS_SA_EMAIL: string }) {
  const jwt = await signJwt({ iss: env.FORMS_SA_EMAIL, scope: "https://www.googleapis.com/auth/forms.responses.readonly", aud: TOKEN_ENDPOINT, exp: now+3600 }, env.FORMS_SA_KEY);
  const res = await fetch(TOKEN_ENDPOINT, { method: "POST", body: new URLSearchParams({ grant_type: "...:jwt-bearer", assertion: jwt }) });
  return (await res.json()).access_token;
}
// client.ts
export const createGoogleFormsClient = (env): GoogleFormsClient => ({
  async getForm(formId) { /* fetch + backoff + mapper */ },
  async listResponses(formId, opts) { /* fetch + pagination + backoff + mapper */ },
});
// backoff.ts
export async function withBackoff<T>(fn: () => Promise<T>, opts = { maxRetry: 5, baseMs: 200 }): Promise<T> { /* exponential */ }
```

sanity:
- `pnpm -F @ubm/integrations-google test` PASS
- mock 429 → retry 2 回で 200

### step 6: ESLint rule

ファイル: `tools/eslint-config/boundary.js`

```js
module.exports = {
  rules: {
    "import/no-restricted-paths": ["error", {
      zones: [
        { target: "./apps/web", from: "./packages/integrations/google" },
        { target: "./apps/web", from: "./apps/api" },
      ],
    }],
  },
};
```

sanity:
- `pnpm -w lint` PASS
- 試しに `apps/web` から `@ubm/integrations/google` import → error

## rollback 戦略

| step | rollback |
| --- | --- |
| 1〜2 | 削除のみ（影響 0） |
| 3 | 型のみ、consumer 影響なし |
| 4 | zod 無効化（schema を passthrough に） |
| 5 | Forms client export を空 stub に置換、03a/b で fallback |
| 6 | ESLint rule disable（一時） |

## sanity チェック総括

```bash
pnpm -w typecheck && pnpm -w lint && pnpm -w test
```
