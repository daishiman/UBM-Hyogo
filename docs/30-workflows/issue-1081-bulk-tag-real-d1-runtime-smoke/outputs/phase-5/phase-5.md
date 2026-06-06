# Phase 5: 実装 — issue-1081-bulk-tag-real-d1-runtime-smoke

> 本 Phase は**実装仕様書兼 local 実装記録**である。本 cycle でコード化した粒度と、staging 実走時に見るべき contract を定義する。
> **コード実装は本サイクルで完了**。commit・push・PR・staging 実走は user-gated。
> 正本順位: 実装コード（`apps/api/src/routes/admin/members.ts` / `apps/api/src/repository/memberTags.ts`）の実 contract > 本 outputs の phase-1/2/3 > issue 本文 AC。

## 新規作成 / 修正ファイル一覧（RT-03 必須記載）

| 区分 | パス | 概要 |
| ---- | ---- | ---- |
| NEW  | `scripts/smoke/runtime-tag-bulk.sh` | staging bulk tag mutation smoke runner（seed→assign→retry noop→unassign→audit count→cleanup の orchestration + contract assert + redaction + production guard） |
| NEW  | `apps/api/migrations/seed/bulk-tag-staging-seed.sql` | `e2e_test_issue1081_*` synthetic member / tag を staging real D1 へ投入（`member_identities` / `member_responses` / `member_status` / `tag_definitions`） |
| NEW  | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` | `e2e_test_issue1081_%` データを `member_tags` / `member_status` / `member_identities` / `member_responses` / `tag_definitions` / `audit_log` から削除 |
| EDIT | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` job 追加（`environment: staging-runtime-smoke`・既存 `smoke` job とは関心分離した独立 job） |
| NEW  | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | runner の引数 parse / production guard / redaction / contract assertion 関数の local 検証（real D1 接続なし。curl / cf.sh を stub） |

## 実 contract（runner が検証する正本・Phase 1/コードから固定）

```
POST /admin/members/tags/bulk
  body: { memberIds: string[], tagIds: string[], op: "assign" | "unassign" }
  200:  { batchId: string, results: Array<{ memberId, tagId, status }> }
        status ∈ "assigned" | "noop" | "unassigned" | "skipped_deleted" | "tag_not_found"
  audit: status==="assigned"   → admin.member.tag_assigned   (after_json.batchId)
         status==="unassigned" → admin.member.tag_unassigned (before_json.batchId)
         status ∈ {noop, skipped_deleted, tag_not_found} → audit append なし（=冪等性の根拠）
```

- member 解決: `member_identities`（存在）＋ `member_status.is_deleted`。不在 / is_deleted=1 → `skipped_deleted`。
- tag 解決: `tag_definitions.active = 1` に該当なし → `tag_not_found`。
- 重複 memberId / tagId は server 側で dedupe される。よって seed する member / tag は互いに重複しない値にする。

---

## Step 1: `apps/api/migrations/seed/bulk-tag-staging-seed.sql`（NEW）

`issue-399-admin-queue-staging-seed.sql` を雛形に、`POST /admin/members/tags/bulk` の assign が `assigned` を返すための前提（書き込み可能 member ＋ active tag）を投入する。

### 投入対象テーブルと根拠

| テーブル | なぜ必要か | 行数 |
| -------- | ---------- | ---- |
| `member_responses` | `member_identities.current_response_id` の参照先（FK 制約は無いが `members` view の JOIN 整合 / 後方互換のため最小行を入れる） | 2 |
| `member_identities` | 書き込み判定の存在チェック（`bulkApplyMemberTagsByAdmin` の `WHERE mi.member_id IN (...)`）。**ここに無い member は skipped_deleted** | 2 |
| `member_status` | `is_deleted` 判定。assign 対象は `is_deleted=0`。AC-4 検証用に `is_deleted=1` の 1 件も投入 | 3（writable 2 + deleted 1） |
| `tag_definitions` | `active=1` の tag master。assign 対象 tag（active）＋ `tag_not_found` 検証用に `active=0`（inactive）1 件 | 3（active 2 + inactive 1） |

