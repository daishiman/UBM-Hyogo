# Phase 1: 要件定義 — 成果物

> 仕様書: `phase-01.md` を再構成した最終版（実装結果を反映）。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase | 1 / 13 |
| 作成日 | 2026-04-26 |
| 上流 | 00 タスク phase-12（implementation-guide） |
| 下流 | Phase 2（設計） |
| 状態 | done |

## 2. 目的

`doc/00-getting-started-manual/specs/04-types.md` の **型 4 層 + branded 7 種 + viewmodel 10 種 + Google Forms client（getForm / listResponses）** を実装範囲として確定し、Wave 2/3/4 が import で進められる仕様（package 構成、export 経路、import 制約）を文章レベルで固める。

## 3. 真の論点と採用案

### 論点 A: zod runtime 検証はどこで実施するか
- 候補 1: 型のみ提供し runtime 検証は consumer 側で実施
- 候補 2: zod schema を export し I/O 境界（Forms client / API ハンドラ）で必須適用
- **採用: 候補 2** — 不変条件 #1（schema 抽象）を強制するため、Forms から得たデータを response 層型へ変換する境界で zod 検証を必須化する。

### 論点 B: viewmodel 10 種の生成タイミング
- 候補 1: 各 API endpoint で都度組み立て
- 候補 2: shared に viewmodel builder を提供、各 endpoint は呼び出すだけ
- **採用: 候補 2** — DRY 化、Wave 2/3/4 が再実装しない。

### 論点 C: Google Forms client の認証方式
- 候補 1: OAuth ユーザー認証（管理者個人アカウント）
- 候補 2: サービスアカウント JWT（鍵を Cloudflare Secrets）
- **採用: 候補 2** — cron / Workers から使うため bot 認証必須。`specs/02-auth` と整合。

### 論点 D: Forms クライアントの secret 取得 I/F
- 候補 1: 環境変数直接参照（`process.env.FORMS_SA_KEY`）
- 候補 2: 引数で受け取る（DI、Workers の `env` から呼び出し時に渡す）
- **採用: 候補 2** — Cloudflare Workers の `env` バインディング、test では mock 注入が容易。

## 4. 依存境界（Lighthouse）

| 依存元 | 依存先 | I/F |
| --- | --- | --- |
| Wave 2 (02a/b/c) | `@ubm-hyogo/shared` (types) | response / identity / viewmodel 型 |
| Wave 3 (03a) | `@ubm-hyogo/integrations-google` | `getForm()` |
| Wave 3 (03b) | `@ubm-hyogo/integrations-google` | `listResponses()` |
| Wave 4 (04a/b/c) | `@ubm-hyogo/shared` (types + zod) | viewmodel 型 + I/O validation |
| Wave 5 (05a/b) | `@ubm-hyogo/shared#SessionUser` | Auth.js callback |
| Wave 6 (06a/b/c) | `@ubm-hyogo/shared` (viewmodels) | SSR fetch result |

> 注: 仕様書では `@ubm/shared` / `@ubm/integrations/google` と記載されていたが、**実装パッケージ名は `@ubm-hyogo/shared` / `@ubm-hyogo/integrations-google`** を採用した。

## 5. 型 4 層 + branded 7 種

### 5.1 schema 層（Forms フォーム構造）

| 型 | フィールド | 出典 |
| --- | --- | --- |
| `FormSchema` | `formId` / `title` / `sections: FormSection[]` | spec/04 |
| `FormSection` | `index` / `title` / `questions: FormQuestion[]` | spec/04 |
| `FormQuestion` | `stableKey: StableKey` / `title` / `type` / `required` | spec/01 |

実装: `packages/shared/src/types/schema/index.ts`

### 5.2 response 層（実回答 raw）

| 型 | フィールド |
| --- | --- |
| `FormResponse` | `responseId: ResponseId` / `responseEmail: ResponseEmail` / `submittedAt` / `answers: FormResponseAnswer[]` |
| `FormResponseAnswer` | `stableKey: StableKey` / `value: string \| string[]` |

実装: `packages/shared/src/types/response/index.ts`

### 5.3 identity 層（D1 永続側 identity）

