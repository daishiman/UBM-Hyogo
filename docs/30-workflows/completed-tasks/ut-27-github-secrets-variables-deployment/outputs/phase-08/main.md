# Phase 8 出力: リファクタリング (DRY 化) — 集約結果

> **status: pending — NOT EXECUTED**
> 本ファイルは Phase 5 着手後の DRY 化レビュー / Phase 13 本番 runbook 派生時に参照される spec レベル成果物です。実 secret 配置・実コード生成は本タスクのスコープ外（Phase 13 ユーザー承認後の別オペレーション）。

## 1. SSOT インベントリ表（secret / variable × scope × op 参照）

| # | 名前 | 種別 | 配置 scope | 値の出所 | op 参照 | 命名規則 / 補足 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `CLOUDFLARE_API_TOKEN` | Secret | environment-scoped (`staging` / `production`) | 01b で発行 | `op://UBM-Hyogo/Cloudflare/api_token_staging` / `op://UBM-Hyogo/Cloudflare/api_token_production` | Token 名: `ubm-hyogo-cd-{env}-{yyyymmdd}`。Cloudflare 側スコープ: `Account.Cloudflare Pages.Edit` / `Account.Workers Scripts.Edit` / `Account.D1.Edit` / `Account.Account Settings.Read` のみ |
| 2 | `CLOUDFLARE_ACCOUNT_ID` | Secret | repository-scoped | 01b で取得 | `op://UBM-Hyogo/Cloudflare/account_id` | staging / production 同一アカウント想定 |
| 3 | `DISCORD_WEBHOOK_URL` | Secret | repository-scoped | Discord 側で発行 | `op://UBM-Hyogo/Discord/webhook_url` | チャンネル分離が必要なら environment-scoped に切替（Phase 11 smoke 後に判断） |
| 4 | `CLOUDFLARE_PAGES_PROJECT` | **Variable** | repository-scoped | UT-28 で命名確定 | `op://UBM-Hyogo/Cloudflare/pages_project_name`（参考。Variable は機密でないため op 必須ではない） | `web-cd.yml` で `${{ vars.X }}-staging` の suffix 連結。Secret 化禁止 (AC-4) |

> **本表が SSOT**。Phase 5 / 11 / 13 の runbook は本表へのリンクのみで成立させる。

## 2. テンプレ関数擬似コード（5 件）

> bash function として記述。Phase 5 着手時に inline / helper script 切り出しを判定。

### 2.1 `set_secret_from_op(NAME, OP_REF, [ENV])` — secret 配置 4 段パターン SSOT

```bash
set_secret_from_op() {
  local name="$1"
  local op_ref="$2"
  local env="${3:-}"  # 空なら repository-scoped
  local val
  set -euo pipefail
  val=$(op read "$op_ref")
  if [ -z "$val" ]; then
    echo "NG: empty value from $op_ref" >&2
    return 1
  fi
  if [ -n "$env" ]; then
    gh secret set "$name" --env "$env" --body "$val" > /dev/null
    echo "OK: $name (env=$env)"
  else
    gh secret set "$name" --body "$val" > /dev/null
    echo "OK: $name (repository-scoped)"
  fi
  unset val
}
```

### 2.2 `create_environment(name)` — environment 作成（冪等）

```bash
create_environment() {
  local name="$1"
  # PUT は冪等（既存なら更新扱い）
  gh api "repos/{owner}/{repo}/environments/$name" \
    -X PUT \
    -f wait_timer=0 \
    -f reviewers='[]' \
    > /dev/null
  echo "OK: env=$name"
}
```

### 2.3 `set_variable(NAME, VALUE, [ENV])` — Variable 配置

```bash
set_variable() {
  local name="$1"
  local value="$2"
  local env="${3:-}"
  if [ -n "$env" ]; then
    gh variable set "$name" --env "$env" --body "$value" > /dev/null
    echo "OK: $name=$value (env=$env)"
  else
    gh variable set "$name" --body "$value" > /dev/null
    echo "OK: $name=$value (repository-scoped)"
  fi
}
```

### 2.4 `update_op_last_updated(item, env)` — 1Password Last-Updated メモ更新