> **member_tags は seed しない**。bulk assign が新規 INSERT して `assigned` を返すことを検証するため、初期状態は「未付与」にする（assign 前は member_tags に該当行が無い状態）。

### synthetic 値（全て `e2e_test_issue1081_` prefix）

| 種別 | id |
| ---- | -- |
| writable member | `e2e_test_issue1081_mem_1`, `e2e_test_issue1081_mem_2` |
| deleted member（skip 検証用） | `e2e_test_issue1081_mem_deleted` |
| response | `e2e_test_issue1081_resp_1`, `e2e_test_issue1081_resp_2`, `e2e_test_issue1081_resp_deleted` |
| active tag | `e2e_test_issue1081_tag_1`, `e2e_test_issue1081_tag_2` |
| inactive tag（tag_not_found 検証用） | `e2e_test_issue1081_tag_inactive` |
| tag code（UNIQUE 制約回避のため prefix 付与） | `e2e_test_issue1081_code_1` 等 |

### SQL 骨格

```sql
-- bulk-tag-staging-seed.sql
-- Staging-only synthetic seed for issue-1081 bulk tag runtime smoke.
-- All rows use the synthetic prefix `e2e_test_issue1081_` so cleanup can target them safely.
-- Tables touched (no ALTER): member_responses, member_identities, member_status, tag_definitions
-- Invariant: never seed real PII; never run outside staging (see scripts/smoke/runtime-tag-bulk.sh / cf.sh d1).

BEGIN TRANSACTION;

-- (1) member_responses: member_identities.current_response_id の参照先（最小行）
INSERT OR REPLACE INTO member_responses
  (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES
  ('e2e_test_issue1081_resp_1',       'e2e_test_issue1081_form', 'rev1', 'hash1',
   'e2e_test_issue1081_mem_1@example.test',       datetime('now'), '{}'),
  ('e2e_test_issue1081_resp_2',       'e2e_test_issue1081_form', 'rev1', 'hash1',
   'e2e_test_issue1081_mem_2@example.test',       datetime('now'), '{}'),
  ('e2e_test_issue1081_resp_deleted', 'e2e_test_issue1081_form', 'rev1', 'hash1',
   'e2e_test_issue1081_mem_deleted@example.test', datetime('now'), '{}');

-- (2) member_identities: 存在チェックの対象（ここに無い member は skipped_deleted）
INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_issue1081_mem_1',       'e2e_test_issue1081_mem_1@example.test',
   'e2e_test_issue1081_resp_1',       'e2e_test_issue1081_resp_1',       datetime('now')),
  ('e2e_test_issue1081_mem_2',       'e2e_test_issue1081_mem_2@example.test',
   'e2e_test_issue1081_resp_2',       'e2e_test_issue1081_resp_2',       datetime('now')),
  ('e2e_test_issue1081_mem_deleted', 'e2e_test_issue1081_mem_deleted@example.test',
   'e2e_test_issue1081_resp_deleted', 'e2e_test_issue1081_resp_deleted', datetime('now'));

-- (3) member_status: is_deleted 判定。writable 2 件は is_deleted=0、skip 検証用 1 件は is_deleted=1
INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_issue1081_mem_1',       'consented', 'consented', 'member_only', 0, 'e2e_test_issue1081_seed', datetime('now')),
  ('e2e_test_issue1081_mem_2',       'consented', 'consented', 'member_only', 0, 'e2e_test_issue1081_seed', datetime('now')),
  ('e2e_test_issue1081_mem_deleted', 'consented', 'consented', 'member_only', 1, 'e2e_test_issue1081_seed', datetime('now'));

-- (4) tag_definitions: active 2 件（assign 対象）＋ inactive 1 件（tag_not_found 検証用）
--     code は UNIQUE のため prefix 付き synthetic 値で衝突回避
INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_issue1081_tag_1',        'e2e_test_issue1081_code_1',        'issue1081 smoke tag 1', 'e2e_test_issue1081', '[]', 1),
  ('e2e_test_issue1081_tag_2',        'e2e_test_issue1081_code_2',        'issue1081 smoke tag 2', 'e2e_test_issue1081', '[]', 1),
  ('e2e_test_issue1081_tag_inactive', 'e2e_test_issue1081_code_inactive', 'issue1081 inactive',    'e2e_test_issue1081', '[]', 0);

COMMIT;
```

