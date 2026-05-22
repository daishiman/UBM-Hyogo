# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | spec_created |

## 目的

Phase 02 設計が AC-1〜AC-11 を充足することを確認し、苦戦箇所への対応方針を確定する。

## AC マッピング

| AC | Phase 02 成果物との対応 |
| --- | --- |
| AC-1 (rollback/undo UI) | ui-state-machine.md / SchemaDiffPanel 改修方針 |
| AC-2 (batch atomicity) | api-contract.md `db.batch([softDelete, queueRestore, auditInsert])` |
| AC-3 (audit log + after_json.relatedAuditId) | api-contract.md / d1-schema-migration.md |
| AC-4 (modal 影響表示) | ui-state-machine.md confirm_modal |
| AC-5 (migration 0019) | d1-schema-migration.md |
| AC-6 (11-admin-management.md 追記) | Phase 08 で追記 |
| AC-7 (01-api-schema.md 追記) | Phase 08 で追記 |
| AC-8 (OKLch token) | ui-state-machine.md token 参照のみ |
| AC-9 (*.spec.{ts,tsx}) | Phase 07 で命名遵守 |
| AC-10 (楽観ロック) | api-contract.md `If-Match` ヘッダ + `version` 列 |
| AC-11 (D1 直接アクセス禁止) | api-contract.md (web は helper 経由のみ) |

## 苦戦箇所 (Struggle Points) 対応

### SP-1: 集計済み応答データの rollback semantics

**判定**: alias row の soft delete のみ実施。集計再実行は別 followup（005）。modal で「影響応答件数 N 件 / 再集計が必要」を warning 表示し、再集計実行は本タスク外と明示。

### SP-2: D1 transaction 境界

**判定**: `db.batch()` を使用。Cloudflare D1 batch は同一 transaction 保証。Phase 07 で fault-injection spec を必須化。

### SP-3: 並列 resolve / rollback 競合

**判定**: 楽観ロック（`schema_aliases.version`）採用。`If-Match: version=N` 不一致時 409 で UI 側 retry。

### SP-4: admin actor 権限分離

**判定**: 同一 admin role で resolve / rollback 可。modal で actor email 再表示することで「自分が今 rollback しようとしている」確認を担保。

### SP-5: soft delete vs 物理 delete

**判定**: soft delete。followup-003 history view との親和性 + 監査要件のため。

## 完了条件

- [x] 全 AC が Phase 02 成果物にマップ済み
- [x] 5 つの苦戦箇所すべてに方針決定済み

## 次 Phase

- 次: 4（タスク分解）
