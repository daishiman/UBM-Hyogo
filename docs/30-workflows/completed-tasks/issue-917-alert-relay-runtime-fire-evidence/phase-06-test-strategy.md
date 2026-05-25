---
phase: 6
title: Test Strategy
workflow_id: issue-917-alert-relay-runtime-fire-evidence
status: completed
---

# Phase 6: Test Strategy — alert relay runtime fire evidence

[実装区分: 実装 + ドキュメント]

判定根拠: 本サイクルは runtime evidence 仕様を実行可能にするため、relay POST 成功/401 応答の `responseStatus` logging contract を追加する。Cloudflare runtime 操作は引き続き user-gated。

## 1. テスト戦略の方針

| 観点 | 採用手段 | 根拠 |
| --- | --- | --- |
| 配線正本 regression | issue-857 で投入済みの `sheets-auth-healthcheck.binding.spec.ts`（config guard 3）と `sheets-auth-healthcheck.contract.spec.ts` の fallback ケース（TC-04）を維持 | 既存 test が drift を即検出する |
| relay POST evidence logging | `sheets-auth-healthcheck.contract.spec.ts` に 200 / 401 の `responseStatus` 構造化ログ assertion を追加 | AC-4 の runtime tail evidence を実体化できることを local contract で固定 |
| runtime 実発火 | Workers tail evidence（step-03 / step-05）+ secret name presence（step-01）+ relay POST status grep | unit test では Cloudflare 実環境を模せない。tail evidence のみが唯一の正本 |
| negative path（ケース C） | 実投入せず仕様書側 risks（Phase 9）と evidence MD §6 で文書化 | 401 は理論的に明らかで実検証コストが運用リスクに対して過大 |
| docs gate | `pnpm gate-metadata:validate` / `pnpm verify:phase12-compliance` / `pnpm indexes:rebuild` の runtime observability gate | runtime evidence 仕様の構造妥当性をこれら 3 gate で保証 |

## 2. 既存 test 一覧（再実行は CI で自動・本サイクル手動実行不要）

| test | 場所 | 役割 |
| --- | --- | --- |
| `sheets-auth-healthcheck.binding.spec.ts` | `apps/api/src/scheduled/` | 2 env vars に `API_INTERNAL_BASE_URL` 存在を静的 assert（issue-857 投入）|
| `sheets-auth-healthcheck.contract.spec.ts` | `apps/api/src/scheduled/` | `CF_WEBHOOK_AUTH_SECRET` fallback 経路の POST header 検証（issue-857 投入）|
| `alert-relay.sheets-auth.contract.spec.ts` | `apps/api/src/routes/internal/__tests__/` | 受信 endpoint の cf-webhook-auth 検証で 401/200（既存） |

これら 3 group は変更しない。本サイクルでは CI で green 維持を確認するのみ。

## 3. 新規 / 変更テスト

新規ファイルは追加しない。既存 `apps/api/src/scheduled/sheets-auth-healthcheck.contract.spec.ts` に、relay POST の `responseStatus: 200` と `responseStatus: 401` が `event: "sheets.auth.alert_relay_post"` として記録される assertion を追加する。

## 4. runtime evidence + grep gate

runtime evidence MD の妥当性は以下のセルフチェック（grep）で保証する:

```bash
# secret 値が漏れていないか（NG キーワード grep）
grep -rEi "(eyJ|sk_|ghp_|AKIA|CF_WEBHOOK_AUTH_SECRET=)" docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md
# 期待: 0 hits

# `<redacted>` がきちんと使われているか
grep -n "<redacted>" docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-11/evidence/alert-relay-fire-staging.md
# 期待: cf-webhook-auth 行で 1 件以上

# issue-857 implementation-guide が更新されているか
grep -n "verified" docs/30-workflows/completed-tasks/issue-857-internal-alert-relay-binding-wiring/outputs/phase-12/implementation-guide.md
# 期待: actual alert receipt 行で `verified` キーワードを観測
```

これら grep は runtime evidence 取得後のセルフチェック手段であり、CI gate にはしない（テキストパターン依存・誤検出リスク・runtime observability hardening サイクルの方針）。

## 5. CI gate の通過条件（本サイクル）

| gate | コマンド | 通過条件 |
| --- | --- | --- |
| `gate-metadata:validate` | `mise exec -- pnpm gate-metadata:validate` | 本 workflow の `artifacts.json` / `outputs/artifacts.json` が zod schema 通過（ERROR 0） |
| `verify:phase12-compliance` | `mise exec -- pnpm verify:phase12-compliance` | canonical 9 headings / Phase 11 evidence parity / strict 7 outputs |
| `indexes:rebuild` | `mise exec -- pnpm indexes:rebuild` | 冪等性（再実行で diff なし） |

Focused contract test は必須。全体 `@ubm-hyogo/api test` は既存 D1/miniflare hook timeout の影響を受けるため、今回変更分は focused vitest で合否判定する。

## 6. fail path

- `gate-metadata:validate` ERROR → `artifacts.json` の必須 field（workflow_id / metadata.taskType / metadata.gates 各エントリの evidence_path 存在）を再点検。
- `verify:phase12-compliance` fail → canonical 9 headings の欠落 / strict 7 outputs の不在を `outputs/phase-12/` で再確認。
- `indexes:rebuild` diff → `pnpm indexes:rebuild` 後の `git diff` を確認し、自動生成 index への drift がないか確認（本サイクルは新規 workflow 追加なので 1 回目で diff、2 回目で diff なしになることを期待）。
