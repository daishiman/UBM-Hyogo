# Phase 2: 設計 — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

成果物 1〜6 の構造（runner の段階・関数分割 / seed・cleanup SQL / CI job YAML 骨格 / contract 検証ロジック）を、同 cycle でコード化できる粒度で固定する。
既存資産（`runtime-attendance-provider.sh` / `redact.sh` / `cf.sh` / `seed-issue-399.sh`）を雛形化し、新規 primitive を最小化する（FB-SDK-07-1）。

## 既存コンポーネント再利用可否

| 再利用候補 | 可否 | 適用 |
| ---------- | ---- | ---- |
| `runtime-attendance-provider.sh` の `assert_target` / `fail_and_exit` / redact / jq contract | 高 | runner の骨格にそのまま転用。GET ではなく POST/mutation 用に拡張 |
| `redact.sh` | 高 | bearer / cookie / sessionToken マスクをそのまま再利用 |
| `cf.sh d1 execute --env staging --remote` | 高 | seed / cleanup / audit count query を全て経由（wrangler 直叩き禁止 I-3） |
| `seed-issue-399.sh` / `cleanup-issue-399.sh` の `CLOUDFLARE_ENV=staging` guard + count=0 検証 | 高 | seed/cleanup wrapper の guard + 残件 0 検証パターンを踏襲 |
| `runtime-smoke-staging.yml` の job 骨格（環境承認 / secret verify / mint / mask / redaction grep gate / artifact upload / Slack） | 高 | 新 job `bulk-tag-runtime-smoke` を同一 workflow に追加 |

→ 新規ファイルは runner / seed SQL / cleanup SQL / local test の 4 つ + 既存 workflow への job 追加 1 EDIT に収める。

## topology（状態所有権）

```
runtime-smoke-staging.yml (Facade / CI orchestration)
  ├─ smoke                  (既存 job: attendance GET smoke)
  └─ bulk-tag-runtime-smoke (NEW job, environment: staging-runtime-smoke)
        ├─ setup-project
        ├─ mint staging admin bearer  ── scripts/smoke/mint-staging-bearers.mts (既存・再利用)
        ├─ verify required secrets
        ├─ mask credentials
        └─ run bulk tag smoke         ── scripts/smoke/runtime-tag-bulk.sh (Engine: orchestration)
               ├─ seed                ── cf.sh d1 execute --file bulk-tag-staging-seed.sql
               ├─ POST bulk assign / retry / unassign  (HTTP・bearer)
               ├─ audit count query   ── cf.sh d1 execute --command "SELECT count(*)..."
               └─ cleanup             ── cf.sh d1 execute --file bulk-tag-staging-cleanup.sql
```

| 部品 | 状態所有権 | 責務 |
| ---- | ---------- | ---- |
| `runtime-smoke-staging.yml bulk-tag-runtime-smoke` | CI job 成否 | 承認 gate / secret 注入 / evidence 集約 / redaction grep gate |
| `runtime-tag-bulk.sh` | smoke 結果（PASS/FAIL）・summary.json・log | seed → assign → assert → retry → audit count 不変 → unassign → audit query → cleanup → summary 出力 |
| `bulk-tag-staging-seed.sql` | staging D1 の test fixture 行 | `e2e_test_issue1081_*` member_identities / member_status / tag_definitions / member_tags 初期状態 |
| `bulk-tag-staging-cleanup.sql` | test fixture 削除 | `e2e_test_issue1081_%` 行を member_tags / member_status / member_identities / tag_definitions / audit_log から削除 |

## (a) runner `runtime-tag-bulk.sh` の段階構造

### 入出力仕様

```
Usage:
  runtime-tag-bulk.sh <env> [--out-dir <path>] [--ci-summary] [--skip-cleanup]

Args:
  env            : "staging" のみ許可（他は exit 2 = production 誤実行 guard / AC-6）
  --out-dir      : evidence 出力 dir（省略時は本 workflow の phase-11 evidence dir）
  --ci-summary   : summary.json を追加出力
  --skip-cleanup : （local debug 用）cleanup を skip。CI では指定しない

Required env (staging prefix):
  STAGING_API_BASE        : api-staging origin（例 https://api-staging.ubm-hyogo.workers.dev）
  STAGING_ADMIN_BEARER    : admin 権限の bearer JWT（mint step が注入。値は redact）
  CLOUDFLARE_ENV          : "staging"（seed/cleanup の cf.sh 実行に必須）

Exit:
  0 : 全 step PASS
  1 : HTTP non-200 / contract 違反 / audit count 不一致 / cleanup 残件
  2 : 引数不正 / 必須 env 欠落 / production guard 違反
```

