# Phase 2: 設計 — issue-1137-bulk-tag-production-runtime-smoke

## 目的

Phase 1 で固定した AC-1〜AC-8 / 不変条件 I-1〜I-7 を満たす production bulk tag mutation smoke の topology・runner 構造・guard 関数・production seed/cleanup SQL・CI job・local test の設計を確定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存資産 | 再利用 | 理由 |
| -------- | ------ | ---- |
| `scripts/smoke/runtime-tag-bulk.sh` の orchestration（`seed` / `post_bulk` / `assert_status_file` / `audit_count` / `count_by_table` / `cleanup` / `write_summary`） | ✅ そのまま再利用 | bulk assign→retry noop→unassign→audit→cleanup の段階構造は env 非依存。env 別の prefix/SQL/D1/allowlist を変数化すれば production でも成立 |
| `assert_staging_guard` | ✅ 逐語不変で温存 | AC-6 / I-7。production 経路は別関数 `assert_production_guard` |
| `scripts/smoke/runtime-admin-web.sh`（#922） | ✅ パターン参照 | `ENVIRONMENT` を `staging\|production` で受理し、env 別 allowlist regex を `${!VAR}` で切替える設計を踏襲 |
| `redact.sh` / `cf.sh` | ✅ 再利用 | redaction / wrangler ラッパー |
| `production-runtime-smoke.yml` | ✅ job 追加先 | `workflow_dispatch` 限定 + `environment: production-runtime-smoke` + secret 検証 + redaction grep gate + artifact upload の構造を踏襲 |
| staging seed/cleanup SQL | ⚠️ 雛形参照のみ | prefix を `e2e_test_prod_tagbulk_` に置換した production 専用 SQL を**別ファイル新規作成**（staging SQL は不変） |

→ **新規 UI 実装ゼロ**（NON_VISUAL）。既存 runner の env 分岐拡張 + production 専用 SQL/CI job/test 追加で AC を満たす。

## Topology（実行フロー）

```
[user 二重承認]  BULK_TAG_PRODUCTION_SMOKE_APPROVAL + BULK_TAG_PRODUCTION_SMOKE_CONFIRM を環境に設定
        ↓
runtime-tag-bulk.sh production --out-dir <evidence> --ci-summary
        ↓
parse_args(production)  → PRODUCTION_API_BASE / PRODUCTION_ADMIN_BEARER 必須
        ↓
assert_production_guard  ── ✗ (allowlist 不一致 / marker 欠落 / D1 名不一致) → exit 2
        │ ✓
        ↓
seed (bulk-tag-production-seed.sql)         … cf.sh d1 execute ubm-hyogo-db-prod --env production --remote
        ↓
post_bulk assign → assert results[].status all == "assigned"   (AC-1 相当)
        ↓
audit_count(tag_assigned) = before
post_bulk assign-retry → assert all == "noop"
audit_count(tag_assigned) = after ; assert before == after      (冪等・AC-5)
        ↓
post_bulk unassign → assert all == "unassigned"
audit_count(tag_unassigned) 増分 assert                          (AC-5)
        ↓
cleanup (bulk-tag-production-cleanup.sql) → 6 table 残件 0 assert (AC-4)
        ↓
write_summary (summary.json)  + redacted log                     (AC-7)
        ↓ (trap EXIT で cleanup を必ず実行)
```

## runner 設計（`scripts/smoke/runtime-tag-bulk.sh` 編集）

### 状態所有権（変数の env 分岐）

env 別に切り替える変数を `parse_args` 後に確定させる。staging のデフォルト値は現状維持。

| 変数 | staging（現状不変） | production（追加） |
| ---- | ------------------- | ------------------ |
| `PREFIX` | `e2e_test_issue1081_` | `e2e_test_prod_tagbulk_` |
| `CF_D1_DATABASE` | `ubm-hyogo-db-staging` | `ubm-hyogo-db-prod` |
| `SEED_SQL` | `bulk-tag-staging-seed.sql` | `bulk-tag-production-seed.sql` |
| `CLEANUP_SQL` | `bulk-tag-staging-cleanup.sql` | `bulk-tag-production-cleanup.sql` |
| `MEMBER_IDS` | `["e2e_test_issue1081_mem_1","..._mem_2"]` | `["e2e_test_prod_tagbulk_mem_1","..._mem_2"]` |
| `TAG_IDS` | `["e2e_test_issue1081_tag_1","..._tag_2"]` | `["e2e_test_prod_tagbulk_tag_1","..._tag_2"]` |
| `run_d1` の `--env` | `ENVIRONMENT=staging` | `ENVIRONMENT=production` |
| API base env | `STAGING_API_BASE` | `PRODUCTION_API_BASE` |
| admin bearer env | `STAGING_ADMIN_BEARER` | `PRODUCTION_ADMIN_BEARER` |
| allowlist regex env | `STAGING_API_HOST_ALLOW_REGEX`（既定 `staging\|127.0.0.1\|localhost`） | `PRODUCTION_API_HOST_ALLOW_REGEX`（既定 `^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev\|api\.ubm-hyogo\.workers\.dev)$`、URL host 限定） |
| guard 関数 | `assert_staging_guard`（不変） | `assert_production_guard`（新設） |

