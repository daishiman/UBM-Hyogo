# Phase 1 — 要件定義

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> Task B「手動フォーム再取込 管理 UI」を Phase 1〜13 仕様書へ展開する第 1 フェーズ。
> 実装は commit `745c95115`（PR #1064）で landed 済みのため、本 Phase は scope/AC/inventory を
> 固定すると同時に、**landed 実コードの current facts** を正本として確定し、原タスクファイルとの
> **drift** を補正する。

---

## 1. 目的 / 主問題（真の論点）

### 真の論点（1 文固定）

> 「実装済みの手動 sync layer（cron `runResponseSync` / `POST /admin/sync/responses` / `?fullSync=true`）に
> admin UI 操作面と server-only な `SYNC_ADMIN_TOKEN` proxy 注入経路を与え、管理者が画面操作だけで
> 差分 sync / 全件 backfill を実行・結果確認・二重起動防止できる状態を担保する」

### why now / why this way

- **why now**: `/members` に「公開設定中のメンバーがいません」と表示される根本対処の一環。既存フォーム回答を
  手動で D1 へ反映する操作面が無く、管理者が CLI / curl に依存していた。
- **why this way**: 取込本体は実装済みなので **UI 導線 + proxy 認証注入のみ**に責務を絞る。
  ブラウザは機密 `SYNC_ADMIN_TOKEN` を保持できないため、proxy（`app/api/admin/[...path]/route.ts`）が
  server 環境で Bearer を注入する。これにより `apps/api` を一切変更せず到達性を満たす。

---

## 2. 受け入れ基準（親 `phase-1.md` AC-B 群）

| ID | 内容 | landed 実装での充足箇所 |
|----|------|------------------------|
| AC-B1 | 管理者が `admin/sync-status` から手動 form response sync を実行でき、結果（取込件数・status）が表示される | `ManualFormResyncPanel.client.tsx` 差分 sync ボタン（`data-testid="manual-sync-run"`）→ `applyResponse` で `SyncResult` を `<dl>` 結果テーブルへ描画（`:138-155`） |
| AC-B2 | 既存保存済み回答も対象になる full / cursor reset の選択肢を提示する（既存 endpoint の引数に準拠） | 差分=`?fullSync=false` / 全件=`?fullSync=true` の **2 経路**を `endpointOverride` で表現（`:84, :93`）。endpoint 自体は引数を取らないため 2 ボタンで full/cursor reset を表現 |
| AC-B3 | 実行中の二重起動を防止する（disabled / pending 状態） | `busy = runMutation.isLoading || backfillMutation.isLoading` を全ボタン `disabled` に接続（`:60, :107, :117`）+ サーバ側 `409 skipped` を `parseInProgress` で検知し `role="status"` 表示（`:19-32, :129-132`） |

---

## 3. スコープ

### 含む（landed 実装の責務）

- admin UI パネル（差分 / 全件 backfill の 2 ボタン）
- `SyncResult` / `SyncRunResponse` の zod 再宣言（`apps/web` から `apps/api` を import しない・不変条件 #5）
- proxy（`route.ts`）の `SYNC_ADMIN_TOKEN` server-only 注入
- `apps/web/src/lib/env.ts` の `SYNC_ADMIN_TOKEN`（optional）追加
- パネル/schema の単体テスト

### 含まない（スコープ外・不変条件）

- `apps/api` への変更（endpoint・sync layer・D1 schema・migration・Google Form schema）＝ **差分ゼロ invariant**
- Task A（公開状態 backfill UI）/ Task C（SLA 表示）/ Task D（外部リンク）の責務
- 新規 primitive の追加（`Button` / `AdminSectionCard` / トークン className を再利用）
- 入力フォーム項目（差分 / 全件の 2 ボタンのみ・`FormField` 不要）
- `SYNC_ADMIN_TOKEN` の実値投入（Cloudflare Secrets / `.dev.vars`）＝ user-gated

---

## 4. inventory（既存コードの命名規則・現状確認）

| 項目 | current facts |
|------|--------------|
| component 命名 | PascalCase + `.client.tsx`（client component）。`ManualFormResyncPanel.client.tsx` |
| schema/型/定数 | `diagnostics/manual-sync.ts`。zod schema は PascalCase + `Schema` 接尾（`SyncResultSchema`） |
| 定数 | UPPER_SNAKE（`SYNC_RESPONSES_PATH`） |
| test 命名 | `*.spec.{ts,tsx}`（不変条件 #8）。`ManualFormResyncPanel.spec.tsx` / `sync-schemas.spec.ts` |
| mutation hook | `@/features/admin/hooks/useAdminMutation`（不変条件 #10・legacy `@/lib/useAdminMutation` 不使用） |
| 色トークン | OKLch CSS 変数（`var(--ubm-color-*)`）・HEX 直書き禁止（不変条件 #2） |
| confirm | `globalThis.confirm`（`no-restricted-globals` は browser 限定なので許容・test は `vi.spyOn(globalThis,"confirm")`） |

