<!-- workflow: members-list-ux-clarity / task: B / phase: 8 -->

[実装区分: 実装仕様書]

# Phase 8 — リファクタリング (Task B)

> 前提: Phase 5-7 GREEN

## 1. 変更内容 (Before / After / 理由)

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| `MemberFilters.client.tsx` 末尾の clear button | `filter-grid` 末尾の `<button data-role="clear" disabled={!hasFilters}>` | 削除 (responsibility 移譲) | chip 列右端の clear-all に統合 (親 Phase 3 § 2.4) |
| `SelectedTagsBar.client.tsx` | 専用 chip 列実装 | `SelectedFiltersBar` への wrapper | 命名整合 + 後方互換両立 |
| chip ラベル日本語化 | 各所に散在 | `SelectedFiltersBar` 内 `DEFAULT_LABELS` const に集約 | R-B-5 対策 |
| `onClearOne` ロジック | clearAll しかなかった | `useCallback` で個別解除 callback を集約 | 描画と URL 更新の責務分離 |
| `resultCountText` | 不在 | `MemberFilters` 内で算出 (三項分岐) | live region 文言生成の集約 |

## 2. duplicate / navigation drift 確認

- `SelectedFiltersBar` 内 chip 描画ロジックは map 関数 1 つに統一 (q/zone/status/tag を chip[] に build してから map)
- chip ラベル写像表は `DEFAULT_LABELS` の 1 箇所のみ (重複なし)
- `data-component="tag-pill"` は旧 `SelectedTagsBar` と同じ value を使い、CSS selector 互換を維持

## 3. 削除確認 (FB-UI-02-1 対応)

| ファイル | 状態 |
| -------- | ---- |
| 旧 `[data-role="clear"]` button JSX | git delete (該当行のみ) |
| `SelectedTagsBar.client.tsx` 旧本体 | wrapper として中身置換 (live import ゼロ確認は `git grep -rn "SelectedTagsBar" apps/`) |

## 4. DoD

- [ ] 削除した行は live import が 0 (`git grep` で確認)
- [ ] 命名 / 責務境界の重複なし
- [ ] Phase 7 のカバレッジが維持されている (リファクタ後も 100%)
