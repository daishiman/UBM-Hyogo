# Implementation Guide

Status: implemented-local

## Part 1: 初学者向け

なぜ必要か。今回の作業が必要な理由は、同じ質問に別々の名前が付いたり、途中で処理が止まったりしても、あとから安全に続きを進められるようにするためです。何をするかは、重複を止めるルールを作り、途中から再開できる印を残すことです。

たとえば、クラスの席替えで新しい席番号を生徒に配る場面に似ています。同じクラスで同じ席番号を二人に渡すと混乱します。そこで出席簿に「一つの席番号は一人だけ」というルールを書き、人が見落としても出席簿が止めます。

別の例では、給食当番が時間内に全員へ配り切れなかったとき、「ここまで終わった」と印を付けて、次の時間に続きから配ります。最初からやり直すと、もう受け取った人へもう一度配ってしまいます。

最後に、新しい校則を入れる前に古い名簿の重複を直します。重複を残したまま校則を入れると、校則が古い名簿を弾いて作業が止まるからです。

用語メモ:

| 用語 | 簡単な意味 |
| --- | --- |
| stableKey | 席番号のような、あとから変わりにくい名前 |
| partial UNIQUE index | 条件付きで「同じ値は一つだけ」と守る出席簿ルール |
| CPU budget | 一回の作業で使える時間 |
| retryable response | 続きからもう一度試せるという返事 |
| idempotent | 何度やっても同じ結果になる性質 |
| back-fill | 古い記録へ新しい名前を入れ直す作業 |

### 今回作ったもの

- 重複した席番号を止める出席簿ルール。
- 途中で止まっても続きから進める印。
- 「まだ続きがある」と分かる返事。

## Part 2: 技術者向け

### Current Contract

- `schema_aliases` が manual alias の primary write target。
- `POST /admin/schema/aliases` は alias 確定と response back-fill を実行する。
- `schema_questions.stable_key` は fallback 互換に残すが、新規 manual alias の主書き込み先に戻さない。
- `response_fields.questionId` / `response_fields.is_deleted` は追加しない。`__extra__:<questionId>` と `deleted_members` join の既存方針を維持する。

### Implemented Delta

Implemented files:

- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/src/repository/schemaAliases.ts`
- `apps/api/src/repository/schemaQuestions.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `apps/api/src/workflows/schemaAliasAssign.ts`
- `apps/api/src/routes/admin/schema.ts`
- `apps/api/src/routes/admin/_shared.ts`
- `apps/api/src/workflows/schemaAliasAssign.test.ts`
- `apps/api/src/routes/admin/schema.test.ts`
- `apps/api/src/repository/__tests__/_setup.ts`

### DDL Contract

`schema_aliases` columns:

```sql
id TEXT PRIMARY KEY,
revision_id TEXT NOT NULL,
stable_key TEXT NOT NULL,
alias_question_id TEXT NOT NULL,
alias_label TEXT,
source TEXT NOT NULL,
created_at TEXT NOT NULL,
resolved_by TEXT,
resolved_at TEXT
```

Indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_schema_aliases_stable_key
  ON schema_aliases(stable_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_stablekey_unique
  ON schema_aliases(revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '__extra__:%';

CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_aliases_revision_question_unique
  ON schema_aliases(revision_id, alias_question_id);
```

`schema_diff_queue` adds `backfill_cursor` and `backfill_status`.

### API Contract

### APIシグネチャ

```http
POST /admin/schema/aliases
Content-Type: application/json
```

```ts
type SchemaAliasApplyRequest = {
  revisionId: string;
  aliases: Array<{
    questionId: string;
    stableKey: string;
    label?: string;
  }>;
  diffId?: string;
  dryRun?: boolean;
};

type SchemaAliasApplyResponse =
  | { ok: true; queueStatus: "resolved"; backfill: { status: "completed"; processedRows: number } }
  | {
      ok: false;
      code: "backfill_cpu_budget_exhausted";
      retryable: true;
      queueStatus: "resolved";
      backfill: { status: "exhausted"; cursor: string; processedOffset: number; totalRows: number };
    };
```

Successful completion returns HTTP 200 with back-fill summary. Continuation returns HTTP 202:

```json
{
  "ok": false,
  "code": "backfill_cpu_budget_exhausted",
  "retryable": true,
  "queueStatus": "resolved",
  "backfill": {
    "status": "exhausted",
    "cursor": "remaining-scan",
    "processedOffset": 100,
    "totalRows": 250
  }
}
```

Continuation visibility rule: any `schema_diff_queue` row with `backfill_status` of `in_progress`, `exhausted`, or `failed` must remain discoverable by `schemaDiffQueue.list()` or a documented operator path until it reaches `completed`.

### Idempotency

Back-fill updates only remaining rows:

```sql
UPDATE response_fields
SET stable_key = ?
WHERE revision_id = ?
  AND stable_key = ?
  AND NOT EXISTS (
    SELECT 1 FROM response_fields existing
    WHERE existing.response_id = response_fields.response_id
      AND existing.stable_key = ?
  );
```

Duplicate target rows are removed only when the target stable key already exists for the same response, preserving one logical value per response.

### 使用例

```bash
curl -sS -X POST "$API_ORIGIN/admin/schema/aliases" \
  -H "Content-Type: application/json" \
  -d '{"revisionId":"rev_1","aliases":[{"questionId":"q1","stableKey":"member_status"}]}'
```

### エラーハンドリング

| Case | HTTP | Code | Retry |
| --- | --- | --- | --- |
| CPU budget exhausted | 202 | `backfill_cpu_budget_exhausted` | yes |
| stable key collision | 409 | `stable_key_collision` | no |
| invalid body | 422 | validation code | no |
| missing diff | 404 | `diff_not_found` | no |
| D1 transaction/network failure | 500 | implementation error | operator retry after inspection |

### エッジケース

- `stableKey='unknown'` and `__extra__:*` are excluded from the partial unique stable key index.
- Deleted member current responses are skipped during back-fill.
- Re-running after HTTP 202 processes remaining rows only.
- Existing target stable key rows cause duplicate extra rows to be removed rather than duplicated.

### 設定項目と定数一覧

| Parameter | Current value | Notes |
| --- | --- | --- |
| batch size | 100 | Keeps local D1 tests and Workers budget bounded |
| CPU budget threshold | 25s | Returns 202 before hard failure |
| retry limit | operator/client controlled | Re-run until `backfill.status='completed'` |
| queue/cron split threshold | staging evidence based | Formalize only if 50,000-row evidence repeatedly exhausts |

### テスト構成

- `pnpm --filter @ubm-hyogo/api typecheck` -> PASS
- `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/workflows/schemaAliasAssign.test.ts apps/api/src/routes/admin/schema.test.ts apps/api/src/repository/schemaQuestions.test.ts` -> PASS (23 tests)

Phase 11 evidence:

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-evidence.md`
- `outputs/phase-11/link-checklist.md`

Staging 10,000+ row Workers/D1 measurement remains deferred because staging credentials are required. This is not recorded as runtime PASS. Implementation remains inside `apps/api/**`; `apps/web` does not access D1 directly.
