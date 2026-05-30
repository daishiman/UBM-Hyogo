# Phase 12 — Unassigned Task Detection

## 1. 検出方針

本 workflow のスコープに対し、以下 3 経路で未タスク候補を検出する:

1. Phase 5 / 6 / 8 / 9 で言及した「後段で発生する」記述の grep
2. parent workflow の Task A-F DoD と本 workflow の dependencies の差分
3. CI matrix / staging visual / cross-browser など、本 workflow が明示的にスコープ外とした項目

## 2. 検出結果

**未タスク 0 件**。

### 2.1 検出候補と却下理由

| # | 候補 | 検出経路 | 却下理由 |
|---|------|----------|----------|
| 1 | Mobile viewport での auth-slot 検証 | Phase 7 §6 | DOM 契約は viewport-agnostic。既存 mobile-webkit project は契約検証外。本 workflow スコープ外（不変条件外） |
| 2 | i18n / 多言語 | Phase 7 §6 | プロジェクト未実装。本 workflow とは無関係 |
| 3 | Visual regression（auth-slot 系） | Phase 7 §6、Phase 12 main §2 | NON_VISUAL 区分。`staging-visual` 系は別 workflow（`admin-visual-baseline-admin-routes-task-e` 等） |
| 4 | `signSessionJwt` の expired JWT 生成 | Phase 6 §1.2、Phase 8 §3、Phase 10 §3 | `auth-slot-coverage.spec.ts` で `nowSeconds` / `ttlSeconds` を使い **本サイクル内で実装済み**。先送りでない |
| 5 | Task F DoD への `data-route-group="admin"` 親 div への `data-auth-state="admin"` 付与追記 | Phase 1 §6、Phase 10 §3 | `apps/web/app/(admin)/layout.tsx` で **本サイクル内で実装済み**。親 workflow への feedback は文書化のみ |
| 6 | Firefox / WebKit での auth-slot 実行 | - | 親 workflow Task A-F の DOM 契約は browser-agnostic。CI 拡張は別 workflow（cross-browser smoke）の領分 |

## 3. 独立 grep 検証

| パターン | 結果 |
|----------|------|
| `TODO` in `docs/30-workflows/completed-tasks/public-header-auth-slot-e2e/` | 0 件 |
| `FIXME` in 同上 | 0 件 |
| `後で` / `あとで` / `将来` / `先送り` in 同上 | 0 件 |
| `Phase 2 で` / `次サイクルで` / `別 PR で` in 同上 | 0 件 |

## 4. 関連 OPEN Issue 検索

| 検索 | 結果 |
|------|------|
| GitHub Issue `auth-slot` keyword | 関連 OPEN Issue なし（本 workflow が初出） |
| GitHub Issue `public-header-logged-in-nav-cleanup` 親 | 親 workflow 側で管理 |

## 5. CONST_007 遵守確認

| 検査項目 | 結果 |
|----------|------|
| 「将来別 PR」「Phase 2 で」「別サイクルで」等の literal | 0 件 |
| dependencies の transitive 化（前提を後段に丸投げ） | なし |
| スコープ分割は並列実行のためのみ | 確認 |

## 6. 結論

**未タスク 0 件**。本 workflow は 1 サイクル内で Phase 1-13 完結する。新規 Issue 起票なし。
