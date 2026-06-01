# Phase 12 システム仕様更新サマリ

> `implemented_local_evidence_captured` 段階。コードは実装済み。current API 契約として
> `expand=tags` / `items[].tags` / batch fetch guard / tag fail-close を同期する。

## Step 1: ワークフローローカル成果物の整合

### Step 1-A: requirements / design の整合

- `outputs/phase-1/requirements.md`（AC-1〜AC-5 / 実コード anchor）と `phase-2.md`（データフロー / インターフェース）が
  実コード identifier（`listTagsByMemberIds` フラット配列返り / `q`・`limit` 等フィールド名 / `index.contract.spec.ts` パス）に整合済み。
- 追加変更なし（整合済み）。

### Step 1-B: Phase 11 実測証跡の整合

- `outputs/phase-11/main.md`（自動テスト実測）/ `manual-smoke-log.md`（contract spec 代替）/ `link-checklist.md` を本サイクルで更新。
- NON_VISUAL 宣言（`phase-11.md`）と一致。スクリーンショットなし。

### Step 1-C: Phase 12 実装ガイドの整合

- `outputs/phase-12/implementation-guide.md` に Part 1（概念）+ Part 2（型 / zod / expand パース / use-case groupBy 配線 / エラーハンドリング / `EXPAND_WHITELIST`）を記載。
- 識別子はすべて実コード verbatim に一致。

## Step 2: aiworkflow-requirements（global skill）更新要否判定

### 判定: **要更新（current contract として同一サイクル反映済み）**

新規インターフェースを 3 点追加するため、契約系リファレンスへの反映が必要。

| 新規インターフェース                              | 種別            | 反映先候補（aiworkflow-requirements references） |
| ------------------------------------------------- | --------------- | ------------------------------------------------ |
| `PublicMemberTagZ`（zod）                         | shared 契約     | viewmodel / zod 契約系リファレンス               |
| `PublicMemberListItemZ.tags`（optional）          | shared 契約     | viewmodel / zod 契約系リファレンス               |
| `ParsedPublicMemberQuery.expand`（`("tags")[]`）  | query 契約      | public API / query parser 系リファレンス         |

### 更新対象と反映結果

- `references/api-endpoints.md`: `GET /public/members` の `expand=tags` / `items[].tags` を **current / Issue #224** として記録。
- `references/database-implementation-core.md`: `listTagsByMemberIds` の **batch（`member_id IN`）・フラット配列返り** と use-case groupBy 境界を N+1 回避パターンとして追記。
- `references/lessons-learned-issue-224-public-members-tags-batch-fetch-2026-05.md`: helper Map 誤認を防ぐ Phase 1 verbatim signature lesson を新規作成。
- `references/lessons-learned.md` / `references/task-workflow-active.md`: workflow root と current contract を同期。

## Step 2 補足: 不変条件との整合

- invariant #1（schema 固定しすぎない）/ #4（admin-managed data 分離）/ #5（D1 直アクセスは apps/api 限定）に抵触なし。
- D1 schema 変更 / migration なし（既存 `member_tags` / `tag_definitions` を利用）。