### `parse_args` の変更（env 受理拡張）

```bash
# 変更前: staging 以外を exit 2
#   if [[ "$ENVIRONMENT" != "staging" ]]; then exit 2; fi
# 変更後: staging | production を受理し、env ごとに変数を確定する
case "$ENVIRONMENT" in
  staging|production) ;;
  *) echo "Only staging or production bulk tag runtime smoke is allowed" >&2; exit 2 ;;
esac
configure_environment
```

- `configure_environment`: `ENVIRONMENT` から `STAGING_*` / `PRODUCTION_*` の API base / bearer env 名を動的に選ぶ。production では上表の production 値へ切り替え、staging では既存値を保持する。
- `CLOUDFLARE_ENV` チェックは env に応じて `staging` / `production` を要求するよう一般化（staging 分岐は現状の `staging` 固定挙動を維持）。

### `assert_production_guard`（新設・別関数）

```bash
assert_production_guard() {
  local allow_regex="${PRODUCTION_API_HOST_ALLOW_REGEX:-^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$}"
  local host_port="${BASE#*://}"
  host_port="${host_port%%/*}"
  local host="${host_port%%:*}"
  # 1) D1 名は production 固定
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-prod" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-prod" >&2; exit 2
  fi
  # 2) 二重承認 marker（双方が正値でない限り refuse・AC-3）
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_APPROVAL:-}" != "issue-1137-production-bulk-tag-smoke" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_APPROVAL marker missing or invalid" >&2; exit 2
  fi
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_CONFIRM:-}" != "I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_CONFIRM marker missing or invalid" >&2; exit 2
  fi
  # 3) production allowlist host regex（独立評価・AC-1）
  if ! printf '%s\n' "$host" | grep -Eiq "$allow_regex"; then
    echo "PRODUCTION_API_BASE must match production allowlist" >&2; exit 2
  fi
}
```

- staging URL（`*staging*`）は production allowlist regex に一致しないため自然に refuse される。
- staging guard とは独立。staging 分岐では決して呼ばれない。
- `main()` で `parse_args` 後に env に応じて `assert_staging_guard` / `assert_production_guard` を呼び分ける。

### `run_d1` の env 一般化

```bash
# 変更前: --env staging 固定
#   bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"
# 変更後: env 変数化（staging では ENVIRONMENT=staging で挙動不変）
run_d1() { bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env "$ENVIRONMENT" --remote "$@"; }
```

### redaction / contract 検証

- `post_bulk` / `assert_status_file` / `audit_count` / `count_by_table` / `cleanup` / `write_summary` は env 非依存のため変更なし。`PREFIX` / `CF_D1_DATABASE` / `ENVIRONMENT` が production 値に切り替わるだけで production にも適用される。
- ログ出力先は `--out-dir` で受ける（CI は production evidence dir、local は workflow root の `outputs/phase-11/evidence`）。

## production seed SQL 設計（`bulk-tag-production-seed.sql` 新規）

staging seed と同一構造で prefix のみ `e2e_test_prod_tagbulk_` に置換。touch する table（ALTER なし）: `member_responses` / `member_identities` / `member_status` / `tag_definitions`。冒頭で `member_tags` / `audit_log` の同 prefix 行を先に DELETE（再実行安全）。

```sql
-- Production-only synthetic seed for issue-1137 bulk tag production runtime smoke.
-- All rows use the synthetic prefix `e2e_test_prod_tagbulk_` so cleanup can target them safely.
-- Invariant: never seed real PII; never run outside production guard (dual-approval).
BEGIN TRANSACTION;
DELETE FROM member_tags WHERE member_id LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM audit_log   WHERE target_id LIKE 'e2e_test_prod_tagbulk_%';
INSERT OR REPLACE INTO member_responses (...) VALUES ('e2e_test_prod_tagbulk_resp_1', ...), ('e2e_test_prod_tagbulk_resp_2', ...);
INSERT OR REPLACE INTO member_identities (...) VALUES ('e2e_test_prod_tagbulk_mem_1', ...), ('e2e_test_prod_tagbulk_mem_2', ...);
INSERT OR REPLACE INTO member_status (..., publish_state, is_deleted, ...) VALUES ('e2e_test_prod_tagbulk_mem_1','consented','consented','member_only',0,...), (...);
INSERT OR REPLACE INTO tag_definitions (..., active) VALUES ('e2e_test_prod_tagbulk_tag_1', ..., 1), ('e2e_test_prod_tagbulk_tag_2', ..., 1);
COMMIT;
```

