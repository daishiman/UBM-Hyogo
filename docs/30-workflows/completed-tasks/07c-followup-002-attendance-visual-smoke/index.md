# 07c-followup-002-attendance-visual-smoke

```yaml
issue_number: 313
base_branch: dev
task_id: 07c-followup-002-attendance-visual-smoke
task_type: implementation
test_category: e2e
visual: VISUAL_ON_EXECUTION
workflow_state: implemented_local_evidence_captured
evidence_state: local_visual_evidence_pass
```

## タスク概要

`/admin/meetings` および `/admin/meetings/[id]` の出席（attendance）UI に対し、
ブラウザでの visual smoke evidence（screenshot 連番 + Playwright trace）を取得し、
07c 本体で残った NON_VISUAL 判定（duplicate add の挙動・登録済み member の非表示・delete 後 state 更新）を解消する。

実コードの drift も同サイクルで解消する:

- `apps/web/playwright/tests/attendance.spec.ts` の `TODO(08b)` 残留を un-skip 状態で完成させる
- `apps/web/playwright/page-objects/AdminMeetingsPage.ts` の selector（`attendance-candidate` / `attendance-register`）が detail page (`/admin/meetings/[id]`) にのみ存在することを反映
- standalone mock API (`apps/web/playwright/fixtures/auth.ts`) に `/admin/meetings/:id` endpoint を追加
- detail page の delete flow が UI 上に未実装である問題を仕様で扱う（後述の Phase 2 設計判断）

## 実装区分

[実装区分: 実装仕様書]

Playwright spec の追加・page object 拡張・standalone mock API endpoint 追加・evidence 保存パス整備・CI 配線を伴う実装サイクル。

## Phase 一覧

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | 要件定義 | completed |
| Phase 2 | 設計 | completed |
| Phase 3 | 設計レビュー | completed |
| Phase 4 | 詳細設計 | completed |
| Phase 5 | 実装計画 | completed |
| Phase 6 | 実装 | completed |
| Phase 7 | テスト実装 | completed |
| Phase 8 | テスト実行 | completed |
| Phase 9 | リファクタ | completed |
| Phase 10 | ドキュメント更新 | completed |
| Phase 11 | Visual evidence / screenshot 取得 | completed |
| Phase 12 | spec 同期・compliance check | completed |
| Phase 13 | レビュー・PR | blocked_pending_user_approval |

## 不変条件（Issue #313 + CLAUDE.md 由来）

| ID | 内容 | 根拠 |
|----|------|------|
| INV-01 | 既存 API endpoint surface のみ使用。`/admin/meetings/:id/attendances` の追加・変更禁止 | CLAUDE.md / 07c 本体 |
| INV-02 | `apps/web` から D1 直接アクセス禁止 | CLAUDE.md |
| INV-03 | OKLch tokens 正本。HEX 直書き / `bg-[#xxx]` 禁止。`verify-design-tokens` を fail させない | CLAUDE.md / task-18 |
| INV-04 | `attendance.spec.ts` の `TODO(08b)` を解消し、`test.skip` / `test.fixme` 不在で merge | quality-gates §7.3 |
| INV-05 | test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止） | CLAUDE.md |
| INV-06 | baseline 画像更新（`*-snapshots/*.png`）は user-gated。本タスクの自動 PR で `--update-snapshots` を実行しない | task-18 W7 |
| INV-07 | CONST_007 — Phase 1-13 を 1 サイクル内で完了（先送り禁止） | task-specification-creator |
| INV-08 | mock の二重実装禁止。standalone mock を single source of truth とする | phase-11-screenshot-guide |
| INV-09 | `provenance: local-mock` を `phase11-capture-metadata.json` に明記。staging fresh と取り違えない | phase-11-screenshot-guide |
| INV-10 | Phase 11 evidence は tracked `.txt` / `.json` のみ canonical（`.log` 不可） | task-18 W7 |

## 依存タスク

| 依存 | 関係 | 備考 |
|-----|------|------|
| 06c admin UI | upstream | `MeetingPanel` / `MeetingAttendancePanel` の UI が前提 |
| 07c attendance audit API | upstream | `/admin/meetings/:id/attendances` POST attended=true/false が前提（変更禁止） |
| 08b Playwright E2E | sibling | 同 e2e suite 配下に spec を追加 |
| task-18 visual regression suite | adjacent | `playwright-smoke.yml` の CI gate を共用 |

## 既存資産（参照のみ）

| パス | 用途 |
|-----|------|
| `apps/web/playwright/tests/attendance.spec.ts` | 拡張対象（TODO 解消） |
| `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | selector / method を拡張 |
| `apps/web/playwright/fixtures/auth.ts` | standalone mock に endpoint 追加 |
| `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | register UI（delete 未実装） |
| `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | SSR fetch source |
| `apps/web/src/components/admin/MeetingPanel.tsx` | list page の attendance + delete UI |
| `.github/workflows/playwright-smoke.yml` | CI 配線対象 |

## 受入条件サマリ（詳細は Phase 1）

- AC-1: candidates panel が削除済み member（`isDeleted=true`）を表示しない screenshot
- AC-2: candidates panel が登録済み member（既に attendees に含まれる）を「登録済」可視化する screenshot
- AC-3: 重複 add 時の 409 / 既登録 path で toast が表示される screenshot
- AC-4: delete 後に attendance state が更新される screenshot 連番 + Playwright trace
- AC-5: evidence 保存先 `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/`
- AC-6: `attendance.spec.ts` un-skip 完成 + `e2e-skip-count.txt = 0`
- AC-7: CI gate `playwright-smoke / smoke (chromium)` に focused attendance visual smoke が配線される。実 GitHub Actions PASS は commit / push / PR 後の user-gated evidence として扱う

## 1 行実行コマンド

```bash
PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium
```
