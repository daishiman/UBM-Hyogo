`[実装区分: 実装仕様書]`

# Unassigned Task Detection — admin-requests-queue-rename-and-publish-dependency

`taskType: implementation` / `visualEvidence: VISUAL` / `workflow_state: implemented_local_evidence_captured`

> 正本は [_shared-context.md](../../_shared-context.md)。本タスクのスコープ外で観測された項目（未タスク）を記録する。本サイクルでの新規 unassigned-task ファイル発行は **不要**（baseline 記録のみ）。別 Issue 化は user-gated。

---

## Summary

| 種別 | 件数 |
| --- | --- |
| 今サイクルで対応必須の未タスク（current） | 0 |
| スコープ外として分離記録した baseline | 2 |
| 新規 unassigned-task ファイル発行 | なし |

ユーザー決定（AskUserQuestion 2026-06-09）で Q4 において選択されなかった 2 項は、今回サイクルで破綻なく分離できる baseline であり、本タスク（命名 + 役割明確化 + seed + バッジ）の完結を妨げない。別 Issue 化はユーザー承認後（user-gated）。

---

## Baseline 記録（スコープ外・本サイクルで実装しない）

### B-1: `GET /api/admin/members/TEST-MEM-01 500` 修正

| 項目 | 内容 |
| --- | --- |
| 観測 | staging で会員詳細取得時に 500 エラー（別系統のバグ）。 |
| スコープ外理由 | Q4 で非選択。本タスクの命名/役割明確化/seed/バッジとは独立した別系統バグであり、混在させると 1 サイクル完結（CONST_007）を壊す。 |
| 影響 | 本タスクの AC-1..13 達成を妨げない。バッジは会員一覧 API（`GET /members`）のレスポンスを読むため、会員詳細（`/members/:id`）の 500 とは経路が異なる。 |
| 扱い | baseline。別 Issue 化は user-gated。 |

### B-2: 承認 before→after 公開状態 diff 表示

| 項目 | 内容 |
| --- | --- |
| 観測 | 承認時に「public→hidden」のような変更前後の差分を画面で強調表示すると UX 向上。 |
| スコープ外理由 | Q4 で非選択。本タスクは「申請の存在の可視化（申請中バッジ）」と「役割の明確化」までがスコープ。承認 UI への diff 表示は追加 UI 設計を要し別軸。 |
| 影響 | 本タスクの依存可視化（バッジ + 相互リンク + 説明文）で「2 軸が独立」という整合は達成済み。diff 表示は無くても AC-13 を満たす。 |
| 扱い | baseline。別 Issue 化は user-gated。 |

---

## current 未タスク（0 件）

本サイクルで対応必須の未割当タスクは検出されなかった。

- Lane A/B/C は SSOT §2 で 1 サイクル完結スコープに収まっており、先送り項目なし。
- AC-1..13 はすべて Phase 4-10 の成果物 / テストに割当済み（Phase 10 §10.1 GO 判定）。
- implemented_local_evidence_captured のため実装は完了済み。authenticated runtime screenshot・staging seed・commit/PR は user-gated であり、これらは「未タスク」ではなく定義済みの外部境界。
