---
workflow_id: issue-1112-attendance-count-badge-emphasis
workflow_state: implemented_local_evidence_captured
created_at: 2026-06-05
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_evidence_captured
branch: docs/issue-1112-attendance-count-badge-emphasis-spec
issue: 1112
issue_state: CLOSED
---

# Issue #1112 — admin 開催日タイムラインの出席人数バッジに多数出席時の色強調を追加

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（`apps/web/src/features/admin/components/_meetings/meetingStats.ts` に出席レベル判定の
pure function と閾値定数を追加し、`MeetingTimeline.tsx` のバッジへ `data-attendance-level` 属性を付与し、
`globals.css` に既存 OKLch トークン経由の強調スタイルを追加し、`MeetingTimeline.spec.tsx` /
`meetingStats.spec.ts` に閾値別 assertion を追加する）を伴う。issue ラベルは `type:improvement`（docs-only ではない）。
受け入れ条件「出席人数の閾値に応じてバッジの見た目が変化」「色はすべて OKLch トークン経由」「新規 primitive を増やさない」は
いずれもコード変更なしでは達成不可能であり、CONST_004 の判定により実装仕様書として作成した。

## Issue 状態に関する注記

- GitHub Issue #1112 は再確認時点（2026-06-05）で `CLOSED`（`closedAt: 2026-06-05T14:14:37Z`）である。
- 本ワークフローでは **Issue 状態を一切変更しない**（reopen も close もしない）。`issue_state` は実態 `CLOSED` を記録する。
- 本ワークフローは仕様書作成に留めず、同一サイクルで実コード 5 ファイルを実装し、focused Vitest / typecheck /
  design-token gate / local Playwright screenshot を PASS させた。commit・push・PR・staging deploy・staging screenshot・Issue mutation は user-gated として残す。

## 事前調査結論（実装済みか否か）

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| 出席人数バッジの色強調 | **未実装** | `rg "attendance-level\|ui-badge--\|多数出席" apps/web/src` = 0 件。`MeetingTimeline.tsx:57` のバッジは `<span className="ui-badge">` で人数に関わらず単一描画。`data-attendance-level` / 閾値判定 / 強調 class は一切存在しない |
| 他タスクで解決済みか | **未解決** | 親 workflow `admin-meetings-attendance-404-fix-and-ux` 以降、`MeetingTimeline.tsx` への色強調系コミットは無い。`meetingStats.ts` に出席レベル判定関数は無い（`computeMeetingStats` のみ） |
| Issue 陳腐化 | **行番号は一致・前提に 1 点不正確あり** | issue 本文の行番号（`attendanceLabel` 35 行 / `ui-badge` 57 行）は現コードと一致。ただし issue は「既存 `ui-badge` primitive を基盤」とするが、**`.ui-badge` はどの stylesheet にも CSS 定義が存在しない**（Badge.tsx / MeetingTimeline.tsx の className 参照のみ）。正しい既存パターンは `globals.css` の `.admin-tag-status-badge[data-status="..."]`（data 属性セレクタ + `--status-*-bg` トークン背景 + OKLch 文字色）であり、本仕様はこれを正本パターンとして踏襲する |
| 強調用トークンの要否 | **新規トークン不要（既存で充足）** | `--status-success-bg` / `--status-neutral-bg` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--ubm-color-text-secondary` / `--ubm-color-ok` がすべて `tokens.css` に既存。→ `design-tokens.md` と `verify-design-tokens` gate の二重更新を回避でき、変更面が縮小する |

→ Issue #1112 は実行が必要なため、本ワークフローで Phase 1-13 の実装仕様書を作成し、同一サイクルでコード実装とローカル検証まで完了した。
staging visual evidence と GitHub 操作のみ user-gated とする。

## 目的

`/admin/meetings` 開催日タイムラインの各カード見出しに表示される出席人数バッジに、出席人数の閾値に応じた色強調
（未登録 / 通常 / 多数出席の 3 段階）を加え、運用者が複数の開催回を一覧でスキャンする際の判別性を高める。
強調色はすべて `apps/web/src/styles/tokens.css` の既存 OKLch トークン経由とし、新規 primitive を増やさない。

## 設計方針（要点）

| 項目 | 決定 |
| --- | --- |
| レベル判定 | `meetingStats.ts` に pure function `attendanceLevel(count): "none" \| "normal" \| "high"` と閾値定数 `ATTENDANCE_LEVEL_THRESHOLDS = { high: 10 }` を追加。単一の tuning point に集約し恣意性を排す |
| 閾値（3 段階） | `none`（0 名 = 未登録）/ `normal`（1〜9 名）/ `high`（10 名以上 = 多数出席・強調）。小規模会の開催実態に合わせ `high=10` を起点デフォルトとし、定数 1 箇所で調整可能にする（Phase 2 で根拠を固定） |
| バッジ属性 | `MeetingTimeline.tsx:57` のバッジ span に `data-attendance-level={attendanceLevel(attendanceCount)}` を付与。`className="ui-badge"` / `data-testid` は不変。**新規 primitive を生やさない**（invariant #3） |
| 強調 CSS | `globals.css` `@layer components` に `.admin-timeline__heading .ui-badge[data-attendance-level="..."]` を追加。`.admin-timeline__heading` でスコープし共有 `.ui-badge` 参照（Badge.tsx 経由含む）への波及を遮断。背景は `--status-*-bg` / `--ubm-color-accent-soft`、文字色は既存 text/ink/ok トークンのみを使用 |
| トークン | 新規追加なし。`design-tokens.md` / `verify-design-tokens` gate は不変 |
| アニメーション | 色のみの静的強調。`prefers-reduced-motion` 対応不要（animation を含まないため・実装メモに明記） |
| 不変条件 | 既存 API / D1 / Google Form 不変（#1〜#7）。出席集計（`getAttendanceCount` / `m.attendance`）は変更しない（表示層のみ） |

## 実装対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/_meetings/meetingStats.ts` | 編集 | `ATTENDANCE_LEVEL_THRESHOLDS` 定数 / `AttendanceLevel` 型 / `attendanceLevel(count)` pure function を追加 |
| `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集 | バッジ span（57 行）に `data-attendance-level={attendanceLevel(attendanceCount)}` を付与。`attendanceLabel` / `data-testid` / className は不変 |
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` に `.admin-timeline__heading .ui-badge[data-attendance-level="..."]` 強調スタイルを既存トークン経由で追加 |
| `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` | 編集 | 0 / 5 / 12 名で `data-attendance-level` が `none` / `normal` / `high` になる assertion を追加。既存 assertion は不変 |
| `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts` | 編集 | `attendanceLevel` の境界テスト（0→none / 1→normal / 9→normal / 10→high / 25→high / 負数→none）を追加 |

