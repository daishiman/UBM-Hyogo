# 実装ガイド — issue-1138-smoke-runner-common-lib-extraction

## Part 1: 概念ガイド（中学生にもわかる例え話）

### なぜ必要か

同じ準備作業が 3 つの smoke runner に分かれていると、ひとつのルール変更を 3 箇所へ同じように反映する必要がある。1 箇所だけ直し忘れると、ログの redaction や summary.json の形が runner ごとにずれてしまう。今回の共通 lib は、そのずれを防ぐために「本当に共通な部品」だけを 1 箇所へ集める。

### たとえ話 — 「3 人がそれぞれ持っている同じ道具を、共有の道具箱に 1 セットだけ入れる」

学校に「ロボットがちゃんと動くか毎回チェックする係」が 3 人いると想像してください。3 人はそれぞれ別々のロボット（出席チェック係 = attendance、管理画面チェック係 = admin-web、タグ一括付与チェック係 = tag-bulk）を担当しています。

ところが 3 人とも、チェックの前に必ず同じ準備作業をします。たとえば「点検の記録ノートを新品にする」「秘密の情報（パスワードのようなもの）が記録に写り込まないように黒く塗りつぶす」「結果を決まった形式の紙にまとめて提出する」。この準備の道具を、3 人がそれぞれ自分のカバンに 1 個ずつ、合計 3 個持っているのが「今の状態」です。

これには困ったことが起きます。たとえば「塗りつぶしのやり方を新しいルールに変えよう」となったとき、3 人のカバンの中身を 1 個ずつ直さないといけません。1 人だけ直し忘れると、その人だけ古いやり方のまま — これが**バラバラ（drift）**です。実際に今、結果をまとめる紙のラベルが「routes」と書く人と「checks」と書く人で割れてしまっています。

### このタスクがやること — 「共有の道具箱（共通 lib）を作る」

そこで、よく使う道具だけを取り出して**教室の真ん中に共有の道具箱を 1 個だけ置く**ことにします。これが新しいファイル `scripts/smoke/lib/smoke-common.sh`（共通 lib）です。3 人はこれから自分のカバンから同じ道具を捨てて、「道具箱を開けて使う」（= `source` する）ようにします。これで道具が 1 セットになり、ルール変更も道具箱 1 個を直すだけで全員に行き渡ります。

ただし、**全部を共有箱に入れてはいけません**。3 人で形が違う道具（たとえば結果をまとめる紙のラベルが人によって「routes」「checks」と違う、合格・不合格の記録の書き方が人によって違う）は、無理に 1 個にまとめると逆に使いにくくなります。だから「3 人とも完全に同じ道具」だけを箱に入れ、「人によって違う道具」は今まで通り各自のカバンに残します。これを**境界をきれいに分ける（MECE）**と言います。

### この機能でできること

3 つの runner は同じ summary 初期化、redact、summary 出力、host allowlist 照合、env prefix 変換、D1 実行 wrapper を共有できる。各 runner 固有の request / assert / trap は残るため、共通化しても既存の合否判定や summary.json の `routes` / `checks` 形状は変わらない。

### 一番大事な約束 — 「チェックの厳しさは 1 ミリも変えない」

道具箱を作る目的は「片付け」であって「チェックを甘くすること」ではありません。だから**チェックの結果（合格・不合格の判定、提出する紙の形、エラーで止まるタイミング）は今までと完全に同じ**でなければなりません。これを確かめるために、各係がもともと持っている「自動チェックのチェック」（既存の local test）を全部もう一度走らせて、1 個も結果が変わらないことを確認します。これが完成の合格ライン（非退化）です。

> このタスクは「中身の整理」だけで、ロボット（実際のサービス）の動きや画面は一切変わりません。だから画面のスクリーンショット（Phase 11）は不要です。

### 今回作ったもの

今回は `scripts/smoke/lib/smoke-common.sh` という共有の道具箱と、それを確認する `scripts/smoke/__tests__/smoke-common.test.sh` を作った。さらに 3 つの既存 runner がその道具箱を使うように変更し、既存テストが今まで通り PASS することを確認した。

