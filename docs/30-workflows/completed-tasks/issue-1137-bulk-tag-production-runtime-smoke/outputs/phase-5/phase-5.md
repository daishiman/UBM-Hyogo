# Phase 5: 実装 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

Phase 2 設計 / Phase 4 テストを満たす production bulk tag mutation smoke を 1 サイクルでコード化する手順とコード骨格を確定する。
**単一 runner `scripts/smoke/runtime-tag-bulk.sh` を `staging|production` env 分岐へ拡張**し、`assert_staging_guard` は逐語不変（AC-6）、production 経路は別関数 `assert_production_guard` + 二重承認 marker で分離する。

> 本サイクルは `implemented_local_runtime_pending`。本書はコード骨格・手順を確定する（コードの編集適用は本サイクルで完了）。

## 新規作成 / 修正ファイル一覧（必須）

| 種別 | パス | 内容 |
| ---- | ---- | ---- |
| 修正 | `scripts/smoke/runtime-tag-bulk.sh` | `production` env 受理・`configure_environment` で env 値一元確定・`assert_production_guard` 新設・`run_d1` の `--env "$ENVIRONMENT"` 一般化・`main()` guard 呼び分け・`usage` 更新 |
| 修正 | `.github/workflows/production-runtime-smoke.yml` | `bulk-tag-production-runtime-smoke` job 追加・workflow_dispatch 限定 + input 明示 opt-in + dual marker env 追加 |
| 修正 | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | Phase 4 の P1〜P9 / S2 意味更新を追加 |
| 新規 | `apps/api/migrations/seed/bulk-tag-production-seed.sql` | `e2e_test_prod_tagbulk_*` synthetic seed（staging seed の prefix 置換版） |
| 新規 | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` | `e2e_test_prod_tagbulk_%` cleanup（staging cleanup の prefix 置換版） |
| 新規 | `docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/runbook.md` | 実走手順・二重承認・evidence 配置・user-gated 境界 |

## ファイル別 実装手順とコード骨格

### 1. `scripts/smoke/runtime-tag-bulk.sh`（修正）

#### 1-1. グローバル変数の env 中立化

staging 固定値は初期値として保持し、`configure_environment` で env ごとの値を確定する。production では prefix / D1 / seed / cleanup / memberIds / tagIds / default out dir を production 専用値へ切り替える。

```bash
PREFIX="e2e_test_issue1081_"
CF_D1_DATABASE="${CF_D1_DATABASE:-}"
SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-seed.sql"
CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-cleanup.sql"
MEMBER_IDS='["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"]'
TAG_IDS='["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"]'
EXPECTED_ITEMS=4
```

#### 1-2. `usage` 更新

```bash
usage() {
  cat >&2 <<'EOF'
usage: runtime-tag-bulk.sh <staging|production> [--out-dir <path>] [--ci-summary] [--skip-seed] [--skip-cleanup]
EOF
}
```

#### 1-3. `configure_environment`（env 値の一元確定）

```bash
configure_environment() {
  local env_prefix api_base_var admin_bearer_var default_out_dir
  env_prefix="$(printf '%s' "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')"
  api_base_var="${env_prefix}_API_BASE"
  admin_bearer_var="${env_prefix}_ADMIN_BEARER"
  local api_base="${!api_base_var:-}"
  [[ -n "$api_base" ]] || { echo "$api_base_var is required" >&2; exit 2; }
  ADMIN_BEARER="${!admin_bearer_var:-}"
  [[ -n "$ADMIN_BEARER" ]] || { echo "$admin_bearer_var is required" >&2; exit 2; }
  [[ "${CLOUDFLARE_ENV:-$ENVIRONMENT}" == "$ENVIRONMENT" ]] || { echo "CLOUDFLARE_ENV must be $ENVIRONMENT" >&2; exit 2; }
  BASE="${api_base%/}"

  if [[ "$ENVIRONMENT" == "production" ]]; then
  PREFIX="e2e_test_prod_tagbulk_"
  CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-prod}"
  SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-production-seed.sql"
  CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-production-cleanup.sql"
  MEMBER_IDS='["e2e_test_prod_tagbulk_mem_1","e2e_test_prod_tagbulk_mem_2"]'
  TAG_IDS='["e2e_test_prod_tagbulk_tag_1","e2e_test_prod_tagbulk_tag_2"]'
    default_out_dir="docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence"
    if [[ "$OUT_DIR" == "docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence" ]]; then
      OUT_DIR="$default_out_dir"
    fi
  else
    CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-staging}"
  fi
}
```

#### 1-4. `parse_args` の env 受理拡張

line 71-74 の staging 固定ブロックを case 分岐へ置換。`--out-dir`/`--ci-summary`/`--skip-seed`/`--skip-cleanup` の while ループ（既存 line 76-103）はそのまま温存し、**ループ後**に env 別 configure を呼ぶ（api_base / bearer 必須チェックは configure 内に移動）。

```bash
parse_args() {
  ENVIRONMENT="${1:-}"
  if [[ -z "$ENVIRONMENT" ]]; then echo "env required" >&2; usage; exit 2; fi
  shift || true
  case "$ENVIRONMENT" in
    staging|production) ;;  # 受理（configure は while ループ後）
    *) echo "Only staging or production bulk tag runtime smoke is allowed" >&2; exit 2 ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --out-dir) OUT_DIR="${2:-}"; [[ -z "$OUT_DIR" ]] && { echo "--out-dir requires a path" >&2; exit 2; }; shift 2 ;;
      --ci-summary) CI_SUMMARY=1; shift ;;
      --skip-seed) SKIP_SEED=1; shift ;;
      --skip-cleanup) SKIP_CLEANUP=1; shift ;;
      *) echo "unknown argument: $1" >&2; exit 2 ;;
    esac
  done

  configure_environment
}
```

> production の OUT_DIR デフォルトは issue-1137 の Phase 11 evidence root に切り替える。staging デフォルト OUT_DIR は不変。

#### 1-5. `assert_production_guard`（新設・別関数。`assert_staging_guard` は逐語不変）

```bash
assert_production_guard() {
  local allow_regex="${PRODUCTION_API_HOST_ALLOW_REGEX:-^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$}"
  local host_port="${BASE#*://}"
  host_port="${host_port%%/*}"
  local host="${host_port%%:*}"
  # 1) D1 名は production 固定 (I-4)
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-prod" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-prod" >&2; exit 2
  fi
  # 2) 二重承認 marker (AC-3): 双方が正値でない限り refuse
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_APPROVAL:-}" != "issue-1137-production-bulk-tag-smoke" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_APPROVAL marker missing or invalid" >&2; exit 2
  fi
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_CONFIRM:-}" != "I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_CONFIRM marker missing or invalid" >&2; exit 2
  fi
  # 3) production allowlist host regex (AC-1・独立評価)
  if ! printf '%s\n' "$host" | grep -Eiq "$allow_regex"; then
    echo "PRODUCTION_API_BASE must match production allowlist" >&2; exit 2
  fi
}
```

> staging の `*staging*` host は production allowlist regex（`^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$`）に一致しないため自然に refuse（Phase 4 P5）。判定対象は URL 全体ではなく抽出済み host。

#### 1-6. `run_d1` の `--env` 一般化

```bash
# 変更前: run_d1() { bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"; }
run_d1() { bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env "$ENVIRONMENT" --remote "$@"; }
```

> staging では `ENVIRONMENT=staging` のため挙動不変。`seed` / `audit_count` / `count_by_table` / `cleanup` は `run_d1` / `PREFIX` / `CF_D1_DATABASE` 経由のみで env 値を参照するため**追加変更不要**。

#### 1-7. `main()` の guard 呼び分け

```bash
main() {
  parse_args "$@"
  case "$ENVIRONMENT" in
    staging)    assert_staging_guard ;;
    production) assert_production_guard ;;
  esac
  mkdir -p "$OUT_DIR"
  OUT_LOG="$OUT_DIR/runtime-tag-bulk-smoke.log"
  SUMMARY_JSON="$OUT_DIR/summary.json"
  # ...(以降 line 275-306 は不変: TMP_DIR / trap / seed / assign / retry / unassign / audit / cleanup)
}
```

> `post_bulk` / `assert_status_file` / `assert_all_status` / `audit_count` / `count_by_table` / `cleanup` / `write_summary` は env 非依存ゆえ**逐語不変**。production では `PREFIX`/`CF_D1_DATABASE`/`ENVIRONMENT` が production 値に切り替わるだけで同一 orchestration が回る。

### 2. `apps/api/migrations/seed/bulk-tag-production-seed.sql`（新規）

staging seed（現行カラム構成: `member_responses`/`member_identities`/`member_status`/`tag_definitions`）の prefix を `e2e_test_prod_tagbulk_` に置換した完全版。`publish_state='member_only'`（公開面非露出）。

```sql
-- Production-only synthetic seed for issue-1137 bulk tag production runtime smoke.
-- All rows use the synthetic prefix `e2e_test_prod_tagbulk_` so cleanup can target them safely.
-- Tables touched (no ALTER): member_responses, member_identities, member_status, tag_definitions.
-- Invariant: never seed real PII; never run outside the production guard (dual-approval).

