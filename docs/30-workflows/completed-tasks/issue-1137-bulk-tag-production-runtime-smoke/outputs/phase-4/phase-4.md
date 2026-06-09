# Phase 4: テスト作成 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

production guard（`assert_production_guard`）/ dual approval marker / production allowlist regex / staging guard 非退化（AC-6）を **real D1 接続なし**で検証する local test を TDD 観点で設計する。
追加先は既存 `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（編集）。実 D1 / production endpoint には一切接続せず、fake `cf.sh` stub と fake `curl` stub（既存 staging happy-path テスト方式）で閉じる。

> TDD 順序: 本 Phase で **Red（失敗するテストケース定義）→ Phase 5 実装で Green**。本サイクルは `implemented_local_runtime_pending`（テストコード実装・実行済み）。本書はケース表・helper 擬似コード・命名整合を確定する。

## 設計前提（実コード確認済み）

| 確認項目 | 実コードでの位置 | 本 Phase での扱い |
| -------- | ---------------- | ----------------- |
| `parse_args` が staging 以外を `exit 2` | `runtime-tag-bulk.sh:71-74` | production 受理へ拡張（Phase 5）。本 Phase は拡張後の期待 exit を定義 |
| `assert_staging_guard` 本体 | `runtime-tag-bulk.sh:122-136` | 逐語不変（AC-6）。既存ケースが PASS 継続することを回帰として固定 |
| 既存 helper `run_expect_exit` / `assert_eq` | `runtime-tag-bulk.test.sh:10-31` | 追加ケースも同 helper を踏襲（新 helper を増やさない） |
| 既存 fake `cf.sh` / fake `curl` stub | `runtime-tag-bulk.test.sh:76-120` | production happy-path 用に prefix・marker を切り替えた stub を追加 |
| 関数単体テスト（`source "$RUNNER"`） | `runtime-tag-bulk.test.sh:51-53` | `assert_all_status` / `extract_count` を sourcing 経由で直接呼ぶ既存方式を踏襲 |

## private 関数テスト方針（shell）

- shell には言語レベルの「private」概念がないため、**関数単体テストは `source "$RUNNER"` でランナーを sourcing し、関数を直接呼ぶ**（既存 `assert_all_status` / `extract_count` テストと同方式）。
- ただし `assert_production_guard` / `assert_staging_guard` は `exit 2` を含むため、sourcing 後に直接呼ぶと **テストプロセス自体が落ちる**。よって guard 系は **サブシェル + 別プロセス起動（`bash "$RUNNER" production ...`）で exit code を観測**する（`run_expect_exit` 形式）。これにより guard の `exit 2` がテストランナーを巻き込まない。
- happy-path（seed→assign→retry noop→unassign→audit→cleanup）は **fake `cf.sh` / fake `curl` を `PATH` / `CF_SH_PATH` で差し込んだ別プロセス起動**で `summary.json` の `status==PASS` を観測する（real D1 接続なし）。

## 追加テストケース表（`runtime-tag-bulk.test.sh` に追加）

すべて `run_expect_exit "<label>" <expected_exit> <command...>` 形式。`PROD_OK1=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` を正 marker、`PROD_OK2=<任意非空>` を第 2 marker、`PROD_URL=https://api.ubm-hyogo.workers.dev` を正 production URL とする。

