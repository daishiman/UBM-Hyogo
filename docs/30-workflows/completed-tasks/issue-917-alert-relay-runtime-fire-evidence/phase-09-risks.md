---
phase: 9
title: Risks
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 9: Risks — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 元 unassigned-task spec セクション 6 の 4 苦戦箇所を risks / mitigation 形式へ展開し、将来の同種タスク（Cloudflare cron → internal subrequest 系の runtime evidence）で活かせる粒度で再記録する。

## 1. リスクと緩和策

| # | リスク | 影響 | 緩和策 |
| --- | --- | --- | --- |
| R-1 | `wrangler.toml` `[vars]` の named env 非継承で「片肺配線」が静かに発生 | sibling 環境が no-op に落ち、unit test では検出できない | issue-857 で投入済み `sheets-auth-healthcheck.binding.spec.ts`（config guard）で両 env vars 存在を CI assert。本サイクルでは deploy 前後 tail の no-op reason 消失で **runtime 側でも片肺でないこと** を実機証明する |
| R-2 | 別値 `INTERNAL_ALERT_TOKEN` を Secret 投入してしまう（issue 原文の罠） | relay が 401 を返し alert が黙って drop | 本サイクルでは `INTERNAL_ALERT_TOKEN` を投入しない方針を SCOPE / Phase 1 不変条件に明記。受信契約（`verify-cf-webhook-auth.ts` の `CF_WEBHOOK_AUTH_SECRET` 単一照合）を正本とし、送信側 fallback で整合させる。dry-run で 401 が観測されたら誤投入を疑う運用切り分け線を Phase 5 §5 に明示 |
| R-3 | 「送信トリガー経路」と「受信 endpoint smoke」を取り違える | 受信 smoke で済んだと誤判定し、cron トリガーの no-op を見逃す | evidence MD のタイトル・スコープに「送信トリガー経路（cron→relay）」を明記。受信 smoke（`ut-17-followup-001`）とは別ファイル `alert-relay-fire-staging.md` で保管し、相互リンクで重複検証回避（元 spec §6.3 教訓） |
| R-4 | runtime evidence は user-gated で deploy ポリシーに律速される | production 実施は staging 先行になりやすく、追跡漏れリスク | staging で evidence を確定し、production は実施範囲を MD に明記して段階分離する。pending 行は issue-857 implementation-guide 側に残し、本 workflow と二重で追跡漏れを防ぐ（元 spec §6.4 教訓） |
| R-5 | `CF_WEBHOOK_AUTH_SECRET` が staging/production に投入されていない | relay 500（middleware 未設定）or 送信側 skip | Phase 10 runbook で `secret list` による name presence 確認を必須化。不在なら user-gated put（1Password 正本値経由）|
| R-6 | tail 出力に `cf-webhook-auth` header 値が混入し evidence MD で漏洩 | secret 漏洩事故 | Phase 5 §11 の redact ルール（必ず `<redacted>` 置換）+ Phase 6 §4 の grep gate で MD 化後セルフチェック |
| R-7 | dry-run で SA 権限の復元忘れ | staging が継続的に 401/403 状態に置かれ運用影響 | 親 UT-25-DERIV-02 Phase 11 invalidation 手順に「復元」step が含まれていることを Phase 5 §4 で再強調。dry-run 開始から 15 分後の自動 cron 観測直後に復元手順を実施 |
| R-8 | `ALERT_DEDUP_KV` 未 binding | dedup 無効化で alert 重複の可能性 | 非ブロッカー（route が try/catch で degrade forward）。Phase 12 unassigned-task-detection で 「KV 有効化」候補を記録（issue-857 由来・本サイクルでは新規 issue 化しない） |

## 2. ロールバック

本サイクルのコード差分は `postAlertRelay()` の structured log 追加のみ。revert 時は `docs/30-workflows/completed-tasks/issue-917-alert-relay-runtime-fire-evidence/` と `apps/api/src/scheduled/sheets-auth-healthcheck.ts` / 同 contract spec 差分を戻せば復元できる。後続 runtime サイクルでの evidence MD 作成 / issue-857 update は git revert で即時復元可能。

## 3. 未タスク候補（Phase 12 で formalize）

- **[候補-1]** `verify-cf-webhook-auth.ts` の multi-token 対応（`INTERNAL_ALERT_TOKEN` を `CF_WEBHOOK_AUTH_SECRET` と分離して鍵ローテーション影響範囲を絞る）。現状は MVP として fallback 共有で良い（issue-857 から継承）。
- **[候補-2]** `ALERT_DEDUP_KV` namespace の staging/production 有効化（user-gated・issue-857 から継承）。
- **[候補-3]** production 実 runtime evidence 取得（deploy ポリシー次第で本サイクルから分離）。

> いずれも今回サイクルでの完了は不要（外部 user-gate / 運用フェーズ判断）。CONST_007 の例外条件（合意未済 / user-gate）に該当するため分離可。本 spec の Phase 12 `unassigned-task-detection.md` で再評価する。

## 4. 元 unassigned-task spec §6 教訓の保存

元 spec セクション 6 の 4 苦戦箇所はそれぞれ R-1 / R-2 / R-3 / R-4 へ 1:1 でマップ済み。教訓の核（「型は通る・test は通る・runtime だけ沈黙」「issue 古い前提を受信契約で覆す」「経路単位で evidence ファイルを分ける」「local evidence captured と runtime verified は別ゲート」）は本 Phase 9 で永続化される。
