# Phase 10: 監視 / 運用観点

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 |
| 区分 | 設計（新規 alert なし、観点整理のみ） |
| 想定所要 | 0.1 人日 |

## 目的

本タスクが本番運用において発生させうる観測ポイントを整理する。新規 alert / dashboard は追加しない。

## 観測ポイント

| 観点 | リスク | 観測手段 |
| --- | --- | --- |
| client-side error | SVG render が `slices` の異常値で throw | Cloudflare Workers の error log（`apps/web` error boundary `app/error.tsx` 経由） |
| Lighthouse パフォーマンス | SVG 描画が initial render を遅延させる | `pnpm exec lhci healthcheck`（既存 CI） |
| accessibility | `aria-label` 欠落 / contrast 不足 | axe / DevTools 手動チェック（Phase 11 で evidence 取得） |
| visual regression | 既存 admin dashboard snapshot との差分過大 | `playwright-smoke / visual` CI gate |

## アラート

本タスクで追加するアラート: **なし**。

理由: UI component 改修のみで、Workers / D1 / Slack / cron 等の運用 surface に touch しない。

## metrics（既存利用）

| metric | 出典 |
| --- | --- |
| `cf.workers.errors` | Cloudflare Workers 標準 metric |
| Lighthouse Performance score | `lighthouserc.json` |
| Playwright visual diff | `playwright-report` |

## 実行タスク

- Phase 10: 新規 alert なしの運用観測点を整理する。

## 参照資料

- - `phase-05.md`
- - `phase-07.md`
- - `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md`

## 成果物

- - monitoring impact table を成果物にする。

## 統合テスト連携

- - Phase 12 system spec update summary に接続する。

## 完了条件

- [ ] 観測ポイント表が確定している
- [ ] 新規 alert / dashboard を追加しない判断が明記されている

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
- Phase 5 / phase-05.md
