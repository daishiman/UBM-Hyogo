# Phase 1 — 要件定義

## task classification

- task_type: `implementation`
- visual_category: `VISUAL`（UI 修正を含む）
- implementation_mode: `new`（既存実装の修正と env アクセス置換）

## P50 前提確認

| 確認項目                         | 結果 | 対応                                            |
| -------------------------------- | ---- | ----------------------------------------------- |
| 現ブランチに実装が存在する       | No   | 通常実装 Phase として扱う                       |
| upstream（main/dev）にマージ済み | No   | 新規ブランチ `feat/login-ui-balance-and-runtime-fix` 起票（dev 起点） |
| 依存タスク完了済み               | Yes  | 既存 `Input`/`Button`/`GoogleBrandIcon`/`Field`/`env.ts` 揃っており追加依存なし |

## 観測

| ソース                                | 内容                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| staging screenshot 2026-05-26         | メールアドレス入力フィールドが button より縦に強調されて見え、視覚的バランスが崩れる                                                       |
| staging screenshot 2026-05-26         | 「Googleでログイン」のアイコンが公式 4 色 G ロゴではなく、茶色〜オレンジの塊として描画される                                                |
| staging console 2026-05-26            | `POST https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/auth/magic-link 404`                                                       |
| staging console 2026-05-26（除外対象） | `127.0.0.1:8888 ERR_CONNECTION_REFUSED` / Sentry `cannot use Sentry.init() in a browser extension` / `timeUtils-D3l_WJ_A.js scheduleIdleTask window is not defined` / `_CacheManager scheduleIdleCleanup` / `[object Object]:1 404` |

## 原因分析（要約）

| ID  | 原因                                                                                                                                          | 根拠                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | `auth.css` の `.ui-input[data-size="lg"]` で `min-height:44px` + `padding 0 var(--ubm-space-3)` だけ指定。button と同じ `min-height` だが border + 内部 padding により太く見える | `apps/web/src/styles/auth.css:94-106`                                                                                              |
| B   | `apps/web/src/styles/legacy-public.css:195-217` の `[data-size]` ワイルドカードセレクタが `<img data-size="md">`（`GoogleBrandIcon`）まで巻き込み、background / pseudo-element を被せている | `legacy-public.css` `[data-size]`/`[data-size]::after` / `[data-size="lg"]` 系がブランドアイコン img へカスケード                |
| C   | `apps/web/app/api/auth/magic-link/route.ts:8` で `process.env["INTERNAL_API_BASE_URL"]` を直接参照。Cloudflare Workers ランタイム（OpenNext）では undefined → fallback `http://127.0.0.1:8787` へ fetch → 失敗。CLAUDE.md invariant 違反 | `apps/web/app/api/auth/magic-link/route.ts:5-12` + CLAUDE.md「`apps/web` env アクセス不変条件」                                    |
| D   | プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/index.html` を直接開くと、`<script type="text/babel" src="data.jsx">` 群が `file://` では fetch 不可、簡易 HTTP server では `.jsx` を `application/javascript` で配信せず babel が parse 失敗 → 描画不能。加えて unpkg CDN の SRI integrity 失効リスクあり | `index.html:1025-1037`（unpkg + SRI + 相対 `.jsx` 7 本）                                                                          |
| 除外 | `127.0.0.1:8888` / `scheduleIdleTask` / `[object Object]:1`                                                                                    | `grep -r 8888 apps/web/{src,app}` → 0 件。バンドル名（`timeUtils-D3l_WJ_A.js`）が Next.js 命名と不一致。Sentry が browser extension と判定 |

## 受入条件

