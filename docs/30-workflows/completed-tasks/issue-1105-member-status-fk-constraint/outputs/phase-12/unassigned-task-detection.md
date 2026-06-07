# 未タスク検出 — issue-1105 member_status FK 制約導入

> 区分: 実装仕様書 / NON_VISUAL / new ／ status: `implemented_local_evidence_captured`
> task_id: `issue-1105-member-status-fk-constraint`

current（本サイクルで起票すべき新規未タスク）と baseline（スコープ外・別タスク候補）を分離して記録する。本タスクは local 実装済みだが、M-1 / M-3 は別DBスコープの独立タスクであり、今回サイクルの先送りではないため新規 Issue 起票は行わない。

---

## current（本サイクル新規検出）: **0 件**

| # | 検出 | 判定 |
|---|------|------|
| — | なし | Phase 10 §10.3 blocker 0 件 / §10.7 総合 PASS。設計・テスト計画上、本サイクルで未解決のまま残す独立タスクは検出されなかった |

current = **0 件**。本仕様の DoD（AC-1〜AC-9）は単一サイクルで完結可能（Phase 10 §10.4 CONST_007 PASS）であり、分量都合の先送りは存在しない。

---

## baseline（スコープ外・別タスク候補）: **3 件**（Phase 10 §10.5 MINOR）

以下は本タスクで観測したが **スコープ外・別タスク / 別 followup** として分離する。**本サイクルの先送り（分量都合の deferral）ではなく、別関心または別 DB スコープの分離** であるため **新規 Issue 起票はしない**（候補記録のみ）。

| # | baseline 候補 | 内容 | スコープ外理由 |
|---|--------------|------|---------------|
| M-1 | 他テーブルへの FK 横展開 | `member_attendance` / `member_tags` など `member_id` を持つ他テーブルにも同様の FK を導入 | 各テーブルごとに独立した再構築 migration + データ移行リスク評価を要する **別関心**。本タスクは `member_status` 1 テーブルに限定（index.md スコープ「含まない: 他テーブルへの FK 導入」） |
| M-2 | member 作成経路統一（followup-001） | ingest 経路を単一化し `member_status` 行生成を 1 箇所へ集約 | 既に **followup-001 として分離済**。アプリ層の責務であり、DB FK（本タスク = DB 層）とは責務境界が異なる |
| M-3 | D1 接続単位 PRAGMA ON の常時適用機構 | binding 経由の全接続で `PRAGMA foreign_keys = ON` を常時保証する runner / middleware を整備 | migration runner / 接続初期化層の横断改修を要する **独立スコープ**。本タスクは migration 内検証 + runbook 記録で AC-6 を充足し、常時適用機構は将来 followup |

> 上記 3 件は「スコープ外・別タスク・別 followup」であり、本サイクルで先送りした作業ではない。

---

## 関連タスク差分確認

既存 followup / filed issue との重複チェックを行い、本検出が重複起票でないことを確認する。

| 既存タスク | 関係 | 重複判定 |
|-----------|------|---------|
| followup-001（member 作成経路統一） | アプリ層 ingest 統一。M-2 として baseline に分離済み | **重複なし**。本タスク（DB 層 FK）とは責務境界が異なり、followup-001 が既に当該関心をカバー。M-2 の新規起票は不要 |
| followup-002（= 本タスク・member_status FK 制約） | source unassigned-task を consume | **重複なし**（本 workflow 自身） |
| 親 `admin-member-detail-status-404-fix` | 止血（backfill 0025 + ensureMemberStatusRow）完了済み | **重複なし**。本タスクは DB 層構造ガードで補完する別フェーズ |

> M-1 / M-3 は対応する filed issue / followup が現状存在しないが、本タスクとは別DBスコープのため候補記録に留める。M-2 は followup-001 が既存カバー＝新規起票不要。

---

## 検出方針サマリ

- **current = 0 件**: 新規 Issue 起票なし。
- **baseline = 3 件**（M-1 / M-2 / M-3）: スコープ外・別タスク候補として記録。本サイクルの先送りではない。
- **新規 Issue 起票**: 行わない（別DBスコープ / 既存 followup で分離済み）。
