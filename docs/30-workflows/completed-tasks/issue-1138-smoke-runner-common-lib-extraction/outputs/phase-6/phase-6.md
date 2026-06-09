# Phase 6: テスト拡充

[実装区分: 実装仕様書] / NON_VISUAL

## 6.1 目的

Phase 4 の単体ケース（TC-01〜TC-21）に対し、リファクタ特有の**回帰 guard / fail path / 構造不変条件**を追加する。本タスクは「挙動を変えない共通化」なので、拡充の主眼は「共通化が静かに挙動を壊していないこと」を機械検出することにある。追加ケースは `smoke-common.test.sh` 末尾に積み増し、既存 3 runner test は**回帰 guard として全 PASS を要求するのみ**（本体非変更）。

## 6.2 追加テストケース（`smoke-common.test.sh` への積み増し）

| ID | 種別 | 対象 / セットアップ | 期待 | 対応 AC |
| -- | ---- | ------------------- | ---- | ------- |
| TC-22 | cleanup 二重実行 guard | tag-bulk runner を stub 環境で 1 回実行し、cleanup 内に差し込んだマーカーログの出現回数を数える | マーカーが **1 回のみ**（trap EXIT による cleanup 多重発火がない・AC-4） |
| TC-23 | 二段 source 解決 | `smoke-common.test.sh` 内で `source "$RUNNER_TAGBULK"`（main ガードで非実行）→ `type smoke_write_summary` / `type assert_all_status` | 両者とも `function` として解決される（test→runner→lib の二段 source・AC-10） |
| TC-24 | lib に `set` 不在 | `grep -nE '^[[:space:]]*set[[:space:]]+-' scripts/smoke/lib/smoke-common.sh` | マッチ 0 件（lib はフラグを設定しない・AC-4/不変条件2） |
| TC-25 | lib に `trap` 不在 | `grep -nE '^[[:space:]]*trap[[:space:]]' scripts/smoke/lib/smoke-common.sh` | マッチ 0 件（lib は trap を登録しない・AC-4） |
| TC-26 | redact 二重実装なし | `grep -nE 's/.*Bearer\|s/.*[Aa]uthorization\|sed -E' scripts/smoke/lib/smoke-common.sh` | マッチ 0 件（redact ロジックは redact.sh のみ・lib は `bash "$SMOKE_REDACT"` 経由・AC-8） |
| TC-27 | 公開変数 prefix 隔離 | lib を source 後に `set` 出力から `^SUMMARY_ENTRIES=` / `^OVERALL_STATUS=`（prefix なし）が現れないこと | prefix なしのグローバルを作らない（`SMOKE_` 隔離・AC-7） |
| TC-28 | array_key 取り違え検出（routes≠checks） | `smoke_summary_init; smoke_summary_pass p; smoke_write_summary 1 "$f" routes` 後に `jq -e 'has("checks")'` | `has("checks")` が false（routes 指定で checks キーが混入しない・AC-9 の対称検証） |
| TC-29 | run_d1 引数順序の回帰 | TC-19 の stub を再利用し、`--env` が db の**後**・`--remote` が `--env <env>` の**後**に来る順序を文字列完全一致で確認 | `d1 execute <db> --env <env> --remote <args>` の語順が固定（cf.sh 契約の回帰防止） |

### TC-22（cleanup 二重実行 guard）の実装方針

tag-bulk runner の `cleanup` は既に `CLEANUP_RAN` ガード（L252-255）を持つが、trap（`cleanup || true; ...`）と `main` 末尾の明示 `cleanup`（L303）の二経路があるため、**実 cleanup 本体が 1 回しか走らないこと**を検証する。

```bash
# cleanup 内が実行されるたびに 1 行追記するマーカーを CLEANUP_SQL stub 側に仕込み、
# tag-bulk を stub 環境（Phase 4 / 既存 tag-bulk test と同じ curl/cf.sh stub）で 1 回走らせ、
# マーカー行数が 1 であることを assert する。
marker_count="$(grep -c 'CLEANUP_MARKER' "$TEST_DIR/cleanup-marker.log" || true)"
assert_eq "1" "$marker_count" "cleanup-once"
```

> cf.sh stub の `--file ... cleanup` 分岐で `printf 'CLEANUP_MARKER\n' >> "$CLEANUP_MARKER_LOG"` を出すよう拡張する。runner が `--skip-cleanup` でない実行で cleanup 本体（`run_d1 --file "$CLEANUP_SQL"`）を 1 度だけ呼ぶことを保証する。

### TC-23（二段 source）の実装方針

