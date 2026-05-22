# Diff Evidence

## コマンド

```bash
git diff -- apps/api/src/repository/schemaQuestions.ts \
            apps/api/src/sync/schema/resolve-stable-key.spec.ts \
            .claude/skills/aiworkflow-requirements/references/database-implementation-core.md
```

## 変更行数サマリ

| ファイル | 増減 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | +12 / -9 |
| `apps/api/src/repository/schemaQuestions.ts` | +4 / -13 |
| `apps/api/src/sync/schema/resolve-stable-key.spec.ts` | +34 / -4 |
| **合計** | **+50 / -26**（差分本文 147 行） |

## 影響範囲

- `findStableKeyByQuestionId`: シグネチャ不変 (`Promise<string | null>`)。内部から `schema_questions` SELECT を削除し alias-only 経路へ。
- `resolveStableKey`: 呼び出し側ロジックは不変。alias miss + known miss が `source='unknown'` に確定するセマンティクスは元から備わっており、本変更によって fallback hit が完全に消滅する。
- `schemaAliasesRepository.lookup` および `findAliasByQuestionId` 経路は不変。
- 03a sync 経路: alias miss = unresolved として `schema_diff_queue` enqueue する既存パスが正本となる。
- 正本仕様 `database-implementation-core.md` の fallback 関連 3 箇所（contract 表 / lookup 順序 / 移行終端条件）を retired 表記に同期。

## unified diff（抜粋）

```diff
- /**
-  * 03a sync 用: question_id → 既存 stable_key を引く（既存 alias 取り込み源）。
-  * 'unknown' は alias 未確定として扱い null 返却。
-  * AC-3: alias 確定後の sync で stableKey を温存するために使用。
-  */
+ /**
+  * 03a sync 用: question_id → 既存 stable_key を引く（alias-only 解決）。
+  * issue-299: schema_aliases への 100% 移行完了に伴い、schema_questions.stable_key
+  * SELECT fallback を廃止。alias miss は unresolved として null を返す。
+  */
 export async function findStableKeyByQuestionId(
   c: DbCtx,
   questionId: string,
 ): Promise<string | null> {
   const alias = await findAliasByQuestionId(c, questionId);
   if (alias) return alias.stableKey;
-
-  const r = await c.db
-    .prepare(
-      "SELECT stable_key FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
-    )
-    .bind(questionId)
-    .first<{ stable_key: string }>();
-  if (!r) return null;
-  if (r.stable_key === "unknown") return null;
-  return r.stable_key;
+  return null;
 }
```

完全な diff は `git diff -- apps/api/src/repository/schemaQuestions.ts apps/api/src/sync/schema/resolve-stable-key.spec.ts .claude/skills/aiworkflow-requirements/references/database-implementation-core.md` で再取得できる。
