# 開催日 出席者「複数会員一括追加」UI/UX 是正タスク仕様書

- task_id: `admin-meeting-bulk-attendance-select`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 §実装区分判定 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・focused tests・typecheck/lint/token gate 完了。commit・PR・staging 視覚証跡は user-gated）
- スコープ: `apps/web`（admin 開催日/出席管理画面）のみ。**API/D1/Form 非変更**（不変条件 #1 #5・UI prototype alignment 不変条件 #1）

## 目的

staging `/(admin)/admin/meetings`（開催日 / 出席管理）の各開催日ドロワーで、
出席者を **単一 `<select>` で 1 名ずつ「会員を選択 → 出席を追加」する** 現状を是正し、
**複数会員を同時選択して一括追加できる** UI/UX へ整える。会員数が増えても運用が破綻しない導線にする。

ユーザー要望（原文要約）:
> 開催日一覧で出席者を入力する「会員を選択」が 1 個ずつ選択 → 追加で手間。人数が増えると対応しきれない。
> UI/UX エンジニアとして整えてほしい。出席者入力項目をこの開催日一覧内に置くのが最適かも含めて、配置場所も検討して。

## 配置場所の結論（Phase 1 §配置分析の要約）

出席は「その開催日に属する情報」であり、**開催日ドロワー内に配置するのが情報設計上最適**（コンテキスト局所性）。
真の課題は配置ではなく **1 件ずつの操作** にあると判断。よって配置はドロワー内を維持し、操作方式を一括化する。
ユーザー選択（AskUserQuestion 回答: 「両方」）に従い、次の 2 経路を提供する:

1. **ドロワー内 簡易チェックリスト**: 検索可能な会員チェックリスト + 「選択した N 名を一括追加」ボタン（少〜中人数の主経路）
2. **大量選択モーダル**: 「人数が多い時はこちら」から開く全画面モーダル（検索 / 絞り込み / 全選択 / 一括追加。多人数の補助経路）

## 根本原因（確定 / 実コード Read 裏取り済み）

| # | 事象 | 根本原因 | 裏取り anchor |
| --- | --- | --- | --- |
| RC-1 | 1 名ずつしか追加できない | `MeetingAttendanceDrawer.tsx` の出席追加 UI が単一 `<select>` + 単発 `onAddAttendance(picked)` | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx:84-115` |
| RC-2 | 一括追加の受け皿が UI に無い | 一括取込 API は**既に存在**するが web 未配線 | `apps/api/src/routes/admin/attendance.ts:120-175`（`POST /meetings/:sessionId/attendance/import`） |
| RC-3 | 複数選択 primitive 不在 | `apps/web/src/components/ui/` に Checkbox / multi-select 無し（`Select.tsx` のみ） | `apps/web/src/components/ui/`（`ls` 実測） |

## 既存資産の再利用（API 変更ゼロの根拠）

- 一括取込 endpoint `POST /admin/meetings/:sessionId/attendance/import?dryRun=false` が `apps/api` に実装・mount 済み（`apps/api/src/index.ts:283`）。
- web は catch-all proxy `apps/web/app/api/admin/[...path]/route.ts` 経由で `/api/admin/*` を Worker に転送するため、**追加 proxy route も不要**で到達可能。
- 一括取込の commit は **all-or-nothing**（`import-attendance-bulk.ts:247-252`: 全行 `status==="ok"` の時のみ commit）。出席済を選択不可にし fresh memberId のみ送る設計でこの制約を満たす。

## スコープ（本サイクル完結＝AC-1..AC-12）

Phase 1 の AC-1..AC-12 を正本とする。本サイクル（03.実装.md 1 サイクル）で完結（CONST_007）。

| 柱 | 内容 | 主な変更ファイル（予定） |
| --- | --- | --- |
| 一括取込 web client | `importAttendance(sessionId, memberIds)` を追加し `/attendance/import?dryRun=false` を叩く | `apps/web/src/lib/admin/api.ts` |
| ドロワー多選択化 | 単一 `<select>` を残しつつ、検索可能チェックリスト + 「選択 N 名を一括追加」を追加 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` |
| 大量選択モーダル | 検索/全選択/一括追加モーダルを新規コンポーネントとして追加 | `.../_meetings/BulkAttendanceModal.tsx` |
| 選択状態 hook | memberId Set 選択・toggle・全選択・絞込・stale 除去を管理 | `.../_meetings/useBulkAttendanceSelection.ts` |
| 一括送信配線 | `MeetingsClientShell` に `onBulkAdd` を追加し `committed:true` の時だけ attended state を更新 | `.../_meetings/MeetingsClientShell.tsx` |
| Checkbox primitive | `apps/web/src/components/ui/Checkbox.tsx` を新規追加（token 準拠） | `apps/web/src/components/ui/Checkbox.tsx` |
| CSS | チェックリスト / モーダル / Checkbox のレイアウト CSS を OKLch トークンで追加 | `apps/web/src/styles/globals.css` |
| テスト | focused Vitest 10 files / 38 tests PASS、typecheck/lint/verify:tokens PASS | `.../__tests__/*.spec.ts(x)` |

## スコープ外（本サイクルで扱わない・理由明記）

| 項目 | 理由 | 扱い |
| --- | --- | --- |
| CSV ファイルアップロードによる一括取込 UI | 一括取込 API の `email` 行・dryRun preview を活用する別機能。今回の「候補から複数選択」とは UX が別物 | 未タスク化（Phase 12 で baseline 記録） |
| `apps/api` 側の attendance route 二系統（`meetings.ts` plural toggle と `attendance.ts` singular/import）の統合リファクタ | API 変更を伴い不変条件 #1 抵触・回帰リスク大 | 本タスク非対象（現行 endpoint をそのまま利用） |

> いずれも「今回サイクルで完了させると整合性破綻 / API 変更が必要」な CONST_007 例外条件に該当。分量都合の先送りではない。

## Acceptance Criteria

Phase 1 の AC-1..AC-12 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義（AC / 配置分析 / 前提検証 / 実装区分判定） | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（コンポーネント / state / endpoint 契約 / Checkbox / CSS / モーダル） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー（Phase 4 進行ゲート） | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット（VISUAL） | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期（strict 7 outputs） | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release（user-gated） | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-12 が実コードと Phase evidence に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
API/D1/Form 非変更（`git diff --name-only -- apps/api packages` が空）で apps/web のみに閉じ、
focused tests・typecheck・lint・token gate が PASS していること（CONST_005）。
