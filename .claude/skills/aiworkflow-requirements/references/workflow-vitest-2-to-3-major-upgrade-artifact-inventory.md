# Artifact Inventory — vitest-2-to-3-major-upgrade

## canonical root

`docs/30-workflows/completed-tasks/vitest-2-to-3-major-upgrade/`

## state classification

`workflow_state = implemented_local_evidence_captured`
`taskType = implementation`
`visualEvidence = NON_VISUAL`
`implementation_mode = new`

> 注: 当初は `spec_created` として起票したが、version bump（`vitest` / `@vitest/coverage-v8` → `^3.2.6`）と `pnpm-lock.yaml` 再生成が同一サイクルで landed したため `implemented_local_evidence_captured` へ補正済み。commit / push / PR / source PR mutation のみ user-gated。

## source

| Item | Value |
| --- | --- |
| PR | https://github.com/daishiman/UBM-Hyogo/pull/1177 |
| PR state | OPEN as of 2026-06-10 JST (`gh pr view 1177`) |
| Base / head | `dev` / `dependabot/npm_and_yarn/vitest-3.2.6` |
| Source changed files | `package.json`, `apps/api/package.json`, `apps/og/package.json`, `pnpm-lock.yaml` |

## root artifacts

| artifact | status |
| --- | --- |
| `index.md` | present |
| `artifacts.json` | present |
| `outputs/artifacts.json` | present |
| `phase-01-requirements.md` ... `phase-13-pr-creation.md` | present |
| `outputs/phase-12/*.md` strict 7 | present |

## planned implementation artifacts

| artifact | role |
| --- | --- |
| `package.json` | root `vitest` and `@vitest/coverage-v8` target `^3.2.6` |
| `apps/api/package.json` | app-local `vitest` target `^3.2.6` |
| `apps/og/package.json` | app-local `vitest` target `^3.2.6` |
| `pnpm-lock.yaml` | regenerated lockfile |
| `vitest.config.ts` / `vitest.d1.config.ts` | only if deprecation logs prove config drift |
| `*.spec.ts` / `*.spec.tsx` | only if Vitest 3 breaking changes require expectation/mock fixes |

## phase 12 required artifacts

| artifact | status |
| --- | --- |
| `outputs/phase-12/main.md` | present |
| `outputs/phase-12/implementation-guide.md` | present |
| `outputs/phase-12/system-spec-update-summary.md` | present |
| `outputs/phase-12/documentation-changelog.md` | present |
| `outputs/phase-12/unassigned-task-detection.md` | present |
| `outputs/phase-12/skill-feedback-report.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## invariants

- `vitest` and `@vitest/coverage-v8` must resolve to 3.2.6 together.
- `vitest.d1.config.ts` keeps `pool: forks` and `singleFork: true`.
- Product runtime behavior, public API, D1 schema, Google Form schema, and UI are unchanged by the specification package.
- Commit, push, PR creation, and implementation package mutations remain user-gated.

## same-wave skill sync

| target | file | state |
| --- | --- | --- |
| references / task-workflow | `references/task-workflow-active.md` | entry added |
| references / artifact inventory | this file | created（Lessons Learned 補完済み） |
| indexes / topic-map・keywords | `indexes/{topic-map.md,keywords.json}` | regenerated |
| indexes / resource-map | `indexes/resource-map.md` | entry added |
| indexes / quick-reference | `indexes/quick-reference.md` | entry added |
| LOGS / changelog | `SKILL-changelog.md` | entry added |

## Lessons Learned

| ID | 苦戦/学び | 将来の簡潔解法 |
| --- | --- | --- |
| L-V2V3-001 | 起票時 `spec_created`・「dependency bump not applied」だったが、version bump + lockfile が同一サイクルで landed。artifact-inventory / main.md / system-spec-update-summary に旧 `spec_created` 文言が残り state drift を起こした。 | 実装が landed したら state classification を `implemented_local_evidence_captured` へ即補正し、3 系統（inventory・phase-12 main/system-spec・task-workflow-active）の status を同一値で揃える。git diff --stat で bump 有無を一次情報として確認する。 |
| L-V2V3-002 | Phase 12 を旧「six-file」用語で記述しており strict 7（`main.md` 追加）と非整合。phase12-compliance が canonical 見出し不足で落ちる L-DEVSYNC 系の再発。 | dependency-upgrade でも Phase 12 は strict 7（main.md 必須）。`phase-12-documentation.md` / `artifacts.json` Gate-B note を strict 7 で逐語記述し、`pnpm verify:phase12-compliance` を編集後に必ず回す。 |
| L-V2V3-003 | dependency major-upgrade の RED/GREEN 解釈が曖昧。Phase 4 の RED が「新規 test 失敗」と誤読されやすい。 | RED = bump 後に既存 spec を流し失敗を分類すること、GREEN = version bump + lockfile + config + 既存 test 修復の完了、Phase 11 NON_VISUAL evidence = shard 結果・warning grep・version parity log と再解釈する。今回は RED 0・deprecation 0 のため config/test 修復は不要だった。 |
| L-V2V3-004 | `vitest` と `@vitest/coverage-v8` がバラバラの version に解決すると runtime mismatch を招く。 | 両者は常に同一 version（3.2.6）へ揃える version-parity を invariant 化し、Phase 11 で `version-parity.txt` を evidence として残す。`vitest.d1.config.ts` の `pool: forks` / `singleFork: true` は維持する。 |
| L-V2V3-005 | spec_created 段階で aiworkflow inventory 未登録だと、docs ディレクトリが unindexed のまま discovery drift を起こす。 | inventory entry は実装前（spec_created）でも same-wave で登録し、resource-map / quick-reference / SKILL-changelog / topic-map・keywords まで取りこぼさず同期する（task-workflow-active と indexes だけでは不足）。 |

