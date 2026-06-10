# Phase 3: 設計レビューゲート

| 項目 | 値 |
|------|-----|
| Phase | Phase 3 — 設計レビュー |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) |


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 3 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 判定

**Phase 4（テスト設計）着手可** ✅ — blocker なし。

## 1. 4 条件 + 不変条件適合チェック

| 項目 | 判定 | 根拠 |
|------|------|------|
| 価値性 | ✅ | ユーザー報告「タグが縦積みで見にくい」を flex-wrap 横並び（§1）で直接解消。フィルタ階層整理・選択強調是正・過密緩和で公開一覧の発見性が向上 |
| 実現性 | ✅ | 既存 CSS への追加 + data-role 1 個追加のみ。新 endpoint / 新 primitive / 新ファイルゼロ。LOC 小規模で 1 サイクル完結（CONST_007） |
| 整合性 | ✅ | INV-1〜7 全遵守（下表）。CSS 正本は Phase 1 で実測確定済 |
| 運用性 | ✅ | Phase 11 で mobile/desktop screenshot 検証可能。`verify-design-tokens` / vitest で機械検証経路明確 |

### 不変条件 PASS 根拠

| INV | 判定 | 根拠 |
|-----|------|------|
| INV-1（新 endpoint 禁止） | ✅ | CSS/markup のみ。`apps/api/src/routes/` 非接触 |
| INV-2（OKLch トークン） | ✅ | 追加色は `--ubm-color-accent`（OKLch）・`--ubm-space-2/3/6`・`--ubm-color-border-default`。HEX 直書きゼロ。comfy gap の `18px` ベタ値はトークン化（改善方向） |
| INV-3（D1 直接禁止） | ✅ | `apps/web` から D1 binding 不使用 |
| INV-4（API/shared/D1/Form 不変） | ✅ | 変更は `apps/web/src/styles/` + `apps/web/src/components/public/` のみ。`topTags` データ shape 不変 |
| INV-5（.spec のみ） | ✅ | 編集対象 `MemberFilters.client.spec.tsx` / `TagPicker.client.spec.tsx` は既存 `.spec.tsx`。新規 `.test.*` なし |
| INV-6（新規 primitive 禁止） | ✅ | `components/ui/` 追加なし。Phase 2 §7 で明記。横並びは既存 data-* + CSS で実現 |
| INV-7（tag-pill 挙動不変） | ✅ | `role="switch"` / `aria-checked`（値）/ トグル / 上限 hint / empty option は不変。CSS は `aria-checked` を視覚反映するのみ（属性値・挙動を変えない） |

## 2. AC ↔ 設計要素 対応表

| AC | 満たす設計要素 | 検証 Phase |
|----|---------------|-----------|
| AC-1 横並び | §1.1 `tag-picker-options { display:flex; flex-wrap:wrap; gap:var(--ubm-space-2); }` + `> li { display:inline-flex; }` | Phase 4 DOM/CSS spec + Phase 11 |
| AC-2 グルーピング | §2.1 `filter-group` ラッパ + §2.2 group CSS + 既存 `tag-picker` border-top | Phase 4 spec + Phase 11 |
| AC-3 選択強調 | §3.2 `[aria-checked="true"]` セレクタ併記 + `--ubm-color-accent` 塗り | Phase 4 spec |
| AC-4 grid 過密緩和 | §4 comfy `gap: var(--ubm-space-6)`（24px）化、列定義 / 3 密度不変 | Phase 4 spec + Phase 11 |
| AC-5 tag-pill 挙動不変 | INV-7 遵守。DOM 構造不変・既存 spec 緑 | Phase 6 回帰 |
| AC-6 OKLch | §1.2 / §3.3 / §4 全てトークン経由。`verify-design-tokens` | Phase 9 gate |
| AC-7 新規 primitive 0 | Phase 2 §7（INV-6） | Phase 9 grep |
| AC-8 API 等差分 0 | 変更対象 §6.1 は `apps/web` のみ | Phase 9 `git diff --name-only` |
| AC-9 レスポンシブ | §5 flex-wrap が viewport 自動追従。既存 mobile media query 不変 | Phase 11 mobile/desktop |
| AC-10 a11y | §3.3 accent×panel 文字でコントラスト AA。role/aria/フォーカス順不変 | Phase 9 a11y |
| AC-11 typecheck/lint/vitest/verify-pr-ready | §6.4 / §6.5 実行コマンド | Phase 7 / Phase 9 |

> 全 AC が設計要素に紐づき、未カバーなし。

## 3. リスクと対策

### MINOR-1: CSS cascade 競合（`tag-pill` 選択強調セレクタ詳細度）

