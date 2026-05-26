---
phase: 10
title: ローカル/CI 検証コマンド — 7 gate を再現
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 10 — ローカル/CI 検証コマンド

[実装区分: 実装仕様書]

## 1. 前提

- `mise install` 完了（Node 24.15.0 / pnpm 10.33.2）
- `mise exec -- pnpm install --frozen-lockfile` 完了
- `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium` 完了
- staging secrets が `bash scripts/cf.sh secret put` で投入済（`.dev.vars.example` の op 参照と drift なし）

## 2. 検証コマンド一式（順序付き）

```bash
# 配置先ディレクトリ
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
mkdir -p "$WF/outputs/phase-11/evidence" "$WF/outputs/phase-11/screenshots"

# G3: typecheck
mise exec -- pnpm typecheck 2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.log"

# G4: lint
mise exec -- pnpm lint 2>&1 | tee "$WF/outputs/phase-11/evidence/lint.log"

# G5: build（next build --webpack / Cloudflare Workers 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$WF/outputs/phase-11/evidence/build.log"

# G1: staging deploy（cf.sh 経由のみ）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 | tee "$WF/outputs/phase-11/evidence/staging-deploy.log"

# G2: staging visual 4 screens
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging 2>&1 | tee "$WF/outputs/phase-11/evidence/playwright-staging-visual.log"

# G6: verify-pr-ready（phase12-compliance / gate-metadata / indexes drift）
bash scripts/verify-pr-ready.sh 2>&1 | tee "$WF/outputs/phase-11/evidence/verify-pr-ready.log"
```

## 3. baseline 初回生成（CI 経由を正本とする）

baseline は CI ubuntu-latest 生成の `-staging-visual-chromium-linux.png` を正本とする。macOS では生成しない（緊急時のみ・コミットしない）。

```bash
# 参考: 緊急時のみ local 生成（コミットしない）
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging --update-snapshots
```

## 4. evidence 配置 / screenshot 同期

```bash
WF=docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence
cp apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/public-top-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/public-top.png"
cp apps/web/playwright/tests/visual-staging/login.spec.ts-snapshots/login-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/login.png"
cp apps/web/playwright/tests/visual-staging/profile.spec.ts-snapshots/profile-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/profile.png"
cp apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts-snapshots/admin-dashboard-staging-visual-chromium-linux.png \
   "$WF/outputs/phase-11/screenshots/admin-dashboard.png"

# 物理存在確認
ls -la "$WF/outputs/phase-11/" "$WF/outputs/phase-11/screenshots/"
```

## 5. parent gate 解除整合確認

```bash
PARENT=docs/30-workflows/ui-prototype-design-system-foundation
grep -n VISUAL_RUNTIME "$PARENT/index.md" "$PARENT/artifacts.json"   # VISUAL_RUNTIME_OK を期待
```

## 6. Phase 12 compliance（最終 gate）

```bash
mise exec -- pnpm verify:phase12-compliance
mise exec -- pnpm gate-metadata:validate
```

exit 0 を確認。fail 時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照。

## 7. 統合 one-liner（CI fail-fast 模倣 / deploy 後）

```bash
set -e
mise exec -- pnpm typecheck && \
mise exec -- pnpm lint && \
mise exec -- pnpm --filter @ubm-hyogo/web build && \
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging && \
bash scripts/verify-pr-ready.sh
```

## 8. 検証失敗時の参照

| 失敗 gate | 参照 |
|----------|------|
| G1 (deploy) | Phase 9 §3 / `scripts/cf.sh` / CLAUDE.md Cloudflare CLI ルール |
| G2 (staging visual) | Phase 6 §6 / Phase 9 §4 |
| G3-G5 | 該当 PR の Phase 5 |
| G6 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` |
| G7 (root gate) | Phase 5 §7 / parent `artifacts.json` |

## 9. ローカル独自 quirks

- macOS で `pnpm --filter @ubm-hyogo/web build` 実行時、esbuild バージョン不整合は `pnpm install --force` で `apps/web/node_modules/esbuild` を再導入。
- `cf.sh` は `op run` 経由で secrets を動的注入する。op 未ログイン時は `op signin` が必要（実値は環境変数として揮発的に渡るのみ）。
- staging visual は deploy 完了後でないと旧 bundle を撮影してしまう。必ず deploy → visual の順序を守る。
