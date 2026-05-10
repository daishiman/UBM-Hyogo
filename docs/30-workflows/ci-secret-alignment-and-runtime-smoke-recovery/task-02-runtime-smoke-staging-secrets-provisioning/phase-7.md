# Phase 7: 結合テスト（task-02 — 失敗系 → 成功系の 2-pass 観測）

| 項目 | 値 |
|------|----|
| 入力 | `phase-6.md` 静的検証通過 |
| 出力 | runtime 観測 evidence（pre-check fail / pre-check success の 2 ログ） |

---

## 1. 結合テスト全体フロー

```
[pass 1: secret 未投入で workflow 起動]
    │
    ▼  (pre-check で exit 1)
runner ログに 4 件の不足 secret 名が ::error:: で列挙されることを確認
    │
[user action: gh secret set × 5（runbook 手順）]
    │
    ▼
gh api .../staging-runtime-smoke/secrets で 5 件登録を確認
    │
[pass 2: gh workflow run runtime-smoke-staging.yml --ref dev]
    │
    ▼
verify required staging secrets step が PASS、後続 step が走ることを確認
```

---

## 2. Pass 1: 失敗系 runtime 観測

### 2.1 実行

```bash
# feature branch を push（PR push 時に runtime-smoke-staging が trigger される workflow なら自動起動）
git push origin fix/runtime-smoke-staging-readiness-gate

# 明示 trigger（dispatch 経路を持つ場合）
gh workflow run runtime-smoke-staging.yml --ref fix/runtime-smoke-staging-readiness-gate
gh run watch
```

### 2.2 観測

```bash
RUN_ID=$(gh run list --workflow=runtime-smoke-staging.yml --branch=fix/runtime-smoke-staging-readiness-gate --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --log > outputs/phase-11/evidence/pre-check-fail-run.log
```

### 2.3 期待

| 確認項目 | 期待値 |
|---------|--------|
| job conclusion | `failure` |
| `verify required staging secrets` step exit | `1` |
| log に `missing secrets in environment 'staging-runtime-smoke'` | 1 行存在 |
| log に列挙される secret 数 | 4（`STAGING_API_BASE STAGING_ADMIN_BEARER STAGING_MEMBER_ID STAGING_ME_BEARER`） |
| `mask staging credentials` step | 未実行 |
| `run runtime smoke` step | 未実行 |

---

## 3. User Action: 5 secret 投入

`runbooks/secret-provisioning.md` §投入手順 に従いユーザーが実施。

```bash
# ユーザー操作（AI には委ねない）
gh secret set STAGING_API_BASE       --env staging-runtime-smoke
gh secret set STAGING_ADMIN_BEARER   --env staging-runtime-smoke
gh secret set STAGING_MEMBER_ID      --env staging-runtime-smoke
gh secret set STAGING_ME_BEARER      --env staging-runtime-smoke
gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke
```

投入確認:

```bash
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort > outputs/phase-11/evidence/secret-name-list-after.log
```

期待出力（5 行、ソート済）:

```
SLACK_WEBHOOK_INCIDENT
STAGING_ADMIN_BEARER
STAGING_API_BASE
STAGING_ME_BEARER
STAGING_MEMBER_ID
```

---

## 4. Pass 2: 成功系 runtime 観測

### 4.1 実行

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
gh run watch
```

### 4.2 観測

```bash
RUN_ID=$(gh run list --workflow=runtime-smoke-staging.yml --branch=dev --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --log > outputs/phase-11/evidence/pre-check-success-run.log
```

### 4.3 期待

| 確認項目 | 期待値 |
|---------|--------|
| `verify required staging secrets` step | exit 0 |
| `mask staging credentials` step | 実行 |
| `run runtime smoke` step | 実行（成功 or smoke 固有 failure。pre-check は通過済） |
| log に `missing secrets` 文字列 | **存在しない**（`grep -c 'missing secrets' pre-check-success-run.log` が 0） |

---

## 5. テスト除外項目（再掲）

- smoke スクリプト本体の動作テスト（不変条件 3）。
- `staging` / `production` env の secret provisioning（task-01 / 別 runbook）。
- bearer 失効時のローテーション（runbook §ローテーション運用 で手順のみ提示）。

---

## 6. evidence 一覧

| ファイル | 用途 |
|---------|------|
| `outputs/phase-11/evidence/pre-check-fail-run.log` | Pass 1 の runner ログ |
| `outputs/phase-11/evidence/secret-name-list-after.log` | secret 投入後の name 一覧 |
| `outputs/phase-11/evidence/pre-check-success-run.log` | Pass 2 の runner ログ |
