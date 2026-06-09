# Phase 8: リファクタリング

[実装区分: 実装仕様書] / NON_VISUAL

## 8.1 リファクタリングの本質

本タスクは「機能追加」ではなく「**コピー重複を共通 lib へ集約する純粋リファクタリング**」である。挙動非退化（AC-3）を絶対基準とし、変更は「定義箇所の移動 / 薄ラッパーへの置換」に限定する。本 Phase は変更内容を `対象 / Before / After / 理由` テーブルで記録する（[Feedback RT-03]）。

## 8.2 変更内容テーブル（対象 / Before / After / 理由）[RT-03]

### 新規ファイル

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `scripts/smoke/lib/smoke-common.sh` | 存在しない | 9 関数 + `SMOKE_*` 公開変数を集約した共通 lib | SSOT 化（AC-1）。drift の発生源を 1 箇所に集約 |
| `scripts/smoke/__tests__/smoke-common.test.sh` | 存在しない | lib 9 関数の単体 test | lib の単体被覆（AC-6 / Phase 7） |

### `runtime-tag-bulk.sh`（共通化効果が最大）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| 冒頭 | lib source なし | `source "$SCRIPT_DIR/lib/smoke-common.sh"` + `SMOKE_REDACT=...` 追加 | lib 利用の前提（AC-2） |
| `write_summary()` 本体 | 自前で `printf '{"status":..,"checks":[..]}'` を構築 | 薄ラッパー `smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"` | summary 書き出しの SSOT 化（AC-9） |
| `summary_pass()` | 自前定義 | 呼び出しを `smoke_summary_pass` へ置換（自前定義は削除） | PASS entry の SSOT 化 |
| `log_redacted()` | 自前定義（`printf .. \| bash "$REDACT"`） | 呼び出しを `smoke_redact_line "$OUT_LOG"` へ置換（自前定義は削除） | redact 行ログの SSOT 化（AC-8） |
| `run_d1()` | 自前 `cf.sh d1 execute ...` | 薄ラッパー `smoke_run_d1 "$CF_SH" "$CF_D1_DATABASE" staging "$@"` | D1 ラッパーの SSOT 化 |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` | グローバル初期化 | `smoke_summary_init`（OUT_LOG 確定後に呼ぶ） | summary 状態初期化の SSOT 化 |
| `fail_and_exit()` | 自前 entry 構築 + exit | runner 残置（内部で `smoke_summary_fail_entry` → `write_summary` → exit を組む薄ラッパー化） | array_key / exit code が固有のため runner 残置（AC-5） |
| `assert_staging_guard` / `parse_args` / `post_bulk` / `assert_all_status` / `assert_status_file` / `extract_count` / `audit_count` / `count_by_table` / `seed` / `cleanup` / `main` | 自前定義 | **変更なし（runner 残置）** | 固有契約。`assert_all_status` / `extract_count` は test が `source "$RUNNER"` で直接呼ぶため移動不可（AC-10） |

### `runtime-admin-web.sh`

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| 冒頭 | lib source なし | `source .../lib/smoke-common.sh` + `SMOKE_REDACT=...` | AC-2 |
| `write_summary()` | 自前 `checks` JSON 構築 | 薄ラッパー `smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"` | AC-9 |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` | グローバル初期化 | `smoke_summary_init` | summary 状態 SSOT |
| redact パイプ（`... \| bash "$REDACT" >> "$OUT_LOG"`） | 自前パイプ | `... \| smoke_redact_filter "$OUT_LOG"` | redact SSOT（AC-8） |
| `assert_target` 内 allowlist grep | 自前 `grep -Eiq` | `smoke_assert_host_allow "$BASE" "$TARGET_ALLOW_REGEX"` | host 照合の純粋部品化 |
| `resolve_env_vars` 内 `tr '[:lower:]' '[:upper:]'` | 自前 tr | `smoke_env_prefix "$environment"` | env prefix SSOT |
| `record_check()` / `fail_and_exit()` / `start_tail` / `collect_tail` / `request_admin` / `assert_target` 本体 | 自前定義 | **runner 残置** | `record_check` は PASS/FAIL 単一形で shape が固有・`collect_tail` 副作用が固有（AC-5） |

### `runtime-attendance-provider.sh`

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| 冒頭 | lib source なし | `source .../lib/smoke-common.sh` + `SMOKE_REDACT=...` | AC-2 |
| `write_summary()` | 自前 `routes` JSON 構築 | 薄ラッパー `smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "routes"`（**array_key=routes**） | AC-9（attendance の `.routes[]` shape を非退化再現） |
| `SUMMARY_ENTRIES=()` / `OVERALL_STATUS="PASS"` | グローバル初期化 | `smoke_summary_init` | summary 状態 SSOT |
| redact パイプ | 自前パイプ | `smoke_redact_filter "$OUT_LOG"` | redact SSOT（AC-8） |
| `assert_target` 内 allowlist grep | 自前 grep | `smoke_assert_host_allow "$BASE" "$allow_regex"` | host 照合の純粋部品化 |
| `fail_and_exit()`（reason 任意 / summary キー） / `request_json` / `classify_unauthorized_bearer` / `assert_bearer_subject_allowed` / `assert_target` 本体 | 自前定義 | **runner 残置** | entry shape が最も特殊（reason 任意・summary キー）。共通形へ畳むと test の `.routes[0].reason` assert が壊れる（AC-5 / AC-9） |

## 8.3 重複削除の Before/After（削除行数の見積もり）

