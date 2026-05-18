# Phase 12 system-spec-update-summary - UT-07A-04

## 概要

`docs/00-getting-started-manual/specs/08-free-database.md` および `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` への追記内容サマリ。

## 追記対象セクション

### docs/00-getting-started-manual/specs/08-free-database.md

`member_tags` テーブル定義セクションに以下を追記:

| 項目 | 内容 |
| --- | --- |
| 現行列 | `member_id, tag_id, source, confidence, assigned_at, assigned_by`（6 列） |
| 不採用列 | `assigned_via_queue_id`（ADR 0002 で却下） |
| queue 追跡経路 | `audit_log (target_type='tag_queue', target_id=queueId)` |
| queue 経由付与識別 | `source='admin_queue'` |
| ADR リンク | `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` |

### .claude/skills/aiworkflow-requirements/references/database-implementation-core.md

同じ内容を skill SSOT 側にも反映。drift を防ぐため両者を同一 PR で更新する。

## 07a 親タスクへの back-link

`docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` 行 10 に「ADR 0002 で closure」相当の補足追記。破壊的編集は避ける。

## Same-Wave Sync 判定

**判定: implemented_local_evidence_captured (docs-only / NON_VISUAL)**

ADR 0002 本体、`08-free-database.md`、`database-implementation-core.md`、07a 親 back-link、`task-specification-creator` rule promotion は本 cycle で実ファイルへ反映済み。Phase 12 strict 7 はテンプレートではなく、実行済み docs evidence として扱う。

root `artifacts.json` と `outputs/artifacts.json` は同一内容で配置し、Phase 13 は `blocked_pending_user_approval` のまま保持する。

## 検証

```bash
rg -n "0002-member-tags-assigned-via-queue-id" \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/database-implementation-core.md
```

期待: 両ファイルに ADR リンクがヒットする。

## Phase 12 記録

- 実際の追記行数: `git diff --stat` で確認する。
- 追記後の section: `outputs/phase-08/docs-updates.md` に記録済み。
