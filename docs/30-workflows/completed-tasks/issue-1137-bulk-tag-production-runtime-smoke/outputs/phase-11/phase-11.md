# Phase 11: 手動テスト（production runtime smoke evidence runbook） — issue-1137-bulk-tag-production-runtime-smoke

## タスク種別と NON_VISUAL 宣言

| 項目 | 値 |
| ---- | -- |
| タスク種別 | production runtime smoke / CI gate 拡張（mutation 検証）|
| visualEvidence | **NON_VISUAL** |
| 非視覚的である理由 | 本タスクは `POST /admin/members/tags/bulk` を production Workers（`ubm-hyogo-api`）+ `ubm-hyogo-db-prod` real D1 に対して実走させる runtime smoke の新設である。UI 表示物（画面・意匠・レイアウト）の追加・変更を一切伴わない。検証対象は HTTP contract（`results[].status`）・audit parity・cleanup 残件 0 という非視覚的な runtime 挙動であり、screenshot では表現できない |
| 代替証跡（screenshot の代わり） | (1) production smoke の redacted command log（`runtime-tag-bulk-prod-smoke.log`）/ (2) audit count query 結果（`runtime-tag-bulk-prod-audit-count.log`）/ (3) cleanup 残件 0 検証ログ（`runtime-tag-bulk-prod-cleanup.log`）/ (4) machine-readable summary（`summary.json`）/ (5) local shell test ログ（`runtime-tag-bulk-test.log`）/ (6) CI job actionlint ログ（`runtime-tag-bulk-actionlint.log`） |

> **本サイクルの実装区分は `implemented_local_runtime_pending`**（local implementation complete）。本ファイルは production runtime evidence の **user 二重承認後に実行する runbook**（Gate-B）である。production real D1 に書き込むコマンドは user 二重承認後にのみ実行する。secret 実値は一切記載しない（`<redacted>` / `op://...` 参照のみ）。

## 前提と安全ガード（実行前に必ず確認）

production real D1 への書き込み副作用が本番会員データ・公開面・audit に及ぶため、staging（issue-1081）より桁違いに厳格な前提を置く。

- **二重承認（AC-3 / I-4）**:
  1. **第 1 承認** = GitHub environment `production-runtime-smoke` の reviewer 承認（CI 経由実行時）。
  2. **第 2 承認** = workflow input + runner marker。CI では `run_bulk_tag_mutation=true` と `bulk_tag_confirmation=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` の明示 opt-in が揃う場合だけ job が実行対象になり、runner 内でも `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke` と `BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1` の双方が揃わなければ `assert_production_guard` で `exit 2` する。
- **production allowlist 限定（AC-1）**: `PRODUCTION_API_BASE` の URL host が `^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$` にマッチすること。URL 全体の部分一致ではなく host 境界で判定する。staging URL / 任意 URL / path に production host 文字列を含むだけの URL では runner が `exit 2` する。staging allowlist とは独立評価。
- **D1 名固定（I-4）**: `CF_D1_DATABASE` は `ubm-hyogo-db-prod` 固定。それ以外は `exit 2`。
- **wrangler 直叩き禁止（I-3）**: D1 操作はすべて `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote` 経由。`wrangler` を直接呼ばない。
- **secret は op 参照 / redact（I-2）**: bearer / cookie / token は `scripts/with-env.sh`（`op run`）経由で動的注入し、ログには `redact.sh` でマスクした値だけを残す。CI 側は `::add-mask::`。
- **synthetic prefix 限定（I-6 / AC-2）**: seed / cleanup / audit query はすべて `e2e_test_prod_tagbulk_` prefix のみを対象にする。real PII は投入しない。staging prefix（`e2e_test_issue1081_`）とは完全分離。

## production smoke 実走手順（user 二重承認後に実行）

### S0: local 検証（実装 wave 内・real D1 接続なし・AC-6 / AC-7）

production guard・dual marker・production allowlist・staging guard 非退化を curl / cf.sh stub 下で検証する（real D1 接続なし・production への副作用なし）。

```bash
# runner の production guard / dual marker / production allowlist / staging 非退化を stub 下で検証
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh \
  | tee docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-test.log

# production CI job（bulk-tag-production-runtime-smoke）の構文検証
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/production-runtime-smoke.yml \
  | tee docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log
```

- 期待: 全ケース PASS（production-no-approval-refused → `exit 2` / production-single-approval-refused → `exit 2` / production-wrong-host-refused → `exit 2` / production-d1-database-refused → `exit 2` / staging-guard-non-regression → 既存 staging ケースが引き続き PASS / bearer 平文がログに残らない / runner に `wrangler ` 直書きなし）。
- 取得後: evidence #5 / #6 を本ファイル inventory で `pending → present` に昇格。

### S1: 二重承認の確立（user-gated）

```bash
# 第 1 承認: GitHub environment `production-runtime-smoke` の reviewer 承認（CI 経由実行時）。
# 第 2 承認: CI では workflow_dispatch input (run_bulk_tag_mutation=true + confirmation phrase)。
# 手動実行時は runner marker を環境に設定する。
export BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke
export BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1
# secret（PRODUCTION_API_BASE / PRODUCTION_ADMIN_BEARER）は scripts/with-env.sh（op run）経由で注入する前提
```

### S2: production smoke 実走（user-gated・AC-1 / AC-2 / AC-3 / AC-4 / AC-5 / AC-7）

runner に委譲する経路（推奨。seed → assign → retry noop → unassign → audit count parity → cleanup を 1 runner が orchestration し、redact 済みログ + summary.json を出力する）:

```bash
OUT=docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence
bash scripts/smoke/runtime-tag-bulk.sh production --out-dir "$OUT" --ci-summary
cat "$OUT/summary.json"   # status を確認（bearer / URL は redact 済み）
```