| AC   | 内容                                                                                                                                  | 検証                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC-1 | メール入力フィールドの高さ・余白・border が button と視覚的にバランスする（高さ差 ≤ 0px、border-width 同値、padding 比 1:1±10%） | Phase 11 visual diff + screenshot                                                |
| AC-2 | `<GoogleBrandIcon>` がカード上で公式 4 色 SVG として描画される（赤/青/緑/黄が判別可能）                                                | Phase 11 visual + DOM inspection（`img[data-component="google-brand-icon"]` に余分な background / ::after が当たらない） |
| AC-3 | `legacy-public.css` の `[data-size]` ワイルドカードが brand-icon 配下に影響しない                                                       | CSS spec / visual                                                                |
| AC-4 | `apps/web/app/api/auth/magic-link/route.ts` で production code の `process.env.*` 直参照が消え、`getAuthEnv()` 経由で `INTERNAL_API_BASE_URL` を解決する | grep gate + route unit/route spec                                                |
| AC-5 | `apps/web/app/api/auth/magic-link/verify/route.ts`、他 `apps/web/app/api/**` の `process.env` 直参照が同方針で修正される                  | grep gate                                                                        |
| AC-6 | `apps/web/src` + `apps/web/app` 配下に `process.env.INTERNAL_API_BASE_URL` 直参照ゼロ                                                   | `rg -n "process\.env\[?['\"]INTERNAL_API_BASE_URL"` で 0 件                       |
| AC-7 | staging deploy 後、`POST /api/auth/magic-link` が 200/202 を返す                                                                        | Phase 11 staging smoke（curl + manual flow）                                     |
| AC-8 | `pnpm typecheck` / `pnpm lint` / 対象 unit/route/component spec 全 green                                                                | Phase 9                                                                          |
| AC-9 | visual baseline（Playwright `login.spec.ts`）の更新差分が AC-1/AC-2 のみで、副次的レイアウト差分なし                                     | Phase 11                                                                         |
| AC-10 | `docs/00-getting-started-manual/claude-design-prototype/index.html` が簡易 HTTP server 経由（`scripts/serve-prototype.sh` 等）で 200 で配信され、`.jsx` 7 本も `application/javascript` で配信され UI が初期描画される | Phase 11 manual（curl + ブラウザ確認） |
| AC-11 | `index.html` 内 CDN 参照が SRI 失効に強い構成（`esm.sh` または `jsdelivr` バージョン固定 + SRI 撤去 もしくは正しい hash 再付与）になっている | Phase 11 + 静的 grep                  |

## 命名規則の確認

- 既存 UI primitive: `apps/web/src/components/ui/*.tsx`（`PascalCase`）
- CSS class: `.ui-input` / `.ui-button` / `.auth-card`（kebab-case + BEM-like）
- env アクセサ: 既存 `getAuthEnv()` / `getPublicFetchEnv()` を使用、新規追加禁止
- env keys: `INTERNAL_API_BASE_URL` は full `EnvSchema` では required、`AuthEnvSchema.partial()` 経由の auth/proxy path では unset 時 local fallback を許容

## inventory（変更候補ファイル一覧）

| 種別 | ファイル | 変更目的 |
| ---- | -------- | -------- |
| 編集 | `apps/web/src/styles/auth.css` | input サイズ / 余白チューニング |
| 編集 | `apps/web/src/styles/legacy-public.css` | `[data-size]` ワイルドカードを brand-icon に影響させない |
| 不変更 | `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | 既存 `data-component` を CSS 側で除外するため変更不要 |
| 編集 | `apps/web/app/api/auth/magic-link/route.ts` | `process.env` → `getAuthEnv()` |
| 編集 | `apps/web/app/api/auth/magic-link/verify/route.ts` | 同上 |
| 編集 | `apps/web/app/api/auth/gate-state/route.ts` / `apps/web/app/api/admin/[...path]/route.ts` / `apps/web/app/api/me/[...path]/route.ts` / `apps/web/src/lib/auth/verify-magic-link.ts` / `apps/web/src/lib/fetch/authed.ts` | 同型 internal API base 直参照を既存 env accessor へ統一 |
| 確認 | `apps/web/src/lib/env.ts` | 既存 `getAuthEnv()` / `getPublicFetchEnv()` を使用。schema 追加なし |
| 追加 | `apps/web/app/api/auth/magic-link/route.route.spec.ts` | `getAuthEnv()` 経由の env stub で route が upstream へ正しく fetch することを検証 |
| 編集 | `apps/web/playwright/tests/visual/login.spec.ts`（baseline 更新） | 新 baseline png |
| 編集 | `docs/00-getting-started-manual/claude-design-prototype/index.html` | CDN 戦略変更（esm.sh / jsdelivr + SRI 整合）+ `.jsx` ロード方式の堅牢化（必要なら `<script type="module">` 化 or inline 化） |
| 追加 | `scripts/serve-prototype.sh` | `python3 -m http.server` ベースの `.jsx` MIME 補正 serve（`--bind 127.0.0.1` / port 既定 5180） |

## carry-over 確認

- 直前タスク（`issue-901` authenticated profile/admin staging visual smoke 等）の成果物と本タスクの差分は CSS / route runtime のみ。重複なし。

## scope 外（再掲）

- 既述 console error のうち拡張機能由来分は scope 外。原因切り分け証跡を Phase 11 に残すのみ。
- favicon.ico 404 は今回の login flow 破断とは独立のため未タスク化しない。
