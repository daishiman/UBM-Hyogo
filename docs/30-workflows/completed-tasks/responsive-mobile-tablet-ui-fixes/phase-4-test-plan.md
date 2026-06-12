# Phase 4: テスト計画 — レスポンシブ（携帯・タブレット）visual + 構造 spec

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-1-requirements.md](phase-1-requirements.md)（AC-1..AC-10）/ [phase-2-design.md](phase-2-design.md)（変更ファイル・CSS ブロック）/ [phase-3-design-review.md](phase-3-design-review.md)（PASS）/ [shared-context.md](shared-context.md)（19 ルート・ビューポート定義）
- 区分: 本タスクは **VISUAL** タスク。本 Phase は TDD Red 前提のテスト設計（仕様のみ・テスト実行はしない）。Phase 11 の screenshot-plan へ接続する。

## 目的

AC-2..AC-10 を検証可能なテストケースへ落とし込み、(a) Playwright visual spec（19 ルート × mobile/tablet）と (b) jsdom 構造 spec（drawer 幅）の 2 レーンを定義する。各テストケースに対象ルート・ビューポート・期待結果・対応 AC を 1:1 で紐付ける。

## 実行タスク

1. 検証レーンを 2 本に確定（Playwright visual / jsdom 構造）。
2. AC-2..AC-10 をテストケース TC-4-* に展開し、対象ルート × ビューポートを表で固定。
3. 新規/編集テストファイルパスと viewport fixture の追加点を確定。
4. Phase 11 screenshot-plan への接続点を明記。

## テストファイル（不変条件 #8: `.spec.ts(x)` のみ）

