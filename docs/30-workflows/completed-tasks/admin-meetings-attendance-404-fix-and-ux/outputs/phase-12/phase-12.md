**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

> 本ワークフローは admin `/admin/meetings` の「開催日追加 404 修正（proxy transport 統一）」と「出席管理 UI/UX 改善（人数バッジ / 氏名 / 導線）」を apps/web に実装し、focused Vitest でローカル検証した。commit / PR / staging deploy / screenshot は user-gated。

## このフェーズの目的

Task A（proxy を `server-fetch.ts` と同一の service binding 優先 transport へ統一し 404 を解消）と Task B（出席人数バッジ・出席者氏名・運用導線）の実装可能粒度を、実装ガイド・システム仕様判定・更新履歴・未タスク検出・skill フィードバック・compliance check として strict 7 outputs に固定する。

## 実施・証跡結果（implemented_local_runtime_pending）

| 項目 | 結果 |
| --- | --- |
| 実装 | completed_local。対象 4 ファイル + focused tests を変更 |
| focused Vitest | PASS: 4 files / 15 tests（route transport / 出席者氏名 / 出席人数バッジ・導線） |
| web typecheck / lint | PASS（`pnpm --filter @ubm-hyogo/web typecheck` / `pnpm --filter @ubm-hyogo/web lint`） |
| Phase 12 compliance | PASS（`pnpm verify:phase12-compliance`） |
| staging 実測（`POST /api/admin/meetings` 201） | pending（user-gated） |
| screenshots | pending（user-gated staging）。canonical 名: `admin-meetings-attendance-after-fix.png` / `admin-meetings-attendance-count-badge.png` |

## Phase 12 タスクサマリ（Task 12-1〜12-6）

| Task | 名称 | 本サイクルでの扱い | 成果物 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（2 パート構成） | transport 3 分岐の確定コード（`getAdminServiceBinding` / `binding.fetch` / `logAdminTransport`）+ UI props（`attendedCounts` / `nameOf`）+ 視覚証跡 boundary を記述 | `implementation-guide.md` |
| 12-2 | システム仕様書更新（Step 1 + 条件付き Step 2） | Step 1-A〜1-C を記述。Step 2 は proxy 内部 transport 変更で API contract 不変のため N/A 判定 | `system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴作成 | workflow-local 同期 / global skill sync を別ブロックで記録（全 Step 該当なしも含め個別明記） | `documentation-changelog.md` |
| 12-4 | 未タスク検出（0 件でも必須） | current 0 件 / baseline 2 件（INTERNAL_API_BASE_URL 実値修正・CSV import UI 化）は構造的別件で起票不要 | `unassigned-task-detection.md` |
| 12-5 | スキルフィードバックレポート（改善点なしでも必須） | transport mirror / state 由来カウント / implemented_local_runtime_pending VISUAL の 3 観点を記録（新規 SKILL 昇格 no-op） | `skill-feedback-report.md` |
| 12-6 | Phase 12 compliance check（canonical 9 headings + strict 7） | strict 7 全 present・workflow_state 一致・Phase 11 runtime screenshot pending を確認 | `phase12-task-spec-compliance-check.md` |

## strict 7 outputs 一覧（成果物索引）

| # | ファイル | リンク | 役割 |
| --- | --- | --- | --- |
| 1 | `main.md` | [main.md](main.md) | Phase 12 全体サマリと strict 7 への索引 |
| 2 | `implementation-guide.md` | [implementation-guide.md](implementation-guide.md) | Part 1（概念）+ Part 2（技術: transport 型 / binding.fetch / props / エラー）+ 視覚証跡 |
| 3 | `system-spec-update-summary.md` | [system-spec-update-summary.md](system-spec-update-summary.md) | Step 1（完了記録・状況・関連タスク）+ Step 2 判定（N/A） |
| 4 | `documentation-changelog.md` | [documentation-changelog.md](documentation-changelog.md) | 全 Step 結果の個別記録（workflow-local / global 別ブロック） |
| 5 | `unassigned-task-detection.md` | [unassigned-task-detection.md](unassigned-task-detection.md) | 未タスク検出（current 0 / baseline 2 + 関連タスク差分） |
| 6 | `skill-feedback-report.md` | [skill-feedback-report.md](skill-feedback-report.md) | テンプレート / ワークフロー / ドキュメント改善 |
| 7 | `phase12-task-spec-compliance-check.md` | [phase12-task-spec-compliance-check.md](phase12-task-spec-compliance-check.md) | canonical 9 headings + strict 7 present 確認 |

> `phase-12.md` は既存参照互換の mirror summary。strict 7 の正本先頭は `main.md`。

## 実装対象（参照）

| パス | 種別 | タスク |
| --- | --- | --- |
| `apps/web/app/api/admin/[...path]/route.ts` | 編集済み | A（transport 統一） |
| `apps/web/app/api/admin/[...path]/route.spec.ts` | 編集済み | A focused test |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集済み | B1（氏名表示） |
| `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集済み | B2/B3（人数バッジ・導線） |
| `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集済み | B1/B2/B4（attendance count state 配線） |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` / `MeetingTimeline.spec.tsx` / `MeetingsClientShell.spec.tsx` | 新規/編集済み | B focused tests |

> apps/api（endpoint / D1 schema / Hono ルート）/ Google Form 仕様 / `useAdminMutation` hook / `api.ts` attendance パス / `server-fetch.ts` / `env.ts` は不変。

## 状態

- `workflow_state: implemented_local_runtime_pending`（実コード・focused tests 完了。staging screenshot は user-gated）。
- Step 1-A〜1-C は current facts として aiworkflow-requirements へ同期。
- Step 2 は proxy 内部 transport 変更で API contract 不変のため N/A。

## Issue 状態の注記

- 本タスクは `issue: null` / `issue_state: n/a`（起点は staging 実機エラーのユーザー報告）。Issue 化は未実施で、本ワークフローでは Issue 操作を行わない。

## 不変条件（実装時の遵守事項）

1. 既存 API のみ接続（#1）
2. OKLch トークン正本（#2、HEX 直書き禁止・`verify-design-tokens` 対象）
3. `apps/web` から D1 直接アクセス禁止（#5）
4. admin form input は FormField / primitive 経由（#9）
5. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（#10、legacy `@/lib/useAdminMutation` 不使用）
