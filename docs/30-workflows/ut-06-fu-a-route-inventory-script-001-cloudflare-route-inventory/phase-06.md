# Phase 6: コードレビュー観点 / 異常系検証設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | コードレビュー観点 / 異常系検証設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 5 (実装テンプレ化 / handoff 設計) |
| 次 Phase | 7 (統合テスト) |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

後続実装タスクが route inventory script を実装するときのレビュー観点を固定する。Phase 2 の `InventoryReport` と Phase 3 NO-GO 条件を唯一の判定基準にする。

## レビュー観点

| 観点 | PASS 条件 |
| --- | --- |
| API 境界 | Phase 2 の GET allowlist のみを呼ぶ |
| wrapper 境界 | 外部入口は `bash scripts/cf.sh route-inventory ...` 相当の repository-controlled command に閉じる |
| schema | 出力は `InventoryReport`。`workerName` などの competing schema を正本化しない |
| mismatch | `mismatches = entries.filter(e => e.targetWorker !== expectedWorker)` の契約を保つ |
| secret hygiene | token / Bearer / OAuth prefix / `.env` 実値を output / log に出さない |
| production safety | deploy / route update / secret put / Worker delete を一切含まない |

## 異常系

| ID | 入力 | 期待 |
| --- | --- | --- |
| EX-1 | Cloudflare API 401 / 403 | 出力を生成せず auth error として fail |
| EX-2 | Cloudflare API 429 | retry storm を起こさず fail-fast |
| EX-3 | target Worker が存在しない | `mismatches` ではなく setup error として fail |
| EX-4 | response shape が想定外 | parser error として fail |
| EX-5 | secret pattern が output に混入 | output を破棄し exit code 非 0 |

## 完了条件

- [x] Phase 2 schema と Phase 3 NO-GO 条件へ接続している
- [x] 異常系 5 件が定義されている
- [x] 後続実装タスクの review checklist として再利用可能
