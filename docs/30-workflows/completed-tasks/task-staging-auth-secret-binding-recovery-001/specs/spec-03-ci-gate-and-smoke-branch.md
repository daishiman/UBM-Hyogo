# spec-03: CI gate（deploy 直後 auth-gate smoke）+ smoke script `auth misconfigured` 検知分岐

[実装区分: 実装仕様書]

## 1. 目的

deploy-staging 直後に auth-gate smoke を追加し、AUTH_SECRET binding drift を runtime smoke の前段で検知して deploy を fail させる。runtime smoke 側も `auth misconfigured` body 検出時に summary に root cause hint を出す。

## 2. 変更対象ファイル

| 種別 | path |
|------|------|
| 編集 | `.github/workflows/backend-ci.yml` |
| 編集 | `scripts/smoke/runtime-attendance-provider.sh` |
| 新規/編集 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` |

## 3. 変更詳細

### 3.1 `backend-ci.yml` — deploy-staging job 後段に auth-gate step 追加

deploy step の直後、`runtime smoke staging / smoke` job の前に挿入する。

```yaml
- name: auth-gate smoke (post-deploy)
  env:
    STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
    STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
  run: |
    set -euo pipefail
    body_file=$(mktemp)
    code=$(curl -sS -o "$body_file" -w "%{http_code}" --max-time 15 \
      -H "Authorization: Bearer ${STAGING_ADMIN_BEARER}" \
      "${STAGING_API_BASE}/admin/members")
    echo "auth-gate http=${code}"
    if [ "$code" = "500" ] && grep -q "auth misconfigured" "$body_file"; then
      echo "::error::AUTH_SECRET binding drift suspected (auth misconfigured returned post-deploy)"
      cat "$body_file"
      exit 1
    fi
    if [ "$code" != "200" ]; then
      echo "::warning::auth-gate non-200 (code=${code}) — runtime smoke will retry"
    fi
```

- runtime smoke が後段にあっても、より早期に AUTH_SECRET 起因のみを切り分ける gate を設ける
- 既存 runtime smoke は維持

### 3.2 `runtime-attendance-provider.sh` — auth misconfigured 検知分岐

現物は `$TMP_DIR/$label.body` に response body を保存し、non-200 分岐で `fail_and_exit` する。exit 後 scan は効かないため、non-200 body 保存直後に分類する。

```bash
failure_reason=""
if printf '%s' "$redacted_body" | grep -Fq '"error":"auth misconfigured"'; then
  failure_reason="auth-secret-binding-missing"
fi
fail_and_exit "$label" "$status" "$jq_filter" "$failure_reason"
```

- `runtime-smoke.log` と `summary.json` の両方に `reason=auth-secret-binding-missing` を残す
- exit code（fail/success）は既存ロジックを維持

### 3.3 `runtime-attendance-provider.test.sh` — TC-SMOKE-01/02

```bash
#!/usr/bin/env bash
set -euo pipefail

# TC-SMOKE-01: fake curl で 500 + {"error":"auth misconfigured"} を返す
# 1) runtime-attendance-provider.sh を実行
# 2) runtime-smoke.log に reason=auth-secret-binding-missing が含まれる
# 3) summary.json routes[0].reason が auth-secret-binding-missing
# 4) exit code 1
```

実装詳細は既存 `scripts/smoke/__tests__/` の test pattern に合わせる。

## 4. 入出力・副作用・エラー

| step | 入力 | 出力 | 副作用 | エラー |
|------|------|------|--------|--------|
| auth-gate smoke | `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` | 標準出力 + exit code | curl 1 回 | 500+auth misconfigured で exit 1 |
| smoke script branch | body files | summary 末尾追記 | なし | 既存 exit code 維持 |

## 5. テスト方針

- TC-SMOKE-01: fake curl で 500 を返す → summary に `auth-secret-binding-missing` が出ること
- TC-SMOKE-02: 既存 non-200 body persistence と redaction が維持されること

## 6. ローカル実行コマンド

```bash
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh
# CI step の local dry-run
STAGING_API_BASE=http://localhost:8787 STAGING_ADMIN_BEARER=dummy \
  bash -c 'curl -sS -o /tmp/body -w "%{http_code}" -H "Authorization: Bearer $STAGING_ADMIN_BEARER" "$STAGING_API_BASE/admin/members"'
```

## 7. DoD

- TC-SMOKE-01/02 PASS
- `backend-ci.yml` の auth-gate step が deploy-staging 後段に存在
- mock server を使った dry-run で suspect 文字列出力を確認

## 8. 実装読込みで確定した前提

- body 保存先は `$TMP_DIR/$label.body`、ログは `$OUT_LOG`。
- reusable runtime smoke job は `.github/workflows/runtime-smoke-staging.yml`、caller は `.github/workflows/backend-ci.yml` の `runtime-smoke-staging` job。
- deploy job 内 auth-gate step は追加余地ありだが、今回 local cycle では runner の原因分類を先に実装し、staging deploy/rerun は user-gated とする。