## Part 2: 実装詳細（技術者向け）

### 背景

`scripts/smoke/` には 3 本の runtime smoke runner がコピー重複で存在する（attendance 291 行 / admin-web 217 行 / tag-bulk 310 行）。共通機構が SSOT 化されておらず、`write_summary` の JSON 配列キー分岐（attendance=`routes` / admin-web・tag-bulk=`checks`）・`fail_and_exit` の 3 シグネチャ・trap shape 3 通りという drift が既に顕在化している。本タスクは共通部分のみを新規 lib `scripts/smoke/lib/smoke-common.sh` へ抽出し、3 runner を「lib を `source` する + 薄ラッパー」へ移行する。**挙動非退化が最優先**で、既存 3 runner の local test 全 PASS が完了条件である。

### 要約

共通 lib は **`set -euo pipefail` を設定せず / `trap` を登録しない**純粋部品とする（source 副作用回避）。公開変数は `SMOKE_` prefix で名前空間隔離、内部変数は `local` 化（AC-7）。redact は `scripts/smoke/redact.sh` を参照するのみで二重実装しない（AC-8）。entry shape が 3 runner で異なる部分（attendance=reason 任意 + summary キー / admin-web=record_check 単一形 / tag-bulk=contract+reason）は lib に巻き込まず runner に残し、lib は「shape が一致する部分」と「array_key 引数化した write_summary」のみ提供する（AC-5・AC-9・過剰共通化回避）。

### 変更ファイル一覧

| 区分 | パス | 概要 |
| ---- | ---- | ---- |
| NEW | `scripts/smoke/lib/smoke-common.sh` | 共通 lib（9 関数 + 3 公開変数） |
| NEW | `scripts/smoke/__tests__/smoke-common.test.sh` | lib 単体 local test |
| EDIT | `scripts/smoke/runtime-attendance-provider.sh` | lib source + 薄ラッパー（array_key=routes） |
| EDIT | `scripts/smoke/runtime-admin-web.sh` | lib source + 薄ラッパー（array_key=checks） |
| EDIT | `scripts/smoke/runtime-tag-bulk.sh` | lib source + 薄ラッパー（array_key=checks） |

### lib の公開変数（状態）

| 変数 | 型 | 初期化 | 由来 |
| ---- | -- | ------ | ---- |
| `SMOKE_SUMMARY_ENTRIES` | array | `smoke_summary_init` で `=()` | 3 runner の `SUMMARY_ENTRIES` |
| `SMOKE_OVERALL_STATUS` | string | `smoke_summary_init` で `="PASS"` | 3 runner の `OVERALL_STATUS` |
| `SMOKE_REDACT` | string(path) | runner が source 前に設定（`"$SCRIPT_DIR/redact.sh"`） | 3 runner の `REDACT` |

### TypeScript の型定義

この実装は bash lib であり TypeScript runtime surface は追加しない。ただし validator と読者向けに、summary artifact の形を TypeScript 型として表すと以下になる。

```ts
type SmokeSummaryArrayKey = "routes" | "checks";

interface SmokeSummaryEntry {
  label: string;
  status: "PASS" | "FAIL";
  http?: string;
  contract?: string;
  reason?: string;
  summary?: string;
}

interface SmokeSummary {
  status: "PASS" | "FAIL";
  routes?: SmokeSummaryEntry[];
  checks?: SmokeSummaryEntry[];
}
```

### CLIシグネチャ

```bash
bash scripts/smoke/__tests__/smoke-common.test.sh
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh
bash scripts/smoke/__tests__/runtime-admin-web.test.sh
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh
shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-attendance-provider.sh scripts/smoke/runtime-admin-web.sh scripts/smoke/runtime-tag-bulk.sh
```

### lib 9 関数のシグネチャ（実装の正本・Phase 2 と完全一致）