### 段階構造（擬似コード・関数分割）

```bash
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
REDACT="$SCRIPT_DIR/redact.sh"
PREFIX="e2e_test_issue1081_"
SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-seed.sql"
CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-cleanup.sql"

# --- 1. 引数 parse & production guard (AC-6) -------------------------------
ENVIRONMENT="${1:-}"; shift || true
[[ -z "$ENVIRONMENT" ]] && { echo "env required" >&2; exit 2; }
assert_not_production "$ENVIRONMENT"   # env != staging → exit 2

# --- 2. env 解決 -----------------------------------------------------------
API_BASE="${STAGING_API_BASE:?STAGING_API_BASE is required}"
ADMIN_BEARER="${STAGING_ADMIN_BEARER:?STAGING_ADMIN_BEARER is required}"
BASE="${API_BASE%/}"
assert_not_production_url "$BASE"      # URL に production marker → exit 2 (AC-6)
[[ "${CLOUDFLARE_ENV:-}" == "staging" ]] || { echo "CLOUDFLARE_ENV must be staging" >&2; exit 2; }

# --- 3. seed (cf.sh 経由・I-3) --------------------------------------------
run_d1_file "$SEED_SQL"               # cf.sh d1 execute ... --file SEED_SQL

# --- 4. bulk assign → assert assigned (AC-1) ------------------------------
ASSIGN_RES="$(post_bulk assign)"
assert_all_status "$ASSIGN_RES" "assigned"   # results[].status が全て assigned

# --- 5. audit count baseline (assign 後) ----------------------------------
AUDIT_ASSIGNED_1="$(audit_count tag_assigned)"

# --- 6. retry assign → assert noop + audit 不変 (AC-2) --------------------
RETRY_RES="$(post_bulk assign)"
assert_all_status "$RETRY_RES" "noop"
AUDIT_ASSIGNED_2="$(audit_count tag_assigned)"
[[ "$AUDIT_ASSIGNED_1" == "$AUDIT_ASSIGNED_2" ]] \
  || fail "idempotency" "audit_assigned changed $AUDIT_ASSIGNED_1 -> $AUDIT_ASSIGNED_2"

# --- 7. bulk unassign → assert unassigned + audit parity (AC-3) -----------
UNASSIGN_RES="$(post_bulk unassign)"
assert_all_status "$UNASSIGN_RES" "unassigned"
AUDIT_UNASSIGNED="$(audit_count tag_unassigned)"
[[ "$AUDIT_UNASSIGNED" -ge 1 ]] || fail "audit-parity" "tag_unassigned not appended"

# --- 8. cleanup (AC-4) + 残件 0 検証 --------------------------------------
if [[ "$SKIP_CLEANUP" -ne 1 ]]; then
  run_d1_file "$CLEANUP_SQL"
  assert_cleanup_zero            # member_tags/member_status/member_identities/tag_definitions/audit_log
fi

# --- 9. summary.json + log 出力 (AC-5) ------------------------------------
write_summary
echo "bulk tag runtime smoke PASS"
```

### 主要関数

| 関数 | 役割 |
| ---- | ---- |
| `assert_not_production(env)` | `case "$env" in staging) ;; *) exit 2 ;; esac`。staging 以外を拒否（AC-6） |
| `assert_not_production_url(url)` | url が production marker（`api.ubm-hyogo` / `--env production` 等 production allow regex）に一致したら exit 2。`grep -Eiq` で `staging` を含むことも併せて要求 |
| `run_d1_file(sql)` | `bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging --env staging --remote --file "$sql"`（I-3） |
| `post_bulk(op)` | request body を組み立て `curl -X POST -H "authorization: Bearer $ADMIN_BEARER"`。**body は redact してから log へ**（AC-5 / I-2）。HTTP code を assert（200 以外は `fail`） |
| `assert_all_status(json, expected)` | jq で `results[].status` を集計し、全件 `expected` か検証（後述 (d)） |
| `audit_count(action)` | `cf.sh d1 execute --json --command "SELECT count(*) AS c FROM audit_log WHERE action = 'admin.member.<action>' AND target_id LIKE 'e2e_test_issue1081_%';"` の `c` を返す |
| `assert_cleanup_zero()` | cleanup 後に各テーブルの `LIKE 'e2e_test_issue1081_%'` 残件 count=0 を assert（`cleanup-issue-399.sh` 踏襲） |
| `fail(label, reason)` | OVERALL=FAIL / summary 追記 / redact 済み log 出力 / exit 1（`fail_and_exit` 踏襲） |
| `write_summary()` | `--ci-summary` 指定時に `summary.json` を出力 |

