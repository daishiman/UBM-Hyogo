# Workflow: issue-1088-manual-form-resync-sync-duration-display

> **[実装区分: 実装仕様書 / implementation]**
> **[implementation_mode: new]** — issue #1088（Task B 手動フォーム再取込 follow-up・取込所要時間 `durationMs` 表示）は
> ベースライン調査時点では未実装だったが、本ブランチで backend（`apps/api`）と frontend（`apps/web`）の
> **両輪を 1 実装サイクルで完了**した。コミット・PR・staging deploy・authenticated runtime screenshot・
> issue 状態変更はユーザー明示指示まで行わない（CONST_002）。

GitHub issue [#1088](https://github.com/daishiman/UBM-Hyogo/issues/1088)
（`task-b-manual-form-resync-followup-001-sync-duration-display`）を、task-specification-creator skill の
Phase 1〜13 実行可能仕様書へ展開したもの。消費元は
`docs/30-workflows/completed-tasks/task-b-manual-form-resync-followup-001-sync-duration-display.md`。

- ブランチ: `docs/issue-1088-sync-duration-display-spec`
- ベースブランチ: `dev`
- 起票元: GitHub issue #1088（ユーザー依頼で調査 → 未実装確認 → Phase 1-13 化）
- **issue 状態**: **OPEN**（ユーザー認識「クローズド」と乖離。本 workflow は GitHub issue 状態を変更しない）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| implementation_mode | `new`（durationMs は未実装ベースラインから新規 RED/GREEN 済み） |
| タスク分類 | UI task（VISUAL・結果テーブルに表示行追加） |
| visualEvidence | `VISUAL_ON_EXECUTION`（結果 `<dl>` に durationMs 行追加。実 PNG は admin 認証 + runtime sync 必須のため user-gated・pending） |
| workflow_state | `implemented_local_evidence_captured`（実装・focused tests・typecheck/lint は local 完了。runtime screenshot / commit / PR は user-gated） |
| 改修対象（backend） | `apps/api/src/jobs/sync-forms-responses.ts`（`ResponseSyncResult` + `runResponseSync()` 3 経路） |
| 改修対象（frontend） | `apps/web/src/features/admin/diagnostics/manual-sync.ts`, `.../components/_sync/ManualFormResyncPanel.client.tsx` |
| 親 workflow | `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` |

---

## 0. 調査結論（実装要否判定）

| 確認項目 | 結果 | 根拠（current facts） |
|---------|------|----------------------|
| `durationMs` は他タスクで解決済みか | **No（未解決）** | frontend / backend のいずれにも resync 経路の durationMs 無し |
| frontend schema に durationMs があるか | **No** | `manual-sync.ts:3-12` `SyncResultSchema` = status/jobId/processedCount/writeCount/cursor/skippedReason? のみ・`.strict()` |
| UI に durationMs 行があるか | **No** | `ManualFormResyncPanel.client.tsx:34-42` `resultRows()` に durationMs 行なし |
| backend が durationMs を返すか | **No** | `sync-forms-responses.ts:99-107` `ResponseSyncResult` に durationMs 無し・`runResponseSync()` 3 経路（succeeded/failed/skipped）とも未計測 |
| route が durationMs を付与するか | **No** | `responses-sync.ts:50-58` は `runResponseSync()` の result を素通し（変更不要） |
| 計測基盤の流用元 | あり（別パターン） | `sync/types.ts` `DiffSummary.durationMs` / `sync/audit.ts` `withSyncMutex` / `sync/manual.ts:87` は `durationMs:0` ハードコード（resync 経路は非経由） |

**結論**: 実装が必要。issue は最新コードと整合しており古くなっていない。唯一の最適化は backend producer を
曖昧な「sync use-case」から現行の正確な実体（`runResponseSync()` + `ResponseSyncResult`）へ pin したこと。

---

## 0b. 根本問題と解法（両輪 1 サイクル）

- **根本問題**: resync 経路（`runResponseSync`）は他 sync が持つ計時基盤（`DiffSummary.durationMs` / `withSyncMutex`）を経由せず、所要時間を一切返さない。UI だけ行追加しても値は常に `undefined`。
- **解法**: backend で `runResponseSync()` の開始〜終了を計測し `ResponseSyncResult.durationMs` で返す → frontend `SyncResultSchema` に `durationMs` を optional 追加（`.strict()` 維持で parse エラー回避）→ `resultRows()` に行追加（欠落時 `-` fallback）。両輪を同一 PR で実装する。

---

## Phase 一覧

| Phase | 名称 | 主眼 |
|-------|------|------|
| 1 | 要件定義 | scope/AC/inventory + 未実装ベースライン固定 + 命名規則確認 |
| 2 | 設計 | backend 計時の責務境界・3 経路返却・schema 順序・状態所有権 |
| 3 | 設計レビュー | 4 条件評価 + Phase 4 進行判定 |
| 4 | テスト作成 | RED: backend durationMs 3 経路 / schema optional / UI 行 / contract |
| 5 | 実装 | GREEN: ResponseSyncResult + runResponseSync 計時 + schema + resultRows |
| 6 | テスト拡充 | fail/skipped path・欠落 fallback・既存退化 guard |
| 7 | カバレッジ確認 | 変更面（job/schema/panel）の line/branch 実測 |
| 8 | リファクタリング | 計時 helper 重複点検・既存パターン整合 |
| 9 | 品質保証 | typecheck / lint / トークン / 不変条件の一括判定 |
| 10 | 最終レビュー | AC-1..AC-6 充足判定・blocker 判定 |
| 11 | 手動テスト | VISUAL（durationMs 行の表示確認。runtime screenshot は user-gated・代替証跡記録） |
| 12 | ドキュメント更新 | implementation-guide / spec sync / 未タスク / feedback |
| 13 | PR作成 | user 明示承認後のみ |

---

## Phase 仕様書リンク

- [Phase 1 — 要件定義](phase-1.md)
- [Phase 2 — 設計](phase-2.md)
- [Phase 3 — 設計レビュー](phase-3.md)
- [Phase 4 — テスト作成](phase-4.md)
- [Phase 5 — 実装](phase-5.md)
- [Phase 6 — テスト拡充](phase-6.md)
- [Phase 7 — カバレッジ確認](phase-7.md)
- [Phase 8 — リファクタリング](phase-8.md)
- [Phase 9 — 品質保証](phase-9.md)
- [Phase 10 — 最終レビュー](phase-10.md)
- [Phase 11 — 手動テスト](phase-11.md)
- [Phase 12 — ドキュメント更新](phase-12.md)
- [Phase 13 — PR作成](phase-13.md)

---

## 正本順位（衝突時の優先度）

1. landed 実コード（`apps/api/...` / `apps/web/...` の current facts）
2. 本 workflow `phase-1.md`（AC-1..AC-6）
3. 消費元 `docs/30-workflows/completed-tasks/task-b-manual-form-resync-followup-001-sync-duration-display.md`（issue #1088 本文・drift 部分は (1) 優先）
4. 親 workflow `docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/`
5. `docs/00-getting-started-manual/specs/*.md`
