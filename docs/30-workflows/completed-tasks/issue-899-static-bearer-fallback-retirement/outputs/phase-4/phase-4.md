# Phase 4 — テスト計画

## 1. テスト層構成（3 層）

| 層             | 目的                                                                                              | 実行頻度          |
| -------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| 1. grep gate   | 撤去対象文字列が workflow / runbook に残存していないことを静的検証                                | local + CI pre-push |
| 2. actionlint  | workflow YAML の構文 / step 参照整合性を検証                                                      | local + CI        |
| 3. runtime evidence | mint-only smoke が staging 実環境で green になることを実走確認（user-gated）                  | merge 後 1 回     |

## 2. grep gate 詳細

### 2-1. workflow 内残存禁止 patterns

```bash
# (a) static-fallback リテラル
grep -n 'static-fallback' .github/workflows/runtime-smoke-staging.yml
# 期待: 0 件

# (b) mint step の if guard
grep -nE 'if:[[:space:]]+env\.STAGING_AUTH_SECRET' .github/workflows/runtime-smoke-staging.yml
# 期待: 0 件

# (c) job.env レベルの静的 bearer inject（注: mint step 内の GITHUB_ENV export 行 STAGING_ADMIN_BEARER=$admin は許容）
grep -nE '^\s+STAGING_ADMIN_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ME_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
# 期待: 各 0 件

# (d) RUNTIME_SMOKE_FRESHNESS_ENFORCE env 残存
grep -n 'RUNTIME_SMOKE_FRESHNESS_ENFORCE' .github/workflows/runtime-smoke-staging.yml
# 期待: 0 件
```

### 2-2. runbook 内残存禁止 patterns

```bash
grep -n 'static-fallback\|後方互換 fallback\|即時運用復旧' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md
# 期待: 0 件
```

### 2-3. SSOT 状態更新 patterns

```bash
grep -n '#899' docs/30-workflows/runtime-smoke-staging-mint-recurrence-fix/reference/bearer-lifecycle-ssot.md
# 期待: 「完了済み」「実施済み」を含む行が 1 件以上
```

## 3. actionlint

```bash
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml
# 期待: exit 0 / warning 0
```

## 4. runtime evidence（user-gated）

```bash
# (1) 撤去 PR merge 後、空コミットで smoke 再実行
gh workflow run runtime-smoke-staging.yml --ref dev

# (2) 最新 run の auth path 確認
gh run list --workflow runtime-smoke-staging.yml --branch dev --limit 1 --json conclusion,databaseId
gh run view <run-id> --log | grep 'runtime-smoke auth path'
# 期待: 'minted'（'static-fallback' / 'unknown' 出現で fail 判定）

# (3) physical secret 削除後の再走でも green を確認
gh secret delete STAGING_ADMIN_BEARER --env staging-runtime-smoke
gh secret delete STAGING_ME_BEARER --env staging-runtime-smoke
gh workflow run runtime-smoke-staging.yml --ref dev
# 期待: 同じく minted / success
```

## 5. 新規 test ファイル方針

- **新規 vitest / shell test は追加しない**
- 理由: `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` が既に runner の挙動を保証しており、本タスクの変更点（fallback 撤去）は runner 仕様変更を伴わない（GITHUB_ENV 経由の bearer 受け渡しは不変）
- grep gate は `bash` の inline 実行で十分なため独立 script 化しない

## 6. 失敗時のロールバック手順

| 失敗箇所                                | ロールバック手順                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| actionlint syntax error                 | 該当 hunk を `git restore` し、yaml 構文を修正                                |
| mint step fail-fast guard で誤発火      | `STAGING_AUTH_SECRET` provisioning を再確認（前提 #916 完了確認）             |
| merge 後 smoke red                      | 即 `git revert` で撤去 PR を巻き戻し、`STAGING_AUTH_SECRET` 状態を再調査     |
| physical secret 削除後 smoke red        | `gh secret set` で再投入 → 原因調査（mint step が export していない可能性）  |
