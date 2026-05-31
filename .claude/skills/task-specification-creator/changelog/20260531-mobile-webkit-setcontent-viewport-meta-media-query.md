# Phase 11 e2e: mobile-webkit の `setContent` ハーネスは viewport meta が無いと responsive media query を検証できない

- 日時: 2026-05-31
- ブランチ: `feat/issue-1006-members-selected-filters-chip-ux-hardening`（PR #1047）
- 関連: `aiworkflow-requirements/changelog/20260531-mobile-webkit-setcontent-viewport-meta-media-query.md`
- 事象: dev sync-merge 後の CI で `e2e (mobile-webkit)` が 1 件 fail（`e2e-tests-coverage-gate` は連鎖 fail）。`page.setContent` で組んだ component-harness の mobile 縦積みアサーション `toHaveCSS('flex-direction', 'column')` が mobile-webkit でのみ row のまま失敗。
- 根本原因 / 修正: `devices['iPhone 13']`（`isMobile: true`）では viewport meta 欠落時にレイアウトビューポートが ~980px にフォールバックし `@media (max-width: 640px)` が発火しない。`<head>` に `<meta name="viewport" content="width=device-width, initial-scale=1" />` を追加して解消。詳細は aiworkflow-requirements 側 changelog 参照。
- Phase 4 / Phase 11 設計への汎化教訓:
  - **responsive な `@media` ブレークポイントを e2e で検証するタスクは、テスト設計（Phase 4）時点で「実ページ起動」か「setContent ハーネス」かを決め、後者を選ぶ場合は viewport meta 同梱を受け入れ条件に含める。**
  - mobile プロジェクト（`isMobile: true`）特有の挙動は desktop プロジェクトでは表面化しないため、responsive 検証は **mobile プロジェクトを必ず matrix に含める**。desktop のみ green は false negative になり得る。
  - product 実体（Next.js は viewport meta 自動付与）が正しくてもハーネス不備で CI が落ちる典型。fail 切り分け時は「product バグ / ハーネス前提不足」を最初に分離する。
- 検証: webkit + iPhone 13 device の最小スクリプトで meta 有無の `flex-direction` 差（row↔column）を再現確認後にコミット。
