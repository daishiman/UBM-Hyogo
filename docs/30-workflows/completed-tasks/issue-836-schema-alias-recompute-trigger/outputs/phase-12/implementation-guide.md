# Phase 12 output: implementation guide

[実装区分: 実装仕様書]

## Part 1: 中学生レベルの説明

### 背景（なぜ必要か）

管理画面には、Google Form から来た新しい質問を「正式な名前（stableKey）」にひもづける「resolve（解決）」という操作があります。Issue #778 で、間違って resolve したときに取り消せる「rollback（取り消し）」ボタンができました。

ところが、ここに**やり残し**がありました。rollback ボタンは「alias の登録」を取り消しますが、その alias を使って書き換えた**過去の回答データ（台帳の見出し）はそのまま古い名前で残ってしまう**のです。

たとえば、ノートに「3 ページ目のメモを A という見出しにする」と決めて、3 ページ目に「A」と書き込んだあと、「やっぱり A はやめる」とやり直しボタンを押しても、3 ページ目に書いた「A」の文字は消えずに残ってしまう、という状態です。見出しが古いままだと、あとで「A の人数を数えよう」としたときに、本当は取り消したはずのデータまで数えてしまい、集計が汚れます。

### 今回作ったもの（何をするか）

「やり直しボタン（rollback）を押したのに、台帳の見出しが古いまま残っている」状態を、管理者がボタン 1 つで直せるようにします。やることは大きく 3 つです。

1. **「再集計（recompute）」ボタンをつくる**: rollback したあとの画面に「再集計実行」ボタンを出して、押すと古い見出し（`alias.stableKey`）を元の見出し（`__extra__:{質問ID}`）に戻します。これを「reverse-backfill（逆向きの書き戻し）」とよびます。resolve のときに付けた見出しを、逆向きにはがす作業です。
2. **何回押しても結果が同じになるようにする**: 同じボタンを 2 回押しても、すでに直したものはもう一度直さないので、データが二重に変わりません。これを「冪等（べきとう）」とよびます。台帳ごとに「この作業はもう終わった」という記録（job）を残して管理します。
3. **やり直した事実を記録に残す**: 再集計を実行したことを `audit_log` に残し、「いつ・誰が・どの alias を・何件・再集計したか」を後から追えるようにします。

### このタスクで何が変わる／変わらないか

- 変わる: rollback したあと、管理者が画面のボタンで古い見出しを自分で元に戻せるようになる。データベースに直接 SQL を打つ運用がなくなる。集計が汚れなくなる。
- 変わらない: resolve そのものの動き、rollback そのものの動き、他のテーブル。再集計は rollback とは別のボタンで、自動では走らず管理者が押したときだけ動きます。

### あえて今やらないこと（次の followup へまわすもの）

- 一度に複数の alias をまとめて再集計する機能（bulk recompute, followup-006）
- 再集計が終わったら Slack やメールで知らせる機能（followup-007）
- 件数がとても多くて 1 回で終わらないときに、裏側で少しずつ処理する仕組み（Queue fan-out, 将来候補）

これらを今いっしょに入れると、本体（再集計の基本機能）が完成しないリスクがあるので、別 followup として分けます。

## Part 2: 技術者向け実装ガイド

### 要約

rollback で取り消された alias の `response_fields` を、admin 明示トリガーで `alias.stableKey` → `__extra__:{aliasQuestionId}` へ idempotent に reverse-backfill し、実行を `audit_log` + job status で追跡する。reverse-backfill は `schemaAliasAssign.ts:192-277` の `backfillResponseFields()` の対称（逆）操作として実装する。本ブランチでは仕様書（Phase 1-13）が確定済みで、ローカル実装・staging migration apply・Playwright visual baseline・Phase 13 操作は user-gated として残る。

設計正本: `outputs/phase-02/{api-contract,d1-schema-migration,recompute-algorithm,ui-state-machine}.md`。

### 前提

- Node 24.15.0 / pnpm 10.33.2（`mise exec --` 経由）
- 親タスク `issue-778-schema-alias-rollback-undo` の rollback / soft-delete / `version` 列実装が前提（migration 0019 適用済み）