> 注: `INSERT OR REPLACE` で冪等にし、seed の再投入でも残存行が二重化しないようにする（再 run 耐性）。

---

## Step 2: `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql`（NEW）

`issue-399-admin-queue-staging-cleanup.sql` を雛形に、**`e2e_test_issue1081_%` のみ**を削除する（AC-4 = 他データを巻き込まない）。
削除順は FK 依存が無くても「子→親」を踏襲し、smoke で生成された `member_tags` / `audit_log` も漏れなく除去する。

### 削除対象と WHERE 句

| テーブル | WHERE 句 | 理由 |
| -------- | -------- | ---- |
| `member_tags` | `member_id LIKE 'e2e_test_issue1081_%'` | smoke の assign が生成した付与行 |
| `audit_log` | `target_id LIKE 'e2e_test_issue1081_%'` | smoke の assigned/unassigned audit 行 |
| `member_status` | `member_id LIKE 'e2e_test_issue1081_%'` | seed 行 |
| `member_identities` | `member_id LIKE 'e2e_test_issue1081_%'` | seed 行 |
| `member_responses` | `response_id LIKE 'e2e_test_issue1081_%'` | seed 行 |
| `tag_definitions` | `tag_id LIKE 'e2e_test_issue1081_%'` | seed 行 |

### SQL 骨格

```sql
-- bulk-tag-staging-cleanup.sql
-- Remove issue-1081 bulk tag smoke fixtures. Targets ONLY the `e2e_test_issue1081_%` prefix (AC-4).
-- Invariant: every WHERE clause is LIKE 'e2e_test_issue1081_%'. Never widen the scope.

BEGIN TRANSACTION;

-- 子（smoke 生成物）から先に削除
DELETE FROM member_tags  WHERE member_id LIKE 'e2e_test_issue1081_%';
DELETE FROM audit_log    WHERE target_id LIKE 'e2e_test_issue1081_%';

-- seed 行（親）
DELETE FROM member_status      WHERE member_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM member_identities  WHERE member_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM member_responses   WHERE response_id LIKE 'e2e_test_issue1081_%';
DELETE FROM tag_definitions    WHERE tag_id      LIKE 'e2e_test_issue1081_%';

COMMIT;
```

> **AC-4 不変条件**: 全 `DELETE` の WHERE は例外なく `LIKE 'e2e_test_issue1081_%'`。WHERE を外した全削除 / prefix を緩める変更は禁止。Phase 4 の seed-syntax test（`apps/api/migrations/seed/__tests__/`）で「WHERE 無し DELETE が無い」ことを静的検査する。

---

## Step 3: `scripts/smoke/runtime-tag-bulk.sh`（NEW）

`runtime-attendance-provider.sh` を雛形に、bulk tag mutation の orchestration runner を実装する。
`set -euo pipefail` / `umask 077` / `trap rm TMP_DIR` / redact 経由ログ / summary.json 出力の機構は雛形踏襲。

### 使い方 / 必須 env

```
Usage: runtime-tag-bulk.sh staging [--out-dir <path>] [--ci-summary] [--skip-seed] [--skip-cleanup]
Required env:
  STAGING_API_BASE      : staging API base URL（末尾 / は除去）
  STAGING_ADMIN_BEARER  : admin 権限の bearer（mint or 静的 fallback）
Optional env:
  STAGING_API_HOST_ALLOW_REGEX : target allowlist（既定 'staging|127\.0\.0\.1|localhost'）
  CF_D1_DATABASE               : 既定 'ubm-hyogo-db-staging'
Exit:
  0 : 全 AC PASS / 1 : contract 違反・non-200 / 2 : 引数不正・必須 env 欠落・production guard 違反
```

### 関数シグネチャと処理（実装の正本）