> 既存 API endpoint surface・D1 schema・Google Form 仕様・出席集計ロジック・`apps/web/src/styles/tokens.css` の
> トークン定義・`docs/00-getting-started-manual/specs/design-tokens.md` は**一切変更しない**。
> 強調は `data-attendance-level` 属性 + `.admin-timeline__heading` スコープに閉じ、共有 `.ui-badge` の既定挙動を変えない。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed (spec) |
| 2 | `outputs/phase-2/phase-2.md` | completed (spec) |
| 3 | `outputs/phase-3/phase-3.md` | completed (spec) |
| 4 | `outputs/phase-4/phase-4.md` | completed (spec) |
| 5 | `outputs/phase-5/phase-5.md` | completed (spec) |
| 6 | `outputs/phase-6/phase-6.md` | completed (spec) |
| 7 | `outputs/phase-7/phase-7.md` | completed (spec) |
| 8 | `outputs/phase-8/phase-8.md` | completed (spec) |
| 9 | `outputs/phase-9/phase-9.md` | completed (spec) |
| 10 | `outputs/phase-10/phase-10.md` | completed (spec) |
| 11 | `outputs/phase-11/phase-11.md` | completed (local evidence / staging visual pending) |
| 12 | `outputs/phase-12/phase-12.md`（サマリ: `outputs/phase-12/main.md`） | completed (implemented local evidence captured) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/1112
- 元タスク仕様（未タスク）: 親 `admin-meetings-attendance-404-fix-and-ux` Phase 10 §10.6 MINOR 指摘
- 親 workflow: `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`
- 対象 component: `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx`
- 対象 helper: `apps/web/src/features/admin/components/_meetings/meetingStats.ts`
- 既存テスト: `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx` / `meetingStats.spec.ts`
- 正本パターン: `apps/web/src/styles/globals.css` `.admin-tag-status-badge[data-status]`（1124-1150 行）
- トークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`
- プロトタイプ正本: `docs/00-getting-started-manual/claude-design-prototype/`