```bash
# --- redact 経由ログ ---
smoke_redact_filter() {            # $1: out_log。stdin を redact して out_log へ追記（パイプ用）
  bash "$SMOKE_REDACT" >> "$1"
}                                  #   usage: <command> | smoke_redact_filter "$OUT_LOG"

smoke_redact_line() {              # $1: out_log, $2..: text。文字列引数を redact して 1 行追記
  local out_log="$1"; shift       #   由来: tag-bulk log_redacted
  printf '%s\n' "$*" | bash "$SMOKE_REDACT" >> "$out_log"
}

# --- summary 状態 ---
smoke_summary_init() {             # 引数なし。summary 状態を初期化
  SMOKE_SUMMARY_ENTRIES=()
  SMOKE_OVERALL_STATUS="PASS"
}

smoke_summary_pass() {             # $1: label。PASS エントリ追加（label のみ形・tag-bulk summary_pass 相当）
  local label="$1"
  SMOKE_SUMMARY_ENTRIES+=("$(jq -cn --arg label "$label" '{label:$label,status:"PASS"}')")
}

smoke_summary_fail_entry() {       # $1: label, $2: http, $3: contract(可空), $4: reason(可空)
  local label="$1" http="$2" contract="${3:-}" reason="${4:-}"   # FAIL entry 追加 + overall=FAIL（exit しない）
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

smoke_write_summary() {            # $1: ci_flag(0/1), $2: summary_json_path, $3: array_key("routes"|"checks")
  local ci_flag="$1" json_path="$2" array_key="$3"              # array_key 引数化で両 shape を非退化再現（AC-9）
  if [[ "$ci_flag" -ne 1 || -z "${json_path:-}" ]]; then return 0; fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SMOKE_SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","%s":[%s]}\n' "$SMOKE_OVERALL_STATUS" "$array_key" "$entries_csv" > "$json_path"
}

# --- host allowlist 照合（純粋部品。exit/message は runner 判断） ---
smoke_assert_host_allow() {        # $1: base, $2: allow_regex。一致 0 / 不一致 1 を return（exit しない）
  printf '%s\n' "$1" | grep -Eiq "$2"
}

# --- env prefix 解決 ---
smoke_env_prefix() {               # $1: environment -> stdout: 大文字 prefix（indirect 変数解決用）
  printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

# --- D1 ラッパー（tag-bulk run_d1 相当。将来の D1 runner 用 SSOT） ---
smoke_run_d1() {                   # $1: cf_sh, $2: db, $3: env, $4..: d1 execute 引数
  local cf_sh="$1" db="$2" env="$3"; shift 3
  bash "$cf_sh" d1 execute "$db" --env "$env" --remote "$@"
}
```

### 使用例

```bash
SMOKE_REDACT="$SCRIPT_DIR/redact.sh"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"

smoke_summary_init
smoke_summary_pass "seed"
smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"
```

