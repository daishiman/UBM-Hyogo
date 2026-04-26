# Phase 6 成果物: 異常系検証書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (セットアップ実行) |
| 次 Phase | 7 (検証項目網羅性) |
| 状態 | completed |

---

## 前提

Phase 5 のセットアップが完了済みであること。
各シナリオは「意図的に誤った状態を作り、検出できること」を確認する。
**再現手順を実行した後は必ず対処手順で正常状態に戻す。**

---

## 異常系シナリオ一覧

| ID | 分類 | シナリオ名 |
| --- | --- | --- |
| A-01 | secret 誤配置 | runtime secret が GitHub Secrets に誤登録された |
| A-02 | secret 誤配置 | deploy secret が Cloudflare Secrets に誤登録された |
| A-03 | branch drift | ワークフロートリガーが feature/* ブランチでデプロイを発火した |
| A-04 | rotation 失敗 | Cloudflare API トークンを rotation した後ワークフローが失敗した |
| A-05 | rollback | production デプロイが失敗し旧バージョンに戻す必要が生じた |
| A-06 | web / api 混在 | web と api が同一ワークフローファイルでデプロイされる状態になった |
| A-07 | .env コミット | .env ファイルが誤って git にコミットされた |

---

## A-01: runtime secret が GitHub Secrets に誤登録された

### シナリオ説明

`GOOGLE_CLIENT_SECRET` を Cloudflare Secrets ではなく GitHub Secrets に登録してしまった場合、
runtime secret が CI/CD の deploy 経路に露出するリスクがある。

### 再現手順

```bash
# 意図的に誤った登録を行う (テスト用のダミー値で実施)
gh secret set GOOGLE_CLIENT_SECRET --body "dummy-value-for-test"

# 誤登録を確認
gh secret list | grep GOOGLE_CLIENT_SECRET
# 出力: GOOGLE_CLIENT_SECRET  Updated <date>  ← これが誤配置
```

### 期待されるエラー検出方法

```bash
# シークレット配置チェックスクリプト
gh secret list | grep "GOOGLE_"
# 期待: 何も出力されない
# 実際: GOOGLE_CLIENT_SECRET が出力される → 誤配置を検出
```

ワークフローの YAML レビューでも `secrets.GOOGLE_CLIENT_SECRET` の参照が存在すれば誤配置の証拠となる。

### 対処手順

```bash
# 誤登録されたシークレットを削除
gh secret delete GOOGLE_CLIENT_SECRET

# 正しい場所 (Cloudflare Secrets) に登録されているか確認
wrangler secret list --name <WORKER_NAME> | grep GOOGLE_CLIENT_SECRET
# 期待: GOOGLE_CLIENT_SECRET が存在する

# Cloudflare Secrets に登録されていない場合は再登録
wrangler secret put GOOGLE_CLIENT_SECRET --name <WORKER_NAME>
```

### AC への対応

- AC-1 (runtime / deploy secret の置き場が一意) の違反を検出・修復する

---

## A-02: deploy secret が Cloudflare Secrets に誤登録された

### シナリオ説明

`CLOUDFLARE_API_TOKEN` を GitHub Secrets ではなく Cloudflare Secrets に登録してしまった場合、
Workers の環境変数として deploy secret が公開されるリスクがある。

### 再現手順

```bash
# 意図的に誤った登録を行う (ダミー値で実施)
wrangler secret put CLOUDFLARE_API_TOKEN --name <WORKER_NAME>
# プロンプトに "dummy-cloudflare-token-for-test" と入力

# 誤登録を確認
wrangler secret list --name <WORKER_NAME> | grep CLOUDFLARE_API_TOKEN
# 出力: CLOUDFLARE_API_TOKEN  ← これが誤配置
```

### 期待されるエラー検出方法

```bash
# Cloudflare Secrets に deploy secret が混入していないか確認
wrangler secret list --name <WORKER_NAME> | grep -E "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID"
# 期待: 何も出力されない
# 実際: CLOUDFLARE_API_TOKEN が出力される → 誤配置を検出
```

### 対処手順

```bash
# 誤登録されたシークレットを Cloudflare Secrets から削除
wrangler secret delete CLOUDFLARE_API_TOKEN --name <WORKER_NAME>

# GitHub Secrets に正しく登録されているか確認
gh secret list | grep CLOUDFLARE_API_TOKEN
# 期待: CLOUDFLARE_API_TOKEN が存在する
```

### AC への対応

- AC-1 (runtime / deploy secret の置き場が一意) の違反を検出・修復する

---

## A-03: ワークフロートリガーが feature/* ブランチでデプロイを発火した

### シナリオ説明

`web-cd.yml` または `backend-deploy.yml` のトリガー設定に `feature/**` が含まれていた場合、
feature ブランチへの push で production/staging デプロイが意図せず実行される。

### 再現手順

```bash
# web-cd.yml を意図的に誤った設定にする (ローカルでのみ確認、push しない)
# on.push.branches に feature/** を追加した状態を仮定:
#
# on:
#   push:
#     branches:
#       - "feature/**"  ← これが誤り
#       - dev
#       - main

# ワークフロー内のトリガーブランチを確認
rg -n "feature" .github/workflows/web-cd.yml .github/workflows/backend-deploy.yml
# 期待: 何も出力されない
# 実際: feature がヒットする → 誤設定を検出
```

### 期待されるエラー検出方法

```bash
# ci.yml のみ feature/** を許可し、cd 系ワークフローは許可しないことを確認
echo "=== ci.yml のトリガー ==="
rg -A 10 "^on:" .github/workflows/ci.yml

echo "=== web-cd.yml のトリガー ==="
rg -A 10 "^on:" .github/workflows/web-cd.yml

echo "=== backend-deploy.yml のトリガー ==="
rg -A 10 "^on:" .github/workflows/backend-deploy.yml

# web-cd.yml / backend-deploy.yml に "feature" が含まれていないことを確認
rg "feature" .github/workflows/web-cd.yml .github/workflows/backend-deploy.yml
# 期待: 何も出力されない
```

### 対処手順

```yaml
# web-cd.yml / backend-deploy.yml の on.push.branches から feature/** を削除する
# 正しい設定:
on:
  push:
    branches:
      - dev    # staging のみ
      - main   # production のみ
```

```bash
# 修正後に確認
rg "feature" .github/workflows/web-cd.yml .github/workflows/backend-deploy.yml
# 期待: 何も出力されない
```

### AC への対応

- AC-2 (dev / main の trigger がブランチ戦略と一致) の違反を検出・修復する

---

## A-04: Cloudflare API トークンを rotation した後ワークフローが失敗した

### シナリオ説明

Cloudflare API トークンを rotation (旧トークンを失効させ新トークンを発行) した際に、
GitHub Secrets の更新を忘れてワークフローが認証エラーで失敗する。

### 再現手順

```bash
# Cloudflare ダッシュボードで旧トークンを失効させた状態をシミュレート
# (実際には失効させず、以下のコマンドで検出方法を確認する)

# 現在の GitHub Secrets に登録されているトークンが有効か確認
# (実値は確認できないが、ワークフローの実行結果で判断)
gh run list --workflow web-cd.yml --limit 5
# 最新の run が失敗していれば token rotation の影響の可能性がある

# ワークフロー失敗の詳細確認
gh run view <RUN_ID> --log-failed
# 期待エラー: "authentication required" or "invalid api token"
```

### 期待されるエラー検出方法

ワークフロー実行ログに以下のいずれかが出力される:

```
Error: Authentication error
Error: 10000: Authentication error [code: 10000]
wrangler: error: Error: A request to the Cloudflare API failed.
```

アラートの設定:
```bash
# GitHub Actions の失敗通知を設定する (GitHub ダッシュボードから設定)
# または gh CLI で最新の失敗 run を確認
gh run list --workflow web-cd.yml --status failure --limit 3
```

### 対処手順 (rotation runbook)

```bash
# Step 1: 新しい Cloudflare API トークンを発行
# Cloudflare ダッシュボード → My Profile → API Tokens → Create Token
# 権限: Edit Cloudflare Workers

# Step 2: GitHub Secrets を新しいトークンで更新
gh secret set CLOUDFLARE_API_TOKEN --body "<NEW_TOKEN>"

# Step 3: 1Password のアイテムも更新
op item edit "UBM-Hyogo Cloudflare" "api_token[password]=<NEW_TOKEN>"

# Step 4: ワークフローを手動で再実行して確認
gh workflow run web-cd.yml --ref dev
gh run watch  # 完了まで監視

# Step 5: 旧トークンを Cloudflare ダッシュボードで失効させる
# (新トークンでの動作確認後に実施)
```

### AC への対応

- AC-5 (secret rotation / revoke / rollback の runbook がある) を満たす

---

## A-05: production デプロイが失敗し旧バージョンに rollback が必要になった

### シナリオ説明

`main` ブランチへのデプロイ後に本番障害が発生し、直前の安定バージョンに戻す必要がある。

### 再現手順

```bash
# 現在の production Worker のバージョン一覧を確認
wrangler deployments list --name <WEB_WORKER_NAME_PRODUCTION>
# 出力例:
# Deployment ID: abc123  Created: 2026-04-26T10:00:00Z  Status: active
# Deployment ID: xyz789  Created: 2026-04-25T09:00:00Z  Status: inactive

# 障害を確認する (例: ヘルスチェック)
curl -I https://<PRODUCTION_DOMAIN>/api/health
# 期待: HTTP 200
# 実際: HTTP 500 → rollback が必要
```

### 期待されるエラー検出方法

```bash
# ヘルスチェックエンドポイントへの確認
curl -f https://<PRODUCTION_DOMAIN>/api/health || echo "HEALTH CHECK FAILED"

# Cloudflare のデプロイ状態確認
wrangler deployments list --name <WEB_WORKER_NAME_PRODUCTION>
```

### 対処手順 (rollback runbook)

```bash
# Step 1: 直前の安定バージョンの Deployment ID を特定
wrangler deployments list --name <WEB_WORKER_NAME_PRODUCTION>
# 例: xyz789 が直前の安定バージョン

# Step 2: rollback を実行
wrangler rollback --name <WEB_WORKER_NAME_PRODUCTION> --deployment-id xyz789
# または
wrangler rollback <DEPLOYMENT_ID> --name <WEB_WORKER_NAME_PRODUCTION>

# Step 3: rollback 後のヘルスチェック
curl -I https://<PRODUCTION_DOMAIN>/api/health
# 期待: HTTP 200

# Step 4: main ブランチの問題のあるコミットを revert
git revert <PROBLEM_COMMIT_SHA>
git push origin main
# → 新しいデプロイが走り、正常なコードが再デプロイされる

# Step 5: API Worker も同様に rollback が必要な場合
wrangler rollback --name <API_WORKER_NAME_PRODUCTION> --deployment-id <STABLE_DEPLOYMENT_ID>
```

### AC への対応

- AC-5 (secret rotation / revoke / rollback の runbook がある) を満たす
- AC-4 (web と api の deploy path が分離されている) により、web のみ rollback することも可能

---

## A-06: web と api が同一ワークフローファイルで混在した

### シナリオ説明

`web-cd.yml` が `apps/api` のデプロイも担当する状態になり、
web の変更が api のデプロイをトリガーする (またはその逆) 問題が発生する。

### 再現手順

```bash
# web-cd.yml に api のデプロイステップが混在していないか確認
rg -n "apps/api\|api-worker\|API_WORKER" .github/workflows/web-cd.yml
# 期待: 何も出力されない

# backend-deploy.yml に web のデプロイステップが混在していないか確認
rg -n "apps/web\|web-worker\|WEB_WORKER" .github/workflows/backend-deploy.yml
# 期待: 何も出力されない

# paths フィルタが正しく分離されているか確認
echo "=== web-cd.yml paths ==="
rg -A 5 "paths:" .github/workflows/web-cd.yml

echo "=== backend-deploy.yml paths ==="
rg -A 5 "paths:" .github/workflows/backend-deploy.yml
```

### 期待されるエラー検出方法

```bash
# web-cd.yml が api 関連のパスをトリガーとして含んでいないか
rg "apps/api" .github/workflows/web-cd.yml
# 期待: 何も出力されない

# backend-deploy.yml が web 関連のパスをトリガーとして含んでいないか
rg "apps/web" .github/workflows/backend-deploy.yml
# 期待: 何も出力されない
```

### 対処手順

```yaml
# web-cd.yml の paths を apps/web/** のみに限定する
on:
  push:
    branches: [dev, main]
    paths:
      - "apps/web/**"
      - "packages/**"    # 共有パッケージは両方でトリガー
      - "pnpm-lock.yaml"

# backend-deploy.yml の paths を apps/api/** のみに限定する
on:
  push:
    branches: [dev, main]
    paths:
      - "apps/api/**"
      - "packages/**"    # 共有パッケージは両方でトリガー
      - "pnpm-lock.yaml"
```

### AC への対応

- AC-4 (web と api の deploy path が分離されている) の違反を検出・修復する

---

## A-07: .env ファイルが誤って git にコミットされた

### シナリオ説明

`GOOGLE_CLIENT_SECRET` などの runtime secret が記載された `.env` ファイルが
誤ってリポジトリにコミットされ、ローカル正本が 1Password ではなく `.env` になってしまう。

### 再現手順

```bash
# .env のコミット履歴が存在しないか確認
git log --oneline --all -- ".env" ".env.local" ".env.production"
# 期待: 何も出力されない
# 実際: コミットが出力される → 漏洩の可能性

# .gitignore に .env が含まれているか確認
grep -E "^\.env" .gitignore
# 期待: .env または .env* が含まれる
```

### 期待されるエラー検出方法

```bash
# pre-commit フックまたは CI での検出 (rg を使った平文シークレットスキャン)
rg -rn "GOOGLE_CLIENT_SECRET\s*=\s*[^$({]" .
# 期待: 何も出力されない (環境変数参照のみ)

# git コミット履歴に .env が含まれていないか
git log --all --full-history -- "**/.env" "**/.env.*"
# 期待: 何も出力されない
```

### 対処手順

```bash
# Step 1: .gitignore に .env を追加 (未追加の場合)
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
git add .gitignore
git commit -m "chore: add .env to .gitignore"