| # | ケース名 | 投入 env | 引数 | 期待 exit | 検証 AC |
| - | -------- | -------- | ---- | --------- | ------- |
| P1 | `production-no-approval-refused` | `PRODUCTION_API_BASE=$PROD_URL` `PRODUCTION_ADMIN_BEARER=stub` `CF_D1_DATABASE=ubm-hyogo-db-prod` `CLOUDFLARE_ENV=production`（marker 両方なし） | `production` | `2` | AC-3 |
| P2 | `production-single-approval-refused` | P1 + `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke`（APPROVAL_2 欠落） | `production` | `2` | AC-3 |
| P3 | `production-wrong-approval-marker-refused` | P1 + `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=nope` + `BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1`（marker 値不正） | `production` | `2` | AC-3 |
| P4 | `production-wrong-host-refused` | 正 marker 両方 + `PRODUCTION_API_BASE=https://example.test` + `CF_D1_DATABASE=ubm-hyogo-db-prod` | `production` | `2` | AC-1 |
| P5 | `production-staging-host-refused` | 正 marker 両方 + `PRODUCTION_API_BASE=https://staging.ubm-hyogo.workers.dev` + `CF_D1_DATABASE=ubm-hyogo-db-prod` | `production` | `2` | AC-1 |
| P6 | `production-wrong-d1-refused` | 正 marker 両方 + `PRODUCTION_API_BASE=$PROD_URL` + `CF_D1_DATABASE=ubm-hyogo-db-staging` | `production` | `2` | I-4 / AC-3 |
| P7 | `production-missing-api-base` | 正 marker 両方 + `CF_D1_DATABASE=ubm-hyogo-db-prod`（`PRODUCTION_API_BASE` 未設定） | `production` | `2` | AC-3 / I-4 |
| P8 | `production-missing-bearer` | 正 marker 両方 + `PRODUCTION_API_BASE=$PROD_URL` + `CF_D1_DATABASE=ubm-hyogo-db-prod`（`PRODUCTION_ADMIN_BEARER` 未設定） | `production` | `2` | AC-3 |
| P9 | `production-happy-path` | 正 marker 両方 + `PRODUCTION_API_BASE=$PROD_URL` + `PRODUCTION_ADMIN_BEARER=stub-admin` + `CF_D1_DATABASE=ubm-hyogo-db-prod` + `CLOUDFLARE_ENV=production` + fake `curl`（`PATH`）+ fake `cf.sh`（`CF_SH_PATH`） | `production --out-dir <tmp> --ci-summary --skip-seed` | `0` + `summary.json` の `status==PASS` | AC-1〜AC-5（contract 集計・冪等・cleanup 残件 0） |

### staging 非退化（既存ケース・回帰固定）

| # | 既存ケース名 | 期待 exit | 検証 AC | 状態 |
| - | ------------ | --------- | ------- | ---- |
| S1 | `env-required` | `2` | — | 既存（不変） |
| S2 | `production-env-refused` | **`2` → 拡張後は guard で `2`** | AC-3 / AC-6 | **要更新**: 現在は「production env 自体を refuse」で exit 2。拡張後は production env 受理になるため、同 env では `assert_production_guard` の marker 欠落で `exit 2` に到達する。期待 exit は `2` のまま不変だが、**理由が「env refuse」→「guard refuse」へ変わる**ことを Phase 5 で確認する（このケースは label を `production-no-marker-env-refused` に意味付け直す or P1 に統合）。 |
| S3 | `unknown-env-refused`（`dev`） | `2` | AC-6 | 既存（不変）。`dev` は case `*)` で `exit 2` |
| S4 | `missing-api-base`（staging） | `2` | AC-6 | 既存（不変） |
| S5 | `production-url-refused`（staging env + production URL） | `2` | AC-6 | 既存（不変）。staging guard が production URL を refuse |
| S6 | `d1-database-refused`（staging env + `ubm-hyogo-db-production`） | `2` | AC-6 | 既存（不変）。staging guard が D1 名不一致を refuse |
| S7 | `assert-assigned` / `assert-noop` / `assert-unassigned` / `assert-mixed-fails` / `assert-batch-required` / `assert-empty-fails` | — | AC-8 | 既存（不変）。`assert_all_status` 単体 |
| S8 | `extract-count` | — | — | 既存（不変） |
| S9 | `runner-stub-pass` / `summary-pass`（staging happy-path） | `0` / `PASS` | AC-6 | 既存（不変）。staging fake stub happy-path |
| S10 | `redaction` | — | I-2 / AC-7 | 既存（不変）。`redact.sh` 単体 |

> **重要（S2 の扱い）**: 既存 `production-env-refused`（test.sh:34）は「staging env 用の `STAGING_API_BASE` を渡して production env を投げると exit 2」を期待する。拡張後 production env が受理されると、`parse_args(production)` は `PRODUCTION_API_BASE` 必須になり、`STAGING_API_BASE` のみでは `PRODUCTION_API_BASE is required` で `exit 2`。**期待 exit code は `2` のまま不変**。Phase 5 ではこのケースが exit 2 を保つことを確認し、必要なら P1（marker 欠落 refuse）に役割を吸収する。staging guard 自体（S5/S6）は逐語不変で PASS 継続させる（AC-6 の本丸）。

## helper 擬似コード（既存 `run_expect_exit` 踏襲）

### guard 系（P1〜P8）

