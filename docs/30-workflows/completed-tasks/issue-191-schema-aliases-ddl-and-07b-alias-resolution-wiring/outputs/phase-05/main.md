# Phase 5 出力: 実装ランブック（issue-191）

Phase 2 設計と Phase 4 verify suite を入力に、`schema_aliases` DDL 適用 → repository 実装 → 07b 配線変更 → 03a fallback 追加までの実装手順を順序付きで確定する。コード本体は実装フェーズで書くが、ここでは擬似コード・placeholder・sanity check で誤実装を防ぐ。

## runbook（実装順序）

### Step 1: マイグレーションファイル追加

| 項目 | 値 |
| --- | --- |
| 配置 | `apps/api/migrations/<NNNN>_create_schema_aliases.sql` |
| 採番 | 実装時 `ls apps/api/migrations` で最終番号 + 1 |
| 内容 | Phase 2 DDL 案そのまま |

### Step 2: ローカル D1 へ apply

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-local --local
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-local --local
# 当該ファイルが applied 表示（AC-1）
```

### Step 3: schemaAliasesRepository 実装

配置: `apps/api/src/repositories/schemaAliases.ts`

```ts
export interface SchemaAliasRow {
  id: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: 'manual' | 'auto' | 'migration';
  createdAt: string;
  resolvedBy: string | null; // row read model。source='migration' のみ null 許容
  resolvedAt: string | null;
}

export interface SchemaAliasesRepository {
  lookup(aliasQuestionId: string): Promise<SchemaAliasRow | null>;
  findByQuestionId(aliasQuestionId: string): Promise<SchemaAliasRow | null>;
  insert(row: Omit<SchemaAliasRow, 'createdAt'>): Promise<SchemaAliasRow>;
  update(
    id: string,
    patch: Partial<Pick<SchemaAliasRow,
      'stableKey' | 'aliasLabel' | 'source' | 'resolvedAt'>> & { resolvedBy: string },
  ): Promise<void>;
}
// insert は UNIQUE violation を ConflictError に正規化
// alias_question_id は immutable（update では受けない）
```

### Step 4: schemaQuestionsRepository に fallback メソッド追加

```ts
findStableKeyById(aliasQuestionId: string): Promise<string | null>;
// SELECT stable_key FROM schema_questions WHERE question_id = ? AND stable_key IS NOT NULL
```

### Step 5: resolveStableKey service 新規

配置: `apps/api/src/services/sync/resolveStableKey.ts`

```ts
export async function resolveStableKey(
  deps: { aliases: SchemaAliasesRepository; questions: SchemaQuestionsRepository },
  questionId: string,
): Promise<{ stableKey: string; source: 'aliases' | 'questions_fallback' } | null> {
  const alias = await deps.aliases.lookup(questionId);
  if (alias) return { stableKey: alias.stableKey, source: 'aliases' };

  const fallback = await deps.questions.findStableKeyById(questionId);
  if (fallback) return { stableKey: fallback, source: 'questions_fallback' };

  return null;
}
```

### Step 6: 07b handler 配線変更

配置: `apps/api/src/services/admin/aliasAssignment.ts`（既存 patch）

```ts
// Before（禁止）
// await db.execute('UPDATE schema_questions SET stable_key = ? WHERE question_id = ?', ...);

// After
await aliases.insert({
  id: ulid(),
  stableKey,
  aliasQuestionId: diffRow.questionId,
  aliasLabel: diffRow.questionLabel ?? null,
  source: 'manual',
  resolvedBy: ctx.adminUserId,
  resolvedAt: new Date().toISOString(),
});
await diffQueue.markResolved(diffRow.id);
// schema_questions UPDATE は禁止
```

### Step 7: 03a sync の lookup 順序差し替え

03a sync job 内の stableKey 解決呼び出しを `resolveStableKey` 経由に差し替え。03a の write は触らず read 経路追加のみ。

### Step 8: grep 0 件チェックの pnpm script 追加

```json
{
  "scripts": {
    "lint:no-direct-stablekey-update": "rg -n 'UPDATE\\s+schema_questions\\s+SET\\s+stable_key' apps/ --glob '!**/migrations/**' && exit 1 || exit 0"
  }
}
```

CI workflow に組み込む（Phase 9）。

## sanity check

| Step | 操作 | 期待 |
| --- | --- | --- |
| S1 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-local --local` | 新 migration applied |
| S2 | `mise exec -- pnpm --filter @ubm/api test -- schemaAliases.contract` | unit green |
| S3 | `mise exec -- pnpm --filter @ubm/api test -- alias-resolution.e2e` | E2E green |
| S4 | `mise exec -- pnpm lint:no-direct-stablekey-update` | exit 0（grep 0 件） |
| S5 | smoke: 07b POST → `SELECT * FROM schema_aliases` | 1 行存在、schema_questions row unchanged |
| S6 | `mise exec -- pnpm typecheck` | 0 error |

## placeholder 一覧

| 項目 | 確定方法 | フェーズ |
| --- | --- | --- |
| migration 番号 `<NNNN>` | `ls apps/api/migrations` で最新+1 | Step 1 直前 |
| `id` 採番（ULID/UUID） | 既存 repository の慣習 grep | Step 3 直前 |
| D1 アクセス API | 既存 repository を 1 つ open | Step 3 直前 |
| 07b admin auth middleware path | `apps/api/src/middleware/` 確認 | Step 6 直前 |

## 不変条件マッピング

| # | 担保 |
| --- | --- |
| #1 | Step 6 で stableKey 直 UPDATE 排除、Step 8 grep で構造保証 |
| #5 | 全実装が `apps/api/src/` 配下 |
| #14 | 07b admin endpoint からのみ INSERT、03a は read-only |

## 次 Phase（6: 異常系検証）への引き渡し

- runbook 8 step + 擬似コード + placeholder
- open: migration 番号と id 採番方式は実装着手時に確定
