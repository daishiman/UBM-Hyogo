# Phase 5: 実装ランブック

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `scripts/smoke/runtime-attendance-provider.sh` | 新規 | staging Worker に curl smoke を発行し、summary-only `outputs/phase-11/evidence/runtime-smoke.log` を生成 |
| `scripts/smoke/redact.sh` | 新規 | secret pattern を `[REDACTED]` に置換する shell filter |
| `scripts/smoke/lib/assert.sh` | 新規（任意・小規模なら inline 可） | `assert_attendance_array` / `assert_status` ヘルパ |
| `outputs/phase-11/evidence/*.log` | 新規 | Phase 11 で生成 |
| `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md` | 条件付き編集 | runtime smoke PASS 後のみ `状態` / `metadata.workflow_state` を `completed` / `PASS_RUNTIME_VERIFIED` へ更新。credentials 未提供時は pending 維持 |

## `scripts/smoke/runtime-attendance-provider.sh` シグネチャ・契約

```bash
#!/usr/bin/env bash
# Usage: bash scripts/smoke/runtime-attendance-provider.sh <env>
#   env: staging のみ受理（production は明示拒否）
# Inputs (env vars, sourced via op run --env-file=.env):
#   STAGING_API_BASE          ex: https://api-staging.ubm-hyogo.example
#   STAGING_ADMIN_BEARER      admin gate を通過する bearer / session
#   STAGING_MEMBER_ID         smoke 対象 memberId（実在 member）
#   STAGING_ME_BEARER         一般会員 session
# Outputs:
#   docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/runtime-smoke.log
#   Raw body is temporary only (mktemp + trap). Persistent log stores status / contract / count summary only.
#   exit 0: 全 GET で 200 かつ route ごとの JSON contract が成立
#   exit 1: いずれかが失敗
# Side effects:
#   なし。POST /me/visibility-request, POST /me/delete-request は DB write を伴うため実行しない。
```

### 内部処理（疑似コード）

```bash
set -euo pipefail
ENV="${1:?env required}"
[[ "$ENV" != "staging" ]] && { echo "production smoke is forbidden"; exit 2; }

OUT_LOG="docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence/runtime-smoke.log"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir -p "$(dirname "$OUT_LOG")"
: > "$OUT_LOG"

curl_dump() {
  local label="$1" url="$2" bearer="$3" summary_filter="$4" method="${5:-GET}" body="${6:-}"
  echo "===== $label $method =====" >> "$OUT_LOG"
  if [[ -n "$body" ]]; then
    curl -sS -D - -X "$method" -H "authorization: Bearer $bearer" \
      -H "content-type: application/json" -d "$body" "$url" > "$TMP_DIR/$label.body"
  else
    curl -sS -X "$method" -H "authorization: Bearer $bearer" "$url" > "$TMP_DIR/$label.body"
  fi
  # jq reads temporary body files; raw response bodies are never written to OUT_LOG.
  jq -r "$summary_filter" "$TMP_DIR/$label.body" >> "$OUT_LOG"
  echo >> "$OUT_LOG"
}

curl_dump "admin-list"       "$STAGING_API_BASE/admin/members"                                "$STAGING_ADMIN_BEARER" ".members | length"
curl_dump "admin-detail"     "$STAGING_API_BASE/admin/members/$STAGING_MEMBER_ID"             "$STAGING_ADMIN_BEARER" ".attendance | length"
curl_dump "admin-attendance" "$STAGING_API_BASE/admin/members/$STAGING_MEMBER_ID/attendance"  "$STAGING_ADMIN_BEARER" ".records | length"
curl_dump "me-root"          "$STAGING_API_BASE/me/"                                          "$STAGING_ME_BEARER" ".user.memberId | type"
curl_dump "me-profile"       "$STAGING_API_BASE/me/profile"                                   "$STAGING_ME_BEARER" ".profile.attendance | length"
curl_dump "me-attendance"    "$STAGING_API_BASE/me/attendance"                                "$STAGING_ME_BEARER" ".records | length"
# No raw body is written to OUT_LOG. jq reads temporary body files and writes summary only.

# route contract assertion is executed per request with a route-specific jq filter:
# admin-list=.members array, admin-detail=.attendance array,
# admin-attendance=.records array, me-root=.user.memberId string,
# me-profile=.profile.attendance array, me-attendance=.records array.

echo "smoke OK"
```

> 上記は実装テンプレ。Phase 11 で実行し、stdout/stderr を `outputs/phase-11/evidence/runtime-smoke.log` の冒頭にも追記する。

## `scripts/smoke/redact.sh` シグネチャ・契約

```bash
#!/usr/bin/env bash
# Usage: bash scripts/smoke/redact.sh < input > output
# stdin → stdout filter. 副作用なし。
set -euo pipefail
sed -E \
  -e 's/^([Ss]et-[Cc]ookie):.*/\1: [REDACTED]/' \
  -e 's/^([Aa]uthorization):.*/\1: [REDACTED]/' \
  -e 's/Bearer [A-Za-z0-9._~+\/=-]+/Bearer [REDACTED]/g' \
  -e 's/cf-_session=[A-Za-z0-9._-]+/cf-_session=[REDACTED]/g' \
  -e 's/(__Secure-authjs[A-Za-z0-9._-]*=)[A-Za-z0-9._~+\/=-]+/\1[REDACTED]/g' \
  -e 's/("session[Tt]oken"\s*:\s*")[^"]+(")/\1[REDACTED]\2/g' \
  -e 's/("[Aa]ccess[Tt]oken"\s*:\s*")[^"]+(")/\1[REDACTED]\2/g'
```

## ローカル実行・検証コマンド

```bash
chmod +x scripts/smoke/runtime-attendance-provider.sh scripts/smoke/redact.sh
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-11/evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/api build 2>&1 | tee outputs/phase-11/evidence/build.log
op run --env-file=.env -- bash scripts/smoke/runtime-attendance-provider.sh staging
```

## DoD（Definition of Done）

- 2 つの新規 shell スクリプトが配置され `chmod +x` 済み
- shellcheck PASS（Phase 7）
- staging credentials 提供後に smoke が exit 0 で完了し、`outputs/phase-11/evidence/runtime-smoke.log` に 6 ラベルの response contract PASS と count/type summary が記録されている
- secret / PII pattern が混入していない（`grep-gate.log` が non-leak PASS または空）
- local PASS 5 点が evidence 化されている

## 完了条件

- 全変更対象ファイルが上記シグネチャ通り配置済み
- AC-2 / AC-3 / AC-5 を満たす evidence が Phase 11 で取得可能な状態。runtime credentials 未提供時は `pending_user_runtime_credentials` を明記し、親タスク state は更新しない
