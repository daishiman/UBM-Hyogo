# Phase 12 main — admin-meeting-bulk-attendance-select

## サマリ

本 Phase 12 パッケージは「開催日ドロワーの出席追加を複数会員同時選択 → 一括追加に是正」タスク
（`admin-meeting-bulk-attendance-select`）の **implemented_local_evidence_captured** close-out 成果物群である。
本 wave で apps/web 実装・focused tests・typecheck/lint/token gate・aiworkflow 正本同期まで完了した。

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation` / visualEvidence: `VISUAL`
- implementation_mode: `edit`（既存 `_meetings` コンポーネント / `api.ts` / `globals.css` を編集。新規ファイルは Checkbox primitive / hook / 純関数 / 2 コンポーネント / テスト）
- スコープ: `apps/web` のみ（admin 開催日/出席管理 `/(admin)/admin/meetings`）。API / D1 / Google Form は非変更（不変条件 #1 #5、AC-12）。
- 再利用 endpoint（無変更）: `POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false`
- PR base: `dev`。local fixture screenshot 7 枚は取得済み。commit / push / PR / staging 視覚 baseline は user-gated。

本タスクは「会員 N 人の出席登録に N 回の (select → click) が必要」という操作コストの是正である。配置（開催日
ドロワー内）は情報設計上正しいため変更せず、操作方式のみを一括化する。ユーザー選択により、ドロワー内
チェックリスト（主経路）と大量選択モーダル（補助経路）の 2 経路を提供し、選択ロジックを `useBulkAttendanceSelection`
に集約する。

## strict 7 索引

| # | ファイル | 役割 | 状態 |
| - | --- | --- | --- |
| 1 | [`main.md`](main.md) | Phase 12 サマリ・strict 7 索引 | present |
| 2 | [`implementation-guide.md`](implementation-guide.md) | Part 1（中学生レベル例え話）+ Part 2（型 / API 契約 / コード例 / 変更ファイル Before→After / 検証コマンド） | present |
| 3 | [`system-spec-update-summary.md`](system-spec-update-summary.md) | Step 1（ドキュメント反映）完了記録 / Step 2 = N/A（新規 shared 型なし・既存 endpoint 再利用） | present |
| 4 | [`documentation-changelog.md`](documentation-changelog.md) | 本 wave で作成した strict 7・実装予定ファイル・workflow-local / global skill sync 分離・validator 結果 | present |
| 5 | [`unassigned-task-detection.md`](unassigned-task-detection.md) | current 0 件 / baseline M-1（CSV アップロード UI）・M-2（route 二系統統合）・関連タスク差分確認 | present |
| 6 | [`skill-feedback-report.md`](skill-feedback-report.md) | 改善点（SubAgent 別 route 誤報 → 直接 Read 訂正 / 既存 endpoint 再利用で API 変更ゼロ） | present |
| 7 | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) | canonical 9 見出し準拠 / Task 12-1..12-6 + Step 1-A..1-C / Step 2 / 4 条件 verdict | present |

## Phase 12 タスク完了状況

| Task | 名称 | 状況 | 成果物 |
| --- | --- | --- | --- |
| Task 1 | 実装ガイド作成（Part 1/Part 2） | completed (spec content) | [`implementation-guide.md`](implementation-guide.md) |
| Task 2 | システム仕様更新サマリ（Step 1-A〜1-C + Step 2） | completed (spec content) | [`system-spec-update-summary.md`](system-spec-update-summary.md) |
| Task 3 | ドキュメント更新履歴 | completed (spec content) | [`documentation-changelog.md`](documentation-changelog.md) |
| Task 4 | 未タスク検出レポート（current 0 / baseline 2） | completed (spec content) | [`unassigned-task-detection.md`](unassigned-task-detection.md) |
| Task 5 | スキルフィードバックレポート | completed (spec content) | [`skill-feedback-report.md`](skill-feedback-report.md) |
| Task 6 | Phase 12 仕様準拠チェック | completed (spec content) | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) |

## same-wave sync（implemented_local_evidence_captured）

| Step | 本タスクでの扱い |
| --- | --- |
| Step 1-A | 仕様書の Phase 1-13 成果物と local implementation evidence を workflow root（index.md / phase-12-documentation.md）に集約。implemented_local_evidence_captured の active workflow として aiworkflow-requirements の workflow inventory / quick-reference / resource-map / task-workflow-active / changelog へ同 wave 同期 |
| Step 1-B | 実装状況テーブルに `implemented_local_evidence_captured` を記録（staging visual / PR は user-gated） |
| Step 1-C | 関連タスクテーブル: M-1 / M-2 を baseline（CONST_007 例外候補）として current facts に記録。current 由来の起票必須未タスクは 0 件 |
| Step 2 | N/A（新規 shared 型 / API endpoint / IPC 契約 / D1 schema の追加なし。既存 import endpoint 再利用と UI 表示のみ。詳細は system-spec-update-summary.md） |

## スコープ境界

本サイクルで閉じた範囲（AC-1..AC-12、すべて `apps/web`）:

- `lib/admin/api.ts` に `importAttendance(sessionId, memberIds)` を追加（既存 endpoint 再利用）。
- `components/ui/Checkbox.tsx` 新規 primitive（OKLch トークンのみ・FormField 互換）。
- `_meetings/useBulkAttendanceSelection.ts` 新規 hook（選択 Set / toggle / 全選択 / 絞込 / stale 除去）。
- `_meetings/bulk-attendance-message.ts` 新規純関数（失敗内訳の toast 文言生成）。
- `_meetings/BulkAttendanceChecklist.tsx`（主経路）/ `BulkAttendanceModal.tsx`（補助経路）新規。
- `_meetings/MeetingAttendanceDrawer.tsx` / `MeetingsClientShell.tsx` / `index.ts` 編集。
- `styles/globals.css` に `.bulk-attendance-*` / `.ui-checkbox` CSS（OKLch トークン）。
- focused tests 6 ファイル（`.spec.ts(x)`）。

スコープ外（baseline・CONST_007 例外候補）:

- M-1: CSV ファイルアップロード一括取込 UI（import endpoint の email 行・dryRun preview 活用）→ 将来の別 UX。
- M-2: attendance route 二系統（plural toggle / import）の API 統合 → apps/api スコープの別タスク。

## user-gated 境界

authenticated staging screenshot / staging 視覚 baseline / commit / push / PR は、ユーザー明示承認後に実行する。
apps/web 実装コード、focused tests、local fixture screenshot 7 枚は本 cycle で完了済み。
