# system-spec-update-summary

> 本 workflow は `implemented_local_evidence_captured`。正本 spec / aiworkflow への反映結果を記録する。

## Step 1-A: タスク完了記録

- 本 workflow は apps/web 実装と local deterministic evidence を取得済み。
- 完了タスク記録先: aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / SKILL-changelog に issue-1116 entry を追加。

## Step 1-B: 実装状況テーブル

- 現時点: `implemented_local_evidence_captured`。
- code implementation / focused tests / typecheck / lint / verify:tokens / verify:no-inline-style は PASS。
- commit / PR / staging / authenticated visual capture は user-gated。

## Step 1-C: 関連タスクテーブル

| 関連タスク | 関係 | 状態 |
| --- | --- | --- |
| issue-1069-tag-code-rename | 親（API 本体・`PATCH /admin/tags/:tagId` code/expectedCode・409 分離） | completed。本タスクはその surface を UI から消費する |
| task-issue-1069-followup-001（admin tag code edit UI） | recovery 起点 unassigned-task | consumed（本 workflow が canonical 化） |
| issue-1070（tag reactivate / physical delete API） | 兄弟（API のみ存在・UI は別スコープ） | API 実装済み・本タスク非対象 |
| task-issue-1035-followup-001（member drawer inline-create UI） | 兄弟（tag create UI） | unassigned・本タスク非対象 |

## Step 2: システム仕様更新（反映方針）

### API spec（`specs/01-api-schema.md`）— 不変・更新不要

- `PATCH /admin/tags/:tagId` の `code` / `expectedCode` 受付・409 `tag_code_conflict` / `tag_stale_conflict` 分離は
  **親 issue-1069 で既に正本 spec へ改訂済み**（不変条件 #13）。本タスクは UI 層のため API spec の追加改訂は**不要**。

### admin UI surface（tag master ルート追加）— 実装済み

- 新規 admin ルート `/admin/tag-master`（nav id `tag-master`・label「タグ管理」）の追加は admin UI surface の変更にあたる。
- route 追加の設計意図（sibling route で `/admin/tags` tag-queue との nav 衝突を回避）は本 workflow docs と aiworkflow artifact inventory に反映済み。
- 既存 API spec は不変のため `docs/00-getting-started-manual/specs/01-api-schema.md` の追加改訂は不要。

### 新規不変条件の要否評価

- 本タスクは既存不変条件（#1 apps/api 非変更 / #2 OKLch / #5 D1 直アクセス禁止 / #9 FormField / #10 useAdminMutation）に**完全に収まる**。
- **新規不変条件の追加は不要**。sibling route で nav 衝突を回避する判断は本 workflow の設計判断（Phase 1/2/3）として記録し、横断不変条件へ昇格させる必要はない。
- ただし「子ルートにすると `isNavItemActive` の接頭辞一致で親 nav が同時 active になる」という知見は skill feedback（FB-I1116-002）へ反映し、再発防止のチェック観点として残す。
