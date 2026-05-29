# Phase 9: パフォーマンス・冪等性設計

## 9.1 パフォーマンス見積

### backfill migration

- 対象テーブル: `member_responses`（想定 < 5000 行 / production 現状）
- インデックス: `idx_member_responses_email_submitted (response_email, submitted_at)` で email GROUP BY が効く
- 想定実行時間: production D1 で **5 秒以内**、NFR-01 (60 秒) 十分余裕

### auto-link（session-resolve hot path）

- 追加 D1 query 数: candidate 1 件 SELECT + INSERT OR IGNORE + 再 SELECT = 最大 3 round-trip
- 既存 identity 存在時は最初の `findIdentityByEmail` で短絡し、追加 0 round-trip（性能 regression なし）
- 未登録メールでも追加 1 round-trip のみ（candidate なし即返却）
- NFR-02 ≤ 3 round-trip を満たす

## 9.2 冪等性

| 経路            | 冪等戦略                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| migration 0021 | `INSERT OR IGNORE` + サブクエリ内 `NOT EXISTS` で member_id PK / response_email UNIQUE の両方を吸収    |
| auto-link helper | 同じ helper を並行に複数回呼んでも、UNIQUE 制約と INSERT OR IGNORE で副作用が増えない                  |
| race condition  | UNIQUE 違反 → IGNORE → 再 SELECT で hit する設計。test case B-02e でカバー                              |

## 9.3 D1 cost

- backfill 1 回適用 = 1 INSERT statement（D1 行数課金は INSERT 行数）。production 想定 < 100 行追加で十分小さい
- auto-link は sign-in 経路でのみ発火。Google OAuth sign-in 頻度 ≤ 数百/日 想定で D1 quota 無視可能
