---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
mutation_commands:
  - "bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <TEST_ALIAS_ID>"
  - "bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command \"SELECT ... FROM audit_log ...\""
---

# Phase 5: 実装 — タスク仕様書

## メタ情報

| Phase | 5 |
| --- | --- |
| Phase名 | 実装（GREEN） |
| 機能名 | issue-908-staging-rollback-notification-runtime-smoke |

---

## 変更対象ファイル一覧

| 種別 | パス | 目的 |
| --- | --- | --- |
| 新規 | `scripts/runtime-smoke/schema-alias-rollback.sh` | helper script（rollback POST + d1 read + redact pipe） |
| 新規 | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` | runtime evidence MD（先行作成は placeholder 構造のみ） |
| 編集 | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | Status mutation + evidence MD 相互リンク追加 |
| 編集 | `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | Phase 11 status / Gate-C status / evidence_path 更新 |

---

## 実装手順（ローカル helper / placeholder は実装済み。runtime mutation は user 承認後）

### Step 1: helper script の追加

`scripts/runtime-smoke/schema-alias-rollback.sh` を以下構造で新規作成する:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Schema alias rollback runtime smoke helper (issue-908)
# Cloudflare CLI は scripts/cf.sh 経由のみ (CLAUDE.md 準拠)。

ENV=""
ALIAS_ID=""
DRY_RUN=0
SCENARIO=""

usage() {
  cat >&2 <<'EOF'
Usage:
  bash scripts/runtime-smoke/schema-alias-rollback.sh \
    --env <staging|production> \
    --alias <TEST_ALIAS_ID> \
    [--dry-run] \
    [--scenario <sent|skipped|failed>]
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env) ENV="$2"; shift 2;;
      --alias) ALIAS_ID="$2"; shift 2;;
      --dry-run) DRY_RUN=1; shift;;
      --scenario) SCENARIO="$2"; shift 2;;
      -h|--help) usage; exit 0;;
      *) usage; exit 1;;
    esac
  done
  [[ -z "$ENV" || -z "$ALIAS_ID" ]] && { usage; exit 1; }
}

redact() {
  sed -E \
    -e 's#(https://hooks\.slack\.com/services/)[A-Za-z0-9/_-]+#\1<REDACTED>#g' \
    -e 's#(Authorization: Bearer )[A-Za-z0-9._-]+#\1<REDACTED>#g' \
    -e 's#(X-Auth-Key: )[A-Za-z0-9._-]+#\1<REDACTED>#g'
}

require_user_gate() {
  [[ $DRY_RUN -eq 1 ]] && return 0
  echo "[USER-GATE] About to mutate ${ENV} D1 and trigger real provider for alias=${ALIAS_ID}. Continue? [y/N]" >&2
  read -r ans
  [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "aborted by user" >&2; exit 2; }
}

run_rollback() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY-RUN] POST ${ENV}/admin/schema/aliases/${ALIAS_ID}/rollback (skipped)" | redact
    return 0
  fi
  # 実値は op run 経由で動的注入 (実行例)
  # op run --env-file=.env -- bash -c '...curl POST...' | redact
  curl -sS -i -X POST \
    "${STAGING_API_BASE}/admin/schema/aliases/${ALIAS_ID}/rollback" \
    -H "Authorization: Bearer ${STAGING_ADMIN_BEARER}" \
    -H "Content-Type: application/json" 2>&1 | redact
}

fetch_audit_entry() {
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "[DRY-RUN] cf.sh d1 execute ubm-hyogo-db-${ENV} (SELECT audit_log) skipped" | redact
    return 0
  fi
  bash scripts/cf.sh d1 execute "ubm-hyogo-db-${ENV}" --env "${ENV}" \
    --command "SELECT audit_id, action, target_id, after_json, created_at FROM audit_log WHERE action='schema_alias.rollback_notification' AND target_id='${ALIAS_ID}' ORDER BY created_at DESC LIMIT 1;" \
    2>&1 | redact
}

emit_evidence_block() {
  cat <<EOF
## Scenario ${SCENARIO:-unspecified}

- env: ${ENV}
- alias: ${ALIAS_ID}
- dry_run: ${DRY_RUN}
- executed_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- redaction: applied (webhook URL / Authorization / X-Auth-Key)

EOF
}

main() {
  parse_args "$@"
  require_user_gate
  emit_evidence_block
  echo "--- rollback ---" >&2
  run_rollback
  echo "--- audit ---" >&2
  fetch_audit_entry
}

