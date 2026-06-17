# 共有コンテキスト — responsive-mobile-tablet-ui-fixes（全 Phase SSOT）

全 Phase 仕様書が参照する単一の正本。19 ルート inventory・ブレークポイント体系・root cause→AC→変更ファイルの
trace をここに集約する。各 Phase はこの定義に矛盾しないこと。

## 1. ビューポート定義（テスト基準）

`apps/web/playwright/fixtures/viewports.ts` の既存定数を正本とする。

| 名称 | サイズ | 用途 |
| --- | --- | --- |
| mobile | 390 × 844 | 携帯（iPhone 13 相当）。本タスクの携帯基準 |
| mobile-narrow | 375 × 812 | 小型携帯（iPhone SE / sidebar baseline）。最狭フォールバック確認 |
| tablet | 768 × 1024 | タブレット（iPad 縦）。本タスクのタブレット基準 |
| desktop | 1280 × 800 | デスクトップ（回帰非破壊の確認用） |

> 「携帯サイズ」= 375〜390px、「タブレットサイズ」= 768px を一次対象とする。
> 320px（極小）はベストエフォート（崩れ・はみ出しは不可だが pixel 完全一致は非要求）。

## 2. ブレークポイント体系（本タスクで統一する正本）

mobile-first を原則とする。Tailwind v4 の標準 breakpoint に CSS メディアクエリを揃える。

| トークン | 幅 | 適用 |
| --- | --- | --- |
| base | 0px〜 | 携帯（単カラム・縦積み・full-bleed） |
| `sm` | 640px〜 | 大型携帯（必要箇所のみ） |
| `md` | 768px〜 | タブレット（2 カラム化の開始点） |
| `lg` | 1024px〜 | 小型デスクトップ（3 カラム・サイドバー aside 表示） |
| `xl` | 1280px〜 | デスクトップ |

**統一ルール（RC-1 是正）**:
- `globals.css` の `@media (max-width: 767px)` は `@media (max-width: 767.98px)`（= `md` 未満）へ揃える。
- `@media (max-width: 900px)` のような非標準境界は `md`（768）または `lg`（1024）へ寄せる。
  - 「タブレットで詰まる 2 カラム」は `lg`（1024）未満で単カラム化を基本とする。
- 新規の `min-width` メディアクエリは `768px` / `1024px` / `1280px` のみ使用する。
- 上記の標準境界値は `tokens.css` にコメント付き CSS カスタムプロパティ（`--bp-md: 768px` 等。ドキュメント目的）として記載し、参照規約を固定する。

## 3. 19 ルート inventory（対象画面の正本）

| # | 層 | ルート | page / 主要 component | レスポンシブ要注意点（root cause） |
| --- | --- | --- | --- | --- |
| 1 | 公開 | `/` | `app/(public)/page.tsx`, Hero/Stats/AboutUbm/Timeline/CTA | RC-2（`main` width / stat-card grid / hero max-width） |
| 2 | 公開 | `/(public)/members` | `members/page.tsx`, MemberFilters/Search/一覧 grid | RC-2（カード grid）, RC-1（filter bar 折返し） |
| 3 | 公開 | `/(public)/members/[id]` | `members/[id]/page.tsx`, プロフィール詳細 | RC-2（2 カラム詳細） |
| 4 | 公開 | `/(public)/register` | `register/page.tsx`, 案内 + 外部フォーム導線 | RC-2（本文幅） |
| 5 | 公開 | `/privacy` | `privacy/page.tsx`, LegalProse | RC-5（prose 幅・padding） |
| 6 | 公開 | `/terms` | `terms/page.tsx`, LegalProse | RC-5（prose 幅・padding） |
| 7 | 会員 | `/login` | `(auth)/login/page.tsx`, auth フォーム | RC-5（`auth.css` width 420px） |
| 8 | 会員 | `/profile` | `(member)/profile/page.tsx`, プロフィール編集 | RC-2（フォーム grid）, RC-3（情報テーブル） |
| 9 | 管理 | `/(admin)/admin` | `admin/page.tsx`, KpiGrid/各カード | RC-2（KPI grid）, RC-4（status 横バー） |
| 10 | 管理 | `/(admin)/admin/members` | `admin/members/page.tsx`, MembersTable | RC-3（テーブル横スクロール・列はみ出し） |
| 11 | 管理 | `/(admin)/admin/tags` | `admin/tags/page.tsx`, タグ割当 | RC-3, RC-2（tag-master-grid 640px min） |
| 12 | 管理 | `/(admin)/admin/meetings` | `admin/meetings/page.tsx`, ミーティングカード | RC-2（カード grid） |
| 13 | 管理 | `/(admin)/admin/schema` | `admin/schema/page.tsx`, schema flow/glossary | RC-1（`schema-glossary` 3 カラム固定） |
| 14 | 管理 | `/(admin)/admin/requests` | `admin/requests/page.tsx`, 申請一覧 | RC-3（一覧） |
| 15 | 管理 | `/(admin)/admin/identity-conflicts` | `admin/identity-conflicts/page.tsx`, IdentityConflictRow | RC-2（行 2 カラム）, RC-3 |
| 16 | 管理 | `/(admin)/admin/audit` | `admin/audit/page.tsx`, AuditLogPanel/audit-table | RC-3（`admin-audit-table` overflow-x のみ） |
| 17 | 共通 | `error.tsx` | `app/error.tsx` | RC-5（中央寄せ・狭幅） |
| 18 | 共通 | `not-found.tsx` | `app/not-found.tsx` | RC-5（中央寄せ・狭幅） |
| 19 | 共通 | `loading.tsx` | `app/loading.tsx` | RC-5（スピナー中央） |

