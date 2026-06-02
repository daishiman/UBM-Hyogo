# Phase 5 — 実装（差分確認 / diff-check）

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> 本タスクは `implementation_mode: verify_existing`。実装は commit `745c95115`（PR #1064）で `dev` に landed 済み。
> 本 Phase の主作業は **新規実装ではなく「差分確認（diff-check）」** である。
> landed 済みファイルの内容が current facts と一致すること・回帰がないことを確認する。

---

## 0. 差分確認（このフェーズの本質）

> **新規実装ステップは存在しない。** 以下はすべて landed 済みコードの存在・内容・整合性を確認する作業である。
> 万一 current facts と乖離する差分が見つかった場合は、landed を正とする drift 補正（§4）に従って判定する。

### 確認コマンド

```bash
# landed 5 ファイルが PR #1064 で導入/編集されたことを確認
git diff dev...HEAD --name-only -- apps/web | sort

# 新規/編集ファイルの内容を目視確認（landed 状態を正本とする）
git show 745c95115 -- \
  'apps/web/src/features/admin/diagnostics/manual-sync.ts' \
  'apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx' \
  'apps/web/app/(admin)/admin/sync-status/page.tsx' \
  'apps/web/app/api/admin/[...path]/route.ts' \
  'apps/web/src/lib/env.ts'
```

---

## 1. 新規作成 / 修正ファイルパス一覧（[Feedback RT-03] 必須記載）

| パス | 区分 | landed 内容（current facts） |
|------|------|------------------------------|
| `apps/web/src/features/admin/diagnostics/manual-sync.ts` | 新規 | `SyncResultSchema`（`.strict()`）/ `SyncRunResponseSchema`（`ok:true`＋`ok:false`＝`status==="skipped"` refine の union, `.strict()`）/ `SYNC_RESPONSES_PATH = "/api/admin/sync/responses"` const |
| `apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 新規 | 差分/全件 backfill パネル。`useState`（lastResult / mode / parseError）、run/backfill の 2 mutation インスタンス、`applyResponse` / `parseInProgress` / `resultRows`、`globalThis.confirm`、`AdminSectionCard title="フォーム回答の再取込" density="compact"`、`Button variant primary/danger`、`data-testid="manual-sync-run"` / `"manual-sync-backfill"` |
| `apps/web/app/(admin)/admin/sync-status/page.tsx` | 編集 | `:9` `export const dynamic = "force-dynamic"`。`SyncStatusView`（`:73`）末尾に `<BackfillPublishStatePanel/>`（`:128`）＋ `<ManualFormResyncPanel/>`（`:129`）を並置マウント |
| `apps/web/app/api/admin/[...path]/route.ts` | 編集 | `:29` `syncAdminToken()`、`:31-39` `needsSyncAdminBearer`（`path[0]==="sync"` かつ `path[1]∈{schema,responses,backfill-publish-state,diagnostics}`）、`:79-92` token 未設定で `500 sync_admin_token_missing` fail-fast / 設定時 `headers.authorization = Bearer <token>`。既存 `requireAdmin`（session admin gate `:41-52`）・cookie / x-internal-auth 転送は維持 |
| `apps/web/src/lib/env.ts` | 編集 | `:10` `SYNC_ADMIN_TOKEN: z.string().min(1).optional()`（`EnvSchema`）、`:52` `AuthEnvSchema.pick` に `SYNC_ADMIN_TOKEN: true`（`.partial()` 相当の optional）。`getAuthEnv()` 経由でのみ読む |

> いずれも `apps/web` 配下のみ。`apps/api` / `packages` には差分が発生していないこと（§5）。

---

## 2. proxy 認証注入の適用範囲と制約（差分確認の重点）

### 適用範囲（`needsSyncAdminBearer`）

| 条件 | 値 |
|------|----|
| `path[0]` | `"sync"` |
| `path[1]` | `schema` / `responses` / `backfill-publish-state` / `diagnostics` のいずれか |

上記に合致した場合のみ、proxy が `getAuthEnv().SYNC_ADMIN_TOKEN` を `Authorization: Bearer <token>` として upstream（backend Worker）へ注入する。合致しない場合はクライアント由来の `authorization` ヘッダをそのまま転送する。

### 制約（機密境界）

- **server-only**: token は Next.js Route Handler（サーバ実行）でのみ `getAuthEnv()` から読む。`process.env.*` 直参照は禁止（不変条件・env アクセサ規約）。
- **クライアントへ非返却**: token はリクエストヘッダ注入のみに使い、レスポンス body / クライアント JS へ一切返さない。`ManualFormResyncPanel.client.tsx` は token を知らない設計。
- **未設定 fail-fast**: `needsSyncAdminBearer` 該当パスかつ token 未設定のとき、upstream へ空打ちせず `500 { ok:false, error:"sync_admin_token_missing" }` を即時返却する（設定不備を UI 側で表面化）。

### 確認コマンド

```bash
# proxy 内に token を返却・ログ出力する経路がないことを確認（空ヒット期待）
grep -nE 'res(ponse)?.*SYNC_ADMIN_TOKEN|console\.(log|error).*[Tt]oken' \
  'apps/web/app/api/admin/[...path]/route.ts'

