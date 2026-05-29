<!-- workflow: members-list-ux-clarity / task: B / phase: 10 -->

[実装区分: 実装仕様書]

# Phase 10 — 最終レビュー (Task B)

> 前提: Phase 9 GREEN

## 1. Acceptance Criteria チェック

| AC | 検証手段 | 結果記入欄 |
| -- | -------- | ---------- |
| AC-B-1 hint + aria-describedby | TC-B-MF-01 | ☐ PASS |
| AC-B-2 result-count `role=status` + 3 文言分岐 | TC-B-MF-02 | ☐ PASS |
| AC-B-3 q/zone/status/tag chip 化 (sort 除外) | TC-B-SFB-02/03/05 | ☐ PASS |
| AC-B-4 個別解除 aria-label / onClearOne | TC-B-SFB-02/03/04 | ☐ PASS |
| AC-B-5 hasFilters=false で bar 非描画 | TC-B-SFB-01 / TC-B-MF-03 | ☐ PASS |
| AC-B-6 URL query 互換 | TC-B-MF-06 | ☐ PASS |
| AC-B-7 既存 7 ケース後方互換 | Phase 4 § 2 修正 | ☐ PASS |
| AC-B-8 result-count `role=status` 検証 | TC-B-MF-02 | ☐ PASS |
| AC-B-9 SelectedFiltersBar spec 新規 | TC-B-SFB-01..06 | ☐ PASS |
| AC-B-10 verify-design-tokens GREEN | Phase 9 § 1 | ☐ PASS |

## 2. blocker 判定

| 項目 | 状態 |
| ---- | ---- |
| API endpoint 変更 | 0 件 (PASS) |
| D1 schema 変更 | 0 件 (PASS) |
| 新 primitive 追加 | 0 件 (PASS) |
| URL query 仕様変更 | 0 件 (PASS) |
| 既存 spec 破壊 | 0 件 (PASS、Phase 4 § 2 で修正方針通り) |

## 3. MINOR 指摘候補 → 未タスク化対象

Phase 10 で MINOR 指摘が出た場合、Phase 12 の `unassigned-task-detection.md` に登録する候補:

- `tag` chip の表示名を code から label (例: `#AI`) に解決するための topTags 連携 (本 task では `#code` のまま)
- chip 解除後の focus 戻し先制御 (現状: document.body fallback)
- mobile (375px) で chip 列があふれた場合の最大表示数制御 (現状: 全件 flex-wrap)
- result-count の announce 頻度の debounce 化 (現状: 自然な re-render)

## 4. DoD

- [ ] AC-B-1..10 が PASS で記入されている
- [ ] blocker が 0 件
- [ ] MINOR は Phase 12 § 4 で formalize 候補としてリスト化されている
