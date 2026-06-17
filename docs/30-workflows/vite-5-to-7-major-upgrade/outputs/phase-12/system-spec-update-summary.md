# System Spec Update Summary

> **workflow_state: `implemented_local_evidence_captured`**。本サイクルで依存追加・lockfile 再生成・local evidence 採取・aiworkflow 同 wave 登録を実施した。

## Step 1-A: Workflow registration

| Target | Status | Evidence |
| --- | --- | --- |
| workflow root | completed | `docs/30-workflows/vite-5-to-7-major-upgrade/` |
| artifact inventory | completed | `.claude/skills/aiworkflow-requirements/references/workflow-vite-5-to-7-major-upgrade-artifact-inventory.md` |
| active ledger | completed | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| quick-reference / resource-map | completed | `.claude/skills/aiworkflow-requirements/indexes/{quick-reference.md,resource-map.md}` |
| generated indexes | completed | `pnpm indexes:rebuild` reflected in `indexes/topic-map.md` and `indexes/keywords.json` |

## Step 1-B: Implementation status

| Item | Status |
| --- | --- |
| FR-1 root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加 | completed |
| FR-2 `pnpm-lock.yaml` 再生成（vite 7.x 単一解決） | completed (`vite@7.3.5`) |
| FR-3 `pnpm why vite` 単一 7.x 解決確認（V1/V7） | PASS |
| FR-4 deprecation 警告採取（V4・0 件確認） | PASS |
| FR-5 `vitest.config.ts` / `vitest.d1.config.ts` の条件付き最小修正（等価維持） | no change required |
| FR-6 shard green 維持 | broad resource flakes isolated; focused reruns PASS |
| FR-7 apps/web OpenNext sanity ビルド（V8・非 blocker） | PASS (`pnpm build`) |

## Step 1-C: Related tasks and references

| Reference | Relationship |
| --- | --- |
| 親 workflow `vitest-2-to-3-major-upgrade` | Vite を引き込む `vitest@3.2.6` を確定した前段タスク |
| Issue #1201 | 由来 Issue。**CLOSED 維持・再 open しない** |
| 元 unassigned-task | `docs/30-workflows/unassigned-task/vitest-2-to-3-major-upgrade-followup-002-vite-major-upgrade.md` |
| `issue-747-vitest-esbuild-arch-and-worktree-isolation` | `pnpm verify:vitest-runtime` arch mismatch の参照 runbook |
| `task-specification-creator` Phase 12 strict 7 | 実装対象明確時に `spec_created` で閉じないルールを適用 |

## Step 2: Domain system spec decision

Step 2 は N/A。依存バージョン更新のみで、公開 API / 型 / D1 schema / Google Form contract / UI contract は変更しない。Vite はテストツールチェーン専用で、`apps/web` 本番ビルド（`next build --webpack`）にも関与しない。
