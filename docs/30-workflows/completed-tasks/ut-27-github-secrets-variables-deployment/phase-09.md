# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | GitHub Secrets / Variables 配置実行 (ut-27-github-secrets-variables-deployment) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | pending |
| タスク種別 | implementation / NON_VISUAL / github_secrets_variables_cd_enablement |

## 目的

Phase 8 で SSOT 化した secret / variable インベントリ表・テンプレ関数 5 件・runbook テンプレ・helper 化候補を前提に、本タスク固有の品質保証チェックを行う。具体的には (1) `.github/workflows/backend-ci.yml` / `web-cd.yml` 中の secret / variable 参照キーが Phase 2 / Phase 8 SSOT と完全一致することの **workflow 参照整合検証**、(2) 1Password 参照（`op://UBM-Hyogo/...`）の **実在確認手順**、(3) `references/environment-variables.md` / `deployment-secrets-management.md` / `deployment-gha.md` 等の **リンク切れチェック**、(4) Phase 11 / 13 runbook の **mirror parity**（同一テンプレ参照で内容が乖離していないこと）、(5) AC-1〜AC-15 の **Phase 10 への blocker ゼロ事前確認** を観点固定で実施する。本ワークフローは pending（spec_created 段階）に閉じるため、無料枠見積・a11y は対象外（GitHub REST API のみで完結 / UI なし）と明記する。secret hygiene は本タスクの主目的であるため対象内とし、AC-13（secret 値転記禁止）の機械検証手順を確定する。検証コマンド SSOT は本仕様書 §検証コマンドに集約。

## 実行タスク

1. workflow 参照整合検証手順を確定する（完了条件: `.github/workflows/backend-ci.yml` / `web-cd.yml` の `secrets.X` / `vars.X` 参照キーを `grep` で抽出し、Phase 8 SSOT インベントリ表の 4 件（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` / `CLOUDFLARE_PAGES_PROJECT`）と完全一致することの突合手順が記述）。
2. 1Password 参照の実在確認手順を確定する（完了条件: `op://UBM-Hyogo/Cloudflare/api_token_{env}` 等の参照について `op item get "Cloudflare" --vault UBM-Hyogo --fields api_token_staging,api_token_production,account_id` と `op item get "Discord" --vault UBM-Hyogo --fields webhook_url` の確認手順が記述、値そのものは出力しない）。
3. リンク切れチェック手順を確定する（完了条件: `references/environment-variables.md` / `deployment-secrets-management.md` / `deployment-gha.md` / `.github/workflows/backend-ci.yml` / `.github/workflows/web-cd.yml` / CLAUDE.md への相対 / 絶対参照が `grep -rn` + `ls` 突合で全件存在することが手順化）。
4. Phase 11 / 13 runbook の mirror parity 検証手順を確定する（完了条件: 両 runbook が `apply-runbook.template.md` を同じテンプレとして参照し、テンプレ外の独自手順がないことを diff ベースで確認する手順が記述）。
5. AC-1〜AC-15 の Phase 10 blocker ゼロ事前確認手順を確定する（完了条件: 各 AC が Phase 1〜8 のどの章で確定したかを表化し、未確定の AC があれば Phase 10 で blocker 化される旨が明記）。
6. AC-13（secret 値転記禁止）の機械検証手順を確定する（完了条件: `grep -rE 'gh[a-zA-Z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{20,}|https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+'` 等のパターンで全 outputs / runbook を走査し、検出 0 を期待する手順が記述）。
7. 対象外項目（無料枠 / a11y）を明記し、secret hygiene は対象内であることを明記する（完了条件: 各項目の判定理由が記述）。
8. line budget / link 整合 / navigation drift を `validate-phase-output.js` で機械検証する（完了条件: exit 0 を期待値として記述、pending 段階では NOT EXECUTED 許容）。
9. outputs/phase-09/main.md に QA チェックリスト結果を集約する（完了条件: 1 ファイルにすべて記述、pending のためプレースホルダ可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-08.md | DRY 化済みの SSOT |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-08/main.md | SSOT 集約先 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md | AC-1〜AC-15 / Phase 一覧 |
| 必須 | docs/30-workflows/ut-27-github-secrets-variables-deployment/artifacts.json | path 整合の起点 |
| 必須 | .github/workflows/backend-ci.yml | secret / variable 参照キーの正本 |
| 必須 | .github/workflows/web-cd.yml | secret / variable 参照キーの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 1Password 同期方針の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 配置マトリクスの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI/CD Secrets 要件の正本 |
| 必須 | CLAUDE.md（シークレット管理）| 1Password 正本ポリシー |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 機械検証スクリプト |
| 参考 | docs/30-workflows/ut-gov-001-github-branch-protection-apply/phase-09.md | QA phase の構造参照 |

