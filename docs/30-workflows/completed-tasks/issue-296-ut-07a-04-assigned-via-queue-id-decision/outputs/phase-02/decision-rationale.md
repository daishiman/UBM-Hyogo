# Phase 2: 設計判断（採用案決定 + 代替案評価）

## 判断軸

1. 監査追跡可能性 — queue → member_tags の trace は維持できるか
2. migration コスト — D1 ALTER / backfill / rollback の負担
3. API schema 波及 — `packages/shared/src/schemas/admin/*` への影響
4. D1 free plan 性能 — row size / index / write 増分
5. 再評価余地 — 将来の方針変更コスト

## 案 A: `assigned_via_queue_id` 列を追加する

| 軸 | 評価 |
| --- | --- |
| 監査追跡 | ◎ FK 直結で 1 段 join |
| migration | ✗ 新規 migration / 既存行は queueId backfill 不能（NULL 許容必須）/ rollback コスト高 |
| schema 波及 | ✗ `MemberTag` 型 + 全 admin endpoint response の breaking 判定 |
| D1 性能 | △ TEXT NULL 増（軽微）/ index 追加で write コスト |
| 再評価余地 | ✗ 列追加後の削除は更に高コスト |

## 案 B: 列を追加しない（採用）

| 軸 | 評価 |
| --- | --- |
| 監査追跡 | ○ audit_log 2 段 join で再構成可能 / MVP 要件は満たす |
| migration | ◎ 不要 |
| schema 波及 | ◎ 不要 |
| D1 性能 | ◎ 増分なし |
| 再評価余地 | ◎ 後から列追加する可逆性は維持される |

## 採用根拠（案 B）

1. **audit_log で member_tags ↔ queue 追跡が SQL join 可能**
   - `audit_log (target_type='tag_queue', target_id=queueId, action IN ('admin.tag.queue_resolved', 'admin.tag.queue_rejected', 'admin.tag.queue_dlq_moved'))` を後付けで join できる。
2. **列追加は migration / backfill / API schema / repository / test に広範に波及**
   - 既存 member_tags row（07a 完了前付与）は queueId が存在せず backfill 不能。NULL 許容で運用するなら列の意味は薄い。
3. **MVP 監査要件は audit_log で達成済み**
   - `target_type='tag_queue'` で resolve / reject / dlq の全 event を残せる。保持・物理削除ポリシー変更時は再評価する。
4. **`source='admin_queue'` で queue 経由付与は識別可能**
   - queueId 直引きが必要な業務 query は現時点で存在せず、admin UI は audit_log を参照すれば足る。

## 再評価トリガ

- (a) 監査画面で「特定 queue から確定したタグ一覧」を 1 クエリで表示する UI 要件が発生
- (b) audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる場合
- (c) D1 read で audit join 性能問題が顕在化（query plan で full scan / N+1 が出る等）

いずれかが発生した時点で superseding ADR を起票し、列追加 migration を企画する。

## Phase 3 への引き継ぎ

Decision = 案 B / Alternatives = 案 A 却下理由 / Re-evaluation triggers = 上記 3 件を ADR 草案に整形する。
