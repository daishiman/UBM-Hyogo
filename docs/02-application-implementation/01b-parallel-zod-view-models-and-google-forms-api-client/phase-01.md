# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 1 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 00 タスク phase-12（implementation-guide） |
| 下流 Phase | 2 (設計) |
| 状態 | pending |

## 目的

`04-types.md` の型 4 層 + branded 7 種 + viewmodel 10 種 + Forms client（getForm / listResponses）を実装範囲として確定し、Wave 2/3/4 が import で進められる仕様（package 構成、export 経路、import 制約）を文章で固める。

## 真の論点（必ず最初に検討）

### 論点 A: zod runtime 検証はどこで実施するか

- 候補 1: 型のみ提供、runtime 検証は consumer 側で実施
- 候補 2: zod schema を export し、I/O 境界（Forms client / API ハンドラ）で必須適用
- **採用: 候補 2**（不変条件 #1「schema 抽象」を強制するため、Forms から得たデータを response 層型へ変換する境界で zod 検証を必須化）

### 論点 B: viewmodel 10 種の生成タイミング

- 候補 1: 各 API endpoint で都度組み立て
- 候補 2: shared に viewmodel builder を提供、各 endpoint は呼び出すだけ
- **採用: 候補 2**（DRY 化、Wave 2/3/4 が再実装しないで済む）

### 論点 C: Google Forms client の認証方式

- 候補 1: OAuth ユーザー認証（管理者個人アカウント）
- 候補 2: サービスアカウント JWT（鍵を Cloudflare Secrets）
- **採用: 候補 2**（cron / Workers から使うため bot 認証必須、specs/02-auth と整合）

### 論点 D: Forms クライアントの secret 取得 I/F

- 候補 1: 環境変数直接参照（`process.env.FORMS_SA_KEY`）
- 候補 2: 引数で受け取る（DI、Workers の `env` から呼び出し時に渡す）
- **採用: 候補 2**（Cloudflare Workers では `env` バインディング、test では mock 注入が容易）

## 依存境界（Lighthouse として残す）

| 依存元 | 依存先 | I/F |
| --- | --- | --- |
| Wave 2 (02a/b/c) | `@ubm/shared/types` | response / identity / viewmodel 型 |
| Wave 3 (03a) | `@ubm/integrations/google/forms` | `getForm()` |
| Wave 3 (03b) | `@ubm/integrations/google/forms` | `listResponses()` |
| Wave 4 (04a/b/c) | `@ubm/shared/types` + `@ubm/shared/zod` | viewmodel 型 + I/O validation |
| Wave 5 (05a/b) | `@ubm/shared/types#SessionUser` | Auth.js callback |
| Wave 6 (06a/b/c) | `@ubm/shared/types#viewmodels` | SSR fetch result |

## 実行タスク

1. `04-types.md` の 4 層を再読、未カバー型がないか確認
2. branded type 7 種を一覧化（重複なし）
3. viewmodel 10 種の根拠を `05-pages.md` から特定
4. Forms client API: getForm / listResponses 2 method の I/O 確定
5. zod schema が必要な境界 4 点を抽出（Forms→response / response→identity / API request / API response）
6. ESLint rule の保護線（apps/web → integrations/google 禁止）の発動条件確定
7. outputs/phase-01/main.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目 |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | viewmodel 利用画面 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | SessionUser |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | サービスアカウント |
| 必須 | CLAUDE.md | 不変条件 #1〜#7 |

## 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | HIGH | Wave 2/3/4 全 11 タスクが import で進む |
| 実現性 | HIGH | TypeScript / zod / googleapis のみ |
| 整合性 | HIGH | 不変条件 #1/#2/#3/#5/#6/#7 と整合 |
| 運用性 | HIGH | 型変更が Wave 2/3/4 で自動検出される |

## 多角的チェック観点（不変条件参照）

- **#1 schema 抽象**: schema 層を struct 化、specific question を hardcode しない
- **#2 consent キー**: normalizer 関数で `publicConsent` / `rulesConsent` 強制
- **#3 responseEmail system field**: response 層 system フィールド独立
- **#5 D1 access**: このタスクは D1 binding に触れない、型のみ
- **#6 GAS prototype 非昇格**: viewmodel は spec/05 由来、GAS は 0 件
- **#7 responseId / memberId**: branded type で型レベル分離

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 4 層型確定 | 1 | pending |
| 2 | 7 branded 確定 | 1 | pending |
| 3 | 10 viewmodel 確定 | 1 | pending |
| 4 | Forms client I/F 確定 | 1 | pending |
| 5 | zod 適用境界 4 点 | 1 | pending |
| 6 | ESLint 保護線 | 1 | pending |
| 7 | outputs 生成 | 1 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-01/main.md |
| メタ | artifacts.json（更新） |

## 完了条件

- [ ] 4 層 + 7 branded + 10 viewmodel が一覧化されている
- [ ] Forms client 2 method の I/O が型レベルで明文化
- [ ] zod 適用境界 4 点が specified
- [ ] 4 条件全て HIGH

## タスク 100% 実行確認【必須】

- [ ] 全 7 サブタスク completed
- [ ] outputs/phase-01/main.md 配置
- [ ] artifacts.json 更新
- [ ] 不変条件 #1/#2/#3/#5/#6/#7 にマッピング済み

## 次 Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: 4 層型 + Forms client I/F
- ブロック条件: 論点 A〜D 未確定

## 型 4 層と branded 7 種

### schema 層（Forms フォーム構造）

| 型 | フィールド | 出典 |
| --- | --- | --- |
| `FormSchema` | `formId` / `title` / `sections: FormSection[]` | spec/04 |
| `FormSection` | `index` / `title` / `questions: FormQuestion[]` | spec/04 |
| `FormQuestion` | `stableKey: StableKey` / `title` / `type` / `required` | spec/01 |

### response 層（実回答 raw）

| 型 | フィールド |
| --- | --- |
| `FormResponse` | `responseId: ResponseId` / `responseEmail: ResponseEmail` / `submittedAt` / `answers: FormResponseAnswer[]` |
| `FormResponseAnswer` | `stableKey: StableKey` / `value: string \| string[]` |

### identity 層（D1 永続側 identity）

| 型 | フィールド |
| --- | --- |
| `MemberIdentity` | `memberId: MemberId` / `responseEmail: ResponseEmail` / `currentResponseId?: ResponseId` |
| `MemberStatus` | `memberId: MemberId` / `publicConsent` / `rulesConsent` / `displayLevel` |

### viewmodel 層（10 種）

| viewmodel | 利用画面 |
| --- | --- |
| `PublicStatsView` | / トップ |
| `PublicMemberListView` | /members |
| `PublicMemberProfile` | /members/[id] |
| `FormPreviewView` | / フォーム参照 |
| `SessionUser` | Auth.js session |
| `MemberProfile` | /me |
| `AdminDashboardView` | /admin |
| `AdminMemberListView` | /admin/members |
| `AdminMemberDetailView` | /admin/members/[id] |
| `AuthGateState` | login / callback |

### branded type 7 種

`MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` / `SessionId` / `TagId` / `AdminId`

## Forms client I/F

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

## zod 適用境界 4 点

| # | 境界 | schema |
| --- | --- | --- |
| 1 | Forms API → response 層 | `FormResponseSchema` |
| 2 | response → identity 層（sync 時） | `MemberIdentitySchema` |
| 3 | API endpoint request body | `*RequestSchema` |
| 4 | API endpoint response body | `*ResponseSchema` |
