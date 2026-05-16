# task-02-adjacent-unregistered-secret-inventory

[実装区分: 実装仕様書]

根拠: 上位 workflow `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/index.md` の task-02 責務（prior investigation で抽出した未登録 secret 15 件を「投入 / 整合 / 廃止」のいずれかに確定し、workflow YAML 修正と user 投入手順記述を 1 サイクル内で完結）に基づく実装サイクル仕様書。AI による YAML 編集と inventory 記録、user による secret 投入と廃止確認が混在するため、phase-3 で定義した実装ステップを 1 ファイルで完結させる。

## 概要

prior investigation で抽出した未登録 secret 15 件を 1 件ずつ分類確定し、整合分は workflow YAML を AI が編集、投入分は user が `op + gh secret set` で投入、廃止分は workflow YAML から参照削除（必要に応じて workflow file 削除は user 確認後）する。最終成果物として `inventory.md`（決定根拠の表）と修正済み workflow YAML 群を 1 サイクル内で揃え、task-03 完成後に `scripts/ci/verify-env-secrets.sh` が exit 0 になる状態を満たす。

## 実装区分

- 区分: 実装仕様書（実装サイクル / 1 サイクル完結）
- スコープ: `.github/workflows/*.yml` の secret 参照修正、`docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-02-adjacent-unregistered-secret-inventory/inventory.md` 新規作成
- 範囲外: task-03 で扱う `scripts/ci/verify-env-secrets.sh` 本体実装、task-01 で扱う staging runtime smoke secret 群、Cloudflare 本番運用 token のローテーション計画

## 対象 secret 一覧 (15 件)

| # | secret 名 | 参照 workflow | phase-2 初期分類案 | 確定分類 (本サイクルで決定) |
|---|-----------|---------------|--------------------|------------------------------|
| 1 | CLOUDFLARE_API_TOKEN_STAGING | `d1-migration-verify.yml:40,59` | 整合 | 整合（`staging` env scope の `CLOUDFLARE_API_TOKEN` に統一） |
| 2 | CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY | `post-release-dashboard.yml:50,76` | 投入 | 投入（readonly token 新規発行） |
| 3 | CF_AUDIT_D1_TOKEN_PROD | `cf-audit-log-monitor.yml:69,79` | 要調査 | 投入（production audit token） |
| 4 | CF_AUDIT_R2_TOKEN_PROD | `cf-audit-log-cold-storage.yml:42,64` | 要調査 | 投入（production R2 token） |
| 5 | CF_AUDIT_TOKEN_PROD | `cf-audit-log-monitor.yml:70` | 要調査 | 投入（production audit token） |
| 6 | CF_AUDIT_WORKERS_AI_TOKEN | `cf-audit-log-monitor.yml:82` | 要調査 | 投入（Workers AI audit token） |
| 7 | CLOUDFLARE_ACCOUNT_TAG | `cloudflare-analytics-export.yml:83` | 投入 or vars 移行 | user 判定後に Variables 移行を第一候補、機密扱いなら投入 |
| 8 | CLOUDFLARE_ZONE_TAG | `cloudflare-analytics-export.yml:82` | 投入 or vars 移行 | user 判定後に Variables 移行を第一候補、機密扱いなら投入 |
| 9 | CLOUDFLARE_ALERTS_TOKEN_READ | alert 系 | 投入 | 投入 |
| 10 | CLOUDFLARE_ANALYTICS_API_TOKEN | analytics 系 | 投入 | 投入 |
| 11 | CLOUDFLARE_ALERT_RELAY_URL | alert relay | 投入 | 投入 |
| 12 | AUTH_SECRET | Auth.js | 投入 | 投入（env scope ごとに別値） |
| 13 | EMAIL_WEBHOOK_URL | `cf-audit-log-monitor.yml:114` | 整合 or 廃止 | 投入（optional mail webhook。workflow guard 維持） |
| 14 | SLACK_BOT_TOKEN_INCIDENT_RUNBOOK | `incident-runbook-slack-delivery.yml:100,141` | 整合 | 投入（bot token。webhook へ集約しない） |
| 15 | SLACK_WEBHOOK_URL | `post-release-30day-auto-summary.yml:50` | 整合 | 投入（または user 承認後に canonical webhook 名へ YAML 整合） |

## 分類フロー

5W1H で各 secret を確定する。

