# Phase 13 — PR 作成

> CONST_002: user 明示承認後のみ実施する。本仕様書は手順のみ確定し、コマンド実行はしない。

---

## 1. 事前確認

```bash
git status --porcelain        # 想定: 0 行
git diff dev...HEAD --name-only  # 想定: §3 の対象ファイル一覧と一致
gh pr list --base dev --head feat/admin-requests-prototype-alignment-and-404-fix
```

---

## 2. 品質 gate（再走）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

---

## 3. PR 想定差分

| パス | 種別 |
|------|------|
| `docs/30-workflows/completed-tasks/admin-requests-prototype-alignment-and-404-fix/**` | docs |
| `apps/api/src/routes/admin/requests.spec.ts` | test |
| `apps/web/app/(admin)/admin/requests/page.tsx` | code |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | code |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | code |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | code |
| `apps/web/playwright/tests/visual/admin-staging.spec.ts` | test |
| `apps/web/playwright/tests/visual/admin-staging.spec.ts-snapshots/*-linux.png` | baseline |

---

## 4. PR 本文テンプレ

```markdown
# feat(admin-requests): プロトタイプ整合 + ADMIN_FETCH_404 修正

## Summary
- `/admin/requests` の wrapper を `page-enter stack-lg` + `page-head` へ揃え、admin shell 整合
- staging `ADMIN_FETCH_404` を root cause（bundle drift / URL drift / mount drift）の決定木で修正
- `apps/api/src/routes/admin/requests.spec.ts` regression spec を追加（TC-A-01〜06+α）
- Playwright admin-staging-visual に `/admin/requests` baseline を追加

## Test plan
- [ ] `pnpm --filter @repo/api test -- requests` green
- [ ] `pnpm --filter web build` green
- [ ] `pnpm --filter web exec playwright test --project=admin-staging-visual` green
- [ ] staging curl `/admin/requests?status=pending&type=visibility_request` → 200
- [ ] visual baseline 2 枚採取

## Screenshots
- admin-requests-visibility-empty-linux.png
- admin-requests-delete-empty-linux.png

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 5. 実行コマンド（user 承認後）

```bash
git add <差分>
git commit -m "feat(admin-requests): prototype alignment + ADMIN_FETCH_404 fix"
git push -u origin feat/admin-requests-prototype-alignment-and-404-fix
gh pr create --base dev --title "feat(admin-requests): prototype alignment + ADMIN_FETCH_404 fix" \
  --body "$(cat <<'EOF'
...
EOF
)"
```

---

## 6. DoD

- [ ] PR URL 取得。
- [ ] CI 全 required check green。
- [ ] solo dev policy（必須レビュアー 0）のもと merge 候補。
