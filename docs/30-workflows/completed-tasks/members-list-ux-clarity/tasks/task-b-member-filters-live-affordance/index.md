<!-- workflow: members-list-ux-clarity / task: B / phase: index -->

[実装区分: 実装仕様書]

# Task B — member-filters-live-affordance

> 親 Workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> Branch: `feat/members-list-ux-clarity`
> taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
> 状態: `spec_created`

## 1. 概要

`MemberFilters` の即発火 (live filter) 挙動をユーザーに伝える UX 強化タスク。
親 workflow の AC-3 / AC-4 / AC-5 / AC-6 / AC-9 を本タスクが担当する。
Task A (DensityToggle) / Task C (page 統合 + visual baseline) とは独立に進められる単独タスク。

### 主責務

1. 検索バー下に「入力すると自動で絞り込まれます」ヒント文を追加し、`aria-describedby` で root に紐付ける
2. 結果件数 `<output aria-live="polite">` 領域を追加し、Task Cで`page.tsx`から渡す件数 prop を受け取って通知する
3. `SelectedTagsBar` を `SelectedFiltersBar` に汎化し、`q` / `zone` / `status` / 各 `tag` を統一 chip 列で可視化する (sort は除外)
4. クリアボタンを `SelectedFiltersBar` 右端に統合し、`hasFilters=true` のときだけ強調表示する
5. URL query 互換 (INV-2) は完全維持し、新規 primitive を追加しない (INV-3)

### スコープ外

- `DensityToggle` の改修 (Task A)
- `/members/page.tsx` の visual baseline 撮影 (Task C)
- 件数表示の debounce / spinner 系演出 (親 Phase 3 で却下済)
- sort を chip 化する案 (親 Phase 3 で却下済)
- `FiltersSummaryMobile` の構造変更 (件数文言反映までは許容)

## 2. 不変条件 (本 task で守る)

| ID | 不変条件 |
| -- | -------- |
| INV-1 | 既存 API endpoint surface を維持 |
| INV-2 | URL query (`q`/`zone`/`status`/`sort`/`tag`/`density`) を正本として維持 |
| INV-3 | 新 primitive を生やさない。`FormField` / `Search` / `Select` / `TagPicker` / `Chip` のみ使用 |
| INV-4 | OKLch tokens (`--ubm-color-*`) のみ。HEX 直書き禁止 |
| INV-5 | プロトタイプ正本 (`claude-design-prototype/pages-public.jsx`) と矛盾しない |
| INV-7 (本 task 固有) | 既存 `MemberFilters.client.spec.tsx` の全 7 ケースを GREEN のまま維持 (selector / aria-label / data-role 後方互換) |

## 3. Phases

| Phase | 名称 | 主成果物 |
| ----- | ---- | -------- |
| 1 | 要件定義 | `phase-1-requirements.md` |
| 2 | 設計 | `phase-2-design.md` |
| 3 | 設計レビュー | `phase-3-design-review.md` |
| 4 | テスト計画 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | テスト追加 | `phase-6-test-additions.md` |
| 7 | カバレッジ | `phase-7-coverage.md` |
| 8 | リファクタ | `phase-8-refactor.md` |
| 9 | QA | `phase-9-qa.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト | `phase-11-manual-test.md` + `outputs/phase-11/manual-test-result.md` |
| 12 | ドキュメント同期 | `phase-12-documentation.md` + 親root `../../outputs/phase-12/*` への集約 |
| 13 | PR作成 | `phase-13-pr.md` + `outputs/phase-13/pr-creation-result.md` |

## 4. 主要変更ファイル (確定値は phase-5)

| 種別 | パス | 概要 |
| ---- | ---- | ---- |
| rename | `apps/web/src/components/public/SelectedTagsBar.client.tsx` → `SelectedFiltersBar.client.tsx` | API 汎化 + 後方互換 wrapper |
| 修正 | `apps/web/src/components/public/MemberFilters.client.tsx` | hint / live region / 件数 prop / chip 列統合 / clear 配置 |
| 連携 | `apps/web/app/(public)/members/page.tsx` | `totalCount` / `displayedCount` prop 受け渡しは Task C が担当 |
| 修正 | `apps/web/src/styles/legacy-public.css` | hint / live region / chip 列強調 clear button のスタイル |
| 修正 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | AC-3..AC-6 / AC-9 ケース追加・既存ケース後方互換維持 |
| 新規 | `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx` | chip 列描画 / × 解除 / 空状態未描画 |

## 5. 受入条件 (親 AC からの担当分)

| ID | 内容 |
| -- | ---- |
| AC-3 | 検索 Search 下に `<small data-role="live-filter-hint" id="member-filters-hint">入力すると自動で絞り込まれます…</small>` を表示し、`form[role=search]` に `aria-describedby="member-filters-hint"` を付与する |
| AC-4 | `<output data-role="result-count" aria-live="polite" aria-atomic="true">` 領域を `data-role="filters-body"` 末尾に配置し、`page.tsx` から `totalCount` / `displayedCount` を受けて文言を生成する |
| AC-5 | `SelectedFiltersBar` (旧 `SelectedTagsBar` の汎化) が `q` / `zone` / `status` / 各 tag を統一 chip 列で表示し、`onClearOne(key)` で個別解除できる。`sort` は除外する |
| AC-6 | clear ボタンを `SelectedFiltersBar` 右端に統合し、`hasFilters=true` のときだけ描画する。`disabled` 状態の常時表示は廃止する |
| AC-9 | `MemberFilters.client.spec.tsx` で aria-live 領域への announce が `getByRole("status")` 経由で検証される |

## 6. 1 サイクル完了スコープ (CONST_007)

- 推定 LOC: +260 / -60
- 新規 primitive: 0
- API / D1 schema / Google Form / token 変更: 0
- 既存 spec 後方互換維持 + 新規 spec 1 本
- Task A / C と独立並列着手可能

## 7. 関連ドキュメント

- 親 Phase 1: `../../phase-1-requirements.md`
- 親 Phase 2: `../../phase-2-design.md` (§ 3 が本タスク詳細)
- 親 Phase 3: `../../phase-3-design-review.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`
- CLAUDE.md UI alignment 不変条件 #1..#4