```bash
set +u
source "$SCRIPT_DIR/../runtime-tag-bulk.sh"   # main は BASH_SOURCE ガードで非実行
set -u
[[ "$(type -t smoke_write_summary)" == "function" ]] && echo "PASS [TC-23a]" || { echo "FAIL [TC-23a]"; fail=$((fail+1)); }
[[ "$(type -t assert_all_status)"   == "function" ]] && echo "PASS [TC-23b]" || { echo "FAIL [TC-23b]"; fail=$((fail+1)); }
```

> これは「runner を source すると lib 関数（`smoke_*`）と runner 固有関数（`assert_all_status`）の両方が同一プロセスに乗る」＝既存 tag-bulk test の `source "$RUNNER"` → `assert_all_status` 呼び出しが移行後も成立する、という AC-10 を **明示の専用ケースで固定**する。
>
> **注意**: TC-23 は別 test ファイルの runner を source するため、`smoke-common.test.sh` 内の他ケースで使う `SMOKE_*` 変数を汚染しうる。TC-23 はファイル末尾（lib 単体ケース完了後）に配置し、必要なら subshell `( ... )` で隔離する。

## 6.3 静的 grep gate の集約

TC-24〜TC-27 は CI / 手動で再現しやすいよう、独立した検証スニペットとしても記載する。

```bash
# lib は set / trap を持たない
! grep -nE '^[[:space:]]*set[[:space:]]+-'  scripts/smoke/lib/smoke-common.sh
! grep -nE '^[[:space:]]*trap[[:space:]]'    scripts/smoke/lib/smoke-common.sh
# redact の sed パターンが lib に二重実装されていない（redact.sh のみが正本）
! grep -nE 'sed -E|Bearer \[REDACTED\]'      scripts/smoke/lib/smoke-common.sh
# redact.sh は依然 source of truth（呼び出し参照が lib に存在する）
grep -q 'bash "\$SMOKE_REDACT"'              scripts/smoke/lib/smoke-common.sh
```

> 各行が期待通り（`!` 付きは「マッチ無しで成功」／末尾の `grep -q` は「マッチ有りで成功」）であることを確認する。これらは Phase 9（品質保証）の shellcheck と合わせ、lib の構造不変条件を機械担保する。

## 6.4 既存 3 runner test の回帰 guard（非退化の最終確認）

| test | 全ケース PASS が示す非退化 | コマンド |
| ---- | -------------------------- | -------- |
| `runtime-attendance-provider.test.sh`（T-4-1〜T-4-11） | `.routes[*]` shape / reason 分類 / exit code / redaction / production allowlist が不変（AC-9 含む） | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |
| `runtime-admin-web.test.sh`（arg-required / unsupported-env / 各 run_case / worker-name-default-template） | `.checks[]` shape / render-error 検出 / allowlist deny / redaction が不変 | `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` |
| `runtime-tag-bulk.test.sh`（env guard 群 / redaction / assert-* / extract-count / runner-stub-pass / summary-pass） | `source "$RUNNER"` 二段解決 / D1 集計 / summary shape が不変（AC-10 含む） | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |

- これら 3 本は本タスクで**変更しない**。移行後に 1 ケースでも FAIL したら、それは「共通化が挙動を壊した」証拠であり、Phase 5 の移行差分を是正するまで完了とみなさない（正本順位 #1）。

## 6.5 拡充後の一括実行と期待

```bash
for t in scripts/smoke/__tests__/*.test.sh; do
  echo "== $t =="
  bash "$t" || { echo "REGRESSION in $t"; exit 1; }
done
echo "ALL smoke tests pass (lib + 3 runner non-regression)"
```

| 期待 | 値 |
| ---- | -- |
| `smoke-common.test.sh` | `OK: smoke-common tests pass`（TC-01〜TC-29 全 PASS） |
| 3 runner test | 各 `OK: ...` / `PASS`（非退化） |
| 一括 exit code | 0 |

## 6.6 完了条件（Phase 6）

- [x] cleanup trap が一度だけ実行される検証（TC-22 / AC-4）を定義した。
- [x] 二段 source 検証（TC-23 / AC-10・`source "$RUNNER"` 後に lib 関数 + runner 固有関数が解決）を定義した。
- [x] lib が `set` / `trap` を持たないことの静的 grep gate（TC-24 / TC-25）を定義した。
- [x] redact 二重実装が無いことの grep gate（TC-26 / AC-8）を定義した。
- [x] 公開変数 `SMOKE_` prefix 隔離（TC-27）・array_key 対称検証（TC-28）・run_d1 語順回帰（TC-29）を定義した。
- [x] 既存 3 runner test の全ケース非退化 PASS を回帰 guard として明記した（本体非変更・AC-3）。
- [x] 拡充後の一括実行コマンドと期待結果を確定した。
