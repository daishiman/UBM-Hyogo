# Phase 2: 設計

[実装区分: 実装仕様書] / NON_VISUAL

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 既存資産 | 再利用 | 役割 |
| -------- | ------ | ---- |
| `scripts/smoke/redact.sh` | ✅ そのまま | redact の SSOT。lib は `bash "$REDACT"` で呼ぶ（二重実装しない / AC-8） |
| `scripts/cf.sh` | ✅ そのまま | `smoke_run_d1` がラップする `d1 execute` 経路 |
| 既存 3 runner の関数群 | △ 一部抽出 | 共通部分のみ lib へ移し、固有部分は残す（2.4 MECE 境界） |

→ 新規 primitive は共通 lib 1 ファイルのみ。redact / cf.sh は触らない。

## 2.2 共通 lib `scripts/smoke/lib/smoke-common.sh` の関数仕様

> lib は **`set -euo pipefail` を設定しない / `trap` を登録しない**（source 副作用回避）。冒頭コメントに「呼び出し元が `set -euo pipefail` 済みであることを前提とする」と明記。公開変数は `SMOKE_` prefix、内部は `local`。

### 状態変数（公開）

| 変数 | 型 | 初期化 | 由来 |
| ---- | -- | ------ | ---- |
| `SMOKE_SUMMARY_ENTRIES` | array | `smoke_summary_init` で `=()` | 3 runner の `SUMMARY_ENTRIES` |
| `SMOKE_OVERALL_STATUS` | string | `smoke_summary_init` で `="PASS"` | 3 runner の `OVERALL_STATUS` |
| `SMOKE_REDACT` | string(path) | runner が `source` 前後で設定（`"$SCRIPT_DIR/redact.sh"`） | 3 runner の `REDACT` |

### 関数シグネチャ

```bash
# --- redact 経由ログ ---
# stdin を redact して out_log へ追記（パイプ用）。
#   usage: <command> | smoke_redact_filter "$OUT_LOG"
smoke_redact_filter() {            # $1: out_log
  bash "$SMOKE_REDACT" >> "$1"
}

# 文字列引数を redact して 1 行追記（tag-bulk log_redacted 相当）。
#   usage: smoke_redact_line "$OUT_LOG" "text..."
smoke_redact_line() {              # $1: out_log, $2..: text
  local out_log="$1"; shift
  printf '%s\n' "$*" | bash "$SMOKE_REDACT" >> "$out_log"
}

# --- summary 状態 ---
smoke_summary_init() {             # 引数なし
  SMOKE_SUMMARY_ENTRIES=()
  SMOKE_OVERALL_STATUS="PASS"
}

# PASS エントリ追加（tag-bulk summary_pass 相当）。
smoke_summary_pass() {             # $1: label
  local label="$1"
  SMOKE_SUMMARY_ENTRIES+=("$(jq -cn --arg label "$label" '{label:$label,status:"PASS"}')")
}

# FAIL エントリ追加 + overall=FAIL。contract/reason は任意（空可）。
#   3 runner の fail_and_exit が組む entry の共通形を再現する。
smoke_summary_fail_entry() {       # $1: label, $2: http, $3: contract(可空), $4: reason(可空)
  local label="$1" http="$2" contract="${3:-}" reason="${4:-}"
  SMOKE_OVERALL_STATUS="FAIL"
  if [[ -n "$reason" ]]; then
    SMOKE_SUMMARY_ENTRIES+=("$(jq -cn \
      --arg label "$label" --arg http "$http" --arg contract "$contract" --arg reason "$reason" \
      '{label:$label,status:"FAIL",http:$http,contract:$contract,reason:$reason}')")
  else
    SMOKE_SUMMARY_ENTRIES+=("$(jq -cn \
      --arg label "$label" --arg http "$http" --arg contract "$contract" \
      '{label:$label,status:"FAIL",http:$http,contract:$contract}')")
  fi
}

# summary.json を書き出す。array_key で routes/checks を切り替える（AC-9）。
smoke_write_summary() {            # $1: ci_flag(0/1), $2: summary_json_path, $3: array_key("routes"|"checks")
  local ci_flag="$1" json_path="$2" array_key="$3"
  if [[ "$ci_flag" -ne 1 || -z "${json_path:-}" ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SMOKE_SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","%s":[%s]}\n' "$SMOKE_OVERALL_STATUS" "$array_key" "$entries_csv" > "$json_path"
}

# --- host allowlist 照合（純粋部品。exit/message は runner 判断） ---
# base が allow_regex に一致すれば 0、しなければ 1 を返す。
smoke_assert_host_allow() {        # $1: base, $2: allow_regex
  printf '%s\n' "$1" | grep -Eiq "$2"
}

# --- env prefix 解決 ---
smoke_env_prefix() {               # $1: environment -> stdout: 大文字 prefix
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

# --- D1 ラッパー（tag-bulk run_d1 相当。将来の D1 runner 用 SSOT） ---
#   usage: smoke_run_d1 "$CF_SH" "$DB" "$ENV" --json --command "SELECT ..."
smoke_run_d1() {                   # $1: cf_sh, $2: db, $3: env, $4..: d1 execute 引数
  local cf_sh="$1" db="$2" env="$3"; shift 3
  bash "$cf_sh" d1 execute "$db" --env "$env" --remote "$@"
}
```