## QA 観点 1: workflow 参照整合検証

### 1.1 抽出対象

| workflow ファイル | 抽出パターン | 期待ヒット数 |
| --- | --- | --- |
| `.github/workflows/backend-ci.yml` | `secrets\.CLOUDFLARE_API_TOKEN` / `secrets\.CLOUDFLARE_ACCOUNT_ID` / `secrets\.DISCORD_WEBHOOK_URL` | 各 1 件以上 |
| `.github/workflows/web-cd.yml` | `secrets\.CLOUDFLARE_API_TOKEN` / `secrets\.CLOUDFLARE_ACCOUNT_ID` / `secrets\.DISCORD_WEBHOOK_URL` / `vars\.CLOUDFLARE_PAGES_PROJECT` | 各 1 件以上 |

### 1.2 検証スクリプト（pending の擬似）

```bash
verify_workflow_refs() {
  local rc=0
  local file="$1"
  shift
  for key in "$@"; do
    if ! grep -qE "$key" "$file"; then
      echo "MISS: $key in $file"
      rc=1
    else
      echo "OK:   $key in $file"
    fi
  done
  return $rc
}

# backend-ci.yml の secret 3 件
verify_workflow_refs .github/workflows/backend-ci.yml \
  'secrets\.CLOUDFLARE_API_TOKEN' \
  'secrets\.CLOUDFLARE_ACCOUNT_ID' \
  'secrets\.DISCORD_WEBHOOK_URL'

# web-cd.yml の secret 3 件 + variable 1 件
verify_workflow_refs .github/workflows/web-cd.yml \
  'secrets\.CLOUDFLARE_API_TOKEN' \
  'secrets\.CLOUDFLARE_ACCOUNT_ID' \
  'secrets\.DISCORD_WEBHOOK_URL' \
  'vars\.CLOUDFLARE_PAGES_PROJECT'

# Phase 8 SSOT インベントリ表との突合（逆方向）
ssot_keys=$(grep -oE 'CLOUDFLARE_(API_TOKEN|ACCOUNT_ID|PAGES_PROJECT)|DISCORD_WEBHOOK_URL' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-08/main.md \
  | sort -u)
echo "SSOT keys:"
echo "$ssot_keys"
```

### 1.3 期待結果

- 4 件すべて `OK`（backend-ci.yml は 3 件、web-cd.yml は 4 件）。
- 1 件でも `MISS` があれば Phase 10 で blocker B 化、UT-05 へのフィードバックとして Phase 12 unassigned に登録。
- SSOT インベントリ表の 4 キーと workflow grep の 4 キーが完全一致（差集合 0）。

## QA 観点 2: 1Password 参照の実在確認

### 2.1 確認対象

