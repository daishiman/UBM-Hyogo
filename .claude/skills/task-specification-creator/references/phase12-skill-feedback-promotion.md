# Phase 12 Skill Feedback Promotion

## 目的

Phase 12 の `skill-feedback-report.md` を「報告書」だけで終わらせず、再利用可能な skill / reference / lesson へ同一 wave で昇格するための routing rules を定義する。

## Routing Matrix

| Feedback 種別 | 昇格先 | 例 |
| --- | --- | --- |
| Phase template / checklist gap | `task-specification-creator/references/*` または `assets/*` | Phase 12 必須成果物、unassigned-task 必須見出し、artifacts parity |
| domain implementation / spec lesson | `aiworkflow-requirements/references/lessons-learned-*.md` | API boundary、staging smoke、schema sync、security/data boundary |
| skill creation / update workflow lesson | `skill-creator/references/update-process.md` または related asset | AskUserQuestion 例外、SubAgent 監査分担、mirror sync |
| validation command gap | owning skill の `scripts/` または validation reference | warning ではなく error にする、実在コマンドだけを compliance に記録 |
| no-op | `documentation-changelog.md` と `skill-feedback-report.md` | 既に反映済み、対象 skill なし、実行 evidence 未取得 |

## Command Contract Drift Rule

タスク仕様書内の候補コマンドが実リポジトリの package script と一致しない場合、`local workflow metadata drift` とだけ記録して no-op にしない。次の順で同一 wave 内に閉じる。

1. `package.json` / workspace filter / test runner config から実行可能な current command を再解決する。
2. Phase 1 / Phase 4 / Phase 9 / Phase 11 / Phase 12 の command contract と evidence を同じ command string へ同期する。
3. stale command が再発しやすい条件を `skill-feedback-report.md` に `promotion target / no-op reason / evidence path` 付きで routing する。
4. 再利用可能なテンプレート差分なら `task-specification-creator` へ昇格し、単発 typo なら evidence path と no-op reason を残す。

実例: `issue-106-admin-member-notes-repository-task-spec` では `pnpm --filter @repo/api test:run -- adminNotes` が stale だったため、`pnpm --filter ./apps/api test -- adminNotes` と focused Vitest command へ再解決し、Phase 1/4/9/11/12 に同期した。

## 苦戦箇所 Required Fields

| Field | 内容 |
| --- | --- |
| symptom | 何が起きたか |
| cause | なぜ起きたか |
| recurrence condition | どの条件で再発するか |
| 5-minute resolution | 次回の短時間解決手順 |
| evidence path | 根拠となる workflow output / code / validation log |
| promoted-to | 反映先 path。反映しない場合は no-op reason |

## Same-wave Closeout Checklist

- [ ] `skill-feedback-report.md` の item を 1 件ずつ routing した
- [ ] `promotion target / no-op reason / evidence path` を記録した
- [ ] domain-specific lesson は `aiworkflow-requirements/references/lessons-learned-*.md` へ反映した
- [ ] workflow/template issue は `task-specification-creator` の reference / asset へ反映した
- [ ] skill-authoring/update-process issue は `skill-creator` の reference / asset へ反映した
- [ ] `documentation-changelog.md` に更新ファイルと no-op rationale を残した
- [ ] mirror directory が存在する skill は mirror sync と `diff -qr` を実行した
- [ ] workflow が docs-only `spec_created` から `enforced_dry_run` などへ再分類された場合は root/outputs `artifacts.json`、`phase12-task-spec-compliance-check.md`、`system-spec-update-summary.md`、SKILL changelog、resource-map / quick-reference / task-workflow-active を **同 wave** で更新した（reclassification は 7 同期点を 1 wave で消化する）

## Phase index / artifacts parity early gate（Phase 0/1 で発火）

Phase 欠落 / `phase-XX.md` 欠番が後続参照（Phase 4 / Phase 11 / Phase 12）で初めて発覚すると、close-out 直前の手戻りが発生する。再発防止のため、`create-workflow` / `execute-workflow` 実行直後の早期 gate に次の 3 点を必須化する（Phase 12 Lane A の重複ではなく Phase 0/1 段階の early gate として置く）。

