# Phase 2: 設計

[実装区分: 実装仕様書]

## 設計方針

本タスクは production D1 の `schema_aliases` Required Shape verification に閉じる。未適用なら approval-gated apply、既適用なら ledger + PRAGMA verification で完了する。

## Flow

1. `bash scripts/cf.sh whoami` で認証状態を確認する。
2. `d1 migrations list` と table inventory を取得する。
3. `schema_aliases` が既存か判定する。
4. 既存の場合は `d1_migrations` ledger を確認し、duplicate apply を実行しない。
5. `PRAGMA table_info` / `PRAGMA index_list` で Required Shape を確認する。
6. SSOT と artifact inventory を同期する。

## Scope Boundary

#299 fallback retirement と #300 direct update guard は設計対象外。production apply prerequisite satisfied の事実だけを引き渡す。

## 完了条件

- [x] already-applied verification flow が定義されている
- [x] duplicate apply skip が設計に含まれている
- [x] code-change flow を混在させていない

## メタ情報

- Phase 02: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 目的

- Phase 02: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 02: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 02: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 02: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
