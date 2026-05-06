# Phase 13: コミット・PR 作成【BLOCKED PLACEHOLDER】

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 状態 | **blocked_pending_user_approval** |
| ブロック理由 | 物理削除を伴う不可逆実装。commit / push / PR 作成は user 明示承認後にのみ実行可。production apply enable (`RETENTION_PURGE_MODE=apply`) はさらに別ゲート（Gate C）として分離 |

## ⚠️ 実行禁止事項（spec 段階）

本ファイルは user 承認前の placeholder であり、以下のアクションを **絶対に実行してはならない**:

- [ ] `git commit`
- [ ] `git push`
- [ ] `gh pr create`
- [ ] `gh pr merge`
- [ ] `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod`
- [ ] `bash scripts/cf.sh deploy --env production`
- [ ] production cron trigger の有効化

## 実行解放条件（すべて満たした後のみ進行）

- [ ] Phase 1 GO 判定が記録
- [ ] Phase 5 で `apps/api/src/jobs/retention-purge.ts` ほか実装ファイル群が実体配置
- [ ] Phase 5 で migration ファイル 2 件が実体配置
- [ ] Phase 5 で `wrangler.toml` cron 設定追記
- [ ] Phase 5 で approve 通知テンプレ更新
- [ ] Phase 9 品質検証（typecheck / lint / test / coverage / migration drift / index drift）PASS
- [ ] Phase 11 NON_VISUAL evidence 7 ファイルすべて実体配置（staging で取得済）
- [ ] Phase 12 7 ファイル実体 + compliance check PASS
- [ ] **Gate B: git publish approval**（"Phase 13 を実行してよい" 等の user 明示）

## 実行解放後の手順（参考）

```bash
# 1) ブランチ確認
git status
git branch --show-current
# 期待: feat/issue-402-admin-request-retention-physical-delete-task-spec

# 2) ステージング
git add docs/30-workflows/issue-402-admin-request-retention-physical-delete/ \
        .claude/skills/aiworkflow-requirements/references/data-retention-policy.md \
        .claude/skills/aiworkflow-requirements/indexes/ \
        apps/api/src/jobs/retention-purge.ts \
        apps/api/src/jobs/index.ts \
        apps/api/src/services/admin-request.ts \
        apps/api/src/templates/admin-request-approved.ts \
        apps/api/wrangler.toml \
        db/migrations/

# 3) commit
git commit -m "$(cat <<'EOF'
feat(api): add retention purge job and physical delete policy (#402)

- 180 日経過後の deleted_members を Cloudflare Cron Trigger (daily 03:00 JST) で物理削除
- 子テーブル (member_responses / member_identities / member_status) を連鎖削除
- audit_log には PII を含まない `after_json`（`member_id` / `purged_at` / `retention_policy_version`）のみ記録
- dry-run mode を提供し副作用 0 で対象 ID を確認可能
- approve 時通知メールに retention deadline / 本削除予定日 / 7 日以内復旧境界を明記
- rollback 3 段経路（pre-purge SQL / 7 日以内 D1 PITR / 7 日超過は不可逆）を Phase 10 で確定
- SSOT data-retention-policy.md を新規追加し indexes 再生成

Refs: #402

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4) push
git push -u origin feat/issue-402-admin-request-retention-physical-delete-task-spec

# 5) PR 作成
gh pr create --base main \
  --title "feat(api): add retention purge job and physical delete policy (#402)" \
  --body "$(cat <<'EOF'
## Summary
- Issue #402 (CLOSED) に対する retention purge job を追加
- delete request 承認後 180 日経過した deleted_members を Cloudflare Cron Trigger で物理削除
- 子テーブル連鎖削除 / audit_log 差分行（PII なし）/ dry-run mode / member 通知文言 / rollback 3 段経路を実装
- SSOT \`.claude/skills/aiworkflow-requirements/references/data-retention-policy.md\` を新規追加

## 不可逆境界
- 物理削除実行後 7 日以内: D1 Time Travel で復旧可能
- 7 日超過: 復旧不可（運用ポリシー / member 通知に明記済）

## Test plan
- [ ] staging で seed → dry-run → 1 件 apply → audit_log 差分 1 件確認
- [ ] cron trigger 経由で自動実行可能
- [ ] 非対象 row（`datetime(deleted_at, '+180 days') > datetime('now')`）が drift なし
- [ ] approve 時通知メールに retention deadline / 本削除予定日 / 7 日復旧境界が含まれる
- [ ] migration が staging に apply 済み

## Implementation guide
詳細は \`docs/30-workflows/issue-402-admin-request-retention-physical-delete/outputs/phase-12/implementation-guide.md\` を参照。

## Production cron enable (Gate C)
本 PR merge 後、別ゲートとして production cron trigger 有効化を別承認で実行する。

Refs: #402

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# 6) CI 確認
gh pr view --json number,url,statusCheckRollup
```

## ロールバック（PR merge 後 / production apply 後に問題発生時）

Phase 10 の rollback 3 段経路を参照:
1. **pre-purge**: SQL で `deleted_at` を補正し purge 対象外へ戻す
2. **7 日以内**: `bash scripts/cf.sh d1 time-travel restore ubm-hyogo-db-prod --bookmark <BOOKMARK>`
3. **7 日超過**: 復旧不可（member 合意済）

## Phase 13 ステータス

`blocked_pending_user_approval` を維持。user の "Phase 13 を実行してよい" / "PR を作成してよい" 等の明示承認後にのみ上記手順を実行する。