# Step 2: コミット済みの .env を git 履歴から除去 (BFG Repo Cleaner を使用)
# ※ 実行前にリモートへの push を一時停止し、チームに通知する
bfg --delete-files .env
bfg --delete-files .env.local
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force-with-lease origin main dev

# Step 3: 漏洩した secret を直ちに rotation する
# - Google OAuth クライアントシークレットを再生成
# - 新しい値を 1Password に記録
# - Cloudflare Secrets に新しい値を登録

# Step 4: 1Password が正本であることをチームで再確認する
```

### AC への対応

- AC-3 (local canonical は 1Password Environments であり、平文 .env は正本ではない) の違反を検出・修復する

---

## 異常系シナリオ検出コマンド 一括確認スクリプト

```bash
#!/bin/bash
# 異常系の一括確認 (全シナリオの検出コマンドを順番に実行)

echo "=== A-01: runtime secret の GitHub Secrets 混入チェック ==="
RESULT=$(gh secret list 2>/dev/null | grep "GOOGLE_")
if [ -z "$RESULT" ]; then
  echo "PASS: runtime secret は GitHub Secrets にない"
else
  echo "FAIL: $RESULT"
fi

echo ""
echo "=== A-02: deploy secret の Cloudflare Secrets 混入チェック ==="
for WORKER in <WEB_WORKER_NAME> <API_WORKER_NAME>; do
  RESULT=$(wrangler secret list --name "$WORKER" 2>/dev/null | grep -E "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID")
  if [ -z "$RESULT" ]; then
    echo "PASS ($WORKER): deploy secret は Cloudflare Secrets にない"
  else
    echo "FAIL ($WORKER): $RESULT"
  fi
