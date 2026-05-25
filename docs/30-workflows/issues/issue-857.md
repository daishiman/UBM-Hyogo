# [#857] [UT-25-DERIV-02-FU-01] sheets-auth healthcheck の internal alert binding 配線

## メタ情報

```yaml
issue_number: 857
title: [UT-25-DERIV-02-FU-01] sheets-auth healthcheck の internal alert binding 配線
state: OPEN
priority: 高
scale: -
category: 改善
status: -
created_date: 2026-05-22
updated_date: 2026-05-22
url: https://github.com/daishiman/UBM-Hyogo/issues/857
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 高 |
| 規模 | - |
| ステータス | - |

---

## 概要

`apps/api/src/scheduled/sheets-auth-healthcheck.ts` が参照する `API_INTERNAL_BASE_URL` / `INTERNAL_ALERT_TOKEN` が `apps/api/wrangler.toml` と Cloudflare Secrets のいずれにも未登録のため、staging / production deploy しても healthcheck は `reason: "missing API_INTERNAL_BASE_URL or token"` で no-op に落ちる。UT-25-DERIV-02 Phase 11 の staging dry-run で alert 発火確認できない構造的欠落を解消する。

## 検出元

- 親タスク: UT-25-DERIV-02 SA key 失効監視（#243 / closed）
- 検出: Phase 12 後の独立 review（2026-05-22）
- 親仕様の Phase 12 `unassigned-task-detection.md` の判断（"新規なし"）を更新

## 仕様書

- `docs/30-workflows/unassigned-task/UT-25-DERIV-02-FU-01-internal-alert-binding-wiring.md`

## スコープ

- `apps/api/wrangler.toml` `[env.staging.vars]` / `[env.production.vars]` に `API_INTERNAL_BASE_URL` を追加（非機密）
- `INTERNAL_ALERT_TOKEN` を `bash scripts/cf.sh secret put --env {staging,production}` で投入
- `apps/api/src/env.ts` の optional 表現と「deploy-required」spec の整合
- staging deploy 後の Workers tail で `event: 'sheets.auth.healthcheck'` の no-op log 解消確認

## 着手前提

UT-25-DERIV-02 Phase 11 staging dry-run の**直前**。本タスクなしで dry-run しても alert は飛ばない。

## 優先度

HIGH（incident 検知能力の根本要件）。

## 苦戦箇所メモ

- top-level `[vars]` は named env に継承されない → 3 環境すべてに書く
- 機密 token は `[vars]` 禁止 → Secrets 経由のみ
- AUTH_SECRET binding 復旧 #855 と同類の「静かな no-op」リスク