- **Who**: AI が現状参照箇所と最終発火履歴を収集して分類案を提示し、user が「整合 / 廃止」分類の妥当性を確認、投入は user が実行する。
- **What**: 各 secret について次を収集し `inventory.md` に記録する。
  - 参照箇所一覧: `rg -n 'secrets\.<NAME>' .github/workflows/`
  - 最終発火: `gh run list -w <workflow>.yml -L 5`
  - 直近成功/失敗の理由（secret 不在 fail か機能 fail か）
- **When**: 本サイクル内で全 15 件を一括判定。task-03 着手前に確定済みであること。
- **Where**: 記録先は `inventory.md`（本タスクディレクトリ直下）。
- **Why**: phase-3 の DoD「未登録 secret 0 件」を満たすため、各 secret の存在意義を確定する。
- **How**: 下記の決定木に従う。
  1. workflow が現在運用継続中か（最終発火が 90 日以内 / runbook で参照 / 仕様書で必須） → 継続なら 2 へ、非継続なら「廃止」候補。
  2. 既存登録済み secret（例: `CLOUDFLARE_API_TOKEN`）で代替可能か → 可能なら「整合」、不可能なら 3 へ。
  3. 機密値か → 機密なら「投入」(GitHub Secrets)、非機密なら GitHub Variables へ移行（本タスクでは vars 移行も「整合」サブ分類として扱う）。

## 変更対象ファイル

| ファイル | 変更種別 | 概要 |
|----------|----------|------|
| `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-02-adjacent-unregistered-secret-inventory/inventory.md` | 新規 | 15 件の分類根拠表 |
| `.github/workflows/d1-migration-verify.yml` | 編集 | `CLOUDFLARE_API_TOKEN_STAGING` → `CLOUDFLARE_API_TOKEN` 置換 + `environment: staging` 付与 |
| `.github/workflows/post-release-dashboard.yml` | 編集なし（投入確定後に動作確認のみ） | secret 投入後に gate pass を確認 |
| `.github/workflows/cf-audit-log-monitor.yml` | user 操作待ち | `CF_AUDIT_D1_TOKEN_PROD` / `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_WORKERS_AI_TOKEN` / `EMAIL_WEBHOOK_URL` を name-only provision |
| `.github/workflows/cf-audit-log-cold-storage.yml` | user 操作待ち | `CF_AUDIT_R2_TOKEN_PROD` を name-only provision |
| `.github/workflows/cloudflare-analytics-export.yml` | user 判定後に必要なら編集 | `CLOUDFLARE_ACCOUNT_TAG` / `CLOUDFLARE_ZONE_TAG` は Variables 移行第一候補、`CLOUDFLARE_ANALYTICS_API_TOKEN` は provision |
| `.github/workflows/cloudflare-alerts-drift.yml` | user 操作待ち | alerts token / relay URL provision |
| `.github/workflows/incident-runbook-slack-delivery.yml` | user 操作待ち | bot token provision |
| `.github/workflows/lighthouse.yml` | user 操作待ち | `AUTH_SECRET` provision |
| `.github/workflows/post-release-30day-auto-summary.yml` | user 操作待ち / user 承認後に必要なら編集 | `SLACK_WEBHOOK_URL` provision or canonical webhook rename |

> 参照 workflow の網羅検出は `rg -n 'secrets\.(CLOUDFLARE_API_TOKEN_STAGING|CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY|CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_R2_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|CLOUDFLARE_ACCOUNT_TAG|CLOUDFLARE_ZONE_TAG|CLOUDFLARE_ALERTS_TOKEN_READ|CLOUDFLARE_ANALYTICS_API_TOKEN|CLOUDFLARE_ALERT_RELAY_URL|AUTH_SECRET|EMAIL_WEBHOOK_URL|SLACK_BOT_TOKEN_INCIDENT_RUNBOOK|SLACK_WEBHOOK_URL)' .github/workflows/` を本サイクルで一度実行し、inventory.md の参照箇所列を埋める。

## 整合分の YAML 編集仕様

### `d1-migration-verify.yml`

- `secrets.CLOUDFLARE_API_TOKEN_STAGING` の 2 箇所（`:40` と `:59`）を `secrets.CLOUDFLARE_API_TOKEN` に置換する。
- 該当 job に `environment: staging` を付与し、env scope の `CLOUDFLARE_API_TOKEN` が解決されるようにする。
- `gh secret list --env staging` に `CLOUDFLARE_API_TOKEN` が存在することを事前確認（不在なら task-01 範囲で投入済みであることを inventory.md に記録）。

### Slack 系

