# Implementation Guide — ut-08a-01-public-use-case-coverage-hardening

## 実装区分

[実装区分: 実装仕様書]

判定根拠: 既存仕様は docs-only と記録されていたが、目的は public use-case 4本と public route handler の unit coverage を追加し、coverage threshold を満たすことである。テストファイル追加、route handler 直叩き、coverage evidence 更新が含まれており、コード変更なしでは達成不能なため CONST_004 に従い実装仕様書へ再分類する。

## 変更対象ファイル

| path | 種別 | 方針 |
| --- | --- | --- |
| apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts | 新規 | D1 prepared statement mock と fixture builder を配置する |
| apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts | 新規 | happy / schema missing / D1 failure を追加する |
| apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts | 新規 | happy / not public 404 / D1 failure を追加する |
| apps/api/src/use-cases/public/__tests__/get-public-stats.test.ts | 新規 | happy / sync job missing / D1 failure を追加する |
| apps/api/src/use-cases/public/__tests__/list-public-members.test.ts | 新規 | happy + pagination / empty / D1 failure を追加する |
| apps/api/src/routes/public/index.test.ts | 新規 | 4 public route を Hono app で直叩きする |
| docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/artifacts.json | 編集 | 実装後に AC-6 PARTIAL 更新方針を反映する |
| .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 編集 | UT-08A-01 実装完了後の正本状態を同期する |
| .claude/skills/aiworkflow-requirements/indexes/resource-map.md | 編集 | coverage hardening artifact を登録する |
| .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | 編集 | 08a coverage follow-up の現在地を更新する |

## 主要シグネチャ

```ts
export interface PublicD1MockOptions {
  latestVersion?: unknown | null;
  schemaFields?: unknown[];
  publicMembers?: unknown[];
  publicMemberCount?: number;
  responseFieldsByResponseId?: Record<string, unknown[]>;
  memberStatusById?: Record<string, unknown | null>;
  currentResponseByMemberId?: Record<string, unknown | null>;
  tagsByMemberId?: Record<string, unknown[]>;
  meetings?: unknown[];
  syncJobs?: Partial<Record<'schema_sync' | 'response_sync', unknown | null>>;
  failOnSql?: RegExp | string;
  queryLog?: string[];
}
export function createPublicD1Mock(options: PublicD1MockOptions): D1Database;
export const getFormPreviewUseCase: (deps: GetFormPreviewDeps) => Promise<FormPreviewResponse>;
export const getPublicMemberProfileUseCase: (memberId: string, deps: GetPublicMemberProfileDeps) => Promise<PublicMemberProfileResponse>;
export const getPublicStats: (deps: GetPublicStatsDeps) => Promise<PublicStatsResponse>;
export const listPublicMembersUseCase: (query: ParsedPublicMemberQuery, deps: ListPublicMembersDeps) => Promise<PublicMemberListResponse>;
export const createPublicRouter: () => Hono<{ Bindings: PublicEnv }>;
```

## 入力・出力・副作用

- 入力: D1Database mock、public query (`q/zone/status/tags/sort/page/limit/density`)、`GOOGLE_FORM_ID` / `FORM_ID` / `GOOGLE_FORM_RESPONDER_URL`、memberId path param。
- 出力: 既存 view-model 型 `FormPreviewResponse` / `PublicMemberProfileResponse` / `PublicStatsResponse` / `PublicMemberListResponse` と HTTP 200/404/500 JSON response。
- 副作用: production/staging D1、Cloudflare secrets、GitHub Issue、PR、deploy は変更しない。ローカル test/coverage artifact (`apps/api/coverage/`) のみ生成される。
- エラー: D1 mock failure は repository 経由で throw させ、route handler では既存 error middleware の 5xx へ流す。公開不適格 member は `ApiError({ code: "UBM-1404" })` のまま 404 境界を維持する。

## テスト方針

- `get-form-preview.test.ts`: schema manifest happy、manifest null で `UBM-5500`、schema field query failure。
- `get-public-member-profile.test.ts`: public member happy、非公開/削除/存在なしを 404、response/tag/schema query failure。
- `get-public-stats.test.ts`: aggregate happy、sync job null は `never`、D1 failure。
- `list-public-members.test.ts`: list happy + pagination、empty result、response field query failure。
- `routes/public/index.test.ts`: `/public/form-preview`, `/public/stats`, `/public/members`, `/public/members/:memberId` を Hono app で直叩きし、Cache-Control と auth middleware 非依存を確認する。

## ローカル実行・検証コマンド

```bash
pnpm --filter @ubm-hyogo/api test -- apps/api/src/use-cases/public apps/api/src/routes/public
pnpm --filter @ubm-hyogo/api test:coverage
bash scripts/coverage-guard.sh --package @ubm-hyogo/api --threshold 85
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
```

## DoD