done

echo ""
echo "=== A-03: feature/* ブランチトリガーチェック ==="
for WF in web-cd.yml backend-deploy.yml; do
  RESULT=$(rg "feature" ".github/workflows/$WF" 2>/dev/null)
  if [ -z "$RESULT" ]; then
    echo "PASS ($WF): feature ブランチはトリガーに含まれない"
  else
    echo "FAIL ($WF): $RESULT"
  fi
done

echo ""
echo "=== A-06: web / api 分離チェック ==="
if rg -q "apps/api" .github/workflows/web-cd.yml 2>/dev/null; then
  echo "FAIL (web-cd.yml): apps/api への参照が存在する"
else
  echo "PASS (web-cd.yml): apps/api への参照なし"
fi

if rg -q "apps/web" .github/workflows/backend-deploy.yml 2>/dev/null; then
  echo "FAIL (backend-deploy.yml): apps/web への参照が存在する"
else
  echo "PASS (backend-deploy.yml): apps/web への参照なし"
fi

echo ""
echo "=== A-07: .env コミット履歴チェック ==="
RESULT=$(git log --oneline --all -- ".env" ".env.local" ".env.production" 2>/dev/null)
if [ -z "$RESULT" ]; then
  echo "PASS: .env のコミット履歴なし"
else
  echo "FAIL: .env がコミット履歴に存在する: $RESULT"
fi
```

---

## Phase 7 (検証項目網羅性) への引き継ぎ事項

### 引き継ぎ情報

| 項目 | 内容 |
| --- | --- |
| 検証済みシナリオ数 | 7件 (A-01 〜 A-07) |
| 対応 AC | AC-1, AC-2, AC-3, AC-4, AC-5 を全てカバー |
| 未検証の観点 | 複数シークレットが同時に rotation される場合、GitHub Environment の保護ルールが bypass される場合 |

### Phase 7 で確認すべき網羅性の観点

| 観点 | 内容 |
| --- | --- |
| AC トレース | 全 AC (AC-1 〜 AC-5) が最低1つの異常系シナリオでカバーされているか |
| 未カバー領域 | D1 マイグレーションの rollback、Cloudflare Workers の KV 設定 drift 等 |
| 自動検出化 | 一括確認スクリプトを CI に組み込む候補 |

### ブロック条件

- 本 Phase の全7シナリオで「再現手順」「検出方法」「対処手順」が揃っていること
- 一括確認スクリプトが構文エラーなく実行できること (`bash -n` での確認)
- 全 AC への対応が記述済みであること
