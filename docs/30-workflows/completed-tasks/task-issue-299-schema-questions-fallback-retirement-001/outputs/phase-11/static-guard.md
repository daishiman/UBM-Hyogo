# Static Guard

## 対象ファイル（削除済み fallback の本体）

コマンド:

```bash
grep -n "stable_key FROM schema_questions WHERE question_id" apps/api/src/repository/schemaQuestions.ts
```

結果: **0 hits** (exit 1)。issue-299 で `findStableKeyByQuestionId` 内 fallback SELECT を削除済み。

## 全体 grep（apps/api + packages）

コマンド:

```bash
grep -rn "stable_key FROM schema_questions WHERE question_id" apps/api packages
```

結果（issue-299 scope 外、削除対象外）:

```
apps/api/src/workflows/schemaAliasAssign.ts:89:      "SELECT question_id, revision_id, stable_key FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
apps/api/src/workflows/schemaAliasAssign.contract.spec.ts:108
apps/api/src/workflows/schemaAliasAssign.contract.spec.ts:145
apps/api/src/routes/admin/schema.contract.spec.ts:124
```

判定:

- `schemaAliasAssign.ts:89` は 07b alias assignment workflow が「現在の `schema_questions.stable_key` を読み取って alias replacement 判定に使う」用途で、issue-299 が廃止した「alias 解決経路としての fallback SELECT」とは責務が独立。本タスクスコープ外（index.md「含まない」L57 の direct update guard 強化と同じく別経路）。
- 残る 3 件は contract spec が `schema_questions.stable_key` を read assertion している箇所であり、テーブル自体は維持される（read 用途は継続）ため意図通り。

issue-299 が削除対象とした `findStableKeyByQuestionId` 内の fallback SELECT は静的検査でも 0 件を確認した。
