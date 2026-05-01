# Phase 3 要約: 設計レビューゲート / NO-GO 条件

タスク: UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 / docs-only / NON_VISUAL / Issue #328
前 Phase: 2 (設計) / 次 Phase: 4 (テスト作成)

## 目的

Phase 2 の `InventoryReport` SSOT と read-only API allowlist を、受け側実装タスクで検証可能なテスト計画 + NO-GO 条件に落とす。本 Phase では実テストコードを生成しない。

## NO-GO 条件 (5 件)

| ID | 条件 | 対象 | 判定 |
| --- | --- | --- | --- |
| NG-1 | mutation endpoint (`POST` / `PUT` / `PATCH` / `DELETE`) が実装 script の API call layer に現れる | 後続実装 script | NO-GO |
| NG-2 | `wrangler` 直接実行が実装 script / runbook command に現れる | command sample / script | NO-GO |
| NG-3 | output JSON / Markdown / log に secret 値、Bearer header、OAuth token prefix が現れる | output evidence | NO-GO |
| NG-4 | `InventoryReport` 以外の competing schema を正本として扱う | Phase 4 以降 | NO-GO |
| NG-5 | production deploy / DNS / route update / Worker delete を本タスクで実行する | workflow scope | NO-GO |

## 三軸 (本タスクの本質)

1. **mutation 検出**: NG-1。allowlist (Phase 2 §2) の 3 read-only endpoint 以外を呼ばない。
2. **secret 検出**: NG-3。出力 / log に値・token が一切現れない。
3. **wrangler 検出**: NG-2。`bash scripts/cf.sh` 一本化 (CLAUDE.md C-1)。

## テスト計画 (受け側実装での検証)

| カテゴリ | 目的 | 検証 |
| --- | --- | --- |
| contract | `InventoryReport` が `generatedAt` / `expectedWorker` / `entries` / `mismatches` を持つ | schema validation |
| api allowlist | Cloudflare API call が Phase 2 の GET endpoint のみに閉じる | allowlist guard |
| mismatch | `targetWorker !== expectedWorker` の entry が `mismatches` に分離される | fixture test |
| output | JSON と Markdown が同じ `InventoryReport` から生成される | snapshot / parser test |
| safety | secret pattern と mutation method が output / script に存在しない | grep guard |

## grep 対象の限定 (誤爆防止)

禁止語は仕様書本文に「禁止例」として現れるため、docs 全体 grep を NO-GO にしない。grep gate の対象は次に限定する:

| grep | 対象 |
| --- | --- |
| mutation method | 後続実装 script の API call layer / generated output |
| secret pattern | generated output JSON / Markdown / log |
| `wrangler` direct call | command sample / 後続実装 script。ただし `scripts/cf.sh` 内部と禁止例の説明文は対象外 |

## 上流ブロッカー (重複明記 3/3)

親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) preflight runbook 完了が本タスク前提条件。本 Phase NO-GO 条件は parent runbook の手動経路を機械化する位置付けで設計している。

## 完了条件

- [x] NO-GO 条件が 5 件定義されている
- [x] Phase 2 schema (`InventoryReport`) を SSOT として明記している
- [x] grep gate の対象範囲が誤爆しない形で限定されている
- [x] 実装・production 実行を本 Phase で行わないことが明記されている

## 次 Phase 引き渡し

- NG-1 / NG-3 / NG-2 を Phase 4 contract test / allowlist guard / grep guard の入力にする。
- `InventoryReport` JSON schema (Phase 2 §3.2) を Phase 4 contract test 入力にする。
- テスト縮退方針 (Phase 4-7 を観点設計 + AC matrix に置換) を Phase 4 で適用する。
