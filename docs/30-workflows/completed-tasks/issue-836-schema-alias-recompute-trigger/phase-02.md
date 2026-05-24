# Phase 2: 設計

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 名称 | 設計（migration / API contract / recompute algorithm / UI 状態機械） |
| 依存 | phase-01.md（要件定義） |
| 成果物 | 本ファイル + outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md |
| 状態 | spec_created |

## 目的

recompute 実装の topology・契約・アルゴリズム・UI 状態遷移を確定する。後続 Phase（テスト・実装）が迷わない粒度で型・SQL・関数シグネチャを固定する。

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 検討対象 | 再利用 / 新規 | 判断 |
| --- | --- | --- |
| reverse-backfill 本体 | 新規（`backfillResponseFields` を対称コピーして方向反転） | backfill は extra→stableKey 専用で逆方向引数を取らないため、対称関数を新設する方が安全 |
| audit 記録 | 再利用（`auditLog.ts` `append()` または rollback と同じ batch insert パターン） | 既存 append() / SQL INSERT を踏襲 |
| web mutation | 再利用（`@/features/admin/hooks/useAdminMutation`） | CLAUDE.md #10 標準経路 |
| status バッジ UI | 既存 primitives で構成（新規 primitive を生やさない / CLAUDE.md UI 不変条件 3） | OKLch token のみ |
| soft-deleted alias 取得 | 再利用（`getById(c, id, { includeDeleted: true })`） | rollback で実装済みのオプション |

## topology（責務境界 / 状態所有権）

```
[SchemaDiffPanel.tsx]  ── recompute ボタン押下（admin 明示）
        │ useAdminMutation
        ▼
[lib/admin/api.ts] recomputeSchemaAlias / getSchemaAliasRecomputeStatus
        │ fetch POST/GET /api/admin/schema/aliases/:aliasId/recompute
        ▼
[routes/admin/schema.ts]  recompute endpoint（auth / param / body parse）
        │
        ▼
[workflows/schemaAliasRecompute.ts]  ─ job 作成/取得（idempotent）
        │                              ─ reverseBackfillResponseFields（chunk + CPU budget）
        │                              ─ audit_log insert（schema_alias.recompute）
        ▼
[repository/schemaAliasRecomputeJobs.ts]  job CRUD
        ▼
[D1] schema_alias_recompute_jobs / response_fields / audit_log
```

- **状態所有権**: job の真実は D1 `schema_alias_recompute_jobs`。UI は API から取得した status を表示するのみ（local state に真実を持たない）。
- **責務境界**: endpoint = 認証 + パラメータ検証 + workflow 呼び出し。workflow = idempotency 判定 + reverse-backfill + audit。repository = SQL のみ。

## 設計成果物への導線

| 成果物 | 内容 |
| --- | --- |
| outputs/phase-02/d1-schema-migration.md | `0020` migration DDL / index / 採番根拠 |
| outputs/phase-02/api-contract.md | endpoint 2 本の path / request / response / error / 型定義 |
| outputs/phase-02/recompute-algorithm.md | reverse-backfill アルゴリズム / idempotency / CPU budget / 衝突回避 |
| outputs/phase-02/ui-state-machine.md | recompute UI の状態遷移・ボタン disable・status バッジ |

## ステップ間 state 引き渡し（UI）

| 起点 state | 引き渡し項目 | 反映タイミング |
| --- | --- | --- |
| rollback 完了 impact | `recomputeRequired` / `affectedResponseCount` / `aliasId` / `version` | rollback 成功直後、recompute 導線の表示判定 |
| recompute job status | `status` / `affectedCount` / `processedCount` / `lastError` | recompute 実行後 + GET status poll |

## 完了条件 (DoD)

- [ ] outputs/phase-02 の 4 ファイルがすべて作成され、型・SQL・シグネチャが具体化されている
- [ ] topology に状態所有権・責務境界が記述されている
- [ ] idempotency 戦略（job UNIQUE）が algorithm doc に固定されている
- [ ] AC-1〜AC-13 が設計のどこで担保されるか追跡可能