| op 参照 | 用途 | 確認コマンド（値は出力しない） |
| --- | --- | --- |
| `op://UBM-Hyogo/Cloudflare/api_token_staging` | staging 用 API Token | `op item get "Cloudflare" --vault UBM-Hyogo --fields api_token_staging --format json \| jq -r '.value \| length > 0'` |
| `op://UBM-Hyogo/Cloudflare/api_token_production` | production 用 API Token | 同上 `api_token_production` |
| `op://UBM-Hyogo/Cloudflare/account_id` | Cloudflare Account ID | 同上 `account_id` |
| `op://UBM-Hyogo/Discord/webhook_url` | Discord Webhook URL | `op item get "Discord" --vault UBM-Hyogo --fields webhook_url --format json \| jq -r '.value \| length > 0'` |

### 2.2 検証スクリプト（値は出力しない）

```bash
verify_op_field_exists() {
  local item="$1"
  local field="$2"
  local exists
  exists=$(op item get "$item" --vault UBM-Hyogo --fields "$field" --format json 2>/dev/null \
    | jq -r 'if type == "object" then (.value // "" | length > 0) else false end')
  if [ "$exists" = "true" ]; then
    echo "OK:   op://UBM-Hyogo/$item/$field exists"
  else
    echo "MISS: op://UBM-Hyogo/$item/$field"
    return 1
  fi
}

verify_op_field_exists Cloudflare api_token_staging
verify_op_field_exists Cloudflare api_token_production
verify_op_field_exists Cloudflare account_id
verify_op_field_exists Discord webhook_url
```

### 2.3 期待結果

- 4 件すべて `OK`（値の長さ > 0 のみ確認、値そのものは絶対に出力しない）。
- 1 件でも `MISS` があれば Phase 13 着手前に 1Password 側を整備（01b へフィードバック）。
- pending 段階では `op` 認証未確立の場合 SKIP 扱い、Phase 13 着手直前に必ず実走。

## QA 観点 3: リンク切れチェック

### 3.1 チェック対象

| 種別 | 対象パス | 確認方法 |
| --- | --- | --- |
| ワークフロー | `.github/workflows/backend-ci.yml` | `[ -f ]` 存在確認 |
| ワークフロー | `.github/workflows/web-cd.yml` | 同上 |
| reference | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 同上 |
| reference | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 同上 |
| reference | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 同上 |
| 親仕様 | `docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md` | 同上 |
| CLAUDE | `CLAUDE.md` | 同上 |
| 上流 | UT-05 / UT-28 / 01b の親仕様（unassigned-task 配下） | 同上 |

### 3.2 検証スクリプト

```bash
verify_link_target() {
  local path="$1"
  if [ -f "$path" ] || [ -d "$path" ]; then
    echo "OK:   $path"
  else
    echo "MISS: $path"
    return 1
  fi
}

# 必須 8 件
for p in \
  .github/workflows/backend-ci.yml \
  .github/workflows/web-cd.yml \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/references/deployment-gha.md \
  docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md \
  CLAUDE.md; do
  verify_link_target "$p"
done

# index.md / phase-NN.md / outputs から相対参照を全件抽出して突合
grep -rEohn '\]\((\.\./|\./|outputs/)[^)]+\)' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/ \
  | sort -u
```

### 3.3 期待結果

- 必須 7 件すべて `OK`。
- 相対参照のうち存在しない path が 0。
- 1 件でも `MISS` があれば Phase 10 で blocker 化。

## QA 観点 4: Phase 11 / 13 runbook の mirror parity

### 4.1 確認対象

| 比較ペア | 期待 |
| --- | --- |
| Phase 11 `apply-runbook.md` セクション構成 ↔ `apply-runbook.template.md`（Phase 8 SSOT） | テンプレに無いセクションが 0 |
| Phase 13 `apply-runbook.md` セクション構成 ↔ `apply-runbook.template.md` | テンプレに無いセクションが 0 |
| Phase 11 / 13 の secret 名・variable 名表記 | 4 件の正規名のみ（typo 0） |
| Phase 11 / 13 の op 参照表記 | `op://UBM-Hyogo/{Item}/{Field}` 統一 |
| Phase 11（リハーサル）と Phase 13（本番）の差分 | リハーサル用注釈 / user_approval 行 のみが差分（手順本体は同一） |