runner の内部 orchestration（AC マッピング）:

| 段階 | 内容 | 期待 | 対応 AC |
| ---- | ---- | ---- | ------- |
| seed | `bulk-tag-production-seed.sql` を `cf.sh d1 execute ubm-hyogo-db-prod --env production --remote` で投入 | `e2e_test_prod_tagbulk_` member 2 + active tag 2（+ deleted/inactive variant）。`member_tags` は seed しない | AC-2 |
| assign | `POST /admin/members/tags/bulk` op=assign | 200 + 全 `results[].status == "assigned"` | AC-1 |
| audit count（before retry）| `admin.member.tag_assigned` count を記録 | — | AC-5 |
| assign retry | 同一 payload 再送 | 200 + 全 `results[].status == "noop"`（冪等）| AC-5 |
| audit count（after retry）| 再計測 | retry 前後で **不変**（before == after）= 冪等の根拠 | AC-5 |
| unassign | `POST /admin/members/tags/bulk` op=unassign | 200 + 全 `results[].status == "unassigned"` | AC-1 |
| audit count（unassign 後）| `admin.member.tag_unassigned` count | 増分を assert | AC-5 |
| cleanup | `bulk-tag-production-cleanup.sql` 適用 → 6 table の `e2e_test_prod_tagbulk_%` 残件を count | すべて 0。残件あれば `fail_and_exit`。trap EXIT で smoke 途中失敗時も always 実行 | AC-4 |
| write_summary | `summary.json` 出力 | endpoint / redacted body / response summary / audit count / cleanup 結果を記録 | AC-7 |

### S3: cleanup 残件 0 の再確認（user-gated・AC-4）

runner 経由なら trap で cleanup は always 実行されるが、念のため 6 テーブルの残件を独立に確認する。

```bash
for t in "member_tags:member_id" "audit_log:target_id" "member_status:member_id" \
         "member_identities:member_id" "member_responses:response_id" "tag_definitions:tag_id"; do
  tbl="${t%%:*}"; col="${t##*:}"
  bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
    --command "SELECT count(*) AS c FROM $tbl WHERE $col LIKE 'e2e_test_prod_tagbulk_%';"
done | tee docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-prod-cleanup.log
```

- 期待: 全テーブルの `e2e_test_prod_tagbulk_%` 残件 count = 0（他データを巻き込まない・本番露出 / audit 汚染なし）。

## Phase 11 evidence file inventory（canonical 名を事前固定・FB-02）

> evidence ファイル名は本サイクル（implemented_local_runtime_pending）で **canonical 名として固定**する。local evidence は present、production real D1 実走分は user 二重承認後に `pending → present` へ昇格する。パスは workflow root（`docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/`）からの相対パス。

| # | evidence（相対パス）| 内容 | 対応 AC | 現状（本サイクル）|
| - | ------------------- | ---- | ------- | ----------------- |
| 1 | `outputs/phase-11/evidence/runtime-tag-bulk-prod-smoke.log` | production smoke の redacted command log（endpoint URL / redacted request body / response summary / audit count query / cleanup query）| AC-1 / AC-2 / AC-3 / AC-5 / AC-7 | **pending**（user 二重承認後に present へ昇格）|
| 2 | `outputs/phase-11/evidence/runtime-tag-bulk-prod-audit-count.log` | assign / retry / unassign 前後の audit count（parity 検証）| AC-5 | **pending** |
| 3 | `outputs/phase-11/evidence/runtime-tag-bulk-prod-cleanup.log` | cleanup 後の 6 table 残件 0 検証ログ | AC-4 | **pending** |
| 4 | `outputs/phase-11/evidence/summary.json` | machine-readable smoke summary（status 集計 / redacted）| AC-5 / AC-7 | **pending** |
| 5 | `outputs/phase-11/evidence/runtime-tag-bulk-test.log` | local shell test 実行ログ（production guard / dual marker / allowlist / staging 非退化）| AC-6 / AC-7 | **present** |
| 6 | `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log` | `production-runtime-smoke.yml` の actionlint 検証ログ | CI job 構文 | **present** |

## 取得後の evidence 昇格手順

1. S0〜S3 で取得した log / json を `outputs/phase-11/evidence/` 配下に **tracked file** として配置する（`.gitkeep` と並べる）。
2. 本ファイルの inventory 該当行を `pending → present` に更新する。
3. ログに bearer / cookie / token / webhook URL の平文が残っていないことを redaction grep で再確認する:
   ```bash
   grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|hooks\.slack\.com/services/[A-Z0-9]|xox[bp]-' \
     docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence/ || echo "redaction OK (no leak)"
   ```
4. `artifacts.json` の Gate-B を `pending → passed`（evidence_path = 本ファイル）に更新する。

## 完了判定（本サイクル = implemented_local_runtime_pending）

- [x] NON_VISUAL（タスク種別・非視覚的理由・代替証跡）を冒頭に宣言した
- [x] production smoke 実走手順を S0〜S3 の具体コマンド付きで記録（二重承認 → seed → assign → retry noop → unassign → audit count parity → cleanup 残件 0）
- [x] evidence ファイル名を canonical 名として固定（6 点・FB-02）し、local evidence は `present`、production runtime evidence は `pending` と明記した
- [x] secret 実値を載せず `<redacted>` / `op://...` 参照のみとした
- [x] production 誤実行禁止 guard（allowlist + dual marker + D1 名）・wrangler 直叩き禁止・synthetic prefix 限定を明記した
- [x] 実走（real D1 への seed / mutation / cleanup）は全て user 二重承認後（Gate-B）であることを宣言した
