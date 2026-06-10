# Phase 4: テスト作成

[実装区分: 実装仕様書] / NON_VISUAL

## 4.1 TDD 方針（NON_VISUAL リファクタの二本立て）

本タスクは「挙動を 1 ビットも変えずに共通 lib を抽出する」NON_VISUAL リファクタリングである。よってテストは次の 2 系統で構成する。

| 系統 | 対象 | 役割 | 本 Phase での扱い |
| ---- | ---- | ---- | ----------------- |
| A. **非退化基準（不変）** | 既存 3 runner test（`runtime-attendance-provider.test.sh` / `runtime-admin-web.test.sh` / `runtime-tag-bulk.test.sh`） | 移行前後で「全 PASS のまま」を絶対基準とする（AC-3） | **本体は変更しない**。lib 抽出後も同じ assert が GREEN であることが合格条件 |
| B. **新規 lib 単体テスト** | `scripts/smoke/__tests__/smoke-common.test.sh`（新規） | lib 9 関数 + 公開変数の単体挙動を直接検証（AC-6） | 本 Phase でケース設計（実ファイル作成は Phase 5） |

> **TDD の順序（NON_VISUAL リファクタ版）**: 通常の「RED → GREEN」ではなく、「既存 3 runner test を**先に走らせて baseline GREEN を確定**（移行前スナップショット）」→「lib 抽出 + lib test 追加」→「3 runner test 再実行で**非退化 GREEN 維持**」を満たす。lib test（系統 B）は新規機能ではなく既存挙動の単体抽出なので、lib 実装と同時に GREEN になる設計とする。

> **bash であることの含意**: TypeScript の `(facade as ...)` 型キャストや mock framework は不要。private 関数のテストは「lib を `source` して関数を直接呼ぶ」方式で行う（bash の source は同一プロセスに全関数を取り込むため、export 修飾なしで全関数が呼べる）。外部コマンド（`cf.sh` / `curl`）は **PATH 差し替え stub** で隔離する（既存 3 runner test と同じ手法）。

## 4.2 既存 3 runner test を変更しない方針（明示）

- 既存 3 runner test の**テスト本体は一切変更しない**。これらが assert する挙動（summary.json shape / exit code / log 内容 / redaction）が非退化の絶対基準（正本順位 #1）であるため、test 側を緩めることは「false green を作る」ことに等しく禁止。
- 特に以下の assert を壊さないことが要点:

| test ファイル | 壊してはいけない assert | 根拠行 |
| ------------- | ----------------------- | ------ |
| `runtime-attendance-provider.test.sh` | `.routes[0].reason == "..."`（summary.json の配列キーが `routes`） | T-4-6 / T-4-7 / T-4-8 / T-4-9（L208, L263, L288, L343） |
| `runtime-admin-web.test.sh` | `.checks[] \| select(.reason == $reason)`（配列キーが `checks`） | L84 |
| `runtime-tag-bulk.test.sh` | `source "$RUNNER"` 後の `assert_all_status` / `extract_count` 直接呼び出し | L52, L62-70 |
| `runtime-tag-bulk.test.sh` | `.status == "PASS"`（配列キーは `checks`） | L132 |

- **二段 source（`source "$RUNNER"` 後に lib 関数が解決される）の検証**は、tag-bulk test 既存ケースが間接的に担保するが、明示的な静的検証ケースは **Phase 6** で追加する（本 Phase では「壊さない」基準の確認まで）。

## 4.3 新規 `scripts/smoke/__tests__/smoke-common.test.sh` のテストケース表

lib を `source` して各関数を直接呼ぶ。出力 JSON は `jq -e` で構造 assert、stub 引数は記録ファイルで検証する。`assert_eq` / `fail` カウンタは既存 3 runner test と同じヘルパー様式に揃える。

