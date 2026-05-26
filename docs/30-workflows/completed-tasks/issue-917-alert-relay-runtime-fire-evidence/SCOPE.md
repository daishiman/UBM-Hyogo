---
workflow_id: issue-917-alert-relay-runtime-fire-evidence
title: SCOPE
status: spec_created
---

# SCOPE — issue #917 alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

## 含む

- 本サイクル: runtime evidence 取得手順、保存先、redaction、issue-857 / 親 UT-25-DERIV-02 逆参照更新手順の仕様化
- 本サイクル: runtime tail で relay POST 到達ステータスを観測できるよう、`postAlertRelay()` 成功/401 応答を `event: "sheets.auth.alert_relay_post"` / `responseStatus` として構造化ログ化
- 後続 user-gated runtime サイクル: `bash scripts/cf.sh secret list --env staging` / `--env production` による `CF_WEBHOOK_AUTH_SECRET` の name presence 確認（値は表示しない）
- 後続 user-gated runtime サイクル: staging deploy 前後の Workers tail を `bash scripts/cf.sh` 経由で取得し、`event: "sheets.auth.healthcheck"` の `reason: "missing API_INTERNAL_BASE_URL or token"` が消失したことを before/after で示す
- 後続 user-gated runtime サイクル: 親 UT-25-DERIV-02 Phase 11 の controlled invalidation 手順による SA 資格情報失効 dry-run と、`postAlertRelay()` → `/internal/alert-relay` への POST 到達ステータス（200 / 401）の観測
- 後続 user-gated runtime サイクル: fallback secret 不一致時の 401 negative path は、実際に発生した場合だけ tail で記録する。意図的に secret 不一致を作る操作は本 scope に含めず、理論上の切り分け観点として文書化する
- 後続 user-gated runtime サイクル: runtime evidence MD の作成: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md`（secret 値は redact）
- 後続 user-gated runtime サイクル: issue-857 `outputs/phase-12/implementation-guide.md` の「Runtime Path x Evidence」表「actual alert receipt」行のステータス逆参照更新（`pending_user_approval` → 取得済みリンクまたは `verified`）
- 後続 user-gated runtime サイクル: 親 UT-25-DERIV-02 close-out チェックへの本 evidence 逆参照追加

## 含まない

- `API_INTERNAL_BASE_URL` 配線そのもの（issue-857 で完了済み・apps/api/wrangler.toml は触らない）
- 受信側 `/internal/alert-relay` endpoint の汎用 smoke（`ut-17-followup-001` のスコープ・送信トリガー経路とは別ファイルで保管）
- 別値 `INTERNAL_ALERT_TOKEN` の投入や `verify-cf-webhook-auth.ts` の multi-token 化（issue-857 で de-scope 済み）
- SA key 自体のローテーション SOP（UT-25-DERIV-01）
- Slack / mail provider 側の受信先設定（UT-07 / UT-08 / UT-17）
- production deploy / production tail（deploy ポリシー次第。本サイクルは staging を必須・production は実施範囲を MD に明記する任意項目）
- alert relay endpoint の仕様変更、token 検証ロジック変更、通知送信先変更
- `apps/web` / `packages/**` 配下のソース変更
- `wrangler` 直接実行（必ず `bash scripts/cf.sh` 経由）

## 不変条件

1. Cloudflare CLI は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接実行禁止（CLAUDE.md）。仕様書本文にも `wrangler` 直接コマンドを書かない。
2. 実 secret 値・OAuth トークン値・cookie 値を evidence MD / 仕様書 / ログに転記しない。`cf-webhook-auth` header 値は必ず redact。
3. `[vars]` は top-level 継承されないため両 named env 両方で parity を保つ（issue-857 で確定済み・本サイクルでは確認のみ）。
4. D1 への直接アクセスは `apps/api` に閉じる（CLAUDE.md 不変条件 5・本サイクルは D1 を触らない）。
5. 既定 PR base は `dev`。`main` への直接 PR はしない。
6. issue #917 は CLOSED のまま運用。`Closes #917` ではなく `Refs #917` を用いる。
7. 元 unassigned-task spec `UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md` は本サイクルでは consumed 化せず unassigned のまま残す（実 runtime evidence 取得サイクルで consumed へ移す）。
8. 本サイクルは spec 作成、aiworkflow-requirements 正本同期、runtime evidence を取得可能にする最小 observability 実装のみを許容。runtime 取得 / commit / push / PR は user-gated。
9. 親 UT-25-DERIV-02 と上流 issue-857 の paths を破壊する移動 / rename は行わない（参照のみ追加）。

## 正本順位

1. 現コードの実態（`sheets-auth-healthcheck.ts` 送信契約 / `verify-cf-webhook-auth.ts` 受信検証 / `apps/api/wrangler.toml` 配線）
2. 上流 workflow `docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/`（配線正本）
3. 親 workflow `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`（healthcheck 実装本体 / Phase 11 invalidation 手順）
4. 本ワークフロー配下の `phase-*.md`
5. 元 unassigned-task spec `UT-25-DERIV-02-FU-02-alert-relay-runtime-fire-evidence.md`
6. CLAUDE.md の不変条件（`scripts/cf.sh` / シークレット管理 / PR base=dev）

> 既存の endpoint surface / token 検証ロジック / wrangler.toml vars は変更しない。本サイクルは観測と evidence 化のみで完結する。
