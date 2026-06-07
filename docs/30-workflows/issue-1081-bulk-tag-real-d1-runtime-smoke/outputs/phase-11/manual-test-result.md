# Phase 11 Manual Test Result（runtime evidence 取得 runbook） — issue-1081-bulk-tag-real-d1-runtime-smoke

## 区分

| 項目 | 値 |
| ---- | -- |
| visualEvidence | NON_VISUAL（runtime smoke / CI gate。UI 表示物の変更なし・screenshot 不要） |
| workflow_state | `implemented_local_evidence_captured`（コード実装・local evidence 取得済み。staging 実走は user-gated） |
| 状態語彙 | `implemented_local_evidence_captured / staging_runtime_pending_user_gate` |
| 実行者 | （実装 wave / 実走 wave の実行時に branch 名・日時を追記する。spec 段階では未実行） |

> 本ファイルは **runtime evidence の user-gated 取得 runbook**（Gate-B）である。下記コマンドは **user 明示承認後にのみ実行**する。本仕様書作成サイクルでは実行しない。secret 実値は一切記載しない（`<redacted>` / `op://...` 参照のみ）。

## 取得対象 evidence（`phase-11.md` の inventory と対応）

| # | evidence | 配置先（取得後） | 対応 AC |
| - | -------- | ---------------- | ------- |
| 1 | local shell test 実行ログ | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` | AC-6 / AC-7 |
| 2 | runtime smoke log（redact 済み） | `outputs/phase-11/evidence/runtime-tag-bulk-smoke.log` | AC-1 / AC-2 / AC-3 / AC-5 |
| 3 | audit count query 結果 | `outputs/phase-11/evidence/runtime-tag-bulk-audit-count.log` | AC-2 / AC-3 |
| 4 | smoke summary | `outputs/phase-11/evidence/summary.json` | AC-5 |
| 5 | cleanup 残件 0 検証ログ | `outputs/phase-11/evidence/runtime-tag-bulk-cleanup.log` | AC-4 |
| 6 | actionlint 検証ログ | `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log` | CI job 構文 |

## 前提と安全ガード（実行前に必ず確認）

- **production 誤実行禁止**: 対象は **staging 固定**。`STAGING_API_BASE` が `staging|127.0.0.1|localhost` の allowlist にマッチすること。`production` / `ubm-hyogo-api-production` を含む URL では runner が `exit 2` する。D1 名は `ubm-hyogo-db-staging` 固定（それ以外は `exit 2`）。
- **wrangler 直叩き禁止**: D1 操作はすべて `bash scripts/cf.sh d1 execute ... --env staging --remote` 経由（不変条件 I-3）。`wrangler` を直接呼ばない。
- **secret は op 参照 / redact**: bearer / cookie / token は `scripts/with-env.sh`（`op run`）経由で動的注入し、ログには `redact.sh` でマスクした値だけを残す。コマンド例の `<redacted>` を実値に置換した状態でコマンド履歴・evidence に残さない。
- **synthetic prefix 限定**: seed / cleanup / audit query はすべて `e2e_test_issue1081_` prefix のみを対象にする。real PII は投入しない。

## G0: local 検証（実装 wave 内・real D1 接続なし・AC-6 / AC-7）

```bash
# runner 関数の引数 parse / production guard / redaction / contract assertion を curl・cf.sh stub 下で検証
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh \
  | tee docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-test.log

# CI job（bulk-tag-runtime-smoke）の構文検証
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml \
  | tee docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log
```

- 期待: 全ケース PASS（production marker → `exit 2` / 必須 env 欠落 → `exit 2` / assign stub → 全 assigned / retry stub → 全 noop + audit count 同値 / unassign stub → 全 unassigned + audit 増分 / cleanup 後 count!=0 → `exit 1` / bearer 平文がログに残らない / runner に `wrangler ` 直書きなし）。
- 取得後: evidence #1 / #6 を `phase-11.md` inventory で `pending → present` に昇格。

## G1: staging deploy（user-gated）

```bash
# 実装 wave 完了後、作業ブランチ → dev へ取り込み、staging へ deploy（既存 CD 経由）。
# 本 runbook では deploy コマンドは既存 web/api CD（dev push トリガ）に委譲する。
# bulk-tag-runtime-smoke job は staging deploy 後に発火可能な状態にしておく。
```

## G2: real D1 seed（user-gated）

```bash
# secret は scripts/with-env.sh（op run）経由で注入される前提
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
  --file apps/api/migrations/seed/bulk-tag-staging-seed.sql
