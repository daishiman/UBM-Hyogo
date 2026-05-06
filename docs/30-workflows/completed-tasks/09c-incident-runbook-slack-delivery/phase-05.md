# Phase 5: 実装ランブック — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

判定根拠: Phase 2 設計・Phase 3 レビュー・Phase 4 テスト戦略を統合し、Phase 6 (実装) / Phase 7 (テスト実装) / Phase 8 (テスト実行) / Phase 11 (運用検証) でそのまま実行できるステップバイステップの手順を確定する。1Password vault 設定、GitHub Secrets / Variables 登録、Slack workspace 準備、`pnpm` dep 追加、ロールバック手順、dryrun / production 配信コマンドを含むため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-incident-runbook-slack-delivery |
| phase | 5 / 13 |
| wave | 9c-fu |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| 想定実行者 | Claude Code（Phase 6+）+ 人間オペレーター（1Password / Slack admin / GitHub Secrets 登録） |

## 目的

Phase 6 以降の実装・実行が判断停止せず連続実行できるよう、(a) 前提環境のセットアップ、(b) コード追加・編集の順序、(c) 検証コマンド、(d) 失敗時のロールバック を網羅する。

## 前提条件チェックリスト（Phase 6 着手前に全て満たす）

- [ ] Node 24.15.0 / pnpm 10.33.2 が `mise install` 済み
- [ ] `op` CLI（1Password CLI）がローカルで認証済み（`op vault list` が成功）
- [ ] `gh` CLI が `daishiman/UBM-Hyogo` リポジトリに対し write 権限で認証済み
- [ ] Slack workspace（team_id `w1618436027-ek2505248`）に admin 権限がある
- [ ] 09c production deploy の workflow（`workflow_run` の source）がリポジトリ存在する

## ステップ A: Slack workspace 準備（人間オペレーター）

1. Slack admin 画面 → **Apps** → **Create New App** → **From scratch**
   - App name: `UBM Hyogo Incident Runbook Bot`
   - Workspace: `w1618436027-ek2505248`
2. **OAuth & Permissions** → **Bot Token Scopes** に以下を追加:
   - `chat:write`
   - `chat:write.public`
   - `links:read`
3. **Install to Workspace** → bot token (`xox[b]-...`) を発行
4. Slack 画面で channel 作成:
   - production: `#ubm-hyogo-incident-runbook`
   - dryrun: `#ubm-hyogo-incident-runbook-dryrun`
5. 各 channel で bot を招待: `/invite @UBM Hyogo Incident Runbook Bot`
6. 各 channel の channel id を URL から取得（`https://app.slack.com/client/<TEAM>/<CHANNEL_ID>` の `<CHANNEL_ID>` 部分。`C` で始まる）

> 取得した token / channel id は **どこにもコピペで残さない**。次ステップで直接 1Password / GitHub に投入する。

## ステップ B: 1Password vault 設定

1. 1Password で vault `UBM-Hyogo` を選択（無ければ作成）
2. 新規 item 作成:
   - Type: **API Credential**
   - Title: `Slack Bot - Incident Runbook`
   - Field `credential`: ステップ A-3 で発行した bot token を貼り付け
   - URL: `https://api.slack.com/apps/<APP_ID>`
3. 参照記法: `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential`
4. ローカル `.env` に以下を追記（実値ではなく op 参照のみ）:

```
SLACK_BOT_TOKEN_INCIDENT_RUNBOOK="op://UBM-Hyogo/Slack Bot - Incident Runbook/credential"
```

> production channel id は `.env` に **置かない**（誤配信防止 / Phase 3 F4 WARN 対応）。dryrun channel id のみ local 用途で置く場合は `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID="Cxxxx..."` を直書き可（id は secret ではない）。

## ステップ C: GitHub Secrets / Variables 登録

```bash
# Secret: bot token （値は stdin から op で読む。シェル history に残さない）
op read "op://UBM-Hyogo/Slack Bot - Incident Runbook/credential" \
  | gh secret set SLACK_BOT_TOKEN_INCIDENT_RUNBOOK \
      --repo daishiman/UBM-Hyogo \
      --env production-slack-delivery

op read "op://UBM-Hyogo/Slack Bot - Incident Runbook/credential" \
  | gh secret set SLACK_BOT_TOKEN_INCIDENT_RUNBOOK \
      --repo daishiman/UBM-Hyogo \
      --env production-slack-delivery-dryrun

# Variables: channel id （非機密）
gh variable set SLACK_INCIDENT_RUNBOOK_CHANNEL_ID \
  --body "C_PRODUCTION_CHANNEL_ID_HERE" \
  --repo daishiman/UBM-Hyogo \
  --env production-slack-delivery

gh variable set SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID \
  --body "C_DRYRUN_CHANNEL_ID_HERE" \
  --repo daishiman/UBM-Hyogo \
  --env production-slack-delivery-dryrun
```

