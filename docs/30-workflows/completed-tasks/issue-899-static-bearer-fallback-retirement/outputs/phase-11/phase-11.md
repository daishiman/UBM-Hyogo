# Phase 11 — 手動テスト

## 1. 概要

NON_VISUAL（CI workflow / runbook 改定）。screenshot / axe 検証は対象外。runtime evidence は user-gated で 1 回以上記録する。

## 2. 手順（user-gated）

### Step 1: 前提 #916 完了確認

```bash
gh issue view 916 --json state,closedAt
# 期待: state="CLOSED"
gh secret list --env staging-runtime-smoke | grep STAGING_AUTH_SECRET
# 期待: 1 件
```

### Step 2: 実装 PR merge 後の mint-only smoke 実走

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
sleep 30
gh run list --workflow runtime-smoke-staging.yml --branch dev --limit 1 --json conclusion,databaseId,status
```

### Step 3: auth path 確認

```bash
RUN_ID=$(gh run list --workflow runtime-smoke-staging.yml --branch dev --limit 1 --json databaseId --jq '.[0].databaseId')
gh run view "$RUN_ID" --log | grep -E 'runtime-smoke auth path'
```

期待出力:

```
... ::notice::runtime-smoke auth path: minted
```

NG パターン:

- `static-fallback` → 撤去未完了。workflow を再確認
- `unknown` → mint step が失敗している。fail-fast guard ログを確認

### Step 4: physical secret 削除

```bash
gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke
gh secret delete STAGING_ME_BEARER --env staging-runtime-smoke
gh secret list --env staging-runtime-smoke
# 期待: 上記 2 secret が一覧に存在しない
```

### Step 5: 削除後 smoke 再走

```bash
gh workflow run runtime-smoke-staging.yml --ref dev
# Step 3 と同じ確認を再実行 → auth path = minted / job = success
```

## 3. 期待 evidence

| 種別           | 出力先                                                              | 内容                                          |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| run summary    | `outputs/phase-11/evidence/runtime-smoke-minted-only.log`           | gh run view --log の抜粋（auth path = minted）|
| secret 削除確認| `outputs/phase-11/evidence/secret-list-after-delete.txt`            | gh secret list の出力                         |
| 再走 evidence  | `outputs/phase-11/evidence/runtime-smoke-post-delete.log`           | physical delete 後の green run summary        |

## 4. Phase 11 evidence file inventory

| Classification    | Path                                                                | Status                |
| ----------------- | ------------------------------------------------------------------- | --------------------- |
| manual test plan  | outputs/phase-11/phase-11.md                                        | present               |
| manual test result| outputs/phase-11/manual-test-result.md                              | pending (user-gated)  |
| runtime evidence  | outputs/phase-11/evidence/runtime-smoke-minted-only.log             | pending (user-gated)  |
| runtime evidence  | outputs/phase-11/evidence/secret-list-after-delete.txt              | pending (user-gated)  |
| runtime evidence  | outputs/phase-11/evidence/runtime-smoke-post-delete.log             | pending (user-gated)  |
