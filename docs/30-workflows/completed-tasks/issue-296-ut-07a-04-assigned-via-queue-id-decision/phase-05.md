# Phase 5: コード変更不要の grep verification

## 目的

本タスクは docs-only のため、`apps/`, `packages/` 配下のソースコードに変更を加えない。Phase 5 では grep verification によって「現行コードは判断 B（列追加しない）と整合している」ことを evidence として記録する。CONST_005 の関数シグネチャ・テスト・実行コマンドは grep 検証コマンドに置き換える。

## 入力

- `apps/api/migrations/0002_admin_managed.sql`
- `apps/api/src/workflows/tagQueueResolve.ts`
- `apps/api/src/workflows/tagQueueRetryTick.ts`
- `apps/api/src/db/repositories/` 配下
- `packages/shared/src/schemas/admin/`

## 作業手順

1. `rg "assigned_via_queue_id" apps/ packages/` の出力が 0 件であることを確認する。
2. `rg "targetType.*tag_queue|target_type.*tag_queue" apps/api/src/` と repository/type grep のヒット箇所を列挙し、resolve / reject / DLQ の queue 追跡が audit_log で完結していることを確認する。
3. `rg "source.*admin_queue|'admin_queue'" apps/api/src/` のヒット箇所を列挙し、queue 経由付与の識別子が `source='admin_queue'` で確立していることを確認する。
4. `member_tags` の現行列定義を migration から確認し、6 列（`member_id, tag_id, source, confidence, assigned_at, assigned_by`）以外が存在しないことを記録する。
5. 上記 grep 結果を `outputs/phase-05/grep-verification.md` に集約し、コード変更不要の evidence とする。

## 出力成果物

- `outputs/phase-05/grep-verification.md`
  - 各 grep コマンドの実行結果（コマンドライン + ヒット件数 + 該当行抜粋）
  - 「現行コードは判断 B と整合している」結論

## 検証コマンド（本 Phase で実行する grep verification）

```bash
# (1) assigned_via_queue_id が apps/ packages/ に存在しないこと（期待: 0 件）
rg -n "assigned_via_queue_id" apps/ packages/ || echo "OK: 0 hits"

# (2) audit_log での queue 追跡
rg -n "target_type.*tag_queue|targetType.*tag_queue" apps/api/src/
rg -n '"tag_queue"' apps/api/src/repository/tagQueue.ts apps/api/src/repository/auditLog.ts

# (3) source='admin_queue' での queue 経由付与識別
rg -n "source.*admin_queue|'admin_queue'" apps/api/src/

# (4) member_tags 現行 schema
rg -n "CREATE TABLE.*member_tags|member_tags \(" apps/api/migrations/
```

## DoD

- [ ] (1) の出力が 0 件であることを記録した
- [ ] (2) のヒット件数 ≥ 1 を記録した（resolve / retry 双方）
- [ ] (3) のヒット件数 ≥ 1 を記録した
- [ ] (4) で `member_tags` の 6 列定義を確認した
- [ ] 「コード変更不要」結論を `outputs/phase-05/grep-verification.md` に明記した
