# D1 補償処理パターン（compensating transaction template）（Phase 2 成果物）

## 1. 設計方針

- **前提**: D1 はネスト TX 不可、`db.batch()` の部分失敗に対する自動ロールバックなし
- **方式**: 「事前状態スナップショット → 主処理 → 失敗時に逆操作（compensation）」を直列で記述する
- **冪等性キー**: `runId` 等の idempotency key を補償処理の前提条件にし、再実行で副作用が増殖しないように設計
- **二重失敗**: compensation 自体が失敗した場合は `UBM-5101` を throw し、`cause` チェーンで原因を保持。dead letter テーブルに記録
- **配置**: `packages/shared/src/db/transaction.ts` にテンプレート関数 `runWithCompensation` を提供

## 2. テンプレート関数

```ts
// packages/shared/src/db/transaction.ts
import { ApiError, type UbmErrorCode } from "../errors";

export interface CompensationStep<TResult = unknown> {
  /** ステップ名（ログ・dead letter 用） */
  name: string;
  /** 主処理 */
  execute: () => Promise<TResult>;
  /** 補償（逆操作）。execute が成功した場合のみ呼ばれる。idempotent でなければならない */
  compensate: (result: TResult) => Promise<void>;
}

export interface CompensationFailure {
  /** 失敗したステップ名 */
  failedStep: string;
  /** 補償に失敗したステップ名のリスト（順次失敗を許容） */
  compensationFailures: Array<{ step: string; reason: unknown }>;
  /** 元の失敗 */
  originalCause: unknown;
}

export interface RunWithCompensationOptions {
  /** 二重失敗時の ApiError コード（既定 UBM-5101） */
  compensationFailureCode?: UbmErrorCode;
  /** dead letter 記録フック（任意。未指定時は呼ばれない） */
  recordDeadLetter?: (failure: CompensationFailure) => Promise<void>;
}

export async function runWithCompensation<T>(
  steps: CompensationStep[],
  options?: RunWithCompensationOptions,
): Promise<T[]>;
```

## 3. 動作仕様

1. `steps` を順次 `execute()`
2. 全ステップ成功 → `[result1, result2, ...]` を返す（compensation は呼ばない）
3. 中間ステップ `i` が失敗 → 成功済みステップ `0..i-1` の `compensate(result)` を **逆順** で呼ぶ
4. compensation 自体が失敗した場合は記録のみ（throw しない）し次の compensation を続行
5. 全 compensation 完了後、`ApiError({ code: "UBM-5101", log: { cause: failure } })` を throw（少なくとも 1 件 compensation が失敗していた場合）
6. compensation すべて成功した場合は元の失敗を `ApiError({ code: "UBM-5001", log: { cause: originalCause } })` にラップして throw
7. `recordDeadLetter` が指定されていれば、5 / 6 の throw 前に必ず呼ぶ（実装側で best-effort）

## 4. 利用例（UT-09 で利用される想定）

```ts
import { runWithCompensation } from "@ubm-hyogo/shared";

await runWithCompensation([
  {
    name: "snapshot-row",
    execute: () => env.DB.prepare("SELECT * FROM member_responses WHERE response_id = ?")
      .bind(responseId).first(),
    compensate: async (snapshot) => {
      if (!snapshot) {
        await env.DB.prepare("DELETE FROM member_responses WHERE response_id = ?")
          .bind(responseId).run();
      } else {
        // snapshot を bind し直して INSERT or UPDATE で復元（idempotent）
        await env.DB.prepare(/* restore SQL */).bind(/* ... */).run();
      }
    },
  },
  {
    name: "upsert-row",
    execute: () => upsertRow(env.DB, responseId, row),
    compensate: async () => { /* upsert は冪等なので no-op */ },
  },
  {
    name: "write-audit",
    execute: () => writeAuditLog(env.DB, runId, trigger, startedAt, partial),
    compensate: async () => {
      await env.DB.prepare("DELETE FROM sync_audit WHERE run_id = ?")
        .bind(runId).run();
    },
  },
], {
  recordDeadLetter: async (failure) => {
    await env.DB.prepare(
      `INSERT INTO sync_audit (run_id, trigger_type, started_at, finished_at, status, error_reason)
       VALUES (?, ?, ?, datetime('now'), 'failure', ?)`
    ).bind(runId, trigger, startedAt, JSON.stringify({
      failedStep: failure.failedStep,
      cause: String(failure.originalCause),
    })).run();
  },
});
```

## 5. 補償処理失敗の例（具体）

```
ステップ A: 成功
ステップ B: 成功
ステップ C: 失敗（D1 接続エラー）

→ B.compensate() 実行 → 失敗（再度 D1 接続エラー）
→ A.compensate() 実行 → 成功
→ recordDeadLetter({ failedStep: "C", compensationFailures: [{ step: "B", reason: ... }], originalCause: ... })
→ throw ApiError({ code: UBM-5101, log: { cause: failure } })
```

## 6. dead letter テーブル設計（最小）

既存 `sync_audit` テーブルを兼用（UT-03 / UT-09 の既存設計）。専用 DLQ テーブルが必要な場合は将来 UT-07 で追加検討。

```sql
-- 既存 sync_audit にカラム追加が必要なら別タスク（migration）として分離
-- 本タスクでは error_reason に JSON を記録するだけで対応
```

## 7. 冪等性キー要件

`runWithCompensation` を利用するすべての場面で、以下のいずれかの方法で冪等性を確保する:

| 方法 | 適用先 |
| --- | --- |
| 主キー UPSERT (`ON CONFLICT DO UPDATE`) | `member_responses`（既存実装） |
| 一意制約 + INSERT 失敗時の SKIP | `sync_audit`（`run_id` UNIQUE） |
| ステップ単位の idempotency token | 任意（ステップ実装側で responsibility）|

## 8. ロールバック範囲の境界（compensating vs DLQ）

| シナリオ | 対応 |
| --- | --- |
| 単一行の UPSERT 失敗 | 個別 compensation 不要（DB 状態は変更されないため）|
| 複数行の連続 UPSERT 部分失敗 | 各行を独立ステップ化し、失敗以降は compensation でスキップ |
| audit log と業務データの整合性破綻 | `runWithCompensation` でセット化、片方失敗で両方ロールバック |
| 補償処理自体の失敗（二重失敗） | `recordDeadLetter` + UBM-5101 throw、運用者通知（UT-07 で実装）|

## 9. 不変条件

| # | 不変条件 |
| --- | --- |
| INV-D1 | `compensate` 関数は idempotent でなければならない |
| INV-D2 | compensation は「成功済みステップのみ」を「逆順」で呼ぶ |
| INV-D3 | compensation 失敗は記録のみ（throw しない）→ 次の compensation 続行 |
| INV-D4 | 二重失敗時は `UBM-5101` で正規化、`cause` チェーンで原因保持 |
| INV-D5 | `recordDeadLetter` フックは throw しても呼び出し元の動作に影響しない（best-effort・try/catch で吸収）|