### 型定義（TypeScript）

```ts
// apps/api/src/workflows/schemaAliasRecompute.ts
export type SchemaAliasRecomputeFailureKind =
  | "not_found"
  | "not_rolled_back"
  | "batch_failed";

export class SchemaAliasRecomputeFailure extends Error {
  readonly kind: SchemaAliasRecomputeFailureKind;
  constructor(kind: SchemaAliasRecomputeFailureKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "SchemaAliasRecomputeFailure";
  }
}

export interface RecomputeResult {
  jobId: string;
  aliasId: string;
  status: "completed" | "running"; // 同期処理。CPU budget 内完了で completed、継続中は running
  affectedCount: number;            // job 作成時に検出した recompute 対象件数
  processedCount: number;           // processed response_id 件数（UPDATE + collision DELETE の合算）
  updatedCount: number;             // stableKey -> __extra__ に UPDATE した件数
  deletedCollisionCount: number;    // __extra__ 既存衝突で stableKey 行を DELETE した件数
  recomputeAuditId: string;         // 初回 schema_alias.recompute audit_id（completed 冪等返却でも同じ id）
  relatedRollbackAuditId: string | null; // 元 rollback の audit_id
}

export interface RecomputeStatusResult {
  jobId: string;
  aliasId: string;
  status: "pending" | "running" | "completed" | "failed";
  affectedCount: number;
  processedCount: number;
  updatedCount: number;
  deletedCollisionCount: number;
  lastError: string | null;
  updatedAt: string;
}

export interface ReverseBackfillResult {
  status: "completed" | "exhausted";
  updated: number;
  cursor: string | null;
  retryable: boolean;
  code?: string;
}
```

### APIシグネチャ

```
POST /admin/schema/aliases/:aliasId/recompute
  body: { reason?: string(<=500) }  // triggerKey は server-side derivation
  200: RecomputeResult（成功 / 既存 completed の冪等返却）
  400: bad_request（aliasId 欠如 / body parse 失敗）
  404: not_found（alias が soft-deleted 含め不在）
  409: not_rolled_back（alias がまだ rollback されていない = deleted_at IS NULL）
  500: batch_failed（D1 batch / UPDATE 失敗。job は failed に記録）

GET /admin/schema/aliases/:aliasId/recompute
  200: RecomputeStatusResult | null（直近 job status。job 不在時は null）
```

web helper（`apps/web/src/lib/admin/api.ts`、`@/features/admin/hooks/useAdminMutation` 経由）:

```ts
export async function recomputeSchemaAlias(input: RecomputeSchemaAliasInput): Promise<RecomputeSchemaAliasResult>;
export async function getSchemaAliasRecomputeStatus(aliasId: string): Promise<RecomputeStatusResult | null>;
export class RecomputeApiError extends Error { /* RollbackApiError と同パターン */ }
```

### 使用例

```ts
const result = await recomputeSchemaAlias({
  aliasId,
  reason: "rollback後のresponse_fields整復",
});

if (result.status === "running") {
  await recomputeSchemaAlias({ aliasId, reason: "cursorから継続" });
}
```

### reverse-backfill アルゴリズム

`backfillResponseFields()` の逆操作として対称実装する（`outputs/phase-02/recompute-algorithm.md` 正本）。

| | backfill（resolve 時 / 既存） | reverse-backfill（recompute / 新規） |
| --- | --- | --- |
| from | `__extra__:{questionId}` | `alias.stableKey` |
| to | `newStableKey`（= alias.stableKey） | `__extra__:{aliasQuestionId}` |
| 衝突回避 | to が既存なら from 行を DELETE | to（`__extra__`）が既存なら from（stableKey）行を DELETE |
| 単位 | chunk（`BACKFILL_BATCH_SIZE`）+ CPU budget | 同一定数を再利用 |
| no-op 判定 | `newStableKey === extraKey` | `extraKey === stableKey` |

メインフロー（`schemaAliasRecompute()`）:

