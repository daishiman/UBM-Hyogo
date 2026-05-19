# UT-DSF-01: parallel-01 globals.css page-level rhythm 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-DSF-01 |
| タスク名 | parallel-01 globals.css @layer components で page-level rhythm を機械化 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-05-19 |
| 既存タスク組み込み | あり |
| 組み込み先 | ui-prototype-design-system-foundation / parallel-01-globals-css-rhythm |

## 目的

`apps/web/src/styles/globals.css` の `@layer components` に、プロトタイプ
（`docs/00-getting-started-manual/claude-design-prototype/styles.css`）の **page-level rhythm**
（page surface / section rhythm / card chrome / shell surface / typography scale）を
selector ベースで翻訳し、全 route が `data-route` / `data-section` / `data-card` / `data-shell` /
`data-text` 等の attribute だけで雰囲気を継承できる仕組みを完成させる。

正本仕様は `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/`
配下の Phase 1-13 spec 群で既に作成済み。本タスクは spec を読み出してコード実装と evidence 取得まで完遂する。

## スコープ

### 含む

- `apps/web/src/styles/globals.css` の `@layer components` 末尾に、page surface / section rhythm /
  card chrome / shell surface / typography scale の 5 ブロックを selector ベースで追加
- 以下の data-* contract を全て満たす selector 規則の追加:
  - `body` / `[data-route]` の page surface 背景
  - `[data-section]` / `[data-section-rhythm="compact|comfortable"]` の縦余白段階
  - `[data-card]` / `[data-card-tone="panel|surface|emphasis"]` の背景・陰影・border
  - `[data-shell="topbar|sidebar|footer"]` の AppShell 共通 chrome
  - `[data-text="display|title|section|card|body|caption|eyebrow"]` の typography scale
- 全 token を `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` /
  `var(--ubm-shadow-*)` 経由とすることの grep 確認
- `pnpm typecheck` / `pnpm lint` / `pnpm build` の green 確認
- Phase 11 evidence（screenshot / DOM scrape）の取得

### 含まない

- `apps/web/src/styles/tokens.css` の編集（既存維持）
- selector ベースの動的規則（tag pill / member card hover / `[data-visibility]`）
  — parallel-02（UT-DSF とは別 SW）の責務
- 新規 primitive 追加 / 既存 primitive の props 変更
- `page.tsx` / `layout.tsx` の編集（UT-DSF-02 / UT-DSF-04 の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 前提 | parallel-02-prototype-css-rules-port（local 実装済み） | tokens.css / globals.css の既存規則と衝突しないことを前提とする |
| 並列 | UT-DSF-02（parallel-03 AppShell layouts） | data-shell / data-route hook の利用側 |
| 並列 | UT-DSF-03（parallel-04 shared page chrome） | data-theme / root chrome の利用側 |
| 下流 | UT-DSF-04（serial-05 page routes blueprint binding） | data-section / data-card / data-text を 19 routes で使用 |

## 苦戦箇所・知見

**既存 `@layer base` / `@layer components` 規則との衝突**: `globals.css` L70-114 の `@layer base` と
L116-215 の既存 `@layer components`（parallel-09 由来の G9-1..7 規則）を破壊しないこと。新規 selector は
末尾に追加し、specificity は単一 attribute selector を基本とする。`!important` は禁止。

**Tailwind v4 specificity との衝突**: Tailwind v4 は `@layer utilities` を最後に評価するため、
`data-*` attribute selector が utility（`bg-*` 等）に上書きされる可能性がある。これを避けるため
本 SW は `@layer components` に閉じ、utility 側の bg/text 直書きを依然許容しない設計（`verify-design-tokens`
gate と整合）。

**`data-shell` 契約の sub-workflow 跨ぎ**: `data-shell="topbar|sidebar|footer"` は parallel-01（CSS 側）と
parallel-03（layout 側）の双方で同一文字列を使う契約。merge / rebase 時に typo（`top-bar` 等）を入れると
silent fail（規則がヒットしない）する。Phase 6 test plan の DOM scrape spec で grep を gate 化する。

**reduce-motion / focus-visible の既存規則維持**: `@layer components` 末尾の reduce-motion / focus-visible
ブロックを誤って削除しない。追加位置はこれらより上流（早期 cascade）に置く。

**CSS variable fallback**: `var(--ubm-color-surface-bg)` 未定義時の fallback を入れない（tokens.css が
正本のため fallback すると drift が見えなくなる）。

## 受け入れ基準

- [ ] `body` および `[data-route]` が背景色を cascade 経由で継承する
- [ ] `[data-section]` 配下が `data-section-rhythm` に応じた縦余白を持つ
- [ ] `[data-card]` 付与要素が panel 背景 / border / 陰影で表示される
- [ ] `[data-shell="topbar|sidebar|footer"]` で 3 種の chrome が一意に決まる
- [ ] `[data-text]` 7 段階の typography が機能する
- [ ] grep `bg-\[#` / `text-\[#` / 6桁 HEX 直書きが `apps/web/src/styles/` / `apps/web/app/` / `apps/web/src/components/` で 0 件
- [ ] `pnpm typecheck` / `pnpm lint` / `next build --webpack` が exit 0
- [ ] `verify-design-tokens` CI gate が green
- [ ] Phase 11 evidence inventory に screenshot 物理配置済み

## 参照

正本仕様（Phase 1-13）:

- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-01-requirements.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-02-architecture.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-03-task-breakdown.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-04-data-contract.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-05-implementation-guide.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-06-test-plan.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-07-quality-gates.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-08-dod.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-09-risks.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-10-local-verification.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-11-evidence-inventory.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-12-compliance-check.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/phase-13-commit-pr.md`

参考:

- `apps/web/src/styles/globals.css`（L11-215 既存）
- `apps/web/src/styles/tokens.css`（L1-147）
- `docs/00-getting-started-manual/claude-design-prototype/styles.css`（L60-323 翻訳元）
- `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
