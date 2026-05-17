# Phase 5: 実装

## メタ情報

- phase: 5 / implementation
- prev: phase-4-test-plan
- next: phase-6-test-additions
- implementation_kind: 実装仕様書

## 目的

Phase 2 設計に基づき、workflow YAML rename と regression gate 追加の実装差分を作成する。**コード実装は本 Phase で確実に着手し、Phase 6 でテスト緑化、Phase 11 で運用 revocation を実施する。**

## 前提条件（実装着手 gate）

実装着手前に必ず以下を operator に依頼・確認すること（NG-2 防止）:

1. `CF_TOKEN_D1_STAGING` / `CF_TOKEN_WORKERS_STAGING` が GitHub Environment `staging` に投入済み
2. `CF_TOKEN_D1_PRODUCTION` / `CF_TOKEN_WORKERS_PRODUCTION` が GitHub Environment `production` に投入済み
3. `web-cd.yml` の environment-scoped `CLOUDFLARE_API_TOKEN` は legacy token value ではないことを operator が確認済み（値・URI・hash は記録禁止）

確認手段（値は露出しない）:

```bash
gh secret list --env staging    | rg 'CF_TOKEN_D1_STAGING|CF_TOKEN_WORKERS_STAGING|CLOUDFLARE_API_TOKEN'
gh secret list --env production | rg 'CF_TOKEN_D1_PRODUCTION|CF_TOKEN_WORKERS_PRODUCTION|CLOUDFLARE_API_TOKEN'
```

> 上記が空であれば operator に投入を依頼し、確認できるまで Phase 5 実装をマージしない。

## 変更対象ファイル一覧

| ファイル | 種別 | 概要 |
|---------|------|------|
| `.github/workflows/web-cd.yml` | 確認 | 正本名 `CLOUDFLARE_API_TOKEN` を維持。operator-only value provenance を Phase 11 に接続 |
| `.github/workflows/backend-ci.yml` | 編集 | D1 / Workers deploy step の secret 参照を `CF_TOKEN_*` へ rename（4 箇所） |
| `scripts/__tests__/workflow-env-scope.test.sh` | 編集 | legacy 名 regression gate を追加（TC-1 / TC-2） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | inventory に新 secret 名と changelog を追記（Phase 12 で完成、本 Phase では skeleton のみ） |

`scripts/redaction-check.sh` / `scripts/check-cf-rotation-reminder.sh` は変更不要（pattern が legacy 名substring を含み rename 後も機能する）。

## 実装手順

### Step 5.1: `.github/workflows/web-cd.yml`

`web-cd.yml` は rename しない。次の 2 条件のみ確認する:

- deploy step 内のみに `CLOUDFLARE_API_TOKEN` が存在し、job-level / build step に漏れていない
- Phase 11 で `CLOUDFLARE_API_TOKEN` environment secret の value provenance を operator-only に確認する

### Step 5.2: `.github/workflows/backend-ci.yml`

L41 / L52 / L96 / L107 の `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` を、step 名に応じて次へ rename。実際の step 名を確認のうえ D1 / Workers と staging / production を判別すること。

- staging `Apply D1 migrations`: `${{ secrets.CF_TOKEN_D1_STAGING }}`
- staging `Deploy Workers app`: `${{ secrets.CF_TOKEN_WORKERS_STAGING }}`
- production `Apply D1 migrations`: `${{ secrets.CF_TOKEN_D1_PRODUCTION }}`
- production `Deploy Workers app`: `${{ secrets.CF_TOKEN_WORKERS_PRODUCTION }}`

### Step 5.3: `scripts/__tests__/workflow-env-scope.test.sh`

ファイル末尾に新セクションを追加:

