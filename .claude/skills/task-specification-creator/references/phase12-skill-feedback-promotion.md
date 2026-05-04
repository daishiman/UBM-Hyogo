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

## PASS_WITH_BLOCKER closeout rule（implementation / NON_VISUAL）

`implementation / NON_VISUAL` workflow でも、現行 blocker により code change が required CI / production / data integrity を破壊する場合は、unsafe change を実行せず `PASS_WITH_BLOCKER` として documentation + evidence close-out できる。ただし次の 5 点を同 wave で満たす:

| gate | 必須条件 |
| --- | --- |
| blocker evidence | current blocker command / exit code / count を Phase 11 に保存する |
| root-output parity | root `artifacts.json` と `outputs/artifacts.json` の metadata / phase status を同値にする |
| current vs planned evidence | 現サイクルで実在する evidence と cleanup 後に作る planned evidence を outputs 一覧と AC で分離する |
| compliance truthfulness | `phase12-task-spec-compliance-check.md` は実在ファイルを「未作成」と書かず、実体と一致させる |
| promoted feedback | `skill-feedback-report.md` が `promote` とした項目は skill changelog / reference / domain changelog へ反映し、未反映なら `no-op reason` または未タスク化理由を記録する |

実例: Issue #394 stableKey strict CI gate では `pnpm lint:stablekey:strict` が 148 violations で fail するため `.github/workflows/ci.yml` strict step は追加せず、`blocked_by_legacy_cleanup` として Phase 1-12 を close-out した。

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

## Deploy-deferred 評価ルール（implementation / NON_VISUAL / deploy-deferred workflow）

`implementation` task type かつ実 deploy / commit / PR を user 承認まで保留する workflow（例: CD cutover spec、production rollback drill）では、Phase 7 / Phase 11 / Phase 13 を**実測 PASS と書かず**、契約上の placeholder として扱う。spec_created で close するための独立ルールを以下に定める。

### Phase 11: PENDING_IMPLEMENTATION_FOLLOW_UP evidence contract

Phase 11 declared outputs は**必ず実体ファイルとして配置**し、各ファイル冒頭に判定行を置く。runtime PASS の代わりに次のいずれかを使う:

| 判定文字列 | 用途 |
| --- | --- |
| `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | spec / contract が同期完了し、runtime evidence は implementation follow-up で取得予定 |
| `PENDING_IMPLEMENTATION_FOLLOW_UP` | evidence は follow-up task の実行ログから取得予定。owner / unassigned task path を必ず併記 |
| `Design GO` | 設計成果物の review 完了。runtime GO とは混同しない |

`PASS` / `OK` 単独表記は禁止。実 deploy 前に「動いている」と誤認させない。

### Phase 7: AC matrix の判定列

Phase 7 AC matrix で AC ↔ test ↔ evidence を対応づける際、未実行テストには `OK` / `PASS` を書かず、次を使う:

| 判定文字列 | 用途 |
| --- | --- |
| `COVERED_BY_PLANNED_TEST` | テストケース定義済 / 実行は follow-up |
| `gate defined / pending follow-up execution` | CI gate / quality gate の宣言は完了 / 実測 evidence は follow-up |

### Phase 13: blocked placeholder

Phase 13 declared files（`local-check-result.md` / `change-summary.md` / `pr-info.md` / `pr-creation-result.md` / `approval-gate-status.md`）は**実体配置必須**だが、本文は次の 3 点を明示する blocked placeholder として書く:

- commit / push / PR / 実 deploy は user 明示承認まで実行禁止
- CLOSED Issue を扱う場合は **再 open 禁止 / `Refs #<n>` 限定**（`Closes #<n>` 禁止）
- 承認後の実行担当 / rollback 経路 / 二段 rollback（VERSION_ID + Pages dormant 等）の readiness 参照

`artifacts.json` の Phase 13 は `status=blocked` / `user_approval_required=true` / `blockedReason` を必須とする。

### Same-wave 同期点（deploy-deferred 拡張）

通常の 7 同期点に加え、deploy-deferred では次の 2 点を**同 wave で必ず**同期する:

- destructive cleanup（Pages dormant 後の delete 等）は別 unassigned task として独立 formalize（separate approval gate）
- lessons-learned に二段 rollback path / CLOSED Issue Refs 限定運用 / Design GO vs Runtime GO 境界を 5 要素フォーマットで記録

実例: Issue #355 OpenNext Workers CD cutover では、Phase 11 を 6 ファイル（main + E-1〜E-5）+ 補助 2 ファイル（link-checklist / manual-smoke-log）で `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 契約として保存し、Phase 13 を blocked placeholder 5 ファイルで配置、実 cutover は `unassigned-task/task-impl-opennext-workers-migration-001.md`、Pages 削除は `unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` へ二段分離した。

## Already-applied production migration verification rule

Production D1 migration workflows must re-check current canonical ledger facts before preserving an older apply premise. If `aiworkflow-requirements/references/database-schema.md` or fresh ledger evidence already records the target migration as applied, the workflow must be reclassified from apply execution to already-applied verification in the same wave.

Required handling:

