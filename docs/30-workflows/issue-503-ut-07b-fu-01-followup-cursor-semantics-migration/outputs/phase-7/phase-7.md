# Phase 7: workflow 層 shadow flag 実装（`schemaAliasBackfillBatch.ts`）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/src/workflows/schemaAliasBackfillBatch.ts` |

## 目的

`BACKFILL_CURSOR_MODE` env を読み取り、cursor mode と remaining-scan mode を runtime で切り替える分岐を実装する仕様を確定する。**API contract `backfill.status` の出力 schema は両 mode で同一**（不変条件）。本 Phase は staging A/B 比較 evidence 取得の前提となる shadow flag 実装である（起票元 §3.2 / §4 Phase 3）。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 既存編集（分岐追加） |

## env 仕様

| 値 | 挙動 |
| --- | --- |
| `cursor` | cursor mode で実行 |
| `remaining-scan` | 既存 remaining-scan mode で実行（既定） |
| 未設定 / `undefined` | `remaining-scan` にフォールバック |
| 不正値（例: `c`, `cursor-mode`, `1`） | warn log + `remaining-scan` にフォールバック |

env 読み取り箇所:

```ts
type BackfillCursorMode = "cursor" | "remaining-scan";

const resolveCursorMode = (env: { BACKFILL_CURSOR_MODE?: string }): BackfillCursorMode => {
  const raw = env.BACKFILL_CURSOR_MODE;
  if (raw === "cursor") return "cursor";
  if (raw === "remaining-scan" || raw === undefined || raw === "") return "remaining-scan";
  // 不正値: warn + fallback
  logWarn({
    code: "UBM-7302",
    context: { rawValue: raw, fallback: "remaining-scan" },
  });
  return "remaining-scan";
};
```

> ログコード `UBM-7301` / `UBM-7302` は仮値。Phase 1 の SSOT（Agent A 担当）に合わせて最終確定する。

## 関数シグネチャ変更

`runBackfillBatch` 自体のシグネチャは無変更（公開契約維持）。内部で env を読み取り mode を判定する:

```ts
export const runBackfillBatch = async (
  c: DbCtx,
  input: BackfillBatchInput,
  env?: { BACKFILL_CURSOR_MODE?: string }, // 新規: optional 第3引数
): Promise<BackfillBatchResult> => {
  const mode = resolveCursorMode(env ?? {});
  // ...
};
```

> 第3引数は optional とし、既存呼び出し側（`apps/api/src/index.ts` queue handler / scheduled handler / `apps/api/src/routes/admin/schema.ts`）は段階的に移行する。Phase 13 で全呼び出し点に env を伝播させる。

## cursor mode の処理ループ

```
1) const cursor = (await readDiff(c, diffId)).lastProcessedId ?? null
2) const rows = await getNextBatchByCursor(c, questionId, cursor, maxBatchRows)
3) if (rows.length === 0):
     - countRemaining が 0 なら completed
     - そうでなければ exhausted（race / fixture 矛盾）
4) for row of rows:
     - 個別 UPDATE response_fields.stable_key
     - 失敗時は failed_items に積む（既存ロジックと同等）
5) const nextCursor = rows[rows.length - 1].id
6) failed_items が空、または失敗 row が retry/DLQ 状態に明示記録済みであることを確認
7) updateBatchCursor(c, diffId, safeCursor)
8) recordBatchProgress(c, diffId, { status, retryCount, ... })
```

remaining-scan mode の処理ループは既存実装を変更しない。

## 構造化ログ仕様

| code | 発火箇所 | context |
| --- | --- | --- |
| `UBM-7301` | batch 開始時（両 mode） | `{ mode, diffId, questionId, cursor, batchSize }` |
| `UBM-7302` | env 不正値 fallback 時 | `{ rawValue, fallback }` |
| `UBM-7303` | cursor mode で `getNextBatchByCursor` 0 行 + remaining > 0 | `{ diffId, cursor, remaining }` |

> code は Phase 1 SSOT 確定後に置換する。

## API contract 不変保証

`BackfillBatchResult` の全フィールド（`status` / `processed` / `remaining` / `failedItems` / `retryCount` / `lastProcessedAt` / `needsReEnqueue`）は両 mode で同一 schema を返す。`backfill.status` の admin route 公開出力（`apps/api/src/routes/admin/schema.ts`）にも cursor mode 由来のフィールドは追加しない（起票元 §2.3 含まないスコープ）。

## 入出力

| 入力 | 値 |
| --- | --- |
| `BackfillBatchInput` | 既存と同一 |
| `env.BACKFILL_CURSOR_MODE` | `cursor` / `remaining-scan` / 未設定 / 不正値 |
| 出力 | `BackfillBatchResult`（公開契約不変） |

## エラーハンドリング

| ケース | 挙動 |
| --- | --- |
| cursor mode で `updateBatchCursor` 失敗 | transaction rollback + retry_count++ |
| cursor mode で row 個別 UPDATE 失敗 | failed_items_json に積み、cursor は failed row より先に進めない。未記録 skip 禁止 |
| env 不正値 | warn log + remaining-scan fallback（処理続行） |

## テスト方針（Phase 4 と整合）

- `describe('BACKFILL_CURSOR_MODE=cursor', ...)`: cursor mode 単独 happy path
- `describe('A/B parity', ...)`: 同一 fixture を両 mode で実行し戻り値 deep equal
- `describe('invalid env value', ...)`: `BACKFILL_CURSOR_MODE=garbage` で warn log + remaining-scan fallback

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch \
  | tee outputs/phase-7/workflow-test.log
```

## DoD（完了定義）

- [ ] `resolveCursorMode` の env 値マッピング表が確定
- [ ] cursor mode 処理ループの 7 ステップが確定
- [ ] 構造化ログ 3 code の context フィールドが確定
- [ ] 公開契約 `BackfillBatchResult` の不変保証が明記
- [ ] 既存呼び出し側への env 伝播が Phase 13 で行われる旨明記

## 次 Phase の前提条件

Phase 8 で runbook / aiworkflow-requirements に cursor mode 切替手順を記述する。
