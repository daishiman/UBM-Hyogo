# Phase 7: カバレッジ確認

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. カバレッジ判定方針（[Feedback BEFORE-QUIT-002] / [Feedback 5]）

カバレッジは **本 Task で変更したファイル / 変更したブロックに限定** して評価する。リポジトリ全体の statement/branch % を目標にしない（既存無関係コードの未カバー行は本 Task のゲートに含めない）。

- 評価軸: 変更行（追加・改変した行）の **line / branch カバレッジ 100%**。
- 評価対象 spec は Phase 6 で確定した 2 本のみ:
  - `apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx`
  - `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`

## 2. 対象ファイルと到達すべき分岐

### `SelectedFiltersBar.client.tsx`

| 変更ブロック | 到達すべき分岐 | 担保ケース |
|---|---|---|
| `resolveTag = (code) => Object.hasOwn(tagLabels, code) ? tagLabels[code] : code` | (a) `tagLabels` に own property 登録あり → 表示名 / (b) 未登録・prototype key → `code` fallback | AC-1 / AC-2 / prototype key 回帰で分岐到達 |
| chip 削除後の `pendingFocusRef` 解決（useEffect） | (1) 次 chip が存在 → 次 chip に focus / (2) 次が無く前 chip が存在 → 前 chip に focus / (3) 0 件 → `onEmpty()` 呼出 | AC-3 で 3 分岐すべて到達 |
| useEffect の focus 復帰 target 有無 | (i) `pendingFocusRef` に保留あり かつ target ref 解決可 → focus 実行 / (ii) 保留なし or target 解決不可 → no-op | 初期 mount（保留なし）と削除直後（保留あり）で両分岐到達 |
| `chipRefs`(Map) の ref callback | set / cleanup（null 代入）両方 | render → 削除 → 再 render で到達 |

### `MemberFilters.client.tsx`

| 変更ブロック | 到達すべき分岐 | 担保ケース |
|---|---|---|
| `tagLabels = Object.fromEntries(topTags.map(t => [t.code, t.label]))` | topTags 0 件（空 map）/ 1 件以上（map 生成） | 両ケースで到達 |
| `onEmpty` 配線（検索入力 focus） | `onEmpty` 発火時に `member-search-input` へ focus | AC-3 fallback 経路で到達 |

## 3. CSS はカバレッジ対象外

`legacy-public.css` の `@media (max-width:640px)` 縦積みルール（AC-4）は **コードカバレッジ対象外**。視覚回帰は Phase 11 の mobile viewport visual evidence で担保する。

## 4. 証跡コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
```

coverage 出力で `SelectedFiltersBar.client.tsx` / `MemberFilters.client.tsx` の変更行が line/branch とも欠けていないことを目視確認する。

## 5. 対象外（挙動不変＝回帰 test のみで担保）

- 既存の `q`（検索語）/ `zone` / `status` chip の構築・削除ロジックは本 Task で挙動を変えない。`ZONE_LABELS` / `STATUS_LABELS` 解決もそのまま。これらは新規分岐を増やさず、既存挙動の **回帰 test** だけで担保する（カバレッジ 100% 目標の対象外）。
- AC-5（sort は chip 化しない）は「sort 由来 chip が生成されない」ことを assert する回帰 test で担保。

## 6. 失敗時対応

- 未カバー分岐が出た場合: mock 不足なら Phase 6 に戻りケース追加。到達不能な dead branch なら Phase 8 リファクタリングで削減。

## 7. ゲート

- [ ] `SelectedFiltersBar.client.tsx` 変更行 line/branch 100%（resolveTag 2 分岐 + pendingFocus 3 分岐 + useEffect target 有無 2 分岐）
- [ ] `MemberFilters.client.tsx` 変更行 line/branch 100%（tagLabels 導出 + onEmpty 配線）
- [ ] CSS は対象外と明記され Phase 11 visual に委譲
- [ ] 既存 q/zone/status chip は回帰 test green