- repo-level に `SLACK_WEBHOOK_INCIDENT` が既登録なら、`SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` / `SLACK_WEBHOOK_URL` 参照を `SLACK_WEBHOOK_INCIDENT` に集約する。
- bot token と webhook が別目的（bot は API 呼び出し、webhook は通知）なら集約せず、scope 明示と名称統一だけ行う。判断は inventory.md に記録。

### vars 移行 (`CLOUDFLARE_ACCOUNT_TAG` / `CLOUDFLARE_ZONE_TAG`)

- 非機密と確定したら `${{ secrets.CLOUDFLARE_ACCOUNT_TAG }}` を `${{ vars.CLOUDFLARE_ACCOUNT_TAG }}` に置換。
- `gh variable set CLOUDFLARE_ACCOUNT_TAG --body '<value>'`（user 実行）を投入手順に含める。

### 共通

- 編集後は `pnpm exec actionlint .github/workflows/<edited>.yml` で syntax pass を確認。

## 投入分の user 操作手順

各 secret について以下のテンプレを `inventory.md` に展開し、user が実行する。

```bash
# scope: <repo|env:staging|env:production>
op read 'op://<Vault>/<Item>/<Field>' | gh secret set <SECRET_NAME> --env <SCOPE_OR_OMIT_FOR_REPO>
# 確認
gh api repos/daishiman/UBM-Hyogo/environments/<SCOPE>/secrets --jq '.secrets[].name' | grep <SECRET_NAME>
# または repo-level: gh api repos/daishiman/UBM-Hyogo/actions/secrets --jq '.secrets[].name' | grep <SECRET_NAME>
```

投入対象 15 件分の枠（各 secret 1 ブロックずつ・計 15 ブロック）を `inventory.md` に列挙し、user が埋める。実値は inventory.md にも本仕様書にも一切残さない。

| # | secret 名 | scope (案) | op 参照 (記入欄) |
|---|-----------|-----------|------------------|
| 1 | CLOUDFLARE_API_TOKEN_STAGING | （整合のため新規投入不要） | - |
| 2 | CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY | repo | `op://.../CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY/credential` |
| 3 | CF_AUDIT_D1_TOKEN_PROD | env:production | 調査後記入 |
| 4 | CF_AUDIT_R2_TOKEN_PROD | env:production | 調査後記入 |
| 5 | CF_AUDIT_TOKEN_PROD | env:production | 調査後記入 |
| 6 | CF_AUDIT_WORKERS_AI_TOKEN | env:production | 調査後記入 |
| 7 | CLOUDFLARE_ACCOUNT_TAG | repo (vars 移行候補) | 非機密確定なら vars |
| 8 | CLOUDFLARE_ZONE_TAG | repo (vars 移行候補) | 非機密確定なら vars |
| 9 | CLOUDFLARE_ALERTS_TOKEN_READ | repo | 記入 |
| 10 | CLOUDFLARE_ANALYTICS_API_TOKEN | repo | 記入 |
| 11 | CLOUDFLARE_ALERT_RELAY_URL | repo | 記入 |
| 12 | AUTH_SECRET | env:staging / env:production 別値 | 記入 |
| 13 | EMAIL_WEBHOOK_URL | 廃止確定なら不要 | - |
| 14 | SLACK_BOT_TOKEN_INCIDENT_RUNBOOK | 整合確定なら不要 | - |
| 15 | SLACK_WEBHOOK_URL | 整合確定なら不要 | - |

## 廃止分の処理仕様

1. 廃止確定 secret について workflow YAML 上の `${{ secrets.<NAME> }}` 参照を削除する。
2. 参照を持つ step 全体が廃止 secret に依存するなら、step を削除するか `if: false` でガードする。
3. workflow file 全体が廃止 secret 専用で他に役割が無い場合、ファイル削除は user 確認後に実施（AI 単独でファイル削除しない）。
4. 廃止記録を `inventory.md` に「廃止理由 / 最終発火 / 影響範囲 / 代替手段」で残す。
5. 廃止後に `gh secret delete <NAME>` を user に提示（既登録だった場合のみ）。

## テスト方針