### 4.2 検証スクリプト

```bash
# テンプレと runbook の section heading 突合
diff \
  <(grep -E '^##+ ' \
    docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-08/apply-runbook.template.md 2>/dev/null \
    | sort -u) \
  <(grep -E '^##+ ' \
    docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/apply-runbook.md 2>/dev/null \
    | sort -u) \
  || echo "WARN: section drift between template and Phase 13 runbook"

# Phase 11 / 13 の用語表記揺れ検出
grep -rEohn 'CLOUDFLARE_(API_TOKEN|ACCOUNT_ID|PAGES_PROJECT)|DISCORD_WEBHOOK_URL' \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-11/ \
  docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-13/ \
  | sort | uniq -c
```

### 4.3 期待結果

- section drift WARN なし（テンプレと runbook の section が一致）。
- 4 件の正規名のみが grep ヒット（変な略称・大文字小文字違いなし）。
- pending 段階ではテンプレ未生成のため SKIP 扱い、Phase 11 / 13 着手後に実走。

## QA 観点 5: AC-1〜AC-15 の Phase 10 blocker ゼロ事前確認

### 5.1 AC × 確定先 章のマッピング

| AC | 内容（要約） | 確定先 章 | 事前 PASS / pending |
| --- | --- | --- | --- |
| AC-1 | API Token 必要スコープ手順 | Phase 2 §API Token / Phase 5 lane 3 | PASS |
| AC-2 | ACCOUNT_ID 配置先・手順 | Phase 2 §配置決定マトリクス | PASS |
| AC-3 | DISCORD_WEBHOOK_URL 未設定耐性 | Phase 2 §動作確認 / Phase 6 異常系 | pending（Phase 6 確定後） |
| AC-4 | CLOUDFLARE_PAGES_PROJECT を Variable とする理由 | Phase 1 §苦戦箇所 §2 / Phase 2 §Variable 一覧 | PASS |
| AC-5 | environments staging / production 作成手順 | Phase 2 lane 2 / Phase 5 lane 2 | PASS |
| AC-6 | repository vs environment 配置決定マトリクス | Phase 2 §配置決定マトリクス | PASS |
| AC-7 | dev push で backend-ci deploy-staging green | Phase 2 §動作確認 / Phase 11 smoke | pending（Phase 11 確定後） |
| AC-8 | dev push で web-cd deploy-staging green | 同上 | pending（Phase 11 確定後） |
| AC-9 | Discord 通知成功 / 未設定耐性 | Phase 2 §動作確認 / Phase 6 / Phase 11 | pending |
| AC-10 | 1Password 同期手順（手動 + 将来 op SA） | Phase 2 §同期手順 / Phase 12 documentation | pending（Phase 12 確定後） |
| AC-11 | 4 条件 PASS（Phase 1 / 3 双方） | Phase 1 / Phase 3 | PASS |
| AC-12 | 上流 3 件完了確認 3 重明記 | Phase 1 / 2 / 3 | PASS |
| AC-13 | secret 値転記禁止 | 全 Phase / 本 Phase §6 機械検証 | PASS |
| AC-14 | `if: secrets.X != ''` 評価不能の代替設計 | Phase 2 / Phase 6 / Phase 11 | pending |
| AC-15 | Phase 1〜13 が artifacts.json と一致 | artifacts.json | PASS |

### 5.2 期待結果

- pending 段階で PASS = 8 件、pending = 7 件（Phase 4〜12 で順次確定予定）。
- Phase 10 着手時点で全 15 件 PASS 化が必要。1 件でも未確定なら Phase 10 で blocker 化。

## QA 観点 6: AC-13（secret 値転記禁止）機械検証

### 6.1 検出パターン

