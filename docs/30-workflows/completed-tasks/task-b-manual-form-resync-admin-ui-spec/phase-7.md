# Phase 7 — カバレッジ確認（変更面の coverage 可視化）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> landed 実装（commit `745c95115` / PR #1064）の変更面に対する test coverage を可視化する。
> coverage の対象は **本タスクで変更されたブロックのみ**とし、変更されていない既存ブロック・
> 共通基盤（`useAdminMutation` 本体 / `Button` / `AdminSectionCard` / 既存 proxy 経路 / `apps/api`）は
> **対象外**とする（[Feedback BEFORE-QUIT-002] / [Feedback 5]: スコープ外を coverage 目標にしない）。

---

## 1. coverage 対象範囲（変更面のみ）

| ファイル | 変更ブロック | 担当 test |
|---------|-------------|----------|
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | `parseInProgress` / `applyResponse` / `runSync` / `runBackfill` / 描画三項分岐 / 結果テーブル | `ManualFormResyncPanel.spec.tsx`（TC-B1..B8） |
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | `SyncResultSchema` / `SyncRunResponseSchema`（union + 409 refine）/ `SYNC_RESPONSES_PATH` | `sync-schemas.spec.ts`（TC-S1..S7） |
| `apps/web/app/api/admin/[...path]/route.ts` | `needsSyncAdminBearer` / `proxy` の Bearer 注入 + `sync_admin_token_missing` fail-fast 分岐 | proxy 配線（runtime 検証は user-gated・下記 §4） |
| `apps/web/src/lib/env.ts` | `SYNC_ADMIN_TOKEN`（`EnvSchema :10` optional 追加 + `AuthEnvSchema :52` pick） | env schema は既存 env テストの範疇（下記 §4） |

> **対象外（明示）**: `useAdminMutation` 本体・`FetchAuthedError`・`Button`・`AdminSectionCard`・
> 既存の他 admin proxy 経路・`apps/api/src/sync/*`（不変条件で凍結）。これらは本タスクで変更しておらず、
> coverage 目標から除外する。

---

## 2. branch カバレッジ観点（変更面の分岐網羅）

### `parseInProgress(error)`（route の 409 検知）

| branch | カバー |
|--------|--------|
| `error` が `FetchAuthedError` でない / `status !== 409` → `null` | TC-B6（汎用 Error は inProgress にしない） |
| 409 かつ safeParse 成功 かつ `result.status === "skipped"` → 詳細文言（jobId 付き） | TC-B5 |
| 409 だが parse 失敗（`catch`）→ generic「他の sync が実行中です」 | （拡充候補・現状 fixture は valid skipped を渡すため catch 枝は未踏） |

### `applyResponse(raw, nextMode)`

| branch | カバー |
|--------|--------|
| `safeParse` 失敗 → `setParseError` / `setLastResult(null)` / `setMode(null)` / 戻り `null` | TC-B7 |
| `safeParse` 成功 → `setLastResult` / `setMode` / `onSynced?.()` / 戻り result | TC-B1（run）/ TC-B2（backfill）/ TC-B8（onSynced） |

### `runBackfill`（confirm gate）

| branch | カバー |
|--------|--------|
| `confirm` false → early return（trigger 未呼出） | TC-B3 |
| `confirm` true → backfill trigger 実行 | TC-B2 |

### `needsSyncAdminBearer(path)`（proxy）

| branch | カバー手段 |
|--------|-----------|
| `path[0] !== "sync"` → false | runtime / proxy 単体テスト（user-gated・現行は配線確認） |
| `path[1]` が `schema`/`responses`/`backfill-publish-state`/`diagnostics` → true | 同上。`responses` 経路は本 UI の主経路 |
| token 未設定 → `500 sync_admin_token_missing`（fail-fast） | runtime 検証（§4・user-gated） |

> 描画三項分岐（`parseError` > `inProgress` > `error` > none）は TC-B5/B6/B7 + 正常系 TC-B1 で 4 状態を網羅。

---

## 3. coverage 計測コマンド（対象ファイル限定）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --coverage \
  apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx \
  apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

- coverage レポートのうち **§1 の変更面ファイルのみ**を確認対象とする。
  他ファイルの数値は本タスクの判定材料にしない（[Feedback 5]）。

---

## 4. coverage 対象外（runtime / user-gated）

- `route.ts` の Bearer 注入・`sync_admin_token_missing` fail-fast・`needsSyncAdminBearer` の
  `sync` 以外 path 分岐は **server runtime（proxy 経路）依存**であり、unit のモック越しでは到達しにくい。
  これらは Phase 11 の staging runtime 検証（`SYNC_ADMIN_TOKEN` 投入後の手動確認）に委ねる。
  Secrets 投入・staging deploy は **user-gated**（外部運用境界）。
- `env.ts` の `SYNC_ADMIN_TOKEN` は `getAuthEnv()` の `safeParse`（optional）で読まれ、
  未登録時 fail-closed（invariant #11）。env schema の coverage は既存 env テスト群の範疇とし、本タスクで新規追加しない。
- `parseInProgress` の `catch` 枝（409 だが body が parse 不能）は現行 fixture では未踏。
  Phase 6 の拡充候補として整理済み（本フェーズで Red を追加しない）。

---

## 完了条件

- [x] coverage 対象を変更面ファイル（`ManualFormResyncPanel.client.tsx` / `manual-sync.ts` / `route.ts` / `env.ts`）に限定した
- [x] 変更ブロック以外（共通基盤 / 既存 proxy / `apps/api`）を対象外と明記した（[Feedback BEFORE-QUIT-002][Feedback 5]）
- [x] `applyResponse` / `parseInProgress` / `needsSyncAdminBearer` の branch カバレッジ観点を記述した
- [x] coverage 計測コマンド（対象ファイル限定）を提示した
- [x] runtime / user-gated（proxy Bearer / Secrets 投入 / catch 枝）の対象外範囲を明記した