main "$@"
```

> 実装時には `op run --env-file=.env --` ラップでの動的注入を `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` に適用すること（実値直接 export 禁止）。

### Step 2: evidence MD placeholder の先行作成

```markdown
# Staging Runtime Smoke Evidence — issue-838 schema alias rollback notification

> Captured via issue-908 followup. helper: `scripts/runtime-smoke/schema-alias-rollback.sh`

## Summary

- captured_at: <ISO8601_UTC>
- executor: <handle>
- staging deploy version_id: <CF_VERSION_ID>
- helper: scripts/runtime-smoke/schema-alias-rollback.sh

## Scenario S-sent

- rollback HTTP status: 200
- audit_log entry: `{"status":"sent","channel":"slack","attempts":1,"errorClass":null,"dispatchedAt":"<ISO8601>"}`
- Slack 着信目視: yes
- redaction: webhook URL / Authorization は `<REDACTED>` 化済み

## Scenario S-skipped

- rollback HTTP status: 200
- audit_log entry: `{"status":"skipped","channel":"none","attempts":0,"errorClass":null,"dispatchedAt":"<ISO8601>"}`

## Scenario S-failed

- rollback HTTP status: 200（best-effort 維持）
- audit_log entry: `{"status":"failed","channel":"slack","attempts":3,"errorClass":"ProviderHttp5xx","dispatchedAt":"<ISO8601>"}`

## AC mapping

| AC | 確認 |
| --- | --- |
| AC-1 | S-sent / S-skipped（mail fallback は unit test 代替） |
| AC-2 | redact pipe + after_json 構造限定 |
| AC-3 | S-failed で rollback 200 維持 |
| AC-4 | 各 scenario の audit_log entry 存在 |
| AC-5 | S-skipped で skipped/none/attempts=0 |
| AC-6 | 本 MD が tracked file として存在 |
| AC-7 | 親 focused vitest 全 PASS（local 取得済み） |

## Redaction note

本 MD に転記された curl/cf.sh 出力はすべて helper の `redact()` pipe を経由しており、webhook URL / Authorization / X-Auth-Key の実値は `<REDACTED>` 化されている。git history を grep しても実値の混入がないことを `git log -p outputs/phase-11/evidence/staging-smoke.md | grep -E 'hooks\.slack\.com/services/[A-Z0-9]{8}'` で確認可能。
```

### Step 3: 親 manual-test-result.md の Status mutation

`docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` の Status 行を更新し末尾に staging-smoke.md への相互リンクを追加する（phase-2 §親 mutation 仕様参照）。

### Step 4: 親 artifacts.json の更新

phase-2 §親 mutation 仕様の diff を適用する。`status`, `workflow_state`, `phases.11`, `metadata.gates[gate_id=Gate-C]` の 4 箇所。

### Step 5: helper の dry-run 検証

```bash
bash -n scripts/runtime-smoke/schema-alias-rollback.sh
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy-alias --dry-run
```

期待: exit 0 / `[DRY-RUN]` 出力 / D1 mutation / curl POST 発火なし。

### Step 6: runtime smoke 本実行（user-gated）

ユーザー承認後にのみ:

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <REAL_TEST_ALIAS_ID> --scenario sent
# Slack 着信目視 + audit_log 確認
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <REAL_TEST_ALIAS_ID> --scenario skipped
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <REAL_TEST_ALIAS_ID> --scenario failed
```

各 scenario の出力を evidence MD に転記し placeholder を埋める。

---

## 検証コマンド

| Level | Command | 期待 |
| --- | --- | --- |
| L0 | `bash -n scripts/runtime-smoke/schema-alias-rollback.sh` | exit 0 |
| L1 | `bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy --dry-run` | exit 0 / `[DRY-RUN]` 出力 |
| L4 | `node scripts/gate-metadata/validate.ts` | ERROR 0 |
| L5 | `node scripts/verify-phase12-compliance.ts` | status=pass |
| L6 | `mise exec -- pnpm indexes:rebuild && git status --porcelain` | clean |
| 統合 | `bash scripts/verify-pr-ready.sh` | 全 green |

---

## DoD

- [ ] helper script が L0 / L1 PASS
- [x] helper script と親 evidence placeholder は物理作成済み
- [ ] 3 ケース runtime smoke 実行済 (user-gated)
- [ ] evidence MD に 3 scenario すべて記載（placeholder 解消）
- [ ] 親 manual-test-result.md Status = `runtime_evidence_captured`
- [ ] 親 artifacts.json の Gate-C = passed / Phase 11 status = completed
- [ ] secret 実値が evidence MD / log / commit history に転記なし
- [ ] typecheck / lint / verify-pr-ready 全 green

---

## 次Phase

`phase-6-test-additions.md` へ進む。
