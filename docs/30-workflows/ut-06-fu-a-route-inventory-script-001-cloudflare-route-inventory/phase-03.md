# Phase 3: テスト計画 / NO-GO 条件

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | テスト計画 / NO-GO 条件 |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト作成) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の `InventoryReport` SSOT と read-only API allowlist を、受け側実装タスクで検証可能なテスト計画に落とす。本 Phase では実テストコードを生成しない。

## NO-GO 条件

| ID | 条件 | 対象 | 判定 |
| --- | --- | --- | --- |
| NG-1 | mutation endpoint (`POST` / `PUT` / `PATCH` / `DELETE`) が実装 script の API call layer に現れる | 後続実装 script | NO-GO |
| NG-2 | `wrangler` 直接実行が実装 script / runbook command に現れる | command sample / script | NO-GO |
| NG-3 | output JSON / Markdown / log に secret 値、Bearer header、OAuth token prefix が現れる | output evidence | NO-GO |
| NG-4 | `InventoryReport` 以外の competing schema を正本として扱う | Phase 4 以降 | NO-GO |
| NG-5 | production deploy / DNS / route update / Worker delete を本タスクで実行する | workflow scope | NO-GO |

## テスト計画

| カテゴリ | 目的 | 受け側実装での検証 |
| --- | --- | --- |
| contract | `InventoryReport` が `generatedAt`, `expectedWorker`, `entries`, `mismatches` を持つ | schema validation |
| api allowlist | Cloudflare API call が Phase 2 の GET endpoint のみに閉じる | allowlist guard |
| mismatch | `targetWorker !== expectedWorker` の entry が `mismatches` に分離される | fixture test |
| output | JSON と Markdown が同じ `InventoryReport` から生成される | snapshot / parser test |
| safety | secret pattern と mutation method が output / script に存在しない | grep guard |

## grep 対象の限定

禁止語は仕様書本文に「禁止例」として現れるため、docs 全体 grep を NO-GO にしない。grep gate の対象は次に限定する。

| grep | 対象 |
| --- | --- |
| mutation method | 後続実装 script の API call layer / generated output |
| secret pattern | generated output JSON / Markdown / log |
| `wrangler` direct call | command sample /後続実装 script。ただし `scripts/cf.sh` 内部と禁止例の説明文は対象外 |

## 完了条件

- [x] NO-GO 条件が 5 件定義されている
- [x] Phase 2 schema を SSOT として明記している
- [x] grep gate の対象範囲が誤爆しない形で限定されている
- [x] 実装・production 実行を本 Phase で行わないことが明記されている