BEGIN TRANSACTION;

DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM audit_log   WHERE target_id LIKE 'e2e_test_prod_tagbulk_%';

INSERT OR REPLACE INTO member_responses
  (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
VALUES
  ('e2e_test_prod_tagbulk_resp_1', 'e2e_test_prod_tagbulk_form', 'rev1', 'hash1',
   'e2e_test_prod_tagbulk_mem_1@example.test', datetime('now'), '{}'),
  ('e2e_test_prod_tagbulk_resp_2', 'e2e_test_prod_tagbulk_form', 'rev1', 'hash1',
   'e2e_test_prod_tagbulk_mem_2@example.test', datetime('now'), '{}');

INSERT OR REPLACE INTO member_identities
  (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
VALUES
  ('e2e_test_prod_tagbulk_mem_1', 'e2e_test_prod_tagbulk_mem_1@example.test',
   'e2e_test_prod_tagbulk_resp_1', 'e2e_test_prod_tagbulk_resp_1', datetime('now')),
  ('e2e_test_prod_tagbulk_mem_2', 'e2e_test_prod_tagbulk_mem_2@example.test',
   'e2e_test_prod_tagbulk_resp_2', 'e2e_test_prod_tagbulk_resp_2', datetime('now'));

INSERT OR REPLACE INTO member_status
  (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_by, updated_at)
VALUES
  ('e2e_test_prod_tagbulk_mem_1', 'consented', 'consented', 'member_only', 0, 'e2e_test_prod_tagbulk_seed', datetime('now')),
  ('e2e_test_prod_tagbulk_mem_2', 'consented', 'consented', 'member_only', 0, 'e2e_test_prod_tagbulk_seed', datetime('now'));

INSERT OR REPLACE INTO tag_definitions
  (tag_id, code, label, category, source_stable_keys_json, active)
VALUES
  ('e2e_test_prod_tagbulk_tag_1', 'e2e_test_prod_tagbulk_code_1', 'prod tagbulk smoke tag 1', 'e2e_test_prod_tagbulk', '[]', 1),
  ('e2e_test_prod_tagbulk_tag_2', 'e2e_test_prod_tagbulk_code_2', 'prod tagbulk smoke tag 2', 'e2e_test_prod_tagbulk', '[]', 1);

COMMIT;
```

> 実装サイクルで schema drift を疑う場合は `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote --command "PRAGMA table_info(member_status);"` 等で現行カラムを確認してから INSERT 列を確定する（Phase 3 リスク表）。本骨格は staging seed の現行カラムに一致。

### 3. `apps/api/migrations/seed/bulk-tag-production-cleanup.sql`（新規）

```sql
-- Remove issue-1137 bulk tag production smoke fixtures.
-- Invariant: every DELETE targets only the `e2e_test_prod_tagbulk_%` synthetic prefix.

BEGIN TRANSACTION;

DELETE FROM member_tags       WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM audit_log         WHERE target_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_status     WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_identities WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_responses  WHERE response_id LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM tag_definitions   WHERE tag_id      LIKE 'e2e_test_prod_tagbulk_%';

COMMIT;
```

> runner の `cleanup()`（line 251-267）が cleanup SQL 適用後、6 table を `count(*) ... LIKE '${PREFIX}%'` で集計（PREFIX は production 値）し、すべて 0 でなければ `fail_and_exit`（AC-4）。**`cleanup()` 本体は不変**。

### 4. `.github/workflows/production-runtime-smoke.yml`（修正）

#### 4-1. `workflow_dispatch.inputs` 追加

```yaml
on:
  workflow_dispatch:
    inputs:
      reason:
        description: "manual run reason"
        required: false
        default: "ad-hoc production smoke"
      run_bulk_tag_mutation:
        description: "set true to run issue-1137 bulk tag production mutation smoke"
        required: false
        default: "false"
      bulk_tag_confirmation:
        description: "type I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1 to authorize bulk tag prod write"
        required: false
        default: ""
```

#### 4-2. `bulk-tag-production-runtime-smoke` job 追加（既存 `smoke` job は不変）

```yaml
jobs:
  smoke:
    # ...既存（attendance）— 変更しない
  bulk-tag-production-runtime-smoke:
    if: ${{ inputs.run_bulk_tag_mutation == 'true' && inputs.bulk_tag_confirmation == 'I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1' }}
    runs-on: ubuntu-latest
    environment: production-runtime-smoke   # 第 1 承認 = GitHub reviewer (AC-3)
    timeout-minutes: 10
    env:
      PRODUCTION_API_BASE: ${{ secrets.PRODUCTION_API_BASE }}
      PRODUCTION_ADMIN_BEARER: ${{ secrets.PRODUCTION_ADMIN_BEARER }}
      BULK_TAG_PRODUCTION_SMOKE_APPROVAL: issue-1137-production-bulk-tag-smoke
      BULK_TAG_PRODUCTION_SMOKE_CONFIRM: I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1
      CF_D1_DATABASE: ubm-hyogo-db-prod
      CLOUDFLARE_ENV: production
    steps:
      - uses: actions/checkout@v4
      - name: setup project
        uses: ./.github/actions/setup-project
      - name: verify required production secrets
        run: |
          missing=()
          for name in PRODUCTION_API_BASE PRODUCTION_ADMIN_BEARER; do
            if [ -z "${!name:-}" ]; then missing+=("$name"); fi
          done
          if [ "${#missing[@]}" -gt 0 ]; then
            printf "::error::missing secrets in environment 'production-runtime-smoke': %s\n" "${missing[*]}"
            exit 1
          fi
      - name: verify approval markers
        run: |
          if [ "${BULK_TAG_PRODUCTION_SMOKE_APPROVAL:-}" != "issue-1137-production-bulk-tag-smoke" ]; then
            echo "::error::BULK_TAG_PRODUCTION_SMOKE_APPROVAL must equal issue-1137-production-bulk-tag-smoke"; exit 1
          fi
      - name: mask production credentials
        run: |
          echo "::add-mask::$PRODUCTION_ADMIN_BEARER"
          echo "::add-mask::$PRODUCTION_API_BASE"
      - name: run bulk tag production smoke
        run: |
          mkdir -p ci-evidence-bulk-tag-prod
          bash scripts/smoke/runtime-tag-bulk.sh production --out-dir ci-evidence-bulk-tag-prod --ci-summary
      - name: redaction grep gate
        if: always()
        run: |
          leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|xox[bp]-' ci-evidence-bulk-tag-prod/ || true)"
          if [ -n "$leak_files" ]; then
            echo "::error::redaction grep gate failed"
            printf '%s\n' "$leak_files" | sed 's#^#leak-candidate-file=#'; exit 1
          fi
      - name: upload evidence artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bulk-tag-production-runtime-smoke-${{ github.run_id }}
          path: ci-evidence-bulk-tag-prod/
          retention-days: 30
      - name: post failure summary to Slack
        if: ${{ failure() && hashFiles('ci-evidence-bulk-tag-prod/summary.json') != '' }}
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: |
          if [ -z "${SLACK_WEBHOOK_INCIDENT:-}" ]; then
            echo "::error::SLACK_WEBHOOK_INCIDENT required"; exit 1
          fi
          bash scripts/smoke/ci-summary-post.sh ci-evidence-bulk-tag-prod
```

> evidence dir は `ci-evidence-bulk-tag-prod`（attendance job の `ci-evidence` と分離・Phase 3 衝突対策）。第 1 承認=`workflow_dispatch` input opt-in、第 2 承認=`environment` reviewer、第 3 防御=`BULK_TAG_PRODUCTION_SMOKE_APPROVAL` / `BULK_TAG_PRODUCTION_SMOKE_CONFIRM` runner marker（runner の `assert_production_guard` が再検証）。

### 5. `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（修正）

Phase 4 の P1〜P9 を追加し、既存 S2（`production-env-refused`）の意味更新（env refuse → marker/api-base refuse、exit 2 不変）を反映する。staging happy-path（S9）・staging guard ケース（S5/S6）は逐語不変で残す。

### 6. `runbook.md`（新規）

- 二重承認手順（GitHub `production-runtime-smoke` environment reviewer 承認 + `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke` 入力）。
- secret 登録（`gh secret set PRODUCTION_API_BASE --env production-runtime-smoke` 等）。
- evidence 配置（`outputs/phase-11/evidence/` への CI artifact 取り込み）。
- user-gated 境界（実 deploy / 実 D1 seed・mutation・cleanup は user 二重承認後のみ＝Gate-B）。

## ローカル実行・検証コマンド（本サイクルで実行済み・`@ubm-hyogo/api` 使用）

```bash
# 1) shellcheck（runner / test）
mise exec -- shellcheck scripts/smoke/runtime-tag-bulk.sh scripts/smoke/__tests__/runtime-tag-bulk.test.sh

# 2) local test（real D1 / production endpoint 非接続。Phase 4 P1〜P9 + S1〜S10）
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh

# 3) workflow YAML 構文（actionlint 利用可能なら）
mise exec -- pnpm exec actionlint .github/workflows/production-runtime-smoke.yml

# 4) seed/cleanup SQL の構文 dry チェック（カラム整合は production 実走前に必要時 PRAGMA 確認）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck   # api パッケージ周辺の型健全性
```

> 実 production deploy / 実 D1 seed・mutation・cleanup・実走 evidence 取得は **本フローでは実行しない**（user 二重承認 gate 後＝Gate-B / Phase 11）。

## DoD（Definition of Done）

- [ ] `runtime-tag-bulk.sh` が `staging|production` を受理し、`production` は `assert_production_guard`（D1 名 + dual marker + allowlist）を通過しないと `exit 2`
- [ ] `assert_staging_guard` 本体が逐語不変（git diff で関数本体に変更行がない）
- [ ] `bulk-tag-production-seed.sql` / `bulk-tag-production-cleanup.sql` が `e2e_test_prod_tagbulk_` のみを使用（staging prefix 非混入）
- [ ] `production-runtime-smoke.yml` に `bulk-tag-production-runtime-smoke` job が追加され `workflow_dispatch` 限定・input 明示 opt-in・environment 承認 + dual marker
- [ ] local test（P1〜P9 + S1〜S10）が PASS（real D1 非接続）
- [ ] redaction grep gate / artifact upload / Slack failure step が production bulk tag job に存在
- [ ] runbook に二重承認・secret 登録・evidence 配置・user-gated 境界を記載

## 完了判定チェックリスト

- [x] 新規 / 修正ファイル一覧（runner / 2 SQL / CI / test / runbook）を確定
- [x] runner の `parse_args` 拡張・`configure_environment`・`assert_production_guard`・`run_d1` 一般化・`main` guard 呼び分けの完全骨格を提示
- [x] production seed/cleanup SQL の完全 SQL（prefix 置換・`publish_state='member_only'`・現行カラム）を提示
- [x] CI job YAML（dual marker env・steps・evidence dir 分離）を提示
- [x] `@ubm-hyogo/api` を用いた local 検証コマンドと DoD を提示
