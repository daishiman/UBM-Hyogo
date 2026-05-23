# Phase 3: アーキテクチャ設計

[実装区分: 実装仕様書]

`/profile` の 4 領域 component 構造、SSR/CSR 境界、データフロー、依存関係を確定する。
Phase 4-9 の前提となる俯瞰設計。

---

## 1. レンダリング層構造

```
app/profile/page.tsx                    [Server Component]
  ├─ Promise.all([
  │    fetchAuthed<MeSessionResponse>("/me"),
  │    fetchAuthed<MeProfileResponse>("/me/profile"),
  │  ])
  │
  ├─ <PublicVisibilityBanner>           [Server, presentational]
  ├─ <StatusSummary>                    [Server, presentational]
  ├─ <RequestActionPanel>               [Server wrapper]
  │    ├─ <RequestPendingBanner>        [Server, conditional]
  │    ├─ <VisibilityRequest.client>    [Client island]
  │    │    └─ <VisibilityRequestDialog> [Client, ui-primitive Dialog]
  │    └─ <DeleteRequest.client>        [Client island]
  │         └─ <DeleteRequestDialog>    [Client, ui-primitive Dialog]
  └─ <RequestErrorMessage>              [Client, conditional]
```

**境界規律:**
- Server Component は SSR で全 props を計算し client island に渡す
- Dialog 本体・focus trap・`compositionend` ハンドリングは `'use client'` 配下のみ
- `document` / `window` 参照は client island の `useEffect` 内のみ

---

## 2. 4 領域の責務分離

| 領域 | 責務 | 描画 component | 区分 |
|------|------|---------------|------|
| 公開状態バナー | publishState × authGateState の Banner tone 決定 | `PublicVisibilityBanner` | Server |
| 公開範囲サマリ | `FieldVisibilityRow[]` を `<dl>` で列挙 + 補助 Badge | `StatusSummary` | Server |
| 申請パネル | pending 連動の disabled, Dialog 起動 trigger | `RequestActionPanel` + 2 client islands | Mixed |
| 削除申請 | warning Banner + 確認入力 + submit | `DeleteRequestDialog` | Client |

---

## 3. データフロー

### 3.1 初期描画

```
GET /profile
  → page.tsx (Server Component)
    → Promise.all([
        fetchAuthed<MeSessionResponse>("/me"),
        fetchAuthed<MeProfileResponse>("/me/profile"),
      ])
    → app/api/me/[...path]/route.ts (透過 proxy)
    → apps/api/src/routes/me/index.ts (Hono)
    → D1 binding 経由で集約
  → 200: 4 領域に props 配布
  → AuthRequiredError: redirect("/login?redirect=/profile")
  → 404: notFound()
  → throw: error.tsx
```

### 3.2 申請（client → API）

```
[click "公開範囲変更を申請"]
  → setOpen(true) / Dialog open
  → submit
  → client island calls fetchAuthed("/me/visibility-request")
       (fetchAuthed maps this to the existing /api/me/visibility-request proxy)
       body: { desiredState, note }
  → app/api/me/visibility-request/route.ts (透過 proxy)
  → apps/api/src/routes/me/services.ts → D1 insert
  → 200 { ok: true, requestId }
  → router.refresh() で Server Component を再取得
  → pendingRequests に新規 row → Banner / disabled 連動
```

楽観的 UI 不採用（不変条件 4）: pending row の即時表示は行わず、必ず `router.refresh()` を介す。

---

## 4. DAG 上の位置

```
[task-09 Tailwind v4 / OKLch] ──┐
[task-10 ui-primitives:        ] │
   Card / Banner / Badge /       ├──▶ [task-14] ──▶ [task-18 Playwright + verify-design-tokens]
   Button / Dialog / Input /     │
   Skeleton                      ┘
[task-13 login redirect=/profile]
```

- 上流: task-09, task-10, task-13
- 下流: task-18（4 領域 + Dialog open 検証 / profile token grep gate）
- 並列可: task-11, 12, 13, 15, 16, 17

---

## 5. 主要ディレクトリ俯瞰

```
apps/web/
├─ app/
│  ├─ profile/
│  │  ├─ page.tsx                              [M] Server Component
│  │  ├─ loading.tsx                           [R] 既存 Skeleton
│  │  ├─ error.tsx                             [R] 既存 reset
│  │  └─ _components/
│  │     ├─ PublicVisibilityBanner.tsx         [C] new
│  │     ├─ StatusSummary.tsx                  [M] rebuild
│  │     ├─ RequestActionPanel.tsx             [M] minor
│  │     ├─ VisibilityRequestDialog.tsx        [M] Dialog primitive 化
│  │     ├─ DeleteRequestDialog.tsx            [M] Dialog primitive 化
│  │     ├─ RequestPendingBanner.tsx           [M] minor
│  │     ├─ RequestErrorMessage.tsx            [M] minor
│  │     ├─ VisibilityRequest.client.tsx       [R] tokens 適用のみ
│  │     ├─ DeleteRequest.client.tsx           [R] tokens 適用のみ
│  │     └─ __tests__/
│  │        ├─ PublicVisibilityBanner.test.tsx [C] new
│  │        ├─ StatusSummary.test.tsx          [M] rebuild
│  │        └─ ...                             [M] 既存追記
│  └─ api/me/                                  [R] read only / handler 追加禁止
└─ src/
   ├─ lib/
   │  ├─ fetch/authed.ts                       [R]
   │  └─ api/me-types.ts                       [R]
   └─ styles/tokens.css                        [R] task-09 正本

apps/api/src/routes/me/                        [R] 追加・変更禁止
e2e/profile-smoke.spec.ts                      [M] task-18 spec へ append
```

凡例: `C=create, M=modify, R=read-only`

---

## 6. SSR/CSR 境界の規律

| 要素 | 配置 | 理由 |
|------|------|------|
| `Promise.all` で fetchAuthed × 2 | Server | session cookie を直接保持できる |
| publishState 決定 / Banner tone 計算 | Server | 純粋な props 計算 |
| Dialog 状態 (`useState`) | Client | open/close は対話状態 |
| `compositionend` イベント | Client | IME 確定検知は browser API |
| `router.refresh()` 呼出 | Client | submit 後の re-fetch trigger |
| Sentry capture | 両側可 | error.tsx は Server, submit 失敗時は Client |

---

## 7. エラー伝播

| 発生源 | 伝播先 | 対処 |
|--------|--------|------|
| `fetchAuthed` AuthRequiredError | page.tsx | `redirect("/login?redirect=/profile")` |
| `fetchAuthed` 404 | page.tsx | `notFound()` |
| `fetchAuthed` 5xx / network | page.tsx | throw → `error.tsx` で reset + Sentry |
| Dialog submit 4xx | client island | `<RequestErrorMessage>` 表示 |
| Dialog submit 401 race | client | 1 度 retry → 失敗時 `router.replace("/login?redirect=/profile")` |
| Dialog submit 5xx | client island | `<RequestErrorMessage>` + Sentry capture |

---

## 8. 完了条件

- 4 領域の責務と SSR/CSR 境界が確定し、Phase 6 の component 設計に 1:1 で対応
- `apps/api` および `apps/web/app/api/me/*` への変更が **構造上不可能**な component 設計（fetchAuthed 経由のみ）
- DAG 上の依存（task-09, 10, 13 → 14 → 18）が確認済