> `post_bulk` の request body は memberIds / tagIds を含むが PII ではない synthetic id（`e2e_test_issue1081_*`）。bearer header のみ redact 対象。log には `request_body=` を redact フィルタ通過後に記録する（AC-5）。

## (b) seed SQL / cleanup SQL の具体構造

### `bulk-tag-staging-seed.sql`

```sql
-- bulk-tag-staging-seed.sql
-- Staging-only synthetic seed for issue-1081 bulk tag runtime smoke.
-- All rows use prefix `e2e_test_issue1081_` so cleanup targets them safely.
-- Tables (no ALTER): member_identities, member_status, tag_definitions, member_tags
-- Invariant: never seed real PII; never run outside staging (scripts/cf.sh --env staging).
BEGIN TRANSACTION;

-- 2 synthetic members（bulk 対象。member_identities = 存在判定 / member_status = is_deleted 判定）
INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_issue1081_mem_1', 'e2e_test_issue1081_1@example.invalid', 'e2e_test_issue1081_resp_1', 'e2e_test_issue1081_resp_1', datetime('now')),
  ('e2e_test_issue1081_mem_2', 'e2e_test_issue1081_2@example.invalid', 'e2e_test_issue1081_resp_2', 'e2e_test_issue1081_resp_2', datetime('now'));

INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_issue1081_mem_1', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1081_seed', datetime('now')),
  ('e2e_test_issue1081_mem_2', 'consented', 'consented', 'member_only', 0, 'e2e_test_issue1081_seed', datetime('now'));

-- 1 synthetic active tag（assign 対象。active=1 で tag_not_found を回避）
INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_issue1081_tag_1', 'e2e_test_issue1081_code_1', 'E2E Smoke Tag (issue-1081)', 'manual', '[]', 1);

-- member_tags は初期状態 空（seed では付与しない）。
-- → 初回 assign が "assigned"、再送が "noop"、unassign が "unassigned" になる前提を保証する。
DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_issue1081_%';

COMMIT;
```

> 設計意図: member_tags を seed で空にしておくことで、runner の 1) assign=assigned / 2) retry=noop / 3) unassign=unassigned という state 遷移が決定論的になる。member は 2 件 × tag 1 件 = 期待 2 results。

### `bulk-tag-staging-cleanup.sql`

```sql
-- bulk-tag-staging-cleanup.sql
-- Remove all issue-1081 synthetic fixtures. WHERE 句は全て e2e_test_issue1081_% 限定（AC-4）。
BEGIN TRANSACTION;
DELETE FROM member_tags       WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM member_status     WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM member_identities WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM tag_definitions   WHERE tag_id    LIKE 'e2e_test_issue1081_%';
DELETE FROM audit_log         WHERE target_id LIKE 'e2e_test_issue1081_%';
COMMIT;
```

> runner の `assert_cleanup_zero()` は上記 5 テーブルそれぞれに `SELECT count(*) ... WHERE ... LIKE 'e2e_test_issue1081_%'` を発行し全て `"c":0` を要求する。

## (c) CI job の YAML 骨格

`.github/workflows/runtime-smoke-staging.yml` に新 job を追加（既存 `smoke` job は不変）。

