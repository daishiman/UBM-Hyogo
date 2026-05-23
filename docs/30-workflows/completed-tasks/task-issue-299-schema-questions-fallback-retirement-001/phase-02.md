# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | task-issue-299-schema-questions-fallback-retirement-001 |
| 作成日 | 2026-05-15 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | 変更対象ファイル・関数シグネチャ・transaction 境界の設計 |

## 目的

Phase 1 AC を、編集対象ファイル、関数シグネチャ、削除する SQL、test 更新差分、検証コマンドへ落とす。

## 実行タスク

| Concern | 変更対象 | 変更種別 | owner |
| --- | --- | --- | --- |
| repository | `apps/api/src/repository/schemaQuestions.ts` | 編集（L142-150 削除） | backend |
| sync test | `apps/api/src/sync/schema/resolve-stable-key.spec.ts` | 編集（"fallback" ケース書き換え） | backend |
| repository test | `apps/api/src/repository/__tests__/schemaQuestions.spec.ts`（存在すれば） | 編集 | backend |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | 編集（fallback 記述削除） | backend |
| coverage script | `scripts/diagnose/schema-aliases-coverage.sql`（新規） | 新規 | backend |

## 変更対象ファイル詳細

### 1. `apps/api/src/repository/schemaQuestions.ts`

**変更前（L135-151）**:

```ts
export async function findStableKeyByQuestionId(
  c: DbCtx,
  questionId: string,
): Promise<string | null> {
  const alias = await findAliasByQuestionId(c, questionId);
  if (alias) return alias.stableKey;

  const r = await c.db
    .prepare(
      "SELECT stable_key FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
    )
    .bind(questionId)
    .first<{ stable_key: string }>();
  if (!r) return null;
  if (r.stable_key === "unknown") return null;
  return r.stable_key;
}
```

**変更後**:

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

- シグネチャは不変（`Promise<string | null>`）。
- doc comment（L130-134）の「03a sync 用」記述は維持し、fallback 言及部のみ削除。

### 2. `apps/api/src/sync/schema/resolve-stable-key.spec.ts`

**変更前（"fallback" ケース）**:
> `schema_aliases` miss の場合に `schema_questions.stable_key` を読むことを assertion。

**変更後（"fallback retired" ケース）**:
> `schema_aliases` miss の場合は null を返し、`schema_questions` への SELECT が **発行されないこと** を D1 mock の query log で assertion。後段で `resolveStableKey` が `source='unknown'` を返すことを assertion。

### 3. coverage 判定 SQL（新規 `scripts/diagnose/schema-aliases-coverage.sql`）

```sql
-- AC-1 coverage check: alias 未登録の stable_key 持ち question を列挙
SELECT q.question_id, q.stable_key, q.revision_id
FROM schema_questions q
LEFT JOIN schema_aliases a ON a.alias_question_id = q.question_id
WHERE q.stable_key IS NOT NULL
  AND q.stable_key != 'unknown'
  AND a.alias_question_id IS NULL;
-- 期待: 0 件
```

実行コマンド（production / staging とも同一 SQL 正本を使用）:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env staging --file scripts/diagnose/schema-aliases-coverage.sql --remote
```

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| 上流実装 | `docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/phase-02.md` | schema_aliases 設計 |
| Cloudflare CLI | `scripts/cf.sh` | D1 read-only 実行 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | fallback 記述更新対象 |

## 実行手順

1. coverage SQL を staging / production の両方で実行し、0 件を確認する（Phase 11 evidence）。
2. 0 件でない場合は廃止延期判定とし、unresolved な question_id を Phase 12 `unassigned-task-detection.md` に記録、本 PR から fallback 削除コミットを除外する。
3. 0 件確認後、L142-150 を削除する。
4. test を AC-5 セマンティクスへ更新する。
5. 正本仕様の fallback 記述を更新する。

## 統合テスト連携

| コマンド | 目的 |
| --- | --- |
| `mise exec -- pnpm --filter @repo/api test` | repository / sync test PASS |
| `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file scripts/diagnose/schema-aliases-coverage.sql --remote` | coverage query 0 件確認（read-only） |
| `rg -n "stable_key FROM schema_questions WHERE question_id" apps/api packages` | 削除後 0 件確認 |

## 多角的チェック観点（AIが判断）

- `updateStableKey`（L153-172）など fallback 経路外の `schema_questions.stable_key` 書き込みを巻き添えに削除していないか。
- coverage query が production / staging 両方で 0 件かを確認しているか。
- doc comment の更新が AC-7 を満たすか。

## サブタスク管理

| Phase | サブタスク | 依存 |
| --- | --- | --- |
| 4 | test matrix | Phase 2 |
| 5 | implementation runbook | Phase 4 |
| 6 | failure cases | Phase 5 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計書 | `phase-02.md` | 変更対象とシグネチャ |

## 完了条件

- [ ] 変更対象ファイルと変更種別が定義されている
- [ ] 関数シグネチャの before / after が明記されている
- [ ] coverage SQL の実行コマンドが明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 1 AC と Phase 2 設計の対応が取れている
- [ ] Phase 3 でレビューできる粒度になっている

## 次Phase

Phase 3: 設計レビュー