1. `getById(aliasId, { includeDeleted: true })` → 不在は `not_found`、`deletedAt == null` は `not_rolled_back`
2. `findRollbackAuditId()` で `action='schema_alias.rollback'` の最新 audit_id を取得
3. `triggerKey = relatedRollbackAuditId ?? ` + "`${alias.id}:${alias.version}`" + "（client からは受け取らない）"
4. `createOrGetJob({ aliasId, stableKey, questionId, triggerKey, createdBy })` — 既存 `completed` は `recomputeAuditId` を含めてそのまま return（reverse-backfill / audit を再実行しない）
5. `claimJob()` で `locked_at` / `run_token` lease を conditional update し、同一 running job の並行 runner を防ぐ
6. `countReverseTargets(stableKey)` で affected を初回確定し、再実行では減らさない
7. `reverseBackfillResponseFields(aliasQuestionId, stableKey, cursor)` を chunk + CPU budget で実行（DELETE 衝突回避 → UPDATE）。`cursor` は last processed `response_id`
8. 初回のみ `audit_log` に `schema_alias.recompute` を INSERT し、job `recompute_audit_id` に保存する

### エラーハンドリング

endpoint は `SchemaAliasRecomputeFailure.kind` を HTTP error に写像する。`not_found` は 404、`not_rolled_back` は 409、D1 batch / UPDATE 失敗は job を `failed` にしてから 500 `batch_failed` を返す。web helper は `RollbackApiError` と同じ形で `RecomputeApiError(status, code, message)` に変換する。

### エッジケース

| ケース | 挙動 |
| --- | --- |
| alias 不在 | `SchemaAliasRecomputeFailure('not_found')` → 404 |
| 未 rollback alias | `not_rolled_back` → 409（rollback 後のみ recompute 可） |
| D1 batch 失敗 | job を `failed` + `last_error` 記録 → `batch_failed` → 500 |
| 同一 triggerKey 二重実行 | server-derived triggerKey + job UNIQUE + SQL レベル冪等で `response_fields` 二重変動なし（AC-2） |
| CPU budget exhausted | job を `running` のまま last processed `response_id` cursor 保存。再 POST で lease 取得後に継続し、全件で `completed`（AC-8） |
| `extraKey === stableKey` | no-op（updated 0 で `completed`） |

### 設定項目と定数一覧

| 定数 | 出所 | 用途 |
| --- | --- | --- |
| `BACKFILL_BATCH_SIZE` | `schemaAliasAssign.ts`（export 再利用） | chunk あたりの処理件数。export されていなければ Phase 05 で export 化 |
| `BACKFILL_CPU_BUDGET_MS` | `schemaAliasAssign.ts`（export 再利用） | CPU budget。超過で `exhausted` → `running` 継続 |

### テスト構成

| ファイル | 目的 |
| --- | --- |
| `apps/api/src/workflows/schemaAliasRecompute.spec.ts` | reverse-backfill / idempotency / collision / exhausted continuation |
| `apps/api/src/routes/admin/__tests__/schema.recompute.spec.ts` | POST/GET endpoint / 400/404/409/500 / audit insert |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | web helper request body / `RecomputeApiError` / `null` status |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | button wiring / submitting disable / running continue / failed display |

### migration 0020

`apps/api/migrations/0020_schema_alias_recompute_jobs.sql`（採番根拠: 最新 `0019_schema_alias_soft_delete.sql` の次）。

```sql
CREATE TABLE IF NOT EXISTS schema_alias_recompute_jobs (
  job_id          TEXT PRIMARY KEY,
  alias_id        TEXT NOT NULL,
  stable_key      TEXT NOT NULL,
  question_id     TEXT NOT NULL,
  trigger_key     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  affected_count  INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  updated_count   INTEGER NOT NULL DEFAULT 0,
  deleted_collision_count INTEGER NOT NULL DEFAULT 0,
  cursor          TEXT,
  recompute_audit_id TEXT,
  locked_at       TEXT,
  locked_by       TEXT,
  run_token       TEXT,
  last_error      TEXT,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_trigger_unique
  ON schema_alias_recompute_jobs (alias_id, stable_key, trigger_key);  -- idempotency
CREATE INDEX IF NOT EXISTS idx_schema_alias_recompute_jobs_alias
  ON schema_alias_recompute_jobs (alias_id, created_at);
```

