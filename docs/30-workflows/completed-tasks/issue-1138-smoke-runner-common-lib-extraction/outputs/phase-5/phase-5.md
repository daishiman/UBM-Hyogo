# Phase 5: 実装

[実装区分: 実装仕様書] / NON_VISUAL / implementation_mode: `new`

## 5.1 新規作成 / 修正ファイル一覧（[Feedback RT-03]）

| # | パス | 種別 | 概要 |
| - | ---- | ---- | ---- |
| 1 | `scripts/smoke/lib/smoke-common.sh` | **新規** | 共通 lib。redact 経由ログ / summary 状態 + write_summary + pass + fail entry / host-allowlist / env prefix / `run_d1` の 9 関数 + 公開変数 3 |
| 2 | `scripts/smoke/__tests__/smoke-common.test.sh` | **新規** | lib 単体テスト（Phase 4 の TC-01〜TC-21） |
| 3 | `scripts/smoke/runtime-tag-bulk.sh` | 編集 | lib を source、`write_summary`/`run_d1` を薄ラッパー化、`summary_pass`/`log_redacted` を lib 呼び出しへ、重複初期化を `smoke_summary_init` へ |
| 4 | `scripts/smoke/runtime-admin-web.sh` | 編集 | lib を source、`write_summary` 薄ラッパー化、`smoke_summary_init` 利用、allowlist grep を `smoke_assert_host_allow` へ、`tr` を `smoke_env_prefix` へ |
| 5 | `scripts/smoke/runtime-attendance-provider.sh` | 編集 | lib を source、`write_summary` 薄ラッパー化（**array_key=routes**）、`smoke_summary_init` 利用、allowlist grep を `smoke_assert_host_allow` へ |

> `scripts/smoke/redact.sh` / `scripts/cf.sh` は**変更しない**（参照のみ・AC-8 / CLAUDE.md `wrangler` 直叩き禁止）。既存 3 runner test の本体も**変更しない**（AC-3）。

## 5.2 共通 lib `scripts/smoke/lib/smoke-common.sh` の完全実装骨格

Phase 2 の関数シグネチャに準拠。冒頭コメントに「呼び出し元が `set -euo pipefail` 済みを前提・lib は `set` / `trap` を設定しない」を明記する。

```bash
#!/usr/bin/env bash
# scripts/smoke/lib/smoke-common.sh
#
# smoke runner 共通 lib（issue-1138）。
#
# 【重要・呼び出し規約】
#   - この lib は `set -euo pipefail` を設定しない。フラグ設定は source 側（各 runner）の責務。
#     呼び出し元が既に `set -euo pipefail` 済みであることを前提に記述している。
#   - この lib は `trap` を一切登録しない。cleanup / EXIT trap の登録は各 runner の責務（AC-4）。
#   - 公開変数は SMOKE_ prefix（SMOKE_SUMMARY_ENTRIES / SMOKE_OVERALL_STATUS / SMOKE_REDACT）。
#     内部変数はすべて `local`（グローバル汚染防止・AC-7）。
#   - redact は scripts/smoke/redact.sh を SSOT とし、ここに redact ロジックを再実装しない（AC-8）。
#     呼び出し元は source 前後に SMOKE_REDACT="$SCRIPT_DIR/redact.sh" を設定すること。
#
# shellcheck shell=bash

# --- redact 経由ログ -------------------------------------------------------

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

# --- summary 状態 ----------------------------------------------------------

# summary 状態を初期化（3 runner の SUMMARY_ENTRIES=() / OVERALL_STATUS="PASS" 相当）。
smoke_summary_init() {             # 引数なし
  SMOKE_SUMMARY_ENTRIES=()
  SMOKE_OVERALL_STATUS="PASS"
}

# PASS エントリ追加（tag-bulk summary_pass 相当 / label のみ形）。
smoke_summary_pass() {             # $1: label
  local label="$1"
  SMOKE_SUMMARY_ENTRIES+=("$(jq -cn --arg label "$label" '{label:$label,status:"PASS"}')")
}

# FAIL エントリ追加 + overall=FAIL（tag-bulk fail_and_exit の entry 部分・contract+reason 形）。
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
#   ci_flag != 1 もしくは json_path 空なら no-op（--ci-summary 無しの後方互換）。
smoke_write_summary() {            # $1: ci_flag(0/1), $2: summary_json_path, $3: array_key("routes"|"checks")
  local ci_flag="$1" json_path="$2" array_key="$3"
  if [[ "$ci_flag" -ne 1 || -z "${json_path:-}" ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SMOKE_SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","%s":[%s]}\n' "$SMOKE_OVERALL_STATUS" "$array_key" "$entries_csv" > "$json_path"
}

# --- host allowlist 照合（純粋部品。exit/message は runner 判断） -----------

# base が allow_regex に一致すれば 0、しなければ非 0 を返す（大文字小文字無視）。
smoke_assert_host_allow() {        # $1: base, $2: allow_regex
  printf '%s\n' "$1" | grep -Eiq "$2"
}

# --- env prefix 解決 -------------------------------------------------------

# environment を大文字 prefix へ（indirect 変数解決用。admin-web の tr 相当）。
smoke_env_prefix() {               # $1: environment -> stdout: 大文字 prefix
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

# --- D1 ラッパー（tag-bulk run_d1 相当。将来の D1 runner 用 SSOT） ---------

#   usage: smoke_run_d1 "$CF_SH" "$DB" "$ENV" --json --command "SELECT ..."
smoke_run_d1() {                   # $1: cf_sh, $2: db, $3: env, $4..: d1 execute 引数
  local cf_sh="$1" db="$2" env="$3"; shift 3
  bash "$cf_sh" d1 execute "$db" --env "$env" --remote "$@"
}
```

