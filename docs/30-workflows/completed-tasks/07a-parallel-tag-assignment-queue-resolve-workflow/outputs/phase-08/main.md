# Phase 8: DRY 化 — outputs

## 共通化 / 重複除去 review

| 観点 | 状況 | 判定 |
| --- | --- | --- |
| zod schema | TagQueueResolveBody は単一 module で定義、handler / workflow で同じ型を共有 | OK |
| audit log INSERT | guarded update 成功後の follow-up statement として workflow 内にインライン化（既存 `auditLog.append` は単独 `run()` API のため raw SQL） | 妥協 |
| status mapping | spec semantics (`candidate/confirmed/rejected`) → DB value (`queued/resolved/rejected`) は workflow の switch で 1 箇所に閉じる | OK |
| error code → http status | route handler の `ERROR_TO_STATUS` map に集約、workflow からは TagQueueResolveError を投げるのみ | OK |
| tagDefinitions code → tag_id 解決 | repository.findByCode を workflow が利用、重複なし | OK |
| member 削除チェック | repository.getStatus を共有、独自実装なし | OK |

## 検討した抽象化（不採用）

- `auditAppendInBatch(stmts, ...)` のような guarded write 用 audit helper を抽出する案 → 1 箇所の使用なので YAGNI、不採用
- `D1Batchable` インターフェース化 → guarded write を使う他の workflow が出るまで不要、不採用

## 完了条件

- [x] 重複コードゼロ（手動 review）
- [x] 共通化対象（zod, status mapping, error→status）はすべて単一 module
- [x] 過剰抽象化を避ける（YAGNI）