> 管理層は共通シェル `apps/web/src/components/shell/SidebarShell.tsx`（desktop `hidden md:flex` aside + mobile `md:hidden` drawer/bar）を経由する。
> サイドバー自体は drawer 化済みだが、drawer 幅（`17rem`）・popover・tooltip のビューポート収納（RC-4）は本タスクで是正する。

## 4. Root cause → AC → 変更ファイル trace

| Root cause | 対応 AC | 主な変更ファイル | 是正方針 |
| --- | --- | --- | --- |
| RC-1 ブレークポイント不統一 | AC-1, AC-6 | `tokens.css`, `globals.css` | メディアクエリ境界を 768/1024/1280 に統一。`schema-glossary` 等の 3 カラム固定を `lg` 未満で単/2 カラム化 |
| RC-2 固定幅はみ出し | AC-2, AC-3, AC-6 | `legacy-public.css`, `globals.css` | `minmax(18rem,…)` → `minmax(0,…)` + `lg` 未満単カラム。`min(1120px,…)` の左右 padding を `clamp()` 化 |
| RC-3 テーブル可視性 | AC-7 | `globals.css`, テーブル component | mobile = カード積み or sticky 見出し + セル `min-width` 横スクロールで content を隠さない |
| RC-4 オーバーレイはみ出し | AC-8 | `globals.css`, `SidebarDrawer.tsx` | drawer 幅 `min(17rem, 88vw)`、tooltip/popover に `max-width: min(240px, …)` + viewport-safe inset |
| RC-5 共通画面・auth 狭幅 | AC-3, AC-5 | `auth.css`, `error.tsx`, `not-found.tsx`, `loading.tsx` | `width: min(100%, 420px)` + 安全 padding、中央寄せを 375px で検証 |

## 5. Acceptance Criteria（正本は phase-1。ここは要約）

- AC-1 共通ブレークポイント体系を CSS に固定し `globals.css` の混在境界を統一
- AC-2 公開層 6 ルートが 375/768 で横スクロール・はみ出し・隠れなし
- AC-3 会員層 2 ルート（login/profile）が 375/768 で崩れなし
- AC-4 管理層 8 ルートが 375/768 でテーブル/グリッド/サイドバーが崩れず要素が画面外に隠れない
- AC-5 共通 3 画面（error/not-found/loading）が 375/768 で中央表示維持
- AC-6 全固定幅/最小幅グリッドを mobile-first 単カラム→md/lg 多カラムへ。`minmax(Nrem,…)` 最小値起因はみ出し解消
- AC-7 管理テーブルにモバイルフォールバック（カード積み or sticky min-width 横スクロール + 可視性確保）
- AC-8 popover/tooltip/drawer/modal がビューポート内に収まる（clamp/flip/max-width）
- AC-9 design token 不変条件遵守（HEX 禁止・tokens.css 正本）、API/D1/Form 非変更（不変条件 #1 #5）
- AC-10 Playwright visual baseline（mobile 375 / tablet 768）を 19 ルート相当でグリーン

## 6. 不変条件（CLAUDE.md / UI prototype alignment）

1. 既存 API のみ接続。新 endpoint・D1 schema・Form 仕様変更禁止（#1 #5）。
2. OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` 禁止。CI `verify-design-tokens` で fail（#2）。
3. プロトタイプ primitives 群で構成。新規 primitive を生やさない（#3）。
4. `apps/web` から D1 binding 禁止（#4）。
5. 新規テストは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。
6. `127.0.0.1:8888` 等ローカル限定エンドポイントの焼き込み禁止（task-18 grep gate）。

## 7. 検証コマンド（全 Phase 共通）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__
mise exec -- pnpm exec playwright test apps/web/playwright/tests/visual-full/full-visual.spec.ts
git diff --name-only -- apps/api   # 空であること（AC-9 / 不変条件 #1 #5）
```
