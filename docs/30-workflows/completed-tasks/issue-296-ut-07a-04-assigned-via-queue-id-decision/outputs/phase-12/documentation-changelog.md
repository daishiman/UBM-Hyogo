# Phase 12 documentation-changelog - UT-07A-04

## 変更ファイル一覧

| パス | 種別 | 概要 |
| --- | --- | --- |
| `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` | 新規 | ADR 起票（Status: Accepted） |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 追記 | `member_tags` schema 確定理由 + ADR 0002 リンク |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | 追記 | skill SSOT 同期 |
| `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` | 追記 | ADR 0002 への back-link 追加 |
| `docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/**` | 新規 | 本タスク仕様書 + outputs |

## changelog fragment 案

```
- docs(ut-07a-04): ADR 0002 起票 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)
  - 08-free-database.md / database-implementation-core.md を同期
  - 07a 親 unassigned-task-detection.md に closure back-link を追加
```

## コード差分

なし（`apps/`, `packages/` 差分ゼロ）。Phase 7 / Phase 11 evidence 参照。

## 今回の仕様改善サイクルで反映した skill feedback

| 対象 | 反映先 | 内容 |
| --- | --- | --- |
| `task-specification-creator` | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | docs-only grep 代替と completed-tasks back-link 追記ルールを明文化 |
| `aiworkflow-requirements` | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | schema drift 検出時の ADR gate を明文化 |

## Phase 12 記録

- 実際の追加行数 / 削除行数: `git diff --shortstat` で確認する
- changelog 投入先: skill changelog と Phase 12 changelog に記録済み
