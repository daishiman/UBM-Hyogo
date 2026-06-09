# Phase 6: テスト拡充 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

Phase 4 の happy-path / refuse ケースに加え、**fail path（異常系で正しく FAIL する）/ 回帰 guard / 補助コマンド（redaction）** を拡充し、production smoke が「壊れたとき確実に FAIL し、本番を汚染しない」ことを構造的に固定する。
すべて **real D1 / production endpoint 非接続**（fake `cf.sh` / fake `curl` stub）で閉じる。追加先は `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`。

## 拡充方針

| 軸 | 狙い | 既存資産 |
| -- | ---- | -------- |
| fail path | cleanup 残件非 0 / audit count drift で `fail_and_exit` に確実に到達（false-PASS 防止） | `fail_and_exit`（runner:51-61）・`cleanup`（251-267）・audit idempotency（289-291） |
| 回帰 guard | staging guard / staging happy-path の非退化（AC-6） | 既存 S1〜S10（Phase 4） |
| 補助コマンド | log に bearer 実値が出ないことの grep gate（AC-7 / I-2） | `redact.sh`・既存 redaction 単体テスト |
| allowlist 境界 | staging URL を production env で渡すと refuse（AC-1） | `assert_production_guard` allowlist regex |

## fail path テストケース表（追加）

すべて fake stub を「異常応答」に差し替えた別プロセス起動で、runner が **exit 1（FAIL）** かつ `summary.json` の `status==FAIL` になることを観測する。

| # | ケース名 | 異常注入（fake stub） | 期待 | 検証 AC |
| - | -------- | --------------------- | ---- | ------- |
| F1 | `production-cleanup-residual-fails` | fake `cf.sh` の cleanup 残件 count を **非 0**（例: `member_tags` count に 1 を返す）にする | runner exit 1 / `summary.json.status==FAIL` / `cleanup-member_tags` FAIL entry に `cleanup-residual-1` | AC-4 |
| F2 | `production-audit-idempotency-drift-fails` | fake `cf.sh` の `tag_assigned` count を retry 後に **増加**（before=4 → after=5）させる | runner exit 1 / `audit-idempotency` FAIL（`audit-count-drift`） | AC-5 |
| F3 | `production-audit-parity-missing-fails` | fake `cf.sh` の `tag_unassigned` count が unassign 後も **不変**（0→0）にする | runner exit 1 / `audit-parity` FAIL（`audit-parity-missing`） | AC-5 |
| F4 | `production-non-200-fails` | fake `curl` が assign で `500` を返す | runner exit 1 / `assign` FAIL（`non-200`） | contract（200 必須） |
| F5 | `production-status-mismatch-fails` | fake `curl` が assign で `results[].status` を `tag_not_found` 混在で返す | runner exit 1 / `assign` FAIL（`status-mismatch`） | AC-8 / contract |

### F1 の擬似コード（cleanup 残件非 0）

```bash
cat > "$F1_DIR/cf.sh" <<'SH'
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
elif [[ "$args" == *"FROM member_tags"* ]]; then
  printf '{"result":[{"results":[{"c":1}]}]}\n'   # ← 残件 1（異常）
else
  printf '{"result":[{"results":[{"c":0}]}]}\n'
fi
SH
chmod +x "$F1_DIR/cf.sh"

set +e
PATH="$F1_FAKE_BIN:$PATH" TMPDIR="$F1_DIR" \
PRODUCTION_API_BASE=https://api.ubm-hyogo.workers.dev PRODUCTION_ADMIN_BEARER=stub-admin \
CF_D1_DATABASE=ubm-hyogo-db-prod CLOUDFLARE_ENV=production \
BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1 \
CF_SH_PATH="$F1_DIR/cf.sh" \
  bash "$RUNNER" production --out-dir "$F1_DIR/evidence" --ci-summary --skip-seed >/dev/null 2>&1
f1_code=$?
set -e
assert_eq "1" "$f1_code" "production-cleanup-residual-fails"
if jq -e '.status == "FAIL"' "$F1_DIR/evidence/summary.json" >/dev/null 2>&1; then
  echo "PASS [production-cleanup-residual-summary-fail]"
else
  echo "FAIL [production-cleanup-residual-summary-fail]"; fail=$((fail + 1))
fi
```

> F1 では `cleanup()` が cleanup SQL 適用後に `count_by_table member_tags member_id` を呼び、count=1 を観測して `fail_and_exit "cleanup-member_tags" ...`。これにより「cleanup が静かに残件を残す」回帰を機械検出する。

### F4 の擬似コード（non-200）

```bash
cat > "$F4_FAKE_BIN/curl" <<'SH'
#!/usr/bin/env bash
out=""
while [[ $# -gt 0 ]]; do case "$1" in -o) out="$2"; shift 2 ;; -w) shift 2 ;; --data) shift 2 ;; *) shift ;; esac; done
printf '{"error":"boom"}' > "$out"
printf '500'
SH
chmod +x "$F4_FAKE_BIN/curl"
# ...(env は P9/F1 と同じ正系 marker) → runner exit 1 / assign FAIL non-200 を assert
```

