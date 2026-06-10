# Workflow Artifact Inventory: issue-1138-smoke-runner-common-lib-extraction

## Metadata

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1138-smoke-runner-common-lib-extraction/` |
| status | `implemented_local_evidence_captured / refactoring / NON_VISUAL` |
| issue | #1138 CLOSED 維持（mutation は user-gated） |
| parent workflow | `docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/`（followup-007） |
| source unassigned | `docs/30-workflows/unassigned-task/task-issue-1036-followup-007-smoke-runner-common-lib-extraction.md`（consumed trace として残置・移動は close-out user-gated） |

## Implementation

| 種別 | パス |
| --- | --- |
| 共通 lib（new） | `scripts/smoke/lib/smoke-common.sh` |
| lib unit test（new） | `scripts/smoke/__tests__/smoke-common.test.sh` |
| migrated runner | `scripts/smoke/runtime-attendance-provider.sh`（lib source + `array_key=routes`） |
| migrated runner | `scripts/smoke/runtime-admin-web.sh`（lib source + `array_key=checks`） |
| migrated runner | `scripts/smoke/runtime-tag-bulk.sh`（lib source + `array_key=checks` / 二段 source contract 維持） |
| 非退化 regression test（既存・無改修 PASS） | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| 非退化 regression test（既存・無改修 PASS） | `scripts/smoke/__tests__/runtime-admin-web.test.sh` |
| 非退化 regression test（既存・無改修 PASS） | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |
| reused（不変） | `scripts/smoke/redact.sh`（lib が参照）, `scripts/cf.sh`（`smoke_run_d1` がラップ） |

## Public surface（内部 bash lib 契約）

| 種別 | シンボル |
| --- | --- |
| 公開変数 | `SMOKE_OVERALL_STATUS` / `SMOKE_SUMMARY_ENTRIES` / `SMOKE_REDACT` |
| 公開関数（9） | `smoke_redact_filter` / `smoke_redact_line` / `smoke_summary_init` / `smoke_summary_pass` / `smoke_summary_fail_entry` / `smoke_write_summary` / `smoke_assert_host_allow` / `smoke_env_prefix` / `smoke_run_d1` |

> 本 surface は内部開発者向け bash lib 契約であり、aiworkflow-requirements ドメイン正本（API/DB/UI）ではない（system-spec Step 2 = N/A）。

## Evidence

| 検証 | 結果 |
| --- | --- |
| lib unit test | PASS: smoke-common 7 ケース（empty-summary-path-noop / redact-filter / redact-line / host-allow-pass / host-allow-deny / env-prefix / run-d1-wrapper） |
| attendance 非退化 test | PASS（T-4-8..T-4-11） |
| admin-web 非退化 test | PASS（production-body-render-error / tail-render-error / production-tail-render-error / worker-name-default-template） |
| tag-bulk 非退化 test | PASS（assert-empty-fails / extract-count / runner-stub-pass / summary-pass） |
| shellcheck | clean（exit 0・lib + 3 runner） |
| verify:phase12-compliance | ok:true |
| gate-metadata:validate | ERROR 0 |
| visual evidence | N/A（NON_VISUAL bash 内部リファクタ。代替証跡 = local test 全 PASS + shellcheck clean） |

## Invariants

- runner runtime 挙動・出力 JSON shape は 1 ビットも変えない（非退化が完了条件・AC-3）。
- `smoke_write_summary` は `array_key` 引数で `routes`（attendance）/ `checks`（admin-web・tag-bulk）の 2 shape を分岐なく非退化再現する（AC-9）。
- 共通 lib は `set -euo pipefail` / `trap` を持たない。process lifecycle は各 runner が所有する（AC-10）。
- `assert_target` / entry shape / request 系 / `assert_all_status` / `extract_count` は runner 固有契約として runner に残置（MECE 境界・AC-5）。`assert_all_status` / `extract_count` は tag-bulk test が `source "$RUNNER"` で直接呼ぶため lib へ移さない。
- `redact.sh` は SSOT として参照のみ（lib に内容を複製しない・AC-8）。apps/api / D1 / Google Form / UI 不変。

## User Gate

commit / push / PR / staging・production smoke 実走 / Issue mutation はユーザー承認後のみ。

## Lessons Learned

- **L-I1138-001**（二段 source の非退化検証）: bash 共通 lib 抽出では `test` が `source "$RUNNER"` し、その runner が `source lib` する **二段 source** で全関数が解決される必要がある（AC-10）。lib 化後も `source "$RUNNER"` 後に runner 固有関数（`assert_all_status` / `extract_count`）が呼べることを test で担保する。runner 固有関数を安易に lib へ移すと、`source "$RUNNER"` 直叩き test が壊れる。
- **L-I1138-002**（lib に lifecycle を持たせない）: 共通 lib は `set -euo pipefail` / `trap` を **持たない**。これらは各 runner が所有する process lifecycle であり、lib に持たせると source 元の runner の終了挙動を二重に書き換えてしまう。lib 冒頭コメントに「sourced by runners that already set shell options」を明記して逸脱を防ぐ。
- **L-I1138-003**（全統合でなく引数化で非退化再現）: drift していた `write_summary` の JSON 配列キー（attendance=`routes` / 他=`checks`）は、3 runner を 1 つの固定 shape に統合するのではなく `smoke_write_summary <ci_flag> <json_path> <array_key>` の **array_key 引数化** で両 shape を非退化再現した（AC-9）。共通化＝統一ではなく、差分を引数で吸収するのが非退化リファクタの定石。
- **L-I1138-004**（公開 surface ≠ ドメイン正本変更）: 新規 public surface（`smoke_*` 9 関数 + `SMOKE_*` 3 変数）を追加するが、これは内部開発者向け bash lib 契約であり aiworkflow-requirements 正本（API/DB/UI）の変更ではない。system-spec Step 2 は **N/A** とし、surface は本 workflow 内（phase-2 関数仕様表 + implementation-guide Part 2）と本 inventory に記録、aiworkflow へは workflow registration のみ同期する。
- **L-I1138-005**（共通化候補の実態確認）: issue 本文が共通化候補とした `assert_target` は 3 runner で実装が大きく異なり（marker curl / allowlist のみ / `assert_staging_guard`）、共通化すると分岐肥大で柔軟性を失う。host-allowlist 照合の純粋部品 `smoke_assert_host_allow` のみ抽出し、残りは runner 残置とした。issue 記載の共通化候補は鵜呑みにせず実コードで重複実態を再確認する。
