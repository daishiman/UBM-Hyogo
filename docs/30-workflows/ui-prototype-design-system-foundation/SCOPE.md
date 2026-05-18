# SCOPE — UI Prototype Design System Foundation

## 解決する問題

プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）の見た目（背景・サーフェス階層・カードの陰影・余白リズム・タイポスケール・配色の雰囲気）が、`apps/web` の全画面に共通反映される仕組みが**存在しない**。

- OKLch トークン (`apps/web/src/styles/tokens.css:1-89`) は正本化済み
- Tailwind v4 bridge (`apps/web/src/styles/globals.css:11-68`) は接続済み
- primitives (`apps/web/src/components/ui/`) は 13 個実装済み

しかし以下が抜けている:

1. **page-level の chrome 規則がない** — `globals.css @layer components` に `body` / `[data-route]` / カード共通余白の既定 selector がない。各ページが個別に Tailwind utility で背景を指定する設計で、ページ毎にバラつく
2. **AppShell layout の data-* 契約が未完成** — `app/(public)/layout.tsx` / `(admin)/layout.tsx` / `(member)/layout.tsx` は存在するが、Topbar / Sidebar / surface 背景 / カード余白の rhythm を画面横断で共通化する `data-theme` / `data-shell` / `data-route` 契約が不足している
3. **page.tsx のプロトタイプ反映が部分的** — 19 routes の page.tsx は現行コードに存在するが、09e/09f/09g/09h と prototype JSX から section / primitive / data mapping を引ける台帳が不足しているため、ページ毎に雰囲気がずれる
4. **selector ベース規則が未移植** — `improvements/parallel-03-prototype-ux-css/spec.md:25-62` の G3-1/2/3 規則（tag pill 選択時 fill / member card hover / `[data-visibility]` marker）が `globals.css` 未反映
5. **Form response → MemberDetail 描画が未接続** — API は response_fields を返せるが `(public)/members/[id]/page.tsx` が無いため、Google Form の実回答データが画面に出ない

## 期待状態（After）

- プロトタイプ `styles.css` の page-level rhythm を `globals.css @layer components` で翻訳済み
- 3 系統の AppShell layout が `data-theme` / `data-shell` / `data-route` 契約を満たし、`(public)` / `(admin)` / `(member)` と root fallback で共通 chrome が継承される
- 19 routes 全 page.tsx が 09e/f/g blueprint + primitives で構成され、プロトタイプ未掲載画面（管理画面群・register・privacy・terms・login・error・not-found）も同じカード仕様・配色・余白で表示される。対応表は `PROTOTYPE-COVERAGE.md` を正本とする
- selector ベース規則が globals.css に転記され、tag pill / member card hover / visibility marker が全画面で機能
- Google Form の実回答が `/(public)/members/[id]` で MemberDetail カードに描画される
- Playwright visual evidence と verify-design-tokens の regression gate が green

## 19 routes 全件（CLAUDE.md UI prototype alignment セクションから引用）

| 層 | 数 | routes |
|----|----|--------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` |
| 共通 | 3 | `error.tsx`, `not-found.tsx`, `loading.tsx` |

> 物理配置の正本: `/login` / `/profile` / `/privacy` / `/terms` は現行 app router では root 配下（`apps/web/app/login` 等）に存在する。URL と route group は混同しない。実装時は `PROTOTYPE-COVERAGE.md` の `current_app_path` を優先する。

## 実装区分

`[実装区分: 実装仕様書]` — 全サブワークフローでコード変更を伴う。`docs-only` 適用なし。

## 成功基準（DoD 全体）

1. `apps/web/src/styles/globals.css` の `@layer components` にプロトタイプ rhythm が翻訳されている
2. `apps/web/app/layout.tsx`（root）+ 3 つの route group layout.tsx が存在し、各 route group page で共通 chrome が継承される
3. 19 routes 全 page.tsx が存在し、`pnpm typecheck` / `pnpm lint` / `pnpm build` が green
4. `/(public)/members/[id]` で API response_fields が MemberDetail に描画される（fixture seed 経由で確認可）
5. Playwright visual evidence の 4 screens（top / members list / member detail / admin dashboard）の screenshot が `outputs/phase-11/` に物理存在
6. `verify-design-tokens` CI gate が green（HEX 直書き 0 件）
7. `bash scripts/verify-pr-ready.sh` が exit 0

## CONST_007 の適合

本 workflow の全サブワークフローを後続実装プロンプト（`03.実装.md`）1 サイクル内で完了する。

- `parallel-01..04` は相互依存なしで並列実装可
- `serial-05` は `parallel-01..04` 完成後に着手
- `serial-06` は `serial-05` 完成後に着手
- `serial-07` は最終 regression

「分量が多い」「複雑」を理由に、未タスクへの先送りは行わない。
