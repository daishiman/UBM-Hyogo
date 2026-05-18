---
phase: 10
title: ローカル検証コマンド — 6 gate を local で再現
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 10 — ローカル検証コマンド

[実装区分: 実装仕様書]

## 1. 前提

- `mise install` 完了（Node 24.15.0 / pnpm 10.33.2）
- `mise exec -- pnpm install --frozen-lockfile` 完了
- `pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium` 完了
- serial-00..06 の実装が green build に到達済（§Phase 9 §3 fallback で確認）

## 2. 検証コマンド一式（順序付き）

```bash
# G3: typecheck
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/typecheck.log

# G4: lint
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/lint.log

# G2: verify-design-tokens（HEX / arbitrary value 0 件）
mise exec -- pnpm verify:tokens 2>&1 | tee outputs/phase-11/verify-design-tokens.log

# G5: build（next build --webpack / Cloudflare Workers 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/build.log

# G1: Playwright visual 4 screens
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual 2>&1 | tee outputs/phase-11/playwright-visual.log

# G6: verify-pr-ready（phase12-compliance / gate-metadata / indexes drift）
bash scripts/verify-pr-ready.sh 2>&1 | tee outputs/phase-11/verify-pr-ready.log
```

## 3. baseline 初回生成（CI 経由を正本とする）

local では baseline 生成を**行わない**。CI 上で生成し、artifact から取得してコミットする。

```bash
# 参考: 緊急時のみ local で生成（コミットしない）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual --update-snapshots
```

## 4. evidence 配置の整合確認

```bash
# Phase 11 inventory の必須 evidence が物理存在するか
ls -la docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/outputs/phase-11/
ls -la docs/30-workflows/ui-prototype-design-system-foundation/serial-07-regression-evidence/outputs/phase-11/screenshots/
```

## 5. Phase 12 compliance（最終 gate）

```bash
mise exec -- pnpm verify:phase12-compliance
```

exit 0 を確認。fail 時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の §1〜§5 を参照。

## 6. 統合 one-liner（CI fail-fast 模倣）

```bash
set -e
mise exec -- pnpm typecheck && \
mise exec -- pnpm lint && \
mise exec -- pnpm verify:tokens && \
mise exec -- pnpm --filter @ubm-hyogo/web build && \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual && \
bash scripts/verify-pr-ready.sh
```

## 7. 検証失敗時の参照

| 失敗 gate | 参照ドキュメント |
|----------|---------------|
| G1 (visual) | Phase 6 / Phase 9 §3 |
| G2 (tokens) | `docs/00-getting-started-manual/specs/design-tokens.md` / `scripts/verify-design-tokens.ts` |
| G3-G5 | serial-00..06 の該当 SW の Phase 5 |
| G6 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` |

## 8. ローカル独自 quirks

- macOS で `pnpm --filter @ubm-hyogo/web build` 実行時、esbuild バージョン不整合は `scripts/cf.sh` ラッパー経由でなく直接 pnpm build を呼ぶため、`apps/web/node_modules/esbuild` を `pnpm install --force` で再導入する場合あり
- Playwright webServer が `localhost:3000` 起動に時間がかかる場合は `PLAYWRIGHT_BASE_URL` を staging URL に向けて smoke 確認できる（baseline 生成には使わない）
