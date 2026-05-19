---
phase: 11
title: Phase 11 evidence file inventory
workflow_id: parallel-i06-root-error-focus
status: completed
visualEvidence: NON_VISUAL
---

# Phase 11 — evidence inventory

[実装区分: 実装仕様書]

本タスクは `visualEvidence: NON_VISUAL` のため、screenshot 系 evidence は生成しない。
local PASS 5 点セット（typecheck / lint / direct Vitest run for `apps/web/app/error.spec.tsx` / grep gate / diff evidence）を canonical とする。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
|---|------|--------|
| typecheck | `outputs/phase-11/evidence/typecheck.log` | present |
| lint | `outputs/phase-11/evidence/lint.log` | present |
| focused direct Vitest | `outputs/phase-11/evidence/test.log` | present |
| grep gate | `outputs/phase-11/evidence/grep-gate.log` | present |
| diff | `outputs/phase-11/evidence/diff.txt` | present |

> Status は 2026-05-18 実装サイクルで `present` へ遷移済み。

## evidence 取得コマンド（実装完了後）

```bash
mkdir -p docs/30-workflows/parallel-i06-root-error-focus/outputs/phase-11/evidence
cd docs/30-workflows/parallel-i06-root-error-focus/outputs/phase-11/evidence

mise exec -- pnpm typecheck 2>&1 | tee typecheck.log
mise exec -- pnpm lint 2>&1 | tee lint.log
mise exec -- pnpm -F "@ubm-hyogo/web" exec vitest run --root=../.. --config=vitest.config.ts apps/web/app/error.spec.tsx 2>&1 | tee test.log
{
  echo "# HEX literal"; grep -nE '#[0-9a-fA-F]{3,8}' ../../../../../../apps/web/app/error.tsx || echo "(no match)";
  echo "# arbitrary color class"; grep -nE '\b(bg|text)-\[#' ../../../../../../apps/web/app/error.tsx || echo "(no match)";
} | tee grep-gate.log
git diff dev...HEAD -- apps/web/app/error.tsx apps/web/app/error.spec.tsx | tee diff.txt
```

## tracked evidence policy

- `.log` / `.txt` は **tracked** として git に追加する（`.gitignore` 対象外であることを確認）
- placeholder（空ファイル / 0 byte）は禁止
- `outputs/phase-11/` 配下のみ実 evidence、上位 path には evidence を置かない（Phase 12 path traversal guard）
- `test.log` は package script 経由ではなく direct Vitest invocation で取得し、対象 spec 1 ファイル / 2 tests PASS を証跡化する。

## state vocabulary

- 全 gate PASS + evidence 5 点取得済 → `IMPLEMENTED_LOCAL_RUNTIME_PENDING` または `completed`（実装サイクル後 Phase 12 で判定）
- 2026-05-18 実装サイクル後 → `implemented_local_evidence_captured`
