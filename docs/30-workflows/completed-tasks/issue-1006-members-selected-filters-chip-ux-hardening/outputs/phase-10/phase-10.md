# Phase 10: 最終レビュー

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. 受入条件（AC）合否判定

> 現ローカル実装の判定。component-harness screenshot 3 枚は取得済み。staging data-backed screenshot のみ user-gated で取得する。

| AC | 内容 | 判定 | 証跡 |
|---|---|---|---|
| AC-1 | tag chip を表示名（`#${tagLabels[code]}`）で描画 | ☑ | SelectedFiltersBar spec / MemberFilters spec |
| AC-2 | 未登録 code は `#${code}` に fallback | ☑ | SelectedFiltersBar spec「未登録 code fallback」 |
| AC-3 | chip 削除後の focus 遷移（次 chip→前 chip→0 件で onEmpty で検索入力 focus） | ☑ | SelectedFiltersBar spec 3 分岐 + MemberFilters spec「onEmpty で searchInput focus」 |
| AC-4 | mobile(<=640px) で chip overflow が縦積み | ☑ local_css_sanity / pending data-backed screenshot | Playwright CSS inspection + Phase 11 screenshot plan |
| AC-5 | sort は chip 化しない（非 chip 維持） | ☑ | SelectedFiltersBar spec「sort 由来 chip 非生成」回帰 test |
| AC-6 | API / D1 / Form 変更ゼロ | ☑ | code diff は `apps/web/src/components/public/*` / tests / CSS / docs / skill index のみ |
| AC-7 | HEX 直書きゼロ | ☑ | `verify-design-tokens` pass |

## 2. レビュー観点サマリ

| 観点 | 判定 |
|---|---|
| Phase 2 確定設計（`tagLabels?` / `onEmpty?` props 追加・resolveTag・chipRefs/pendingFocusRef・mobile CSS）の全反映 | ☑ |
| 編集 4 ファイルに閉じる（新規 component / primitive 追加なし） | ☑ |
| state ownership 分担（bar=intra-bar focus / 親=unmount 後 fallback focus） | ☑ |
| 不変条件遵守（OKLch token 正本・selector scope 限定・`*.spec.tsx` 規約・apps/web D1 boundary） | ☑ |
| 既存 q/zone/status chip の挙動不変（回帰 test green） | ☑ |

## 3. MINOR 指摘候補（Phase 12 未タスク化対象 / [unassigned 化ルール]）

- **topTags 未登録 tag の表示名解決**: 現状 `topTags`（=人気タグ上位）に含まれない tag code は表示名解決できず `#${code}` で fallback する。全 tag の code→label を解決するには API レスポンス拡張（全 tag map の供給）が必要。これは本 Task のスコープ外（本 Task は code fallback で許容＝AC-2 の設計意図）であり、**別タスク候補**として Phase 12 unassigned-task-detection で再評価する（#222 系の API 拡張系タスクとして起票検討。本 Task では起票しない）。

## 4. blocker 判定

- 現ローカル実装では **blocker = 0**。staging data-backed screenshot は user-gated runtime 境界として分離する。

## 5. partial fix 有無（[FB-CANCEL-004-1]）

- 本 Task は consumer wiring（`MemberFilters` → `SelectedFiltersBar` への `tagLabels` / `onEmpty` 配線）まで 1 cycle で通すため、**partial fix は無い**。props を追加して呼び出し側未配線のまま放置する、といった中途半端な状態を残さない。

## 6. 承認

- 最終レビュー結果: **implemented_local_runtime_pending**（実装済み、focused tests / typecheck / lint / design-token / CSS sanity を確認。data-backed screenshot は auth 設定済み環境で取得）
- 次フェーズ: Phase 13 は user 承認後のみ commit / push / PR。