| 種別 | 正規表現 | 期待ヒット数 |
| --- | --- | --- |
| Cloudflare API Token | `[a-zA-Z0-9_-]{40,}`（コンテキスト: `CLOUDFLARE_API_TOKEN.*=`） | 0 |
| GitHub PAT | `gh[ps]_[a-zA-Z0-9]{36,}` | 0 |
| JWT 様 | `eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}` | 0 |
| Discord Webhook URL | `https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+` | 0 |
| Cloudflare Account ID（hex 32 桁） | `\b[a-f0-9]{32}\b`（コンテキスト: `ACCOUNT_ID.*=`） | 0 |

### 6.2 検証スクリプト

```bash
verify_no_secret_leak() {
  local rc=0
  local target="docs/30-workflows/ut-27-github-secrets-variables-deployment/"

  # Discord Webhook URL
  if grep -rnE 'https://discord\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+' "$target"; then
    echo "NG: Discord webhook leaked"
    rc=1
  fi

  # JWT 様
  if grep -rnE 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}' "$target"; then
    echo "NG: JWT-like token leaked"
    rc=1
  fi

  # GitHub PAT
  if grep -rnE 'gh[ps]_[a-zA-Z0-9]{36,}' "$target"; then
    echo "NG: GitHub PAT leaked"
    rc=1
  fi

  # CF API Token suspect (40+ chars assigned to CLOUDFLARE_API_TOKEN)
  if grep -rnE 'CLOUDFLARE_API_TOKEN[[:space:]]*=[[:space:]]*["'\'']?[a-zA-Z0-9_-]{40,}' "$target"; then
    echo "NG: Cloudflare API Token suspect leaked"
    rc=1
  fi

  [ $rc -eq 0 ] && echo "OK: no secret leaks detected"
  return $rc
}
verify_no_secret_leak
```

### 6.3 期待結果

- すべての検出パターンで 0 ヒット。
- 1 件でも検出されたら即時 Phase 10 blocker、対象 phase / outputs を直ちに修正。

## QA 観点 7: line budget / link 整合 / navigation drift

| チェック | 方法 | 期待 |
| --- | --- | --- |
| line budget (phase-NN.md) | `wc -l docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-*.md` | 各 100〜500 行 |
| line budget (index.md) | 同上 | 250 行以内（既存 213 行 → PASS 余裕） |
| line budget (outputs/main.md) | 同上 | 50〜400 行 |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| Phase 13 outputs 4 ファイル | main + apply-runbook + op-sync-runbook + verification-log | 一致 |
| 相対参照リンク切れ | `grep -rn '](\.\./'` + ls 突合 | 0 |
| `validate-phase-output.js` | 実走 | exit 0 |

## 対象内 / 対象外項目（明記）

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| secret hygiene（AC-13 機械検証 / op 参照実在確認 / `--body` 直書き禁止） | **対象内（主目的）** | 本タスクの中核責務 |
| workflow 参照整合 | 対象内 | secret / variable 名と workflow 参照キーの一致がタスク成立の前提 |
| 1Password 参照の実在確認 | 対象内 | 1Password 正本 / GitHub 派生の前提条件 |
| リンク切れ | 対象内 | reference / workflow / 親仕様への参照ドリフトを防ぐ |
| Phase 11 / 13 mirror parity | 対象内 | Phase 8 テンプレ統合の品質ゲート |
| 無料枠見積（Workers / D1 / Sheets） | 対象外 | 本タスクは Cloudflare resource を消費しない。GitHub REST API + 1Password CLI のみで完結 |
| a11y (WCAG 2.1) | 対象外 | UI なし。`apps/web` を触らない |
| free-tier-estimation.md | 不要 | 上記 1 項目が対象外のため別ファイル化しない |

## 検証コマンド（SSOT）

> 各関数の本体は §1 / §2 / §3 / §6 を参照。本セクションは呼び出しのみ。