| 関数 | シグネチャ | 処理 |
| ---- | ---------- | ---- |
| `resolve_env` | `resolve_env "$@"` | 第1引数 env を解析。`staging` 以外は `exit 2`。`--out-dir` / `--ci-summary` / `--skip-seed` / `--skip-cleanup` を parse。`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` を indirect 解決（`:?` で欠落時 exit）。`BASE="${STAGING_API_BASE%/}"` を確定 |
| `assert_staging_guard` | `assert_staging_guard` | production 誤実行 guard（AC-6）。`$BASE` が `STAGING_API_HOST_ALLOW_REGEX`（既定 `staging\|127\.0\.0\.1\|localhost`）に**マッチしなければ exit 2**。加えて `$BASE` が `production` / `ubm-hyogo-api-production` を含む場合も明示的に exit 2。seed/cleanup の D1 名が `ubm-hyogo-db-staging` 以外なら exit 2 |
| `run_d1` | `run_d1 <--file path \| --command sql> [--json]` | `bash "$REPO_ROOT/scripts/cf.sh" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"` の薄いラッパー（不変条件 I-3）。raw 出力を返し、ログ書き出しは呼び出し側で redact してから行う |
| `seed` | `seed` | `--skip-seed` なら何もしない。`run_d1 --file "$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-seed.sql"`。失敗（非 0 exit）なら `fail_and_exit "seed" "000" "seed sql must apply" "seed-failed"` |
| `post_bulk` | `post_bulk <label> <op> <out_var_name>` | `POST $BASE/admin/members/tags/bulk` を `op=assign\|unassign` で実行。body は writable member 2 × active tag 2 の固定 payload（`e2e_test_issue1081_mem_1/2` × `e2e_test_issue1081_tag_1/2`）。HTTP code を `-w "%{http_code}"`、body を `-o body_file` に取得。200 以外は `fail_and_exit`。response body を redact してログへ。`batchId` を out_var に格納（後続で参照する場合） |
| `assert_status` | `assert_status <label> <body_file> <expected_status> [<expected_count>]` | jq で `[.results[] \| select(.status==$expected)] \| length` を集計し `expected_count`（既定 4 = 2×2）と一致を assert。不一致なら `fail_and_exit "$label" "200" ".results[].status all == $expected" "status-mismatch"`。`.batchId \| type=="string"` も assert |
| `audit_count` | `audit_count <action>` | `run_d1 --command "SELECT count(*) AS c FROM audit_log WHERE action='$action' AND target_id LIKE 'e2e_test_issue1081_%';" --json` を実行し、jq で `c` を抽出して echo（数値のみ）。`action` は `admin.member.tag_assigned` / `admin.member.tag_unassigned` |
| `cleanup` | `cleanup` | `--skip-cleanup` なら何もしない。`run_d1 --file "$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-cleanup.sql"`。その後 `member_tags` / `member_status` / `member_identities` / `tag_definitions` / `audit_log` の `e2e_test_issue1081_%` 残件 count を各々取得し**すべて 0** を assert（AC-4）。trap で smoke 失敗時も必ず呼ぶ |
| `emit_summary` | `emit_summary` | `--ci-summary` 時のみ `summary.json` を出力（雛形の `write_summary` 同様 `{status, checks:[...]}`）。各 check の reason は redact 済み |
| `fail_and_exit` | `fail_and_exit <label> <status> <contract> [<reason>]` | 雛形踏襲。`OVERALL_STATUS=FAIL` にし summary へ記録、stderr へ出力、`exit 1` |

### orchestration（main 相当・AC との対応）

