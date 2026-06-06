# 実装ガイド — issue-1081-bulk-tag-real-d1-runtime-smoke

## Part 1: 実装者向けナビ

### 背景（なぜ必要か）

会員へのタグ一括付与 endpoint `POST /admin/members/tags/bulk` は issue-1036 で実装済みで、local の in-memory D1 テストは全 GREEN です。しかし「Cloudflare staging に deploy された本物の D1 に対して、一括付与・再送 no-op・一括解除・監査ログ件数・後片付けが contract 通り成立するか」を自動で確認する仕組みがありません。既存の runtime smoke（attendance / `/admin` GET）は bulk tag endpoint を叩かないため、deploy のたびに contract が壊れても気付けない gap が残っています。本タスクはその回帰防止 gate を新設します。

### 要約（何をするか）

staging Workers + real D1 に対し「seed（前提投入）→ assign → 再送 noop → unassign → audit count parity → cleanup（後片付け）」を 1 本の runner（`runtime-tag-bulk.sh`）で orchestration し、CI job（user 承認 gate 付き）から呼べるようにしました。test fixture は全て `e2e_test_issue1081_` prefix の synthetic データで、real PII を含めず cleanup も同 prefix のみ削除します。本サイクルでコード化と local 検証は完了し、staging への実走証跡取得は user 承認後です。

### 変更ファイル一覧

| 区分 | パス | 概要 |
| ---- | ---- | ---- |
| NEW | `scripts/smoke/runtime-tag-bulk.sh` | orchestration runner（assert / redact / production guard / contract jq） |
| NEW | `apps/api/migrations/seed/bulk-tag-staging-seed.sql` | synthetic member / tag 投入 |
| NEW | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` | `e2e_test_issue1081_%` 限定削除 |
| EDIT | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` job 追加 |
| NEW | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | runner 関数の local 検証（curl / cf.sh stub） |

### 実行コマンド（実装 wave で GREEN 化する順）

```bash
# 1) local test（real D1 接続なし・curl / cf.sh は PATH stub で差し替え）
bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh
# 2) CI workflow 構文検証
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml
# 3) 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

> staging 実走（seed / bulk mutation / cleanup の real D1 書き込み）は user 承認後のみ。`runtime-tag-bulk.sh staging --out-dir <dir> --ci-summary` を実行し evidence を取得する。

### runner の段階構造（要約）

runner は次の順で段階実行します。各段で contract 違反・non-200・残件 != 0 を検出したら `fail_and_exit` で停止します。cleanup は `trap ... EXIT` で smoke の成否に関わらず必ず走らせます。

1. `resolve_env` — env / flags / 必須 secret 解決
2. `assert_staging_guard` — production 誤実行 guard（最優先・AC-6）
3. `seed` — synthetic 前提投入（AC 前提）
4. assign → `assert_status assigned 4`（AC-1）
5. 再送 assign → `assert_status noop 4` + audit count 不変（AC-2）
6. unassign → `assert_status unassigned 4` + audit count 増分（AC-3）
7. `cleanup`（trap）— `e2e_test_issue1081_%` 削除 + 残件 0 assert（AC-4）

### 既知の制限

- staging secret（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `CLOUDFLARE_API_TOKEN`）と `CLOUDFLARE_ACCOUNT_ID` 未設定環境では CI job が fail-closed します。実 D1 mutation smoke の false green を避けるため、skip ではなく環境不備として扱います。
- real D1 への seed / mutation / cleanup の実走証跡取得は user-gated（書き込み副作用 + production 誤実行リスクという本質理由による実行タイミング分離。先送り＝別 Issue 化ではない）。
- 本タスクは staging 固定。production への bulk mutation smoke は対象外（Phase 12 detection の将来候補）。

## Part 2: 実装詳細（技術者向け）

### 背景

bulk endpoint の実 contract は `200 + {batchId, results:[{memberId,tagId,status}]}`、status ∈ `assigned`/`noop`/`unassigned`/`skipped_deleted`/`tag_not_found`。audit は assigned → `admin.member.tag_assigned`（`after_json.batchId`）、unassigned → `admin.member.tag_unassigned`（`before_json.batchId`）のみ append され、noop / skipped_deleted / tag_not_found は append されない（冪等性の根拠）。member 解決は `member_identities` 存在 + `member_status.is_deleted`、tag 解決は `tag_definitions.active=1`。runner はこの shape を jq で検証する。

### 要約

`runtime-smoke-staging.yml` に既存 `smoke`（attendance）とは関心分離した `bulk-tag-runtime-smoke` job を追加し、`runtime-tag-bulk.sh`（新規・`runtime-attendance-provider.sh` 雛形）が D1 操作を全て `scripts/cf.sh d1 execute --env staging --remote` 経由（I-3）で行い、HTTP は `POST /admin/members/tags/bulk` のみ叩く。redaction は `redact.sh` 再利用、production guard は `assert_staging_guard` で `--env staging` 固定 + production marker / D1 名不一致時 exit 2。

### runner 関数シグネチャ（実装の正本）

```bash
resolve_env "$@"
#   第1引数 env を解析（staging 以外 exit 2）。--out-dir/--ci-summary/--skip-seed/--skip-cleanup を parse。
#   STAGING_API_BASE / STAGING_ADMIN_BEARER を :? 解決。BASE="${STAGING_API_BASE%/}"。

