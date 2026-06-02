# Phase 2 — 設計

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> landed 実装の責務境界・状態所有権・認証境界・データフローを正本記述する。
> 新規設計ではなく current facts の構造化。

---

## 1. 既存コンポーネント再利用判定（[FB-SDK-07-1]）

| 再利用対象 | 出所 | 判定 |
|-----------|------|------|
| `Button`（`variant` / `loading` / `disabled`） | `apps/web/src/components/ui/Button` | 再利用（新規 primitive 不要） |
| `AdminSectionCard`（`title` / `description` / `density`） | `apps/web/src/features/admin/components/_shared` | 再利用 |
| `useAdminMutation`（POST 非冪等 overload） | `apps/web/src/features/admin/hooks/useAdminMutation` | 再利用（不変条件 #10） |
| `FetchAuthedError`（`status` / `bodyText`） | 同上 re-export | 再利用（409 判定） |
| OKLch トークン className | `apps/web/src/styles/tokens.css` | 再利用（HEX 禁止） |

→ **新規 UI 実装ゼロ**でアクセシビリティ・トークン準拠を既存レベルで担保。

---

## 2. 責務境界・状態所有権（混在禁止）

| レイヤ | 所有物 | ファイル |
|--------|--------|---------|
| UI（client） | パネル描画 / ボタン disabled / 結果テーブル / confirm 起動 / 受信 `safeParse` | `ManualFormResyncPanel.client.tsx` |
| UI state | `lastResult` / `mode`（"run" \| "backfill"）/ `parseError` | 同上 `useState`（`:45-47`） |
| mutation | fetch 実行 / `isLoading` / `error`（`FetchAuthedError`）/ timeout / toast | `useAdminMutation`（2 インスタンス: run / backfill） |
| Contract | `SyncResult` / `SyncRunResponse` zod 再宣言 | `diagnostics/manual-sync.ts` |
| Proxy（server） | session admin gate / `SYNC_ADMIN_TOKEN` Bearer 注入 / upstream 転送 | `app/api/admin/[...path]/route.ts` |
| Backend（不変） | mutex / Forms fetch / D1 upsert / 409 マップ | `apps/api/src/sync/*`（**変更しない**） |

> 状態所有権の原則: UI は「描画と検証」、mutation は「通信と pending」、proxy は「認証注入」に閉じる。
> sync 実行結果（`SyncResult`）の正本は backend にあり、UI は受信値を信頼せず再検証して保持するだけ。

---

## 3. データフロー（差分 / 全件）

```
[管理者 click 差分 sync]
  → runMutation.trigger({}, "/api/admin/sync/responses?fullSync=false")
  → proxy route.ts: requireAdmin() → needsSyncAdminBearer(["sync","responses"])=true
                     → headers.authorization = `Bearer ${SYNC_ADMIN_TOKEN}`
                     → fetch `${INTERNAL_API_BASE_URL}/admin/sync/responses?fullSync=false`
  → apps/api: requireSyncAdmin → runManualSync(env) → withSyncMutex → Forms fetch → D1 upsert
  → 200 { ok:true, result:SyncResult } | 409 { ok:false, result:{status:"skipped",...} } | 500
  → UI: applyResponse(raw,"run") → SyncRunResponseSchema.safeParse
       → success: setLastResult / setMode("run") / onSynced?.(result)
       → fail: setParseError("sync result schema mismatch")
  → 409: trigger が FetchAuthedError(409, bodyText) を throw
       → parseInProgress(error) が result.status==="skipped" を検知し inProgress 表示
```

全件 backfill は `runBackfill` の confirm（`globalThis.confirm`）を挟み `?fullSync=true` で同一フロー（`mode="backfill"`）。

---

## 4. 認証境界の設計（core 事項）

### 問題

sync endpoint は `requireSyncAdmin`（Bearer `SYNC_ADMIN_TOKEN`・timing-safe 比較）。
ブラウザは機密トークンを保持できないため、素のクライアント fetch は API 側で 401 になる。

### 解（proxy server-only 注入）

`route.ts` の `proxy()` は session admin gate（`requireAdmin`）通過後、
`needsSyncAdminBearer(path)` が true のパスに対して server 環境の `SYNC_ADMIN_TOKEN` を
`Authorization: Bearer` として upstream へ付与する。クライアントへトークンは返さない。

```ts
function needsSyncAdminBearer(path: readonly string[]): boolean {
  if (path[0] !== "sync") return false;
  return path[1] === "schema" || path[1] === "responses"
      || path[1] === "backfill-publish-state" || path[1] === "diagnostics";
}
```

- 未設定時は `500 sync_admin_token_missing` を proxy が返す（fail-fast・UI に設定不備を表面化）。
- `SYNC_ADMIN_TOKEN` は `env.ts` の `EnvSchema`（`:10`）+ `AuthEnvSchema`（`:52`・`.partial()`）に optional 追加し
  `getAuthEnv()` 経由で読む（`process.env` 直参照禁止・task-02 不変条件）。
- Task A（`backfill-publish-state`）/ schema / diagnostics も同じ Bearer が必要なため、注入は **1 箇所に集約**。

### 強化ループ / バランスループ

- 強化ループ: proxy 注入が確実 → UI から到達可能 → 手動 sync 運用が回る → CLI 依存解消。
- バランスループ: クライアント disabled（pending）+ サーバ mutex（409）の 2 層で二重起動を抑制。
  多端末同時操作は disabled をすり抜けるが、mutex の 409 が最終防御。

---

## 5. 二重起動防止の 2 層設計（AC-B3）

| 層 | 仕組み | 実装 |
|----|--------|------|
| クライアント | `busy` で全ボタン `disabled` | `:60, :107, :117` |
| 同一 hook | `isSubmittingRef` が同一インスタンスの二重 `trigger` を throw | `useAdminMutation` 内部 |
| サーバ | `withSyncMutex` が D1 ロック取得・競合時 `status:"skipped"` → route が 409 | `apps/api/src/sync/*`（不変） |

---

## 6. mutation 規約（不変条件 #10）

- POST 非冪等 overload を使用（`retry` 不可・sync は副作用を持つため自動 retry なしが正）。
- 2 インスタンス（run / backfill）を分け、各々独立に `isLoading` を持つ。
- `timeoutMs: 60000`（Forms fetch + upsert は 10s 既定を超えうる）。
- `refreshOnSuccess: false`（結果は手動描画）/ `successMessage: () => ""`（既定 toast 抑止）。

---

## 7. SubAgent lane 設計（Phase 4 以降）

| lane | 担当 Phase | 並列性 |
|------|-----------|--------|
| lane-1 | Phase 4, 6, 7（テスト系） | 並列可 |
| lane-2 | Phase 5, 8, 9（実装差分確認 / リファクタ / QA） | 並列可 |
| lane-3 | Phase 10, 11, 12, 13（レビュー / 手動 / docs / PR 準備） | 並列可 |

validation lane（verify-all-specs / validate-phase-output）は直列で締める。

---

## 完了条件

- [x] 既存コンポーネント再利用可否を判定した（[FB-SDK-07-1]・新規 primitive ゼロ）
- [x] 責務境界・状態所有権を混在なく確定した
- [x] データフロー（差分 / 全件 / 409）を図示した
- [x] proxy 認証境界の設計と強化/バランスループを記述した
- [x] 二重起動防止 2 層と mutation 規約を確定した
- [x] SubAgent lane を 3 並列以下で設計した