### 設計判断メモ

- `smoke_summary_fail_entry` は **entry 追加のみ**（exit しない）。`fail_and_exit` の「entry 追加 → write_summary → echo → exit」の組み立ては各 runner に残す（admin-web は途中で `collect_tail` 副作用が入る / exit code が固有のため）。
- attendance の `fail_and_exit` は `contract`（jq_filter）必須 + `reason` 任意で、`reason` 無しのとき entry に `"reason"` キーを**含めない**実装。これは attendance の `request_json` PASS entry が `"summary"` キーを持つことと対になる。**この shape 差を共通化で壊さない**ため、attendance の `fail_and_exit` / PASS entry 構築は runner 側に残し、lib の `smoke_summary_fail_entry` は admin-web/tag-bulk が使う「contract+reason 両方持つ」共通形のみ提供する（2.4 参照）。

## 2.3 各 runner の移行設計（薄いラッパーで非退化を担保）

### 共通の冒頭追加（3 runner 共通）

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"
SMOKE_REDACT="$SCRIPT_DIR/redact.sh"
```

### `runtime-tag-bulk.sh`（最も共通化効果が高い）

| 削除/置換する既存定義 | 移行後 |
| --------------------- | ------ |
| `write_summary()` | runner 薄ラッパー: `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` |
| `summary_pass()` | 削除 → 呼び出しを `smoke_summary_pass` に置換（または別名 alias） |
| `log_redacted()` | 削除 → `smoke_redact_line "$OUT_LOG"` に置換 |
| `run_d1()` | runner 薄ラッパー: `run_d1() { smoke_run_d1 "$CF_SH" "$CF_D1_DATABASE" staging "$@"; }` |
| `fail_and_exit()` | runner に残す（`smoke_summary_fail_entry "$label" "$status" "$contract" "$reason"` → `write_summary` → echo → `exit 1` を組む） |
| `OVERALL_STATUS="PASS"` / `SUMMARY_ENTRIES=()` グローバル初期化 | `smoke_summary_init`（`main` 内 OUT_LOG 設定後）。ただし `SMOKE_*` への移行に伴い、entry を読む箇所が無いため安全 |
| `assert_staging_guard` / `parse_args` / `post_bulk` / `assert_all_status` / `assert_status_file` / `extract_count` / `audit_count` / `count_by_table` / `seed` / `cleanup` / `main` | **runner に残す**（固有契約 / AC-5・AC-10） |

> **AC-10 保証**: test が `source "$RUNNER"` した後に `assert_all_status`/`extract_count` を呼ぶ。runner が冒頭で `source lib` するため、test→runner→lib の二段 source で全関数が解決される。`source "$RUNNER"` 時に `main` は `if [[ "${BASH_SOURCE[0]}" == "$0" ]]` ガードで実行されない（既存通り維持）。

### `runtime-admin-web.sh`

| 既存定義 | 移行後 |
| -------- | ------ |
| `write_summary()` | `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` |
| `record_check()` | runner に残す（PASS/FAIL 両用の固有 entry 形）。または `smoke_summary_*` で再構成可（Phase 5 で判断・ただし shape 完全一致必須） |
| `fail_and_exit()` | runner に残す（`collect_tail 0` 副作用 + `record_check` + `write_summary` + exit_code 可変） |
| `assert_target` / `resolve_env_vars` / `start_tail` / `collect_tail` / `request_admin` | runner に残す（固有）。`resolve_env_vars` 内の `tr` を `smoke_env_prefix` に置換可 |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` | `smoke_summary_init` |
| allowlist grep（`assert_target` 内） | `smoke_assert_host_allow "$BASE" "$TARGET_ALLOW_REGEX"` に置換 |

> admin-web の `record_check` は PASS/FAIL を 1 関数で扱い `{"label","status","http","reason"}` 形（contract キー無し）。これは tag-bulk/attendance と shape が違うため、**admin-web は `record_check` を runner に残す**のが安全（過剰共通化回避）。lib 共通化は `write_summary`（array_key=checks）/ `smoke_assert_host_allow` / `smoke_env_prefix` / `smoke_summary_init` に留める。

### `runtime-attendance-provider.sh`

