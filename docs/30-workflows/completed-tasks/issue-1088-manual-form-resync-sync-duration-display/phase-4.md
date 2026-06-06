**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 4 — テスト作成（TDD RED）

## 目的

issue #1088「再取込結果テーブルに取込所要時間 `durationMs` 表示行を追加」の実装に先立ち、backend / schema / UI / contract の 4 レイヤに失敗するテスト（RED）を先に作成する。`durationMs` は backend にも frontend にも **未実装** であるため、ここで追加するテストは Phase 5 の GREEN 実装が入るまで必ず失敗（または型エラー）する状態を作る。

このタスクは **NON_VISUAL**（既存テーブルへのデータ行追加であり、新規 UI コンポーネント・色・レイアウトの追加を伴わない）かつ **backend + frontend 1 サイクル同時実装**（先送り禁止）である。

## 前提確認（Phase 1-3 で固定済みの事実）

| 項目 | 確定値 |
|------|--------|
| backend 型 | `apps/api/src/jobs/sync-forms-responses.ts` の `ResponseSyncResult`（99-107行） |
| backend 関数 | 同ファイル `runResponseSync(env, options)`（112行〜）。`options.now?: () => Date` 注入可能（94行）。`const now = options.now ?? (() => new Date());`（116行） |
| backend return 経路 | skipped（154-162行）/ failed（225-232行）/ succeeded（268-274行）の 3 経路 |
| backend テスト | `apps/api/src/jobs/sync-forms-responses.contract.spec.ts`（`FakeD1` fixture 使用、D1 binding 不要） |
| contract テスト | `apps/api/src/routes/admin/responses-sync.contract.spec.ts`（`runResponseSync` を vi.mock）|
| route | `apps/api/src/routes/admin/responses-sync.ts`（50-58行で result 素通し）→ **変更不要** |
| schema | `apps/web/src/features/admin/diagnostics/manual-sync.ts` の `SyncResultSchema`（3-12行・`.strict()`）/ `SyncRunResponseSchema`（16-24行）/ `SYNC_RESPONSES_PATH`（28行）|
| schema テスト | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts`（TC-S1..S7）|
| UI | `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` の `resultRows(result)`（34-42行）/ `<dl>` 描画（138-155行）|
| UI テスト | `apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx`（TC-B1..B8）|

### 命名規則の確認（Phase 1-3 整合）

- backend 型フィールドは camelCase（`processedCount` / `writeCount` / `skippedReason`）→ 新フィールドは `durationMs`。
- schema フィールドも camelCase（`processedCount` 等）。
- UI の `resultRows` は `[label, value]` の `as const` タプル配列で、label 文字列はフィールド名そのまま（`"processedCount"` 等）→ 新行 label は `"durationMs"`。

## ローカル実行・検証コマンド（CONST_005）

> monorepo の vitest はリポジトリ root から `--root=../..` でファイルパス指定する。各 app の `package.json` の `test` スクリプトと同形式で focused 実行する。Node 24 を確実に使うため `mise exec --` 経由で実行する。

### backend RED（focused）

```bash
# runResponseSync の 3 経路 durationMs テスト（FakeD1 fixture / D1 binding 不要）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/api/src/jobs/sync-forms-responses.contract.spec.ts

# contract route テスト（runResponseSync mock）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/api/src/routes/admin/responses-sync.contract.spec.ts
```

### frontend RED（focused）

```bash
# schema テスト
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts

