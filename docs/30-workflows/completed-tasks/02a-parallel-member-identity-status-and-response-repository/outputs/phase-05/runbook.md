# 実装ランブック詳細

## Step 1: _shared 実装

### brand.ts
@ubm-hyogo/shared からの re-export のみ。テスト・本番両方で使える。

### db.ts
独自 D1Db interface を定義。@cloudflare/workers-types には依存しない。
ctx() ファクトリ関数で DbCtx を生成。

### sql.ts
placeholders(n) ヘルパー関数。`?1,?2,...,?n` 形式の文字列を生成。

## Step 2: 各リポジトリ実装

各リポジトリは以下のパターンに従う:

```typescript
import type { DbCtx } from "./_shared/db";
import type { SomeId } from "./_shared/brand";

interface SomeRow { /* D1 raw row */ }

export async function findSomething(c: DbCtx, id: SomeId): Promise<SomeRow | null> {
  return c.db.prepare("SELECT * FROM some_table WHERE id = ?1 LIMIT 1")
    .bind(id)
    .first<SomeRow>();
}
```

## Step 3: MockD1 実装

MockStore にテーブルごとのデータを保持。
executeFirst/executeAll は SQL の FROM 句と WHERE 句をパターンマッチして適切なデータを返す。
executeRun は INSERT/UPDATE/DELETE をシミュレートしてデータを更新。

## Step 4: テスト実装

各テストファイルで MockStore にデータをセットアップし、リポジトリ関数を呼び出して検証。
builder テストは複数テーブルのデータを組み合わせて動作確認。

## Step 5: テスト実行・型チェック

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260427-133024-wt-2
mise exec -- pnpm test --reporter=verbose
mise exec -- pnpm typecheck
```