### 共通セットアップ（テスト冒頭）

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$SCRIPT_DIR/../lib/smoke-common.sh"
REDACT="$SCRIPT_DIR/../redact.sh"
# lib を source する直前に SMOKE_REDACT を設定（redact 系関数が参照）
SMOKE_REDACT="$REDACT"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$LIB"
```

### ケース一覧

| ID | 対象関数 | 入力 / セットアップ | 期待出力 / 検証 |
| -- | -------- | ------------------- | --------------- |
| TC-01 | `smoke_summary_init` | 事前に `SMOKE_SUMMARY_ENTRIES=("dirty")` / `SMOKE_OVERALL_STATUS="FAIL"` を汚した後に呼ぶ | `${#SMOKE_SUMMARY_ENTRIES[@]} == 0` かつ `SMOKE_OVERALL_STATUS == "PASS"` |
| TC-02 | `smoke_summary_pass` | `smoke_summary_init; smoke_summary_pass "seed"` | `SMOKE_SUMMARY_ENTRIES[0]` を `jq -e '.label=="seed" and .status=="PASS"'` で検証。キー数が `label,status` の 2 つのみ |
| TC-03 | `smoke_summary_fail_entry`（overall 遷移） | `smoke_summary_init; smoke_summary_fail_entry "assign" "500" "HTTP 200" "non-200"` | `SMOKE_OVERALL_STATUS == "FAIL"` |
| TC-04 | `smoke_summary_fail_entry`（entry shape） | TC-03 と同じ | `SMOKE_SUMMARY_ENTRIES[0]` を `jq -e '.label=="assign" and .status=="FAIL" and .http=="500" and .contract=="HTTP 200" and .reason=="non-200"'`。label/contract/reason が `jq -cn --arg` で文字列として正しく埋まる |
| TC-05 | `smoke_summary_fail_entry`（空 reason） | `smoke_summary_fail_entry "x" "500" "c" ""` | `jq -e '.reason==""'`（空文字でも JSON 文字列として有効） |
| TC-06 | `smoke_write_summary`（array_key=routes） | init→pass "r0"→`smoke_write_summary 1 "$TMP/summary.json" routes` | 出力ファイルが `jq -e '.status=="PASS" and (.routes \| type=="array") and (.routes \| length==1) and (has("checks") \| not)'` |
| TC-07 | `smoke_write_summary`（array_key=checks） | init→pass "c0"→`smoke_write_summary 1 "$TMP/summary.json" checks` | `jq -e '.status=="PASS" and (.checks \| type=="array") and (has("routes") \| not)'` |
| TC-08 | `smoke_write_summary`（ci_flag=0 で書かない） | init→pass→`smoke_write_summary 0 "$TMP/no.json" checks` | `$TMP/no.json` が**存在しない**（後方互換: `--ci-summary` 無しでは summary 非出力） |
| TC-09 | `smoke_write_summary`（json_path 未指定で no-op） | `smoke_write_summary 1 "" checks` | return 0 で副作用なし（ファイル生成なし・非ゼロ exit しない） |
| TC-10 | `smoke_write_summary`（FAIL 反映） | init→`smoke_summary_fail_entry "x" "500" "c" "r"`→write checks | `jq -e '.status=="FAIL" and (.checks[0].status=="FAIL")'` |
| TC-11 | `smoke_assert_host_allow`（一致→0） | `smoke_assert_host_allow "https://api-staging.example.test" 'staging\|127\.0\.0\.1\|localhost'` | exit code 0 |
| TC-12 | `smoke_assert_host_allow`（不一致→非0） | `smoke_assert_host_allow "https://evil.example.com" 'staging\|localhost'` | exit code 非 0（`run_expect_nonzero` で 1 を期待） |
| TC-13 | `smoke_assert_host_allow`（大文字小文字無視） | `smoke_assert_host_allow "https://STAGING.example.test" 'staging'` | exit code 0（`grep -Eiq` の `-i` を担保） |
| TC-14 | `smoke_env_prefix`（staging→STAGING） | `smoke_env_prefix staging` | stdout が `STAGING` |
| TC-15 | `smoke_env_prefix`（production→PRODUCTION） | `smoke_env_prefix production` | stdout が `PRODUCTION` |
| TC-16 | `smoke_redact_line`（Bearer→[REDACTED]） | `smoke_redact_line "$TMP/log" "authorization: Bearer abc123tokenvalue0000"` | `$TMP/log` に `[REDACTED]` を含み、生 `abc123tokenvalue0000` を含まない |
| TC-17 | `smoke_redact_filter`（パイプ→[REDACTED]） | `printf 'Cookie: __Secure-authjs.session-token=secretval\n' \| smoke_redact_filter "$TMP/log2"` | `$TMP/log2` に `[REDACTED]`、生 `secretval` 非出現 |
| TC-18 | `smoke_redact_filter`（追記=`>>`） | 既存内容のあるログに 2 回 filter | 1 行目が消えず追記される（`>>` を担保。`>` で上書きしていないこと） |
| TC-19 | `smoke_run_d1`（cf.sh stub へ正引数） | PATH 上に記録型 `cf.sh` stub を置き `smoke_run_d1 "$STUB" ubm-hyogo-db-staging staging --json --command "SELECT 1"` | stub が記録した引数列が `d1 execute ubm-hyogo-db-staging --env staging --remote --json --command SELECT 1` の順序であること |
| TC-20 | `smoke_run_d1`（`--file` パススルー） | `smoke_run_d1 "$STUB" db staging --file "$SEED"` | 記録引数に `--remote --file <SEED>` が末尾に正しく付くこと（`shift 3` 後の `"$@"` 透過） |

### TC-19 / TC-20 の cf.sh stub（引数記録方式）

```bash
# stub は受け取った全引数を $ARGS_FILE へ書き出すだけ。
cat > "$STUB" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$ARGS_FILE"
printf '{"result":[]}\n'
SH
chmod +x "$STUB"
# 呼び出し後: 期待は "d1 execute ubm-hyogo-db-staging --env staging --remote --json --command SELECT 1"
expected="d1 execute ubm-hyogo-db-staging --env staging --remote --json --command SELECT 1"
assert_eq "$expected" "$(cat "$ARGS_FILE")" "run-d1-args"
```

> **注**: `smoke_run_d1` は第 1 引数に `cf_sh` のパスを取る（`bash "$cf_sh" d1 execute ...`）。stub はそのパスへ直接渡せるため PATH 差し替えは不要（runner 側ラッパー `run_d1` が `$CF_SH` を渡す形と一致）。

### グローバル汚染チェック（AC-7 補助・本 Phase で 1 ケース）

| ID | 対象 | 検証 |
| -- | ---- | ---- |
| TC-21 | lib 内部変数の漏出なし | lib を source した後、`smoke_summary_fail_entry` 内で使う `label` / `http` 等の **内部変数がグローバルに残らない**（`declare -p label 2>/dev/null` が非ゼロ＝未定義）。`local` 化の担保 |

## 4.4 テストヘルパー様式（既存 3 runner test に合わせる）

```bash
fail=0
assert_eq() { # $1 expected $2 actual $3 label
  if [[ "$1" != "$2" ]]; then echo "FAIL [$3] expected $1, got $2"; fail=$((fail + 1));
  else echo "PASS [$3]"; fi
}
run_expect_exit() { # $1 label $2 expected_code $3.. command
  local label="$1" expected="$2"; shift 2
  set +e; "$@" >/dev/null 2>&1; local code=$?; set -e
  assert_eq "$expected" "$code" "$label"
}
```

- 各ケースは `PASS [TC-xx]` / `FAIL [TC-xx]` を出力し、末尾で `fail` が 0 なら `echo "OK: smoke-common tests pass"`、非 0 なら `exit 1`。
- これにより既存 3 runner test と同じ「`OK: ...` を最後に出す」契約に揃う（CI や手動実行で grep しやすい）。

## 4.5 実行コマンドと期待結果

| 対象 | コマンド | 期待 stdout 末尾 |
| ---- | -------- | ---------------- |
| 新規 lib test | `bash scripts/smoke/__tests__/smoke-common.test.sh` | `OK: smoke-common tests pass`（exit 0） |
| 非退化 #1 | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | `OK: runtime-attendance-provider tests pass` |
| 非退化 #2 | `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` | `runtime-admin-web tests PASS` |
| 非退化 #3 | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | `OK: runtime-tag-bulk tests pass` |
| 一括 | `for t in scripts/smoke/__tests__/*.test.sh; do bash "$t" || exit 1; done` | 全 test が PASS（exit 0） |

> いずれの実行も staging / D1 / production への接続を持たない（PATH stub で `curl` / `cf.sh` を隔離）。CI の install-free shell-lint レーンでも動作する（lib は外部依存ゼロ、`jq` のみ前提＝既存 runner と同条件）。

## 4.6 完了条件（Phase 4）

- [x] 非退化基準（既存 3 runner test を変更しない）を明文化し、壊してはいけない assert を表で固定した。
- [x] 新規 `smoke-common.test.sh` の単体ケース（TC-01〜TC-21）を入力 / 期待出力で列挙した。
- [x] `smoke_write_summary` の array_key=routes/checks、ci_flag=0 非出力、未指定 no-op を網羅した（AC-9）。
- [x] `smoke_run_d1` の cf.sh stub への引数（`d1 execute <db> --env <env> --remote ...`）検証を定義した。
- [x] private 関数テストは「lib を source して直接呼ぶ」方式と明記した（bash ゆえ facade キャスト不要）。
- [x] 実行コマンドと期待結果（`OK: ...`）を確定した。
- [x] 二段 source の明示検証・cleanup 二重実行検証は Phase 6 へ送ることを明記した。