- Phase 1 / 4 / 5 / 6 / 11 must change the preflight PASS condition from `pending/unapplied` to `applied` and treat `pending/unapplied` as `STALE_LEDGER_OR_ENV_MISMATCH`.
- `d1 migrations apply` must be a forbidden path. `outputs/phase-11/apply.log` may exist, but it must be no-op prohibition evidence (`FORBIDDEN / not_run_duplicate_apply_prohibited`), not an apply success log.
- For workflows that still apply a migration, `--migration <name>` in wrapper metadata is not enough. Preflight must fail if any target-external pending migration exists, because Wrangler applies the pending set rather than a single named file.
- Phase 7 / post-check must verify only the objects owned by the target migration file. Do not include sibling migration objects just because they are operational prerequisites.
- Phase 12 must state whether system spec sync is based on existing ledger fact + placeholder evidence or fresh runtime evidence. Do not write `fresh evidence` when Phase 11 files are placeholders.
- The consumed unassigned task must be rewritten or marked consumed so stale apply instructions cannot remain as an executable path.

Example: UT-07B-FU-04 reclassified `0008_schema_alias_hardening.sql` from production apply execution to already-applied verification because production D1 ledger already records it as applied at `2026-05-01 08:21:04 UTC`. The valid post-check scope is `schema_diff_queue.backfill_cursor` / `backfill_status`; `schema_aliases` table and UNIQUE indexes belong to `0008_create_schema_aliases.sql`.

## Applied Examples

| Task | Routing decision | Evidence |
| --- | --- | --- |
| 09a staging smoke / Forms sync validation | placeholder evidence boundary と artifacts parity は task-specification-creator、domain lesson は aiworkflow-requirements、skill update process は skill-creator へ昇格 | `references/lessons-learned-09a-staging-smoke-forms-sync-validation-2026-05.md` |
| 09b cron monitoring / release runbook | cron env parity、rollback split、NON_VISUAL alternative evidence は aiworkflow-requirements の artifact inventory / lessons へ昇格。candidate task は existing unassigned を先に検索し、重複 formalize を避ける | `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md`, `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md` |
| UT-06-FU-A route inventory script design | docs-only design workflow で Phase 03/06/12/13 欠落を Phase 0/1 early gate で検出し、Design GO / runtime GO を分離して implementation follow-up を同 wave で formalize | `outputs/phase-12/system-spec-update-summary.md`, `unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` |
| 03a stableKey literal lint enforcement | warning↔strict mode flag 分離、allow-list 完全パス固定、inline suppression 0 維持、`spec_created → enforced_dry_run` の 7 同期点 reclassification、skill feedback の Decision 列 (Promote / Defer / No-op) は aiworkflow-requirements の lessons / inventory / quick-reference / resource-map へ昇格。lifecycle 再分類運用は本 promotion guide の checklist にも反映した | `references/lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md`, `references/workflow-03a-stablekey-literal-lint-enforcement-artifact-inventory.md` |
| Issue #355 OpenNext Workers CD cutover | implementation / NON_VISUAL / deploy-deferred の Phase 11 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` evidence contract 6 + 2 ファイルで配置、Phase 13 を blocked placeholder 5 ファイルで配置、CLOSED Issue は `Refs #355` 限定で再 open 禁止、destructive Pages 削除を別 unassigned task に分離、二段 rollback（VERSION_ID + Pages dormant）と Phase 1 P50 既実装状態調査の主要価値を lessons-learned へ昇格 | `references/lessons-learned-issue-355-opennext-workers-cd-cutover-2026-05.md`, `unassigned-task/task-impl-opennext-workers-migration-001.md`, `unassigned-task/task-issue-355-pages-project-delete-after-dormant-001.md` |
| UT-05A fetchPublic service-binding | implementation / VISUAL_ON_EXECUTION / spec_created の Phase 11 を Cloudflare deploy-verification 6 evidence (`code-diff-summary.md` / `staging-curl.log` / `production-curl.log` / `wrangler-tail-staging.log` / `local-dev-fallback.log` / `redaction-checklist.md`) で `PENDING_RUNTIME_EVIDENCE` 配置、Phase 12 7 files は spec completeness PASS、`runtime path × evidence` 表（service-binding / HTTP fallback / unit test の 3 経路）を `implementation-guide.md` に固定、不変条件 5 の構造的決定として `apps/web → apps/api` の正本ルートを Part 2 へ昇格 | `references/phase-template-phase11.md` §「Cloudflare deploy-verification subtemplate」, `references/phase-12-spec.md` §「Phase 11 runtime evidence pending と Phase 12 spec completeness の分離」 |
| UT-07B-FU-04 production migration already-applied verification | production D1 ledger 既適用 fact がある場合は apply execution を forbidden path に再分類し、Phase 11 `apply.log` を no-op prohibition evidence、Phase 7 post-check を target migration owned objects のみへ縮小、fresh runtime evidence と placeholder evidence を Phase 12 で分離 | `docs/30-workflows/ut-07b-fu-04-production-migration-apply-execution/outputs/phase-12/phase12-task-spec-compliance-check.md`, `references/workflow-ut-07b-fu-04-production-migration-apply-execution-artifact-inventory.md` |

## 禁止事項

- `skill-feedback-report.md` に改善案を書いただけで Phase 12 を PASS にしない
- 「改善点なし」を根拠なしで書かない
- 存在しない validator / mirror script を PASS 根拠にしない
- 実測 evidence がない placeholder を skill lesson の成功例として扱わない
