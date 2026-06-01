# Phase 11 成果物 — 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

- タスク種別: インフラ guardrail + application audit_log R2 export degrade ガード（UI/UX 変更なし）。
- スクリーンショットを作らない理由: scheduled export script / alert-relay guard の挙動で描画 UI が無い。

## 証跡の主ソース（自動テスト）

| 証跡 | 内容 | 件数 |
| --- | --- | --- |
| `export-to-r2.spec.ts` TC-PAUSE-01 | pause=true で status `paused`・R2 PUT 未呼出・manifest 未挿入 | 1 |
| `alert-relay.spec.ts` TC-KV-00 | `ALERT_DEDUP_KV` 未設定でも Slack delivery を fail-open | 1 |
| `alert-relay.sheets-auth.contract.spec.ts` KV optional | sheets-auth alert も KV 未設定で fail-open | 1 |
| focused Vitest | `export-to-r2.spec.ts` + `alert-relay.spec.ts`: 2 files / 43 tests PASS | 43 |
| D1 contract Vitest | `alert-relay.sheets-auth.contract.spec.ts`: 1 file / 4 tests PASS | 4 |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` PASS | — |
| lint | `pnpm lint` PASS | — |

## 既知制限

- staging での実 R2 pause 動作確認は `manual-smoke-log.md` の手順で runtime（user-gated）に実施。
