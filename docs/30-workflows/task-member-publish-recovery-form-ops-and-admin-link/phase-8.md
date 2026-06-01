# Phase 8: リファクタリング（設計書）

- A/B は `sync-status/page.tsx` の `SyncStatusView` 末尾に各パネルを並べる。パネルは独立 client component に分離し、page は Server Component を維持する。
- 共通の sync 操作 UI（pending state / 結果表示）が A/B で重複する場合は、実装着手時に小さな共有 presentational helper へ抽出してよい（ただし本サイクルでは新規 primitive を増やさない方針を優先）。
- D の外部リンク分岐は `SidebarNavItem.tsx` 内の最小分岐に留め、新規コンポーネントを作らない。