| 分類 | 検証コマンド | 期待結果 |
|------|--------------|----------|
| 整合分 | `pnpm exec actionlint .github/workflows/<edited>.yml` | exit 0 |
| 整合分 (`d1-migration-verify.yml`) | 編集後の `rg -n 'CLOUDFLARE_API_TOKEN_STAGING' .github/workflows/d1-migration-verify.yml` | 0 件 |
| 投入分 | `gh api repos/daishiman/UBM-Hyogo/actions/secrets --jq '.secrets[].name'` および env scope 版 | 対象 secret 名が含まれる |
| 投入分 (vars 移行) | `gh api repos/daishiman/UBM-Hyogo/actions/variables --jq '.variables[].name'` | `CLOUDFLARE_ACCOUNT_TAG` / `CLOUDFLARE_ZONE_TAG` が含まれる |
| 廃止分 | `rg -n 'secrets\.<NAME>' .github/workflows/` | 0 件 |
| 全体 | `pnpm exec actionlint .github/workflows/*.yml` | exit 0 |
| task-03 連携 | `bash scripts/ci/verify-env-secrets.sh`（task-03 完成後） | exit 0 |

## ローカル実行コマンド

```bash
# 参照箇所網羅検出
rg -n 'secrets\.(CLOUDFLARE_API_TOKEN_STAGING|CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY|CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_R2_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|CLOUDFLARE_ACCOUNT_TAG|CLOUDFLARE_ZONE_TAG|CLOUDFLARE_ALERTS_TOKEN_READ|CLOUDFLARE_ANALYTICS_API_TOKEN|CLOUDFLARE_ALERT_RELAY_URL|AUTH_SECRET|EMAIL_WEBHOOK_URL|SLACK_BOT_TOKEN_INCIDENT_RUNBOOK|SLACK_WEBHOOK_URL)' .github/workflows/

# 最終発火確認 (例)
gh run list -w d1-migration-verify.yml -L 5
gh run list -w post-release-dashboard.yml -L 5

# 既登録 secret 一覧
gh api repos/daishiman/UBM-Hyogo/actions/secrets --jq '.secrets[].name'
gh api repos/daishiman/UBM-Hyogo/environments/staging/secrets --jq '.secrets[].name'
gh api repos/daishiman/UBM-Hyogo/environments/production/secrets --jq '.secrets[].name'

# Variables 一覧
gh api repos/daishiman/UBM-Hyogo/actions/variables --jq '.variables[].name'

# YAML syntax 検証
mise exec -- pnpm exec actionlint .github/workflows/*.yml

# task-03 完成後の preflight gate
bash scripts/ci/verify-env-secrets.sh
```

## DoD

- 全 15 件の分類が確定し `inventory.md` に「参照箇所 / 最終発火 / 確定分類 / 根拠」で記録されている。
- 整合分の workflow YAML が修正済みで `pnpm exec actionlint` が exit 0。
- `d1-migration-verify.yml` から `CLOUDFLARE_API_TOKEN_STAGING` 参照が消え、`environment: staging` が付与されている。
- 投入分の secret が `gh api .../secrets` の一覧に含まれていることを user が確認済み。
- vars 移行分が `gh api .../variables` の一覧に含まれていることを user が確認済み。
- 廃止分の `${{ secrets.<NAME> }}` 参照が `rg` で 0 件。
- task-03 完成後に `scripts/ci/verify-env-secrets.sh` が exit 0。
- 仕様書および inventory.md に実値（token 値・URL 内 token・webhook secret 等）が一切残っていない。

## 不変条件

- 実値非開示: AI / user とも、secret 実値を本仕様書・`inventory.md`・PR・log に転記しない。op 参照と secret 名のみ記述。
- 整合分の workflow YAML 編集は AI 実行可。ただし `pnpm exec actionlint` pass を必ず確認する。
- 廃止分について workflow file 自体の削除は user 確認後のみ実施（参照削除は AI 可）。
- secret 投入 / 削除 / vars 設定 (`gh secret set` / `gh secret delete` / `gh variable set`) は user 実行。AI は手順テンプレ提示のみ。
- 上位 workflow 設計書（`index.md` / `phase-1.md` / `phase-2.md` / `phase-3.md`）は参照のみで更新しない。
- task-01 範囲（staging runtime smoke secret）および task-03 範囲（`verify-env-secrets.sh` 実装）には踏み込まない。
- 既存 D1 schema / Google Form schema / API endpoint surface は変更しない（本タスクは CI 設定変更のみ）。

## References

- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/index.md`
- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-1.md`
- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-2.md`
- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/phase-3.md`
- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-01-staging-runtime-smoke-secret-finalization/`
- `docs/30-workflows/ci-env-secret-inventory-and-preflight-gate/task-03-env-secret-preflight-gate/`
- `.github/workflows/d1-migration-verify.yml`
- `.github/workflows/post-release-dashboard.yml`
- `CLAUDE.md` (シークレット管理 / Cloudflare 系 CLI 実行ルール)
- `scripts/cf.sh` / `scripts/with-env.sh`