`globals.css` で `[data-component="tag-pill"][aria-checked="true"]` を追加するが、同 chip に対し `:hover`（L1752）や disabled（L2334・`[aria-disabled="true"]`）も適用され得る。

- 評価: `aria-checked="true"` は選択済み chip にのみ付与され、上限到達時の disabled は**未選択 chip にのみ**付与される（`TagPicker.client.tsx` L38 `isDisabled = reached && !isSelected`）ため、`aria-checked="true"` と `aria-disabled` は同一要素に共存しない。競合なし。
- 対策: Phase 4 で「選択中 chip は disabled にならない」ことを spec で固定（既存挙動の回帰確認）。

### MINOR-2: 既存 spec の selector 依存（`MemberFilters.client.spec.tsx`）

`filter-group` ラッパ追加で `filters-body` 直下の DOM 階層が 1 段深くなる。既存 spec が `filters-body > FormField` 等の直接構造を assert していると失敗し得る。

- 対策: Phase 4 で `MemberFilters.client.spec.tsx` を Read し、構造依存 assertion を `getByRole` / `getByLabelText` ベース（DOM 階層非依存）へ寄せる。URL query 反映 case（検索/Select/タグトグル）は階層非依存のため影響なし。

### MINOR-3: モバイルでの折返し過多（タグ数が多い場合）

`flex-wrap` でタグが多いとモバイルで縦に長くなり、折りたたみ展開時の視認性が落ちる懸念。

- 評価: 現 `topTags` は `aggregateTopTags()` の上位件数（MVP 規模で十数件想定）であり、`max`（`TAG_LIMIT`）選択上限の hint もある。flex-wrap の自然折返しで実用上問題なし。
- 対策: タグ検索ボックス / category グルーピングは `_shared-context.md` §6 のとおり **スコープ外（Phase 12 baseline・非起票・YAGNI）**。本サイクルでは対処不要。

### MINOR-4: comfy gap 変更による既存 screenshot baseline の差分

comfy gap を 18px → 24px に変更すると、既存 visual baseline がある場合に差分検出される。

- 評価: local static screenshot は取得済み（`status: local_static_visual_present_staging_pending`）であり、staging baseline 再取得は user-gated とする。意図的な改善差分のため許容。
- 対策: 本サイクル（Phase 11）で mobile/desktop の新 baseline を取得（user-gated）。

## 4. blocker

なし。

## 5. 後続 Phase 俯瞰（タスク仕様書がコード実装可能になる粒度）

後続の実装仕様書（Phase 4 以降）は、以下の変更ファイル群が「行レベルで実装可能」な粒度になっていることを確認する:

| ファイル | 実装単位 | 参照 |
|---------|---------|------|
| `apps/web/src/styles/legacy-public.css` | (a) `tag-picker-options` flex ルール（heading L1441 直後）/ (b) `filter-group` ルール（filter-grid 近傍）/ (c) comfy gap トークン化（L1451） | Phase 2 §1/§2.2/§4 |
| `apps/web/src/styles/globals.css` | `tag-pill` 選択強調セレクタに `[aria-checked="true"]` 併記 + accent 化（L1756） | Phase 2 §3 |
| `apps/web/src/components/public/MemberFilters.client.tsx` | `filters-body` 内に `<div data-role="filter-group" data-group="inputs">` ラッパ 1 個追加（filter-grid + result-count を内包） | Phase 2 §2.1 |
| `apps/web/src/components/public/TagPicker.client.tsx` | 原則無変更（既存 `data-role="tag-picker-options"` で成立）。変更する場合も INV-7 範囲内 | Phase 2 §6.1 #4 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | `filter-group` 追加に追随する assertion 更新（階層非依存化） | Phase 2 §6.4 / 本 Phase MINOR-2 |
| `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 既存緑維持 + `tag-picker-options` 存在確認 | Phase 2 §6.4 |

- 検証ゲート: `verify-design-tokens`（AC-6）／ `git diff --name-only` で `apps/api`・`packages/shared`・D1 migration 差分 0（AC-8）／ 新規 primitive grep（AC-7）。
- 1 サイクル完結・先送りタスクなし（CONST_007）。スコープ外項目は Phase 12 unassigned baseline として非起票記録。

## 次フェーズ

Phase 4（テスト設計）へ進む。CSS は単体テスト対象外のため、DOM 構造（`tag-picker-options` / `filter-group` 存在・`aria-checked` 反映）と既存挙動回帰（AC-5）を中心に test 設計する。

## 完了条件

- [x] INV-1〜7 各々の PASS 根拠
- [x] AC-1〜11 と設計要素の対応表
- [x] リスク（cascade 競合 / spec selector 依存 / モバイル折返し / baseline 差分）と対策
- [x] 後続 Phase の変更ファイル群俯瞰（実装可能粒度の確認軸）
- [x] blocker なし判定