| 既存定義 | 移行後 |
| -------- | ------ |
| `write_summary()` | `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "routes"; }`（**array_key=routes** / AC-9） |
| `fail_and_exit()` | runner に残す（attendance 固有: reason 有無で entry 形が変わる + PASS entry が `summary` キー）。lib の `smoke_summary_fail_entry` は contract+reason 固定形のため attendance には**使わない**（shape 差を壊さないため） |
| `assert_target`（marker curl + jq env）/ `request_json` / `classify_unauthorized_bearer` / `assert_bearer_subject_allowed` | runner に残す（固有） |
| allowlist grep（`assert_target` 内） | `smoke_assert_host_allow "$BASE" "$allow_regex"` に置換 |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` | `smoke_summary_init` |

> attendance は entry shape（routes / reason 任意 / summary キー）が最も特殊。**安全側に倒し、lib 化は `write_summary`（array_key）/ `smoke_assert_host_allow` / `smoke_summary_init` / redact パイプに限定**する。fail/pass entry 構築は runner に残す。

## 2.4 MECE 境界（共通化対象 vs runner 固有）

| 機構 | 共通 lib | attendance | admin-web | tag-bulk |
| ---- | -------- | ---------- | --------- | -------- |
| redact パイプ / 行ログ | ✅ `smoke_redact_filter` / `smoke_redact_line` | 利用 | 利用 | 利用 |
| summary 状態初期化 | ✅ `smoke_summary_init` | 利用 | 利用 | 利用 |
| summary.json 書き出し | ✅ `smoke_write_summary`(array_key) | ラッパー(routes) | ラッパー(checks) | ラッパー(checks) |
| PASS entry | ✅ `smoke_summary_pass`（label のみ形） | ❌ 固有(summary 付) | ❌ 固有(record_check) | ✅ 利用 |
| FAIL entry | ✅ `smoke_summary_fail_entry`（contract+reason 形） | ❌ 固有(reason 任意) | ❌ 固有(record_check) | ✅ 利用 |
| host allowlist 照合 | ✅ `smoke_assert_host_allow` | 利用 | 利用 | 利用 |
| env prefix | ✅ `smoke_env_prefix` | （indirect 直書き維持可） | 利用 | （staging 固定で不使用可） |
| D1 ラッパー | ✅ `smoke_run_d1` | ❌(D1 無) | ❌(D1 無) | ✅ ラッパー |
| `assert_target` 本体 | ❌ | 固有 | 固有 | 固有(`assert_staging_guard`) |
| request 系 | ❌ | 固有 | 固有 | 固有 |
| cleanup / trap 登録 | ❌（部品のみ） | 固有 | 固有 | 固有 |

> **過剰共通化を避ける原則**: PASS/FAIL entry は 3 runner で shape が異なる（attendance=summary/reason 任意、admin-web=record_check 単一形、tag-bulk=contract+reason）。共通 lib の `smoke_summary_pass` / `smoke_summary_fail_entry` は **tag-bulk が使う形**を正とし、attendance/admin-web は固有 entry 構築を runner に残す。これにより lib のシグネチャを安定（後方互換）に保つ。

## 2.5 cleanup / trap の責務分界（AC-4）

| runner | 現状の trap | 移行後 |
| ------ | ----------- | ------ |
| attendance | `trap 'rm -rf "$TMP_DIR"' EXIT` | **変更なし**（lib は trap を持たない） |
| admin-web | `trap cleanup EXIT`（cleanup=tail kill + tmp rm） | **変更なし** |
| tag-bulk | `trap 'cleanup \|\| true; rm -rf "$TMP_DIR"; write_summary' EXIT` | **変更なし**（`write_summary` は薄ラッパー経由で lib を呼ぶ） |

→ lib は cleanup の**部品**すら現状提供しない（各 runner の cleanup は固有度が高く、共通化メリットが小さい）。trap 登録は 100% runner 責務。これで二重実行/未実行のリスクが構造的に発生しない。

## 2.6 ロック変数・状態所有権

- summary 状態（`SMOKE_SUMMARY_ENTRIES` / `SMOKE_OVERALL_STATUS`）の所有権は **runner プロセス**（source で同一プロセス）。lib は read/write する関数を提供するのみ。
- runner は `smoke_summary_init` を 1 度だけ呼ぶ（OUT_LOG 確定後）。

## 2.7 完了条件（Phase 2）

- [x] lib 9 関数 + 3 公開変数のシグネチャを確定した。
- [x] 3 runner の薄ラッパー移行方針を確定した（array_key の routes/checks 分岐を含む）。
- [x] MECE 境界（共通化対象 / 固有）を表で確定した。
- [x] cleanup/trap の責務分界（lib は trap 非保持）を確定した。
- [x] 過剰共通化回避の原則（entry shape は tag-bulk 形を正とし他は runner 残置）を明記した。
</content>
