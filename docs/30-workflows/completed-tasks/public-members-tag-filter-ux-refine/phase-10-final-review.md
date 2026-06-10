# Phase 10: 最終レビューゲート

| 項目 | 値 |
|------|-----|
| Phase | Phase 10 — 最終レビュー |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local` |
| taskType | `implementation`（UI 表現層改善・CSS 主体） |
| visualEvidence | `VISUAL`（視覚確定は Phase 11 screenshot・本サイクルは pending） |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / Phase 1-9 各成果物 |

> 本 Phase は Phase 1-9 の整合性を最終レビューし、不変条件・AC 達成見込み・残リスク・1 サイクル完了判定をまとめる。本サイクルは `implemented_local_runtime_pending`（ローカル実装済み）。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 10 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
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

## 1. Phase 1-9 整合性レビュー

| Phase | 成果物 | 整合性判定 | 備考 |
|-------|--------|-----------|------|
| Phase 1 | 要件定義 | ✅ | RCA を実コード Read で再裏取り（主因 = `tag-picker-options` display 不在 / 副因 = 選択強調セレクタ `aria-selected` vs `aria-checked` 不一致）。CSS 正本を実測確定（`legacy-public.css` + `globals.css`） |
| Phase 2 | 設計 | ✅ | flex 横並び（§1）/ `filter-group` グルーピング（§2）/ 選択強調 accent 化（§3）/ comfy gap トークン化（§4）/ wrap レスポンシブ（§5）。新規 primitive 0（§7） |
| Phase 3 | 設計レビュー | ✅ | 4 条件 + INV-1〜7 PASS。AC ↔ 設計要素対応表に未カバーなし。MINOR-1..4 評価済・blocker なし |
| Phase 7 | カバレッジ | ✅ | CSS 視覚は Phase 11 委譲・DOM/属性は vitest（COV-1..7）。新規分岐 0 ＝既存 coverage 非劣化 |
| Phase 8 | リファクタ | ✅ | R-1..R-4（値整合・トークン化・併記最小差分）/ cascade 競合回避 / 過剰リファクタ禁止 |
| Phase 9 | QA | ✅ | AC-1〜11 検証手順。AC-6/7/8 を具体コマンドで固定。a11y 観点明示 |

> Phase 間で方針の矛盾なし。CSS 正本ファイル（Phase 1 確定）→ 追加位置（Phase 2 §1/§2.2/§3/§4）→ 検証ゲート（Phase 9）が一貫して `legacy-public.css` / `globals.css` / `MemberFilters.client.tsx` に紐づく。

## 2. 不変条件 INV-1〜7 最終 PASS 表

| INV | 条件 | 判定 | 最終根拠 |
|-----|------|------|---------|
| INV-1 | 新 endpoint 追加禁止 | ✅ | CSS/markup のみ。`apps/api/src/routes/` 非接触（Phase 9 §5 grep で担保） |
| INV-2 | OKLch トークン正本・HEX 禁止 | ✅ | 追加色は全トークン参照（`--ubm-color-accent` / `--ubm-space-2/3/6` / `--ubm-color-border-default`）。`verify:tokens`（Phase 9 §3）で検証 |
| INV-3 | D1 直接アクセス禁止 | ✅ | `apps/web` から D1 binding 不使用（Phase 9 §7 grep） |
| INV-4 | API/shared/D1/Form 不変 | ✅ | 変更は `apps/web/src/styles/` + `components/public/` のみ。`topTags` shape 不変（Phase 9 §5 grep） |
| INV-5 | `.spec` のみ | ✅ | 編集対象は既存 `.spec.tsx`。新規 `.test.*` 0（Phase 9 §7 grep） |
| INV-6 | 新規 primitive 禁止 | ✅ | `components/ui/` 追加 0（Phase 2 §7・Phase 9 §4 grep） |
| INV-7 | tag-pill 挙動不変 | ✅ | `role="switch"` / `aria-checked`（値）/ トグル / 上限 hint / empty option 不変。CSS は `aria-checked` を視覚反映するのみ（Phase 7 COV-2..5・Phase 9 §6） |

## 3. AC 達成見込み表（AC-1〜11）

| AC | 達成手段 | 確定 Phase | 見込み |
|----|---------|-----------|--------|
| AC-1 横並び | `tag-picker-options` flex-wrap + gap | Phase 2 §1 / Phase 7 COV-1 / Phase 11 | ✅ 達成見込み |
| AC-2 グルーピング | `filter-group` ラッパ + 既存 border-top | Phase 2 §2 / Phase 7 COV-6 / Phase 11 | ✅ 達成見込み |
| AC-3 選択強調 | `[aria-checked="true"]` 併記 + accent 塗り | Phase 2 §3 / Phase 7 COV-2 / Phase 11 | ✅ 達成見込み |
| AC-4 grid 過密緩和 | comfy gap → `--ubm-space-6`（24px）、3 密度維持 | Phase 2 §4 / Phase 11 | ✅ 達成見込み |
| AC-5 tag-pill 挙動不変 | INV-7 遵守・既存 spec 緑 | Phase 7 COV-2..5 | ✅ 達成見込み |
| AC-6 OKLch | 全トークン参照・`verify:tokens` | Phase 9 §3 | ✅ 達成見込み（gate） |
| AC-7 新規 primitive 0 | `components/ui` 非接触 | Phase 9 §4 | ✅ 達成見込み（grep） |
| AC-8 API 等差分 0 | `apps/web` のみ変更 | Phase 9 §5 | ✅ 達成見込み（git） |
| AC-9 レスポンシブ | flex-wrap viewport 自動追従 | Phase 2 §5 / Phase 11 | ✅ 達成見込み（screenshot） |
| AC-10 a11y | role/aria 不変・accent×panel AA | Phase 9 §6 | ✅ 達成見込み |
| AC-11 一括 green | typecheck/lint/vitest/verify-pr-ready | Phase 7 / Phase 9 §1 | ✅ 達成見込み |

> 視覚系 AC（AC-1/2/3/4/9）の最終確定は Phase 11 screenshot（mobile/desktop・user-gated capture）で行う。本サイクルでは設計・検証経路の確立をもって「達成見込み」とする。

## 4. 残リスクと対策（Phase 3 MINOR の最終確認）

| ID | リスク | 最終評価 | 対策 |
|----|--------|---------|------|
| MINOR-1 | 選択強調 × hover/disabled の cascade 競合 | 選択中 chip は disabled にならない（`isDisabled = reached && !isSelected`）ため共存しない。hover との共存は accent 塗りが上書きで問題なし | Phase 7 COV-3 で「選択中 chip は disabled にならない」を spec 固定 |
| MINOR-2 | `MemberFilters.client.spec.tsx` の DOM 階層依存 | `filter-group` ラッパで 1 段深くなる | Phase 7 COV-6/7 で assertion を `getByRole`/`getByLabelText` ベース（階層非依存）へ寄せる |
| MINOR-3 | モバイル折返し過多 | 現 `topTags` は MVP 規模（十数件想定）+ 上限 hint あり。flex-wrap で実用上問題なし | スコープ外（タグ検索/category は Phase 12 baseline・非起票） |
| MINOR-4 | comfy gap 変更で既存 screenshot baseline 差分 | 意図的な改善差分・許容 | 本サイクル Phase 11 で mobile/desktop の新 baseline を取得（user-gated） |

> 新規 blocker なし。MINOR は全て対策が後続 Phase（7/11）に紐づく。

## 5. スコープ外（Phase 12 unassigned baseline・非起票記録）

| 項目 | 理由 | 扱い |
|------|------|------|
| タグの category 別グルーピング表示 | `topTags` は flat 配列。category 軸は API/schema 拡張が必要（INV-4 違反） | 非起票・YAGNI |
| タグ検索ボックス | 現 topTags 件数では過剰。発見性は flex-wrap で十分 | 非起票・YAGNI |
| メンバーカード全面刷新 / ページフルリライト | AskUser 回答で対象外（余白/階層調整に限定） | スコープ外明記 |

## 6. 1 サイクル完了判定（CONST_007）

| 判定軸 | 結果 |
|--------|------|
| LOC 規模 | CSS 追加 ~ 数十行 + ラッパ 1 個 + test 調整 ≈ 合計 ~150 LOC（小規模） |
| 変更ファイル | `apps/web/src/styles/legacy-public.css` / `globals.css` / `MemberFilters.client.tsx`（最小）/ `TagPicker.client.tsx`（最小 or 無変更）/ 既存 spec 2 件 |
| 先送りタスク | **なし**（スコープ外項目は Phase 12 baseline・非起票記録のみ） |
| 1 サイクル完結 | ✅ **1 サイクル内で完了するスコープ**（CONST_007 満たす） |

## 7. 最終判定

**Phase 11（証跡）以降へ進行可。** Phase 1-9 整合・INV-1〜7 全 PASS 見込み・AC-1〜11 全達成見込み・blocker なし・1 サイクル完結。

> 本サイクルは `implemented_local_runtime_pending` のため、staging deploy / staging runtime screenshot capture / commit / push / PR は **user-gated**（`_shared-context.md` §7）。

## 8. 完了条件

- [x] Phase 1-9 整合性レビュー
- [x] INV-1〜7 最終 PASS 表
- [x] AC-1〜11 達成見込み表
- [x] 残リスク（MINOR-1..4）と対策
- [x] スコープ外（Phase 12 baseline・非起票）記録
- [x] 1 サイクル完了判定（CONST_007）
- [x] 最終判定（Phase 11 以降進行可・user-gated 境界明記）
