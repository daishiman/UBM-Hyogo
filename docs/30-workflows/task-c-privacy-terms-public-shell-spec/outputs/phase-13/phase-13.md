# Phase 13 — PR作成

## 1. ブランチ / base

- 作業ブランチ: `feat/privacy-terms-public-shell`（or 親ワークフロー集約ブランチ `feat/public-header-logged-in-nav-cleanup` の一部としてマージする場合は別途）
- PR base: `dev`

## 2. PR タイトル

```
feat(public): /privacy /terms を公開シェルでラップしナビゲーション復活
```

## 3. PR 本文テンプレ

```markdown
## Summary
- `/privacy`, `/terms` を `<PublicHeader authView />` + `<PublicFooter />` でラップし、ヘッダ / フッタの消失を解消
- `getAuthView()` 経由で session-aware CTA を全公開画面で統一（Task A 連動）
- 既存 metadata と LegalProse 本文は不変（法務確認済み暫定版を温存）

## Changes
- `apps/web/app/privacy/page.tsx`: async 化 + shell ラップ
- `apps/web/app/terms/page.tsx`: 同上
- `apps/web/app/privacy/__tests__/page.spec.tsx`: 新規
- `apps/web/app/terms/__tests__/page.spec.tsx`: 新規

## Test plan
- [x] mise exec -- pnpm typecheck
- [x] mise exec -- pnpm lint
- [x] vitest: app/privacy/__tests__/page.spec.tsx
- [x] vitest: app/terms/__tests__/page.spec.tsx
- [x] bash scripts/verify-pr-ready.sh
- [ ] staging で /privacy /terms を guest / member / admin で目視確認

## Screenshots
- outputs/phase-11/evidence/privacy-guest.png
- outputs/phase-11/evidence/privacy-member.png
- outputs/phase-11/evidence/privacy-admin.png
- outputs/phase-11/evidence/terms-guest.png
- outputs/phase-11/evidence/terms-member.png
- outputs/phase-11/evidence/terms-admin.png

## Related
- Parent workflow: docs/30-workflows/public-header-logged-in-nav-cleanup/
- Source task: docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-c-privacy-terms-public-shell.md
- Depends on: Task A (PublicHeader async + getAuthView)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. 作成コマンド（ユーザー承認後）

```bash
gh pr create --base dev --title "feat(public): /privacy /terms を公開シェルでラップしナビゲーション復活" --body "$(cat <<'EOF'
... 上記本文 ...
EOF
)"
```

## 5. ゲート

- [ ] Phase 9 自動チェック全 green
- [ ] Phase 11 evidence 取得済
- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` に想定 4 file のみ（or 親ワークフローと bundled の場合は親仕様参照）
- [ ] ユーザー承認後に `gh pr create` 実行