```yaml
  bulk-tag-runtime-smoke:
    runs-on: ubuntu-latest
    environment: staging-runtime-smoke        # user approval gate（既存と同一）
    timeout-minutes: 10
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
      CLOUDFLARE_ENV: staging
    steps:
      - uses: actions/checkout@v4
      - name: setup project
        uses: ./.github/actions/setup-project

      - name: mint staging admin bearer
        if: env.STAGING_AUTH_SECRET != ''
        env:
          STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
          STAGING_ADMIN_MEMBER_ID: ${{ secrets.STAGING_ADMIN_MEMBER_ID }}
          STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}
          MINT_TTL_SECONDS: '600'
        run: |
          mint_out="$(mktemp)"
          GITHUB_OUTPUT="$mint_out" pnpm exec tsx scripts/smoke/mint-staging-bearers.mts
          admin="$(grep '^admin_bearer=' "$mint_out" | tail -n1 | cut -d= -f2-)"
          rm -f "$mint_out"
          echo "::add-mask::$admin"
          echo "STAGING_ADMIN_BEARER=$admin" >> "$GITHUB_ENV"

      - name: verify required staging secrets
        run: |
          missing=()
          for name in STAGING_API_BASE STAGING_ADMIN_BEARER; do
            [ -z "${!name:-}" ] && missing+=("$name")
          done
          if [ "${#missing[@]}" -gt 0 ]; then
            printf "::error::missing secrets: %s\n" "${missing[*]}"
            exit 1
          fi

      - name: mask staging credentials
        run: |
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_API_BASE"

      - name: run bulk tag runtime smoke
        run: |
          mkdir -p ci-evidence-bulk-tag
          bash scripts/smoke/runtime-tag-bulk.sh staging --out-dir ci-evidence-bulk-tag --ci-summary

      - name: redaction grep gate
        if: always()
        run: |
          leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|xox[bp]-' ci-evidence-bulk-tag/ || true)"
          if [ -n "$leak_files" ]; then
            echo "::error::redaction grep gate failed"
            printf '%s\n' "$leak_files" | sed 's#^#leak-candidate-file=#'
            exit 1
          fi

      - name: upload evidence artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: runtime-smoke-bulk-tag-${{ github.run_id }}
          path: ci-evidence-bulk-tag/
          retention-days: 30
```

> 既存 `smoke` job との関心分離: 別 job（`bulk-tag-runtime-smoke`）として独立させる。GET smoke（read-only）と mutation smoke（D1 書き込み + cleanup）は失敗時の切り分け・retry 戦略が異なるため job を混在させない（Phase 3 で再評価）。

## (d) contract 検証ロジック（jq で results[].status 集計）

`assert_all_status` の中核。response JSON の `results[].status` を集計し、期待ステータス以外が 1 件でもあれば fail する。

```bash
assert_all_status() {
  local json="$1" expected="$2"
  # batchId が string であること
  echo "$json" | jq -e '.batchId | type == "string"' >/dev/null \
    || fail "contract" "batchId missing"
  # results が空でない array
  echo "$json" | jq -e '.results | type == "array" and length > 0' >/dev/null \
    || fail "contract" "results empty"
  # 期待 status 以外の件数 = 0
  local off
  off="$(echo "$json" | jq --arg s "$expected" '[.results[] | select(.status != $s)] | length')"
  [[ "$off" == "0" ]] \
    || fail "contract" "$(echo "$json" | jq -c --arg s "$expected" '[.results[].status] | group_by(.) | map({status: .[0], n: length})')"
}
```

| 集計クエリ | 用途 |
| ---------- | ---- |
| `[.results[].status] \| group_by(.) \| map({status:.[0], n:length})` | status 分布を summary に記録（AC-5）。例: `[{"status":"assigned","n":2}]` |
| `[.results[] \| select(.status != $s)] \| length == 0` | 全件 expected 判定（AC-1/2/3） |
| `.batchId` | summary に batchId を記録（trace） |

## validation path

| レイヤ | 検証 |
| ------ | ---- |
| 静的 | `pnpm typecheck` / `pnpm lint` / `shellcheck`（runner）/ `actionlint`（workflow） |
| 単体（local・real D1 なし） | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（引数 / production guard / redaction / assert 関数） |
| 統合（user-gated） | staging deploy 後の `bulk-tag-runtime-smoke` job 実走 = Gate-B |

## 完了判定

- [x] runner の 9 段階構造 + 主要関数を固定
- [x] seed / cleanup SQL の具体構造（4+1 テーブル / `e2e_test_issue1081_` prefix）を確定
- [x] CI job YAML 骨格（承認 gate / mint / redaction grep gate / artifact）を提示
- [x] contract 検証 jq ロジック（results[].status 集計）を確定
