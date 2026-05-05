# システム仕様更新サマリ — 08a-B-public-search-filter-coverage

[実装区分: 実装仕様書]

## 判定総合

| 項目 | 判定 |
| --- | --- |
| Step 1-A タスク完了記録 | 同一 wave 同期済み（implemented-local / implementation / VISUAL_ON_EXECUTION を記録） |
| Step 1-B 実装状況テーブル更新 | `implemented_local` を記録（runtime visual evidence は pending） |
| Step 1-C 関連タスクテーブル更新 | 08b / 09a の参照行を本タスクの存在に揃える |
| Step 2 新規インターフェース追加時の仕様更新 | **発火済み**（既存 query/response の AC 形式化を specs 4 ファイルへ反映済み） |

## Step 1-A: タスク完了記録（implemented-local / runtime pending）

| 更新先 | 追記内容 |
| --- | --- |
| `docs/30-workflows/08a-B-public-search-filter-coverage/index.md` | Status / Workflow State 行を `implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 11 runtime pending` で確定 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本タスクを active 一覧に追加し `implemented-local / implementation-spec / VISUAL_ON_EXECUTION` を記録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 08a-B 即時導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 08a-B resource row を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 08a-B changelog row を追加 |
| `.agents/skills/aiworkflow-requirements/` | `.claude` 正本から mirror 同期済み |
| `docs/30-workflows/LOGS.md` | 08a-B close-out row を追加 |

> `topic-map.md` / `keywords.json` は aiworkflow-requirements generator 管理のため直接編集しない。`quick-reference` / `resource-map` / `task-workflow-active` / `SKILL.md` / LOGS は同一 wave で実更新済み。

## Step 1-B: 実装状況テーブル

| 対象 | 旧 | 新 |
| --- | --- | --- |
| `index.md` Status | spec_created 由来の旧表現 | implemented-local / implementation / VISUAL_ON_EXECUTION / Phase 11 runtime pending |
| `artifacts.json` `metadata.workflow_state` | spec_created 由来の旧表現 | `implemented_local` |
| 各 phase status | pending | Phase 1-10・12 completed、Phase 11 blocked_runtime_evidence、Phase 13 pending_user_approval |

> 実コード差分は今回 wave で反映済み。Phase 11 は `blocked_runtime_evidence` のまま保持し、Phase 12 は「runtime PASS」ではなく「正本・実装境界同期済み」として completed にする。runtime visual evidence は 08b/09a 実行 cycle で取得する。

## Step 1-C: 関連タスクテーブル

| 対象 | 追記方針 |
| --- | --- |
| `08a-A-public-use-case-coverage-hardening/index.md`（base） | "blocks: 08a-B" の双方向リンクを確認（drift があれば修正） |
| `08b-A-playwright-e2e-full-execution`（depends_on 候補） | 検索シナリオ E2E の参照元として 08a-B を depends_on に追加 |
| `09a-A-staging-deploy-smoke-execution`（depends_on 候補） | 検索 smoke の参照元として 08a-B を depends_on に追加 |

## Step 2: 正本仕様（specs/）への追記

新規 query schema の追加はないが、本タスクで AC として固定した内容を **正本仕様に逆反映する** 必要がある。

### `docs/00-getting-started-manual/specs/12-search-tags.md`

| Step | 追記対象セクション | 内容 |
| --- | --- | --- |
| 1-A 追加 | `## Query parameter contract` | 6 param × 既定値 / 許容値 / 不正値挙動の表（Phase 1 表をそのまま転記） |
| 1-A 追加 | `## tag AND 条件の SQL 形` | `HAVING COUNT(DISTINCT td.code) = N` パターンを正本記述 |
| 1-A 追加 | `## Query parameter contract` | `sort=name` は氏名順（`fullName ASC, member_id ASC`）として明記 |
| 1-B 更新 | `## 不変条件 #4 適用箇所` | `buildBaseFromWhere` の固定 WHERE 4 条件を実装根拠として明示 |
| 1-C 削除 | なし | - |

### `docs/00-getting-started-manual/specs/05-pages.md`

| Step | 追記対象セクション | 内容 |
| --- | --- | --- |
| 1-A 追加 | `### /members` | filter UI 要素（q / zone / status / tag / sort / density）の DOM 構造概要、`router.replace` 採用、初期値 URL 省略ルール |
| 1-B 更新 | 空状態セクション | `EmptyState` + `絞り込みをクリア`（href=`/members`）の文言固定 |

### `docs/00-getting-started-manual/specs/01-api-schema.md`

| Step | 追記対象セクション | 内容 |
| --- | --- | --- |
| 1-A 追加 | `### GET /public/members` | query schema（zod 表）と response schema（`PublicMemberListViewZ`）を Phase 2 から転記 |
| 1-A 追加 | 同セクション | `Cache-Control: no-store` の根拠（admin の publishState 即時反映）を記述 |
| 1-B 更新 | admin-only field 非露出ルール | `.strict()` reject + SELECT allowlist + `SUMMARY_KEYS` の三段防御を明記 |

### `docs/00-getting-started-manual/specs/09-ui-ux.md`

| Step | 追記対象セクション | 内容 |
| --- | --- | --- |
| 1-A 追加 | a11y 章 `/members` 節 | filter input の `aria-label` / `role=status` `aria-live=polite` / Tab 順 / Enter・Space 操作の AC（AC-A1/A2） |
| 1-B 更新 | density 切替 | `comfy` / `dense` / `list` 3 値の表示密度差分（card / list）を明記 |

## 同一 wave で同期すべき正本ファイル

| 対象 | 状態 | 備考 |
| --- | --- | --- |
| `12-search-tags.md` | synced | query contract / LIKE escape / tag AND / `status` 参加ステータス / `sort=name` 氏名順を反映 |
| `05-pages.md` | synced | `/members` filter UI / URL query 正本 / clear link を反映 |
| `01-api-schema.md` | synced | `GET /public/members` query/response/public boundary を反映 |
| `09-ui-ux.md` | synced | `/members` a11y / density 3 値 / Tab 順を反映 |
| `task-workflow-active.md` | synced | 08a-B active row を追加 |
| `quick-reference.md` / `resource-map.md` | synced | 08a-B 導線を追加 |
| LOGS | synced | `docs/30-workflows/LOGS.md` に close-out row を追加 |

## runtime evidence boundary

正本 specs / task-workflow / indexes は同一 wave で同期済み。Phase 11 screenshot / curl / axe は `VISUAL_ON_EXECUTION` として 08b / 09a runtime cycle で取得するため、本 Phase 12 の判定は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。

## current canonical set（dual canonical 確認）

| 種別 | 正本 |
| --- | --- |
| markdown 論理正本（仕様） | `docs/00-getting-started-manual/specs/12-search-tags.md` |
| TS ランタイム正本（API contract） | `apps/api/src/_shared/search-query-parser.ts` + `packages/shared/src/zod/viewmodel.ts` |
| UI 正本 | `apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx` |

両正本が同一契約を説明していることは、Phase 12 review の focused API test と rg cross-reference で確認する。Phase 11 runtime evidence は screenshot / curl / axe の実測専用であり、未取得状態を runtime PASS とは扱わない。
