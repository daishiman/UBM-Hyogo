---
phase: 7
title: 品質ゲート — CI / lint / type / verify-pr-ready
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-06-form-response-binding
status: draft
taskType: implementation
visualEvidence: VISUAL
implementation_mode: integration
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| # | ゲート | コマンド | 期待 |
|---|--------|---------|------|
| G-01 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G-02 | lint | `mise exec -- pnpm lint` | exit 0（fix 含む） |
| G-03 | test suffix | `mise exec -- pnpm verify-test-suffix`（lefthook と CI 双方） | `*.spec.{ts,tsx}` のみ |
| G-04 | adapter unit | `mise exec -- pnpm --filter @ubm-hyogo/web test -- adapters/__tests__/member-detail` | green |
| G-05 | design tokens | CI gate `verify-design-tokens / verify-design-tokens` | green（HEX / `bg-[#xxx]` 検出 0） |
| G-06 | Playwright smoke | CI gate `playwright-smoke / smoke (chromium)` | green |
| G-07 | Playwright visual | CI gate `playwright-smoke / visual (chromium, 4 screens)` | green（serial-07 連携） |
| G-08 | PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 |
| G-09 | Phase 12 compliance | `pnpm verify:phase12-compliance` | green |
| G-10 | indexes drift | `pnpm indexes:rebuild` 後 git diff 空 | drift 0 |

## 2. local 実行順序

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- adapters/__tests__/member-detail
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test public-member-detail
bash scripts/verify-pr-ready.sh
```

## 3. 失敗時の自動修復方針

| ゲート | 失敗パターン | 対応 |
|--------|------------|------|
| G-01 | adapter generic 型推論失敗 | `z.output<typeof X>` への型注釈追加 |
| G-02 | import order / unused | `pnpm lint --fix` で吸収 |
| G-04 | unknown kind silent skip 不適合 | `FieldKindZ.safeParse` 分岐確認 |
| G-05 | tokens.css 経由でない色指定 | `var(--color-...)` に置換 |
| G-08 | gate-metadata zod 失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1 |

## 4. CI required status check

CLAUDE.md「branch-sync」セクションの `dev` / `main` required status check 候補に既に登録済の以下を継承する:

- `verify-design-tokens / verify-design-tokens`
- `playwright-smoke / smoke (chromium)`
- `playwright-smoke / visual (chromium, 4 screens)`

本 sub-workflow で追加 required check は提案しない。

## 5. 参照

- CLAUDE.md「branch-sync」「PR作成の完全自律フロー」
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
