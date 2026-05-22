# Phase 8: ドキュメント更新差分一覧

本 Phase で生成・編集した実 ドキュメント差分の一覧。

| パス | 種別 | 変更要旨 |
| --- | --- | --- |
| `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` | 新規 | ADR 0002 正本。Status: Accepted (2026-05-16)。Decision: `member_tags.assigned_via_queue_id` 列を追加しない。Alternatives / Re-evaluation triggers / References 7 セクション完備。 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 追記 | `### member_tags` セクションを `### tag_assignment_queue` の直前に新設。6 列 CREATE TABLE を掲載し、ADR 0002 への相互参照リンクと再評価トリガを明示。 |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | 追記 | Schema Drift ADR Gate 節の `member_tags.assigned_via_queue_id` 一文に ADR 0002 への相対パスリンクと再評価トリガ要約を追加。 |
| `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` | 追記（行末補足） | UT-07A-04 行に「closure: ADR 0002（列を追加しない / Refs #296）」の back-link を追加。破壊的編集はしない。 |
| `docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-{01..11}/*.md` | 新規 | Phase 1-11 の evidence / 設計成果物。 |

## 検証

### (1) ADR 新規作成確認

```
$ ls docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md
docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md
```

### (2) spec / skill から ADR 0002 への相互参照

```
$ rg -n "0002-member-tags-assigned-via-queue-id" \
    docs/00-getting-started-manual/specs/08-free-database.md \
    .claude/skills/aiworkflow-requirements/references/database-implementation-core.md
docs/00-getting-started-manual/specs/08-free-database.md:... [ADR 0002](../../decisions/0002-member-tags-assigned-via-queue-id-decision.md)
.claude/skills/aiworkflow-requirements/references/database-implementation-core.md:... [ADR 0002](../../../../docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md)
```

### (3) 07a 親の back-link

```
$ rg -n "0002-member-tags" \
    docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md
... closure: [ADR 0002](../../../../../decisions/0002-member-tags-assigned-via-queue-id-decision.md) ...
```

### (4) apps/ packages/ 差分ゼロ再確認

```
$ git status --porcelain -- apps/ packages/
(出力なし) → OK
```

## changelog fragment

本リポジトリには `docs/changelogs/` ディレクトリが存在しないため、changelog fragment は本 docs-updates.md
および Phase 12 `documentation-changelog.md` に集約する。各 ADR / spec / skill ファイルの先頭・末尾には
個別の更新履歴ブロックを持たない運用に従う（既存 ADR 0001 と同じ）。
