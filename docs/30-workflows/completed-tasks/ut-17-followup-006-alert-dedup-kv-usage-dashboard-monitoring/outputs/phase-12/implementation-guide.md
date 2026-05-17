# Implementation Guide — UT-17-followup-006

## Part 1: 初学者向け説明

たとえば、家の電気を使いすぎないようにメーターを見る場面を考える。
今までは、ときどき人がメーターを見に行く必要があった。今回の変更では、
電気を使いすぎそうになったら知らせるための設定を、紙の手順ではなく
リポジトリ内の設定ファイルとして置いた。

ただし、今はまだ「知らせる設定を用意した」段階で、実際に外部サービスへ
設定を反映する操作と、通知が届くかの確認はユーザー承認後に行う。
そのため、この変更はローカル実装済み、外部実行待ちとして扱う。

## Part 2: 技術者向け詳細

ALERT_DEDUP_KV の Workers KV account quota guard (writes/day, stored bytes) を
`infra/cloudflare-alerts/` IaC に追加し、UT-17 既設 Slack 経路へ接続できる状態を整える。

Refs #702

## Summary

- Cloudflare Notification policy 2 件 (`workers-kv-writes-per-day`,
  `workers-kv-stored-bytes`) を IaC 宣言として追加（初期 `enabled: false`）
- `quota-base.json` に KV free-tier 値 2 キー追加 (`workers_kv_writes_per_day=1000`,
  `workers_kv_stored_data_bytes=1073741824`) + `snapshotAt` 更新
- schema / lib コードは Phase 2 判定どおり変更不要（`policy.schema.json` は verified unchanged）
- テスト追加（quota-base / load）+ mock fixture 追加（cf-alerts-cli）
- runbook (`ut-17-alert-relay-monthly-healthcheck.md`) と README に KV 監視自動化の参照を追記

## Phase 1 decision

- KV usage は `billing_usage_alert` で native 対応（Account 集計、namespace filter 無し）
- latency / error rate は native alert なし → runbook 四半期 deep-dive review 項目に固定
- 判定: **CONDITIONAL GO**（UBM-Hyogo の KV namespace が現状 `ALERT_DEDUP_KV` のみのため Account 集計で実質問題なし）

## 変更ファイル

| パス | 種別 |
| --- | --- |
| infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json | 追加 |
| infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json | 追加 |
| infra/cloudflare-alerts/quota-base.json | 変更（KV キー 2 件 + snapshotAt） |
| infra/cloudflare-alerts/README.md | 変更（5→7 policy / 一覧表追記） |
| infra/cloudflare-alerts/lib/__tests__/quota-base.spec.ts | 変更（Q7, Q8 追加） |
| infra/cloudflare-alerts/lib/__tests__/load.spec.ts | 変更（7 policy 列挙 + KV 閾値 enabled テスト） |
| tests/fixtures/cloudflare-alerts/api-list-policies.json | 変更（mock に KV 2 件追加） |
| docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 変更（Step 4 / Step 4b に KV IaC 自動化反映） |

## 検証 evidence

- `mise exec -- pnpm test:alerts` → 52 tests / 7 files PASS
- `mise exec -- pnpm typecheck` → PASS
- `mise exec -- pnpm lint` → PASS
- Cloudflare 実機 apply / Slack 着信 evidence は user 承認後に `outputs/phase-11/evidence/` へ追記

## 不変条件遵守チェック

- [x] `wrangler` 直接実行なし（IaC + `scripts/cf.sh alerts` 経由のみ）
- [x] secret 値の直書きなし（webhook は `ut-17-relay` を name 参照）
- [x] threshold 絶対値直書きなし（`percentage × quota-base`）
- [x] schema `additionalProperties:false` 保持（既存値削除なし）
- [x] `apps/web` / `apps/api` のコード未変更
- [x] webhook destination 増加なし
- [x] D1 直接アクセスなし

## Rollout

- 本 PR: Wave A（`enabled: false` での IaC 取り込み）。user 承認後 `bash scripts/cf.sh alerts apply --yes` で Cloudflare 上に policy 作成
- Wave B: 5 営業日 baseline 取得後、同 workflow の Phase 13 user-gated operation として `enabled: true` 切替を判断する。別 PR にする場合は理由と実施場所を Phase 13 に記録する

## Boundaries

- `apps/api/src/routes/internal/alert-relay.ts` は本タスクで変更しない
- 短時間 smoke を 5 営業日 baseline の代替としない
- latency policy 化は実施しない（native alert 非対応）
- production 適用は user 承認後