```bash
update_op_last_updated() {
  local item="$1"
  local env="${2:-all}"
  local now
  now=$(date -Iseconds)
  # Item Notes に「Last-Updated: 2026-04-29T... (env=staging) by daishimanju」を追記
  op item edit "$item" --vault UBM-Hyogo \
    "notesPlain[text]=Last-Updated: $now (env=$env) by $USER" \
    > /dev/null
  echo "OK: op-memo updated $item ($env)"
}
```

### 2.5 `verify_cd_green(branch, expected_jobs)` — dev push smoke 検証

```bash
verify_cd_green() {
  local branch="$1"
  shift
  local expected_jobs=("$@")
  local run_id
  run_id=$(gh run list --branch "$branch" --limit 1 --json databaseId -q '.[0].databaseId')
  echo "Latest run on $branch: $run_id"
  gh run watch "$run_id" --exit-status
  for job in "${expected_jobs[@]}"; do
    if gh run view "$run_id" --json jobs -q ".jobs[] | select(.name==\"$job\") | .conclusion" \
        | grep -q success; then
      echo "OK: $job"
    else
      echo "NG: $job not success"
      return 1
    fi
  done
}
```

## 3. apply-runbook テンプレ統合（`apply-runbook.template.md` 想定構成）

> 実ファイルは Phase 13 で派生生成。Phase 11 はリハーサル用、Phase 13 は本番用として同テンプレを参照。

### 3.1 セクション構成（5 章固定）

| # | 章 | 内容 | 利用するテンプレ関数 |
| --- | --- | --- | --- |
| 1 | environment 作成 | `staging` / `production` を for-each で作成 | `create_environment` |
| 2 | secret 配置 | 3 件の Secret を SSOT 表に従い配置 | `set_secret_from_op` |
| 3 | variable 配置 | `CLOUDFLARE_PAGES_PROJECT` を配置 | `set_variable` |
| 4 | dev push smoke | 空 commit push → CD green / Discord 通知 / 未設定耐性 | `verify_cd_green` |
| 5 | Last-Updated メモ更新 | 1Password Item Notes に同期日時追記 | `update_op_last_updated` |

### 3.2 ループパターン（per-env 独立 PUT）

```bash
# environment 作成
for env in staging production; do create_environment "$env"; done

# environment-scoped secret (CLOUDFLARE_API_TOKEN)
for env in staging production; do
  set_secret_from_op CLOUDFLARE_API_TOKEN "op://UBM-Hyogo/Cloudflare/api_token_${env}" "$env"
done

# repository-scoped secrets
set_secret_from_op CLOUDFLARE_ACCOUNT_ID  "op://UBM-Hyogo/Cloudflare/account_id"
set_secret_from_op DISCORD_WEBHOOK_URL    "op://UBM-Hyogo/Discord/webhook_url"

# repository-scoped variable
set_variable CLOUDFLARE_PAGES_PROJECT "$TMP_CF_PAGES_PROJECT"  # UT-28 確定値を op 参照から取得

# 動作確認
verify_cd_green dev "deploy-staging (backend-ci)" "deploy-staging (web-cd)" "notify-discord"

# Last-Updated メモ
update_op_last_updated Cloudflare staging
update_op_last_updated Cloudflare production
update_op_last_updated Discord
```

> **注**: per-env 独立 PUT を堅持。1 ループ反復ごとに 1 PUT。bulk 配置 / 同名 repository × environment 併存は禁止。

## 4. 将来 helper 化候補（Phase 12 unassigned-task-detection.md に登録予定）

| # | helper script 名（候補） | 責務 | 入力 | 出力 | 配置先（将来） |
| --- | --- | --- | --- | --- | --- |
| 1 | `scripts/gh-secret-set-from-op.sh` | `op read` → 一時変数 → `gh secret set` → `unset` の 4 段パターン | NAME / OP_REF / [ENV] | `OK NAME [ENV]` のみ | scripts/ 配下 |
| 2 | `scripts/gh-env-create.sh` | `gh api repos/.../environments/{name} -X PUT` の冪等実行 | NAME / [reviewers] / [wait_timer] | `OK env=NAME` | scripts/ 配下 |
| 3 | `scripts/gh-variable-set.sh` | `gh variable set NAME --body VALUE [--env ENV]` のラッパー | NAME / VALUE / [ENV] | `OK NAME=VALUE [ENV]` | scripts/ 配下 |

