---
phase: 6
title: Test Strategy
workflow_id: issue-857-internal-alert-relay-binding-wiring
status: completed
---

# Phase 6: Test Strategy — internal alert relay binding 配線

[実装区分: 実装仕様書]

## 1. テスト層

| 層 | ファイル | 目的 | lane |
| --- | --- | --- | --- |
| config guard | `sheets-auth-healthcheck.binding.spec.ts`（新規） | 2 環境 vars に `API_INTERNAL_BASE_URL` 存在を静的 assert | unit (`pnpm --filter @ubm-hyogo/api test`) |
| contract | `sheets-auth-healthcheck.contract.spec.ts`（既存 + 1 ケース） | token fallback（`CF_WEBHOOK_AUTH_SECRET`）経路の POST header 検証 | unit |
| 受信 contract | `routes/internal/__tests__/alert-relay.sheets-auth.contract.spec.ts`（既存・変更なし） | `cf-webhook-auth` 検証で 401/200 を確認（回帰として継続） | unit |

## 2. テストケース一覧

| ID | ケース | 期待 | 種別 |
| --- | --- | --- | --- |
| TC-01 | production.vars に `API_INTERNAL_BASE_URL` がある | match | RED→GREEN（追加前は fail） |
| TC-02 | staging.vars に `API_INTERNAL_BASE_URL` がある | match | RED→GREEN |
| TC-03 | 両環境とも末尾スラッシュなし https URL | true | GREEN |
| TC-04 | `INTERNAL_ALERT_TOKEN` 未設定 + `CF_WEBHOOK_AUTH_SECRET` 設定で POST 発火・header=`cf-secret` | POST 1 回 / header 一致 | RED→GREEN |
| TC-05（既存回帰） | 200/401/403/500/skip の 5 既存ケース | 不変 | 回帰 guard |

## 3. TDD 手順

1. **RED**: step-04 の guard test を先に追加 → vars 未配線のため TC-01/TC-02 が fail することを確認。
2. **GREEN**: step-01/02 で vars を追加 → TC-01〜03 green。
3. **RED**: step-05 の fallback ケース TC-04 を追加（既存実装で既に green になる想定 = 回帰固定。fail する場合は token 解決ロジックの理解齟齬を示す）。
4. **回帰**: 既存 5 ケース（TC-05）が破壊されていないことを確認。

> 命名規則確認（Phase 1 §6）: 新規 test は `sheets-auth-healthcheck.binding.spec.ts`（`.spec.ts` 必須・`.test.ts` 禁止）。

## 4. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test sheets-auth-healthcheck
```

## 5. fail path / 補助

- guard test が CI で fail した場合 = 誰かが片環境の vars を消した drift。PR で即検出する。
- contract fallback が fail した場合 = `verify-cf-webhook-auth.ts` の token 照合仕様が変わった可能性。受信 contract spec と併せて再確認する。