GitHub Actions environments を作成:

```bash
# 既存環境がない場合は GitHub UI から作成（gh CLI で environments の create はサポート限定）
# Settings → Environments → New environment
# 1) production-slack-delivery-dryrun: required reviewers なし
# 2) production-slack-delivery       : required reviewers = repository admin (1人以上)
```

## ステップ D: 依存追加

```bash
# scripts ワークスペースまたは root に @slack/web-api を追加
mise exec -- pnpm add @slack/web-api -w
mise exec -- pnpm add -D tsx @types/node -w   # 既に入っていればスキップ

# lockfile が更新されることを確認
git status pnpm-lock.yaml
```

## ステップ E: コード追加（Phase 6 で実行）

実装順序（依存最小から先に作る）:

1. `scripts/notify/render-template.ts`（pure 関数 / `renderTemplate`, `buildRunbookPermalink`）
2. `scripts/notify/slack-incident-runbook.template.json`（Phase 2 の Block Kit JSON）
3. `scripts/notify/save-slack-evidence.ts`（`ensureDir` + `writeJson` 内部分割）
4. `scripts/notify/slack-incident-runbook.ts`（CLI / `postIncidentRunbook` 本体 / log mask）
5. `scripts/notify/slack-incident-runbook.sh`（with-env.sh ラッパー）
6. `.github/workflows/incident-runbook-slack-delivery.yml`（dryrun → production の 2 job）

各ファイルのシグネチャ・期待動作は `phase-02.md` の該当節を参照。

`scripts/notify/slack-incident-runbook.sh` の中身（参考）:

```bash
#!/usr/bin/env bash
set -euo pipefail
exec bash "$(dirname "$0")/../with-env.sh" \
  mise exec -- tsx "$(dirname "$0")/slack-incident-runbook.ts" "$@"
```

## ステップ F: テスト追加（Phase 7 で実行）

Phase 4 で確定したテストファイルを以下の順で実装:

1. `__tests__/render-template.test.ts`
2. `__tests__/permalink.test.ts`
3. `__tests__/save-slack-evidence.test.ts`
4. `__tests__/mode-switch.test.ts`
5. `__tests__/slack-incident-runbook.test.ts`（U-09〜U-18 / I-01〜I-04）
6. `__tests__/dryrun-smoke.e2e.ts`（手動 / CI 限定）

## ステップ G: ローカル検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/notify/__tests__ --coverage

# token / channel id 漏出が無いか確認
git diff --staged | rg -F "xox[b]-" && echo "LEAK!" && exit 1 || echo "no leak"
```

## ステップ H: dryrun smoke 実行（Phase 11 runtime evidence 取得）

```bash
# ローカルから dryrun channel に 1 件送信
bash scripts/notify/slack-incident-runbook.sh \
  --mode dryrun \
  --release-version "v1.4.2" \
  --deployed-at    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --runbook-path   "<resolved-09b-incident-runbook-path-from-aiworkflow-quick-reference>" \
  --oncall-handle  "@ubm-hyogo-oncall" \
  --commit-sha     "$(git rev-parse HEAD)" \
  --evidence-dir   "docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence"

# 期待: outputs/phase-11/evidence/slack-delivery-dryrun.json が生成され
# {"ok":true,"mode":"dryrun","ts":"...","message":{"permalink":"https://..."}} を含む
```

GitHub Actions 経由 (`workflow_dispatch`):

```bash
gh workflow run incident-runbook-slack-delivery.yml \
  --repo daishiman/UBM-Hyogo \
  -f release_version="v1.4.2" \
  -f deployed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -f oncall_handle="@ubm-hyogo-oncall"

