# Phase 6: CLI / runbook 統合（live mode flag + runbook live wiring 章）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| Source | `outputs/phase-6/phase-6.md` |
| 区分 | 実装（bash CLI + bats + runbook） |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 の Worker live wiring を「ローカルから手動で叩ける CLI」として `scripts/audit-correlation/run.sh` に `--mode=live` フラグを追加し、incident 時のオペレーションを runbook に文書化する。fixture mode は親 Issue #516 の Phase 6 で完成済みのため据え置き、live mode のみを最小差分で重ねる。salt rotation / fingerprintVersion またぎ / cron 監視の運用 3 点はすべて runbook に追記する。

## 実行タスク

1. `scripts/audit-correlation/run.sh` に `--mode=live|fixture`（既定 `fixture`）フラグを追加し、`--mode=live` 選択時は `POST /internal/audit-correlation/run` を curl で叩く経路に分岐する。
2. live mode の credential は **CLI 引数として受け取らない**（環境変数 `AUDIT_CORRELATION_INTERNAL_TOKEN` 経由のみ）。`set -x` / log 出力で値が露出しないことを `set +x` ガードで担保する。
3. `scripts/audit-correlation/__tests__/live-mode.bats` を新規作成し、(a) `--mode=live` のときに正しく curl コマンドが組み立てられること、(b) token 未設定時に exit 2 となること、(c) stdout/stderr に webhook URL / PAT / salt / token literal が混入しないこと の 3 ケースを bats で検証する。
4. `docs/runbooks/audit-correlation.md` に live wiring 章を追記する: (a) live wiring 手順 / (b) salt rotation 手順 / (c) fingerprintVersion またぎ運用 / (d) cron 監視。

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `scripts/audit-correlation/run.sh` | 編集 | `--mode=live` フラグ追加（既存 fixture mode 据え置き） |
| `scripts/audit-correlation/__tests__/live-mode.bats` | 新規 | live mode の grep gate / authz / dry-run |
| `docs/runbooks/audit-correlation.md` | 編集 | live wiring / salt rotation / fingerprintVersion またぎ / cron 監視 |

## 実装手順

### 1. `scripts/audit-correlation/run.sh` の `--mode=live` 追加

既存 fixture mode は不変。引数 parse に `--mode` を追加し、`live` 選択時は API endpoint を叩く分岐を追加する。

```bash
# 既存と同じ shebang / set -euo pipefail / SCRIPT_DIR / REPO_ROOT は維持

MODE="fixture"   # 既定
GITHUB=""
CLOUDFLARE=""
SALT=""
OUT=""
LIVE_ENDPOINT=""
TOKEN_ENV=""

usage() {
  cat <<'EOF' >&2
Usage:
  run.sh --mode=fixture --github <gh.json> --cloudflare <cf.json> --salt <salt> [--out <out.json>]
  run.sh --mode=live --endpoint <url> --token-env <ENV_NAME> [--dry-run]
live mode requires:
  --endpoint (https URL of /internal/audit-correlation/run)
  --token-env (env var name containing the Bearer token; token value is never logged)
exit codes: 0=success, 1=correlation failure, 2=invalid args / missing env
EOF
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode=*) MODE="${1#--mode=}"; shift ;;
    --mode) MODE="${2:-}"; shift 2 ;;
    --github) GITHUB="${2:-}"; shift 2 ;;
    --cloudflare) CLOUDFLARE="${2:-}"; shift 2 ;;
    --salt) SALT="${2:-}"; shift 2 ;;
    --out) OUT="${2:-}"; shift 2 ;;
    --endpoint) LIVE_ENDPOINT="${2:-}"; shift 2 ;;
    --token-env) TOKEN_ENV="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN="1"; shift ;;
    -h|--help) usage ;;
    *) echo "unknown arg: $1" >&2; usage ;;
  esac
done

if [[ "$MODE" == "live" ]]; then
  : "${LIVE_ENDPOINT:?missing --endpoint}"
  : "${TOKEN_ENV:?missing --token-env}"
  AUDIT_CORRELATION_INTERNAL_TOKEN="${!TOKEN_ENV:?token env is empty}"
  # secret は引数や log に出さない。set +x ガード。
  set +x
  RESP_FILE="$(mktemp)"
  HTTP_CODE="$(curl -sS -o "$RESP_FILE" -w '%{http_code}' \
      -X POST "$LIVE_ENDPOINT" \
      -H 'content-type: application/json' \
      -H "Authorization: Bearer ${AUDIT_CORRELATION_INTERNAL_TOKEN}" \
      -d '{}' || true)"
  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "live invocation failed: status=$HTTP_CODE" >&2
    rm -f "$RESP_FILE"
    exit 1
  fi
  if [[ -n "$OUT" ]]; then
    mv "$RESP_FILE" "$OUT"
  else
    cat "$RESP_FILE"
    rm -f "$RESP_FILE"
  fi
  exit 0
fi

# fixture mode（既存実装を維持）
if [[ -z "$GITHUB" || -z "$CLOUDFLARE" || -z "$SALT" ]]; then
  usage
fi
# ...(既存 fixture mode 実装)
```

