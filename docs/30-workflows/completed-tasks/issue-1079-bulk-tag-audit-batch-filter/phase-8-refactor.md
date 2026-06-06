# Phase 8: リファクタリング（重複削減 / 命名整合）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api: `auditLog.ts` / `audit.ts`） |

> 本ファイルはリファクタリング計画である。実装サイクルで「テスト green を維持したまま」適用判断する。

---

## 1. json_extract WHERE 句の helper 化判断（YAGNI）

| 対象 | Before | After | 理由（判断） |
| --- | --- | --- | --- |
| `listFiltered` の batchId 句 | `if (filters.batchId) { bindings.push(...); where.push("((json_valid(after_json) AND json_extract(after_json,'$.batchId') = ?N) OR (json_valid(before_json) AND json_extract(before_json,'$.batchId') = ?N))"); }`（inline・1 箇所） | **変更なし（inline 維持）** | **YAGNI: json_extract OR 検索は repository 内で 1 箇所のみ**。helper（例: `addJsonExtractOr(path, value)`）に抽出しても呼び出し元が 1 つで、抽象化が読みやすさを下げる（binding 番号共有と `json_valid` guard という特殊事情も helper に隠すと追いづらい）。既存 cursor 句も inline で `bindings.push` + 手書き `?N` のため、batchId 句も同じ inline 様式で整合させるのが命名・構造の一貫性に資する。2 箇所目の json_extract 検索が現れた時点で初めて helper 化を検討する（その時が抽象化の正しいタイミング）。 |

> 判断結論: **helper 化しない。inline 維持。** 1 箇所・特殊な binding 共有・既存 cursor 句との様式統一が理由。

---

## 2. 命名整合（既存規則への準拠確認）

| 項目 | 規則 | 本タスクの命名 | 整合 |
| --- | --- | --- | --- |
| filter 型フィールド | `AuditLogListFilters` の既存 camelCase（`fromUtc` / `toUtcExclusive`） | `batchId?: string` | OK（camelCase・親 #1036 の audit JSON key `batchId` と一致）。 |
| query schema key | `ListAuditQueryZ` の既存 key（`action` / `actorEmail` / `targetType`） | `batchId` | OK（camelCase・JSON key と URL query key を一致）。 |
| appliedFilters key | response schema の既存 key | `batchId: string | null` | OK（他 filter の `string | null` パターンに整合）。 |
| JSON path リテラル | — | `'$.batchId'` | OK（`after_json` / `before_json` に埋め込まれた実 key `batchId` と一致・members.ts L761/L770 の shape に整合）。 |

→ 新規命名の追加 / 改名は不要。既存命名規則に自然に乗る。

---

## 3. 重複削減の検討

| 候補 | 判断 |
| --- | --- |
| after / before の 2 json_extract を 1 つにまとめる（COALESCE 等） | **しない。** `COALESCE(json_extract(after_json,'$.batchId'), json_extract(before_json,'$.batchId')) = ?N` は壊れた JSON row で `malformed JSON` になり得るうえ、OR の明示が「assign は after / unassign は before に入る」という設計意図（Phase 2 §A-2）を SQL 上で読み取りやすくする。可読性と堅牢性優先で `json_valid` guard 付き OR 形を維持。 |
| query parse の重複（他 filter と同じ `query || undefined` パターン） | **そのまま踏襲（重複ではなく一貫パターン）。** audit route の全 string filter が同パターンで正規化しており、batchId だけ別処理にする方が不整合。 |

---

## 4. リファクタリング後の検証

リファクタリング適用後（または非適用確定後）も、Phase 4 / 6 の全テストが green であることを確認:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/routes/admin/audit.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

## 完了条件 (DoD)

- json_extract 句の helper 化判断（YAGNI で inline 維持）が対象 / Before / After / 理由テーブルで記述されている。
- 命名整合が既存規則と突き合わせて確認されている。
- 重複削減候補（COALESCE 化 / query parse パターン）の判断が記録されている。
