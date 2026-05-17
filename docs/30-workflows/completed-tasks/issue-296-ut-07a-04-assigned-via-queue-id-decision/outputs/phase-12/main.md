# Phase 12 main - UT-07A-04 assigned_via_queue_id decision

> **実装区分: ドキュメントのみ（docs-only）**
>
> 本タスクは ADR 起票・spec 同期・skill reference 同期のみで完結し、`apps/` および `packages/` 配下にコード差分を生成しない。CONST_004 例外条件に該当。Phase 5-7 はコード変更ではなく grep verification を evidence として記録する。

## サマリ

`member_tags.assigned_via_queue_id` 列を追加しない決定を ADR 0002 として正本化した。ADR `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` 起票・spec `08-free-database.md` の `member_tags` セクション追記・skill `database-implementation-core.md` の Schema Drift ADR Gate 節への ADR リンク追加・07a 親 `unassigned-task-detection.md` への closure back-link 追加を完了。Phase 1-12 の evidence は本 `outputs/` 配下に出力済み。Phase 13（commit / push / PR）は user 明示承認待ち。

## 採用判断

- 列を追加しない
- queue ↔ member_tags 追跡は `audit_log (target_type='tag_queue', target_id=queueId)` で代替
- `source='admin_queue'` で queue 経由付与を識別する既存運用を継続

## 判断根拠

1. audit_log で member_tags ↔ queue 追跡が SQL join により再構成可能
2. 列追加は migration / backfill / API schema / repository / test fixture / D1 row size に広範に波及
3. MVP 監査要件は audit_log で達成済み
4. `source='admin_queue'` で queue 経由付与は識別可能、queueId 直引きが必要な業務 query は現時点で存在しない

## 再評価トリガ

- (a) 監査画面で「特定 queue から確定したタグ一覧」を 1 クエリ表示する UI 要件発生
- (b) audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる場合
- (c) D1 read で audit join 性能問題が顕在化

## Phase 12 時点での evidence サマリ

- apps/ packages/ 差分: 0 件（`git status --porcelain -- apps/ packages/` empty 確認済み / Phase 7, 11 参照）
- ADR 新規: `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`（7 セクション完備）
- spec 更新: `docs/00-getting-started-manual/specs/08-free-database.md`（`### member_tags` セクション新設 + ADR 0002 リンク）
- skill 更新: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`（Schema Drift ADR Gate 節に ADR 0002 リンク + 再評価トリガ要約）
- 07a back-link: `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md:10` の UT-07A-04 行末に closure リンク追加
- grep verification: `rg "assigned_via_queue_id" apps/ packages/` = 0 hits / `rg "targetType.*tag_queue|target_type.*tag_queue" apps/api/src/` = 3 hits / repository/type `rg '"tag_queue"' ...` = 2 hits / `rg "'admin_queue'" apps/api/src/` = 1 hit

## 関連

- GitHub Issue #296（CLOSED, Refs only）
- 親タスク: 07a parallel tag assignment queue resolve workflow
- 原典: `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`