```bash
#!/usr/bin/env bash
# bulk tag mutation runtime smoke runner (issue-1081).
# Drives POST /admin/members/tags/bulk against staging Workers + ubm-hyogo-db-staging real D1.
# Usage: runtime-tag-bulk.sh staging [--out-dir <path>] [--ci-summary] [--skip-seed] [--skip-cleanup]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
REDACT="$SCRIPT_DIR/redact.sh"
CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-staging}"

# 固定 payload（writable 2 member × active 2 tag = 4 item）
MEMBER_IDS='["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"]'
TAG_IDS='["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"]'
EXPECTED_ITEMS=4

resolve_env "$@"            # env / flags / required secret
assert_staging_guard       # AC-6 production guard（最優先で実行）

# cleanup は smoke 成否に関わらず必ず実行（AC-4）。trap で保証する。
trap 'cleanup || true; rm -rf "$TMP_DIR"' EXIT

seed                       # AC: 前提投入

# --- AC-1: bulk assign → 全 assigned ---
post_bulk "assign" "assign" ASSIGN_BODY
assert_status "assign" "$ASSIGN_BODY" "assigned" "$EXPECTED_ITEMS"

# --- AC-2: 再送（assign）→ 全 noop、かつ audit count 不変（冪等性）---
assigned_before="$(audit_count admin.member.tag_assigned)"
post_bulk "assign-retry" "assign" RETRY_BODY
assert_status "assign-retry" "$RETRY_BODY" "noop" "$EXPECTED_ITEMS"
assigned_after="$(audit_count admin.member.tag_assigned)"
[[ "$assigned_before" == "$assigned_after" ]] \
  || fail_and_exit "audit-idempotency" "200" "tag_assigned audit count unchanged on retry" "audit-count-drift"

# --- AC-3: bulk unassign → 全 unassigned、かつ tag_unassigned audit が増分 ---
unassigned_before="$(audit_count admin.member.tag_unassigned)"
post_bulk "unassign" "unassign" UNASSIGN_BODY
assert_status "unassign" "$UNASSIGN_BODY" "unassigned" "$EXPECTED_ITEMS"
unassigned_after="$(audit_count admin.member.tag_unassigned)"
[[ "$unassigned_after" -gt "$unassigned_before" ]] \
  || fail_and_exit "audit-parity" "200" "tag_unassigned audit count increased" "audit-parity-missing"

emit_summary
echo "bulk tag runtime smoke PASS"
# cleanup は trap で実行され、e2e_test_issue1081_% 残件 0 を検証する（AC-4）。
```

### 実装ノート

- **wrangler 直叩き禁止（I-3）**: D1 操作はすべて `run_d1` → `scripts/cf.sh d1 execute` 経由。runner / test に `wrangler ` 文字列を直書きしない。
- **redaction（I-2 / AC-5）**: response body / d1 出力は `bash "$REDACT"` を通してから `runtime-smoke.log` へ書く。bearer は `authorization: Bearer ...` を `redact.sh` がマスク。URL は endpoint path のみ記録（query/secret 無し）。
- **production guard（AC-6）**: `assert_staging_guard` を seed 前の最初に呼ぶ。`STAGING_API_HOST_ALLOW_REGEX` 不一致・`production` 含有・D1 名不一致のいずれかで exit 2。
- **cleanup always（AC-4）**: `trap '... cleanup ...' EXIT` で smoke 途中失敗時も cleanup を走らせ、`--skip-cleanup` 明示時のみ抑止。
- **再 run 耐性**: seed は `INSERT OR REPLACE`、cleanup は prefix DELETE で冪等。

---

## Step 4: `.github/workflows/runtime-smoke-staging.yml` に job 追加（EDIT）

既存 `smoke` job（attendance）はそのまま残し、独立した `bulk-tag-runtime-smoke` job を追加する（関心分離）。
既存 job の secret / mask / redaction grep gate / artifact upload の構造を踏襲する。

> **env scope 不変条件**: `CLOUDFLARE_API_TOKEN`（cf.sh d1 用）は **job-level `env:` に置かず**、D1 実行 step に step-scoped env として渡す（setup/install step への漏洩防止）。`CLOUDFLARE_ACCOUNT_ID` も verify / run step にだけ渡す。

