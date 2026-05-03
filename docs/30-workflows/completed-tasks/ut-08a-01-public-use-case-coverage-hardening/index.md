# ut-08a-01-public-use-case-coverage-hardening

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | ut-coverage |
| mode | parallel |
| owner | - |
| 状態 | spec_created / implementation / remaining-only |
| visualEvidence | NON_VISUAL |

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

## purpose

GitHub Issue #320 (UT-08A-01) を起点として、08a の AC-6 PARTIAL を解消するため public use-case と public route handler の coverage を補強する実装仕様書一式を整備する。

## scope in / out

### Scope In

- apps/api/src/use-cases/public の 4 use-case に focused unit test を追加する。
- apps/api/src/routes/public の必要最小限 route handler 直叩き unit test を追加する。
- coverage evidence と 08a partial 判定更新方針を Phase 11/12 に残す。

### Scope Out

- UI visual regression、production load test、coverage exclude による数値合わせ、deploy、commit、push、PR 作成。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成