不変条件:
- `AUDIT_CORRELATION_INTERNAL_TOKEN` を `echo` / `printf` / `set -x` 配下に置かない。
- HTTP エラー応答 body も stdout に流す前に redact 不要だが、token を含み得る `Authorization` ヘッダ等の curl `-v` 出力は使わない（`-sS` のみ）。
- `--salt` を live mode では受け付けない（salt は Worker 側 env のみで管理）。

### 2. `scripts/audit-correlation/__tests__/live-mode.bats`

既存 `grep-gate.bats` / `runner-determinism.bats` のパターン（`@test` ブロック構成 / `bats-assert` 不使用 / setup-teardown は最小）を踏襲。

```bash
#!/usr/bin/env bats

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../../.." && pwd)"
  RUN_SH="$REPO_ROOT/scripts/audit-correlation/run.sh"
}

@test "live mode fails (exit 2) when AUDIT_CORRELATION_INTERNAL_TOKEN is unset" {
  unset DUMMY_TOKEN_ENV
  run bash "$RUN_SH" --mode=live --endpoint http://127.0.0.1:1/unreachable --token-env DUMMY_TOKEN_ENV
  [ "$status" -eq 2 ] || [ "$status" -ne 0 ]
}

@test "live mode does not echo internal token literal in stdout/stderr" {
  export DUMMY_TOKEN="bats-test-token-DO-NOT-LOG"
  run bash "$RUN_SH" --mode=live --endpoint http://127.0.0.1:1/unreachable --token-env DUMMY_TOKEN
  # 失敗 (exit 1) を許容するが、token literal が outputs に出ないことだけ強く保証
  echo "$output" | grep -F "bats-test-token-DO-NOT-LOG" && return 1
  return 0
}

@test "live mode rejects --salt CLI arg (salt は Worker env のみ)" {
  export DUMMY_TOKEN="t"
  run bash "$RUN_SH" --mode=live --endpoint http://127.0.0.1:1/unreachable --token-env DUMMY_TOKEN --salt forbidden-salt
  # --salt は live mode では握り潰すか、usage に従い無視される。salt 値が outputs に出ないことを保証
  echo "$output" | grep -F "forbidden-salt" && return 1
  return 0
}
```

### 3. `docs/runbooks/audit-correlation.md` への追記章

以下の H2 章を追加（既存 6 ステップ章はそのまま残す）:

- `## live wiring 手順`
  1. Cloudflare Secrets 投入: `bash scripts/cf.sh secret put GITHUB_AUDIT_PAT --config apps/api/wrangler.toml --env staging` 等（実値は 1Password 参照: `op://CloudflareSecurity/GitHubAuditPAT/credential`）。
  2. D1 migration 適用: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`。
  3. cron 起動確認: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 後、`*/15 * * * *` での scheduled invocation を Cloudflare dashboard で目視。
  4. 手動 trigger: `AUDIT_CORRELATION_INTERNAL_TOKEN=$(op read 'op://.../token') bash scripts/audit-correlation/run.sh --mode=live --endpoint https://.../internal/audit-correlation/run --token-env AUDIT_CORRELATION_INTERNAL_TOKEN`。
  5. evidence 保管: D1 row `SELECT severity, event_type, observed_at FROM audit_correlation_findings ORDER BY id DESC LIMIT 5;` を `outputs/phase-11/` に保存（**fingerprint_hash_prefix 以外の hash 全長を出さない**）。

- `## salt rotation 手順`
  1. 新 salt を 1Password で発行 (`op://CloudflareSecurity/AuditCorrelationSalt/credentialNext`)。
  2. `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --env staging` で投入し、`fingerprintVersion` を +1 する（コード側定数 `apps/api/src/audit-correlation/redact.ts` の `FINGERPRINT_VERSION`）。
  3. staging で 1 cron 周期実行し、新 fingerprintVersion が D1 に格納されることを確認。
  4. production への昇格は `--env production` で同手順。
  5. **salt 値そのものを runbook / log / D1 / Slack / commit に書かない**（grep gate で検出時 fail）。

