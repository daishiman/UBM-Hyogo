# login-ui-balance-and-runtime-fix

[実装区分: 実装 + local visual captured + staging runtime pending]

## 概要

`/login`（staging: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/login`）で観測された 3 系統の問題を 1 サイクルで解消する:

1. **A. UI バランス**: メールアドレス入力フィールドが太く（button より縦に強調されて）見える、視覚的バランス不良
2. **B. Google ブランドアイコン破綻**: `Googleでログイン` 行のアイコンがカラフルな G ロゴでなく茶色の塊として描画される（CSS のワイルドカードセレクタが `<img>` を上書きしている疑い）
3. **C. ランタイムエラー — `POST /api/auth/magic-link → 404`**: web proxy `apps/web/app/api/auth/magic-link/route.ts` が `process.env["INTERNAL_API_BASE_URL"]` を直接参照しており、Cloudflare Workers ランタイムで undefined に解決 → fallback `http://127.0.0.1:8787` へ fetch → 404 / connection refused。CLAUDE.md 不変条件「`apps/web` ランタイムでの env 参照は `apps/web/src/lib/env.ts` 経由のみ」違反

## スコープ（CONST_007: 1 サイクル完了）

| ID  | 内容                                                                            | 区分     |
| --- | ------------------------------------------------------------------------------- | -------- |
| A-1 | `auth.css` の `.ui-input[data-size="lg"]` サイズ / 余白チューニング             | UI       |
| B-1 | `GoogleBrandIcon` の `<img>` を `[data-size]` ワイルドカード CSS から保護       | UI       |
| B-2 | `legacy-public.css` の `[data-size]` セレクタを brand-icon 配下に影響させない   | UI       |
| C-1 | `apps/web/app/api/auth/magic-link/route.ts` を既存 `getAuthEnv()` 経由に修正 | runtime |
| C-2 | 同パターンの兄弟 route / server helper（magic-link verify、gate-state、admin/me proxy、`verifyMagicLink`、`fetchAuthed`）を併せて修正 | runtime |
| C-3 | regression smoke: production code の `process.env.INTERNAL_API_BASE_URL` 直参照が残らないことを grep gate で固定 | guard   |
| D-1 | プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/index.html` を簡易 HTTP server で開いた際の 404（CDN SRI 不一致 or `.jsx` MIME/serving 失敗）を解消する。`file://` 直接表示は unsupported | docs |

## スコープ外（out-of-scope）

| 項目                                                                              | 理由                                                                                                                                                                       |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Console の `127.0.0.1:8888 ERR_CONNECTION_REFUSED`                                 | アプリ配下に `8888` 直参照なし（`grep -r 8888 apps/web/src apps/web/app` → 0 hit）。Chrome 拡張由来                                                                          |
| `[Sentry] You cannot use Sentry.init() in a browser extension`                    | Sentry 自身が「browser extension」と明示                                                                                                                                   |
| `timeUtils-D3l_WJ_A.js` / `index-BtU_xSw3.js` の `scheduleIdleTask` / `CacheManager` `window is not defined` | Next.js bundle 命名規則（`page-<hash>.js` / `<digit>-<hash>.js` / `chunks/<n>-<hash>.js`）と一致せず、`_CacheManager` クラス含め拡張機能由来                                            |
| `[object Object]:1 404`                                                            | URL に object を toString した跡。アプリ配下に該当 fetch なし                                                                                                              |
| `favicon.ico 404`                                                                  | 別タスク化候補（軽微）。今回は影響評価のみ                                                                                                                                  |

## 不変条件

1. 新規 UI primitive を追加しない（既存 `Input`/`Button`/`GoogleBrandIcon` に閉じる）
2. 色値は `tokens.css` の OKLch token のみ。HEX 直書き禁止
3. `apps/web` から D1 直アクセスしない
4. `apps/web` ランタイムでの env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ。`process.env.*` 直参照禁止（CLAUDE.md invariant #11）
5. 新規 API endpoint を追加しない（既存 `/auth/magic-link` upstream をそのまま使う）
6. Google ブランドアイコンは公式 4 色 SVG を image として表示し、CSS で色や形状を改変しない

## Phase 一覧

| Phase | 名称             | 出力                                          |
| ----- | ---------------- | --------------------------------------------- |
| 1     | 要件定義         | `phase-1-requirements.md`                     |
| 2     | 設計             | `phase-2-design.md`                           |
| 3     | 設計レビュー     | `phase-3-design-review.md`                    |
| 4     | テスト計画       | `phase-4-test-plan.md`                        |
| 5     | 実装手順         | `phase-5-implementation.md`                   |
| 6     | テスト追加       | `phase-6-test-additions.md`                   |
| 7     | カバレッジ       | `phase-7-coverage.md`                         |
| 8     | リファクタリング | `phase-8-refactor.md`                         |
| 9     | QA               | `phase-9-qa.md`                               |
| 10    | 最終レビュー     | `phase-10-final-review.md`                    |
| 11    | 手動テスト       | `phase-11-manual-test.md` + `outputs/phase-11/*` |
| 12    | ドキュメント同期 | `phase-12-documentation.md` + `outputs/phase-12/*` |
| 13    | PR 作成          | `phase-13-pr.md`                              |

## ステータス

- workflow_state: `implemented_local_runtime_pending`
- implementation_status: `local_code_and_visual_complete_staging_pending`
- visual_category: `VISUAL`（A-1 / B-1 / B-2 が UI 影響）
- local evidence: focused route specs + env grep gate + Phase 11 screenshots。staging visual / staging smoke は runtime pending
- commit / push / PR: user-gated
