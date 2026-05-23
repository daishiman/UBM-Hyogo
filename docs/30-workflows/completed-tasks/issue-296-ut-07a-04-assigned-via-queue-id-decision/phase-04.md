# Phase 4: 影響範囲分析（列追加した場合の波及）

## 目的

仮に `member_tags.assigned_via_queue_id` 列を追加した場合に発生する波及範囲を列挙し、Phase 2 の判断「追加しない」を裏付ける根拠とする。波及の広さを定量化することで、ADR Alternatives セクションの却下理由を強化する。

## 入力

- `apps/api/migrations/` 配下の migration 群
- `apps/api/src/db/repositories/` 配下の repository 実装
- `packages/shared/src/schemas/admin/` の API response schema
- `apps/api/src/workflows/tagQueueResolve.ts`
- `apps/api/src/workflows/tagQueueRetryTick.ts`
- `apps/api/src/routes/admin/` の admin endpoint
- 既存 test ファイル（fixture, contract spec, integration spec）

## 作業手順

1. migration への波及を列挙する:
   - 新規 migration ファイル（例: `0007_member_tags_assigned_via_queue_id.sql`）を追加し、`ALTER TABLE member_tags ADD COLUMN assigned_via_queue_id TEXT NULL` を投入
   - 既存行（07a 完了前の手動付与・admin 直接付与等）に対しては NULL を許容する必要があり、queueId backfill は実質不能
   - rollback 手順の整備（D1 ALTER の rollback コストは高い）
2. repository への波及を列挙する:
   - `apps/api/src/db/repositories/memberTags.ts`（仮想パス）の insert / select / update 全箇所
   - workflow からの insert 呼び出し箇所（`tagQueueResolve.ts`）の引数追加
3. API schema への波及を列挙する:
   - `packages/shared/src/schemas/admin/*` で `MemberTag` 型に optional `assignedViaQueueId` を追加
   - 全 admin endpoint response の breaking change 判定（optional なら backward compatible）
4. workflow への波及を列挙する:
   - `tagQueueResolve.ts` の `assigned_by`, `source` に加えて `assigned_via_queue_id` を渡す
   - `tagQueueRetryTick.ts` の DLQ 経路は member_tags insert を行わないため影響なし（確認のみ）
5. test への波及を列挙する:
   - `tagQueueResolve.contract.spec.ts`, `tagQueueResolve.integration.spec.ts` 等の fixture / expectation 更新
   - schema validation test の更新
6. D1 free plan への波及:
   - row size 増加（TEXT NULL なので軽微だが、index を貼ると別途コスト）
   - audit join を排除できるが、index 追加で write 性能が低下
7. 波及範囲の総コストを「列を追加しない」の許容コストと比較し、Phase 2 判断の正当性を確定する。

## 出力成果物

- `outputs/phase-04/impact-analysis.md`
  - migration 波及（ファイル数 / backfill 不能性 / rollback コスト）
  - repository 波及（変更箇所 数）
  - API schema 波及（型追加 / endpoint 数）
  - workflow 波及（変更箇所 数）
  - test 波及（fixture / expectation 更新数）
  - D1 free plan 影響
  - 総コスト比較表

## 検証コマンド

```bash
# repository / schema / workflow / test の波及箇所候補を grep で列挙
rg -n "member_tags" apps/api/src/ packages/shared/src/
rg -n "INSERT INTO member_tags|insertMemberTag|memberTags\." apps/api/src/
rg -n "MemberTag" packages/shared/src/schemas/

# 既存 migration 連番
ls -1 apps/api/migrations/
```

## DoD

- [ ] migration 波及（新規ファイル / backfill 不能 / rollback コスト）を列挙した
- [ ] repository 波及箇所を grep で特定した
- [ ] API schema 波及（追加型 / endpoint）を列挙した
- [ ] workflow 波及箇所を列挙した
- [ ] test 波及（fixture / spec 更新）を列挙した
- [ ] D1 free plan 影響を評価した
- [ ] 総コスト比較表を作成した
- [ ] `outputs/phase-04/impact-analysis.md` を作成した
