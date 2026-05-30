# Phase 8 — リファクタリング

## 1. 方針

本 Task は最小差分原則を採用しているため、page 2 file 間で shell ラップ部分が重複する点について primitive 抽出の是非を判定する。

## 2. 重複箇所

`/privacy`, `/terms` 双方で:

```tsx
<div className="grid min-h-screen grid-rows-[auto_1fr_auto] ..." data-theme="warm" data-route-group="public" data-testid="public-shell">
  <header data-shell="topbar"><PublicHeader authView={authView} /></header>
  <main ...>{children}</main>
  <footer data-shell="footer"><PublicFooter /></footer>
</div>
```

の 8 行程度が重複する。

## 3. 判定: primitive 抽出は本 Task では行わない

理由:

- 2 page のみの重複で primitive 抽出は YAGNI 抵触
- 親ワークフロー Task D/E/F で他公開ページの async 化が進めば抽出候補が広がる。その時点で `PublicShell` primitive を別 Task として切り出す方が責務が明確
- 本 Task のスコープ（CONST_007 1 cycle）に primitive 抽出を含めると影響範囲が広がり最小差分を逸脱

## 4. 代わりに残すマーカー

- 親ワークフロー `public-header-logged-in-nav-cleanup` の followup 候補として「`PublicShell` primitive 抽出（Task D/E/F 完了後）」を Phase 12 unassigned-task-detection で再評価。本 Task 自体では unassigned task として登録しない（Task A〜F 完了後の判断）。

## 5. その他リファクタ

- naming / formatting は既存 lint / prettier に従い、追加の手動整形不要
- import 順序は existing convention を踏襲

## 6. ゲート

- [ ] 本 Task 内に primitive 抽出は含めない
- [ ] page.tsx 2 file の class / data-attribute が完全一致（diff で行内文字列ずれが無いこと）
