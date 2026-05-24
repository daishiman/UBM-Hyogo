---
phase: 7
title: Quality Gates
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 7: Quality Gates — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 必須 CI gate

| Gate | 実行コマンド | 通過条件 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 / 全 package 緑 |
| lint | `mise exec -- pnpm lint` | exit 0 / no warnings |
| vitest (api) | `mise exec -- pnpm --filter @ubm/api test` | 全 spec 緑、新規 spec は branch 100% (classifier/logger) |
| verify-phase12-compliance | `bash scripts/verify-phase12-compliance.sh` または `pnpm verify:phase12-compliance` | canonical 9 headings 完備 / Phase 11 evidence 表存在 |
| gate-metadata:validate | `pnpm gate-metadata:validate` | `artifacts.json` の zod schema 合致 |
| indexes:rebuild drift | `mise exec -- pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` | drift なし |
| verify-pr-ready | `bash scripts/verify-pr-ready.sh` | 上記 3 つを一括検証 |
| verify-test-suffix | GitHub Actions (auto) | `*.test.ts` 不在 |

## 2. PR pre-flight 順序

1. `mise exec -- pnpm install --force`
2. `mise exec -- pnpm typecheck`
3. `mise exec -- pnpm lint`
4. `mise exec -- pnpm --filter @ubm/api test`
5. `bash scripts/verify-pr-ready.sh`

失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 を参照。

## 3. 環境固有 gate（staging deploy 時）

| Gate | 実行 | 期待 |
| --- | --- | --- |
| wrangler 互換ビルド | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` | esbuild エラーなし |
| cron 本数不変 | `grep -c '"\*' apps/api/wrangler.toml` で `crons` 配列の要素数が deploy 前後で同じ | 3 本のまま |
| staging smoke (sheets-auth) | 後述 Phase 10 / 11 の意図的失効検証 | 401 alert 発火 |

## 4. 不要なテスト実行禁止

`.claude/commands/ai/diff-to-pr.md` の PR 作成フローでは、ユーザー明示指示がない限り任意のテスト追加実行は行わない（CLAUDE.md PR 自律フロー記載どおり）。Phase 10 で明示的に実行する。

## 5. gate を skip しない原則

- `--no-verify` 禁止
- pre-commit / pre-push hook を bypass しない
- sync-merge 時の自動 skip 条件（`MERGE_HEAD` 存在）以外で hook を回避しない
