# 未タスク検出 — Issue #325

## 判定

| 項目 | 結果 |
| --- | --- |
| Issue #325 / UT-08A-06 内の未タスク | 0 件 |
| 新規 `docs/30-workflows/unassigned-task/` 追加 | なし |
| CONST_005 判定 | PASS。検出した Issue #325 内改善点は本仕様書に反映済みで、未タスク化していない |

## 根拠

Issue #325 は、08a の follow-up `UT-08A-06-test-suffix-rename-migration.md` を Phase 1-13 仕様へ昇格するタスクである。親 follow-up の対象は `apps/api/src/**/*.test.ts` の suffix rename であり、`apps/web` / `packages` は親責務に含まれていない。

そのため、`apps/web` / `packages` の rename は「今回検出した未完了改善」ではなく、別ドメインの任意拡張として扱う。本仕様書では未タスクを新規作成しない。

## scope-out 棚卸し

| 対象 | 本仕様書で扱わない理由 | 今回の扱い |
| --- | --- | --- |
| `apps/web/src/**/*.test.ts` | Issue #325 / UT-08A-06 の親責務外。UI 側は route / action / component など API 側とは分類軸が異なる | 未タスク化しない。別要求がある場合のみ独立仕様化 |
| `packages/**/*.test.ts` | package ごとに owner / lifecycle / publish 境界が異なり、API test suffix ADR をそのまま適用できない | 未タスク化しない。別要求がある場合のみ package 単位で独立仕様化 |

## トレース

| 上流 | 本仕様書 | 下流 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` | `docs/30-workflows/issue-325-test-suffix-rename-migration/` | なし |
