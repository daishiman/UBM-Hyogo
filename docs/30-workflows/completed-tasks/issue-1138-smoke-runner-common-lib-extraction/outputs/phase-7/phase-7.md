# Phase 7: カバレッジ確認

[実装区分: 実装仕様書] / NON_VISUAL

## 7.1 カバレッジ基準の定義（[Feedback BEFORE-QUIT-002] 局所範囲を明示）

bash には vitest / c8 のような行・分岐カバレッジ計測機構が存在しない。したがって本タスクのカバレッジは **計測ツール由来の数値**ではなく、以下の **構造的被覆基準**で代替する。

> **本タスクのカバレッジ定義**: 共通 lib `scripts/smoke/lib/smoke-common.sh` の各公開関数が、新規 lib test `scripts/smoke/__tests__/smoke-common.test.sh` の **最低 1 ケースで実際に呼ばれ、戻り値 / stdout / 副作用（`SMOKE_*` 状態 / ファイル出力）のいずれかが assert されている**こと。

- この基準は **「lib 関数の被覆」のみ**を対象とする局所範囲であり、3 runner 全体の経路網羅（curl / D1 / tail などの外部依存を伴う統合パス）は **本カバレッジ基準の対象外**とする。runner 全体の挙動非退化は Phase 6 の非退化 ledger（既存 3 runner test 全 PASS = AC-3）で担保し、本 Phase の責務と切り分ける。
- 計測の代替証跡は **smoke-common.test.sh の PASS ログ**（各ケースの `PASS [<case>]` 行）と、後述の対応表（7.2）の充足確認とする。

## 7.2 対象範囲（[BEFORE-QUIT-002] 限定）

| 区分 | 対象 | 本 Phase での扱い |
| ---- | ---- | ----------------- |
| 新規 lib | `scripts/smoke/lib/smoke-common.sh`（9 関数） | **カバレッジ対象**（各関数 ≥1 ケース被覆を必須） |
| 新規 lib test | `scripts/smoke/__tests__/smoke-common.test.sh` | 被覆を提供するテスト本体 |
| 移行 3 runner | `runtime-attendance-provider.sh` / `runtime-admin-web.sh` / `runtime-tag-bulk.sh` | **非退化対象**（既存 test 全 PASS = AC-3。本 Phase のカバレッジ基準には算入しない） |
| `redact.sh` / `cf.sh` | 既存 SSOT | **対象外**（本タスクで変更しない） |
| runner 固有関数（`assert_target` / `assert_all_status` / `record_check` 等） | 各 runner 残置 | **対象外**（lib に移さないため lib カバレッジに含めない。既存 runner test が引き続き被覆） |

## 7.3 lib 9 関数 × 被覆テストケース対応表

> 各 lib 関数は `smoke-common.test.sh` の少なくとも 1 ケースで呼ばれ、結果が assert される。ケース ID は Phase 4 のテスト設計で確定する想定だが、本 Phase では **被覆の必要十分条件**を関数単位で固定する。

| # | lib 関数 | 検証する test ケース（観点） | assert 対象 |
| - | -------- | ---------------------------- | ----------- |
| 1 | `smoke_redact_filter <out_log>` | TC-COV-01: パイプ入力（機密文字列含む）を redact して out_log へ**追記**する | out_log の内容が redact 済み + 既存行に追記される（上書きでない） |
| 2 | `smoke_redact_line <out_log> <text...>` | TC-COV-02: 文字列引数を redact して 1 行追記する | out_log 末尾に redact 済み 1 行が増える |
| 3 | `smoke_summary_init` | TC-COV-03: 呼び出し後に `SMOKE_SUMMARY_ENTRIES` が空配列・`SMOKE_OVERALL_STATUS=PASS` になる | `${#SMOKE_SUMMARY_ENTRIES[@]} == 0` かつ `SMOKE_OVERALL_STATUS == PASS` |
| 4 | `smoke_summary_pass <label>` | TC-COV-04: PASS エントリが 1 件追加され、`status:"PASS"` JSON になる | 追加された entry が `.status=="PASS"` かつ `.label` 一致 |
| 5 | `smoke_summary_fail_entry <label> <http> <contract> <reason>` | TC-COV-05: FAIL エントリ追加 + `SMOKE_OVERALL_STATUS=FAIL`。contract/reason が jq でエスケープされる | entry が `.status=="FAIL"` / `.http` / `.contract` / `.reason` を持ち、overall=FAIL |
| 6 | `smoke_write_summary <ci_flag> <json_path> <array_key>` | TC-COV-06〜09（分岐網羅。7.4 参照） | summary.json の存在 / 非存在 / 配列キー / status |
| 7 | `smoke_assert_host_allow <base> <allow_regex>` | TC-COV-10: 一致時 return 0 / TC-COV-11: 不一致時 return 1 | `$?` の値（0 / 非0） |
| 8 | `smoke_env_prefix <environment>` | TC-COV-12: 小文字 env が大文字 prefix へ変換される | stdout が大文字化された文字列 |
| 9 | `smoke_run_d1 <cf_sh> <db> <env> -- <args...>` | TC-COV-13: `cf_sh` をスタブ化し、`d1 execute <db> --env <env> --remote <args>` の引数列で呼ばれる | スタブが受け取った引数列が期待どおり |

