# Phase 5 サマリ — 実装ランブック

[実装区分: 実装仕様書]

## ステップ一覧

| 段階 | 内容 |
| --- | --- |
| A | Slack workspace 準備（bot 作成 / scope `chat:write` `chat:write.public` `links:read` / channel 作成 / bot 招待 / channel id 取得） |
| B | 1Password vault `UBM-Hyogo` に item `Slack Bot - Incident Runbook` を作成し `credential` field に bot token 格納。`.env` には `op://...` 参照のみ |
| C | `gh secret set` で `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` を `production-slack-delivery` / `production-slack-delivery-dryrun` の両 environment に登録、`gh variable set` で channel id を登録 |
| D | `mise exec -- pnpm add @slack/web-api -w` で依存追加 |
| E | コード追加（render-template → template.json → save-evidence → CLI → wrapper sh → workflow yaml の順） |
| F | テスト追加（render → permalink → save-evidence → mode-switch → CLI integration → e2e） |
| G | ローカル検証（typecheck / lint / vitest / token leak check） |
| H | dryrun smoke 実行 → evidence 取得 |
| I | production 配信を GitHub Actions environment で approve → evidence 取得 |

## 主要コマンド

```bash
# 依存追加
mise exec -- pnpm add @slack/web-api -w

# secret 登録（値はシェル history に残さない）
op read "op://UBM-Hyogo/Slack Bot - Incident Runbook/credential" \
  | gh secret set SLACK_BOT_TOKEN_INCIDENT_RUNBOOK \
      --repo daishiman/UBM-Hyogo --env production-slack-delivery

# variable
gh variable set SLACK_INCIDENT_RUNBOOK_CHANNEL_ID --body "C..." \
  --repo daishiman/UBM-Hyogo --env production-slack-delivery

# local dryrun
bash scripts/notify/slack-incident-runbook.sh \
  --mode dryrun --release-version v1.4.2 \
  --deployed-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --runbook-path "docs/30-workflows/02-application-implementation/09b-.../incident-runbook.md" \
  --oncall-handle "@ubm-hyogo-oncall"

# CI dispatch
gh workflow run incident-runbook-slack-delivery.yml \
  -f release_version=v1.4.2 \
  -f deployed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -f oncall_handle="@ubm-hyogo-oncall"
```

## ロールバック

- 誤配信: bot 自身の post を `chat.delete`
- token 漏洩: Slack admin で revoke → reinstall → 1Password 更新 → `gh secret set` 再投入
- 恒久停止: `gh secret delete` または workflow `on:` を `workflow_dispatch:` のみに縮退

## token leak check

`git diff --staged | rg -F "xox[b]-"` を commit 前に必ず実行（0 hit を確認）。

## 引き渡し

Phase 6 へ: 実装順序と WebClient DI。
Phase 11 へ: dryrun / production smoke 実行と evidence 取得手順、失敗時の一次対応マッピング。