> 見積もりは「runner から消える自前定義行 / lib へ集約される行」の概算。実装後に diff で実測し Phase 11 ledger に記録する。

| 共通機構 | Before（3 runner にコピー） | After | 削減効果 |
| -------- | --------------------------- | ----- | -------- |
| `write_summary` 本体 | 3 runner にそれぞれ ~6〜8 行 = 計 ~20 行 | lib 1 定義（~8 行）+ runner 薄ラッパー 各 1 行 = ~3 行 | 重複定義 3 → 1。修正点が 1 箇所に |
| summary 状態初期化（`SUMMARY_ENTRIES=()` + `OVERALL_STATUS="PASS"`） | 3 runner × 2 行 = ~6 行 | lib `smoke_summary_init`（~3 行）+ runner 各 1 呼び出し | 初期化ロジック 3 → 1 |
| redact パイプ / 行ログ | 3 runner に散在（attendance/admin-web=パイプ、tag-bulk=`log_redacted` 定義 ~3 行） | lib `smoke_redact_filter` / `smoke_redact_line`（計 ~6 行）+ 呼び出し置換 | redact 呼び出し形が 1 SSOT |
| `summary_pass`（tag-bulk のみ） | tag-bulk ~3 行 | lib へ集約 | 将来 SSOT |
| `run_d1`（tag-bulk のみ） | tag-bulk ~3 行 | lib へ集約 + runner 薄ラッパー | 将来 D1 runner の SSOT |
| host allowlist grep | 3 runner に grep 1 行ずつ | lib `smoke_assert_host_allow` + 呼び出し | 照合ロジック 3 → 1 |
| env prefix `tr` | admin-web 1 行 | lib `smoke_env_prefix` | 将来 SSOT |

→ **lib 新規 ~60〜70 行**を作る代わりに、3 runner から **重複/分散していた ~40〜50 行相当が削除 or 薄ラッパー化**され、共通機構の **修正点が「3 runner 分散」から「lib 1 箇所」へ収束**する。

## 8.4 duplicate / navigation drift の削減効果

| drift 項目（Before の実害） | After |
| --------------------------- | ----- |
| `write_summary` を 3 runner にコピー → attendance だけ `routes`・他は `checks` という**キー分岐 drift が既に発生**（Phase 1 §28 調査結論） | lib `smoke_write_summary <array_key>` に集約。キー差は **引数** で明示され、コピー由来の偶発 drift が構造的に発生しない |
| summary 初期化を 3 箇所で書く → 一方だけ修正する navigation drift | `smoke_summary_init` 1 箇所。修正が自動で 3 runner に波及 |
| redact パイプを 3 箇所で書く → redact 呼び出し形の不統一リスク | `smoke_redact_filter` / `smoke_redact_line` で呼び出し形を SSOT 化 |

→ 「共通機構を直すために 3 ファイルを巡回（navigation）する」必要が消え、**1 lib を直せば 3 runner に反映**される。

## 8.5 意図的に共通化しなかった箇所（過剰共通化の回避）

> Phase 2.4 MECE 境界 / Phase 3.5 代替案 B（採用）に基づき、**entry shape が runner 間で異なる箇所は意図的に runner 残置**とした。これは「重複に見えるが実は固有契約」であり、共通化すると引数・分岐が膨れ柔軟性を失う（バランスループ悪化 / Phase 3.3）。

| 意図的に共通化しなかった要素 | 残置 runner | 共通化しない理由 |
| ---------------------------- | ----------- | ---------------- |
| `fail_and_exit`（attendance: reason 任意 + PASS entry が `summary` キー） | attendance | entry shape が最特殊。lib `smoke_summary_fail_entry`（contract+reason 固定形）へ畳むと `.routes[0].reason` assert が壊れる |
| `record_check`（admin-web: PASS/FAIL 単一関数 / contract キー無し） | admin-web | tag-bulk/attendance と shape が違う単一形。共通化すると分岐肥大 |
| `assert_target` / `assert_staging_guard`（marker curl / allowlist のみ / D1名+production拒否の 3 通り） | 全 runner | 実装が 3 通り。単一関数へ統合すると引数膨張（AC-5） |
| `assert_all_status` / `extract_count` / `count_by_table` / `audit_count`（bulk tag contract / D1 集計） | tag-bulk | 固有契約。かつ test が `source "$RUNNER"` で直接呼ぶため**移動不可**（AC-10） |
| `classify_unauthorized_bearer` / `assert_bearer_subject_allowed`（bearer JWT 検証） | attendance | 固有 auth ロジック |
| `start_tail` / `collect_tail`（Workers tail / render-error 検出） | admin-web | 固有 |
| `trap ... EXIT` の**登録** | 各 runner | trap shape が 3 通り。lib は trap を持たず登録は 100% runner（AC-4 二重実行防止） |

→ これらは Phase 10 の MINOR 指摘候補（将来 entry shape を統一できれば更なる共通化余地）として記録するが、本タスクでは **YAGNI** として共通化しない。

## 8.6 完了条件（Phase 8）

- [x] 変更内容を `対象/Before/After/理由` テーブルで記録した（RT-03）。
- [x] 重複削除の Before/After（削除行数見積もり・lib への集約）を記録した。
- [x] duplicate / navigation drift の削減効果（write_summary / summary 初期化 / redact パイプが lib 1 箇所へ）を記録した。
- [x] 過剰共通化を避けた箇所（attendance fail_and_exit / admin-web record_check 等）を「意図的に共通化しなかった」項目として明記した。