```bash
PROD_URL="https://api.ubm-hyogo.workers.dev"
PROD_OK1="I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1"

# P1: marker 両方なし → exit 2
run_expect_exit "production-no-approval-refused" 2 \
  env PRODUCTION_API_BASE="$PROD_URL" PRODUCTION_ADMIN_BEARER=stub \
      CF_D1_DATABASE=ubm-hyogo-db-prod CLOUDFLARE_ENV=production \
  bash "$RUNNER" production

# P2: APPROVAL_1 のみ → exit 2
run_expect_exit "production-single-approval-refused" 2 \
  env PRODUCTION_API_BASE="$PROD_URL" PRODUCTION_ADMIN_BEARER=stub \
      CF_D1_DATABASE=ubm-hyogo-db-prod CLOUDFLARE_ENV=production \
       BULK_TAG_PRODUCTION_SMOKE_APPROVAL="$PROD_OK1" \
  bash "$RUNNER" production

# P4: 正 marker + 非 production URL → exit 2 (AC-1)
run_expect_exit "production-wrong-host-refused" 2 \
  env PRODUCTION_API_BASE="https://example.test" PRODUCTION_ADMIN_BEARER=stub \
      CF_D1_DATABASE=ubm-hyogo-db-prod CLOUDFLARE_ENV=production \
       BULK_TAG_PRODUCTION_SMOKE_APPROVAL="$PROD_OK1" BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1 \
  bash "$RUNNER" production

# P6: 正 marker + 誤 D1 名 → exit 2 (I-4)
run_expect_exit "production-wrong-d1-refused" 2 \
  env PRODUCTION_API_BASE="$PROD_URL" PRODUCTION_ADMIN_BEARER=stub \
      CF_D1_DATABASE=ubm-hyogo-db-staging CLOUDFLARE_ENV=production \
       BULK_TAG_PRODUCTION_SMOKE_APPROVAL="$PROD_OK1" BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1 \
  bash "$RUNNER" production
```

### happy-path（P9・fake stub・既存 staging happy-path の production 版）

既存 staging happy-path（test.sh:72-137）の prefix・stub state file 名を production 用に分離して複製する。fake `curl` は op 別に assigned→（2 回目以降）noop→unassigned を返し `200` を出力。fake `cf.sh` は `--file`（seed/cleanup）に `{"success":true}`、`tag_assigned` count に 4、`tag_unassigned` を 0→4（增分）、その他（cleanup 残件 count）に 0 を返す。

