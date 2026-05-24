---
phase: 13
title: Commit / PR Draft
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: draft
---

# Phase 13: Commit / PR Draft — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. ブランチ命名

- `fix/issue-857-internal-alert-relay-binding`

## 2. コミット分割案

CONST_007（1 サイクル完了前提）に基づき、revert 容易性から以下 2 コミットを推奨:

1. `fix(api/monitoring): wire API_INTERNAL_BASE_URL var into both envs for alert relay` — step-01 / step-02 / step-04（wrangler.toml 2 環境 vars + env.ts コメント整合 + parent 逆参照）
2. `test(api/monitoring): assert base-url binding parity and CF_WEBHOOK_AUTH_SECRET fallback` — step-03 / step-05（binding.spec guard + contract fallback TC-04）

各コミットの末尾に:

```
Refs: #857
Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

> issue #857 は **クローズドのまま**運用する。コミット trailer は `Refs: #857`（`Closes` ではなく参照のみ）を用い、再オープンや自動クローズを誘発しない。

## 3. PR 草案

### 3.1 base / head

- base: `dev`
- head: `fix/issue-857-internal-alert-relay-binding`

### 3.2 タイトル

```
fix(api/monitoring): wire API_INTERNAL_BASE_URL so SA-key-expiry alert relay actually fires
```

### 3.3 本文テンプレ

```md
## Summary

- `apps/api/wrangler.toml` の `[env.production.vars]` / `[env.staging.vars]` 双方に `API_INTERNAL_BASE_URL` を追加し、`postAlertRelay` の self-subrequest 先 URL を解決可能にする（不在のため alert relay が恒常的に no-op だった root cause を解消）
- token 整合を現コードに最適化: 受信 `verify-cf-webhook-auth.ts` は `CF_WEBHOOK_AUTH_SECRET` のみを照合するため、送信側は同 secret への fallback を正本とし、**別値 `INTERNAL_ALERT_TOKEN` の新規投入は行わない**（投入すると relay 401 で alert drop する陳腐化トラップ）
- `env.ts` の `API_INTERNAL_BASE_URL` / `INTERNAL_ALERT_TOKEN` コメントを deploy-required + token 整合明記へ更新（型 `?: string` は不変）
- config guard test と contract fallback test を追加し、両環境 parity と fallback 経路を CI で固定

Refs: #857
Workflow: `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`
Parent: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`

## 現コード最適化（issue 陳腐化対応）

issue #857 原文の「`INTERNAL_ALERT_TOKEN` を Secrets 投入」手順は現行 `verify-cf-webhook-auth.ts`（`CF_WEBHOOK_AUTH_SECRET` 単一照合）と組み合わせると relay 401 を誘発する。本 PR は受信側実装を正本として送信側 fallback を採用し、issue を現在のコードへ最適化したうえで根本原因（base URL var 欠落）を解消する。

## Scope

| 含む | 含まない |
| --- | --- |
| `API_INTERNAL_BASE_URL` を 2 環境 vars 追加 / env.ts コメント整合 / config guard test / contract fallback test / `CF_WEBHOOK_AUTH_SECRET` presence runbook / 親 workflow 逆参照 | 別 secret `INTERNAL_ALERT_TOKEN` の投入 / `verify-cf-webhook-auth.ts` の multi-token 化 / `ALERT_DEDUP_KV` 有効化 / 受信側 Slack/mail 送信先設定（UT-17/UT-08） |

## 不変条件

- [x] `[vars]` は named env に継承されないため prod / staging 双方へ明示追加
- [x] base URL は各環境の `AUTH_URL` 値と一致・末尾スラッシュなし
- [x] env.ts 型行（`?: string`）は不変・コメントのみ変更
- [x] `scripts/cf.sh` 経由のみ。`wrangler` 直接実行なし
- [x] 新規 test は `*.spec.ts` のみ
- [x] D1 直接アクセス追加なし（`apps/api` 内に閉じる）

## Test plan

- [ ] `mise exec -- pnpm typecheck`
- [ ] `mise exec -- pnpm lint`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test sheets-auth-healthcheck`
- [ ] `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run`（TOML parse 通過）
- [ ] staging deploy 後 tail で `event: "sheets.auth.alert_relay_skipped"` が出ないことを確認
- [ ] staging で SA key 失効 dry-run により alert-relay へ POST 到達を確認（親 UT-25-DERIV-02 と連携）

## Evidence

`docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-11/` 配下:
- typecheck.log / lint.log / vitest-api.log
- wrangler-dryrun.log / vars-grep.log（2 行ヒット）
- staging-tail-relay.log（no-op log 消失）

> NON_VISUAL タスクのためスクリーンショットは作成しない。

## Rollback

`API_INTERNAL_BASE_URL` 行を削除して再 deploy すれば従来の no-op 状態へ即時復帰（破壊的変更なし）。guard test も同 PR で revert。secret は変更しないため secret rollback 不要。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. PR 作成コマンド（user 承認後のみ）

```bash
gh pr create --base dev --head fix/issue-857-internal-alert-relay-binding \
  --title "fix(api/monitoring): wire API_INTERNAL_BASE_URL so SA-key-expiry alert relay actually fires" \
  --body-file docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-13/pr-body.md
```

## 5. ガード

- 本ワークフロー仕様作成段階では **commit / push / PR 作成は実行しない**
- 実装 commit / PR は user 明示承認後のみ
- issue #857 は **クローズドのまま**。`Closes #857` ではなく `Refs: #857` を用いる
- production deploy は PR merge 後の手動 step（`scripts/cf.sh` 経由）
