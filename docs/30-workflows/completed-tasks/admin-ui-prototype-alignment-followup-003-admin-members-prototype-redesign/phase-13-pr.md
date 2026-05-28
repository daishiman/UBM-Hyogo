# Phase 13 — PR 作成

[実装区分: 実装仕様書]

> **user-gated**: commit / push / PR / staging deploy / visual baseline 生成は user 明示承認後にのみ実行する。本仕様書は実行手順を定義するのみ。

## 1. PR base / title

| 項目 | 値 |
| --- | --- |
| base branch | `dev` |
| head branch | `feat/admin-members-prototype-redesign` |
| title | `feat(admin-members): prototype-aligned redesign + staging 404 recovery` |

## 2. PR 本文テンプレート

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として使用。`outputs/phase-12/implementation-guide.md` の主要見出しを反映する。

```markdown
## Summary
- /admin/members を `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366 と視覚言語整合（avatar / state chip / 公開 Switch / Drawer 4セクション構成）
- staging 404 (`ADMIN_FETCH_404`) の根因を切り分け、最小修正で 200/401 に整流
- Playwright visual baseline 16 PNG (4 viewport × 4 state) を追加

## Test plan
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test --run`
- [ ] `pnpm --filter @ubm-hyogo/api test --run admin`（404 regression）
- [ ] `pnpm verify:design-tokens`
- [ ] `pnpm gate-metadata:validate`
- [ ] `pnpm verify:phase12-compliance`
- [ ] staging deploy 後 `curl -i https://<api-staging-host>/admin/members` で 401 (unauth) / 200 (auth)
- [ ] ブラウザで /admin/members を開き、prototype と視覚一致を確認
```

## 3. 実行コマンド

```bash
git status --porcelain
git add -A
git commit -m "$(cat <<'EOF'
feat(admin-members): prototype-aligned redesign + staging 404 recovery

- in-place rewrite of MembersTable / Filters / Drawer / ClientShell per prototype
- staging 404 root cause fix (auth middleware 401 normalization or env URL)
- new primitives: MemberAvatar / MemberStateChip / MemberPublishSwitch / TagPill / PillNav
- Playwright visual baseline (4 viewport × 4 state = 16 PNG)
- HEX 直書き 0 件 / verify-design-tokens PASS

Refs: docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

git push -u origin feat/admin-members-prototype-redesign

gh pr create --base dev --title "feat(admin-members): prototype-aligned redesign + staging 404 recovery" --body "$(cat outputs/phase-12/implementation-guide.md)"
```

## 4. PR 後オペレーション

- staging deploy 完了後、ブラウザで /admin/members を実走確認
- visual baseline が必要なら `RUN_VISUAL=1` で playwright `--update-snapshots` → 空 commit で required checks 再トリガー（feedback_visual_baseline_github_token_retrigger に従う）
- staging で 200 確認後、本ワークフロー dir を `docs/30-workflows/completed-tasks/` へ移動し関連 stale 参照を補修

## 5. メモ

`gh pr create` 実行前に必ず `bash scripts/verify-pr-ready.sh` を走らせて pre-flight 通過を確認する。