gh run watch --repo daishiman/UBM-Hyogo
```

## ステップ I: production 配信実行（user approval 経由）

1. dryrun job が成功したことを確認
2. GitHub UI で `production-slack-delivery` environment の **Review deployments** から approve
3. production channel への post 完了を Slack 上で目視確認
4. evidence (`docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-production.json`) を git に commit

## ロールバック手順

| 事象 | 対応コマンド / 操作 |
| --- | --- |
| 誤って production channel に dryrun message が出た | Slack 上で bot 自身の post を `chat.delete`（API or 3 dot menu → Delete）。Phase 11 main.md に経緯を記録 |
| token 漏洩疑い | (1) Slack admin で旧 token を **Revoke** (2) Slack app 画面で **Reinstall** → 新 token (3) 1Password で `op item edit` → 新値 (4) `gh secret set` で GitHub 側更新 (5) 漏洩した可能性のある log / commit を gh / git で精査 |
| workflow を恒久的に無効化したい | `.github/workflows/incident-runbook-slack-delivery.yml` の `on:` を `workflow_dispatch:` のみに縮退、または PR で revert |
| GitHub Secrets を削除して bot を停止したい | `gh secret delete SLACK_BOT_TOKEN_INCIDENT_RUNBOOK --env production-slack-delivery --repo daishiman/UBM-Hyogo`（同 dryrun 環境も同様）|
| 1Password item を削除する場合 | bot を Slack admin で停止してから item 削除。順序を逆にすると CI が token 解決で fail し続ける |

## 失敗時の典型エラーと一次対応

| エラー | 原因 | 一次対応 |
| --- | --- | --- |
| `not_in_channel` | bot が channel に招待されていない | ステップ A-5 を再実行 |
| `channel_not_found` | channel id 誤り、または private channel に bot 未招待 | GitHub Variables の値を確認、private なら bot を招待 |
| `invalid_auth` | token 不正・revoked | ステップ B / C を最新値で再投入 |
| `missing env: SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | env 未注入（`with-env.sh` 経由でない / GitHub `env:` 未設定） | local は `bash scripts/notify/slack-incident-runbook.sh` 経由、CI は workflow yaml の `env:` を確認 |
| `ratelimited` | Slack rate limit | 1 分以上空けて再実行（本スクリプトは自動 retry しない） |

## 実行コマンド一覧サマリ

| 用途 | コマンド |
| --- | --- |
| 依存インストール | `mise exec -- pnpm install` |
| 型 / lint | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| unit/integration | `mise exec -- pnpm vitest run scripts/notify/__tests__ --coverage` |
| local dryrun smoke | `bash scripts/notify/slack-incident-runbook.sh --mode dryrun ...` |
| CI dryrun trigger | `gh workflow run incident-runbook-slack-delivery.yml -f release_version=...` |
| production approve | GitHub UI: Review deployments → Approve |
| token leak check | `git diff --staged \| rg -F "xox[b]-"` |
| evidence 確認 | `cat docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json \| jq .` |
| indexes 再生成（Phase 12） | `mise exec -- pnpm indexes:rebuild` |

## アクセス制御 / 監査

- GitHub Secrets / Variables 変更は audit log に記録される（`gh api repos/daishiman/UBM-Hyogo/actions/secrets`）
- 1Password item 変更は vault audit log に記録
- Slack bot post は workspace audit log に記録（admin pane で確認可能）

## 参照資料

- `phase-02.md` / `phase-03.md` / `phase-04.md`
- `index.md` / `artifacts.json`
- CLAUDE.md（secret 管理、`scripts/with-env.sh`）
- `docs/30-workflows/09a-A-staging-deploy-smoke-execution/phase-05.md`（フォーマット参照）
- Slack API: https://api.slack.com/methods/chat.postMessage / chat.getPermalink
- 1Password CLI docs: `op read` / `op run`

## サブタスク管理

- [ ] Slack workspace bot 作成 / channel 作成 / bot 招待
- [ ] 1Password vault item 作成
- [ ] GitHub Secrets / Variables / Environments 登録
- [ ] `@slack/web-api` 依存追加
- [ ] コード追加（ステップ E の 1〜6）
- [ ] テスト追加（ステップ F の 1〜6）
- [ ] dryrun smoke 実行 → evidence 取得
- [ ] production 配信 approve → evidence 取得
- [ ] ロールバック手順を README / phase-12 に転記
- [ ] `outputs/phase-05/main.md` 作成

## 成果物

- `outputs/phase-05/main.md`

## Definition of Done（Phase 5）

- [ ] Slack workspace 準備手順（bot 作成・scope・channel・招待）が再現可能な粒度で記載
- [ ] 1Password vault item 名・field 名・参照記法 (`op://...`) が確定
- [ ] `gh secret set` / `gh variable set` のコマンドが値プレースホルダー付きで記載されている
- [ ] GitHub Actions environments（dryrun / production）の用途と reviewer 要件が明示されている
- [ ] 依存追加コマンド（`pnpm add @slack/web-api`）が記載
- [ ] 実装順序（依存最小から）が確定
- [ ] dryrun / production の実行コマンドが local / CI 双方で書かれている
- [ ] ロールバック手順（誤配信 / token 漏洩 / 恒久停止）が網羅
- [ ] token 漏出チェック (`rg -F "xox[b]-"`) が手順に組み込まれている
- [ ] `outputs/phase-05/main.md` にサマリが保存されている

## 次 Phase への引き渡し

Phase 6 へ:
- 実装順序（render-template → template.json → save-evidence → CLI → wrapper → workflow yaml）
- WebClient DI 化（Phase 3 WARN 対応）を含む実装
- Phase 4 テスト戦略をそのまま test ファイルに展開する材料

Phase 11 へ:
- dryrun / production smoke コマンドと evidence 取得手順
- 失敗時の一次対応マッピング