## redaction 漏れ検出 grep gate（補助コマンド・AC-7 / I-2）

happy-path（Phase 4 P9）の `--out-dir` 配下 log に bearer 実値が出ないことを grep で検証する。fake bearer に判別可能な実値（例: `stub-admin-LEAKCANARY`）を渡し、出力 log に canary が現れないことを確認する。

```bash
# P9 を bearer canary 付きで再実行
PRODUCTION_ADMIN_BEARER="Bearer-LEAKCANARY-abcdefghij0123456789"
# ...(他 env は P9 正系) → bash "$RUNNER" production --out-dir "$R_DIR/evidence" --ci-summary --skip-seed

if grep -rq 'LEAKCANARY' "$R_DIR/evidence/"; then
  echo "FAIL [production-bearer-redaction] raw bearer leaked into evidence"
  fail=$((fail + 1))
else
  echo "PASS [production-bearer-redaction]"
fi
```

> runner は `post_bulk` の log 出力を `bash "$REDACT"` 経由で書く（runner:181-186）。bearer は `authorization: Bearer ...` ヘッダにのみ載り log には `request_body` / `response body` が redact 済で残る。本ケースで log への実値混入回帰を検出する。CI 側は `redaction grep gate` step（Phase 5 §4-2）が同等パターンで二重防御。

## production allowlist 境界テスト（AC-1・Phase 4 P4/P5 を境界視点で補強）

| # | ケース名 | `PRODUCTION_API_BASE` | 期待 exit | 意図 |
| - | -------- | --------------------- | --------- | ---- |
| B1 | `production-staging-host-refused` | `https://staging.ubm-hyogo.workers.dev` | 2 | staging 系 host を production env で渡すと allowlist 不一致で refuse |
| B2 | `production-arbitrary-host-refused` | `https://attacker.example.test` | 2 | 任意 host を refuse |
| B3 | `production-host-substring-refused` | `https://example.test/path/api.ubm-hyogo.workers.dev` | 2 | URL 全体の部分一致ではなく host 境界で allowlist を判定することを確認 |

> 正系は既存 happy-path stub の `https://api.ubm-hyogo.workers.dev` で確認する。B3 は path 部分に production host 文字列を含むだけの URL が refuse されることを確認し、allowlist の host 境界を保証する。

## 既存 staging テストの非退化を保証する回帰ケース一覧（AC-6）

| # | 回帰ケース | 期待 | 根拠 |
| - | ---------- | ---- | ---- |
| R1 | `production-url-refused`（staging env + production URL） | exit 2 | staging guard が production URL を refuse（runner:128）。本変更で逐語不変 |
| R2 | `d1-database-refused`（staging env + `ubm-hyogo-db-production`） | exit 2 | staging guard D1 名チェック（runner:124）。逐語不変 |
| R3 | `missing-api-base`（staging・`STAGING_API_BASE` 欠落） | exit 2 | `configure_environment` の staging 経路でも同メッセージ・同 exit |
| R4 | `unknown-env-refused`（`dev`） | exit 2 | `parse_args` case `*)`。production 追加後も `dev` は refuse |
| R5 | staging happy-path（fake stub） | exit 0 / summary PASS | `configure_environment` の staging 値が現状完全一致・orchestration 不変 |
| R6 | `assert_all_status` 単体（assigned/noop/unassigned/mixed/missing_batch/empty） | 既存通り | 関数本体不変 |
| R7 | `extract_count` 単体 | `2` | 関数本体不変 |
| R8 | `redaction`（`redact.sh` 単体） | redact 済 | 関数不変 |

> R1〜R8 は既存テスト（S1〜S10）の維持で担保。Phase 5 の git diff で `assert_staging_guard` 本体・`assert_all_status` / `extract_count` / `redact.sh` に変更行がないことを併せて確認する（AC-6 構造保証）。

## 完了判定チェックリスト

- [x] fail path（F1 cleanup 残件 / F2 audit drift / F3 parity missing / F4 non-200 / F5 status mismatch）を fake stub 注入で exit 1 / summary FAIL を観測する設計に
- [x] redaction 漏れ検出（bearer canary を log に grep）を補助コマンドとして追加
- [x] production allowlist 境界（B1 staging host / B2 任意 host refuse / B3 URL 部分一致 refuse）を分離検証
- [x] staging 非退化 R1〜R8 を回帰ケースとして列挙し `assert_staging_guard` 逐語不変を git diff で保証する方針を明記
- [x] 全ケースが real D1 / production endpoint 非接続（fake `cf.sh` / fake `curl`）で閉じることを確認
