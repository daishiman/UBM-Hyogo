# Lessons learned — Issue #622 packages test suffix rename（2026-05-11）

## Scope

`packages/**/*.test.ts → *.spec.ts` への横断 R100 rename を `docs/30-workflows/completed-tasks/issue-622-packages-test-suffix-rename/` 配下で実装した際に発生した非自明な判断・つまずき点を記録する。Companion to:

- workflow root: `docs/30-workflows/completed-tasks/issue-622-packages-test-suffix-rename/`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260511-issue622-packages-test-suffix-rename-spec.md`
- task-workflow ledger: `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（Issue #622 行）
- ADR: `packages/shared/ADR-test-suffix.md` / `packages/integrations/ADR-test-suffix.md`

## L-622-001 — Issue body の file count（26）と実測値（28）の乖離

| Item | Value |
| --- | --- |
| 苦戦点 | Issue #622 起票時の集計（26 files）と current worktree 実測（28 files）が乖離していた。原因は `packages/integrations/google/` の nested 構造（`src/forms/*.test.ts` / `src/sheets/*.test.ts`）が起票時の grep で取りこぼされていたこと。Phase-05 で `rename-mapping.csv` を実測 base で書き直す判断が必要になった。 |
| 採用判断 | Issue body の 26 files は「起票時集計」として注記に残し、Phase-05 の CSV は current worktree 実測 28 rows（header 含め 29 行）を正本とした。upstream artefact（Issue body）と downstream artefact（CSV / artifacts.json / ADR）で数値が乖離する場合、後者の実測値を canonical とし、前者は historical reference として残す。 |
| 適用範囲 | `outputs/phase-05/rename-mapping.csv`、`outputs/phase-12/system-spec-update-summary.md`、`task-workflow-active.md` の Issue #622 行に「Issue body 26 / 実測 28」を併記。 |
| 再利用基準 | 横断 rename / cross-package sweep を計画する Issue では、`find packages -name '*.test.ts'` を Phase-01 で実行し、結果を artifact として固定すること。nested directory（`src/<subsystem>/`）配下の test を見落としやすい。 |

## L-622-002 — workflow_state vocabulary: `implemented-local / local-evidence-partial`

| Item | Value |
| --- | --- |
| 苦戦点 | Phase-12 完了時点で「28 rename + 2 ADR + `apps/api/tsconfig.build.json` exclude + Phase-11 evidence は local 完了、ただし `pnpm -r test` が apps/api `/me` hook timeout で non-zero、Issue close / merge は user-gated」という中間状態を 1 ラベルで表現する必要があった。`spec_created` では実装済みの実態と乖離、`implemented` では evidence の partial 性が消える。 |
| 採用判断 | `task-specification-creator/references/workflow-state-vocabulary.md` の語彙から `implemented-local / implementation / NON_VISUAL / rename-only / local-evidence-partial` の 5 軸ラベルを採用。`local-evidence-partial` で「package rename evidence は green、ただし apps/api 由来の無関係 failure を含む」ことを明示した。 |
| 適用範囲 | `docs/30-workflows/completed-tasks/issue-622-packages-test-suffix-rename/artifacts.json` の `state` フィールド、task-workflow-active / quick-reference / resource-map / LOGS / changelog すべて同一 wave で同一文字列を使う。 |
| 再利用基準 | rename-only / refactor-only タスクで「対象 evidence は green だが root-level test runner に無関係 failure が混ざる」場合、`local-evidence-partial` + evidence 分離記法を採用すること。evidence 分離の手段は `outputs/phase-11/logs/` 配下に対象パッケージ単独実行のログを残す。 |

## L-622-003 — apps/api と packages の build / test 境界

| Item | Value |
| --- | --- |
| 苦戦点 | `*.spec.ts` を packages 配下に置くと、`apps/api` の `tsconfig.build.json` が `packages/**/*` を経由するため build に test ファイルが混入し、`@cloudflare/workers-types` 依存等で type error を起こす可能性があった。逆に exclude を雑に書くと `*.ts` 全体を除外して production code まで落とすリスクがある。 |
| 採用判断 | `apps/api/tsconfig.build.json` の `exclude` に `../../packages/**/*.spec.ts` のみ追加。`*.test.ts` 残骸（rename 漏れ）も同時に除外したいため `../../packages/**/*.test.ts` も保険として併記する。`*.spec.ts` 単独 pattern にすることで production code（`*.ts`）には影響しない。 |
| 適用範囲 | `apps/api/tsconfig.build.json`（このタスクで modify 済）。apps/web 側は OpenNext Workers 互換のため `next build --webpack` 経由で別経路。 |
| 再利用基準 | monorepo で `apps/*` が `packages/**/*` を build target に含む構成では、新しい test suffix を導入するたびに必ず `apps/*/tsconfig.build.json` の `exclude` を確認すること。test suffix 変更は build boundary の変更でもある。 |

## L-622-004 — Phase-12 strict 7 outputs と root `artifacts.json` の二重管理

| Item | Value |
| --- | --- |
| 苦戦点 | Phase-12 が要求する `outputs/phase-12/*.md` 7 件（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）と、root `artifacts.json` の `state vocabulary` 記載が情報重複する。drift すると compliance-check が fail する。 |
| 採用判断 | `artifacts.json` を state vocabulary の正本とし、Phase-12 outputs は artifacts.json への back-reference を必ず持つ構造にした。`phase12-task-spec-compliance-check.md` で artifacts.json と outputs の整合を 4 Conditions として手動 audit。compliance-check fail 時は artifacts.json を先に直し、outputs を同期する流れ。 |
| 適用範囲 | このタスクの `outputs/phase-12/` 全 7 ファイルと root `artifacts.json`。 |
| 再利用基準 | Phase-12 を持つすべての workflow で、state vocabulary / file count / evidence path は `artifacts.json` を single source of truth にする。outputs 側に同じ値を hard-code すると drift が必ず起きる。 |

## Cross-references

- `task-specification-creator/references/workflow-state-vocabulary.md` — state vocabulary 正本
- `references/task-workflow-active.md` — Issue #622 行で本 lessons-learned を参照
- `docs/30-workflows/completed-tasks/issue-589-gate-metadata-structured-ledger/` — Phase-12 strict 7 outputs の先行例
