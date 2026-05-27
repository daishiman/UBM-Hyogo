---
実装区分: 実装仕様書
状態: spec_created
Phase: 9
作成日: 2026-05-26
task_id: public-dashboard-prototype-alignment
親: [index.md](./index.md)
前: [phase-8-refactor.md](./phase-8-refactor.md)
次: [phase-10-final-review.md](./phase-10-final-review.md)
---

# Phase 9: 品質保証 (QA)

## 1. 目的

実装・テスト・リファクタ完了後の **静的検証** を全て exit 0 で通過させる。

## 2. 必須実行コマンド (順序通り)

```bash
# 1. install (worktree ごとに独立)
mise exec -- pnpm install --force

# 2. typecheck
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. build (Workers bundle / Next.js webpack)
mise exec -- pnpm --filter @ubm-hyogo/web build

# 5. design tokens gate (HEX 直書き 0 件)
bash scripts/verify-design-tokens.sh
# (CI workflow: .github/workflows/verify-design-tokens.yml)

# 6. targeted vitest
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/ \
  apps/web/app/__tests__/page.spec.tsx

# 7. pr-ready preflight
bash scripts/verify-pr-ready.sh
```

## 3. 失敗時の自動修復方針 (CLAUDE.md §品質検証失敗時)

| 失敗種別 | 対応 |
| --- | --- |
| `pnpm install --force` 失敗 | lock 不整合を疑い再生成 |
| `pnpm typecheck` 失敗 | 不足 import / 型 narrowing を最小差分で修正 |
| `pnpm lint` 失敗 | まず `pnpm lint --fix`、残りを手修正 |
| `pnpm build` 失敗 | OpenNext Workers 互換性問題 → `next build --webpack` で再現確認 |
| `verify-design-tokens` 失敗 | HEX 直書きを grep し OKLch token に置換 |
| `verify-pr-ready.sh` 失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従う |

## 4. token 未定義検出時の対応

`legacy-public.css` で参照する以下 token が `tokens.css` に存在しない場合は Phase 9 で追加 (既存値変更は禁止):

| token | fallback | 必要時に追加 |
| --- | --- | --- |
| `--ubm-spacing-grid` | `16px` | (要確認) |
| `--ubm-spacing-section` | `24px` | (要確認) |
| `--ubm-font-serif` | `ui-serif, Georgia, serif` | (要確認) |
| `--ubm-color-text-muted` | `currentColor` | (要確認) |
| `--ubm-color-border` | `currentColor` | (要確認) |
| `--ubm-color-panel` | (既存) | — |
| `--ubm-color-accent` | (既存) | — |
| `--ubm-color-zone-{a,b,c}` | (既存) | — |

## 5. axe / a11y check (任意)

Phase 11 visual evidence と並走で実施。本 Phase では強制しない。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/public-home-visual.spec.ts \
  --project=chromium
```

`@axe-core/playwright` 既存導入があれば smoke spec 内で `expect(await axe(page)).toHaveNoViolations()` 相当を実行。

## 6. DoD (Phase 9)

- [ ] §2 の 7 コマンド全て exit 0
- [ ] HEX 直書き 0 件
- [ ] coverage 目標 met (Phase 7 と整合)

## メタ情報

- task_id: `public-dashboard-prototype-alignment`
- Phase: 9
- workflow_state: `spec_created`

## 目的

静的検証を全 PASS させる。

## 完了条件

- [ ] 7 コマンド exit 0
