# [#882] fix(web): /terms env validation prefetch エラーで / の JavaScript 有効 hydration が破綻

## メタ情報

```yaml
issue_number: 882
title: fix(web): /terms env validation prefetch エラーで / の JavaScript 有効 hydration が破綻
state: OPEN
priority: 高
scale: -
category: バグ修正
status: -
created_date: 2026-05-23
updated_date: 2026-05-23
url: https://github.com/daishiman/UBM-Hyogo/issues/882
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 高 |
| 規模 | - |
| ステータス | - |

---

## 概要

`home-page-prototype-alignment` Phase 11 manual test で発見。`next start` + deterministic mock API による `/` 表示時、**JavaScript 有効状態では `/terms` route の env validation prefetch エラーが client-side で発生し、SPA navigation / hover prefetch が破綻**する。

Phase 11 では JavaScript 無効で CSS validation を切り分けて screenshot 取得したが、ユーザー実訪問時の挙動として未解決のため follow-up タスクとして起票。

## 仕様書

- `docs/30-workflows/completed-tasks/home-page-prototype-alignment-followup-001-terms-prefetch-env-validation.md`

## 発見元

- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-11/manual-test-result.md` §視覚的検証 / Boundary
- `docs/30-workflows/completed-tasks/home-page-prototype-alignment/outputs/phase-12/implementation-guide.md` Part 3 / Part 6

## 受け入れ基準（抜粋）

- `/` を JavaScript 有効状態で開いた際、Console に `/terms` env validation 由来の error が出ない
- `<Link href="/terms">` の prefetch が成功する（Network panel で 200）
- env 参照は引き続き `getEnv()` / `getPublicEnv()` 経由のみ（`process.env.*` 直参照を導入しない）
- JavaScript 有効 screenshot を `outputs/phase-11/` 配下に取得
- `bash scripts/verify-pr-ready.sh` exit 0

## 依存

- 前提: `home-page-prototype-alignment` Phase 12 完了済み
- 関連: `task-05a-privacy-terms-pages-001`（`/terms` 静的ページ実装本体 / 文面更新は本タスク対象外）
- 関連: `UT-DSF-07`（production-equivalent runtime での再現）
