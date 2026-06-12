# Phase 7: カバレッジ — 変更ブロック限定の担保設計

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-5-implementation.md](phase-5-implementation.md)（変更ファイル）/ [phase-6-test-additions.md](phase-6-test-additions.md)（TC-6-*）/ [shared-context.md](shared-context.md)
- 注記: カバレッジ目標は**変更ファイル/変更ブロックに限定**する（広域指定を避ける・Feedback BEFORE-QUIT-002）。

## 目的

本タスクの変更（大半が CSS / breakpoint・少量の TSX 属性）に対し、計測可能な単体カバレッジ対象（SidebarDrawer 変更行）と、計測不能な対象（CSS）を visual baseline + 構造 spec で代替担保する設計を確定する。

## 実行タスク

1. 変更対象を「単体カバレッジ計測対象」と「visual/構造代替対象」に分類する。
2. 計測対象の line/branch 想定値を確定する。
3. カバレッジ対象外を明記する（広域指定回避）。

## カバレッジ対象分類

| 変更ファイル | 計測手段 | 目標 |
| --- | --- | --- |
| `apps/web/src/components/shell/SidebarDrawer.tsx`（幅クラス変更行） | vitest jsdom（SidebarDrawer.spec.tsx TC-4-22..23） | 変更行 line 100% / drawer open 分岐 branch 既存維持 |
| `apps/web/app/error.tsx` / `not-found.tsx` / `loading.tsx`（container className） | 既存 route render spec（あれば）/ visual | className 文字列の構造担保（line は className 変更のみ・ロジック分岐なし） |
| `apps/web/src/styles/{tokens,globals,legacy-public,auth}.css` | **計測対象外**（CSS はカバレッジ計測対象外） | visual baseline + 構造 spec で代替担保 |
| `apps/web/playwright/fixtures/viewports.ts`（additive 定数） | Playwright 利用で間接 | 新 viewport が spec で参照される |
| `apps/web/playwright/tests/visual-full/full-visual.spec.ts`（新規） | spec 自体（テストコードは計測対象外） | 19 ルート × viewport を網羅 |

## 計測対象の想定値（変更ブロック限定）

- `SidebarDrawer.tsx`: 変更は className リテラル 1 行のみ（`w-[17rem] max-w-[85vw]` → `w-[min(17rem,88vw)]`）。新規分岐なし → **変更行 line 100% / branch 既存維持（新規 0）**。
- `error/not-found/loading.tsx`: container className の文字列変更のみ。新規条件分岐なし → ロジックカバレッジへの影響なし。

## CSS の代替担保（計測不能対象）

CSS は line/branch カバレッジを持たないため、以下 2 系統で「変更が機能している」ことを担保する:

1. **Playwright visual baseline**（AC-10 / TC-4-*）: 横スクロール 0・主要要素 viewport 内・スナップショット差分で、メディアクエリ境界統一・grid 流体化・テーブル可視性・オーバーレイ収納の効果を実ブラウザで検証。
2. **構造 spec**（TC-4-22..23）: drawer 幅クラスの文字列含有を jsdom で固定。

## カバレッジ対象外（明記・広域指定回避）

以下は本タスクのカバレッジ目標**対象外**とする:

- CSS ファイル全行（計測手段なし・visual で代替）。
- 変更しない既存 component / route のロジック（本タスクは表現層 CSS 中心・ロジック非変更）。
- `apps/api` / D1 / Form（AC-9 で非変更を保証）。
- 19 ルートの page component 本体（CSS/属性 additive のみで component ロジック非変更）。

## 検証コマンド（変更スコープ限定）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx
```

> 全体カバレッジしきい値の引き上げは行わない（変更は CSS 中心で line/branch を増やさないため）。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `int-test-*.md`（カバレッジ方針）, `architecture-*.md`（表現層の計測境界）。
- プロジェクト: `vitest.config.ts`, `apps/web/playwright.config.ts`。

## 成果物

- 本ファイル（カバレッジ）。計測対象/代替対象の分類・想定値・対象外明記・限定検証コマンド。

## 統合テスト連携

- 上流: Phase 6 のテスト追加。
- 下流: Phase 8 リファクタが本カバレッジを退行させないことを確認。

## 完了条件

変更ブロック限定のカバレッジ目標と CSS の visual/構造代替担保が確定し、対象外が明記されて広域指定が排除されていること。
