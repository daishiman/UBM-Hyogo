<!-- workflow: members-list-ux-clarity / phase: 1 -->

# Phase 1 — 要件定義 (members-list-ux-clarity)

> Workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> Branch: `feat/members-list-ux-clarity`
> 実装区分: 実装仕様書 (CONST_004) / taskType=implementation / visualEvidence=VISUAL
> 状態: `spec_created`

## 1. 背景

`/members` 公開ページは既にプロトタイプとの構造整合が完了している (`completed-tasks/members-list-prototype-alignment/`)。しかし
**「ユーザーがその UI を見て、何ができて、何が起こっているのかが即座にわからない」**という UX 課題が現状残っている:

1. **DensityToggle (ゆったり/密/リスト)** — Segmented で 3 択並ぶが、各モードが「カード情報量の差」を意味することはラベルだけでは伝わらない。
   試行錯誤でクリックして初めて差を理解する状態。
2. **MemberFilters** — キーワード / ゾーン / 種別 / 並び替えは入力・選択した瞬間に URL replace で即発火するが、画面上「適用ボタンが無いことが意図的である」ことを示す affordance がない。
   ユーザーは「絞り込みボタンを探す」or「未確定なのではと不安になる」状態に陥る。
3. **適用中の条件** — タグについては `SelectedTagsBar` が chip 列で可視化しているが、キーワード/ゾーン/種別/並び替えは
   各 Select の現在値からしか読めず、「いま何が効いているか」のサマリが無い。
4. **クリアボタン** — `[data-role="clear"]` で常時表示。`disabled={!hasFilters}` で見た目はグレーアウトするが、絞り込みが効いているときに目立つ仕掛けが弱く、
   配置も filter-grid 末尾のため「クリアできることに気付かない」報告がある。

これらは「機能としては正しく動く」が「ユーザーがその意図を読み取れない」という affordance 層の課題であり、
コード差分は小さいが UX への寄与は大きい。プロトタイプ正本 (`pages-public.jsx`) と既存 design tokens を尊重しつつ補助情報を厚くする。

## 2. ペルソナ・前提

- **P-1 初回訪問の一般会員/見学者**: メンバー検索目的。density 切替の意味を直感で理解したい。
- **P-2 既存会員 (キーワードで人を探す)**: 即発火する filter 仕様の恩恵を受けるが、「適用中条件」が見えないとリセット忘れに繋がる。
- **P-3 a11y (スクリーンリーダー / キーボード) 利用者**: 件数変化・適用中条件・モード切替を音声で把握したい。

## 3. Goal

- 「density 各モードがどんなときに役立つか」を画面上で 2 秒以内に判別可能にする
- 「filter は入力すると即反映される」ことを画面上で明示する
- 「いま適用中の絞り込み条件」を chip 列で一覧表示し、クリック (or × ボタン) で個別解除できる
- 「クリア」は絞り込みが効いているときだけ視覚的に強調する
- `aria-live=polite` で件数変化をスクリーンリーダーに通知する

既存 API surface / URL query / D1 schema / Google Form / design tokens / primitives 構成は変更しない。

## 4. 受入条件 (AC)

| ID | 内容 |
| -- | ---- |
| AC-1 | `DensityToggle` の各 option ラベルの下に sublabel (`カード詳細` / `カード簡易` / `1行リスト` 程度の 1 行) を表示し、`aria-description` (もしくは visually-hidden `<span>` で説明) を提供する。プロトタイプの主ラベル ("ゆったり/密/リスト") は変更しない。 |
| AC-2 | `DensityToggle` の右側に `?` HelpHint icon を 1 つ配置し、hover/focus/click で「どのモードがどんな用途向けか」を 3 行程度の popover で説明する。HelpHint は既存 primitive (`<details>` ベースの軽量実装 or `<button>` + `<dialog>` でも可)。新 primitive 追加禁止。 |
| AC-3 | `MemberFilters` のキーワード Search 入力欄の下に "入力すると即時反映されます" microcopy を 1 行表示する (`<small data-role="live-filter-hint">`)。`data-component="member-filters"` ルートに `aria-describedby` で紐付けする。 |
| AC-4 | `MemberFilters` に `aria-live="polite"` の `<output data-role="result-count">` 領域を持ち、結果件数 (`X 件中 Y 件表示` のような short form) を表示する。page.tsx から `totalCount` / `displayedCount` を prop で受け取る。 |
| AC-5 | `SelectedTagsBar` を `SelectedFiltersBar` に一般化し、キーワード `q` / `zone` / `status` / 各 tag を `Chip` として表示し、× クリックで該当条件を解除する。`sort` はURL queryとして維持するが、絞り込み条件ではなく表示順のためchip対象から除外する。タグ 0 件かつ他絞り込みも無い場合は描画しない (現状の SelectedTagsBar 互換)。 |
| AC-6 | 「クリア」ボタンは `SelectedFiltersBar` の右端に統合し、`hasFilters=true` のときだけ `variant="primary"` 相当の強調表示を行う。`hasFilters=false` のときは描画しない (現状の `disabled` 表示を廃止)。 |
| AC-7 | 全 AC を満たした状態で `verify-design-tokens` CI gate が GREEN を維持する (HEX 直書き 0 件、新 primitive 追加 0 件)。 |
| AC-8 | Playwright visual baseline `members-ux-clarity.spec.ts` が 4 viewport (375 / 768 / 1024 / 1440) × 3 density × 2 state (empty / filtered) で撮影され、masked region で時刻依存値を除外している。 |
| AC-9 | `aria-live=polite` 領域への announce が ScreenReader 上で件数変化を読み上げることを、component spec (testing-library) で `getByRole("status")` 経由検証する。 |