> **本タスクで実装しない**。次 Wave 以降の IaC 化フェーズ（案 D `1password/load-secrets-action` / 案 C Terraform GitHub Provider 検討と同タイミング）で再評価。

## 5. Before / After 集約

### 5.1 secret 配置コマンド（3 件 × 最大 2 環境 = 最大 6 箇所重複の解消）

```diff
- # Before: runbook に直書きが 6 箇所散在
- gh secret set CLOUDFLARE_API_TOKEN --env staging --body "$(op read op://...)"
- gh secret set CLOUDFLARE_API_TOKEN --env production --body "$(op read op://...)"
- # ... 各 secret について同じパターンが繰り返される
+ # After: テンプレ関数 + ループ
+ for env in staging production; do
+   set_secret_from_op CLOUDFLARE_API_TOKEN "op://UBM-Hyogo/Cloudflare/api_token_${env}" "$env"
+ done
+ set_secret_from_op CLOUDFLARE_ACCOUNT_ID  "op://UBM-Hyogo/Cloudflare/account_id"
+ set_secret_from_op DISCORD_WEBHOOK_URL    "op://UBM-Hyogo/Discord/webhook_url"
```

### 5.2 environment 作成

```diff
- gh api repos/{owner}/{repo}/environments/staging    -X PUT -f wait_timer=0 -f reviewers='[]'
- gh api repos/{owner}/{repo}/environments/production -X PUT -f wait_timer=0 -f reviewers='[]'
+ for env in staging production; do create_environment "$env"; done
```

### 5.3 用語統一

| Before（混在） | After（統一） |
| --- | --- |
| 「正本」「canonical」「正規」 | 「正本 (canonical) = 1Password」 |
| 「コピー」「同期値」「mirrored」 | 「派生コピー (GitHub Secrets / Variables)」 |
| 「repo scope」「リポジトリ scope」 | 「repository-scoped」 |
| 「Discord 未設定 OK」 | 「DISCORD_WEBHOOK_URL 未設定耐性」 |

## 6. navigation drift 確認結果（pending・実走時に更新）

| チェック項目 | 期待 | 実走結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` × 実 path | 完全一致 | NOT EXECUTED |
| index.md `Phase 一覧` × `ls phase-*.md` | 完全一致 | NOT EXECUTED |
| Phase 13 outputs 4 ファイル | main + apply-runbook + op-sync-runbook + verification-log | NOT EXECUTED |
| secret / variable 名表記 | 4 件の正規名のみ | NOT EXECUTED |
| op 参照表記 | `op://UBM-Hyogo/...` 統一 | NOT EXECUTED |
| Phase 11 / 13 runbook の参照先 | `apply-runbook.template.md` 経由のみ | NOT EXECUTED |

## 7. 削除対象一覧（実装時に Phase 5 / 11 / 13 で除去）

- Phase 11 / 13 runbook の `gh secret set` 個別記述（テンプレ参照に置換）
- secret 値を `--body` 直書きする擬似コード（AC-13 違反）
- 同名 repository-scoped × environment-scoped 併存を許容する分岐
- `CLOUDFLARE_PAGES_PROJECT` を Secret 配置する分岐（AC-4 違反）
- `if: ${{ secrets.X != '' }}` を正解として扱う記述（§3 苦戦箇所違反）

## 8. 完了条件（Phase 8 仕様書 §完了条件と対応）

- [x] Before/After テーブル 5 区分すべて記述
- [x] 重複コード抽出 8 件
- [x] テンプレ関数 5 件擬似コード
- [x] helper 化候補 3 件（Phase 12 登録方針付き）
- [x] secret 値転記禁止の保証（テンプレ関数 + 検証コマンド）
- [ ] navigation drift 0（実走可、本ファイルでは pending）

## 9. 次 Phase への申し送り

- Phase 9: 本 SSOT を入力に workflow 参照整合 / op 参照実在 / mirror parity / AC-13 機械検証を行う。
- Phase 11: `apply-runbook.template.md` をリハーサル用として実走、`verify_cd_green` を dev push に対し実行。
- Phase 12: helper 化候補 3 件を unassigned-task-detection.md に登録、テンプレ関数を implementation-guide.md に転記。
- Phase 13: 本 SSOT を本番版 `apply-runbook.md` に派生、user_approval ゲート後に実 PUT。