| gate | 確認内容 | 不合格時の扱い |
| --- | --- | --- |
| phase index parity | `index.md` の Phase 一覧 と `artifacts.json.phases[].phaseId` が完全一致 | 欠番を `phase-XX.md` で復元するまで Phase 1 着手禁止 |
| artifacts root/outputs parity | root `artifacts.json` と `outputs/artifacts.json` の `phases[].status` / outputs list が同値（不在ケースは `phase-12-spec.md` 文言テンプレを使用） | drift があれば Phase 1 着手禁止 |
| canonical Phase 12 filename pre-check | `outputs/phase-12/` の 7 strict filename を template stub で先置き済（中身は空でも可） | filename drift（`system-spec-update.md` 等）が起こり得る状態のまま進めない |

実例: UT-06-FU-A route inventory script design では、Phase 03 / 06 / 12 / 13 が初回 scaffold で欠落しており、Phase 11 evidence 段階で初めて検出された。Phase 0/1 で本 gate を回したことで、Phase 4 以降は phase-index parity 前提の参照ができた。

## Design GO / runtime GO 分離ルール（docs-only design workflow）

docs-only design workflow（route inventory automation design / ADR / topology drift / contract alignment 等）で Phase 10/11/12 を閉じる際、`Design GO` と `runtime GO` を**同じ PASS と書かない**。混在は実装 follow-up の境界を曖昧にし、後続 wave で「動いている」と誤認される原因になる。

| GO 種別 | PASS 条件 | 記録先 | 例 |
| --- | --- | --- | --- |
| Design GO | 設計成果物の整合性・review 済・spec_created で close 可能 | `phase-10.md` 承認欄 / `system-spec-update-summary.md` の昇格保留節 | route inventory schema 設計、command contract draft、ADR drafted |
| runtime GO | 実 command / script 実行で実測 PASS、output path / evidence file が実体存在 | `outputs/phase-11/*` 実測 evidence、parent runbook 実 command 追記 | `pnpm run inventory:routes` 実行 PASS、screenshot / log 実体取得 |

運用ルール:

- Phase 11 が NON_VISUAL design 完了で閉じる場合、`outputs/phase-11/*` には Design GO 根拠（schema review / contract 整合）を置き、runtime PASS と書かない
- `system-spec-update-summary.md` Step 1-A では「実 command / output path はまだ昇格しない」「runtime GO は implementation follow-up 完了時に行う」と明記する
- 実 command / output path の正本反映タスクを `unassigned-task/<workflow>-impl-001.md` として同 wave で formalize し、parent runbook 追記の完了条件に runtime GO 取得を含める
- `skill-feedback-report.md` で Design GO のみ PASS と記録する場合、`promotion target / no-op reason / evidence path` 三点を必ず付けて、runtime GO は implementation follow-up へ routing する

実例: UT-06-FU-A route inventory script design では、`system-spec-update-summary.md` で Step 1-A を「automation follow-up 登録済 / 実 command 昇格は impl-001 完了後」と分離し、`UT-06-FU-A-route-inventory-script-impl-001.md` を同 wave で formalize した。

## Applied Examples

| Task | Routing decision | Evidence |
| --- | --- | --- |
| 09a staging smoke / Forms sync validation | placeholder evidence boundary と artifacts parity は task-specification-creator、domain lesson は aiworkflow-requirements、skill update process は skill-creator へ昇格 | `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md` |
| 09b cron monitoring / release runbook | cron env parity、rollback split、NON_VISUAL alternative evidence は aiworkflow-requirements の artifact inventory / lessons へ昇格。candidate task は existing unassigned を先に検索し、重複 formalize を避ける | `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md`, `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md` |
| UT-06-FU-A route inventory script design | docs-only design workflow で Phase 03/06/12/13 欠落を Phase 0/1 early gate で検出し、Design GO / runtime GO を分離して implementation follow-up を同 wave で formalize | `outputs/phase-12/system-spec-update-summary.md`, `unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` |
| 03a stableKey literal lint enforcement | warning↔strict mode flag 分離、allow-list 完全パス固定、inline suppression 0 維持、`spec_created → enforced_dry_run` の 7 同期点 reclassification、skill feedback の Decision 列 (Promote / Defer / No-op) は aiworkflow-requirements の lessons / inventory / quick-reference / resource-map へ昇格。lifecycle 再分類運用は本 promotion guide の checklist にも反映した | `references/lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md`, `references/workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md` |

## 禁止事項

- `skill-feedback-report.md` に改善案を書いただけで Phase 12 を PASS にしない
- 「改善点なし」を根拠なしで書かない
- 存在しない validator / mirror script を PASS 根拠にしない
- 実測 evidence がない placeholder を skill lesson の成功例として扱わない