```bash
# 1. workflow 参照整合（§1.2 verify_workflow_refs）
# 2. 1Password 参照実在（§2.2 verify_op_field_exists）— Phase 13 着手直前で実走
# 3. リンク切れ（§3.2）— 必須 7 件 + 相対参照
# 4. mirror parity（§4.2）— Phase 11 / 13 runbook 生成後に実走
# 5. AC-13 secret 値転記検出（§6.2 verify_no_secret_leak）
# 6. line budget
wc -l docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-*.md \
      docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-*/main.md
# 7. validate-phase-output.js
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/ut-27-github-secrets-variables-deployment
```

## QA チェックリスト（サマリー）

> 詳細は `outputs/phase-09/main.md`。本仕様書には観点のみ記載。

| # | 観点 | 判定基準 | 結果プレースホルダ |
| --- | --- | --- | --- |
| 1 | workflow 参照整合（4 キー × 2 ファイル） | 全 OK | pending（実走可） |
| 2 | 1Password 参照実在（4 fields） | 全 OK | pending（Phase 13 直前実走） |
| 3 | リンク切れ（必須 7 件 + 相対参照） | 0 件 MISS | pending（実走可） |
| 4 | Phase 11 / 13 mirror parity | section drift 0 | pending（Phase 11 / 13 後） |
| 5 | AC-1〜AC-15 事前確認 | 全 PASS（Phase 10 着手時） | pending = 7 件 → 0 件目標 |
| 6 | AC-13 secret 値転記検出 | 0 ヒット | pending（実走可） |
| 7 | line budget | 範囲内 | pending（実走可） |
| 8 | navigation drift | 0 | pending（実走可） |
| 9 | secret hygiene | 対象内・全 PASS | pending |
| 10 | 無料枠 | 対象外 | resource 消費なし |
| 11 | a11y | 対象外 | UI なし |
| 12 | validate-phase-output.js | exit 0 | pending（実走可） |

## 実行手順

### ステップ 1: workflow 参照整合検証手順の固定
- backend-ci.yml × 3 キー / web-cd.yml × 4 キーを grep ベースで確定。

### ステップ 2: 1Password 参照実在確認手順の固定
- `op item get --fields ... --format json | jq '.value | length > 0'` で値長のみ確認、値そのものは出力しない。

### ステップ 3: リンク切れ検出手順の固定
- 必須 7 件の `[ -f ]` 確認 + 相対参照の grep + ls 突合。

### ステップ 4: Phase 11 / 13 mirror parity 手順の固定
- section heading 差分 / 用語表記揺れの 2 観点。

### ステップ 5: AC-1〜AC-15 事前確認表の固定
- 各 AC の確定先章をマッピング、PASS / pending を明示。

### ステップ 6: AC-13 機械検証手順の固定
- 5 種の検出パターン（Discord / JWT / GH PAT / CF Token / Account ID hex）を擬似コード化。

### ステップ 7: 対象外 / 対象内項目の明記
- secret hygiene 対象内 / 無料枠・a11y 対象外を理由付きで確定。

### ステップ 8: line budget / link 整合 / drift 確認
- `wc -l` / `grep` / `validate-phase-output.js` の 3 ツール。

### ステップ 9: outputs/phase-09/main.md 集約
- QA 12 項目を 1 ファイルに集約（pending プレースホルダ可）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | QA 12 項目の判定結果を GO/NO-GO 根拠に使用 |
| Phase 11 | 1Password 参照実在 / mirror parity を smoke リハーサルで実走 |
| Phase 12 | implementation-guide.md に検証コマンドを転記 |
| Phase 13 | PR description に QA サマリーを転記、本適用前に AC-13 機械検証を再実走 |

## 多角的チェック観点

