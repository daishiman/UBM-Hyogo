# Documentation Changelog

> **workflow_state: `implemented_local_evidence_captured`**。本サイクルで Vite 7 実装・local evidence・global skill sync を同 wave で反映した。

## Workflow-local sync

| File | Change |
| --- | --- |
| `package.json` | root `devDependencies.vite` に `^7.0.0` を追加 |
| `pnpm-lock.yaml` | `vite@7.3.5` 単一解決へ再生成 |
| `_shared-context.md` / `index.md` | `spec_created` から `implemented_local_evidence_captured` へ昇格 |
| `phase-11-manual-test.md` | fixed evidence files を pending から present へ更新 |
| `outputs/phase-11/*.txt` | typecheck / lint / shard / deprecation / version parity companion evidence を追加 |
| `outputs/phase-11/canonical-paths.json` / `outputs/phase-11/evidence/*.log` | Phase 11 canonical evidence path validator に合わせ、typecheck / lint / test / build / grep-gate の固定 path 証跡を追加 |
| `outputs/phase-12/*.md` | strict 7 close-out を実装済み状態へ更新 |
| `artifacts.json` / `outputs/artifacts.json` | Gate-B passed、Vite resolved 7.3.5、Phase 13 user-gated に更新 |

## Global skill sync

| File | Change |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-vite-5-to-7-major-upgrade-artifact-inventory.md` | artifact inventory を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow ledger エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | quick-lookup 行を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | per-workflow quick-reference エントリ追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | changelog エントリ追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 最近の代表履歴に追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` / `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `pnpm indexes:rebuild` 済みの生成 index 差分を反映 |

## Verification log

実行済み: `pnpm install`, `pnpm why vite`, `pnpm list`, `pnpm -r typecheck`, `pnpm lint`, `pnpm build`, focused vitest reruns, deprecation grep, `pnpm indexes:rebuild`, `git status`, `git diff --stat`。

本レビューで追加実行: `validate-phase12-implementation-guide.js --workflow docs/30-workflows/vite-5-to-7-major-upgrade --json`, `validate-phase11-canonical-evidence-paths.js --workflow docs/30-workflows/vite-5-to-7-major-upgrade --check-existence --json`。
