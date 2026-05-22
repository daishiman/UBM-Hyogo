# Phase 8: ドキュメント更新（ADR + spec + skill）

## 目的

本タスクで唯一実体的な差分を生成する Phase。Phase 3 で起草した ADR を `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` として正式コミットし、`docs/00-getting-started-manual/specs/08-free-database.md` と `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` に schema 確定理由を相互参照付きで同期する。

## 入力

- Phase 3 成果物 `outputs/phase-03/adr-draft.md`
- `docs/decisions/`（ADR 連番確認）
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md`（行 10 への back-link 対象）

## 作業手順

1. `docs/decisions/` 配下の既存 ADR を確認し、連番を確定する（不在なら `0002-`、既存があれば次番）。
2. Phase 3 草案を ADR 正式ファイルとして書き出す: `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`
3. `docs/00-getting-started-manual/specs/08-free-database.md` の `member_tags` セクションに以下を追記:
   - 現行 6 列構成（`member_id, tag_id, source, confidence, assigned_at, assigned_by`）の確定理由
   - `assigned_via_queue_id` を追加しない決定の参照（ADR 0002 へのリンク）
   - queue 追跡は `audit_log (target_type='tag_queue')` 経由である旨
4. `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` の対応セクションを 3 と同等に同期する。
5. 07a 親 `outputs/phase-12/unassigned-task-detection.md` 行 10（UT-07A-04 行）に「本 ADR 0002 で closure」相当の追記を行う（破壊的編集は避け、行末に補足を append、もしくは脚注を追加する）。
6. changelog fragment を追加する: `docs/changelogs/` 配下（既存運用に合わせる）or 各 doc 末尾の更新履歴に「ADR 0002 起票 (#296)」エントリを追加。
7. 全更新差分を `outputs/phase-08/docs-updates.md` に集約し、ファイルパスと変更要旨を表で記録する。

## 出力成果物

- `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`（新規）
- `docs/00-getting-started-manual/specs/08-free-database.md`（追記）
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`（追記）
- `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md`（back-link 追記）
- `outputs/phase-08/docs-updates.md`（差分一覧）

## 検証コマンド

```bash
# (1) ADR が新規作成された
ls docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md

# (2) spec / skill に ADR 0002 リンクが追加された
rg -n "0002-member-tags-assigned-via-queue-id" \
  docs/00-getting-started-manual/specs/08-free-database.md \
  .claude/skills/aiworkflow-requirements/references/database-implementation-core.md

# (3) 07a 親の back-link
rg -n "ADR 0002|0002-member-tags" \
  docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md

# (4) apps/ packages/ に差分が無いこと（再確認）
git diff dev...HEAD --stat -- apps/ packages/
```

## DoD

- [ ] ADR `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` が作成された
- [ ] spec `08-free-database.md` に schema 確定理由と ADR リンクが追記された
- [ ] skill reference `database-implementation-core.md` が同期された
- [ ] 07a 親 `unassigned-task-detection.md` に back-link が追加された
- [ ] changelog fragment を追加した
- [ ] `outputs/phase-08/docs-updates.md` に差分一覧を記録した
- [ ] `apps/ packages/` に差分が無いことを再確認した
