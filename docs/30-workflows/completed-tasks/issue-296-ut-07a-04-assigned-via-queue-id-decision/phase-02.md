# Phase 2: 設計判断（採用案決定 + 代替案評価）

## 目的

`member_tags.assigned_via_queue_id` 列の採否について、(A) 追加する案 / (B) 追加しない案 を競合させ、採用案を「**(B) 追加しない**」として確定する。判断根拠と代替案の trade-off を文書化し、Phase 3 の ADR 草案に直接利用できる形にする。

## 入力

- Phase 1 成果物 `outputs/phase-01/requirements.md`
- 原典 `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`
- 07a 親 `outputs/phase-01/main.md`（drift 4 番目の記述）

## 作業手順

1. 判断軸を 5 つに整理する: (i) 監査追跡可能性、(ii) migration コスト、(iii) API schema 波及、(iv) D1 free plan 性能、(v) 再評価余地。
2. 案 A（列追加）の利点と欠点を判断軸ごとに評価する。
3. 案 B（列追加しない）の利点と欠点を判断軸ごとに評価する。
4. 案 A の欠点（migration / backfill / repository / schema / test の同時改修、既存行に対する queueId backfill 不能性）と案 B の許容範囲（audit_log join で再構成可能、`source='admin_queue'` で識別可能）を比較する。
5. 案 B を採用する理由を 4 点に確定する（index.md「目的」セクションと同期）:
   - (1) audit_log で member_tags ↔ queue 追跡が SQL join 可能
   - (2) 列追加すると schema / migration / backfill / API / repository / test に広範に波及
   - (3) MVP 監査要件は audit_log で達成済み
   - (4) `source='admin_queue'` で queue 経由付与は識別可能、queueId 直引き必要性が業務要件として無い
6. 再評価トリガを 3 件に確定する: (a) 監査画面で「特定 queue 由来タグ一覧」を 1 クエリ表示する UI 要件、(b) audit_log の保持期間短縮または物理削除方針で queue 追跡履歴を保持できなくなる場合、(c) D1 read で audit join 性能問題。
7. 結果を `outputs/phase-02/decision-rationale.md` に集約する。

## 出力成果物

- `outputs/phase-02/decision-rationale.md`
  - 判断軸 5 件
  - 案 A / 案 B の評価マトリクス
  - 採用案 = B の確定根拠 4 点
  - 再評価トリガ 3 件

## 検証コマンド

```bash
# 判断根拠 4 点が成果物に含まれることを確認
rg -n "audit_log で member_tags|広範に波及|MVP 監査要件|source='admin_queue'" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-02/decision-rationale.md

# 再評価トリガ 3 件
rg -n "監査画面|retention|read 性能|join 性能" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-02/decision-rationale.md
```

## DoD

- [ ] 判断軸 5 件を定義した
- [ ] 案 A / 案 B の評価マトリクスを作成した
- [ ] 採用案 = B を確定し、根拠 4 点を列挙した
- [ ] 再評価トリガ 3 件を明示した
- [ ] `outputs/phase-02/decision-rationale.md` を作成した
