# Phase 13: PR 作成・base=dev・Refs #296

## 目的

Phase 1-12 完了後、user 明示承認のもとで commit / push / PR 作成を行う。Issue #296 は既に CLOSED のため `Closes #296` ではなく `Refs #296` で扱う。base ブランチは `dev` 固定。

## 入力

- Phase 9 PR 説明文ドラフト
- Phase 12 implementation-guide.md
- `.claude/commands/ai/diff-to-pr.md`
- CLAUDE.md「PR作成の完全自律フロー」

## 作業手順

1. user の明示承認を得る（本 Phase は `blocked_pending_user_approval`）。
2. `git status --porcelain` を確認し、未コミット変更（Phase 8 で生成した docs / ADR / skill reference）を確認する。
3. `git fetch origin dev && git merge origin/dev` を実行し、ローカル `dev` を最新化したうえで作業ブランチに取り込む。
4. コンフリクト発生時は CLAUDE.md「コンフリクト解消の既定方針」に従い解消し、commit する。
5. 品質検証 3 件を実行:
   - `mise exec -- pnpm install --force`
   - `mise exec -- pnpm typecheck`
   - `mise exec -- pnpm lint`
6. `git add` で docs / ADR / skill reference を明示的に staging（`git add -A` は使わず、ファイル名指定）。
7. commit message:
   ```
   docs(ut-07a-04): ADR 0002 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)
   ```
8. `git push -u origin <branch>` で push。
9. `gh pr create --base dev` で PR を作成。本文は Phase 9 ドラフトを元に HEREDOC で渡す。
10. PR URL を最終レポートに記載する。
11. Issue #296 は CLOSED のため、コメント `Refs ADR 0002 (#<new-pr-number>)` を追加して closure trace を残す（任意）。

## 出力成果物

- `outputs/phase-13/pr-summary.md`
  - 作成した PR URL
  - 作業ブランチ名
  - 採用 base = `dev`
  - 実行した自動修復（あれば）
  - 残課題（あれば）

## 検証コマンド

```bash
# (1) 未コミット差分の確認
git status --porcelain

# (2) PR に含まれる差分が docs-only であること
git diff dev...HEAD --name-only | grep -v -E '^(docs/|\.claude/skills/)' || echo "OK: docs-only"

# (3) 品質検証
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# (4) PR 作成（user 承認後）
gh pr create --base dev --title "docs(ut-07a-04): ADR 0002 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)" --body-file <(cat <<'EOF'
## Summary
- ADR `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` を新規起票し、`member_tags.assigned_via_queue_id` 列を追加しない決定を正本化
- `docs/00-getting-started-manual/specs/08-free-database.md` と `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` を同期
- 07a 親 `unassigned-task-detection.md` に back-link を追加し closure trace を確立

## 実装区分
ドキュメントのみ（コード差分ゼロ / 検証: `git diff dev...HEAD --stat -- apps/ packages/` = empty）

## 判断根拠
1. audit_log (`target_type='tag_queue', target_id=queueId`) で member_tags ↔ queue 追跡が SQL join 可能
2. 列追加は migration / backfill / API schema / repository / test に広範に波及
3. MVP 監査要件は audit_log で達成済み
4. `source='admin_queue'` で queue 経由付与は識別可能

## 再評価トリガ
(a) 監査 UI で特定 queue 由来タグ一覧を 1 クエリ表示する要件発生 / (b) audit_log retention 短縮 / (c) D1 read で audit join 性能問題

## Test plan
- [x] `rg "assigned_via_queue_id" apps/ packages/` = 0 hits
- [x] `git diff dev...HEAD --stat -- apps/ packages/` = empty
- [x] `pnpm typecheck` pass
- [x] `pnpm lint` pass

Refs #296

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)
```

## DoD

- [ ] user 明示承認を得た
- [ ] `dev` を取り込んだ
- [ ] 品質検証 3 件すべて pass
- [ ] docs-only であることを再確認した（apps/ packages/ 差分ゼロ）
- [ ] commit / push / PR 作成完了
- [ ] PR URL を `outputs/phase-13/pr-summary.md` に記録
- [ ] base = `dev` であることを確認
- [ ] PR 本文に `Refs #296` を含めた
