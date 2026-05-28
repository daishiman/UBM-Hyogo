# Phase 1 — 要件定義 (members-list-prototype-alignment)

> Workflow: `docs/30-workflows/members-list-prototype-alignment/`
> Branch: `feat/members-list-prototype-alignment`
> 実装区分: 実装仕様書 (CONST_004)
> 状態: `spec_created`

## 1. 背景

`/members` ページの骨格は既に実装されており、page header (eyebrow / h1 / lead) / `DensityToggle` / `MemberFilters` / 結果一覧 / `EmptyState` / pagination meta の流れで動作している。一方、以下の見た目がプロトタイプ (`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L208-334 + `MemberCardPublic` L155-205) と乖離している:

1. カード内の情報密度・順序 (zone chip 不在 / icon prefix 不在 / chip-row footer 不在)
2. `density="list"` で `MemberTable` を出すが、プロトタイプは 5 col row で表現している
3. `MemberFilters` の TagPicker 周辺に divider + 「タグで絞り込み」 eyebrow が無く視覚的階層が浅い
4. `EmptyState` が h2 + 説明文で大きく、プロトタイプの compact 表現 (28px icon + small text + ghost CTA) と乖離している

これらは UI-prototype-alignment / MVP recovery (CLAUDE.md) の不変条件 #3 (プロトタイプ正本順位) に違反した状態にあり、本タスクで整合させる。

## 2. Goal

`apps/web/app/(public)/members/page.tsx` の見た目を、現行 `GET /public/members` / `PublicMemberListItem` contract の範囲内で、プロトタイプ `pages-public.jsx` の `PublicDirectoryPage` + `MemberCardPublic` に近づける。`businessOverview` と list item `tags` は一覧 item contract に存在しないため、本 task では追加しない。

## 3. 受入条件 (AC)

| ID    | 内容                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `MemberCard` の comfy/dense カードは `fullName` / `nickname` / `occupation` / `location` / `ubmZone` / `ubmMembershipType` のみで構成し、一覧 contract にない `businessOverview` / `tags` を要求しない。 |
| AC-2  | カード head 右側に zone chip (`data-role="zone"` / `data-tone={zoneTone}` / dot) を表示する。zone が空文字または未指定の場合は描画しない。 |
| AC-3  | カード footer に `chip-row` を配置し、`ubmMembershipType` status chip を表示する。 |
| AC-4  | occupation / location は `Icon name="briefcase"` / `Icon name="map-pin"` を prefix として表示する。nickname は既存表示互換として `@` prefix を維持する。 |
| AC-5  | `MemberGrid` に `density="list"` を追加し、avatar / identity (name+occupation) / chip-row(zone+status) / location / `chevron-right` の 5 col 行で表示する。page.tsx は `density="list"` でも `MemberGrid` を使う (`MemberTable` への分岐撤去)。 |
| AC-6  | `MemberFilters.client.tsx` の filter grid 下に divider + heading「タグで絞り込み」 + `TagPicker` の順序を確立する。 |
| AC-7  | `EmptyState` に `variant?: "default" | "compact"` を追加し、filtered empty state で compact marker を出力する。 |
| AC-8  | 変更箇所すべてが既存 OKLch トークン (`--ubm-color-*` / `--ubm-radius-*` / `--ubm-space-*` / `--ubm-font-*`) のみを使用し、HEX 直書き 0 件・新規 primitive 追加 0 件である (CI gate `verify-design-tokens` PASS)。 |

## 4. Inventory (変更対象ファイル)

| 種別 | パス                                                                  | 推定行数差分 | 改修内容概要                                                                                  |
| ---- | --------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| 修正 | `apps/web/src/components/public/MemberCard.tsx`                       | +60 / -30    | head zone chip / icon prefix / status chip-row / density="list" 5 col 分岐     |
| 修正 | `apps/web/src/components/public/MemberGrid.tsx`                       | +20 / -2     | density 型に "list" 追加 / list 時に `MemberCard density="list"` 群を row 表示する        |
| 修正 | `apps/web/src/components/public/MemberFilters.client.tsx`             | +10 / -2     | filter grid 直下に divider + eyebrow + TagPicker のラッパ追加                                |
| 修正 | `apps/web/src/components/feedback/EmptyState.tsx`                     | +15 / -3     | `variant?: "compact"` prop / `data-component="empty-state"` `data-variant="compact"` を出力 |
| 修正 | `apps/web/app/(public)/members/page.tsx`                              | +5 / -10     | `MemberTable` import 削除 / `density="list"` でも `MemberGrid` に渡す                       |
| 修正 | `apps/web/src/styles/legacy-public.css`                               | +120 / -30   | `[data-component]` ベースの member-card / member-grid list / compact empty state style |
| 修正 | `apps/web/src/components/ui/{Icon.tsx,icons.ts}`                      | +30          | `briefcase` / `map-pin` / `chevron-right` icon name を追加 |
| 修正 | `apps/web/src/components/public/__tests__/MemberCard*.spec.tsx`       | +10          | AC-2..AC-5 / density variant 検証 |
| 修正 | `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx`        | +10          | AC-5 (list density / list header / card row) 検証 |
| 修正 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | +5        | AC-6 (heading + TagPicker) 検証 |
| 修正 | `apps/web/src/components/feedback/__tests__/EmptyState.component.spec.tsx` | +10     | AC-7 (compact variant) 検証 |
| 修正 | `apps/web/playwright/tests/members-prototype-alignment.spec.ts`       | +10          | current workflow path / MemberGrid list density visual selector |

## 5. 命名規則確認

- テストファイル: `*.spec.tsx` (CLAUDE.md 不変条件 #8) — `*.test.*` 不可
- React component file: 既存命名を踏襲 (`MemberCard.tsx`, `MemberGrid.tsx`)
- CSS / selector: 既存 `[data-component]` / `[data-role]` ベース (`member-card`, `member-grid`, `chip-row`, `empty-state[data-variant]`)
- prop 名: `density` (型 `"comfy" | "dense" | "list"`), `variant` (`EmptyState` で `"default" | "compact"`)
- data 属性: `data-component="empty-state"` / `data-variant="compact"` / `data-density="list"`

## 6. carry-over 確認

- `MemberTable.tsx` は legacy 互換のため残置する。page.tsx からは参照を外すが、ファイル削除はしない (他経路で参照されるリスクの予防保全)。
- `TagPicker.client.tsx` は heading slot 追加のみ行う。`DensityToggle.client.tsx` は変更しない。
- tokens.css の変更は本タスクで発生しない見込み (既存トークンで充足するため)。万一不足が判明した場合は phase-2 にて追記し本 phase-1 にも反映する。

## 7. Scope-Out

- `/members/[id]` 詳細ページの整合は別タスク (同サイクル内では扱わない)
- API endpoint / D1 schema / Google Form schema の変更
- 新規 primitive 追加 (`Avatar` 等の改変も含む)
- token (OKLch 値) の変更
- `MemberTable.tsx` の機能拡張 / 削除

## 8. リスク

| ID    | リスク                                                                                                                                                                                                | 対策                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| R-1   | `MemberGrid` の `density` 型変更が他箇所 (例: storybook / 他 page) で型エラーを生む                                                                                                                  | phase-2 で参照箇所を grep 一覧化し、page.tsx 1 ファイルのみであることを確認する                   |
| R-2   | `EmptyState` の API 拡張が既存呼び出し (`/profile` 等) の見た目を壊す                                                                                                                                  | `variant` の default を `"default"` にして既存挙動を維持。compact は opt-in                       |
| R-3   | プロトタイプ画像と実色味 (OKLch) で微差が出る                                                                                                                                                          | tokens.css の値を正本とし、プロトタイプ画像は構造・順序の正本のみとして扱う (UI alignment 不変条件 #3 注記) |
| R-4   | Playwright visual snapshot が baseline 未整備でゼロ比較になる                                                                                                                                          | phase-4 で baseline 生成手順を明示し、CI baseline コミットを user-gated とする                    |
| R-5   | 現行 list item contract にない `businessOverview` / `tags` を prototype 由来で要求してしまう | Phase 1 AC-1 と Phase 12 boundary で明示的に scope-out し、API/schema 変更を発生させない |

## 9. P50 チェック (実装 50% 想定の現実性)

- 6 ファイル修正 + 5 ファイル新規 = 11 ファイル / 推定 LOC ±500 行
- 単一 lane (component → CSS → page wiring → tests) で完結。並列 lane 不要。
- TDD 順序: spec を赤化 → component 実装で緑化 → visual snapshot 取得
- 実装時間目安: 半日〜1 日 (visual baseline 含む)

## DoD

- [x] このファイル本文に AC-1..AC-8 が列挙されている
- [x] inventory の各行が「種別 / パス / 推定行数差分 / 改修内容」を含む
- [x] scope-out / リスク / carry-over がそれぞれ独立節として存在する
- [x] CLAUDE.md UI alignment 不変条件 #1〜#3 への準拠を明文化している
- [x] テスト命名規則 (`*.spec.tsx` のみ) を明文化している
