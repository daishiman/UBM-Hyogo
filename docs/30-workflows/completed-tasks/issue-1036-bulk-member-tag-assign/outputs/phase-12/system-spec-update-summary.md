# System spec update summary

## Status

`implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION`

## Step 1-A: completed task registration（完了タスク記録）

| Target | Status | Note |
| --- | --- | --- |
| workflow artifact inventory | registered in this wave | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` の Phase 1-13 + strict 7 を implementation package として記録 |
| quick-reference / resource-map / task-workflow-active | same-wave 反映候補 | Issue #1036 は workflow-local docs と実コード差分で discoverable。global index 反映は大規模構造変更ではなく任意の後続整理対象 |
| logs / changelog | same-wave 反映 | changelog fragment を追加（root LOGS.md でなく fragment を使う skill 群） |

## Step 1-B: implementation status（実装状況）

| Workflow | State |
| --- | --- |
| `issue-1036-bulk-member-tag-assign` | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION` |

実装済み。apps/api に bulk endpoint / repository helper / audit / tag master read endpoint、
apps/web に BulkActionBar tag picker / bulk mutation UI / API client、docs に不変条件 #13 第3経路を反映した。

## Step 1-C: related task status（関連タスク）

| Item | Status | Boundary |
| --- | --- | --- |
| Issue #1036 | CLOSED | keep closed; reopen しない。PR 本文は `Refs #1036` |
| Issue #982 | completed（dev merged） | 親 workflow。単一 member drawer tag 編集 + 選択基盤 + audit + 単一 endpoint を提供。本タスクはその followup-003 を最新コードに最適化 |
| Issue #913 | 別タスク・未実装（CLOSED） | server idempotency store。本タスクは **DB 自然冪等で代替**し非依存（AC-5 を複合 PK + INSERT OR IGNORE / DELETE meta.changes で実現） |
| Issue #1035 | 別タスク（tag master write/CRUD） | tag master の **write** 責務。本タスクは **read のみ**（`GET /admin/tags`）で read/write 責務分離。重複しない |

## Step 2: conditional system spec update（新規 interface の反映判定）

本タスクは新規 interface を 2 つ追加する設計である:

| 新規 interface | 種別 | system spec 反映候補 |
| --- | --- | --- |
| `POST /admin/members/tags/bulk` | bulk write endpoint | `docs/00-getting-started-manual/specs/01-api-schema.md` / `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| `GET /admin/tags` | tag master read endpoint | 同上 |
| 不変条件 #13 第3経路（bulk admin write） | invariant 再定義 | memberTags.ts コメント + 関連 specs |

**判定: workflow-local 正本と実コードに反映済み。global system spec への追記は現時点 N/A。**

- current behavior は `apps/api/src/routes/admin/members.ts` と
  `apps/api/src/repository/memberTags.ts` の実装、および本 workflow の implementation guide に固定済み。
- `.claude/skills/aiworkflow-requirements/` 配下には admin tag endpoint 一覧の単一正本が見当たらず、
  大規模 index 構造変更を伴うため本サイクルでは無理に global skill を変更しない。
- ただし漏れ防止のため、上表の interface shape と不変条件 #13 第3経路は本 summary に記録する。
