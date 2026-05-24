---
phase: 7
title: 品質ゲート — CI / lint / type / verify-pr-ready
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| # | ゲート | コマンド | 期待 | 起動 |
|---|--------|---------|------|------|
| G-01 | typecheck | `mise exec -- pnpm typecheck` | exit 0 | local + CI |
| G-02 | lint | `mise exec -- pnpm lint` | exit 0（`--fix` 含む） | local + CI |
| G-03 | test suffix | `mise exec -- pnpm verify-test-suffix` | `*.spec.{ts,tsx}` のみ | lefthook + CI |
| G-04 | adapter unit | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts` | green / branch coverage 100% | local + CI |
| G-05 | design tokens | CI gate `verify-design-tokens / verify-design-tokens` | green（HEX / `bg-[#xxx]` 検出 0） | CI |
| G-06 | Playwright smoke | CI gate `playwright-smoke / smoke (chromium)` | green | CI |
| G-07 | Playwright visual | CI gate `playwright-smoke / visual (chromium, 4 screens)` | green（serial-07 と連携） | CI |
| G-08 | PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 | local + CI |
| G-09 | Phase 12 compliance | `mise exec -- pnpm verify:phase12-compliance` | green（canonical 9 headings） | local + CI |
| G-10 | indexes drift | `mise exec -- pnpm indexes:rebuild` 後 `git diff` 空 | drift 0 | pre-push lefthook + CI |
| G-11 | gate-metadata | `mise exec -- pnpm gate-metadata:validate` | zod schema OK | local + CI |
| G-12 | bundle build (Workers 互換) | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 | CI |

## 2. local 実行順序（推奨）

```bash
# 1. 依存
mise exec -- pnpm install --force

# 2. 静的検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. adapter unit
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts

# 4. Playwright (chromium)
mise exec -- pnpm --filter @ubm-hyogo/web exec \
  playwright test public-member-detail --project=chromium

# 5. PR pre-flight (G-08 / G-09 / G-10 / G-11 を一括)
bash scripts/verify-pr-ready.sh
```

## 3. 失敗時の自動修復方針

| ゲート | 失敗パターン | 対応 |
|--------|------------|------|
| G-01 | adapter generic 型推論失敗 | `z.output<typeof PublicMemberProfileZ>` への型注釈追加 |
| G-01 | `getEnv()` の return 型不整合 | `apps/web/src/lib/env.ts` の zod schema を再確認 |
| G-02 | import order / unused | `mise exec -- pnpm lint --fix` で吸収 |
| G-03 | `*.test.ts` が混入 | `*.spec.ts` に rename |
| G-04 | unknown kind silent skip 不適合 | `FieldKindZ.safeParse` 分岐確認 |
| G-04 | branch coverage 不足 | ケース 7（empty publicSections）/ ケース 8（sanitize）追加 |
| G-05 | tokens.css 経由でない色指定 | `var(--color-...)` に置換 |
| G-06/G-07 | snapshot diff | `--update-snapshots` で baseline 更新（CI でなく local で） |
| G-08 | gate-metadata zod 失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1 |
| G-08 | phase12-compliance fail | canonical 9 headings 不足 / Phase 11 evidence 表 不整合 確認 |
| G-08 | indexes drift | `mise exec -- pnpm indexes:rebuild` でローカル再生成 → commit |
| G-09 | phase12 canonical 不足 | `phase-12-compliance-check.md` の見出し追加 |
| G-10 | indexes drift | `mise exec -- pnpm indexes:rebuild` を実行し diff を commit |
| G-12 | Turbopack 由来の bundle 失敗 | `next build --webpack` を明示。Turbopack を production bundle に混入させない |

## 4. CI required status check

CLAUDE.md「branch-sync」セクションの `dev` / `main` required status check 候補に既に登録済の以下を継承する:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`
- `verify-test-suffix`
- `verify-indexes-up-to-date`

本 sub-workflow で追加 required check は提案しない。

## 5. pre-push hook 連携

CLAUDE.md「CI 頻発失敗は pre-push hook 化済み」を踏襲:

- `verify-indexes-up-to-date` 相当を pre-push lefthook で先回り検出（G-10）
- `verify-gate-metadata` 相当を pre-push lefthook で先回り検出（G-11）

これにより `git push` 段階で CI 失敗の大半を防ぐ。

## 6. 参照

- CLAUDE.md「branch-sync」「PR作成の完全自律フロー」「CI 頻発失敗は pre-push hook 化済み」
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `scripts/verify-pr-ready.sh`
- `scripts/coverage-guard.sh`
