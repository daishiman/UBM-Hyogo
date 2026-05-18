---
phase: 13
title: Commit / PR draft
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

## 1. commit 粒度（グループ単位 × 6 + adapter + fallback）

| # | scope | commit message | 含む変更 |
|---|-------|----------------|----------|
| C-1 | adapter | `feat(serial-05): add view adapter layer (public-members/admin-dashboard/member-profile)` | `apps/web/src/lib/adapters/*.ts` + `__tests__/*.spec.ts` |
| C-2 | G-T | `feat(serial-05): bind blueprint 09e:67-160 to / (home)` | `apps/web/app/page.tsx` |
| C-3 | G-M | `feat(serial-05): bind blueprint 09e:208-472 to /members and /members/[id]` | `apps/web/app/(public)/members/{,[id]/}page.tsx` |
| C-4 | G-A | `feat(serial-05): bind blueprint 09f:30-110 to /login` | `apps/web/app/login/page.tsx` (+ error.tsx) |
| C-5 | G-R | `feat(serial-05): bind blueprint 09e:473-680 to /register, /privacy, /terms` | `apps/web/app/(public)/register/page.tsx`, `apps/web/app/{privacy,terms}/page.tsx` |
| C-6 | G-D | `feat(serial-05): bind blueprint 09g:4-161 and 09f:111-280 to /admin and /profile` | `apps/web/app/(admin)/admin/page.tsx`, `apps/web/app/profile/page.tsx` |
| C-7 | G-G | `feat(serial-05): bind blueprint 09g:162-940 to admin governance routes` | `apps/web/app/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}/page.tsx` |
| C-8 | G-F | `chore(serial-05): align fallback chrome (error/not-found) to blueprint 09h` | `apps/web/app/{error,not-found}.tsx` |
| C-9 | evidence | `chore(serial-05): refresh phase-11 evidence inventory` | `outputs/phase-11/*` |

## 2. PR base ブランチ

`dev`（CLAUDE.md PR 作成既定）。production リリース時のみ `main`。

## 3. PR title

`feat(serial-05): bind 09e/f/g blueprints to 19 routes (page.tsx layer)`

## 4. PR body draft

```markdown
## Summary

- UI prototype design system foundation の `serial-05-page-routes-blueprint-binding` を完了
- 19 routes 全 page.tsx を 09e/f/g blueprint と 1:1 で照合
- view adapter 層（`apps/web/src/lib/adapters/`）を新規追加し、既存 API shape と blueprint shape の乖離を吸収
- 新規 primitive / API endpoint / D1 schema 変更なし

## Scope

- 公開 6 routes（/, /(public)/members, /(public)/members/[id], /(public)/register, /privacy, /terms）
- 会員 2 routes（/login, /profile）
- 管理 8 routes（/(admin)/admin と 7 governance routes）
- Fallback 3（error/not-found/loading）

## Dependency

本 PR は parallel-01..04 の merge 完了を前提とする。前提 SW のいずれかが未完了の場合 visual snapshot が drift する。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` exit 0
- [ ] `playwright-smoke / smoke (chromium)` 19 routes pass
- [ ] `playwright-smoke / visual (chromium, 4 screens)` snapshot 取得
- [ ] `verify-design-tokens` exit 0
- [ ] `verify-test-suffix` exit 0
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] grep gate G-1..G-8 全件 OK（Phase 7）

## Evidence

- `outputs/phase-11/playwright-smoke.json`
- `outputs/phase-11/verify-design-tokens.log`
- `outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png`
- `outputs/phase-11/routes-inventory.md`

## Out of scope

- Form 再回答 → 本人更新の実装（MVP 仕様維持）
- MemberDetail の response_fields 描画（serial-06）
- visual baseline 固定（serial-07）
- login/profile の route group 物理移動

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 5. PR 作成コマンド（CLAUDE.md 自律フロー準拠）

```bash
git fetch origin dev
git checkout dev && git pull --ff-only
git checkout <feature-branch>
git merge dev
# conflict 解消 → commit

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

git push -u origin <feature-branch>
gh pr create --base dev --title "feat(serial-05): bind 09e/f/g blueprints to 19 routes (page.tsx layer)" --body "$(cat <<'EOF'
... 上記 body ...
EOF
)"
```

## 6. レビュアー指定

solo 運用ポリシーに従い必須レビュアー 0。CODEOWNERS（`apps/web/**`）の owner は `@daishiman` のみ。

## 7. ロールバック

- PR 単位 revert
- commit 粒度（C-1〜C-9）で部分 revert も可能
- adapter 層を残して page.tsx だけ revert することも可能（adapter は pure function で副作用なし）

## 8. completion artifact

PR merge 後:

1. `outputs/phase-11/_archive/<merge-date>/` に evidence をアーカイブ
2. `docs/30-workflows/ui-prototype-design-system-foundation/index.md` の SW-05 を `completed` に更新
3. `serial-06` 着手の前提条件チェックを実行
