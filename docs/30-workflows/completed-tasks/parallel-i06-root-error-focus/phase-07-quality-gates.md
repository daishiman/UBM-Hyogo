---
phase: 7
title: 品質ゲート
workflow_id: parallel-i06-root-error-focus
status: completed
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. local PASS 5 点セット（NON_VISUAL canonical）

| Gate | コマンド | 期待 |
|------|---------|------|
| G1 typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G2 lint | `mise exec -- pnpm lint` | exit 0 |
| G3 test | `mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx` | 2 PASS / 0 FAIL |
| G4 build | `mise exec -- pnpm -F "@ubm-hyogo/web" build`（任意） | exit 0 |
| G5 grep-gate | 後述 §2 | violation 0 |

## 2. grep gate

| 観点 | コマンド | 期待 |
|------|---------|------|
| HEX 直書き禁止 (CLAUDE.md) | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/app/error.tsx` | 0 件 |
| `bg-[#xxx]` / `text-[#xxx]` 禁止 | `grep -nE '\\b(bg|text)-\\[#' apps/web/app/error.tsx` | 0 件 |
| test suffix policy | `find apps/web/app -name 'error.test.tsx'` | 0 件（`*.spec.tsx` のみ） |

## 3. CI gate（参考）

| Gate | gate name | 本 PR 影響 |
|------|----------|-----------|
| `verify-test-suffix` | repo-wide | spec.tsx のみ追加で PASS |
| `verify-design-tokens` | apps/web | 本 PR は token 変更なしで PASS |
| Phase 11 evidence existence | task-spec gate | 本 workflow root の Phase 11 inventory に存在チェック対象 path を列挙 |

## 4. pre-push hook

CLAUDE.md 記載の `verify-indexes-up-to-date` / `verify-gate-metadata` は lefthook pre-push で先回り確認される。
本 spec 編集による drift は発生しない想定（docs 系のみ追加のため）。

## 5. blocker 判定

以下のいずれか violation 時は Phase 13 commit/PR へ進まない:

- G1 / G2 / G3 のいずれかが FAIL
- §2 grep gate のいずれかが 1 件以上 hit
- `git status` に対象外ファイルの変更が含まれる