assert_staging_guard
#   $BASE が STAGING_API_HOST_ALLOW_REGEX（既定 'staging|127\.0\.0\.1|localhost'）に
#   マッチしなければ exit 2。production / ubm-hyogo-api-production 含有も exit 2。
#   CF_D1_DATABASE が ubm-hyogo-db-staging 以外なら exit 2。

run_d1 <--file path | --command sql> [--json]
#   bash "$REPO_ROOT/scripts/cf.sh" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@" の薄ラッパー。

seed                 # --skip-seed なら no-op。run_d1 --file bulk-tag-staging-seed.sql。失敗→fail_and_exit。
post_bulk <label> <op> <out_var_name>
#   POST $BASE/admin/members/tags/bulk（op=assign|unassign）。固定 payload（mem_1/2 × tag_1/2）。
#   -w "%{http_code}" + -o body_file。200 以外→fail_and_exit。body を redact してログ。batchId を out_var へ。
assert_status <label> <body_file> <expected_status> [<expected_count=4>]
#   jq '[.results[]|select(.status==$expected)]|length' == expected_count を assert。
#   .batchId|type=="string" も assert。不一致→fail_and_exit。
audit_count <action>
#   run_d1 --command "SELECT count(*) AS c FROM audit_log
#     WHERE action='$action' AND target_id LIKE 'e2e_test_issue1081_%';" --json → jq '.c' を echo。
cleanup              # --skip-cleanup なら no-op。run_d1 --file bulk-tag-staging-cleanup.sql。
#   その後 6 テーブルの e2e_test_issue1081_% 残件 count を取得し全 0 を assert（AC-4）。trap で always 実行。
emit_summary         # --ci-summary 時のみ summary.json（{status, checks:[...]} ・reason redact 済み）。
fail_and_exit <label> <status> <contract> [<reason>]   # OVERALL_STATUS=FAIL → summary 記録 → exit 1。
```

### seed/cleanup SQL の実テーブル名

seed が触れるテーブル（ALTER なし）: `member_responses`（2+1）/ `member_identities`（writable 2 + deleted 1）/ `member_status`（is_deleted=0 が 2 / is_deleted=1 が 1）/ `tag_definitions`（active=1 が 2 / active=0 が 1）。`member_tags` は seed しない（assign が新規 INSERT して `assigned` を返すことを検証するため初期未付与）。`INSERT OR REPLACE` で再 run 耐性を持たせる。

cleanup は子（smoke 生成物）→親（seed 行）順で、全 WHERE を例外なく prefix 限定にする:

```sql
BEGIN TRANSACTION;
DELETE FROM member_tags       WHERE member_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM audit_log         WHERE target_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM member_status     WHERE member_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM member_identities WHERE member_id   LIKE 'e2e_test_issue1081_%';
DELETE FROM member_responses  WHERE response_id LIKE 'e2e_test_issue1081_%';
DELETE FROM tag_definitions   WHERE tag_id      LIKE 'e2e_test_issue1081_%';
COMMIT;
```

> AC-4 不変条件: WHERE を外した全削除 / prefix を緩める変更は禁止。Phase 4 の seed-syntax test で「WHERE 無し DELETE が無い」を静的検査する。

### CI job YAML 骨格

```yaml
  bulk-tag-runtime-smoke:
    runs-on: ubuntu-latest
    environment: staging-runtime-smoke   # user approval gate
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
      - name: verify required staging secrets
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          missing=()
          for name in STAGING_API_BASE STAGING_ADMIN_BEARER CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
            if [ -z "${!name:-}" ]; then missing+=("$name"); fi
          done
          if [ "${#missing[@]}" -gt 0 ]; then
            printf "::error::missing secrets in environment 'staging-runtime-smoke': %s\n" "${missing[*]}"
            exit 1
          fi
      - name: run bulk tag runtime smoke
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}   # step-scoped
          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}
          CF_SH_SKIP_WITH_ENV: "1"
        run: |
          mkdir -p ci-evidence-bulk-tag
          bash scripts/smoke/runtime-tag-bulk.sh staging --out-dir ci-evidence-bulk-tag --ci-summary
      - name: redaction grep gate
        if: always()
        run: |
          leak="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|xox[bp]-' ci-evidence-bulk-tag/ || true)"
          if [ -n "$leak" ]; then echo "::error::redaction grep gate failed"; exit 1; fi
      - name: upload evidence artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bulk-tag-runtime-smoke-staging-${{ github.run_id }}
          path: ci-evidence-bulk-tag/
          retention-days: 30
