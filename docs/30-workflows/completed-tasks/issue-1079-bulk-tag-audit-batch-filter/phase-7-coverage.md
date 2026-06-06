# Phase 7: カバレッジ確認（変更範囲限定）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1079-bulk-tag-audit-batch-filter` |
| workflow_state | `spec_created` |
| 対象 | Task A（apps/api: 変更ブロックのみ） |

> 本ファイルはカバレッジ目標の計画である。実測は実装サイクルで取得する（runtime 完了語を書かない）。
> カバレッジは **全体一律ではなく変更ブロック（batchId 分岐）に限定**して line / branch を担保する。

---

## 1. 対象（変更ブロックのみ）

| ファイル | 変更ブロック | カバレッジ対象 |
| --- | --- | --- |
| `apps/api/src/repository/auditLog.ts` | `listFiltered` の `if (filters.batchId) { bindings.push(...); where.push(...); }` | この if 分岐の **真 / 偽** 両方（batchId 指定あり / なし）。 |
| `apps/api/src/routes/admin/audit.ts` | `?batchId` の safeParse 入力 / `listFiltered` への spread `...(parsed.data.batchId ? { batchId } : {})` / `appliedFilters.batchId: parsed.data.batchId ?? null` | 三項 / `??` の **真 / 偽** 両分岐（batchId あり = 一致 row / なし = null echo）。 |

> 既存の他 filter（action / from / to / cursor）や export 系関数・redact ロジックは本タスクの変更対象外であり、
> カバレッジ目標を新たに課さない（既存水準を維持する）。

---

## 2. branch / line 実測目標

| 指標 | 対象 | 目標 |
| --- | --- | --- |
| line | `listFiltered` の batchId 句 3 行（`if` / `bindings.push` / `where.push`） | 100%（TC g/h/i/k で実行）。 |
| branch | `if (filters.batchId)` の真偽 | 真（TC g/h/i/j） + 偽（既存 batchId 未指定ケース R-2 / cursor テスト）の両方を踏む = 100%。 |
| line | audit.ts の batchId 関連 4 箇所（schema / safeParse / spread / appliedFilters） | 100%（contract TC a/c で実行）。 |
| branch | `parsed.data.batchId ? {...} : {}` / `?? null` の真偽 | 真（TC a/c: batchId 指定）+ 偽（既存 batchId 無しケース: appliedFilters.batchId === null）の両方 = 100%。 |

---

## 3. 偽分岐（batchId 未指定）の踏破経路

batchId 未指定の偽分岐は **既存テスト**で既に踏まれる:

- repository: 既存複合 filter テスト（L109）/ cursor テスト（L120 / L302）は batchId を渡さない → `if (filters.batchId)` 偽。
- contract: 既存 11 ケース（L102-359）は batchId query を持たない → spread 偽 / `appliedFilters.batchId === null`。

→ 新規テストは真分岐（batchId 指定）を追加で踏むことで、両分岐 100% を満たす。

---

## 4. カバレッジ取得コマンド（変更範囲スコープ）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test --run \
  src/routes/admin/audit.contract.spec.ts \
  src/repository/__tests__/auditLog.repository.spec.ts \
  --coverage
```

> 全体カバレッジ閾値ではなく、上記 2 spec 実行時に **変更した batchId ブロックの line / branch が
> uncovered で残らない**ことを目視 / レポートで確認する。閾値 gate は既存 coverage-guard 方針に従う
> （sync-merge 時のスキップ等は CLAUDE.md の coverage-guard 節を参照）。

## 完了条件 (DoD)

- カバレッジ対象が変更ブロック（batchId 分岐）に限定して明記されている。
- line / branch の真偽両分岐の踏破経路（新規 = 真 / 既存 = 偽）が記述されている。
- 取得コマンドが変更範囲スコープで記述されている。