# proxy 以外で SYNC_ADMIN_TOKEN を参照していないことを確認
#（env.ts の宣言と route.ts の利用のみがヒットする想定）
grep -rn 'SYNC_ADMIN_TOKEN' apps/web/src apps/web/app
```

期待: token の返却/ログ出力経路は 0 件。参照は `env.ts`（宣言×2）と `route.ts`（`syncAdminToken()` / 利用）のみ。

---

## 3. UI / contract / mutation の回帰確認

- `manual-sync.ts` の zod schema が `.strict()` を維持し、`SyncRunResponseSchema` が `ok:true` / `ok:false`（`status==="skipped"`）の union であること。
- `ManualFormResyncPanel.client.tsx` が `@ubm-hyogo/shared` 等から型を import し、`apps/api` を import していないこと（zod 再宣言で契約を持つ＝不変条件 #5）。
- mutation 規約: run/backfill は **POST 非冪等 overload（retry 不可）**、`timeoutMs:60000`、`refreshOnSuccess:false`、`successMessage:()=>""`。`busy = runMutation.isLoading || backfillMutation.isLoading` を全ボタン `disabled` に配線。差分/全件は単一 `SYNC_RESPONSES_PATH` ＋ query suffix（`?fullSync=false` / `?fullSync=true`）を `trigger(payload, endpointOverride)` で切替。
- `page.tsx` で `BackfillPublishStatePanel` と `ManualFormResyncPanel` が並置マウントされ、`dynamic = "force-dynamic"` が宣言されていること。

### 確認コマンド

```bash
grep -n '\.strict()\|SYNC_RESPONSES_PATH\|fullSync' \
  apps/web/src/features/admin/diagnostics/manual-sync.ts \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx
grep -n 'useAdminMutation\|timeoutMs\|refreshOnSuccess\|isLoading' \
  apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx
```

---

## 4. drift 補正（landed を正とする）

| ID | 原タスク記述 | landed（正本） |
|----|------------|----------------|
| D1 | パス定数を 2 重定義 | 単一 `SYNC_RESPONSES_PATH` ＋ query suffix（`?fullSync=false` / `?fullSync=true`）を `trigger(payload, endpointOverride)` で切替 |
| D5 | proxy bearer 対象に `run` / `backfill` | 対象は `{schema, responses, backfill-publish-state, diagnostics}` |
| D8 | カード見出し（旧表記） | 「フォーム回答の再取込」/ `density="compact"` |
| D9 | token 未設定時の挙動未規定 | proxy が `500 sync_admin_token_missing` を fail-fast 返却 |

> 差分確認で原文どおりの記述（2 重パス定数 / `run`・`backfill` bearer 対象等）を見つけても、**landed 実装を正**とし、本表に従って判定する。

---

## 5. `apps/api` 差分ゼロ invariant の確認

```bash
# 空出力であること（apps/api / packages に一切の差分がない）
git diff dev...HEAD --name-only -- apps/api packages
```

期待: **出力ゼロ行**。1 行でも出れば不変条件違反として fail（backend は本タスクで凍結）。

---

## 完了条件

- [x] `git diff dev...HEAD --name-only -- apps/web` で landed 5 ファイルを確認した
- [x] 新規/修正ファイルパス一覧（§1）の各 landed 内容が current facts と一致することを確認した
- [x] proxy 認証注入の適用範囲（`needsSyncAdminBearer` 4 パス）と制約（server-only / クライアント非返却 / 未設定 fail-fast）を確認した
- [x] zod `.strict()` / 単一パス定数＋query suffix / mutation 規約 / 並置マウントの回帰がないことを確認した
- [x] drift 補正（D1/D5/D8/D9）を landed を正として確認した
- [x] `git diff dev...HEAD --name-only -- apps/api packages` が空であることを確認した
- [x] 新規実装ステップが無いことを明記し、本 Phase が差分確認のみであることを確認した