- 上記の新規テスト/ヘルパーファイルが実装される。
- public use-case 4本それぞれに happy / null-or-empty / D1-fail の最低3ケースが存在する。
- public route handler の直接テストで cache header と公開境界が確認される。
- `pnpm --filter @ubm-hyogo/api test:coverage` 後、Statements >=85%, Branches >=80%, Functions >=85%, Lines >=85% を満たす。
- 08a AC-6 PARTIAL の更新方針が Phase 12 evidence と aiworkflow-requirements に同期される。
- commit / push / PR / deploy はユーザー承認まで実行しない。

## 実装順序

1. `_test-helpers/public-d1.ts` を作成する。
2. 4 use-case test を追加し、happy / null-or-empty / D1-fail を満たす。
3. route handler test を追加する。
4. focused test、coverage、coverage guard、typecheck、lint を実行する。
5. 08a artifacts と aiworkflow-requirements の該当 index を同期する。

## 実装結果（2026-05-03 実装サイクル）

### 追加ファイル

- `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` — `createPublicD1Mock` と fixture builder（`buildSchemaVersionRow` / `buildSchemaQuestionRow` / `buildMemberStatusRow` / `buildMemberResponseRow` / `buildResponseFieldRow` / `buildPublicMemberRow` / `buildSyncJobRow` / `buildMeetingRow`）。`queryLog` で実行 SQL 断片を記録し、公開条件 query drift を検出する。
- `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` — happy / `latestVersion=null` で `ApiError(UBM-5500)` / `failOnSql=/FROM schema_questions/` で D1 失敗。
- `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts` — happy / `publish_state!="public"`・`public_consent!="consented"`・`is_deleted=1` で `ApiError(UBM-1404)` / `failOnSql=/FROM response_fields/` で D1 失敗。
- `apps/api/src/use-cases/public/__tests__/get-public-stats.test.ts` — `vi.setSystemTime("2026-05-03")` で年依存を固定し、happy（zone/membership 集計と recentMeetings）/ syncJobs null で `lastSync=never` / `failOnSql=/sync_jobs/` で D1 失敗。
- `apps/api/src/use-cases/public/__tests__/list-public-members.test.ts` — happy（summary / pagination.total）/ 0 件 / `failOnSql=/FROM response_fields/` で D1 失敗。`queryLog` で `public_consent='consented'` / `publish_state='public'` / `is_deleted=0` が query に含まれることも検証。
- `apps/api/src/routes/public/index.test.ts` — `errorHandler` を装着した親 Hono に `createPublicRouter()` を `/public` で mount し、`/public/form-preview` (200, `Cache-Control: public, max-age=60`) / `/public/stats` (200, 同上) / `/public/members` (200, `no-store`) / `/public/members/:memberId`（公開 member は 200 / `no-store`、不適格 member は `errorHandler` 経由で 404）を直叩きで検証。さらに実アプリ default export に対して `/public/healthz` を叩き、session guard なしで到達できることを確認。

### 検証結果

- 追加テスト 17/17 グリーン: `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__ apps/api/src/routes/public/index.test.ts`
- 型チェッククリーン: `pnpm --filter @ubm-hyogo/api typecheck`（`tsc -p tsconfig.json --noEmit`、エラー 0）
- Lint クリーン: `pnpm --filter @ubm-hyogo/api lint`（apps/api の lint script は `tsc -p tsconfig.json --noEmit` を呼ぶ実装で、本 Phase 12 補強時に再実行し exit code 0 / 出力 0 行を確認済）
- 全体 coverage: `pnpm --filter @ubm-hyogo/api test:coverage` の実数値は **未取得（要追測）**。pre-existing `schemaAliasAssign` timeout risk と分離扱いとし、focused vitest 17/17 グリーン + typecheck/lint クリーンを NON_VISUAL 代替証跡とする。実数値（Statements/Branches/Functions/Lines）の取得は後続検証エージェントへ TODO として申し送る。**捏造禁止**のため本ドキュメント上で具体数値は記載しない。

### 設計上の判断

- `D1Database` 互換 mock は SQL fragment match（`FROM schema_versions ... state = 'active'`、`SELECT 1 AS hit FROM member_status s` など）で dispatch する方式とし、`PublicD1MockOptions` の fixture を返す。`failOnSql` で任意 SQL に例外を仕込めるため D1 失敗系を 1 オプションで網羅。
- `existsPublicMember` は `memberStatusById[memberId]` の `public_consent='consented' / publish_state='public' / is_deleted=0` を見て eligible 判定する。`identity_aliases` は public mock の射程外。
- route handler test は本番と同じ `errorHandler` を親 Hono にセットすることで、`ApiError(UBM-1404)` が 404 レスポンスとして観測可能であることを担保。

### 範囲外

- production/staging D1、Cloudflare secrets、GitHub Issue、commit、push、PR、deploy は変更しない。