### targeted test run ファイルリスト（[FB-UI-02-2] 全件 SIGKILL 回避）

```
apps/web/src/features/admin/components/_sync/__tests__/ManualFormResyncPanel.spec.tsx
apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts
```

---

## 5. 原タスクファイルとの drift 補正（landed 実装を正本とする）

> [FB-01] 仕様書記述 vs 実装のズレを Phase 1 で早期確定する。以下は原
> `tasks/B-manual-form-resync-admin-ui.md` の記述と landed 実装の差分。**すべて landed 実装が正**。

| # | 観点 | 原タスクファイルの記述 | landed 実装（正本） |
|---|------|----------------------|--------------------|
| D1 | パス定数 | `SYNC_RESPONSES_PATH` を 2 つ import（重複・誤記） | 単一 `SYNC_RESPONSES_PATH` + query suffix（`?fullSync=false` / `?fullSync=true`）を `trigger(payload, endpointOverride)` で切替 |
| D2 | `SyncResultSchema` フィールド | §3.2 結果テーブルに `failed` / `retryCount` 行あり、§8.5 に `durationMs` | 実 schema は `status / jobId / processedCount / writeCount / cursor / skippedReason` のみ（`.strict()`）。`failed`/`retryCount`/`durationMs` は **含まない** |
| D3 | `SyncRunResponseSchema` 409 枝 | `{ ok:false, result:SyncResult }`（status 制約なし） | 409 枝は `result.status === "skipped"` を `.refine()` で強制 + `.strict()` |
| D4 | テストファイル名 | `diagnostics/__tests__/manual-sync.spec.ts` | `diagnostics/__tests__/sync-schemas.spec.ts`（`BackfillResultSchema` test と co-locate） |
| D5 | proxy bearer 対象パス | `path[1]==="run" \|\| "backfill" \|\| "backfill-publish-state"` | `needsSyncAdminBearer`: `path[0]==="sync"` かつ `path[1] ∈ {schema, responses, backfill-publish-state, diagnostics}`（legacy `run`/`backfill` は不使用） |
| D6 | 409 body 形 | 一部記述で `{ ok:false, error:"sync_in_progress", jobId }` | 実 body は `{ ok:false, result:{ status:"skipped", jobId, ... } }`。UI は `parseInProgress(error.bodyText)` で `result.status==="skipped"` を判定 |
| D7 | confirm 方式 | 「自前 dialog state 推奨 / `globalThis.confirm` ガード下」 | landed は `globalThis.confirm` 直接呼び出し（`:89`）。test は `vi.spyOn(globalThis,"confirm")` |
| D8 | カード見出し | 「フォーム回答の手動再取込」 | 実見出しは「フォーム回答の再取込」、`AdminSectionCard density="compact"` |
| D9 | 未設定時挙動 | proxy は注入のみ | landed は token 未設定時に proxy が `500 sync_admin_token_missing` を返す fail-fast（`route.ts:81-90`） |

---

## 6. 不変条件（本タスク固有）

1. `apps/api` / `packages` への差分 0（endpoint・sync layer 不変・AC-G2）
2. consent キー `publicConsent` / `rulesConsent` 統一（本タスクは consent を扱わないが横断不変）
3. D1 直接アクセスは `apps/api` に閉じる（`apps/web` から binding 禁止・不変条件 #5 → UI は zod 再宣言）
4. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（不変条件 #10）
5. 色は OKLch トークンのみ・HEX 禁止（不変条件 #2）
6. 機密値 `SYNC_ADMIN_TOKEN` は Cloudflare Secrets / `.dev.vars`（toml に実値を書かない）

---

## 7. carry-over 確認

直近 commit `745c95115 (#1064)` が親 workflow（Task A/B/C/D 統合）を dev へ landed 済み。
本タスクは Task B 部分の **正本記述 + 回帰確認** であり、新規コード作業は発生しない（Phase 5 で diff-check）。

---

## 完了条件

- [x] 真の論点を 1 文で固定した
- [x] AC-B1..B3 を landed 実装の充足箇所へ写像した
- [x] scope（含む / 含まない）と不変条件を確定した
- [x] 既存コードの命名規則を inventory に記録した
- [x] 原タスクファイルとの drift（D1..D9）を補正し landed 実装を正本と宣言した
- [x] targeted test run ファイルリストを事前列挙した（[FB-UI-02-2]）
