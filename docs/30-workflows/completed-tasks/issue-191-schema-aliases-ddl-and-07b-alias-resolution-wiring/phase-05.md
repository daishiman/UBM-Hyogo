# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 4（テスト戦略） |
| 次 Phase | 6（異常系検証） |
| 状態 | spec_created |

## 目的

Phase 2 設計と Phase 4 verify suite を入力に、`schema_aliases` DDL 適用 → repository 実装 → 07b 配線変更 → 03a fallback 追加までの実装手順を順序付きで確定する。コード本体は実装フェーズで書くが、ここでは擬似コード / placeholder / sanity check を記述し、誤実装を防ぐ。

## runbook（実装順序）

### Step 1: マイグレーションファイル追加

| 項目 | 値 |
| --- | --- |
| 配置 | `apps/api/migrations/<NNNN>_create_schema_aliases.sql` |
| 採番 | `ls apps/api/migrations` で最新番号 + 1（既存命名規則を確認、4桁 zero-pad と推定） |
| 内容 | Phase 2 の DDL 案そのまま（`schema_aliases` テーブル + `idx_schema_aliases_stable_key` INDEX + `UNIQUE(alias_question_id)`） |

```sql
-- placeholder: <NNNN> は既存マイグレーション最終番号 + 1
CREATE TABLE IF NOT EXISTS schema_aliases (
  id              TEXT PRIMARY KEY,
  stable_key      TEXT NOT NULL,
  alias_question_id TEXT NOT NULL,
  alias_label     TEXT,
  source          TEXT NOT NULL DEFAULT 'manual',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_by     TEXT,
  resolved_at     TEXT,
  UNIQUE (alias_question_id)
);
CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases (stable_key);
```

### Step 2: ローカル D1 へ apply

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-local --local
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-local --local
# -> 当該ファイルが applied 表示されること（AC-1）
```

### Step 3: schemaAliasesRepository 実装

配置: `apps/api/src/repositories/schemaAliases.ts`

```ts
// 擬似コード
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
  update(id: string, patch: Partial<Pick<SchemaAliasRow,
      'stableKey' | 'aliasLabel' | 'source' | 'resolvedAt'>> & { resolvedBy: string }): Promise<void>;
}

// insert は UNIQUE violation を ConflictError に正規化
// alias_question_id は immutable（update では受け付けない）
```

placeholder:
- `id` 採番方式: 既存リポジトリで ULID が使われていれば踏襲、なければ Phase 2 推奨 ULID で実装。確定箇所: `apps/api/src/repositories/` 既存ファイル grep
- D1 アクセス層: 既存 repository が kysely / better-sqlite / 直 SQL のどれかを踏襲

### Step 4: schemaQuestionsRepository に fallback メソッド追加

配置: `apps/api/src/repositories/schemaQuestions.ts`

```ts
// 既存 repository に追加
findStableKeyById(aliasQuestionId: string): Promise<string | null>;
// SELECT stable_key FROM schema_questions WHERE question_id = ? AND stable_key IS NOT NULL
```

### Step 5: resolveStableKey service 新規

配置: `apps/api/src/services/sync/resolveStableKey.ts`

```ts
// 擬似コード（Phase 2 lookup 順序）
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
// Before（禁止される実装）
// await db.execute('UPDATE schema_questions SET stable_key = ? WHERE question_id = ?',
//   [stableKey, questionId]);

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
// schema_questions UPDATE は一切呼ばない
```

### Step 7: 03a sync 経路の lookup 順序差し替え

03a 既存 sync job 内の stableKey 解決呼び出し箇所を `resolveStableKey` 経由に差し替える。`schema_questions.stable_key` を直接 SELECT している既存箇所が `resolveStableKey` の中に内包される構造に変える（read 経路の追加のみ。03a の write は触らない）。

### Step 8: grep 0 件チェックの pnpm script 追加

`package.json`（root or `apps/api`）に追記:

```json
{
  "scripts": {
    "lint:no-direct-stablekey-update": "rg -n 'UPDATE\\s+schema_questions\\s+SET\\s+stable_key' apps/ --glob '!**/migrations/**' && exit 1 || exit 0"
  }
}
```

CI workflow に組み込む（Phase 9 で確認）。

## sanity check

| Step | コマンド / 操作 | 期待 |
| --- | --- | --- |
| S1 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-local --local` | 新マイグレーション applied |
| S2 | `mise exec -- pnpm --filter @ubm/api test -- schemaAliases.contract` | unit green |
| S3 | `mise exec -- pnpm --filter @ubm/api test -- alias-resolution.e2e` | E2E green |
| S4 | `mise exec -- pnpm lint:no-direct-stablekey-update` | exit 0（grep 0 件） |
| S5 | smoke: 07b endpoint に admin token で POST → D1 で `SELECT * FROM schema_aliases` | 1 行存在、`schema_questions` 当該 row は unchanged |
| S6 | `mise exec -- pnpm typecheck` | 0 error |

## placeholder 一覧

| 項目 | 確定方法 | フェーズ |
| --- | --- | --- |
| マイグレーション番号 `<NNNN>` | 実装時に `ls apps/api/migrations` で最新+1 | Step 1 直前 |
| `id` 採番（ULID / UUID） | 既存リポジトリの慣習 grep で確認 | Step 3 直前 |
| D1 アクセス API（kysely / 直 SQL） | 既存 repository を 1 つ open して踏襲 | Step 3 直前 |
| 07b admin auth middleware の正確な path | 既存 `apps/api/src/middleware/` 確認 | Step 6 直前 |

## 不変条件マッピング

| 不変条件 | 実装での担保 |
| --- | --- |
| #1 | Step 6 で stableKey 直書き UPDATE を排除、Step 8 grep で構造保証 |
| #5 | 全実装が `apps/api/src/` 配下、`apps/web` 変更なし |
| #14 | 07b admin endpoint からのみ INSERT、03a は read-only |

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 成果物

- `outputs/phase-05/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] Step 1〜8 の擬似コード / コマンドが順序付きで記載
- [ ] sanity check S1〜S6 が記載
- [ ] placeholder が確定方法とともに 4 件以上明示
- [ ] 不変条件 #1 / #5 / #14 の実装担保が記載
- [ ] artifacts.json の phase 5 が `spec_created`

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `apps/api/migrations/`（既存命名規則）
- Phase 2 / Phase 4

## 次 Phase への引き渡し

- 引き継ぎ事項: runbook 8 step / 擬似コード / placeholder
- open question: マイグレーション番号と id 採番方式は実装着手時に確定
