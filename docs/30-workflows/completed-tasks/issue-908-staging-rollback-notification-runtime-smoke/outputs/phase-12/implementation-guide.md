# Implementation Guide — issue-908-staging-rollback-notification-runtime-smoke

## Part 1: Plain-Language Summary

なぜ必要か: 親 issue-838 で実装した「rollback 通知」は、ローカルテストでは動作確認済みだが、**実 staging 環境で Slack/mail が本当に届くか・audit_log に記録されるか**の証拠が未取得だった。実運用前にこの証拠を残しておかないと、初回障害時に「通知の不具合」と「設定漏れ」を切り分けられない。

何をしたか: staging 環境で rollback を実行し通知 dispatch と audit 記録を実機確認するための **bash helper script** を追加し、3 ケース（正常 / 設定なし / 失敗）の実行結果を tracked evidence MD として親タスク配下に残せる仕組みを作った。再現性確保のため `--dry-run` モードと、機密情報を伏字化する `redact()` 関数を組み込んだ。

たとえば、消防設備の点検報告書のようなもの。設備（rollback 通知）は既に設置済みだが、「実際に火災ベルが鳴って警備会社に通報される」ことを記録した点検証跡を、運用前に1枚残す作業。

The smoke helper is best-effort and idempotent in dry-run mode. Real provider delivery is verified by human operator (Slack channel visual confirmation) plus audit_log query.

### 今回作ったもの

- `scripts/runtime-smoke/schema-alias-rollback.sh`: staging rollback smoke を再現実行するための bash helper（dry-run / redact / user-gate 付き）
- `outputs/phase-11/evidence/staging-smoke.md`（親 root 配下）: 3 ケース runtime evidence を redact 済で記録する tracked MD
- 親 `manual-test-result.md` / `artifacts.json` の pending cross-link と evidence_path 登録（status / gate の完了昇格は runtime 実行後）

## Part 2: Technical Summary

Added `scripts/runtime-smoke/schema-alias-rollback.sh` as a parameterized bash helper that wraps `curl POST /admin/schema/aliases/:aliasId/rollback` and `bash scripts/cf.sh d1 execute` for `audit_log` read. Secret values are sourced from `op://...` references via `op run --env-file=.env` and are never written to stdout/log unredacted. A `redact()` sed pipe replaces webhook URL paths, Bearer tokens, and `X-Auth-Key` values with `<REDACTED>` before any stdout emission.

The helper requires `--env <staging|production>` and `--alias <ID>`. The optional `--dry-run` flag suppresses all mutations (curl POST, cf.sh d1 mutation) and emits `[DRY-RUN]` planning output only. Without `--dry-run`, a `[USER-GATE]` confirm prompt blocks execution until the operator types `y`.

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh \
  --env staging --alias <TEST_ALIAS_ID> --scenario sent
```

### APIシグネチャ

bash helper のため CLI 形式:

```ts
type RuntimeSmokeEnv = "staging" | "production";
type RuntimeSmokeScenario = "sent" | "skipped" | "failed";

interface SchemaAliasRollbackSmokeOptions {
  env: RuntimeSmokeEnv;
  alias: string;
  scenario?: RuntimeSmokeScenario;
  dryRun?: boolean;
}
```

```
schema-alias-rollback.sh --env <staging|production> --alias <ID> [--dry-run] [--scenario <sent|skipped|failed>]
exit codes: 0=success, 1=usage/error, 2=user_abort
```

### 使用例

```bash
# 1. dry-run で計画確認
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias ali_test_001 --dry-run

# 2. 実行（user gate 経由）
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias ali_test_001 --scenario sent

# 3. audit_log 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT after_json FROM audit_log WHERE action='schema_alias.rollback_notification' ORDER BY created_at DESC LIMIT 1;"
```

### エラーハンドリング

helper は `set -euo pipefail` で fail-fast。curl/cf.sh の non-zero exit はそのまま伝搬。user-abort は exit 2 で区別。実 Slack/mail provider 失敗は親 implementation の best-effort try/catch が捕捉し、rollback HTTP 200 を維持する（AC-3）。

### エッジケース

- `--dry-run` 指定時: D1 mutation / curl POST いずれも発火しない（副作用ゼロ）
- staging secret 未投入: helper が op run 段階で fail（実値取得不可）。evidence MD には「未投入で skipped 検証」として記録
- staging deploy 未完了: rollback POST が 404 / 旧 implementation 経路。Phase 11 タスク2 で deploy 完了 version_id を記録してから実行

### 設定項目と定数一覧

| Name | Source | Purpose |
| --- | --- | --- |
| `STAGING_API_BASE` | `.env` (op://) | rollback POST 先 host |
| `STAGING_ADMIN_BEARER` | `.env` (op://) | admin Bearer token |
| `CLOUDFLARE_API_TOKEN` | `.env` (op://) | cf.sh d1 execute 用 |
| `schema_alias.rollback_notification` | 親 issue-838 で確定 | audit action |

### テスト構成

| Level | Subject |
| --- | --- |
| L0 | `bash -n` syntax check |
| L1 | `--dry-run` 副作用ゼロ |
| L2 | `redact()` の grep 検証（secret pattern 0 hit） |
| L3 | 3 ケース runtime smoke（user-gated） |
| L4 | `gate-metadata:validate` evidence_path 実在検証 |

## Files Changed

| Path | Change |
| --- | --- |
| `scripts/runtime-smoke/schema-alias-rollback.sh` | New: bash helper for staging rollback smoke (dry-run / redact / user-gate) |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` | New: 3-scenario runtime evidence MD (tracked) |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | Edit: pending cross-link to staging-smoke.md; `runtime_evidence_captured` status promotion remains runtime-gated |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | Edit: evidence_path registration while Phase 11 status / Gate-C remain pending until runtime evidence is captured |

## Verification Commands

```bash
bash -n scripts/runtime-smoke/schema-alias-rollback.sh
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy --dry-run
node scripts/gate-metadata/validate.ts
node scripts/verify-phase12-compliance.ts
mise exec -- pnpm indexes:rebuild
bash scripts/verify-pr-ready.sh
```

## Known Runtime Boundary

Provider delivery evidence (Slack channel visual + audit_log row) requires staging secrets and user-gated execution of the helper script. This boundary is captured in Phase 11 (`phase-11-manual-test.md`). Production smoke is out of scope and gated by separate release process.
