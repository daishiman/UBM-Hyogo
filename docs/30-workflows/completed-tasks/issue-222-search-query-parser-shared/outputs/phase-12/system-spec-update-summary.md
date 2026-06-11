# システム仕様更新判定（Task 2）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 結論: Step 1 task ledger / artifact inventory / discovery indexes は同一 wave で同期済み。Step 2 のグローバル公開契約変更は **N/A**（cross-package 公開契約の追加はあるが、API endpoint / D1 / Google Form / 認証境界は不変）。

## Step 1-A: 完了タスク記録

- **taskId**: `ISSUE-222-SEARCH-QUERY-PARSER-SHARED`
- **workflow**: `issue-222-search-query-parser-shared`
- **種別**: `refactoring` / NON_VISUAL
- **成果**: 公開メンバー検索の query 正規化プリミティブ（値集合 / 制限値 / 正規化 helper）を `packages/shared/src/public-search` に SSOT 化し、`apps/api/src/_shared/search-query-parser.ts` と `apps/web/src/lib/url/members-search.ts` を import へ切替えた。
- **記録先**:
  - `docs/30-workflows/completed-tasks/issue-222-search-query-parser-shared/`
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
  - `.claude/skills/aiworkflow-requirements/references/workflow-issue-222-search-query-parser-shared-artifact-inventory.md`
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
  - `.claude/skills/aiworkflow-requirements/changelog/20260610-issue-222-search-query-parser-shared.md`

> 上記 global skill sync は今回サイクルで実反映済み。

## Step 1-B: 実装状況テーブル

| 項目 | 値 |
|------|----|
| workflow_state | `implemented_local_evidence_captured` |
| implementation_status | `implemented_local_evidence_captured` |
| コード実装 | 完了 |
| 新規ファイル | `packages/shared/src/public-search/search-query-primitives.ts` / `.../index.ts` / `.../__tests__/search-query-primitives.spec.ts` |
| 編集ファイル | `packages/shared/package.json` / `apps/api/src/_shared/search-query-parser.ts` / `apps/web/src/lib/url/members-search.ts` |
| 回帰 spec | shared 12 PASS / api 30 PASS / web 11 PASS |

## Step 1-C: 関連タスク

- `packages/shared/src/admin/search.ts`（admin 検索）は別ドメイン・本タスク非接触。`SortZ` 等の衝突を避けるため root barrel に出さず **subpath export に閉じる**。
- `apps/web` のページング実装（`page`/`limit` を web で実使用）は 06 系の別タスク。shared に定数は置くが web 配線はしない。
- D1 / API endpoint / Google Form は不変（CLAUDE.md 不変条件・UI workflow 不変条件 #1）。

## Step 2: 新規インターフェース追加の有無

### 判定: グローバル system spec（公開契約）変更は N/A

新規 export は `@ubm-hyogo/shared/public-search` という cross-package subpath だが、**query 正規化規約の内部プリミティブ**であり、API endpoint surface / D1 schema / Google Form schema / 認証境界 / consent key を変更しない。

| 判定軸 | 本タスク | system spec 変更 |
|--------|----------|-----------------|
| API endpoint surface | 変更なし | N/A |
| D1 schema / migration | 変更なし | N/A |
| Google Form schema | 変更なし | N/A |
| 認証境界 / consent key | 変更なし | N/A |
| `apps/web` → `apps/api` 直接参照 | ゼロ維持（shared 経由のみ） | N/A |
| cross-package 公開契約（shared subpath） | 追加あり（`./public-search`） | workflow / aiworkflow ledger に記録 |

## shared 型追加の 4 点同期（[UT-W3] 教訓）

shared に新規プリミティブを追加するタスクは、以下 4 点を**同一 wave で揃える**（一つでも欠けると import 不能 / drift の温床になる）:

| # | 同期点 | 本タスクでの対象 |
| --- | --- | --- |
| 1 | definition（型・定数・純関数の実体） | `packages/shared/src/public-search/search-query-primitives.ts` |
| 2 | barrel index（re-export 集約） | `packages/shared/src/public-search/index.ts`（`export * from "./search-query-primitives"`） |
| 3 | package exports（subpath 公開） | `packages/shared/package.json` の `"./public-search": "./src/public-search/index.ts"` |
| 4 | consumer wiring（利用側の切替） | `apps/api/src/_shared/search-query-parser.ts` / `apps/web/src/lib/url/members-search.ts` の import 置換 |

## 結論

公開契約の system spec 更新は不要。ただし task ledger / artifact inventory / discovery indexes は同一 wave で同期済み。shared 型追加の 4 点同期は definition → barrel → package exports → consumer wiring の順で揃えた。
