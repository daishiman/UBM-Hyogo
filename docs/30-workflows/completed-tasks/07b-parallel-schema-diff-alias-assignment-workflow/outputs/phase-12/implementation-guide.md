# Implementation Guide: schema-diff alias 確定 workflow

## Part 1: 中学生レベルの説明

なぜ必要かを先に説明します。フォームの質問名は後から変わることがあり、同じ意味の質問なのに別物として扱うと、過去の回答を正しく探せなくなります。

何をするかというと、新しい質問に正しい「あだ名」を付け、昔の回答にも同じあだ名を付け直します。

このしくみは「教科書の用語ふりがな帳」のようなものです。

- 入会フォームには「お名前」「メールアドレス」のような質問があります。
- 質問は内部で `stableKey`（あだ名）で管理しています。たとえば「お名前」は `full_name` という あだ名です。
- フォームを編集して新しい質問が増えたときは、最初は あだ名がついていません（`unknown` として記録）。
- 管理者が「この新しい質問は `full_name` という あだ名にしよう」と決めて確定するのが、この workflow の役目です。

ポイント:
1. **試算（dryRun）**: 本当に変える前に「変えたらどれくらい影響があるか」を試算できます。
2. **確定（apply）**: OK なら本当に書き換えます。同時に過去の回答にもふりがなを振り直します（back-fill）。
3. **重複チェック**: 別の質問が既に同じ あだ名を持っていたら 422 で拒否します。
4. **記録**: 誰がいつ何を確定したか、`audit_log` にちゃんと残します（dryRun は記録しません）。
5. **削除済みは飛ばす**: 退会した人の回答は back-fill 対象外です。

### 今回作ったもの

- 管理者が新しい質問に既存のあだ名を割り当てる API
- 変更前に影響件数だけを見る dryRun
- 過去回答の extra field を stableKey へ直す back-fill
- 誰が確定したかを残す audit 記録

## Part 2: 開発者レベル

### APIシグネチャ

```
POST /admin/schema/aliases?dryRun=<true|false>
Authorization: Bearer <session-jwt with isAdmin=true>
Content-Type: application/json

Body:
{
  "diffId": "<optional, schema_diff_queue.diff_id>",
  "questionId": "<schema_questions.question_id>",
  "stableKey": "<must match /^[a-zA-Z][a-zA-Z0-9_]*$/>"
}
```

### 使用例

```bash
curl -sS -X POST "$API_BASE/admin/schema/aliases?dryRun=true" \
  -H "Authorization: Bearer $ADMIN_SESSION_JWT" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"q-name","stableKey":"full_name","diffId":"diff-1"}'
```

### TypeScript シグネチャ

```ts
// apps/api/src/workflows/schemaAliasAssign.ts
export interface SchemaAliasAssignInput {
  questionId: string;
  stableKey: string;
  diffId?: string;
  dryRun: boolean;
  actorId: AdminId | null;
  actorEmail: AdminEmail | null;
}

export type SchemaAliasAssignResult =
  | {
      mode: "dryRun";
      questionId: string;
      currentStableKey: string | null;
      proposedStableKey: string;
      affectedResponseFields: number;
      currentStableKeyCount: number;
      conflictExists: boolean;
    }
  | {
      mode: "apply";
      questionId: string;
      oldStableKey: string | null;
      newStableKey: string;
      affectedResponseFields: number;
      queueStatus: "resolved";
    };

export class SchemaAliasAssignFailure extends Error {
  detail:
    | { kind: "question_not_found" }
    | { kind: "diff_not_found" }
    | { kind: "diff_question_mismatch" }
    | { kind: "collision"; existingQuestionIds: string[] };
}
```

### エラーハンドリング

| failure.kind | http |
|--------------|------|
| zod (regex / required) | 400 |
| 認証なし | 401 |
| 非 admin | 403 |
| question_not_found / diff_not_found | 404 |
| diff_question_mismatch | 409 |
| collision | 422 |

### 主要ファイル

| ファイル | 役割 |
|---------|------|
| `apps/api/src/workflows/schemaAliasAssign.ts` | apply / dryRun / back-fill / audit を担当 |
| `apps/api/src/services/aliasRecommendation.ts` | Levenshtein + section/index スコア |
| `apps/api/src/routes/admin/schema.ts` | endpoint handler (拡張済) |

### 実 DB と仕様書の差分吸収

| 仕様書 | 実 DB | 採用 |
|--------|-------|------|
| `response_fields.questionId` | カラムなし | extra field の `stable_key='__extra__:<questionId>'` 形式を識別子に使用 |
| `response_fields.is_deleted` | カラムなし | `deleted_members` を `member_identities` 経由で join し response_id を NOT IN |
| `schema_diff_queue.status: queued/resolved` | `queued/resolved` | 同義として扱う |

### back-fill 処理

- batch=100 (`BACKFILL_BATCH_SIZE`)
- CPU budget=25s (`BACKFILL_CPU_BUDGET_MS`、Workers 30s 制限の安全マージン)
- 既に新 stable_key が同 response_id に存在する場合は extra 行を DELETE（衝突回避）
- idempotent: 中断後の再 apply で続行可能（WHERE で extra 形式のみ対象とするため）

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run \
  src/workflows/schemaAliasAssign.test.ts \
  src/services/aliasRecommendation.test.ts \
  src/routes/admin/schema.test.ts
```

### エッジケース

- `stableKey === '__extra__:<questionId>'` の場合: back-fill は no-op（自己更新）
- 既に同 stableKey: idempotent return、audit 追記なし
- diff_id 指定なし apply: 単独 stableKey 確定として動作（diff resolve はスキップ）

### 設定項目と定数一覧

| 名前 | デフォルト | 用途 |
|------|----------|------|
| `BACKFILL_BATCH_SIZE` | 100 | 1 batch あたり SELECT/UPDATE 件数 |
| `BACKFILL_CPU_BUDGET_MS` | 25000 | CPU 消費がこれを超えたら RetryableError |

将来 Cloudflare Workers Vars 経由の動的化も可（現状は constant export）。

### テスト構成

| テスト | 対象 |
| --- | --- |
| `schemaAliasAssign.test.ts` | dryRun no-side-effect / apply / collision / deleted member skip / idempotent re-apply |
| `aliasRecommendation.test.ts` | Levenshtein + section/index score / tie-break / 空 label |
| `schema.test.ts` | admin gate / zod 400 / 404 / 409 / 422 mapping |