```

- 投入内容: writable member 2（`e2e_test_issue1081_mem_1/2`）+ deleted member 1 + active tag 2（`e2e_test_issue1081_tag_1/2`）+ inactive tag 1。`member_tags` は seed しない（assign が新規 INSERT で `assigned` を返すことを検証するため）。

## G3: bulk mutation smoke（user-gated・AC-1 / AC-2 / AC-3 / AC-5）

runner に委譲する経路（推奨。seed→assign→retry noop→unassign→audit count→cleanup を 1 runner が orchestration し redact 済みログ + summary.json を出力する）:

```bash
OUT=docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence
bash scripts/smoke/runtime-tag-bulk.sh staging --out-dir "$OUT" --ci-summary --skip-seed   # seed を G2 で済ませた場合は --skip-seed
cat "$OUT/summary.json"   # status を確認（bearer / URL は redact 済み）
```

手動 curl で個別確認する経路（runner を使わず contract を直接叩く場合・**実値 token は `<redacted>`**）:

```bash
API="$STAGING_API_BASE"   # staging 固定。production URL 禁止
# --- AC-1: assign → 全 assigned ---
curl -sS -X POST "$API/admin/members/tags/bulk" \
  -H 'authorization: Bearer <redacted>' -H 'content-type: application/json' \
  --data '{"memberIds":["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"],"tagIds":["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"],"op":"assign"}'
# 期待: 200 + 全 results[].status == "assigned"（4 件）

# --- AC-2: 同一 payload 再送 → 全 noop（冪等）---
curl -sS -X POST "$API/admin/members/tags/bulk" \
  -H 'authorization: Bearer <redacted>' -H 'content-type: application/json' \
  --data '{"memberIds":["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"],"tagIds":["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"],"op":"assign"}'
# 期待: 200 + 全 results[].status == "noop"（4 件）

# --- AC-3: unassign → 全 unassigned ---
curl -sS -X POST "$API/admin/members/tags/bulk" \
  -H 'authorization: Bearer <redacted>' -H 'content-type: application/json' \
  --data '{"memberIds":["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"],"tagIds":["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"],"op":"unassign"}'
# 期待: 200 + 全 results[].status == "unassigned"（4 件）
```

audit count query（AC-2 の不変・AC-3 の増分を検証。assign retry の **前後** と unassign の **前後** で実行する）:

```bash
# assigned audit は retry 前後で不変（冪等性の根拠）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
  --command "SELECT count(*) AS c FROM audit_log WHERE action='admin.member.tag_assigned' AND target_id LIKE 'e2e_test_issue1081_%';"
# unassigned audit は unassign で増分
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
  --command "SELECT count(*) AS c FROM audit_log WHERE action='admin.member.tag_unassigned' AND target_id LIKE 'e2e_test_issue1081_%';"
```

- 出力は `runtime-tag-bulk-audit-count.log` に保存。redact は不要（count 値のみ・PII / secret を含まない）が、念のため bearer / URL を含む行は残さない。

## G4: cleanup（user-gated・AC-4・smoke 失敗時も always）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
  --file apps/api/migrations/seed/bulk-tag-staging-cleanup.sql

# 残件 0 検証（6 テーブル）
for t in "member_tags:member_id" "audit_log:target_id" "member_status:member_id" \
         "member_identities:member_id" "member_responses:response_id" "tag_definitions:tag_id"; do
  tbl="${t%%:*}"; col="${t##*:}"
  bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --remote \
    --command "SELECT count(*) AS c FROM $tbl WHERE $col LIKE 'e2e_test_issue1081_%';"
done | tee docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-cleanup.log
```

- 期待: 全テーブルの `e2e_test_issue1081_%` 残件 count = 0（他データを巻き込まない）。runner 経由なら trap で smoke 途中失敗時も自動実行される。cleanup SQL の全 WHERE は `LIKE 'e2e_test_issue1081_%'` 限定（scope を広げない）。

## 取得後の evidence 昇格

1. 上記 G0〜G4 で取得した log / json を `outputs/phase-11/evidence/` 配下に **tracked file** として配置する（`.gitkeep` と並べる）。
2. `phase-11.md` の「Phase 11 evidence file inventory」の該当行を `status: pending → present` に更新する。
3. ログに bearer / cookie / token / webhook URL の平文が残っていないことを redaction grep で再確認する:
   ```bash
   grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|hooks\.slack\.com/services/[A-Z0-9]|xox[bp]-' \
     docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence/ || echo "redaction OK (no leak)"
   ```
4. `artifacts.json` の Gate-B を `pending → passed`（evidence_path = 本ファイル）に更新する。

## 完了判定

- [x] runtime evidence の取得手順を G0〜G4 の具体コマンド付きで記録（seed / assign / retry / unassign / audit count / cleanup）
- [x] secret 実値を載せず `<redacted>` / `op://...` 参照のみとした
- [x] production 誤実行禁止 guard・wrangler 直叩き禁止・synthetic prefix 限定を明記
- [x] evidence 配置先と取得後の `pending → present` 昇格・redaction grep 手順・Gate-B 更新を明記
- [x] 実行は全て user 明示承認後（Gate-B）であることを宣言
