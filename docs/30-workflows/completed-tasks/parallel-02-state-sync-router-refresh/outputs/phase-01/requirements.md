# Phase 01: 要件定義

## 真の論点（4 件）

1. **mutation 成功直後に server state を即時反映する必要があるか** → YES。`/me/profile` の `pendingRequests` が正本であり、UI 上 `RequestPendingBanner` を遅延なく表示しないと「申請したのに反映されない」UX 不具合となる。
2. **refresh の呼び出し位置を dialog ローカル / parent (`RequestActionPanel`) のいずれにするか** → dialog ローカル（spec.md line 91 で Option A 採択済）。`onClose()` による unmount より先に refresh を schedule できる。
3. **mutation 失敗 (409 / 422 / network) でも refresh するか** → NO。失敗時は server state が変化していないため refresh は無駄な往復となる。
4. **楽観的 UI を採用するか** → NO。MVP は server state 正本方針を維持し、楽観的更新は導入しない（banner 表示は refresh 後の server reads に依存）。

## 条件評価（4 件）

| 条件 | 評価 |
| --- | --- |
| 既存 API 不変条件を維持できるか | YES。`apps/api/src/routes/` は変更不要。`POST /api/me/visibility-request` / `POST /api/me/delete-request` の挙動は不変 |
| OKLch トークン正本化に抵触しないか | YES（抵触なし）。色変更なし |
| `apps/web` から D1 を直接呼ばないか | YES。client → API 経由のみ |
| テストファイル拡張子 `.spec.tsx` 統一に整合するか | YES。新規ケースは既存 `*.component.spec.tsx` への追加 |

## 既存資産インベントリ

| パス | 役割 |
| --- | --- |
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | 公開停止/再公開申請 dialog（onSubmit 改修対象） |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | 退会申請 dialog（onSubmit 改修対象） |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | dialog 親 / accepted bridge state（既存 `router.refresh()` を削除し bridge に再構成） |
| `apps/web/app/profile/_components/RequestPendingBanner.tsx` | pending 表示。`/me/profile` の `pendingRequests` を読み取る |
| `apps/web/src/lib/api/me-requests.ts` | `requestVisibilityChange` / `requestDeletion` クライアント |

## DoD

- 受入条件 AC-1..AC-8（index.md 参照）を全て満たす
- 仕様書群と本ドキュメントが整合する