## 5. Inventory (変更対象ファイル — 暫定見積)

| 種別 | パス | 推定行数差分 | 改修内容概要 | 担当タスク |
| ---- | ---- | ------------ | ------------ | ---------- |
| 修正 | `apps/web/src/components/public/DensityToggle.client.tsx` | +60 / -5 | sublabel / aria-description / HelpHint 追加 | A |
| 修正 | `apps/web/src/components/ui/Segmented.tsx` | +10 / -2 | option 型に `sublabel?: string` / `description?: string` 追加 (後方互換) | A |
| 修正 | `apps/web/src/components/public/MemberFilters.client.tsx` | +100 / -30 | live-filter hint / `result-count` output / `SelectedFiltersBar` 統合 / clear 配置 | B |
| 修正 / 追加 | `apps/web/src/components/public/SelectedTagsBar.client.tsx` + `SelectedFiltersBar.client.tsx` | +120 / -40 | q/zone/status/tag を統一 chip 列で表示。sortはchip対象外 | B |
| 修正 | `apps/web/app/(public)/members/page.tsx` | +20 / -5 | `totalCount` / `displayedCount` を `MemberFilters` に渡す | C |
| 修正 | `apps/web/src/styles/legacy-public.css` | +120 / -10 | sublabel / hint / chip 列 / 強調 clear button | A/B/C 並走 |
| 修正 | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | +30 | AC-1, AC-2 検証 | A |
| 修正 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | +40 | AC-3..AC-6, AC-9 検証 | B |
| 新規 | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | +60 | chip 列描画 / × 解除 / 空状態未描画 | B |
| 新規 | `apps/web/playwright/tests/members-ux-clarity.spec.ts` | +120 | visual baseline 4×3×2 | C |

> 確定的な inventory は Phase 4 の各 tasks/<slug>.md で再確定する (本表は粒度の見積)。

## 6. Out-of-scope

- `/members/[id]` 詳細ページの UX 改善
- API endpoint / D1 schema / Google Form schema 変更
- 新 primitive (Modal / Dialog / Popover) の追加 — HelpHint は `<details>` ベース or 既存 element 合成で実装する
- design tokens (OKLch 値) の変更
- ペジネーション / 並び替えロジックの変更
- mobile 折りたたみ (`FiltersSummaryMobile`) の構造変更 (件数表示 prop 追加までは許容)

## 7. リスク

| ID | リスク | 対策 |
| -- | ------ | ---- |
| R-1 | `SelectedTagsBar` の rename で外部参照が壊れる | `git grep -n SelectedTagsBar` で全参照を Phase 2 冒頭で洗い出し、export 名は alias で互換維持 |
| R-2 | `aria-live` 多重宣言で SR が cluttered になる | `MemberFilters` ルートに 1 つだけ配置し、それ以外には付与しない |
| R-3 | HelpHint popover で focus trap / ESC ハンドリングが甘いと a11y 違反になる | `<details><summary>` ベースで native 挙動を活用し、focus trap を独自実装しない |
| R-4 | "結果件数" 通知が頻発しすぎて SR が読み続ける | `aria-live=polite` (assertive 禁止) + 値が変化した時のみ DOM 更新 |
| R-5 | Playwright visual baseline が CI で flaky | masked region (時刻系) を `mask:` 指定し、baseline は Linux 上で撮影 (user-gated) |
| R-6 | density sublabel 追加で Segmented のレイアウトが崩れる (mobile) | Phase 2 で sublabel は `<small>` で 2 行構成にし、mobile breakpoint で sublabel を visually-hidden に切り替える設計を確定する |

## 8. carry-over 確認

- `DensityToggle` 主ラベル "ゆったり / 密 / リスト" はプロトタイプ正本順位 (INV-5) を維持するため変更しない
- `density="comfy"` は URL query に書かないデフォルト (`comfy=未指定`) を維持
- `SelectedTagsBar` rename 後も呼び出し API (`selected` / `onRemove` / `onClearAll`) は維持し、新規 `extraFilters` prop で q/zone/status/sort を渡す加法的拡張で実装する
- `MemberTable` legacy component は本ワークフローでは参照しない (`density="list"` 経路は `MemberGrid` を使う既存挙動を維持)

## 9. P50 チェック (実装 50% 想定の現実性)

- 3 タスク合計推定 +600 / -90 LOC (CSS 含む)、新 primitive 0、API 変更 0
- Task A/B は並列着手可、Task C は A/B 完了後に統合
- TDD 順序: component spec を赤化 → 実装で緑化 → Playwright baseline で構造証跡
- 実装時間目安: 1 日 (visual baseline 撮影含む)

## DoD

- [x] AC-1..AC-9 が本文に列挙されている
- [x] inventory が「種別 / パス / 推定行数差分 / 改修内容 / 担当タスク」を持つ
- [x] Out-of-scope / リスク / carry-over がそれぞれ独立節として存在する
- [x] CLAUDE.md UI alignment 不変条件 #1〜#4 への準拠を明文化
- [x] テスト命名規則 (`*.spec.tsx` のみ) を明文化
- [x] `taskType=implementation` / `visualEvidence=VISUAL` を Phase 1 メタで宣言
