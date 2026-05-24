# Phase 13 — PR 作成

## ブランチ

`feat/issue-55-notification-channel-optout` → base `dev`

## PR タイトル例

`feat(issue-55): notification channel abstraction + member opt-out gate`

## PR 本文テンプレート

```markdown
## Summary
- Introduce `NotificationChannel` interface + registry; wrap existing mail dispatcher as `MailNotificationChannel` (closes #55 abstraction gap).
- Add `member_status.notification_opt_out`, `notification_outbox.channel`, and expanded notification ledger events (migration 0020); enqueue path skips opted-out members and records `skipped_opt_out`.
- Add `PATCH /admin/members/:memberId/notification-pref` + `MemberDrawer` toggle UI for operator-driven opt-out management.

## Test plan
- [ ] `pnpm -F @ubm-hyogo/api test`（channel / registry / outbox / routes / dispatchTick spec all green）
- [ ] `pnpm -F @ubm-hyogo/web test`（admin members 詳細 component spec green）
- [ ] `pnpm typecheck && pnpm lint`
- [ ] `bash scripts/verify-pr-ready.sh`
- [ ] D1 migration list で 0020 が pending として表示される
- [ ] 手動 S-01〜S-03（Phase 11）

Closes #55

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 作成コマンド（ユーザー承認後に実行）

```bash
gh pr create --base dev --title "feat(issue-55): notification channel abstraction + member opt-out gate" --body "$(cat <<'EOF'
...上記テンプレート...
EOF
)"
```

## DoD

- PR が `dev` を base に作成される
- `Closes #55` を本文に含む
- 必要な CI（ci / pr-build-test / verify-gate-metadata / verify-phase12-compliance / verify-indexes-up-to-date / d1-migration-verify）がすべて green
