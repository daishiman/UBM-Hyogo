# Phase 9: review readiness

## PR 変更ファイル（想定）

Phase 13 commit 後に `git diff dev...HEAD --name-only` で確定する。Phase 8 時点で予想されるファイル一覧:

- `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`（新規）
- `docs/00-getting-started-manual/specs/08-free-database.md`（追記）
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`（追記）
- `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md`（追記）
- `docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/`（新規ディレクトリ全体）

docs-only diff であること: `git diff dev...HEAD --name-only | grep -v -E '^(docs/|\.claude/skills/)'` の出力が空。

## PR 説明文ドラフト

### タイトル

```
docs(ut-07a-04): ADR 0002 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)
```

### 本文

```
## Summary
- ADR `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` を新規起票し、`member_tags.assigned_via_queue_id` 列を追加しない決定を正本化
- `docs/00-getting-started-manual/specs/08-free-database.md` に `member_tags` の 6 列 schema を CREATE TABLE 付きで掲載し、ADR 0002 への相互参照を追加
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` の Schema Drift ADR Gate 節に ADR 0002 リンクと再評価トリガ要約を追加
- 07a 親 `unassigned-task-detection.md` 行 10（UT-07A-04）に ADR 0002 への closure back-link を追加

## 実装区分
ドキュメントのみ（コード差分ゼロ / 検証: `git diff dev...HEAD --stat -- apps/ packages/` = empty）

## 判断根拠
1. audit_log (`target_type='tag_queue', target_id=queueId`) で member_tags ↔ queue 追跡が SQL join 可能
2. 列追加は migration / backfill / API schema / repository / test に広範に波及
3. MVP 監査要件は audit_log で達成済み
4. `source='admin_queue'` で queue 経由付与は識別可能

## 再評価トリガ
(a) 監査 UI で特定 queue 由来タグ一覧を 1 クエリ表示する要件発生
(b) audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる場合
(c) D1 read で audit join 性能問題が顕在化

## Test plan
- [x] `rg "assigned_via_queue_id" apps/ packages/` = 0 hits
- [x] `git diff dev...HEAD --stat -- apps/ packages/` = empty
- [x] `pnpm typecheck` pass
- [x] `pnpm lint` pass

Refs #296
```

## レビュアー向け確認ポイント

1. ADR 0002 に Status / Context / Decision / Consequences / Alternatives considered / Re-evaluation triggers / References の 7 セクションが揃っているか。
2. spec `08-free-database.md` と skill `database-implementation-core.md` の双方から ADR 0002 への相互参照が機能しているか（リンク切れがないか）。
3. 07a 親 `unassigned-task-detection.md` の back-link が破壊的編集ではなく行末への補足として追記されているか。
4. `apps/` および `packages/` への差分が 0 件であることを `git diff dev...HEAD --stat -- apps/ packages/` で確認できるか。
5. CLAUDE.md 不変条件（D1 直接アクセス禁止 / admin-managed data 分離 / `*.spec.ts` only）に違反していないか。

## PR base ブランチ

`dev`（CLAUDE.md「PR作成の完全自律フロー」既定方針）。
