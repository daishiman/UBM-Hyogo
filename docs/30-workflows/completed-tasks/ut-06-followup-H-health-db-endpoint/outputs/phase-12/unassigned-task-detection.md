# Unassigned Task Detection

## Current

| ID | 内容 | 扱い |
| --- | --- | --- |
| FU-H-API-SPEC-SYNC | `GET /health/db` API contract の正本同期 | Step 2 REQUIRED |
| FU-H-TOKEN-ROTATION | `HEALTH_DB_TOKEN` rotation SOP | 大きな運用課題のため後続 governance / operation task として formalize 必須 |
| FU-H-UT08-RETRY | `Retry-After: 30` と UT-08 通知閾値合意 | UT-08 側へ吸収。独立起票は通知基盤側で閾値を扱えない場合のみ |

## Formalized Follow-Up

### FU-H-TOKEN-ROTATION

- 目的: `HEALTH_DB_TOKEN` の生成、1Password 保管、Cloudflare Secrets staging/production 投入、外部監視 SaaS header 更新、90 日 rotation、漏洩時即応を運用 SOP として固定する。
- 成果物: governance / operation task 1 件、operator-runbook への双方向リンク、rotation 実施記録テンプレ。
- 境界: 本ワークツリーでは secret 実値投入と Cloudflare 操作は実行しない。

## Baseline

UT-22 D1 migration 完了、UT-06 smoke S-03/S-07、UT-06-FU-I は既存依存として維持する。