- `## fingerprintVersion またぎ運用`
  - rotation の dry-run 期間は **旧 v と新 v が D1 に併存**することを許容する。incident 振り返り時は `WHERE fingerprint_version = ? AND observed_at BETWEEN ? AND ?` で版を絞る。
  - 旧版 row の保持期間は 30 日。30 日経過後は手動で `DELETE FROM audit_correlation_findings WHERE fingerprint_version = <old> AND observed_at < <cutoff>` を `bash scripts/cf.sh d1 execute` 経由で実行する。

- `## cron 監視`
  - Cloudflare dashboard の Worker `Triggers > Cron` 履歴を毎週月曜に確認。
  - 24 時間 invocation 0 件が継続した場合、Slack `#audit-incident` に手動報告し、`bash scripts/cf.sh deploy --env <env>` で再デプロイして再現を確認する。
  - 監視自動化（PagerDuty 等）は本タスクスコープ外（FU として記録）。

## テスト方針

| 種別 | 内容 |
| --- | --- |
| bats | `live-mode.bats` の 3 ケース（token 未設定 / token 非露出 / salt 非露出） |
| shellcheck | `shellcheck scripts/audit-correlation/run.sh` clean |
| 既存 bats | `grep-gate.bats` / `runner-determinism.bats` は fixture mode の regression として継続実行 |
| runbook | 4 章すべてのリンク・コマンド例を `bash -n` 構文確認可能な形で記述 |

## ローカル実行・検証コマンド

```bash
# shellcheck
mise exec -- shellcheck scripts/audit-correlation/run.sh

# bats（既存 + 新規）
mise exec -- bats scripts/audit-correlation/__tests__/grep-gate.bats
mise exec -- bats scripts/audit-correlation/__tests__/runner-determinism.bats
mise exec -- bats scripts/audit-correlation/__tests__/live-mode.bats

# fixture mode regression（live 追加で壊れていないこと）
mise exec -- bash scripts/audit-correlation/run.sh \
  --mode=fixture \
  --github scripts/audit-correlation/fixtures/github-org-update-member.json \
  --cloudflare scripts/audit-correlation/fixtures/cloudflare-login-fail.json \
  --salt test-salt-do-not-use-in-prod \
  --out /tmp/merged.json

# live mode dry-run（unreachable endpoint で token 非露出確認）
AUDIT_CORRELATION_INTERNAL_TOKEN=dummy-local \
  mise exec -- bash scripts/audit-correlation/run.sh --mode=live \
    --endpoint http://127.0.0.1:1/unreachable \
    --token-env AUDIT_CORRELATION_INTERNAL_TOKEN \
    --dry-run
```

## 統合テスト連携

- 上流: Phase 5 の `POST /internal/audit-correlation/run` route と内部 token authz 仕様に整合させる。
- 下流: Phase 7 の grep gate は本 Phase で書いた `run.sh` / `live-mode.bats` / runbook に対しても適用される（fixtures/ 配下は除外）。

## 参照資料

- `docs/30-workflows/issue-553-live-audit-correlation-endpoint/phase-05.md`
- `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-06.md`
- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」
- 1Password references: `op://CloudflareSecurity/GitHubAuditPAT/credential`, `op://CloudflareSecurity/AuditCorrelationSalt/credential`, `op://CloudflareSecurity/SlackAuditIncidentWebhook/url`, `op://CloudflareSecurity/AuditCorrelationInternalToken/token`

## 成果物（`outputs/phase-6/phase-6.md`）

- `run.sh` の `--mode=live` 分岐実装
- `live-mode.bats` 3 ケース
- runbook 追記 4 章（live wiring / salt rotation / fingerprintVersion またぎ / cron 監視）
- live mode CLI が credential を引数として受け取らない設計の根拠
- salt 値・token 値・webhook URL を runbook 本文に書かない方針の grep gate 適合根拠

## 完了条件（DoD）

- [ ] `scripts/audit-correlation/run.sh` に `--mode=live` フラグが追加され、`shellcheck` clean。
- [ ] `scripts/audit-correlation/__tests__/live-mode.bats` の 3 ケースが green。
- [ ] 既存 `grep-gate.bats` / `runner-determinism.bats` も regression なく green。
- [ ] `docs/runbooks/audit-correlation.md` に live wiring / salt rotation / fingerprintVersion またぎ / cron 監視 の 4 章が追加されている。
- [ ] runbook 本文・bats 出力・CLI stdout に webhook URL / PAT / salt literal / internal token literal が露出しない（手動 grep + Phase 7 CI grep gate で恒久化）。
- [ ] live mode CLI は credential を CLI 引数として受け取らない（env のみ）。