→ **9 関数すべてが ≥1 ケースで被覆される**（被覆率 100%、本タスクのカバレッジ定義による）。

## 7.4 branch coverage 相当（分岐の被覆）

bash の `if` / 引数分岐のうち、**挙動が変わる分岐**を最低 1 ケースずつ被覆する。

| 関数 | 分岐 | 被覆ケース | 期待結果 |
| ---- | ---- | ---------- | -------- |
| `smoke_write_summary` | `ci_flag != 1`（CI でない） | TC-COV-06 | `return 0`・summary.json を**書かない**（ファイル非存在を assert） |
| `smoke_write_summary` | `ci_flag == 1` かつ `json_path` 非空 | TC-COV-07 | summary.json を書き出す |
| `smoke_write_summary` | `json_path` 空（`-z`） | TC-COV-08 | `return 0`・ファイル書き出しなし |
| `smoke_write_summary` | `array_key == "routes"` | TC-COV-07 | `jq -e '.routes'` が解決（attendance shape 再現 / AC-9） |
| `smoke_write_summary` | `array_key == "checks"` | TC-COV-09 | `jq -e '.checks'` が解決（admin-web / tag-bulk shape 再現 / AC-9） |
| `smoke_assert_host_allow` | 一致（return 0） | TC-COV-10 | `$? == 0` |
| `smoke_assert_host_allow` | 不一致（return 1） | TC-COV-11 | `$? != 0` |
| `smoke_summary_fail_entry` | `contract` / `reason` 空（`${3:-}` / `${4:-}`） | TC-COV-05b | 空でも jq エスケープが壊れず `""` になる |

> **重点**: `smoke_write_summary` は本タスクで最も分岐が多く（ci_flag=0/1・空 json_path・array_key=routes/checks）、AC-9（配列キー非退化）の核心。上表のとおり **両 ci_flag 分岐・空 json_path 分岐・両 array_key** をすべて被覆する。

## 7.5 既存 runner test による間接被覆（非退化側の確認）

lib 関数は移行後 3 runner からも呼ばれるため、既存 runner test が **統合経路としての lib 被覆**も提供する（AC-3 / AC-9 / AC-10）。

| 既存 test | 間接被覆する lib 経路 |
| --------- | -------------------- |
| `runtime-attendance-provider.test.sh`（`.routes[0].reason` 等を assert / L208, 263, 288, 343） | `smoke_write_summary` array_key=routes 分岐の実 runner 経路（AC-9） |
| `runtime-admin-web.test.sh`（`.checks[]` を assert / L84） | `smoke_write_summary` array_key=checks 分岐の実 runner 経路（AC-9） |
| `runtime-tag-bulk.test.sh`（`source "$RUNNER"` → `assert_all_status` / `extract_count` / L52, 62-69） | runner→lib 二段 source 後も lib + runner 固有関数が解決すること（AC-10） |

→ 直接被覆（smoke-common.test.sh）＋ 間接被覆（既存 3 runner test）の二層で、lib 全関数と全分岐がカバーされる。

## 7.6 完了条件（Phase 7）

- [x] カバレッジ基準を「lib 関数の被覆＝smoke-common.test.sh が各関数を ≥1 ケースで呼ぶ」と定義し、局所範囲を明示した（BEFORE-QUIT-002）。
- [x] lib 9 関数 × 被覆ケースの対応表を作成し、被覆率 100% を確認できる形にした。
- [x] 対象範囲を「新規 lib + 移行 3 runner」に限定し、対象外（redact / cf.sh / runner 固有関数）を明記した。
- [x] branch coverage 相当として `smoke_write_summary` の ci_flag=0/1・空 json_path・array_key=routes/checks 両分岐、および `smoke_assert_host_allow` の 0/1 を被覆対象に含めた。