| 種別 | パス | 種別 | 対応 AC |
| --- | --- | --- | --- |
| Playwright visual | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` | 編集（既存 visual full に横スクロール 0 guard 追加） | AC-2..AC-8, AC-10 |
| jsdom 構造 | `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` | 編集（既存 55 行に幅クラス検証を additive） | AC-8 |
| runtime smoke | `outputs/phase-11/runtime-smoke-result.json` | 新規（375/390/768 の代表 viewport 実測） | AC-2..AC-5 |

> 既存 `apps/web/playwright/tests/visual-full/full-visual.spec.ts` は回帰 baseline として残し、横スクロール 0 guard を additive に追加する。

## ビューポート（[shared-context.md](shared-context.md) §1）

| 名称 | サイズ | 一次/補助 |
| --- | --- | --- |
| mobile | 390 × 844 | 一次（携帯基準） |
| mobile-narrow | 375 × 812 | 補助（最狭フォールバック・横スクロール 0 のみ厳格） |
| tablet | 768 × 1024 | 一次（タブレット基準） |
| desktop | 1280 × 800 | 回帰非破壊の確認用 |

## Playwright visual: 共通アサート方針

各ルート × 各 viewport で以下を順に検証する（TC 表の「共通検証」列に対応）。

1. **横スクロール 0**（AC-2..AC-6, AC-8 の核）:
   ```ts
   const overflow = await page.evaluate(() => {
     const el = document.scrollingElement!
     return el.scrollWidth - el.clientWidth
   })
   expect(overflow).toBeLessThanOrEqual(1) // 1px はサブピクセル丸め許容
   ```
2. **主要要素が viewport 内**（AC-2..AC-5, AC-8）: 対象要素の `boundingBox()` を取得し `box.x >= 0 && box.x + box.width <= viewport.width + 1` を assert。
3. **スナップショット**（AC-10）: `await expect(page).toHaveScreenshot('<route>-<viewport>.png')`。baseline は Phase 11 で確定。

## テストケース表（AC → ルート × viewport）

| TC | AC | 対象ルート | viewport | 期待結果 | 主要要素 boundingBox 対象 |
| --- | --- | --- | --- | --- | --- |
| TC-4-1 | AC-2 | `/` | mobile / mobile-narrow / tablet | 横スクロール 0・hero/stat-card grid が viewport 内 | `[data-component="stat-card"]`, hero 見出し |
| TC-4-2 | AC-2 | `/(public)/members` | mobile / mobile-narrow / tablet | filter bar 折返し・カード grid 単/多カラムが収まる | filter bar, member カード grid |
| TC-4-3 | AC-2 | `/(public)/members/[id]` | mobile / tablet | 2 カラム詳細が単カラム化し収まる | プロフィール本文コンテナ |
| TC-4-4 | AC-2 | `/(public)/register` | mobile / tablet | 本文幅が viewport 内・外部導線ボタン収まる | 案内本文, CTA |
| TC-4-5 | AC-2 | `/privacy` | mobile / tablet | LegalProse 幅・padding が収まる | `.ui-prose` |
| TC-4-6 | AC-2 | `/terms` | mobile / tablet | 同上 | `.ui-prose` |
| TC-4-7 | AC-3 | `/login` | mobile-narrow / mobile / tablet | auth card が中央・横スクロール 0・padding 安全 | `.auth-card` |
| TC-4-8 | AC-3 | `/profile` | mobile / tablet | フォーム grid 単カラム化・情報テーブルが隠れない | プロフィールフォーム, 情報テーブル |
| TC-4-9 | AC-4 | `/(admin)/admin` | mobile / tablet | KPI grid 単/多カラム・status 横バー収まる | KpiGrid, status バー |
| TC-4-10 | AC-4, AC-7 | `/(admin)/admin/members` | mobile / tablet | mobile=カード積み（全列 content 到達可能）/ tablet=横スクロールで隠れない | MembersTable 各 `td` |
| TC-4-11 | AC-4, AC-7 | `/(admin)/admin/tags` | mobile / tablet | tag-master-grid（640px min）が単カラム化し溢れない | tag-master-grid |
| TC-4-12 | AC-4 | `/(admin)/admin/meetings` | mobile / tablet | カード grid 単/多カラム収まる | meeting カード grid |
| TC-4-13 | AC-4, AC-1 | `/(admin)/admin/schema` | mobile / tablet | schema-glossary 3 カラム固定が lg 未満で単/2 カラム | `.schema-glossary` |
| TC-4-14 | AC-4, AC-7 | `/(admin)/admin/requests` | mobile / tablet | 申請一覧が隠れない | 申請一覧テーブル/リスト |
| TC-4-15 | AC-4, AC-7 | `/(admin)/admin/identity-conflicts` | mobile / tablet | 行 2 カラムが単カラム化・content 到達可能 | IdentityConflictRow |
| TC-4-16 | AC-4, AC-7 | `/(admin)/admin/audit` | mobile / tablet | `admin-audit-table` の content が横スクロールで到達可能 | `.admin-audit-table` |
| TC-4-17 | AC-5 | `error.tsx`（trigger 経路 or smoke） | mobile-narrow / mobile / tablet | 中央表示維持・狭幅 padding | エラーカードコンテナ |
| TC-4-18 | AC-5 | `not-found.tsx` | mobile-narrow / mobile / tablet | 同上 | not-found コンテナ |
| TC-4-19 | AC-5 | `loading.tsx`（smoke 経路 `app/__smoke__/loading-state`） | mobile / tablet | スピナー中央維持 | スピナーコンテナ |
| TC-4-20 | AC-8 | 管理シェル drawer（任意管理ルートで mobile drawer 開） | mobile-narrow / mobile | drawer の boundingBox が viewport 内（`x>=0 && x+width<=width+1`） | `SidebarDrawer` panel |
| TC-4-21 | AC-8 | user menu popover / shell tooltip | mobile / tablet | popover/tooltip が viewport 右端で見切れない | `.ui-sidebar-user-menu-popover`, `.ubm-shell-tooltip` |

> ルート列の `error.tsx`/`not-found.tsx`/`loading.tsx` の実体は `apps/web/app/error.tsx` / `apps/web/app/not-found.tsx` / `apps/web/app/loading.tsx`（+ `(public)` / `(admin)/admin` / `(member)/profile` / `(auth)/login` 配下の segment 別バリアント）。visual 経路は smoke ルート（`app/__smoke__/loading-state`, `app/smoke/loading-state`）または既存 visual harness を利用。

## jsdom 構造 spec（SidebarDrawer.spec.tsx 編集・AC-8）

既存 spec へ additive で以下を追加（既存ケースは不変）:

| TC | 検証 | 期待 |
| --- | --- | --- |
| TC-4-22 | drawer panel の className に幅クラスが含まれる | `w-[min(17rem,88vw)]` を含み、旧 `w-[17rem] max-w-[85vw]` を含まない |
| TC-4-23 | drawer が `open` 時にレンダリングされ panel が存在する | 既存 open 挙動を非破壊で保持 |

```tsx
// 追加アサート例（テスト実装は後続 Phase 5/03.実装 の責務。ここは仕様）
const panel = screen.getByRole('dialog') // 既存 query を流用（破壊しない）
expect(panel.className).toContain('w-[min(17rem,88vw)]')
expect(panel.className).not.toContain('max-w-[85vw]')
```

## TDD ステータスと screenshot-plan 接続

- 本タスクは **VISUAL**。Playwright snapshot baseline は Phase 11 の screenshot-plan で確定する（mobile 375/390・tablet 768）。
- TDD Red 前提だが本 Phase は **仕様のみ**でテスト実行・baseline 生成は行わない。Red→Green は後続 `03.実装.md`（実装）+ Phase 11（baseline 撮影）で実施。
- 構造 spec（TC-4-22..23）は実装後に `pnpm exec vitest run` で Green 化を確認する。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `ui-ux-*.md`（レスポンシブ検証観点）, `architecture-*.md`（テストレーン境界）。
- プロジェクト: `apps/web/playwright/fixtures/viewports.ts`（ビューポート正本）, `apps/web/playwright.config.ts`（Playwright 設定）。

## 成果物

- 本ファイル（テスト計画）。TC-4-1..TC-4-23・対象ルート × viewport・期待結果・対応 AC・新規/編集テストファイルパス。

## 統合テスト連携

- 上流: Phase 1 の AC-2..AC-10 / Phase 2 の CSS・component 変更。
- 下流: Phase 5（実装手順）が各 TC の Green 化に必要な CSS/component 変更を定義。Phase 11 が visual baseline を撮影。
- shared schema ownership なし（CSS / 属性のみ・並列 wave 依存なし）。

## 完了条件

AC-2..AC-10 が TC-4-* に 1:1 対応し、対象ルート × viewport・期待結果・テストファイルパスが `.spec.ts(x)` で確定していること。