# UI panel テスト
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
```

### 型チェック（RED 確認の補助）

```bash
mise exec -- pnpm --filter @ubm-hyogo/api build   # tsc --noEmit
mise exec -- pnpm --filter @ubm-hyogo/web exec tsc --noEmit -p tsconfig.json
```

> 上記 filter 名が解決しない場合は monorepo root で `mise exec -- pnpm --filter ./apps/api ...` のようにパス filter を使う。`pnpm -r exec vitest ...` でも可。focused 実行で SIGKILL するリスクは小さいが、全件 `pnpm test` は避け、上記ファイル指定 run のみ行う。

## TDD RED 手順

1. 先に **テストだけ** を追加する（Phase 5 の実装には手を付けない）。
2. backend テストは `ResponseSyncResult` に `durationMs` が無い状態で `result.durationMs` を参照するため、型エラー（`tsc --noEmit`）または `expect(...).toBe...` の `undefined` 比較失敗で RED になることを確認する。
3. schema テストは `SyncResultSchema` がまだ `durationMs` を持たない（`.strict()` のため `durationMs` 付き object を渡すと **unknown key として reject** される）ため、`parse` 成功を期待する TC が失敗することを確認する。
4. UI テストは `resultRows` に `durationMs` 行が無いため、`durationMs` ラベル検索が失敗することを確認する。
5. contract テストは mock result に `durationMs` を含めると型エラー（required 化後）になる、または素通し検証が失敗することを確認する。
6. RED を確認したら Phase 5 へ進む。

## 追加テストケース一覧

### A. backend — `sync-forms-responses.contract.spec.ts`

> `options.now` を **increasing mock**（呼ぶたびに +5ms 進む Date を返す）で注入し、`durationMs` が「終了時刻 - 開始時刻」の非負整数になることを検証する。注入により計時を決定論化する。

increasing mock の例（仕様。Phase 5 実装後に GREEN になる）:

```ts
function makeIncreasingNow(startMs: number, stepMs: number): () => Date {
  let cur = startMs - stepMs;
  return () => {
    cur += stepMs;
    return new Date(cur);
  };
}
```

| TC番号 | 経路 | 内容 | 期待値 |
|--------|------|------|--------|
| TC-D1 | succeeded | 正常 sync 後 `result.durationMs` が定義され非負整数 | `typeof result.durationMs === "number"` かつ `Number.isInteger` かつ `>= 0` |
| TC-D2 | succeeded | `durationMs` 計上後も既存フィールドが不変（退化 guard） | `processedCount` / `writeCount` / `cursor` / `status` / `jobId` が従来期待値のまま |
| TC-D3 | failed | client が throw する経路で `result.durationMs` が非負整数 | `status === "failed"` かつ `durationMs >= 0` かつ整数 |
| TC-D4 | skipped | lock 取得失敗（既に sync 実行中）経路で `result.durationMs` が非負整数 | `status === "skipped"` かつ `durationMs >= 0` かつ整数。`skippedReason` 不変 |
| TC-D5 | succeeded | increasing mock（step 5ms）で `now()` が複数回呼ばれても `durationMs` が「最初の startedAt から最後の now() まで」の差分として非負 | `durationMs >= 0`（mock の差分が単調増加のため 0 以上を保証）|

> **注意（仕様書ヒント）**: `now()` は実装で startedAt 用と return 用に複数回呼ばれる。固定 mock（常に同一 Date）なら `durationMs === 0`、increasing mock なら正の値になる。TC-D1/D3/D4 は **固定 mock**（同一 Date を返す）で `durationMs === 0` を許容（`>= 0` 検証）し、TC-D5 のみ increasing mock で正値を確認する。これにより「非負整数である」という AC-1 を 2 系統で担保する。
>
> 既存テストの `now` 注入有無を確認し、注入していない既存ケースは触らない（退化 guard は TC-D2 が担当）。

### B. schema — `sync-schemas.spec.ts`（manual-sync schemas describe 内）

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-S8 | `durationMs` 付き object を `SyncResultSchema` が受理する | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: 1234 }).success === true` |
| TC-S9 | `durationMs` 欠落でも受理する（optional） | `SyncResultSchema.safeParse(validSyncResult).success === true`（既存 validSyncResult は durationMs なし）|
| TC-S10 | `durationMs` 付きでも `.strict()` が未知キーを reject する（退化 guard） | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: 1, unknownKey: 1 }).success === false` |
| TC-S11 | `durationMs` が負数は reject | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: -1 }).success === false` |
| TC-S12 | `durationMs` が小数は reject（`int()`） | `SyncResultSchema.safeParse({ ...validSyncResult, durationMs: 1.5 }).success === false` |
| TC-S13 | wrapper（`SyncRunResponseSchema`）が `durationMs` 付き result を通す | `SyncRunResponseSchema.safeParse({ ok: true, result: { ...validSyncResult, durationMs: 99 } }).success === true` |

> `validSyncResult`（既存 fixture・15-21行）は `durationMs` を含まないため、TC-S9 は現状のまま `success === true` を期待でき RED にならない（既存維持の回帰 guard）。RED の主役は TC-S8（現状は `.strict()` で reject されるため失敗）。

