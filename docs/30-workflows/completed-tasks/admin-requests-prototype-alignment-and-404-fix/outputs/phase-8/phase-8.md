# Phase 8 — リファクタリング

> duplicate / navigation drift を削る。本タスクは新規 primitive 導入なし・既存 component 構造温存のため、refactor 範囲は最小。

---

## 1. リファクタ対象（Before / After）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `RequestQueuePanel.tsx` 内 h1 | `<h1 id="admin-requests-h">依頼キュー</h1>` | `<h2 className="h-section visually-hidden" id="admin-requests-h">依頼種別</h2>` | page.tsx と二重 h1 を解消（L-PGHEAD-001） |
| `RequestQueuePanel.tsx` filter buttons | inline `role="group"` のみ | `card card-pad` + `btn-row` でラップ | admin shell 整合 |
| `RequestQueuePanel.tsx` list ul | bare `<ul>` | `card card-pad-lg` + `h-card` でラップ | 同上 |
| `RequestQueueDetail.tsx` root | section / div 直書き | `aside.card.card-pad-lg` | プロトタイプ準拠 |
| `RequestConfirmDialog.tsx` buttons | inline ボタン列 | `btn-row` | 同上 |

---

## 2. navigation drift 確認

| 項目 | 状態 |
|------|------|
| breadcrumb ラベル | `依頼キュー` 維持 |
| sidebar active state | `/admin/requests` で active になることを既存 spec で確認 |
| topbar `ADMIN / REQUESTS` eyebrow | page.tsx で表示 |

---

## 3. 重複コード削除

| 項目 | 結論 |
|------|------|
| h1 / h2 重複 | 解消（§1） |
| `RequestQueuePanel.tsx` と `RequestQueueDetail.tsx` 間の重複 | なし（責務分離済） |
| `RequestConfirmDialog.tsx` と他 dialog 間の重複 | 既存 `useConfirmDialog` で集約済（変更なし） |

---

## 4. DoD

- [ ] before/after table が phase-12 implementation-guide.md に転記される。
- [ ] `pnpm typecheck` / `pnpm lint` green。
- [ ] 機能挙動の変化なし（test 全 green）。