### 実装上の不変条件チェック（lib 単体）

| 不変条件 | 担保方法 |
| -------- | -------- |
| `set` を持たない | ファイル内に `set -euo` / `set -e` を書かない（冒頭コメントで前提宣言のみ） |
| `trap` を持たない | ファイル内に `trap` 行を書かない（Phase 6 で grep gate） |
| 公開変数は `SMOKE_` prefix | `SMOKE_SUMMARY_ENTRIES` / `SMOKE_OVERALL_STATUS` / `SMOKE_REDACT` のみグローバル参照 |
| 内部変数は `local` | 各関数の作業変数（`label`/`http`/`out_log`/`cf_sh` 等）はすべて `local` |
| redact 二重実装なし | sed の redact パターンを lib に書かず、`bash "$SMOKE_REDACT"` で `redact.sh` を呼ぶ（Phase 6 で grep gate） |

## 5.3 各 runner の移行手順（Before → After 差分方針）

### 共通の冒頭追加（3 runner 共通）

各 runner の `SCRIPT_DIR=...` 行の直後に、lib を source し `SMOKE_REDACT` を設定する 3 行を追加する。

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"
SMOKE_REDACT="$SCRIPT_DIR/redact.sh"
```

> 既存の `REDACT="$SCRIPT_DIR/redact.sh"` 行は**残してよい**（runner 固有コードがまだ `$REDACT` を直接参照している箇所＝attendance の `request_json` / admin-web の `collect_tail`・`request_admin` があるため）。`SMOKE_REDACT` は lib の redact 系関数が参照する別変数として併設する。両者は同一パスを指すので不整合は起きない。

---

### 5.3.1 `runtime-tag-bulk.sh`（最優先・共通化効果が最大）

| Before（現状定義） | After（移行後） |
| ------------------ | --------------- |
| `write_summary()`（L37-44・`checks` 直書き） | 薄ラッパー: `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` |
| `summary_pass()`（L46-49） | **削除**。呼び出し箇所（`seed` / `assert_status_file` / `cleanup` / `main`）を `smoke_summary_pass` に置換 |
| `log_redacted()`（L138-140） | **削除**。呼び出し箇所を `smoke_redact_line "$OUT_LOG" "..."` に置換 |
| `run_d1()`（L142-144） | 薄ラッパー: `run_d1() { smoke_run_d1 "$CF_SH" "$CF_D1_DATABASE" staging "$@"; }`（既存呼び出し側は無変更） |
| `OVERALL_STATUS="PASS"`（L27）/ `SUMMARY_ENTRIES=()`（L28） グローバル初期化 | **削除**。`main` 内の OUT_LOG 確定後（L277 `: > "$OUT_LOG"` の直後・trap 登録前）に `smoke_summary_init` を 1 度呼ぶ |
| `fail_and_exit()`（L51-61） | **runner に残す**。entry 構築を lib へ委譲した薄い形に書き換え: `smoke_summary_fail_entry "$label" "$status" "$contract" "$reason"; write_summary; echo "FAIL: ..." >&2; exit 1`（OVERALL_STATUS=FAIL は lib 側で設定されるため runner からは削除） |
| `assert_staging_guard`（L122-136） | **runner に残す**（D1 名 + production 拒否は固有）。内部の allowlist grep（L132）を `if ! smoke_assert_host_allow "$BASE" "$allow_regex"; then ...` に置換可（任意・非退化なら据え置きも可） |
| `parse_args` / `post_bulk` / `assert_all_status` / `assert_status_file` / `extract_count` / `audit_count` / `count_by_table` / `seed` / `cleanup` / `main` | **runner に残す**（固有契約 / AC-5・AC-10） |
| `seed`/`post_bulk`/`audit_count`/`count_by_table`/`cleanup` 内の `... | bash "$REDACT" >> "$OUT_LOG"` パイプ | 任意で `... | smoke_redact_filter "$OUT_LOG"` に置換可（非退化。`$REDACT` 直書き据え置きも可） |

> **trap（L278）は変更しない**: `trap 'cleanup || true; rm -rf "$TMP_DIR"; write_summary' EXIT`。`write_summary` が薄ラッパーになっても挙動は同一（AC-4）。
>
> **AC-10 保証**: tag-bulk test は `source "$RUNNER"`（L52）後に `assert_all_status` / `extract_count` を直接呼ぶ。runner が冒頭で `source lib` するため、test→runner→lib の二段 source で全関数が解決される。`main` は `if [[ "${BASH_SOURCE[0]}" == "$0" ]]`（L308）ガードで source 時に実行されない（既存維持）。
>
> **`SMOKE_SUMMARY_ENTRIES` への移行に伴う注意**: tag-bulk runner 内に `SUMMARY_ENTRIES` を直接 read する箇所は無い（全て `summary_pass` / `fail_and_exit` / `write_summary` 経由）。よって変数名を `SMOKE_` prefix に切り替えても他コードへの影響なし。

---

### 5.3.2 `runtime-admin-web.sh`

| Before | After |
| ------ | ----- |
| 冒頭 source 追加 | `SCRIPT_DIR` 行（L5）直後に lib source + `SMOKE_REDACT` 設定 |
| `write_summary()`（L99-106・`checks` 直書き） | 薄ラッパー: `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` |
| `SUMMARY_ENTRIES=()`（L96）/ `OVERALL_STATUS="PASS"`（L97） | **削除** → `smoke_summary_init`（`: > "$OUT_LOG"`（L94）の直後）を 1 度呼ぶ |
| `record_check()`（L108-114） | **runner に残す**（admin-web 固有の `{label,status,http,reason}` 形・contract キー無し。tag-bulk/attendance と shape が違うため過剰共通化回避） |
| `fail_and_exit()`（L116-127） | **runner に残す**（`collect_tail 0` 副作用 + exit_code 可変が固有）。`OVERALL_STATUS="FAIL"` 行（L122）は `SMOKE_OVERALL_STATUS="FAIL"` に置換、`record_check`/`write_summary` 呼び出しは維持 |
| `resolve_env_vars()` 内 `tr`（L49） | `ENV_PREFIX="$(smoke_env_prefix "$ENVIRONMENT")"` に置換 |
| `assert_target()` 内 allowlist grep（L130） | `if ! smoke_assert_host_allow "$BASE" "$TARGET_ALLOW_REGEX"; then fail_and_exit ...; fi` に置換 |
| `start_tail` / `collect_tail` / `request_admin` | **runner に残す**（Workers tail / render-error 検出が固有）。`collect_tail` 内の `bash "$REDACT" < "$TAIL_FILE" >> "$OUT_LOG"`（L164・標準入力リダイレクト）は据え置き（`smoke_redact_filter` はパイプ前提のため形が異なる。非退化優先で無変更） |

> **trap cleanup（L91）は変更しない**。`record_check` を lib 化しないため、`SMOKE_SUMMARY_ENTRIES` への参照は runner 内 `record_check` / `write_summary` ラッパーに閉じる。`record_check` が `SUMMARY_ENTRIES+=(...)` で参照する変数名を `SMOKE_SUMMARY_ENTRIES` に統一する（`smoke_summary_init` が初期化する変数と一致させる）。

---

### 5.3.3 `runtime-attendance-provider.sh`

| Before | After |
| ------ | ----- |
| 冒頭 source 追加 | `SCRIPT_DIR` 行（L26）直後に lib source + `SMOKE_REDACT` 設定 |
| `write_summary()`（L102-109・`routes` 直書き） | 薄ラッパー: `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "routes"; }`（**array_key=routes** / AC-9） |
| `SUMMARY_ENTRIES=()`（L99）/ `OVERALL_STATUS="PASS"`（L100） | **削除** → `smoke_summary_init`（`: > "$OUT_LOG"`（L96）直後）を 1 度呼ぶ |
| `fail_and_exit()`（L168-186） | **runner に残す**（attendance 固有: reason 有無で entry 形が変わる + PASS entry が `summary` キー。lib の `smoke_summary_fail_entry` は contract+reason 固定形のため**使わない**＝shape 差を壊さない）。`OVERALL_STATUS="FAIL"`（L173）→ `SMOKE_OVERALL_STATUS="FAIL"`、`SUMMARY_ENTRIES+=(...)`（L175/L177）→ `SMOKE_SUMMARY_ENTRIES+=(...)` に変数名のみ統一 |
| `request_json` の PASS entry（L269 `SUMMARY_ENTRIES+=(...summary...)`） | **runner に残す**（`summary` キー付き固有形）。変数名のみ `SMOKE_SUMMARY_ENTRIES` に統一 |
| `assert_target()` 内 allowlist grep（L143） | `if ! smoke_assert_host_allow "$BASE" "$allow_regex"; then fail_and_exit "target-allowlist" "000" "${API_BASE_VAR} must match $allow_regex"; fi` に置換 |
| `assert_bearer_subject_allowed` / `classify_unauthorized_bearer` / `request_json` / `assert_target` 本体 | **runner に残す**（bearer JWT 検証 / marker curl が固有） |

> **trap（L93）は変更しない**: `trap 'rm -rf "$TMP_DIR"' EXIT`。
>
> **array_key の取り違え防止（AC-9 最重要）**: attendance の薄ラッパーは必ず `"routes"` を渡す。これにより T-4-6〜T-4-9 の `.routes[0].reason` assert が非退化で通る。誤って `"checks"` を渡すと attendance test が即 FAIL するため、移行直後に `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` を実行して検出する。

## 5.4 実装順序（lib → tag-bulk → admin-web → attendance → 検証）

| Step | 作業 | 検証コマンド | 期待 |
| ---- | ---- | ------------ | ---- |
| 1 | `scripts/smoke/lib/smoke-common.sh` を 5.2 の骨格で新規作成 | `shellcheck scripts/smoke/lib/smoke-common.sh` | clean（指摘なし） |
| 2 | `scripts/smoke/__tests__/smoke-common.test.sh` を Phase 4 ケースで新規作成し実行 | `bash scripts/smoke/__tests__/smoke-common.test.sh` | `OK: smoke-common tests pass` |
| 3 | `runtime-tag-bulk.sh` を 5.3.1 に従い移行（最も効果大） | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | `OK: runtime-tag-bulk tests pass`（AC-3 / AC-10） |
| 4 | `runtime-admin-web.sh` を 5.3.2 に従い移行 | `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` | `runtime-admin-web tests PASS`（AC-3） |
| 5 | `runtime-attendance-provider.sh` を 5.3.3 に従い移行 | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | `OK: runtime-attendance-provider tests pass`（AC-3 / AC-9） |
| 6 | 4 ファイルまとめて静的検証 | `shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-*.sh` | clean（AC-7） |
| 7 | 全 smoke test 一括実行（最終ゲート） | `for t in scripts/smoke/__tests__/*.test.sh; do echo "== $t =="; bash "$t" || exit 1; done` | 全 PASS（exit 0） |

> **順序の根拠**: tag-bulk が `summary_pass` / `log_redacted` / `run_d1` を実際に重複保持しているため共通化効果が最大かつ二段 source（AC-10）の検証先でもある → これを先に通すことで lib 設計の妥当性を最速で確認できる。以降 admin-web → attendance は薄ラッパー + allowlist/prefix 置換が中心で差分が小さい。

## 5.5 入出力契約（CONST_005・lib 公開 surface）

| 関数 | 入力 | 出力 / 副作用 | exit / return |
| ---- | ---- | ------------- | ------------- |
| `smoke_redact_filter` | stdin（ログ行）/ `$1` out_log | out_log へ redact 済みを追記 | `redact.sh` の exit に従う |
| `smoke_redact_line` | `$1` out_log / `$2..` text | out_log へ redact 済み 1 行追記 | 同上 |
| `smoke_summary_init` | なし | `SMOKE_SUMMARY_ENTRIES=()` / `SMOKE_OVERALL_STATUS="PASS"` | 0 |
| `smoke_summary_pass` | `$1` label | `SMOKE_SUMMARY_ENTRIES` に PASS entry 追加 | 0 |
| `smoke_summary_fail_entry` | `$1` label / `$2` http / `$3` contract / `$4` reason | `SMOKE_OVERALL_STATUS="FAIL"` + FAIL entry 追加 | 0 |
| `smoke_write_summary` | `$1` ci_flag / `$2` json_path / `$3` array_key | ci_flag=1 かつ json_path 非空時のみ summary.json 出力 | 0（no-op 含む） |
| `smoke_assert_host_allow` | `$1` base / `$2` allow_regex | なし | 一致 0 / 不一致 非0 |
| `smoke_env_prefix` | `$1` environment | stdout に大文字 prefix | 0 |
| `smoke_run_d1` | `$1` cf_sh / `$2` db / `$3` env / `$4..` d1 引数 | `cf.sh d1 execute <db> --env <env> --remote <args>` を実行・stdout に結果 | cf.sh の exit に従う |

- **公開変数**: `SMOKE_SUMMARY_ENTRIES`(array) / `SMOKE_OVERALL_STATUS`(string) / `SMOKE_REDACT`(path)。
- **テスト**: 5.4 Step 2/7 のコマンドで全 PASS（lib 単体 + 既存 3 runner 非退化）。
- **DoD**: 5.6 参照。

## 5.6 完了条件（Phase 5 / DoD）

- [x] 新規 / 修正ファイル 5 件を一覧で確定した（[Feedback RT-03]）。
- [x] `smoke-common.sh` の完全実装骨格（9 関数 + 3 公開変数 + `set`/`trap` 非保持の冒頭コメント）を提示した。
- [x] 3 runner の Before→After 移行表を行番号付きで確定した（薄ラッパー / source 行 / 重複削除 / array_key 明示）。
- [x] array_key（attendance=routes / admin-web・tag-bulk=checks）を移行表で明示した（AC-9）。
- [x] 実装順序（lib → tag-bulk → admin-web → attendance → 検証）と各 Step の検証コマンド・期待結果を確定した。
- [x] CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 入出力 / テスト / 実行コマンド / DoD）を本 Phase に含めた。
- [x] （実装時）5.4 Step 1〜7 が全て期待通り（lib test PASS + 既存 3 runner test 非退化 PASS + shellcheck clean）。
