# Phase 8 出力: DRY 化（issue-191）

Phase 1〜7 を踏まえ既存コードベースとの重複・命名揺れを排除し、命名・型・path・endpoint を一意な正本に正規化する。Phase 13 PR 提出時のリファクタ齟齬を未然に潰す。

## 1. 命名（identifier）

| 区分 | Before | After | 備考 |
| --- | --- | --- | --- |
| TS field | 07b 内部で `questionId` のみ使用 | `aliasQuestionId` | alias 文脈の一意名 |
| TS field | `stable_key` 混在 | `stableKey` | TS 層 camelCase 統一 |
| TS field | （未存在） | `aliasLabel` | nullable label snapshot |
| TS field | `resolved_by` | `resolvedBy` | admin user id |
| TS field | `resolved_at` | `resolvedAt` | ISO8601 |
| TS field | `source` | `source` | union: 'manual' \| 'auto' \| 'migration' |
| D1 column | snake_case | snake_case 維持 | DB 層は snake_case |
| 変換境界 | repository 内（service へ漏らさない） | mapper を repository に閉じる | - |

## 2. 型（TypeScript）

```ts
export interface SchemaAlias {
  id: string;                              // ULID
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: 'manual' | 'auto' | 'migration';
  createdAt: string;                       // ISO8601
  resolvedBy: string | null; // row read model。manual resolve insert では必須
  resolvedAt: string | null;
}

export interface SchemaAliasInsert {
  id: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: SchemaAlias['source'];
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface SchemaAliasPatch {
  stableKey?: string;
  aliasLabel?: string | null;
  source?: SchemaAlias['source'];
  resolvedBy: string;
  resolvedAt?: string | null;
}
```

## 3. path（モジュール配置）

| 区分 | Before | After |
| --- | --- | --- |
| migration | （不在） | `apps/api/migrations/<NNNN>_create_schema_aliases.sql` |
| repository | 07b 内 inline SQL | `apps/api/src/repositories/schemaAliases.ts` |
| repository ext | （不在） | `apps/api/src/repositories/schemaQuestions.ts` に `findStableKeyById` 追加 |
| resolver | 03a 内 inline | `apps/api/src/services/sync/resolveStableKey.ts` |
| 07b service | inline UPDATE | `apps/api/src/services/admin/aliasAssignment.ts`（既存 patch） |
| 共有型配置 | — | `apps/api/src/repositories/schemaAliases.ts` 内 export |
| 契約テスト | （不在） | `apps/api/test/repositories/schemaAliases.contract.test.ts` |

### 共有 schema 配置の確定

`apps/web` は alias を直接扱わず、admin UI 経由で 07b API を叩く構造。`SchemaAlias` 型を `packages/shared` に置く必要なし → **`apps/api` 内 export に閉じる**（不変条件 #5 と整合）。

## 4. endpoint（HTTP API 契約）

| 区分 | Before | After |
| --- | --- | --- |
| 07b alias 解決 | `POST /admin/schema/aliases` 内で schema_questions UPDATE | `POST /admin/schema/aliases` のまま内部書き込み先を `schema_aliases` へ変更 |
| request body | `{ stableKey: string }` | `{ stableKey: string, source?: 'manual' \| 'migration' }` |
| response | `{ ok: true }` | `{ ok: true, alias: SchemaAlias }` |
| 03a sync 内部 | resolver 関数分散 | 単一 `resolveStableKey()` 経由（internal） |
| read endpoint | （scope out） | `GET /admin/schema/aliases?questionId=` は本タスク out |

> 既存 07b endpoint URL/verb と差分が出る場合は **既存値を正本として After を合わせる**運用ルール。Phase 13 で再確認。

## 重複削除候補

| 種別 | 削除対象 | 根拠 |
| --- | --- | --- |
| inline SQL | 07b 内の `UPDATE schema_questions SET stable_key = ?` | After で schema_questions 書き込みが消える |
| ad-hoc type | 07b 内の `{ questionId, stableKey }` literal | `SchemaAliasInsert` に統合 |
| 重複 lookup | 03a 内に散在する `schemaQuestions.stableKey` 参照 | `resolveStableKey()` に集約 |

## lint rule（Phase 9 へ引き渡し）

- ripgrep: `rg -n "UPDATE\s+schema_questions\s+SET\s+stable_key" apps/` がヒット 0 を期待
- CI: 既存 `verify-*` ジョブに 1 step 追加（Phase 9 詳細）
- 例外: migration ファイルは対象外（grep 対象を `apps/**/*.ts` に限定）

## 不変条件マッピング再確認

| # | After の適合 |
| --- | --- |
| #1 | `SchemaAlias` 型がコード内 stableKey 直書きを構造的に防ぐ |
| #5 | repository / type 共に `apps/api/` 配下、`packages/shared` 配置しない |
| #14 | endpoint は既存契約互換の `POST /admin/schema/aliases` に集約 |

## 次 Phase（9: 品質保証）への引き渡し

- lint rule grep 仕様、共有型配置（apps/api 内）、endpoint contract、削除候補一覧
- open: 移行終端後に `schema_questions.stable_key` カラム削除するかは別 issue