### C. UI — `ManualFormResyncPanel.spec.tsx`

> 既存 `SUCCESS`（39-48行）に `durationMs` を含める版を局所定義し、`resultRows` に `durationMs` 行が出ることを検証する。

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-B9 | result に `durationMs` ありで `<dl>` に `durationMs` ラベルと値が出る | trigger mock が `{ ok:true, result:{ ...SUCCESS.result, durationMs: 1500 } }` を返したとき、`screen.findByText("durationMs")` 成功かつ `screen.getByText("1500")` 成功 |
| TC-B10 | result に `durationMs` 無し（undefined）で `-` fallback 表示 | 既存 `SUCCESS`（durationMs なし）で run 実行後、`durationMs` ラベルは表示されるが値は `"-"`（`screen.getByText("durationMs")` の隣接 `<dd>` が `-`）|
| TC-B11 | 既存行が退化しない（status/jobId/processedCount/writeCount/cursor + mode） | `durationMs` 行追加後も `screen.getByText("writeCount")` / `screen.getByText("run")` 等が引き続き存在 |
| TC-B12 | `onSynced` payload に `durationMs` が含まれる | trigger mock が durationMs 付き result を返したとき `onSynced` が `expect.objectContaining({ durationMs: 1500 })` で呼ばれる |

> TC-B10 の検証方法（仕様）: `durationMs` ラベルの `<dt>` 直後 `<dd>` のテキストを確認する。`resultRows` 実装が `result.durationMs ?? "-"` を返すため、undefined のとき `"-"` 文字列になる。`screen.getAllByText("-")` で cursor 等他の `-` と衝突しうるため、`dt` を起点に隣接 `dd` を取る `closest`/`nextElementSibling` か、durationMs 専用の値（例: cursor を `"cursor-1"` に保ちつつ durationMs のみ undefined）で衝突を避ける。

### D. contract — `responses-sync.contract.spec.ts`

> route は result を素通しするため、mock result に `durationMs` を含めても 200/409/500 の分岐が保たれることを検証する。`ResponseSyncResult` を required `durationMs: number` 化する方針（Phase 5 参照）に伴い、**既存の mock result 全てに `durationMs` を追加**しないと型エラーになる。これも RED の一部。

| TC番号 | 内容 | 期待値 |
|--------|------|--------|
| TC-A04 | 200 経路で `durationMs` 込み succeeded result を素通し | mock `runResponseSync` が `durationMs: 42` 込み succeeded を返す → `res.status === 200` かつ body の `result.durationMs === 42` |
| TC-A05 | 409 経路（skipped）で `durationMs` 込み result を素通し | mock が `durationMs: 7` 込み skipped → `res.status === 409` かつ `result.durationMs === 7` |
| TC-A06 | 500 経路（failed）で `durationMs` 込み result を素通し | mock が `durationMs: 13` 込み failed → `res.status === 500` かつ `result.durationMs === 13` |
| 既存 T-A-02/T-A-01/AC-5 退化 guard | 既存 mock result（37-44行・57-64行・77-83行）に `durationMs: 0` を追加し型エラーを解消 | 既存 200/409/AC-5 検証が引き続き green |

> 200/409 経路の body 内 `result.durationMs` 検証は `await res.json()` でレスポンス body を読み、`result.durationMs` を assert する。`failed` 経路（500）は元 contract spec に明示テストが無いため TC-A06 を新規追加する（route 56-57行が `failed → 500` を返すことを併せて確認できる）。

## 完了条件（Phase 4 DoD）

- [ ] backend TC-D1〜D5 をテストファイルに追加した（実装前なので型エラーまたは assertion 失敗 = RED）。
- [ ] schema TC-S8〜S13 を追加した（TC-S8 が `.strict()` で reject され RED）。
- [ ] UI TC-B9〜B12 を追加した（`durationMs` 行が存在せず RED）。
- [ ] contract TC-A04〜A06 を追加し、既存 mock result に `durationMs` を補完した。
- [ ] 上記 4 ファイルの focused vitest コマンドを実行し、**RED（失敗）を確認した**ログを残す。
- [ ] 既存 TC（TC-S1..S7 / TC-B1..B8 / T-A-00..AC-5 / 既存 backend ケース）は触っていない（退化させない）。
