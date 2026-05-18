# Phase 13: PR 作成

[実装区分: 実装仕様書]

## 1. PR 作成は user 明示承認後のみ

本 Phase は **ユーザーが「PR 作成」「PR 出して」「diff-to-pr」と明示指示するまで実行禁止**。pre-flight verification は read-only で先行可。

## 2. base / head

| 項目 | 値 |
|------|----|
| base | `dev` |
| head | `feat/issue-775-serial-05-step-03-runtime-evidence-spec`（本 spec 作成時のブランチ。実装フェーズで継続利用） |

## 3. PR タイトル

```
feat(issue-775): SchemaDiffPanel runtime evidence completion (11 PNG)
```

70 文字以下。

## 4. PR 本文テンプレート

```markdown
## Summary

- Issue #775（CLOSED, refs_only）の SchemaDiffPanel runtime evidence を完遂
- 親 workflow `completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json` を `pass: true` / `verdict: PASS` に昇格
- canonical workflow root を後付け生成: `docs/30-workflows/completed-tasks/issue-775-serial-05-step-03-runtime-evidence-completion/`

## Scope

### Added
- Playwright spec / config (`apps/web/playwright.admin-schema-diff.config.ts`, `apps/web/playwright/tests/visual/admin-schema-diff.spec.ts`)
- D1 local seed fixture (`scripts/fixtures/serial-05-step-03/seed-{diff,cleanup}.sql`)
- storageState gitignore (`apps/web/playwright/.auth/.gitignore`)
- Phase 1-13 spec under `docs/30-workflows/issue-775-.../`
- 11 runtime PNG under parent workflow `outputs/phase-11/screenshots/`

### Modified
- `outputs/phase-11/manifest.json` → `pass: true` / `verdict: PASS`
- `outputs/phase-12/main.md` → `phase_status (11) = completed` / `workflow_state = completed`
- `outputs/phase-12/unassigned-task-detection.md` → 該当行 `consumed`
- `unassigned-task/serial-05-step-03-followup-001-runtime-evidence-completion.md` 末尾 frontmatter のみ追記

### Unchanged (frozen)
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/lib/admin/server-fetch.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/migrations/**`

## Screenshots

| Pane | Desktop | Mobile |
|------|---------|--------|
| added | ![](docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/admin-schema-diff-added-desktop.png) | ![](docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/admin-schema-diff-added-mobile.png) |
| changed | ![](.../admin-schema-diff-changed-desktop.png) | ![](.../admin-schema-diff-changed-mobile.png) |
| removed | ![](.../admin-schema-diff-removed-desktop.png) | ![](.../admin-schema-diff-removed-mobile.png) |
| unresolved | ![](.../admin-schema-diff-unresolved-desktop.png) | ![](.../admin-schema-diff-unresolved-mobile.png) |

Resolve feedback: success / 409 / 422 toast の 3 PNG も `outputs/phase-11/screenshots/` 配下に追加。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --config=playwright.admin-schema-diff.config.ts` 11 passed
- [ ] grep gate: `bg-[#` / `text-[#` / `127.0.0.1:` / `process.env.` 0 match in admin/schema scope
- [ ] frozen file diff 0: `git diff dev...HEAD --stat | grep -E '(SchemaDiffPanel|admin/api|server-fetch|admin/schema\.ts|app/\(admin\)/admin/schema/page)'` empty
- [ ] PNG sizes ≤ 500KB each
- [ ] `apps/web/playwright/.auth/admin.json` not committed (storageState gitignored)
- [ ] `bash scripts/verify-pr-ready.sh` exit 0

Refs #775

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 作成コマンド

```bash
gh pr create --base dev --title "feat(issue-775): SchemaDiffPanel runtime evidence completion (11 PNG)" \
  --body "$(cat <<'EOF'
<本文テンプレート>
EOF
)"
```

## 6. PR 後の処理

- 本 workflow root `artifacts.json` の Gate-C を `passed` に
- PR merge 後、本 workflow root を `completed-tasks/` 配下へ移動するかは別判断（親 workflow 既に completed-tasks 配下のため、本 recovery workflow も同階層へ移動が自然）
- Issue #775 は CLOSED のままにし、reopen / comment は行わない（refs_only ポリシー）

## 7. 注意

- `Closes #775` / `Fixes #775` 禁止（issue は既に closed）
- merge は CI green かつ user 明示承認後のみ
- merge 後の post-merge hook で indexes drift が出た場合は `pnpm indexes:rebuild` 手動実行
