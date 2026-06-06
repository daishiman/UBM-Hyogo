# Phase 9: 品質保証（Gate-B 対象）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `implemented_local_evidence_captured` |
| 対象 | Task A（apps/api）の品質ゲート |
| gate | **Gate-B passed**（local implementation QA） |

> automation-30 改善で実コードへ昇格し、Gate-B は local tests により passed とした。

---

## 1. Gate-B 完了条件（実装サイクル後に評価）

| # | 条件 | 検証手段 |
| --- | --- | --- |
| B-1 | line budget: Task A の変更が最小差分（audit.ts: schema/interface/route 各 1 行追加 + 句 / auditLog.ts: filter 型 1 行 + WHERE 句 1 ブロック）に収まる | diff 行数目視（新規ファイルなし・編集 2 + spec 2）。 |
| B-2 | typecheck green | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が exit 0。 |
| B-3 | lint green | `mise exec -- pnpm --filter @ubm-hyogo/api lint` が exit 0。 |
| B-4 | contract spec green | `audit.contract.spec.ts` の Phase 4 §2 + Phase 6 fail path が全 pass。 |
| B-5 | repository spec green | `auditLog.repository.spec.ts` の Phase 4 §3 + Phase 6 回帰 / 耐性が全 pass。 |
| B-6 | 既存回帰維持 | 既存 contract 11 / repository 既存ケースが green を維持（Phase 6 §1）。 |

---

## 2. 検証コマンドと結果

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/routes/admin/audit.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts

mise exec -- pnpm --filter @ubm-hyogo/api lint
```

結果:

- API D1 targeted Vitest: PASS（2 files / 26 tests。`audit.contract.spec.ts` / `auditLog.repository.spec.ts`）。
- Web targeted Vitest: PASS（3 files / 54 tests。`AuditLogPanel` / `BatchIdCopyButton` / admin audit page）。
- `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`: PASS。

> package 名は `@ubm-hyogo/api` / `@ubm-hyogo/web`（issue 記載の `@repo/api` は誤り。実 package 名を正本とする）。

---

## 3. Gate-B 評価

Gate-B = **passed**。`artifacts.json` / `outputs/artifacts.json` の Gate-B も `passed_at=2026-06-03T17:33:02+09:00` に同期済み。

---

## 4. 不変条件 / スコープ確認（Gate-B の前提）

| 確認 | 内容 |
| --- | --- |
| 新 endpoint 追加なし | `GET /admin/audit` の query 拡張のみ。 |
| schema 変更なし | `audit_log` DDL / index 変更なし（AC-5: json_extract full scan + 緩和策で対応）。 |
| write 側変更なし | `memberTags.ts` / `members.ts` の batchId 埋め込みロジック非変更。 |
| D1 直アクセス境界（#5） | json_extract SQL は `auditLog.ts` にのみ存在。 |
| append-only 維持 | read-only query のみ。UPDATE / DELETE を増やさない。 |

## 完了条件 (DoD)

- Gate-B の完了条件（B-1..B-6）が検証手段付きで定義されている。
- 検証コマンド（typecheck / 2 spec test / lint）が `@ubm-hyogo/api` で記述されている。
- Gate-B passed の根拠と残 runtime visual gate が分離されている。
