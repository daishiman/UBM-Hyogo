# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 8 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 1-7（要件 / 設計 / レビュー / テスト / 実装 / 検証）完了 |

## 目的

landed 実装（PR #1064 / commit `745c95115`）のリファクタリング状態を正本記述する。
Task A の web UI 導線は、重複排除・単一責任原則（SRP）・契約ドリフト防止の観点で
既にリファクタ済みである。本 Phase は新規リファクタを行わず、**「リファクタ完了状態」を構造的選択として固定**する。

## 実行タスク

1. dry-run / apply を 1 hook + `endpointOverride` に集約した構造を記述する。
2. `resultRows` helper による行生成の重複排除を記述する。
3. `canApply` による apply ガードの責務集約を記述する。
4. schema / 型 / path 定数の co-location（SRP）を記述する。
5. web schema ↔ endpoint `BackfillResult` の IPC 契約ドリフト相当チェックを記述する。

## リファクタ完了状態（構造的選択の正本）

### RF-1: dry-run / apply の 1 hook 集約

`useAdminMutation` を 1 インスタンスだけ生成し、`trigger(payload, endpointOverride)` 第2引数で
`?dryRun=true|false` を切替える。dry-run / apply ごとに hook を分けない。

```ts
const mutation = useAdminMutation<unknown>(BACKFILL_PUBLISH_STATE_PATH, "POST", {
  refreshOnSuccess: false,
  successMessage: () => "",
});
const raw = await mutation.trigger({}, `${BACKFILL_PUBLISH_STATE_PATH}?dryRun=${String(dryRun)}`);
```

| 観点 | 効果 |
|------|------|
| 重複排除 | fetch / loading / error の state machine を 2 系統持たない |
| 二重起動防止 | `isSubmittingRef`（`useAdminMutation.ts:180-183`）が dry-run/apply 横断で 1 本化される |
| SRP | パネルは「モード切替 + 結果描画」のみに責務を限定し、HTTP 層は hook に委譲 |

### RF-2: `resultRows` helper による行生成の重複排除

結果グリッドの 7 行（`scanned` / `candidates` / `applied` / `skipped.*` × 4）は
`resultRows(result)` が単一の `readonly` タプル配列を返し、JSX は `.map` で描画する。
行ラベルと値の対応を 1 箇所に集約し、JSX へのベタ書き重複を排除している。

```ts
function resultRows(result: BackfillResult) {
  return [
    ["scanned", result.scanned],
    ["candidates", result.candidates],
    ["applied", result.applied],
    ["skipped.alreadyPublic", result.skipped.alreadyPublic],
    ["skipped.adminExplicit", result.skipped.adminExplicit],
    ["skipped.consentNotMet", result.skipped.consentNotMet],
    ["skipped.deleted", result.skipped.deleted],
  ] as const;
}
```

### RF-3: `canApply` による apply ガードの責務集約

apply 可否判定（dry-run 先行 + dryRun フラグ + 候補 > 0）を 1 つの派生値に集約。
ボタンの `disabled` とテスト（TC-A2b）の双方が同一述語を参照する。

```ts
const canApply =
  lastResult !== null && mode === "dryRun" && lastResult.dryRun && lastResult.candidates > 0;
```

### RF-4: schema / 型 / path 定数の co-location（SRP）

| 成果物 | 配置 | 配置理由 |
|--------|------|----------|
| `BackfillResultSchema` / `BackfillResult` / `BACKFILL_PUBLISH_STATE_PATH` | `apps/web/src/features/admin/diagnostics/backfill.ts` | diagnostics 既存 `types.ts` / `api.ts` / `manual-sync.ts` と同階層へ co-locate |
| `BackfillPublishStatePanel.client.tsx` | `apps/web/src/features/admin/components/_sync/` | sync 系パネルを `_sync/` サブディレクトリへ集約（`_members/` `_meetings/` と同列） |
| パネル単体テスト | `_sync/__tests__/BackfillPublishStatePanel.spec.tsx` | 実装と co-locate |
| schema テスト | `diagnostics/__tests__/sync-schemas.spec.ts` | 既存 schema テストに co-locate（新規 `backfill.spec.ts` を生やさない） |

> schema 専用の新規 spec ファイルを作らず、既存 `sync-schemas.spec.ts` に TC-B1..B4 を追記。
> ファイル数増加を抑えつつ「sync 系 schema は 1 spec」という凝集を維持。

## IPC 契約ドリフト相当チェック（web schema ↔ endpoint BackfillResult）

