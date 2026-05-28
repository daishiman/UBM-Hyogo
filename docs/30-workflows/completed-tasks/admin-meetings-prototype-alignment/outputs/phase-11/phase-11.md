# Phase 11: Manual Test

## 11.1 環境

- ローカル: `mise exec -- pnpm --filter @ubm-hyogo/web dev`
- staging: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/meetings`
- アカウント: admin = `manjumoto.daishi@senpai-lab.com`

## 11.2 確認シナリオ

Task A / Task B の Phase 11 を順に実行する。

### List ページ（Task A）

- [ ] AdminPageHeader 表示
- [ ] KPI strip 4 枚
- [ ] form で追加 → toast + 一覧更新
- [ ] timeline 行 click → drawer 開く
- [ ] drawer から出席追加（候補に削除済み会員なし、既出席 disabled）
- [ ] soft delete confirm → 行が消える
- [ ] 空状態 `AdminEmptyState`
- [ ] OKLch token のみ（DevTools で computed style 確認）

### Detail ページ（Task B）

- [ ] AdminPageHeader title=「<heldOn> <title>」
- [ ] 出席登録 section + CSV import section が `AdminSectionCard`
- [ ] CSV import の 4 状態（idle / parsing / preview / confirming）

## 11.3 evidence

- スクリーンショット: `outputs/phase-11/screenshots/` 配下に保存
  - `list-default.png`
  - `list-empty.png`
  - `list-drawer-open.png`
  - `detail-default.png`
  - `detail-csv-preview.png`

## 11.4 staging 404 の取扱い

screenshot で観測された `ADMIN_FETCH_404` は本タスクのスコープ外。
auth gate / session 関連の確認は別 Issue で扱う（本ワークフロー完了の阻害要因ではない）。
