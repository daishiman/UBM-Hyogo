---
phase: 13
title: Commit / PR draft — タイトル・本文・required status check 候補
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 13 — Commit / PR draft

[実装区分: 実装仕様書]

> **実行前提**: PR 作成（`gh pr create`）・commit・push はユーザー明示承認後のみ実施する（CLAUDE.md / memory `feedback_pr_autonomous_workflow` は「PR まで」指示時のみ自律）。

## 1. branch / base

| 項目 | 値 |
|------|-----|
| base branch | `dev`（CLAUDE.md 既定 / memory `feedback_default_branch_dev`） |
| feature branch | `feat/ut-dsf-07-staging-visual-runtime-spec` |
| 想定 commit 数 | 3-4（config+spec / baseline / evidence / parent gate 解除） |

## 2. PR タイトル

```
feat(ut-dsf-07): staging runtime visual evidence (4 screens) + root VISUAL_RUNTIME_OK release
```

70 文字以内。

## 3. PR 本文（draft）

```markdown
## Summary

GitHub issue #829（`[UT-DSF-07]`, CLOSED）を現コードに最適化し、production-equivalent runtime（Cloudflare Workers staging）での visual evidence を取得して parent `ui-prototype-design-system-foundation` の `VISUAL_RUNTIME_PENDING` を解除する。

- `staging-visual` Playwright project を新設（baseURL=staging / local `visual-chromium` と非衝突）
- 4 screens（public-top / login / profile / admin-dashboard）の staging baseline を取得
- `bash scripts/cf.sh deploy --env staging` で staging 配備 → screenshot 取得 → evidence 配置
- parent `index.md` / `artifacts.json` を `VISUAL_RUNTIME_OK` + Gate-B/C `passed` に更新

## Scope

- 新規 spec: `apps/web/playwright/tests/visual-staging/{public-top,login,profile,admin-dashboard}.spec.ts`
- `apps/web/playwright.config.ts` に `staging-visual` project + `isStagingVisual` 分岐
- `apps/web/package.json` に `e2e:visual:staging` script
- baseline PNG（CI ubuntu-latest 生成 `-staging-visual-chromium-linux.png`）4 枚
- `outputs/phase-11/` に 7 ログ + 4 screenshot + 4 metadata = 15 evidence

## Out of scope

- 新規 API endpoint / D1 schema / Google Form 仕様変更
- 認証後 profile / admin の runtime 描画（未認証 guard 描画で design system shell を担保。フォロー候補）
- members-list / member-detail の staging visual（現コード実装済み 4 spec に合わせる）
- production deploy
- 新規 mock fixture / seed
- branch protection の `gh api -X PUT`（ユーザー明示承認待ち）

## 設計上の重要判断（SSR データ制約）

Cloudflare Workers の SSR fetch は Playwright `page.route()` で差し替え不可（ブラウザ fetch のみ intercept）。本 PR の検証対象は **OpenNext bundle が design system（OKLch token / `@layer` / rhythm / primitives）を local と等価に描画するか**であり、API データ内容の一致ではない。profile / admin は未認証 guard / redirect 画面の design system 描画を evidence とする。

## Required status check 候補（dev / main）

merge 後、user-gated governance change として branch protection に追加する候補:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`
- `verify-phase12-compliance / verify`
- `verify-gate-metadata / verify`
- `verify-indexes-up-to-date / verify`

> staging-visual は手動 deploy 後の `workflow_dispatch` を前提とするため、PR 毎の required status check には含めず ops gate として扱う。

## Test plan

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` 成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging`（staging URL）exit 0 / diff < 5%
- [ ] `bash scripts/verify-pr-ready.sh` exit 0
- [ ] `outputs/phase-11/` に 15 evidence が物理存在
- [ ] `artifacts.json` が gate-metadata zod schema を通過
- [ ] parent `index.md` / `artifacts.json` が `VISUAL_RUNTIME_OK`

## Screenshots

- `outputs/phase-11/screenshots/public-top.png`
- `outputs/phase-11/screenshots/login.png`
- `outputs/phase-11/screenshots/profile.png`
- `outputs/phase-11/screenshots/admin-dashboard.png`

## References

- issue #829（`[UT-DSF-07]`, CLOSED・最適化判定は本 workflow `index.md` §0）
- `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-01..12-*.md`
- parent: `docs/30-workflows/ui-prototype-design-system-foundation/{index.md,artifacts.json,SCOPE.md}`
- CLAUDE.md（apps/web env アクセス不変条件 / Cloudflare CLI 実行ルール / UI prototype alignment / required status check 候補）

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 4. commit 戦略

| commit | 内容 | files |
|--------|------|-------|
| C-01 | config + spec + script 追加 | `apps/web/playwright.config.ts` / `apps/web/playwright/tests/visual-staging/*.spec.ts` / `apps/web/package.json` |
| C-02 | baseline PNG コミット | `apps/web/playwright/tests/visual-staging/*-snapshots/*-staging-visual-chromium-linux.png` × 4 |
| C-03 | evidence 配置 | `outputs/phase-11/**`（log 7 / screenshot 4 / metadata 4） |
| C-04 | parent gate 解除 | parent `index.md` / `artifacts.json`（`VISUAL_RUNTIME_OK` + Gate-B/C） |

> C-02 は CI で生成された baseline を取得してから push する 2 段階フロー。

## 5. PR 作成コマンド（承認後）

```bash
gh pr create --base dev \
  --title "feat(ut-dsf-07): staging runtime visual evidence (4 screens) + root VISUAL_RUNTIME_OK release" \
  --body "$(cat <<'EOF'
（§3 の本文）
EOF
)"
```

## 6. PR 作成前 checklist

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` で PR 範囲を確認
- [ ] `outputs/phase-11/` の 15 evidence が物理存在
- [ ] baseline PNG が `-staging-visual-chromium-linux.png` で揃っている（`-darwin.png` のみではない）
- [ ] `apps/api/src/**` / `apps/web/src/**` の diff が 0 行
- [ ] 新規 CI workflow ファイルが追加されていない
- [ ] staging-deploy.log に Token / OAuth 値が混入していない

## 7. merge 後の後続アクション

| アクション | 担当 | タイミング |
|----------|------|---------|
| branch protection に required status check 候補を追加 | user 明示承認後 | governance change |
| 認証後 profile / admin の staging visual | child workflow `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/` | CLOSED Issue #901 を `Refs #901` で扱う canonical workflow root を作成済み。authenticated baseline 取得と parent gate release は child Gate-C 後 |
| 本 workflow を `completed-tasks/` に移動 | user 明示承認後 | close-out operation |
