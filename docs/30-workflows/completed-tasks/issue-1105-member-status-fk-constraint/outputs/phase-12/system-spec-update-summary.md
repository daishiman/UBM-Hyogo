# システム仕様 更新サマリ — issue-1105 member_status FK 制約導入

> 区分: 実装仕様書 / NON_VISUAL / new ／ status: `implemented_local_evidence_captured`
> task_id: `issue-1105-member-status-fk-constraint`

本ファイルは Step 1（完了タスク記録・実装状況・関連タスクテーブル）と Step 2（新規インターフェース判定）を記録する。本タスクは DB schema 内部の FK 追加のみで、公開境界（IPC / 型 / 公開 API）への新規インターフェースは無いため、Step 2 は **N/A** と判定する。

---

## Step 1-A — 完了タスク記録

| 項目 | 値 |
|------|-----|
| workflow | `docs/30-workflows/completed-tasks/issue-1105-member-status-fk-constraint/` |
| issue | #1105（CLOSED・2026-06-05T03:34:40Z・reopen しない） |
| 目的 | `member_status.member_id` → `member_identities(member_id)` への FOREIGN KEY 制約導入。orphan を DB レベルで構造的に禁止 |
| 成果物（実装サイクル） | `apps/api/migrations/0026_member_status_fk_constraint.sql`（新規）/ `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`（新規）/ 既存 D1 test fixtures（FK 前提 fixture 追従） |
| 手法 | SQLite テーブル再構築（CREATE member_status_new[FK 付き] → INSERT SELECT 現行全カラム → DROP → RENAME → idx_member_status_public 再作成）。`PRAGMA foreign_keys` OFF→ON |
| apps/web | diff 0（AC-8） |
| 親 workflow | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` |
| source unassigned-task | `docs/30-workflows/completed-tasks/unassigned-task/admin-member-detail-status-404-fix-followup-002-member-status-fk-constraint.md` |

## Step 1-B — 実装状況（implemented_local_evidence_captured）

| 項目 | 状態 |
|------|------|
| 実装仕様書（Phase 1-12 成果物） | 作成済み |
| 実装コード（migration / test / fixtures） | **local実装済み** |
| commit / push / PR / D1 実 apply | **未実施**（user-gated） |
| Gate-A / Gate-B | passed |
| Gate-C（commit / PR 実行） | pending（passed_at: null） |

> local実装は本サイクルで追加済み。remote D1 apply、commit、push、PR は user 承認後に実施する。

## Step 1-C — 関連タスクテーブル

| 関連タスク | 関係 | 状態 |
|-----------|------|------|
| 親: `admin-member-detail-status-404-fix` | 止血（backfill `0025` + `ensureMemberStatusRow`）を実施。本タスクは DB 層の構造的ガード（FK）で補完 | completed（completed-tasks 配下） |
| followup-001: member 作成経路統一 | アプリ層 ingest 経路統一（別関心）。本タスク（DB 層 FK）とは責務境界が異なる | 別タスク（本サイクル対象外） |
| followup-002: member_status FK 制約（= 本タスク） | source unassigned-task を consume | 本 workflow（implemented_local_evidence_captured） |

---

## Step 2 — 新規インターフェース判定

### 判定: **N/A（新規 IPC / 型 / 公開 API なし）**

| 判定軸 | 結果 | 理由 |
|--------|------|------|
| 新規 IPC / preload API | なし | Cloudflare Workers + Hono / D1 構成。Electron IPC は本リポジトリに存在しない |
| 新規公開型 / DTO | なし | `member_status` の現行カラム構成（0002 + 0020）は不変。FK 宣言を追加するのみで、レスポンス shape・型定義は変化しない（AC-3 / AC-7） |
| 新規 endpoint / API surface | なし | endpoint 追加・既存 endpoint surface 変更なし（index.md スコープ「含まない」） |
| 公開境界への影響 | なし | 変更は `apps/api/migrations/` の DB schema 内部整合性のみ。`apps/web` は無変更（diff 0） |

> FK 制約は DB の内部参照整合性ガードであり、公開契約（API レスポンス / 型 / IPC）を変えない。よって新規インターフェース判定は **N/A**。新規 IPC / 型 / 公開 API の定義・登録は不要。

---

## aiworkflow-requirements 側 database 系仕様への反映要否判定

| 対象 | 反映要否 | 方針 |
|------|---------|------|
| `docs/00-getting-started-manual/specs/08-free-database.md` | **本文更新なし** | FK 制約は内部整合性ガードで公開契約不変。workflow ledger / quick-reference / resource-map / task-workflow-active / changelog / artifact inventory で同期済み |
| aiworkflow-requirements `database-*.md`（D1 schema / migration 規約系） | **本文更新なし** | migration pattern は本 workflow の artifact inventory と changelog に同期済み。横断テンプレ promotion は `task-specification-creator` の Phase 1 gate へ同一 wave で反映済み |
| design-tokens / API schema 系 | **N/A** | 色・apps/api endpoint 契約に非関与。反映不要 |

> 公開契約は不変のため API schema 本文更新は不要。aiworkflow の検索・追跡に必要な ledger 類は同一 wave で同期済み。
