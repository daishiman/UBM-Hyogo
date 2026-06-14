# Phase 12 — 未タスク検出（current / baseline 分離）

> ステータス: `implemented_local_runtime_pending`。本ファイルは未タスクを **current（本サイクルで残存する新規未タスク）** と **baseline（将来候補・本サイクル対象外）** に分離して記録する。

---

## 1. current（本サイクルで解消すべき新規未タスク）

**0 件。**

本タスクの全 AC（AC-1〜AC-10）は **単一 PR の 1 実装サイクルで完了するスコープ**に収まっている（CONST_007 の分割なし）。diff の入力 3 値（`publishState` / `isDeleted` / `desiredState`）は GET `/admin/requests` の projection で既に返っており不足なし、改修対象は `apps/web` 表現層 3 コンポーネント + `globals.css` に閉じる。新 endpoint / D1 schema / projection 拡張を要する未タスクは発生しない。

| 区分 | 件数 | 理由 |
| --- | --- | --- |
| current（新規未タスク） | **0** | 全 AC-1〜AC-10 が単一 PR 1 サイクルで完了・CONST_007 分割なし。3 値限定契約で API 変更不要 |

> VISUAL screenshot（3 canonical PNG）は本タスクの Phase 11 evidence であり、`current 未タスク`ではなく Phase 13 の user-gated capture として artifacts.json Gate-C / phase11-capture-metadata.json（`staging_visual_pending_user_gate`）で追跡する。

---

## 2. baseline（将来候補・本サイクル対象外・参照のみ）

親 workflow `admin-requests-queue-rename-and-publish-dependency`（本タスクの起点・AC-13 まで充足済）に baseline 候補がある場合は、そちらの記録を**参照のみ**とする。本サイクルでは新規 baseline を起票・追加しない。

| 区分 | 扱い |
| --- | --- |
| 親 workflow baseline | `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency/` の記録を参照のみ |
| 発見元 unassigned-task | `docs/30-workflows/completed-tasks/admin-requests-queue-rename-and-publish-dependency-followup-001-approval-publish-state-diff.md`（本 spec が後続 consumer・残置） |
| 新規 Issue 起票 | **しない**（本タスクは Issue #1188 を起点とし、新規 baseline は発生しない） |

> baseline は親 workflow 側の記録に委ねる。本サイクルでは起票・実装はしない。

---

## 3. サマリ

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| current（新規未タスク） | **0** | 全 AC が単一 PR 1 サイクルで完了 |
| baseline（将来候補・参照のみ） | 0（新規起票なし） | 親 workflow `admin-requests-queue-rename-and-publish-dependency` の記録を参照 |
| visual capture（Phase 13 user-gated） | 3 | 3 canonical PNG（実装完了後・user 承認後に取得。current 未タスクではない） |
