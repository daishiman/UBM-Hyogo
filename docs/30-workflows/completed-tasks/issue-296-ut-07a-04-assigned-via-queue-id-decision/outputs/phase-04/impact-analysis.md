# Phase 4: 影響範囲分析（列追加した場合の波及）

仮に案 A（列追加）を採用した場合に発生する波及を列挙し、案 B（追加しない）の正当性を裏付ける。

## 1. migration 波及

| 項目 | 内容 |
| --- | --- |
| 新規 migration | `apps/api/migrations/00NN_member_tags_assigned_via_queue_id.sql` を追加し `ALTER TABLE member_tags ADD COLUMN assigned_via_queue_id TEXT NULL` を投入 |
| backfill 可否 | 07a 完了前に付与された既存 member_tags 行は queueId が紐づかないため backfill 不能 |
| rollback コスト | D1 ALTER 後の DROP COLUMN は SQLite 制約で非自明（テーブル再作成手順を migration として追加する必要） |

## 2. repository 波及

| パス | 変更点 |
| --- | --- |
| `apps/api/src/repository/memberTags.ts:74` | INSERT 文の VALUES に queueId 追加 |
| 同 select / update 系 | 列を返す場合は SELECT 句拡張 |

## 3. workflow 波及

| パス | 変更点 |
| --- | --- |
| `apps/api/src/workflows/tagQueueResolve.ts:187,210` | member_tags insert に queueId を渡す |
| `apps/api/src/workflows/tagQueueRetryTick.ts` | DLQ 経路は member_tags insert を行わないため変更不要（確認のみ） |

## 4. API schema 波及

| パス | 変更点 |
| --- | --- |
| `packages/shared/src/schemas/admin/*` | `MemberTag` 型に optional `assignedViaQueueId` を追加 |
| 全 admin endpoint response | optional のため backward compatible だが、contract spec の expectation 更新が必要 |

## 5. test 波及

| パス | 変更点 |
| --- | --- |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | fixture / expectation 更新 |
| `apps/api/src/workflows/tagQueueRetryTick.contract.spec.ts` | 影響なし（DLQ 経路は member_tags insert 無し）だが target_type='tag_queue' assertion は維持 |
| `packages/shared/**/*.spec.ts` | schema validation の expectation 更新 |

## 6. D1 free plan 影響

| 項目 | 影響 |
| --- | --- |
| row size | TEXT NULL なので軽微（UUID 1 件あたり ~36 byte） |
| index 追加 | `WHERE assigned_via_queue_id = ?` を支える index が必要なら write コスト増 |
| free 容量 | 軽微だが累積する |

## 7. 総コスト比較

| 軸 | 案 A（列追加） | 案 B（追加しない） |
| --- | --- | --- |
| 新規ファイル | migration 1 件以上 | 0 |
| 既存ファイル変更 | repository / workflow / schema / test 数件 | 0 |
| backfill | 不能（NULL のまま運用） | 不要 |
| rollback コスト | 高（再作成手順必要） | ゼロ |
| API breaking 判定 | 必要 | 不要 |
| 監査要件達成 | ◎ 1 段 join | ○ 2 段 join（MVP 要件は満たす） |

→ 案 A の追加コストは「監査 UI で 1 クエリ表示」要件が顕在化するまで正味便益を生まない。
本 ADR は案 B（追加しない）を採用し、再評価トリガで案 A への切替経路を担保する。