- 価値性: workflow 参照整合 / op 参照実在 / リンク切れ / mirror parity / AC-13 の 5 観点で 401 / 404 / drift / secret 漏洩事故を Phase 10 GO/NO-GO 前に検知できる。
- 実現性: `grep` / `op` / `gh` / 既存 validate-phase-output.js で完結、新規依存なし。
- 整合性: 不変条件 #5 を侵害しない / Phase 8 SSOT を維持 / CLAUDE.md と GitHub 実値の二重正本 drift を grep で検出。
- 運用性: 検証コマンドが SSOT 化されており再現可能。
- 認可境界: secret hygiene 対象内、AC-13 機械検証で値転記事故を予防。
- 無料枠: resource 消費なし、対象外明記。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | workflow 参照整合検証手順 | 9 | pending | 4 キー × 2 ファイル |
| 2 | 1Password 参照実在確認手順 | 9 | pending | 4 fields |
| 3 | リンク切れチェック手順 | 9 | pending | 必須 7 件 + 相対参照 |
| 4 | Phase 11 / 13 mirror parity | 9 | pending | section drift 検出 |
| 5 | AC-1〜AC-15 事前確認表 | 9 | pending | PASS 8 / pending 7 |
| 6 | AC-13 機械検証手順 | 9 | pending | 5 種パターン |
| 7 | 対象外 / 対象内項目明記 | 9 | pending | 無料枠 / a11y / secret hygiene |
| 8 | line budget / link / drift | 9 | pending | validate-phase-output.js |
| 9 | outputs/phase-09/main.md 集約 | 9 | pending | QA 12 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA チェックリスト 12 項目の結果集約 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] workflow 参照整合検証手順が 4 キー × 2 ファイルで記述
- [ ] 1Password 参照実在確認手順が 4 fields で記述（値非出力ポリシー含む）
- [ ] リンク切れチェック手順が必須 7 件 + 相対参照で記述
- [ ] Phase 11 / 13 mirror parity 検証手順が section / 用語の 2 観点で記述
- [ ] AC-1〜AC-15 の事前 PASS / pending 表が確定（Phase 10 着手時 PASS 化目標）
- [ ] AC-13 secret 値転記検出が 5 種パターンで記述
- [ ] 対象内 / 対象外項目が理由付きで明記（secret hygiene 対象内）
- [ ] line budget / link 切れ / navigation drift 確認手順が記述
- [ ] validate-phase-output.js の期待値（exit 0）が記述
- [ ] outputs/phase-09/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（9 件）が `pending`
- 成果物 `outputs/phase-09/main.md` 配置予定
- secret hygiene が対象内、無料枠 / a11y が対象外として明記
- 検証コマンド SSOT が 1 箇所に集約
- artifacts.json の `phases[8].status` が `pending`

## 苦戦防止メモ

- `op item get --fields ... --format json` の出力には値そのものが含まれるため、必ず `jq -r '.value | length > 0'` でブール化。生 JSON は出さない。
- workflow 参照整合は表記揺れ（`secrets.X` vs `${{ secrets.X }}`）に弱い。grep は `secrets\.X` で広めに。
- AC-13 機械検証は誤検知が起きやすい（hex 32 桁が普通の hash と衝突等）。コンテキスト付き grep で絞る。
- mirror parity は Phase 8 テンプレ生成後でないと判定不能。pending 段階では SKIP、Phase 11 / 13 着手後に実走。
- 1Password / GitHub 認証が未確立の実行者もいるため、ステップごとに SKIP 条件を明記。

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - QA 12 項目の判定結果（pending プレースホルダ）
  - workflow 参照整合検証手順（4 キー × 2 ファイル）
  - 1Password 参照実在確認手順（4 fields・値非出力）
  - AC-1〜AC-15 事前確認表（PASS 8 / pending 7 → Phase 10 着手時 全 PASS 化目標）
  - AC-13 secret 値転記検出（5 種パターン）
  - 対象内（secret hygiene）/ 対象外（無料枠・a11y）の確定
- ブロック条件:
  - workflow 参照整合手順が 4 キー × 2 ファイル未満
  - 1Password 参照実在確認に値出力経路が混入
  - リンク切れが 1 件でも残る
  - AC-13 検出パターンが 5 種未満
  - 対象内 / 対象外の判定理由が欠落