```yaml
  bulk-tag-runtime-smoke:
    runs-on: ubuntu-latest
    environment: staging-runtime-smoke
    timeout-minutes: 10
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
      STAGING_AUTH_SECRET: ${{ secrets.STAGING_AUTH_SECRET }}
      CLOUDFLARE_ENV: staging
      # CLOUDFLARE_API_TOKEN は job-level に置かない（env-scope gate）。D1 実行 step にだけ step-scoped で渡す。
    steps:
      - uses: actions/checkout@v4

      - name: setup project
        uses: ./.github/actions/setup-project

      # 静的 bearer の代わりに短命 admin JWT を mint（STAGING_AUTH_SECRET があれば）。
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
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          missing=()
          for name in STAGING_API_BASE STAGING_ADMIN_BEARER CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
            if [ -z "${!name:-}" ]; then
              missing+=("$name")
            fi
          done
          if [ "${#missing[@]}" -gt 0 ]; then
            printf "::error::missing secrets in environment 'staging-runtime-smoke': %s\n" "${missing[*]}"
            exit 1
          fi

      - name: mask staging credentials
        run: |
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_API_BASE"

      # seed → smoke → cleanup を 1 runner に委譲（runner 内 trap で cleanup always）。
      - name: run bulk tag runtime smoke
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}  # cf.sh d1 用（step-scoped）
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          CF_SH_SKIP_WITH_ENV: "1"
        run: |
          mkdir -p ci-evidence-bulk-tag
          bash scripts/smoke/runtime-tag-bulk.sh staging --out-dir ci-evidence-bulk-tag --ci-summary

      - name: redaction grep gate
        if: always()
        run: |
          leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|hooks\.slack\.com/services/[A-Z0-9]|xox[bp]-' ci-evidence-bulk-tag/ || true)"
          if [ -n "$leak_files" ]; then
            echo "::error::redaction grep gate failed"
            printf '%s\n' "$leak_files" | sed 's#^#leak-candidate-file=#'
            exit 1
          fi

      - name: upload evidence artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bulk-tag-runtime-smoke-staging-${{ github.run_id }}
          path: ci-evidence-bulk-tag/
          retention-days: 30
```

> **cleanup 境界**: cleanup は runner 内 `trap ... cleanup ... EXIT` で実行する。CI 側は artifact upload / redaction grep を `always()` にし、D1 token は runner step だけに閉じる。

---

## Step 5: `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（NEW）

`runtime-admin-web.test.sh` を雛形に、real D1 接続なしで runner の関数を検証する。curl / cf.sh を PATH stub で差し替える。詳細ケースは Phase 4 / Phase 6 を正本とする。本 Step では「stub 機構」と検証観点のみ規定する。

- `make_curl_stub <dir> <mode>`: `assign` / `assign-retry-noop` / `unassign` / `non200` モードで固定 JSON response（`{"batchId":"e2e...","results":[{...,"status":"assigned"}, ...]}`）を返す。
- `make_cf_stub <dir> <mode>`: `scripts/cf.sh` を差し替え、`d1 execute --command "SELECT count(...)"` に対し `[{"results":[{"c":N}]}]` 形式を返す。seed/cleanup の `--file` は no-op 成功（exit 0）。
- 検証観点（Phase 4/6 で test 化）:
  - 引数なし / `staging` 以外 env → exit 2
  - production marker（`STAGING_API_BASE=https://...-production...`）→ exit 2（AC-6）
  - 必須 env 欠落 → exit 2
  - assign stub → 全 assigned 集計 PASS（AC-1）
  - retry stub（全 noop）＋ audit count 同値 stub → PASS / audit count drift stub → exit 1（AC-2）
  - unassign stub → 全 unassigned ＋ audit 増分 → PASS（AC-3）
  - cleanup 後 count!=0 stub → exit 1（AC-4）
  - `runtime-smoke.log` に bearer 平文が残らない（redaction・AC-5）
  - runner に `wrangler ` 直書きが無い（grep gate）

---

## 実装順序

1. Step 1（seed SQL）→ Step 2（cleanup SQL）→ seed-syntax test（Phase 4）GREEN
2. Step 3（runner）→ Step 5（test.sh）GREEN（curl / cf.sh stub 下）
3. Step 4（CI job 追加）→ actionlint GREEN
4. `pnpm typecheck` / `pnpm lint` / `shellcheck` GREEN

## 完了判定

- [x] 成果物 5 点のファイル別実装手順を、関数シグネチャ・SQL 骨格・YAML 骨格付きで定義
- [x] 実テーブル / カラム名（`member_identities` / `member_responses` / `member_status` / `tag_definitions` / `member_tags` / `audit_log`）に沿った SQL を記述（推測なし）
- [x] AC-1〜AC-7 と runner orchestration / CI job / cleanup always を対応付け
- [x] 不変条件（cf.sh 経由 / redaction / production guard / e2e_test_issue1081_ 限定）を全 Step で遵守
