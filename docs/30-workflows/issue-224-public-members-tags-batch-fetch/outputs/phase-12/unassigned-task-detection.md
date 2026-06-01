# Phase 12 未割当タスク検出

本タスク実装中に発見した「本 issue のスコープ外だが対応候補」を記録する。current / baseline を分離する。

## baseline（着手前から既知の前提）

| ID    | 内容                                                                                  | 状態 |
| ----- | ------------------------------------------------------------------------------------- | ---- |
| B-1   | helper `listTagsByMemberIds`（`member_id IN` batch・フラット配列返り）は **実装済み** | 完了済み（再利用） |
| B-2   | 本 issue #224 = endpoint 配線（expand パラメータ + groupBy 引き当て）                  | 本タスクで対応 |

## current（本タスクで検出した未割当候補）

### U-1: web UI での tags 表示（issue #1006 射程）

- **内容**: API が `expand=tags` で tags を返せるようになっても、`apps/web` の members list UI に
  tags を描画する実装は別途必要。本 issue の受け入れ条件（AC-1〜AC-5）には含まれない。
- **スコープ判定**: 本 issue は API 層のみ（NON_VISUAL）。UI 表示は責務分離でスコープ外。
- **射程**: issue #1006（members 周辺 UX レーン）等。
- **関連タスク差分確認**:
  - issue #1006 は SelectedFiltersBar / chip UX 等の UI 改善レーン。tags 表示も同レーンの射程として整合する。
  - 重複起票しない。API 完了後に UI レーン側で「members list に tags chip を描画」として消化する想定。
  - 差分: 本 issue（API: tags を返す）↔ #1006 射程（UI: tags を見せる）は **データ供給 ↔ 描画** の関係で重複なし。

### U-2: 現行 list-public-members.ts の fields N+1（別系統・要対応候補）

- **内容**: `listPublicMembersUseCase` は member 毎に `listFieldsByResponseId(ctx, m.current_response_id)` を
  ループ呼び出ししており、**fields は既に N+1** になっている（引き当てキーは `current_response_id`）。
- **スコープ判定**: 本 issue は **tags** の N+1 防止のみが受け入れ条件。fields N+1 は別系統のため本サイクルでは触らない
  （contract / use-case test の N+1 計数も tags batch query のみを対象とし、fields は assert に含めない）。
- **対応候補**: fields 用の batch helper（`response_id IN (...)`）を別途用意し、本タスクと同じ groupBy パターンで配線する。
  着手時は本 issue の `expand` 設計（whitelist `EXPAND_WHITELIST`）を再利用できる。
- **起票推奨**: あり（別 issue 候補）。優先度は低（公開一覧の表示遅延が顕在化した時点で着手）。

## 関連タスク差分確認（既存メモとの統合関係）

| 既存メモ                                                                                    | 関係 |
| ------------------------------------------------------------------------------------------- | ---- |
| `docs/30-workflows/unassigned-task/04a-followup-005-public-tags-batch-fetch-n1-prevention.md` | **本 issue #224 の発見元メモ**。当該メモは「helper は実装済み・endpoint 配線（expand）は未実装」と記載。本 issue はその endpoint 配線を実装仕様として **昇格**したもの。helper 整備は完了済みのため重複せず、本 issue がメモの未消化部分（配線）を引き継ぐ統合関係にある。 |

> 上記メモは issue #224 として GitHub 起票済み（`docs/30-workflows/issues/issue-224.md`・発見元 = 04a Phase 12 U-5）。
> したがって U-1 / U-2 のみが本タスク発の新規未割当候補であり、tags-bulk-fetch 自体の重複起票は不要。