web は `apps/api` を直接 import しない（不変条件 #5）ため、`backfill.ts` で `BackfillResult` を再宣言する。
これは IPC bridge における型の二重定義に相当し、両者の drift を防ぐ必要がある。

| フィールド | endpoint（`sync-backfill-publish-state.ts:31-43`） | web（`backfill.ts`） | 一致 |
|-----------|---------------------------------------------------|---------------------|------|
| `dryRun` | `boolean` | `z.boolean()` | ✓ |
| `policy` | `"auto-publish-on-consent"` | `z.literal("auto-publish-on-consent")` | ✓ |
| `scanned` / `candidates` / `applied` | `number >=0` | `z.number().int().nonnegative()` | ✓ |
| `skipped.alreadyPublic` | `number >=0` | `z.number().int().nonnegative()` | ✓ |
| `skipped.adminExplicit` | `number >=0` | `z.number().int().nonnegative()` | ✓ |
| `skipped.consentNotMet` | `number >=0` | `z.number().int().nonnegative()` | ✓ |
| `skipped.deleted` | `number >=0` | `z.number().int().nonnegative()` | ✓ |

- `.strict()` を object / skipped 双方に付与し、endpoint が未知フィールドを増やした場合に `safeParse` が落ちて検知できる（drift の fail-closed 検出）。
- ランタイムでは `BackfillResultSchema.safeParse(raw)` が drift を捕捉し `parseError` へ閉じる（TC-A6 / TC-B1..B4 が担保）。

## 参照資料

| 参照 | パス |
|------|------|
| 依存 Phase 1 成果物 | `./phase-1.md` |
| 設計 | `./phase-2.md`（§2 契約 / §3 component） |
| 依存 Phase 5 成果物 | `./phase-5.md` |
| 依存 Phase 6 成果物 | `./phase-6.md` |
| 依存 Phase 7 成果物 | `./phase-7.md` |
| 実装本体 | `apps/web/src/features/admin/components/_sync/BackfillPublishStatePanel.client.tsx` |
| schema | `apps/web/src/features/admin/diagnostics/backfill.ts` |
| endpoint 契約 | `apps/api/src/routes/admin/sync-backfill-publish-state.ts:31-43` |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` |

## 実行手順

1. `backfill.ts` の schema / 型 / path 定数が単一 module に co-locate されていることを確認する。
2. panel の `resultRows` / `canApply` / 1 hook 集約が RF-1..RF-3 の形であることを確認する。
3. endpoint `BackfillResult` と web schema のフィールド対応表（上表）で drift 0 を確認する。
4. `_sync/` への集約と schema テストの co-location（RF-4）を確認する。

## 統合テスト連携

- リファクタ後も 3 層整合（endpoint D1 spec / web schema spec / panel spec）が維持される。
- 契約 drift は `sync-schemas.spec.ts`（TC-B1..B4）+ panel `safeParse`（TC-A6）で 2 重に検出。

## 多角的チェック観点（AIが判断）

- 1 hook 集約により dry-run/apply のどちらが pending かを `mode` で区別できているか（`loading` 条件 `mode !== "apply"` / `mode === "apply"`）。
- `.strict()` 二重付与で endpoint のフィールド追加が silent に通らないか。
- `resultRows` の `as const` タプルが型安全（`label` キーで `key` 一意）を保証しているか。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| RF-1 | dry-run/apply の 1 hook + endpointOverride 集約 | 完了（landed） |
| RF-2 | resultRows helper による行生成重複排除 | 完了（landed） |
| RF-3 | canApply による apply ガード責務集約 | 完了（landed） |
| RF-4 | schema/型/path の diagnostics co-location | 完了（landed） |
| RF-5 | IPC 契約ドリフトチェック（web↔endpoint） | 完了（drift 0） |

## 成果物

- 本リファクタリング正本ファイル（構造的選択 RF-1..RF-5）。

## 完了条件

- [x] dry-run/apply を 1 hook + endpointOverride に集約した状態を記述。
- [x] `resultRows` helper による行生成重複排除を記述。
- [x] `canApply` による apply ガードの責務集約を記述。
- [x] schema/型/path 定数の diagnostics co-location（SRP）を記述。
- [x] web schema ↔ endpoint BackfillResult の契約ドリフト 0 を表で確認。
- [x] リファクタによる apps/api 差分 0（web のみ）を維持。

## タスク100%実行確認【必須】

- [x] 重複排除・SRP・契約ドリフトの 3 観点を全て記述。
- [x] 新規リファクタを行わず landed 実装の正本記述に徹した。

## 次Phase

Phase 9（品質保証）。