- `publish_state = 'member_only'`（公開ディレクトリへ露出させない。本番公開面の汚染防止）。
- カラム構成は staging seed と同一（`member_responses` / `member_identities` / `member_status` / `tag_definitions` の現行 schema 準拠）。

## production cleanup SQL 設計（`bulk-tag-production-cleanup.sql` 新規）

```sql
-- Remove issue-1137 bulk tag production smoke fixtures.
-- Invariant: every DELETE targets only the `e2e_test_prod_tagbulk_%` synthetic prefix.
BEGIN TRANSACTION;
DELETE FROM member_tags        WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM audit_log          WHERE target_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_status      WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_identities  WHERE member_id   LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM member_responses   WHERE response_id LIKE 'e2e_test_prod_tagbulk_%';
DELETE FROM tag_definitions    WHERE tag_id      LIKE 'e2e_test_prod_tagbulk_%';
COMMIT;
```

- runner の `cleanup()` が cleanup SQL 適用後、6 table（`member_tags:member_id` / `audit_log:target_id` / `member_status:member_id` / `member_identities:member_id` / `member_responses:response_id` / `tag_definitions:tag_id`）を `count(*) ... LIKE 'e2e_test_prod_tagbulk_%'` で集計し、すべて 0 でなければ `fail_and_exit`（AC-4）。

## CI job 設計（`production-runtime-smoke.yml` に `bulk-tag-production-runtime-smoke` job 追加）

既存 `smoke`（attendance）job と関心分離した独立 job。**`workflow_dispatch` 限定**（既存 `on:` を継承・auto trigger なし）。

```yaml
jobs:
  smoke:                                   # 既存（attendance）— 変更しない
    ...
  bulk-tag-production-runtime-smoke:       # 新規
    runs-on: ubuntu-latest
    environment: production-runtime-smoke  # GitHub 承認 = 第 1 承認（AC-3）
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
      - uses: ./.github/actions/setup-project
      - name: verify required production secrets   # 欠落で exit 1（fail-closed）
      - name: mask production credentials          # ::add-mask::
      - name: run bulk tag production smoke
        run: bash scripts/smoke/runtime-tag-bulk.sh production --out-dir ci-evidence-bulk-tag-prod --ci-summary
      - name: redaction grep gate (if: always())   # 既存 smoke job と同一 grep パターン
      - name: upload evidence artifact (if: always())
      - name: post failure summary to Slack (if: failure())
```

`on.workflow_dispatch.inputs` に以下を追加:

| input | 用途 |
| ----- | ---- |
| | `BULK_TAG_PRODUCTION_SMOKE_APPROVAL` | runner marker `issue-1137-production-bulk-tag-smoke` |

- 第 1 承認 = `environment: production-runtime-smoke` の GitHub reviewer 承認。
- 第 2 承認 = runner dual marker（`BULK_TAG_PRODUCTION_SMOKE_APPROVAL` + `BULK_TAG_PRODUCTION_SMOKE_CONFIRM`）を job env と runner で検証。
- auto trigger なし（`workflow_dispatch` のみ）。CI 自動実行不可（AC-3）。

## local test 設計（`runtime-tag-bulk.test.sh` 編集）

既存ケースは保持（AC-6）。production guard 用ケースを追加（real D1 接続なし）。詳細は Phase 4。

| 追加ケース | 期待 |
| ---------- | ---- |
| production-no-approval-refused | production env + marker なし → exit 2 |
| production-single-approval-refused | APPROVAL_1 のみ（APPROVAL_2 欠落）→ exit 2 |
| production-wrong-host-refused | production env + 正 marker + 非 production URL → exit 2 |
| production-wrong-d1-refused | production env + `CF_D1_DATABASE != ubm-hyogo-db-prod` → exit 2 |
| staging-guard-non-regression | 既存 staging ケース（production-env-refused 等）が引き続き PASS |

## ライブラリ選定

新規サードパーティ依存なし。bash / jq / curl / `cf.sh` のみ（既存 runner と同一）。

## 因果ループ（システム思考）

- **バランスループ（安全）**: production 誤実行リスク↑ → guard 強化（allowlist + dual marker + D1 名）→ 誤実行可能性↓。
- **バランスループ（汚染防止）**: 本番データ汚染リスク↑ → fixture prefix 分離 + cleanup 残件 0 assert + trap EXIT cleanup → 残留↓。
- **強化ループ（信頼）**: production smoke 証跡↑ → deploy 後の bulk tag contract 信頼↑ → 手動確認コスト↓。

## 完了判定

- [x] runner の env 分岐設計（`configure_environment` / `assert_production_guard` / `run_d1` 一般化）を確定し、staging 挙動の不変を保証
- [x] production seed/cleanup SQL の構造・prefix・touch table を確定
- [x] production CI job（workflow_dispatch 限定 + input 明示 opt-in + 二重承認）の YAML 骨格を確定
- [x] local test 追加ケースを Phase 4 へ引き継ぎ
- [x] 状態所有権テーブル（env 別変数）で staging/production の責務境界を分離
