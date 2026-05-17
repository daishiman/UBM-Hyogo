# Phase 9: テスト補強 / lint / typecheck

## 追加テスト

- quota-base.spec.ts: Q7 (writes/day=800), Q8 (stored_bytes=858993459)
- load.spec.ts: 7 policy 列挙更新 + KV 2 policy ごとの threshold/enabled アサーション

## 既存テスト regression

| spec | 結果 |
| --- | --- |
| canonicalize.spec.ts | 8 PASS (変更なし) |
| diff.spec.ts | 8 PASS |
| resolve.spec.ts | 6 PASS |
| schema-contract.spec.ts | 3 PASS（policy 動的列挙のため自動追従） |
| quota-base.spec.ts | 8 PASS (Q1-Q8) |
| load.spec.ts | 5 PASS (KV 2 件追加) |
| cf-alerts-cli.spec.ts | 14 PASS (S11 は CI 専用環境限定で skip) |

## typecheck / lint

- typecheck: PASS
- lint (boundaries / deps / stablekey / eslint): PASS
