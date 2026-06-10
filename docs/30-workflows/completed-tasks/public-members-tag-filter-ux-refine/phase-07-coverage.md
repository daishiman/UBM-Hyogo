# Phase 7: テストカバレッジ確認

| 項目 | 値 |
|------|-----|
| Phase | Phase 7 — カバレッジ確認 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local` |
| taskType | `implementation`（UI 表現層改善・CSS 主体） |
| visualEvidence | `VISUAL`（CSS の視覚確認は Phase 11 screenshot に委譲） |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) / [`phase-03-design-review.md`](./phase-03-design-review.md) |

> 本 Phase の全記述は `_shared-context.md` を正本とし、矛盾してはならない。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 7 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 0. カバレッジ方針（CSS 主体改修の特性）

本タスクは **CSS（`legacy-public.css` / `globals.css`）への追加ルール + 最小 markup（`filter-group` ラッパ 1 個）** が変更の主体である。CSS の視覚結果（flex 横並び・gap・accent 塗り）は jsdom では算出スタイルを検証できないため、**視覚は Phase 11 screenshot（mobile/desktop）に委譲**し、本 Phase（vitest）では以下の **DOM 構造・属性ロジック** のみをカバレッジ対象とする。

| 検証層 | 対象 | 検証手段 |
|--------|------|---------|
| DOM 構造 | `[data-role="filter-group"]` ラッパの存在、`[data-role="tag-picker-options"]` 配下の `<li>` 列構造 | vitest（jsdom）|
| 属性ロジック | `aria-checked` のトグル反映、`aria-disabled`（上限到達）、`role="switch"` 不変 | vitest（jsdom）|
| 視覚（flex 横並び・gap・accent 強調塗り・grid gap） | AC-1 / AC-2 / AC-3 / AC-4 の見た目 | **Phase 11 screenshot に委譲（jsdom 対象外）** |

> jsdom は CSS の computed layout（flex 方向・折り返し）を再現しない。したがって「横並びになったか」を DOM assert で証明することはできない。本 Phase では `data-role="tag-picker-options"` / `filter-group` の **存在と入れ子関係**、および `aria-checked` の **値の反映**までを担保し、視覚成立は Phase 11 に明示委譲する。

## 1. 対象ファイル別カバレッジ目標

| ファイル | 種別 | line 目標 | branch 目標 | 根拠 |
|---------|------|----------|------------|------|
| `apps/web/src/components/public/TagPicker.client.tsx` | 編集（最小 or 無変更） | 既存維持（≥ 既存値） | 既存維持 | DOM 構造不変（`role="switch"` / `aria-checked` / 上限 hint / empty option）。横並びは CSS のため新規分岐なし。既存 spec が緑であれば既存 coverage を割らない（AC-5 回帰） |
| `apps/web/src/components/public/MemberFilters.client.tsx` | 編集（最小） | 既存維持（≥ 既存値） | 既存維持 | 追加は `<div data-role="filter-group" data-group="inputs">` ラッパ 1 個のみ。URL query 正本ロジック（`update` / `onTagToggle` / `router.replace`）は不変＝新規分岐ゼロ |
| `apps/web/src/components/public/MemberGrid.tsx` | 無変更 | 既存維持 | 既存維持 | DOM 不変（CSS gap 調整で過密吸収）。回帰確認のみ |
| `apps/web/src/components/public/MemberCard.tsx` | 無変更 | 既存維持 | 既存維持 | DOM 不変。回帰確認のみ |
| `apps/web/app/(public)/members/page.tsx` | 無変更 | 既存維持 | 既存維持 | Server Component。CSS/markup 変更が page 描画契約に影響しないこと |

> **新規プロダクションコード分岐はゼロ**（CSS 追加 + ラッパ 1 個）。したがって本タスクのカバレッジ DoD は「**既存 coverage を割らない（回帰なし）**」であり、新規 % 目標の純増は発生しない。新規 spec assertion は構造存在確認の追加に限る。

## 2. jsdom で検証する DOM/属性ロジック（spec 追加・更新点）

Phase 4 で設計したテスト観点のうち、vitest（jsdom）で実行可能なものを以下に固定する。

| ID | 対象 spec | 検証内容 | AC |
|----|----------|---------|-----|
| COV-1 | `TagPicker.client.spec.tsx` | `[data-role="tag-picker-options"]` が存在し、その配下に候補数分の `<li>`（各 `data-component="tag-pill"` を内包）が列挙される | AC-1（構造）/ AC-5 |
| COV-2 | `TagPicker.client.spec.tsx` | tag-pill クリックで `aria-checked` が `false`↔`true` にトグルし、`onTagToggle` が呼ばれる（既存挙動回帰） | AC-3（値反映）/ AC-5 |
| COV-3 | `TagPicker.client.spec.tsx` | 上限（`TAG_LIMIT`）到達時、未選択 chip に `aria-disabled="true"` が付与され、選択中 chip（`aria-checked="true"`）は disabled にならない（MINOR-1 の共存しない不変） | AC-5 |
| COV-4 | `TagPicker.client.spec.tsx` | `tag-limit-hint`（`aria-live="polite"`）の表示挙動が不変 | AC-5 / AC-10 |
| COV-5 | `TagPicker.client.spec.tsx` | empty option（候補ゼロ時）の表示が不変 | AC-5 |
| COV-6 | `MemberFilters.client.spec.tsx` | `[data-role="filter-group"][data-group="inputs"]` が存在し、`filter-grid` と `result-count` を内包する | AC-2（構造） |
| COV-7 | `MemberFilters.client.spec.tsx` | 検索 / Select（区画・種別・並び替え）/ タグトグルの URL query 反映が不変（`getByRole` / `getByLabelText` ベースで階層非依存に検証） | AC-5 / 回帰 |

> COV-6 / COV-7 は MINOR-2（既存 spec の DOM 階層依存）対策として、assertion を `getByRole` / `getByLabelText` ベースへ寄せ、`filter-group` ラッパ追加で階層が 1 段深くなっても失敗しないようにする（Phase 3 §3 MINOR-2）。

## 3. 視覚カバレッジの委譲（Phase 11 screenshot）

以下は jsdom 対象外であり、Phase 11 の local static screenshot（mobile/desktop）で確認済み。staging data-backed screenshot は user-gated。

| AC | 視覚確認項目 | screenshot 観点 |
|----|------------|----------------|
| AC-1 | tag-pill の横並び（flex-wrap）と折り返し行間 | デスクトップ / モバイル展開時に縦積みが解消され、折り返しが整っている |
| AC-2 | フィルタ領域のグルーピング階層 | 入力フィルタ群とタグ群が border-top / 余白で視覚分離 |
| AC-3 | 選択中タグの accent 強調 | `aria-checked="true"` chip が accent 塗りで判別可能 |
| AC-4 | member-grid の過密緩和（comfy gap 24px） | comfy/dense/list 3 密度が維持され comfy の余白が増えている |
| AC-9 | レスポンシブ wrap | mobile 折りたたみ展開時もタグが wrap し破綻なし |

## 4. 実行コマンド

vitest の root は repo ルートのため `--root=../..` + `apps/web/...` フルパス指定が必要（MEMORY 既知の罠）。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --coverage \
  apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberGrid.spec.tsx \
  apps/web/src/components/public/__tests__/MemberCard.spec.tsx \
  "apps/web/app/(public)/members/page.spec.tsx"
```

> focused verification は本サイクルで実行済み。coverage 出力（`coverage-final.json` 等）の保存は要求しない。

## 5. リポジトリ全体 threshold への影響

- 新規プロダクション分岐ゼロ・新規ファイルゼロのため、リポジトリ全体の coverage threshold（`coverage-guard` / vitest config）に対する drift は発生しない見込み。
- `pre-push` の `coverage-guard`（`--changed` モード）は変更ファイル（`apps/web/src/components/public/*` + `styles/*`）の既存 coverage を割らないことで pass する。CSS ファイルは coverage 対象外。

## 6. 完了条件

- [x] CSS 主体改修のカバレッジ方針（DOM/属性は vitest・視覚は Phase 11 委譲）を明記
- [x] ファイル別カバレッジ目標（新規分岐ゼロ＝既存 coverage 非劣化）を明示
- [x] jsdom 検証点（COV-1..7）と AC 対応を固定
- [x] 視覚カバレッジの Phase 11 委譲を明示
- [x] 実行コマンド（vitest root `--root=../..` 罠込み）を明示
- [x] リポジトリ全体 threshold への非影響を記録