| 型 | フィールド |
| --- | --- |
| `MemberIdentity` | `memberId: MemberId` / `responseEmail: ResponseEmail` / `currentResponseId?: ResponseId` |
| `MemberStatus` | `memberId: MemberId` / `publicConsent` / `rulesConsent` / `displayLevel` |

実装: `packages/shared/src/types/identity/index.ts`

### 5.4 viewmodel 層（10 種）

| viewmodel | 利用画面 |
| --- | --- |
| `PublicStatsView` | `/`（トップ統計） |
| `PublicMemberListView` | `/members` |
| `PublicMemberProfile` | `/members/[id]` |
| `FormPreviewView` | フォーム参照 |
| `SessionUser` | Auth.js session |
| `MemberProfile` | `/me` |
| `AdminDashboardView` | `/admin` |
| `AdminMemberListView` | `/admin/members` |
| `AdminMemberDetailView` | `/admin/members/[id]` |
| `AuthGateState` | login / callback |

実装: `packages/shared/src/types/viewmodel/index.ts`

### 5.5 branded type 7 種

`MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` / `SessionId` / `TagId` / `AdminId`

実装: `packages/shared/src/branded/index.ts`

## 6. Google Forms client I/F

```ts
type GoogleFormsClient = {
  getForm(formId: string): Promise<FormSchema>;
  listResponses(formId: string, opts?: {
    pageToken?: string;
    since?: string;  // ISO8601
  }): Promise<{
    responses: FormResponse[];
    nextPageToken?: string;
  }>;
};

type ClientFactory = (env: {
  FORMS_SA_KEY: string;        // Cloudflare Secret
  FORMS_SA_EMAIL: string;
}) => GoogleFormsClient;
```

実装: `packages/integrations/google/src/forms/{auth,backoff,mapper,client}.ts`

## 7. zod 適用境界 4 点

| # | 境界 | schema |
| --- | --- | --- |
| 1 | Forms API → response 層 | `FormResponseSchema` |
| 2 | response → identity 層（sync 時） | `MemberIdentitySchema` |
| 3 | API endpoint request body | `*RequestSchema` |
| 4 | API endpoint response body | `*ResponseSchema` |

実装: `packages/shared/src/zod/{primitives,field,schema,response,identity,viewmodel}/`

## 8. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | HIGH | Wave 2/3/4 全 11 タスクが import で進む |
| 実現性 | HIGH | TypeScript / zod / fetch のみ |
| 整合性 | HIGH | 不変条件 #1/#2/#3/#5/#6/#7 と整合 |
| 運用性 | HIGH | 型変更が Wave 2/3/4 で自動検出される |

## 9. 不変条件マッピング

- **#1 schema 抽象**: schema 層を struct 化、specific question を hardcode しない
- **#2 consent キー**: normalizer 関数で `publicConsent` / `rulesConsent` 強制（`packages/shared/src/utils/consent.ts`）
- **#3 responseEmail system field**: response 層 system フィールド独立
- **#5 D1 access**: 型のみ、D1 binding 触れず
- **#6 GAS prototype 非昇格**: viewmodel は spec/05 由来、GAS 0 件
- **#7 responseId / memberId**: branded type で型レベル分離

## 10. 完了確認

- [x] 4 層 + 7 branded + 10 viewmodel が一覧化されている
- [x] Forms client 2 method の I/O が型レベルで明文化
- [x] zod 適用境界 4 点が specified
- [x] 4 条件全て HIGH

## 11. 実装結果（参照）

- branded 7 種: `packages/shared/src/branded/index.ts`
- 型 4 層: `packages/shared/src/types/{schema,response,identity,viewmodel}/index.ts`
- viewmodel 10 種: `packages/shared/src/types/viewmodel/index.ts`
- zod schema: `packages/shared/src/zod/{primitives,field,schema,response,identity,viewmodel}/`
- consent normalizer: `packages/shared/src/utils/consent.ts`
- Forms client: `packages/integrations/google/src/forms/{auth,backoff,mapper,client}.ts`
- ESLint boundary: `scripts/lint-boundaries.mjs`（`@ubm-hyogo/integrations-google` 追加済）
- テスト 130 件 PASS、typecheck PASS
