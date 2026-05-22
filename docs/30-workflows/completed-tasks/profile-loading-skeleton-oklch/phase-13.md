# Phase 13: PR 作成

## 承認ゲート

- [x] Phase 1-12 全て完了
- [ ] `bash scripts/verify-pr-ready.sh` PASS
- [ ] ユーザー明示承認取得

> CLAUDE.md / task-specification-creator skill の規約により、commit / push / PR 作成はユーザーの明示承認後にのみ実行する。

## PR 作成手順

### 1. 同期

```bash
git fetch origin dev
git switch dev && git pull --ff-only origin dev
git switch <feature-branch> && git merge dev
```

コンフリクト発生時は CLAUDE.md「sync-merge コンフリクト解消の3層予防」に従う。

### 2. pre-flight

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

### 3. commit / push

```bash
git add apps/web/app/profile/loading.tsx \
        apps/web/app/profile/loading.spec.tsx \
        apps/web/app/visual-harness/[name]/page.tsx \
        apps/web/app/visual-harness/[name]/VisualScenarios.client.tsx \
        apps/web/playwright/tests/visual/profile-loading-skeleton.spec.ts \
        docs/30-workflows/profile-loading-skeleton-oklch/ \
        docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md \
        docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i07-profile-loading-skeleton/spec.md \
        docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md \
        .claude/skills/aiworkflow-requirements/
git commit -m "feat(profile): /profile/loading を OKLch skeleton に置換 (parallel-i07)"
git push -u origin <feature-branch>
```

### 4. PR

```bash
gh pr create --base dev --title "feat(profile): /profile/loading を OKLch skeleton に置換" --body "$(cat <<'EOF'
## Summary
- `/profile/loading.tsx` を avatar + 4 KV pair の skeleton に置換
- OKLch token utility (`bg-surface-2`) のみ使用、HEX 直書きなし
- role=status / aria-busy / aria-live / sr-only / motion-safe:animate-pulse

## 由来
parallel-i07-profile-loading-skeleton spec を Phase 1-13 化（`docs/30-workflows/profile-loading-skeleton-oklch/`）。
p-07 spec section 4.5 の DoD を満たす。

## Test plan
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm -F @ubm-hyogo/web test -- --run profile/loading` PASS（4 ケース）
- [ ] `PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm -F @ubm-hyogo/web exec playwright test playwright/tests/visual/profile-loading-skeleton.spec.ts --project=visual-chromium` PASS（dev server 手動起動済みで screenshot 保存）
- [ ] `pnpm -F @ubm-hyogo/web build` PASS
- [ ] grep-gate (HEX 直書き / arbitrary color / scope) 0 件
- [ ] ローカル `/profile` 遷移時 skeleton 表示確認
EOF
)"
```

## 完了条件

- [ ] PR URL 取得
- [ ] CI 全 gate PASS
- [ ] artifacts.json `workflow_state` は `implemented_local_evidence_captured` のまま維持し、PR merge 後に completed-tasks archive へ移動
