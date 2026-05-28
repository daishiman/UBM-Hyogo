# Phase 3: 設計レビュー

## 自己レビュー観点

- 不変条件 #5 (D1 直接アクセス禁止): 本 task は API fetch のみ・違反なし
- 不変条件 #11 (fail-closed auth): `getSession()` → redirect の二段防御を維持
- 不変条件 OKLch token 正本: 色は `tokens.css` 変数のみ参照・HEX 直書きしない
- CONST_005 (実装仕様書必須項目): Phase 5.1 変更ファイル一覧で担保
- 既存 PR #894/#895 規約: slot を一旦 deprecated とし page-head に集約する旨を Phase 12 で明示

## 既存 issue との関係

- #894: 「AdminTopbar breadcrumb 統合」を slot 経由で試行 → 本 task で **slot 廃止 + page-head 一本化** に方針変更 (後段 followup issue として記録)
- #895: 「admin topbar actions client island」も同様に **page-head の actions slot に集約** へ再整流

## リスク

- topbar 撤去により既存 e2e / visual baseline が乖離 → Task E で baseline 全更新前提
- schema diff 件数 fetch が layout 全 admin route で発生するため、`safeServerFetch` の既存 cache / no-store 方針に従う。新しい `revalidate` policy は作らない
- nav テーブル順序と active 判定は分離しているが、href の長さでの優先度評価ロジックの実装漏れに注意 (Phase 6 spec でカバー)

## 整合性確認

- 親 workflow `docs/30-workflows/admin-ui-prototype-alignment/phase-2-design.md` の AppShell 設計と矛盾しないこと
- プロトタイプ `pages-admin.jsx` の sidebar 構造との 1:1 マッピング
- Task B/C/D/E が本 task 完了を前提に進行可能であること (DoR 提供)
