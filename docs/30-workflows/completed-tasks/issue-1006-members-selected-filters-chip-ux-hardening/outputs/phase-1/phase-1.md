# Phase 1: 要件定義

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001
- Feature: issue-1006-members-selected-filters-chip-ux-hardening
- 元 Issue: GitHub #1006（CLOSED のまま）
- 実装区分: 実装仕様書（判定根拠は `index.md` 冒頭）

## 1. タスク分類（[Feedback 1] / [Feedback 3] 対応）

| 項目 | 値 |
| --- | --- |
| Task type | **UI task / implementation** |
| visualEvidence | **VISUAL**（chip ラベル文字列・focus リング・mobile レイアウトが視覚的に変化する） |
| implementation_mode | `edit`（既存 3 ファイルを編集。新規ファイル作成なし） |
| screenshot 方針 | Phase 11 で `/members` の chip 表示（desktop）と mobile overflow（`<=640px`）を取得 |

> Phase 11 着手時にこの分類（VISUAL）を必ず再参照する。NON_VISUAL へ変わる余地は無い。

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | Yes（本 wave で `tagLabels` / focus 管理 / mobile CSS を実装済み） | `implemented_local_runtime_pending` として扱う |
| upstream（dev/main）にマージ済み | No（commit / push / PR は user 承認前のため未実行） | 未マージとして扱う |
| 前提タスク（`members-list-ux-clarity`）完了済み | Yes（`SelectedFiltersBar` 実装は `#1009` でマージ済み） | 依存解消済み。`SelectedFiltersBar`/`MemberFilters` の現行実装を起点に編集 |

→ `implementation_mode: "edit"`（既存ファイルへの RED/GREEN サイクル）。対象は既存コンポーネント / CSS / spec の編集。

## 3. carry-over 確認（直近成果物の棚卸し）

`git log --oneline -5` 相当:
- `37fe488e8 feat(members): メンバー一覧のUX明確化 (#1009)` — 親実装（`SelectedFiltersBar` 一般化）。本タスクはこの follow-up。
- 以降このタスクの 3 課題に触れたコミットは無い（調査済み）。

本タスクの新規作業 = 親実装で deferred された ① label 解決 / ② focus 管理 / ③ mobile overflow の 3 点のみ。

## 4. 既存コードの命名規則分析（[FB-SDK-07-4] 対応）

| 対象 | 規則 | 例 |
| --- | --- | --- |
| component ファイル | PascalCase + `.client.tsx` | `SelectedFiltersBar.client.tsx` |
| test ファイル | `<Name>.client.spec.tsx`（`*.spec.tsx` のみ。`*.test.*` 禁止） | `SelectedFiltersBar.client.spec.tsx` |
| props interface | `<Name>Props` | `SelectedFiltersBarProps` |
| data 属性 | kebab-case の `data-component` / `data-role` | `data-component="filter-chip"` / `data-role="clear-all"` |
| ラベル定数 | UPPER_SNAKE の `Readonly<Record<...>>` | `ZONE_LABELS` / `STATUS_LABELS` |
| CSS selector | `[data-component="..."]` scoped | `[data-component="selected-filters-bar"]` |
| CSS トークン | `var(--ubm-...)` | `var(--ubm-space-3)` / `var(--ubm-color-accent)` |

→ 新規追加する prop は `tagLabels`（既存 `ZONE_LABELS`/`STATUS_LABELS` と同じ「code→表示名 map」発想）に揃える。focus 用 fallback callback は `onEmpty` とする（既存 `onPatch`/`onClearAll` の命名に整合）。

## 5. 受入条件（AC）

| AC | 内容 | 検証 Phase |
| --- | --- | --- |
| AC-1 | tag chip が `topTags` の `label` を用いて `#{label}` で描画される | Phase 4/6 |
| AC-2 | `topTags` に存在しない tag code は `#{code}` に fallback する（防御的返却・例外を投げない） | Phase 4/6 |
| AC-3 | chip 個別削除後、focus が「同 index の次 chip → 無ければ前 chip → chip が 1 つも残らなければ親検索入力」へ決定論的に遷移する | Phase 4/6 |
| AC-4 | mobile（`<=640px`）で chip 群・クリアボタン・result count が重ならず縦積みされる | Phase 11（visual） |
| AC-5 | `sort` は chip 化されない（親 Phase 12 補正の維持・回帰） | Phase 4 |
| AC-6 | API schema / D1 / Google Form 仕様変更ゼロ。tag label は `topTags` 由来のみ | Phase 9/10 |
| AC-7 | HEX 直書きゼロ（`verify-design-tokens` green） | Phase 9 |

## 6. targeted test ファイルリスト（[FB-UI-02-2] 対応 / 全件 test 回避）

メモリ制約下では全件 `pnpm test` を避け、以下の 2 ファイルのみを対象実行する:

```
apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx
apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
```

## 7. スコープ

### 含む
- `SelectedFiltersBar` の tag label 解決 / focus 管理 / mobile overflow 補強
- `MemberFilters` の label map 導出と `onEmpty` focus 配線
- `legacy-public.css` の mobile breakpoint 追加
- 上記 2 spec の追加・編集
- `/members` local screenshot の必要最小取得（Phase 11）

### 含まない（スコープ外）
- query parser の shared package 移送（GitHub #222、非依存）
- tags API の N+1 解消
- `topTags` に載らない tag の表示名を取りに行く API 拡張（label は既存 props のみ。未登録は code fallback で許容）
- staging deploy / production verification
- commit / push / PR（Phase 13・user-gated）

## 8. 苦戦予想と先回り

- focus 復帰は `router.replace` による RSC 再フェッチ後の再レンダーをまたぐ。`SelectedFiltersBar` は同位置にマウントされ続けるため `useEffect` で復帰可能（unmount/remount しない前提を Phase 2 で固定）。
- 最後の chip 削除時は bar が `return null` で unmount するため、intra-bar focus 復帰は不可。fallback は親が所有（`onEmpty`）。
