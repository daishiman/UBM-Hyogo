# Phase 1: 要件定義

## Scope

UT-07A-02 は `POST /admin/tags/queue/:queueId/resolve` の request body 契約を 4 層で同期する。

- 正本契約: `{ action: "confirmed"; tagCodes: string[] } | { action: "rejected"; reason: string }`
- 対象層: `docs/00-getting-started-manual/specs/12-search-tags.md`, apps/api route/schema, apps/web admin client, contract/unit tests
- 対象外: staging smoke / Playwright / tag queue UI 再設計 / DB schema 変更 / PR 作成

## Drift Inventory

| 層 | 調査結果 | 分類 |
| --- | --- | --- |
| 07a implementation-guide | discriminated union 契約を採用済み | 既追従済 |
| 正本 12-search-tags.md | union body 記載済み | 既追従済 |
| apps/api schema | union は実装済みだが apps/api ローカル定義 | 修正対象 |
| apps/api route | zod parse は実装済み、error body が message 依存 | 修正対象 |
| apps/web client | `resolveTagQueue(queueId, body)` 済み、空 body 呼び出しなし | 既追従済 |
| shared schema | admin resolve schema なし | 修正対象 |
| tests | route/workflow/schema tests はあるが shared schema と mixed body rejection が不足 | 修正対象 |

## AC

| AC | 内容 | Phase 1 判定 |
| --- | --- | --- |
| AC-1 | `resolveTagQueue` 型が discriminated union | PASS（shared 型 import に変更予定） |
| AC-2 | confirmed success contract test | PASS（既存 route test あり、拡張対象） |
| AC-3 | rejected success contract test | PASS（既存 route test あり、拡張対象） |
| AC-4 | validation error case | PASS（空 reason あり、mixed body 追加対象） |
| AC-5 | idempotent 200 + `idempotent:true` | PASS（confirmed あり、rejected 追加対象） |
| AC-6 | spec / guide body shape 一致 | PASS |
| AC-7 | 旧空 body 呼び出しゼロ | PASS（`rg resolveTagQueue` で live code ゼロ） |

## 4 Conditions

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | shared schema 化により drift を型・test で検出可能 |
| 実現性 | PASS | 既存実装を shared へ移す小差分 |
| 整合性 | PASS | 07a 本体と UT-07A-03 staging smoke を侵食しない |
| 運用性 | PASS | route/schema/client/test の限定差分で rollback 可能 |

Open question: なし。

