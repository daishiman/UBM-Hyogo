# Phase 13: PR 作成 — task-389-privacy-terms-pages-impl

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

ユーザー承認後に commit → push → PR 作成 を実行する手順を固定する。**本仕様書作成では実行しない。**

## 前提

- Phase 1〜12 が完了し、local gate (Phase 7) PASS。runtime deploy gate はユーザー承認後に実行。
- ユーザーが明示的に「PR 作成」「diff-to-pr」を指示
- CLAUDE.md `PR作成の完全自律フロー` の手順に従う

## ブランチ戦略

```
feature/task-389-privacy-terms-pages-impl
  --PR--> dev (staging)
  --PR--> main (production)
```

solo dev 運用ポリシー（CLAUDE.md）に従い、required reviewers は 0。CI gate のみで保護。

## 実行手順（ユーザー承認後）

```bash
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout feature/task-389-privacy-terms-pages-impl
git merge main                # コンフリクトは CLAUDE.md 規定に従い解消
git status --short            # clean を確認
mise exec -- pnpm install --force
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- privacy terms
mise exec -- pnpm --filter @ubm-hyogo/web build
git add apps/web/app/privacy apps/web/app/terms docs/30-workflows/task-389-privacy-terms-pages-impl
git commit -m "$(cat <<'EOF'
feat(web): /privacy /terms 本実装 + OAuth verification 対応 (#389)

- apps/web/app/{privacy,terms}/page.tsx を暫定 OAuth URL ready 文面で deploy
- semantic render test で必須セクションを保証
- OAuth consent screen に URL 登録

Refs #389

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin feature/task-389-privacy-terms-pages-impl

gh pr create --title "feat(web): /privacy /terms 本実装 + OAuth verification 対応 (#389)" --body "$(cat <<'EOF'
## Summary
- /privacy /terms ページを本実装し、Cloudflare Workers にデプロイ
- Google OAuth verification (Stage B-2) の consent screen URL 要件を充足
- semantic render test で必須セクション存在を保証

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] mise exec -- pnpm --filter web test -- privacy terms
- [ ] staging /privacy /terms HTTP 200
- [ ] production /privacy /terms HTTP 200
- [ ] OAuth consent screen URL 設定 screenshot 確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 自走禁止事項

- ユーザー承認なしの `git push` / `gh pr create` 禁止
- `--no-verify` 禁止
- production への `bash scripts/cf.sh deploy --env production` は別承認

## 完了条件

- [ ] PR URL がユーザーに報告されている
- [ ] CI status が PASS
- [ ] Issue #389 に PR がリンクされている（CLOSED Issue のため `Refs #389`）
- [ ] `outputs/phase-13/main.md` を作成する
