# Phase 1: 要件定義

**[実装区分: 実装仕様書]** — CONST_004 デフォルト適用。コード変更を伴う UX バグ修正。

## 1. 背景

`apps/web` プロフィール画面 (`/profile`) の「公開停止 / 再公開 / 退会」申請 dialog で、mutation 成功後の状態同期が spec と乖離している。

- spec (`parallel-02-state-sync` §4.2 / `parallel-i03-dialog-refresh-order/spec.md`) は副作用の呼び出し順序を以下に固定:
  1. `router.refresh()` (Server Component の再 fetch を先に schedule)
  2. `onSubmitted(res.accepted)` (parent local state へ通知)
  3. `onClose()` (dialog unmount)
- 現状 `RequestActionPanel.tsx:57-60` の `onSubmitted` callback で `router.refresh()` を呼んでおり、dialog 側は `onSubmitted → onClose` の順。これは spec 違反であり、以下の問題が再現する:
  - unmount 後に parent callback が refresh を発火 → React の navigation API 呼び出し warning が出る可能性
  - dialog 閉 → banner 反映までの間に stale UI が一瞬見える UX バグ

## 2. ゴール

mutation 成功時の副作用順序を **dialog component 内**で `refresh → onSubmitted → onClose` に固定し、parent からの重複 refresh を撤去する。

## 3. ステークホルダ / 影響範囲

- 影響利用者: マイページから公開停止 / 再公開 / 退会申請を行う会員 (`/profile`)
- 影響画面: `/profile` の `RequestActionPanel` セクション
- 影響しない範囲: API endpoint, D1 schema, Google Form, banner UI, QueueAccepted 型

## 4. 受け入れ基準 (AC)

| ID | 受け入れ条件 |
|----|-------------|
| AC-1 | `VisibilityRequestDialog.tsx` の onSubmit 成功 path で `router.refresh()` → `onSubmitted(res.accepted)` → `onClose()` の順で副作用が起動する |
| AC-2 | `DeleteRequestDialog.tsx` も同上 |
| AC-3 | `RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` の呼び出しが完全に撤去されている (`useRouter` import も他で未使用なら削除) |
| AC-4 | `VisibilityRequestDialog.component.spec.tsx` で副作用順序 `["refresh","onSubmitted","onClose"]` が assertion される |
| AC-5 | `DeleteRequestDialog.component.spec.tsx` 同上 |
| AC-6 | `RequestActionPanel.component.spec.tsx` で parent 由来の `router.refresh` が呼ばれないことが assert される |
| AC-7 | `pnpm typecheck` / `pnpm lint` / 該当 vitest スイートが PASS |
| AC-8 | dev 環境で公開停止/再公開/退会申請を実行 → banner が即時表示 → console warning なし、を目視確認 |

## 5. 非機能要件

- 性能: 既存実装と同等 (副作用の合計回数は不変。順序のみ変更)
- 互換性: dialog の props 型 (`onSubmitted: (accepted: QueueAccepted) => void`) は不変
- アクセシビリティ: 既存 ARIA 属性 / focus 管理は変更しない

## 6. 制約

- D1 schema 変更禁止 (CLAUDE.md 不変条件 #5)
- API endpoint 変更禁止 (CLAUDE.md UI alignment 不変条件 #1)
- catch / error path の挙動は変更しない (race condition 対象は成功 path のみ)

## 7. 用語

| 用語 | 意味 |
|------|------|
| `router.refresh()` | Next.js App Router の Server Component 再 fetch API |
| `onSubmitted` | dialog → parent 通知 callback |
| `onClose` | dialog unmount トリガ callback |
| QueueAccepted | mutation 受理時のサーバ応答型 (`apps/web/src/lib/api/me-requests.types.ts`) |