既存テーブル（`response_fields` / `schema_aliases` / `audit_log`）への DDL 変更はなし。

### 実装ステップ

| Step | 内容 | 主成果物 |
| --- | --- | --- |
| 1 | migration 0020 作成 + local apply（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --local`） | `0020_schema_alias_recompute_jobs.sql` |
| 2 | job repository（`createOrGetJob` / `updateJobStatus` / `getLatestJobByAlias`） | `repository/schemaAliasRecomputeJobs.ts` |
| 3 | recompute workflow（reverse-backfill + idempotency + audit） | `workflows/schemaAliasRecompute.ts` |
| 4 | endpoint 2 本追加（POST / GET、`schema.ts` の rollback 376-434 の隣） | `routes/admin/schema.ts` |
| 5 | web helper（`recomputeSchemaAlias` / `getSchemaAliasRecomputeStatus` / `RecomputeApiError`） | `lib/admin/api.ts` |
| 6 | SchemaDiffPanel の `data-role="recompute-warning"`（248-250）を実行ボタン + status バッジへ置換。`useAdminMutation` 経由 | `components/admin/SchemaDiffPanel.tsx` |
| 7 | test 追加（endpoint / workflow / web helper / component） | `*.spec.{ts,tsx}` 4 ファイル |
| 8 | 正本 spec 追記（`11-admin-management.md` / `01-api-schema.md`） | spec 2 本 |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

### 既知制限 / user-gated 操作

以下は user 明示承認後のみ:

- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging`
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- `git push origin <branch>` / `gh pr create --base dev`
- Playwright visual baseline capture/snapshot update

## 視覚証跡

VISUAL タスク（admin `/admin/schema` SchemaDiffPanel に rollback 後 recompute 実行ボタン + status バッジを追加）。Phase 11 で以下の screenshot を canonical 名で取得する。local implementation は完了済みだが、visual baseline capture は未実行のため、本 Phase 時点では screenshot は **pending**（物理未配置）。

### screenshot canonical 名

| canonical ファイル名 | 状態 | 説明 |
| --- | --- | --- |
| `schema-diff-panel-recompute-idle.png` | pending | rollback 直後・再集計未実行（「再集計実行」ボタン表示・status バッジなし or `pending`） |
| `schema-diff-panel-recompute-running.png` | pending | server job running（status バッジ `running`・「再集計を続行」ボタン表示。disable は submitting 中のみ） |
| `schema-diff-panel-recompute-completed.png` | pending | 再集計完了（status バッジ `completed`・処理件数表示） |
| `schema-diff-panel-recompute-failed.png` | pending | 再集計失敗（status バッジ `failed`・`lastError` 表示） |

配置先: `outputs/phase-11/screenshots/`（実装 + runtime close-out 時に物理生成）。

### capture metadata

| 項目 | 値 |
| --- | --- |
| taskId | issue-836-schema-alias-recompute-trigger |
| mode | VISUAL |
| target route | `/admin/schema` |
| target component | `SchemaDiffPanel`（`data-role="recompute-action"` / `data-role="recompute-status"`） |
| capture script | Phase 11 `outputs/phase-11/visual-baseline.md` 参照 |
| design token | OKLch 系既存 token のみ（HEX 直書き / `bg-[#xxx]` 禁止・`verify-design-tokens` pass。AC-10） |
| baseline 連携 | task-18 visual-full required check（RAC-3） |

> screenshot 名は本 guide / Phase 11 capture script / `phase11-capture-metadata.json` / `manual-test-result.md` の各所で同一 canonical 名（`schema-diff-panel-recompute-<state>.png`）に揃える。

## DoD

- [ ] Part 1（中学生レベル）/ Part 2（技術者レベル）/ `## 視覚証跡` を満たす
- [ ] 型定義 / API シグネチャ / reverse-backfill アルゴリズム / migration 0020 / 定数を記載
- [ ] screenshot canonical 名 + capture metadata を記載
- [ ] 設計正本（`outputs/phase-02/*.md`）と整合