```bash
PROD_TEST_DIR="$(mktemp -d)"
PROD_FAKE_BIN="$PROD_TEST_DIR/bin"; mkdir -p "$PROD_FAKE_BIN"

cat > "$PROD_FAKE_BIN/curl" <<'SH'
#!/usr/bin/env bash
out=""; data=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -w) shift 2 ;;
    --data) data="$2"; shift 2 ;;
    *) shift ;;
  esac
done
op="$(printf '%s' "$data" | jq -r '.op')"
if [[ "$op" == "assign" && ! -f "${TMPDIR:-/tmp}/prod_retry_seen" ]]; then
  touch "${TMPDIR:-/tmp}/prod_retry_seen"
  printf '{"batchId":"pb1","results":[{"memberId":"m1","tagId":"t1","status":"assigned"},{"memberId":"m1","tagId":"t2","status":"assigned"},{"memberId":"m2","tagId":"t1","status":"assigned"},{"memberId":"m2","tagId":"t2","status":"assigned"}]}' > "$out"
elif [[ "$op" == "assign" ]]; then
  printf '{"batchId":"pb2","results":[{"memberId":"m1","tagId":"t1","status":"noop"},{"memberId":"m1","tagId":"t2","status":"noop"},{"memberId":"m2","tagId":"t1","status":"noop"},{"memberId":"m2","tagId":"t2","status":"noop"}]}' > "$out"
else
  printf '{"batchId":"pb3","results":[{"memberId":"m1","tagId":"t1","status":"unassigned"},{"memberId":"m1","tagId":"t2","status":"unassigned"},{"memberId":"m2","tagId":"t1","status":"unassigned"},{"memberId":"m2","tagId":"t2","status":"unassigned"}]}' > "$out"
fi
printf '200'
SH
chmod +x "$PROD_FAKE_BIN/curl"

cat > "$PROD_TEST_DIR/cf.sh" <<'SH'
#!/usr/bin/env bash
args="$*"
if [[ "$args" == *"--file"* ]]; then
  printf '{"success":true}\n'
elif [[ "$args" == *"admin.member.tag_assigned"* ]]; then
  printf '{"result":[{"results":[{"c":4}]}]}\n'
elif [[ "$args" == *"admin.member.tag_unassigned"* ]]; then
  state="${TMPDIR:-/tmp}/prod_unassigned_seen"
  if [[ -f "$state" ]]; then printf '{"result":[{"results":[{"c":4}]}]}\n';
  else touch "$state"; printf '{"result":[{"results":[{"c":0}]}]}\n'; fi
else
  printf '{"result":[{"results":[{"c":0}]}]}\n'   # cleanup 残件 0
fi
SH
chmod +x "$PROD_TEST_DIR/cf.sh"

set +e
PATH="$PROD_FAKE_BIN:$PATH" \
TMPDIR="$PROD_TEST_DIR" \
PRODUCTION_API_BASE=https://api.ubm-hyogo.workers.dev \
PRODUCTION_ADMIN_BEARER=stub-admin \
CF_D1_DATABASE=ubm-hyogo-db-prod \
CLOUDFLARE_ENV=production \
BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke \
BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1 \
CF_SH_PATH="$PROD_TEST_DIR/cf.sh" \
  bash "$RUNNER" production --out-dir "$PROD_TEST_DIR/evidence" --ci-summary --skip-seed >/dev/null 2>&1
prod_code=$?
set -e
assert_eq "0" "$prod_code" "production-happy-path"
if [[ -f "$PROD_TEST_DIR/evidence/summary.json" ]] && jq -e '.status == "PASS"' "$PROD_TEST_DIR/evidence/summary.json" >/dev/null; then
  echo "PASS [production-summary-pass]"
else
  echo "FAIL [production-summary-pass]"; fail=$((fail + 1))
fi
```

> P9 は `--skip-seed` で fake seed を省く（既存 staging happy-path と同方針。`--skip-cleanup` は付けず cleanup 残件 0 assert を通す）。production allowlist と dual marker を満たした正常系であるため `assert_production_guard` を通過し orchestration が回る。

## TDD Red 前の命名規則整合確認（Phase 1 命名規則表との一致）

| 対象 | Phase 1 規則 | 本 Phase での使用 | 一致 |
| ---- | ------------ | ----------------- | ---- |
| guard 関数 | `assert_production_guard`（snake_case） | テストは別プロセス起動経由で exit 観測（関数名に直接依存しない） | ✅ |
| 承認 marker env | `BULK_TAG_PRODUCTION_SMOKE_APPROVAL` / `BULK_TAG_PRODUCTION_SMOKE_CONFIRM`（UPPER_SNAKE） | P1〜P9 で逐語使用 | ✅ |
| production prefix | `e2e_test_prod_tagbulk_`（fixture 側） | happy-path は fake stub のため prefix を直接使わないが、SQL ファイルパス引数は production seed/cleanup を指す | ✅ |
| shell test | `runtime-tag-bulk.test.sh`（`*.test.sh`・既存編集） | 追加ケースを同ファイルへ | ✅ |
| D1 名 | `ubm-hyogo-db-prod` | P6 で誤値 `ubm-hyogo-db-staging`、正系で `ubm-hyogo-db-prod` | ✅ |
| allowlist 正値 | `https://api.ubm-hyogo.workers.dev`（`ubm-hyogo-api\.` も可） | `$PROD_URL` で使用 | ✅ |

## 完了判定チェックリスト

- [x] production guard 用 refuse ケース（P1〜P8）を投入 env / 引数 / 期待 exit / 対応 AC で表化
- [x] production happy-path（P9）を fake `cf.sh` / fake `curl` stub で real D1 非接続に設計（summary.json PASS 観測）
- [x] staging 非退化ケース（S1〜S10）を回帰固定し、S2 の意味変化（env refuse → guard refuse、exit 2 不変）を明記
- [x] guard 系は別プロセス exit 観測、関数単体は sourcing という private 関数テスト方針を確定
- [x] `run_expect_exit` / `assert_eq` 既存 helper 踏襲の擬似コードを提示
- [x] Phase 1 命名規則表との整合（marker env / D1 名 / allowlist / prefix）を確認
