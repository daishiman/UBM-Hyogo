# Implementation Guide - Issue #299 schema_questions fallback retirement

## Part 1: 中学生レベル

### なぜ必要か

学校で名簿を直すとき、古い紙の名簿と新しいパソコンの名簿を同時に使い続けると、どちらが正しいのか分からなくなります。最初は移し替えのために両方を見る必要がありますが、移し替えが終わったら、新しい名簿だけを見るようにした方が間違いが減ります。

このタスクも同じです。古い保存場所にある名前を、答えを探すための予備として読み続けると、新しい保存場所と二重に正解ができてしまいます。だから、全員分が新しい保存場所へ移ったことを確認してから、古い予備の読み取りをやめます。

### 何をするか

- まず、本番用と確認用のデータで、移し替え漏れが 0 件か調べます。
- 漏れが 1 件でもあれば、古い予備は消さず、どのデータが残っているかを記録します。
- 漏れが 0 件なら、古い予備を読むコードを削除します。
- 削除後は、テストと検索で、古い予備を読む道が戻っていないことを確認します。

### 専門用語セルフチェック

| 用語 | 日常語での説明 |
| --- | --- |
| fallback | 本命が見つからないときに見る予備 |
| stableKey | 質問を同じものとして見分けるための名前札 |
| schema_aliases | 新しい名前札の対応表 |
| schema_questions | 古い質問一覧の保存場所 |
| coverage query | 移し替え漏れがないか調べる確認表 |
| staging | 本番前に試すための場所 |
| unresolved | まだ人が確認しないと決められない状態 |

## Part 2: 技術者レベル

### Contract

`findStableKeyByQuestionId(c, questionId): Promise<string | null>` keeps its signature. After retirement, it delegates only to `findAliasByQuestionId`; alias miss returns `null`. The caller keeps the existing unresolved enqueue path.

```ts
export async function findStableKeyByQuestionId(
  c: DbCtx,
  questionId: string,
): Promise<string | null> {
  const alias = await findAliasByQuestionId(c, questionId);
  if (alias) return alias.stableKey;
  return null;
}
```

### Required implementation sequence

1. Run production and staging alias coverage queries. Both must return zero rows.
2. Add or update focused tests so alias miss returns `null` even when `schema_questions.stable_key` has a value.
3. Remove the fallback SELECT from `apps/api/src/repository/schemaQuestions.ts`.
4. Run focused API tests, full API tests, typecheck, lint, coverage guard, and static grep.
5. Update aiworkflow-requirements specs and source task status according to GO or DEFERRED outcome.

### Error handling and edge cases

| Case | Handling |
| --- | --- |
| coverage query returns rows | Do not delete fallback. Record rows and next retry condition as `blocked_by_coverage`. |
| alias miss after retirement | Return `null`; sync treats it as unresolved and enqueues normal schema diff work. |
| D1 transient error during alias lookup | Preserve existing error propagation and retry behavior. Do not treat as alias miss. |
| direct `updateStableKey` hardening | Scope out to `task-issue-191-direct-stable-key-update-guard-001`. |

### Commands

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --file scripts/diagnose/schema-aliases-coverage.sql --remote
mise exec -- pnpm --filter @repo/api test -- resolve-stable-key
mise exec -- pnpm --filter @repo/api test
mise exec -- pnpm typecheck
mise exec -- pnpm lint
rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages
```