```bash
# === TC-1 / TC-2: legacy secret name regression gate ===

WEB_CD="$REPO_ROOT/.github/workflows/web-cd.yml"
BACKEND_CI="$REPO_ROOT/.github/workflows/backend-ci.yml"

for file in "$WEB_CD" "$BACKEND_CI"; do
  # legacy 名 (無修飾 CLOUDFLARE_API_TOKEN) が残っていないことを検証
  if grep -nE 'secrets\.CLOUDFLARE_API_TOKEN[[:space:]]*\}\}' "$file" \
       | grep -vE 'CLOUDFLARE_API_TOKEN_(DEPLOY_(STAGING|PRODUCTION)|STAGING|ANALYTICS_READONLY|RUNTIME)' \
       | grep -vE 'CF_AUDIT_.*_TOKEN_'; then
    fail "$file still references legacy unscoped secret name CLOUDFLARE_API_TOKEN"
  fi
done

# backend step/env exact match
grep -A12 'name: Apply D1 migrations' "$BACKEND_CI" | grep -q 'secrets.CF_TOKEN_D1_STAGING' \
  || fail "backend-ci staging D1 step must use CF_TOKEN_D1_STAGING"
grep -A12 'name: Deploy Workers app' "$BACKEND_CI" | grep -q 'secrets.CF_TOKEN_WORKERS_STAGING' \
  || fail "backend-ci staging Workers step must use CF_TOKEN_WORKERS_STAGING"
grep -A70 'deploy-production:' "$BACKEND_CI" | grep -A12 'name: Apply D1 migrations' | grep -q 'secrets.CF_TOKEN_D1_PRODUCTION' \
  || fail "backend-ci production D1 step must use CF_TOKEN_D1_PRODUCTION"
grep -A70 'deploy-production:' "$BACKEND_CI" | grep -A12 'name: Deploy Workers app' | grep -q 'secrets.CF_TOKEN_WORKERS_PRODUCTION' \
  || fail "backend-ci production Workers step must use CF_TOKEN_WORKERS_PRODUCTION"
! grep -nE 'apiToken: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}' "$BACKEND_CI" \
  || fail "backend-ci still references legacy unscoped CLOUDFLARE_API_TOKEN"
```

既存の deploy step env 検証セクション（L45 等）は維持し、新セクションを後置する。

### Step 5.4: `deployment-secrets-management.md` skeleton 更新

Phase 12 で本格更新するが、本 Phase で以下 skeleton のみ追加:

```md
> 2026-05-16: legacy account-scoped Cloudflare token value は issue #718 で
> revocation 予定。backend-ci は `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ
> cutover し、web-cd は environment-scoped `CLOUDFLARE_API_TOKEN` 名を維持したまま
> value provenance を operator-only evidence で確認する。
```

## 入出力 / 副作用

- 入力: GitHub Secrets（新 secret 名で投入済み・operator 作業）
- 出力: rename された YAML + 追加された gate + skeleton ドキュメント
- 副作用: `dev` ブランチへのマージ後、次回 deploy で新 secret が使用される

## ローカル実行・検証コマンド

```bash
# rename 検知
rg -n 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml .github/workflows/backend-ci.yml

# 期待: backend-ci では legacy 無修飾 apiToken が 0 件。web-cd の current runtime 名は許容。

# gate 動作確認
bash scripts/__tests__/workflow-env-scope.test.sh
echo "exit=$?"
```

## DoD（Definition of Done）

- [ ] `backend-ci.yml` の `with.apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` 参照 0 件
- [ ] `web-cd.yml` は deploy step env の `CLOUDFLARE_API_TOKEN` のみ許可し、job-level / build / install / lint / typecheck へ露出していない
- [ ] GitHub Environment `staging` / `production` に `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` 4 secret が投入済みであることを redacted `gh secret list` evidence で確認済み
- [ ] `workflow-env-scope.test.sh` が exit 0
- [ ] `pnpm typecheck` / `pnpm lint` が green（YAML / shell のみ変更のため lint pass を期待）
- [ ] `deployment-secrets-management.md` skeleton が追記済み

## 成果物

- `outputs/phase-5/implementation-diff.md`（git diff のサマリ）
- `outputs/phase-5/deploy-checkpoint.md`（rename PR のマージ→deploy green までのチェックリスト）

## 完了条件

- [ ] 上記 DoD 4 項目すべて green
- [ ] Phase 6 へ進む準備（test 緑化確認）が整っている

## タスク100%実行確認【必須】

- [ ] 変更対象 4 ファイルすべてに編集が入った
- [ ] PR マージ前に operator が新 secret 投入を完了している

## 次Phase

phase-6-test-additions.md