### 3 runner 共通の冒頭追加

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMOKE_REDACT="$SCRIPT_DIR/redact.sh"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"
```

### runner 別 write_summary 薄ラッパー（array_key 分岐の正本）

| runner | 薄ラッパー | array_key |
| ------ | ---------- | --------- |
| attendance | `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "routes"; }` | `routes`（AC-9） |
| admin-web | `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` | `checks` |
| tag-bulk | `write_summary() { smoke_write_summary "$CI_SUMMARY" "$SUMMARY_JSON" "checks"; }` | `checks` |

### runner に残す固有要素（lib へ移さない = MECE 境界）

| 残す要素 | runner | 理由 |
| -------- | ------ | ---- |
| `assert_target` / `assert_staging_guard` | 全 runner | 実装 3 通り（marker curl / allowlist のみ / D1 名+production 拒否）。共通化は柔軟性喪失 |
| `request_json` / `request_admin` / `post_bulk` | 各 runner | contract jq shape / endpoint URL / HTTP method が固有 |
| `assert_all_status` / `extract_count` / `count_by_table` / `audit_count` | tag-bulk | test が `source "$RUNNER"` で直接呼ぶため移動不可（AC-10） |
| `classify_unauthorized_bearer` / `assert_bearer_subject_allowed` | attendance | bearer JWT 検証が固有 |
| `start_tail` / `collect_tail` / render-error 検出 | admin-web | Workers tail / Server Components render error 検出が固有 |
| `trap ... EXIT` の**登録** | 各 runner | trap shape 3 通り。lib は trap を登録しない（AC-4） |
| `fail_and_exit` / `write_summary` の本体 | 各 runner | array_key / collect_tail 副作用 / exit code が固有。lib 関数を呼ぶ薄ラッパーとして残す |

### 設定項目と定数一覧

| 名前 | 値 / 既定 | 用途 |
| ---- | --------- | ---- |
| `SMOKE_REDACT` | `"$SCRIPT_DIR/redact.sh"` | redact SSOT のパス（runner が source 後に設定） |
| array_key | `routes`（attendance）/ `checks`（admin-web・tag-bulk） | summary.json の配列キー（AC-9 分岐の正本） |
| lib 公開関数 prefix | `smoke_` | 既存 runner 関数との衝突回避 |
| lib 公開変数 prefix | `SMOKE_` | グローバル名前空間隔離（AC-7） |
| 内部変数 | `local` 化 | source 副作用回避（AC-7） |

### エラーハンドリング

- `smoke_assert_host_allow`: 一致しなければ非ゼロ return（**exit / message は runner 判断**。lib は exit しない）。
- `smoke_summary_fail_entry`: entry 追加 + `SMOKE_OVERALL_STATUS=FAIL` のみ（**exit しない**）。「entry → write_summary → echo → exit」の組み立ては各 runner の `fail_and_exit` に残す（admin-web は途中で `collect_tail` 副作用 / exit code が固有のため）。
- `smoke_write_summary`: `ci_flag != 1` または `json_path` 空のとき no-op で `return 0`（非退化）。

### エッジケース

- attendance の reason 任意 entry / summary キー entry は **lib `smoke_summary_fail_entry` を使わず runner に残す**（shape 差を壊さない・AC-5/AC-9）。
- lib は `set -euo pipefail` を**設定しない** / `trap` を**登録しない**（source 副作用で runner のフラグ・trap を上書きしない・AC-4/AC-7）。
- AC-10 二段 source: test → `source "$RUNNER"` → runner 冒頭で `source lib` の二段解決で `assert_all_status`/`extract_count` が利用可能。`source "$RUNNER"` 時に `main` は `if [[ "${BASH_SOURCE[0]}" == "$0" ]]` ガードで実行されない（既存通り）。

### テスト構成

| テスト | 役割 |
| ------ | ---- |
| `smoke-common.test.sh` | 共通 lib の summary / redact / allowlist / env prefix / D1 wrapper を単体検証 |
| `runtime-attendance-provider.test.sh` | `.routes[]` summary shape と auth error 分類の非退化検証 |
| `runtime-admin-web.test.sh` | `.checks[]` summary shape、allowlist、render error 検出の非退化検証 |
| `runtime-tag-bulk.test.sh` | 二段 source、bulk tag 固有 assert、summary shape の非退化検証 |
| `shellcheck` | source 解決、未定義変数、未使用変数、shell 静的品質の検証 |

### 視覚証跡

NON_VISUAL（bash runner 内部リファクタリング・UI/UX 変更なし）のため **Phase 11 スクリーンショットは不要・生成禁止**。代替証跡として以下を参照する:

- local test（実装時取得・本サイクルで present）:
  - `bash scripts/smoke/__tests__/smoke-common.test.sh`（lib 単体 9 関数）
  - `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh`（非退化・`.routes[]` assert）
  - `bash scripts/smoke/__tests__/runtime-admin-web.test.sh`（非退化・`.checks[]` assert）
  - `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（非退化・二段 source assert）
- shellcheck（実装時取得・本サイクルで present）:
  - `shellcheck scripts/smoke/lib/smoke-common.sh scripts/smoke/runtime-attendance-provider.sh scripts/smoke/runtime-admin-web.sh scripts/smoke/runtime-tag-bulk.sh`

> 代替証跡（local test 全 PASS + shellcheck clean）は本サイクルで `outputs/phase-11/evidence/` へ tracked file として追加済み（present）。
