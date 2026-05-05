# Phase 8: DRY / 責務確認

[実装区分: 実装仕様書]

## 隣接タスクとの責務分担

| タスク | 責務 | 本タスクとの境界 |
| --- | --- | --- |
| `task-issue-191-schema-aliases-implementation-001` | local migration / repository / 07b wiring / tests | 本タスクは production D1 state verification のみ |
| `task-issue-191-schema-questions-fallback-retirement-001` (#299) | fallback 廃止判断とコード変更 | production apply prerequisite satisfied 後の独立未割り当てタスク |
| `task-issue-191-direct-stable-key-update-guard-001` (#300) | direct update guard 実装 | production apply prerequisite satisfied 後の独立未割り当てタスク |
| 07b endpoint rename / apps/web 変更 | HTTP path / UI | スコープ外 |
| Worker bundle deploy | apps/api / apps/web deploy | スコープ外 |
| out-of-band apply audit | 先行 apply 出所監査 | `task-issue-359-production-d1-out-of-band-apply-audit-001` で分離 |

## DRY 観点

| 項目 | 状態 |
| --- | --- |
| migration file | `apps/api/migrations/0008_create_schema_aliases.sql` を SSOT とし複製しない |
| Cloudflare CLI | `scripts/cf.sh` 経由に統一 |
| evidence | Phase 13 runtime files に集約 |
| SSOT | production applied marker は `database-schema.md` と workflow tracking に限定 |

## 完了条件

- [x] 本タスクが production D1 verification に閉じている
- [x] #299/#300 は scope 外の独立未割り当てタスクとして扱う
- [x] 先行 apply 監査は独立タスクへ分離する理由を明示している

## メタ情報

- Phase 08: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 目的

- Phase 08: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 実行タスク

- Phase 08: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 参照資料

- Phase 08: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 統合テスト連携

- Phase 08: production D1 already-applied verification workflow の一部として、本文の正本記述に従う。

## 成果物/実行手順

- production D1 already-applied verification workflow の一部として、本文の正本記述に従う。