```

### contract jq（runner が検証する shape）

```bash
# 全 results が期待 status か（件数一致）
jq --arg s assigned '[.results[] | select(.status==$s)] | length' "$body_file"   # == 4
# batchId が文字列か
jq -e '.batchId | type=="string"' "$body_file"
# audit count（冪等性 / parity）
SELECT count(*) AS c FROM audit_log
  WHERE action='admin.member.tag_assigned' AND target_id LIKE 'e2e_test_issue1081_%';
```

### 設定可能なパラメータ / 定数

| 名前 | 既定 | 用途 |
| ---- | ---- | ---- |
| `CF_D1_DATABASE` | `ubm-hyogo-db-staging` | seed/cleanup/audit count の対象 D1 |
| `STAGING_API_HOST_ALLOW_REGEX` | `staging\|127.0.0.1\|localhost` | target allowlist（production guard） |
| `EXPECTED_ITEMS` | `4` | writable member 2 × active tag 2 |
| synthetic prefix | `e2e_test_issue1081_` | seed / cleanup / audit query で統一 |

### エラーハンドリングとエッジケース

- env が `staging` 以外 / 必須 secret 欠落 / production marker → `exit 2`（AC-6）。
- non-200 / contract 違反 → `fail_and_exit ... → exit 1`（reason: status-mismatch / seed-failed）。
- 再送で audit count が増加 → `exit 1`（reason: audit-count-drift・AC-2）。
- unassign で audit count 不変 → `exit 1`（reason: audit-parity-missing・AC-3）。
- cleanup 後の prefix 残件 != 0 → `exit 1`（AC-4）。
- secret 未設定 CI → fail-closed（実 D1 mutation smoke の未実行を成功扱いしない）。

### 視覚証跡

NON_VISUAL（CI / runtime gate）のため Phase 11 screenshot は不要・生成禁止。代替証跡として `outputs/phase-11/phase-11.md`（local evidence 2 件 present / staging runtime evidence pending）と `outputs/phase-10/phase-10.md`（最終レビュー）を参照する。runtime evidence（runtime-smoke.log / summary.json / audit count log / cleanup log）は Gate-B 実走時に `outputs/phase-11/evidence/` へ tracked file として追加する。
