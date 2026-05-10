# Phase 11: 手動テスト / スクリーンショット

## 状況
- dev server (`pnpm -F @ubm-hyogo/web dev`) 起動 + browser 操作はこのセッションで未実施
- Cloudflare D1 binding を要する admin endpoint は op-injected secrets と staging deploy が必要なため、手動 smoke は staging deploy 後に実施

## 自動 evidence で代替済み
- vitest による component 単位の rendering / interaction 検証（Phase 7）
- `next build --webpack` の static analysis 通過（Phase 9）
- `/admin` `/admin/members` route が build output に登録（Phase 9 build log）

## 残課題
- staging deploy 後に以下 9 枚のスクリーンショットを取得し `outputs/phase-11/` に配置:
  1. `/admin` 通常表示（KPI 4 + Zone + Status + Recent + Schema 0）
  2. `/admin` Schema アラート > 0
  3. `/admin/members` 一覧（複数行）
  4. `/admin/members` 空状態
  5. `/admin/members` 検索フィルタ適用
  6. `/admin/members` 行選択 + BulkActionBar 表示
  7. `/admin/members` Drawer 開
  8. `/admin/members` pagination「次へ」状態
  9. mobile breakpoint (375px)

## 判定
- 機能正当性: 自動テスト + build で担保
- 視覚 regression / browser smoke: staging deploy 後の追加タスクへ移管
