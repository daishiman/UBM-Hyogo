---
workflow_id: admin-meetings-attendance-404-fix-and-ux
workflow_state: implemented_local_runtime_pending
created_at: 2026-06-02
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
implementation_status: implemented_local_runtime_pending
branch: docs/admin-meetings-attendance-404-and-ia-spec
issue: null
issue_state: n/a
---

# admin 開催日 / 出席管理 — 開催日追加 404 修正 + 出席管理 UI/UX 改善

## 実装区分

`[実装区分: 実装仕様書]`

本タスクはコード変更（apps/web の admin API proxy transport 統一 + 開催日/出席管理 UI 改修 + テスト追加）を伴う。
ユーザー指示は「対策をしてください」「ベストプラクティスな仕様で検討してください」であり、目的（staging で開催日追加を成功させる／出席管理を実用的な画面にする）はコード変更なしでは達成不可能。CONST_004 に従い、**実装仕様書**として作成した。

## 起点（ユーザー報告）

staging `/admin/meetings`（開催日 / 出席管理）で開催日を追加すると以下が発生:

```
POST https://ubm-hyogo-web-staging.daishimanju.workers.dev/api/admin/meetings 404 (Not Found)
画面表示: 「開催追加に失敗: HTTP 404」「開催日一覧 (0 件)」
```

加えてユーザーから「出席の管理ができる画面になっていない／開催日と出席管理を分けるのか、出席分析・会員管理で行うのか、ベストプラクティスな UI/UX を検討してほしい」との設計要望。

## 事前調査結論（真因確定・コードベースで検証済み）

### 真因 A: admin API proxy の transport 不整合（開催日追加 404 の根本原因）

| 観点 | 事実 | 根拠 |
| --- | --- | --- |
| 初期表示（GET）の経路 | Server Component が `safeServerFetch("/admin/meetings")` → `fetchAdmin` → **service binding `API_SERVICE`** 経由で apps/api を直接呼ぶ。**成功**（画面に「0 件」が表示される） | `apps/web/app/(admin)/admin/meetings/page.tsx:13-16`、`apps/web/src/lib/admin/server-fetch.ts:81-85,554-558` |
| 開催日追加（POST）の経路 | Client mutation `createMeeting` → `fetch("/api/admin/meetings")` → apps/web の proxy route handler → apps/api | `apps/web/src/lib/admin/api.ts:25-58,548-549`、`apps/web/src/features/admin/components/_meetings/MeetingCreateForm.tsx` |
| proxy の transport | proxy は service binding を**一切使わず** `INTERNAL_API_BASE_URL` への **HTTP fetch のみ**。binding 経路と非対称 | `apps/web/app/api/admin/[...path]/route.ts:16-26,70-71,100` |
| api 側 endpoint | `POST /admin/meetings` は**実在**（マウント済み） | `apps/api/src/routes/admin/meetings.ts:138`、`apps/api/src/index.ts:278` |
| 結論 | GET=service binding（最新 api に直結＝成功）/ POST=HTTP（`INTERNAL_API_BASE_URL` が指す HTTP エンドポイントが古い・到達不可・誤設定のいずれかで 404）。**transport 不整合が 404 の根本原因** | 上記の経路差 |

### 真因 B: 出席管理が「実用的な画面に見えない」原因

| 観点 | 事実 | 根拠 |
| --- | --- | --- |
| 出席登録 UI 自体は存在する | 開催日カードを展開すると `MeetingAttendanceDrawer` で出席追加/削除できる | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx:80-138` |
| しかし 404 で到達不能 | 開催日が 0 件 → 展開対象がない → 出席登録 UI に永久に到達できない | 真因 A |
| 発見性が低い | 「開催日を追加」フォームが主役。開催日カードに出席人数・「出席を記録」導線が無い | `MeetingTimeline.tsx:34-50`（カードに出席情報なし） |
| 出席者表示が memberId のみ | 出席者一覧が `<span>{memberId}</span>` で氏名がなく実用性が低い | `MeetingAttendanceDrawer.tsx:116-123` |

### 「二次バグ」と疑った出席追加パスは誤検出（訂正）

`addAttendance`（`api.ts:556` の複数形 `/meetings/:id/attendances` + `{memberId,attended}`）は、api 側 `meetings.ts:200` の `POST /meetings/:id/attendances` と**一致しており正しい**。404（真因 A）が直れば出席追加も動作する。

→ **結論: 本タスクは不要ではない。404 は proxy transport 不整合という確定した実バグであり、UI/UX 改善も実コードに未実装。1 サイクルで実装可能。**

## 設計方針（ユーザー承認済み）

ユーザーへの確認（AskUserQuestion）で以下が確定:

| 論点 | 決定 |
| --- | --- |
| IA 配置 | **開催日ページに統合**（Master-Detail）。attendance は DB 上 meeting に従属（FK `session_id`）するため親子構造が自然。出席分析（`/admin/dashboard/attendance`）は read-only 集計として別ページ維持。会員管理では出席は参照のみ |
| スコープ | **404 修正 + 出席管理 UI/UX 改善を一括**（1 サイクル完了） |
| 出席登録 UI 形式 | **一覧インライン展開**（現行 drawer 方式を改善）。開催は年 12 回程度のため専用ページ不要 |

## タスク分解（単一責務 / 1 サイクル完了 = CONST_007）

### Task A — admin API proxy を service binding 経由に統一（404 修正・P0）

| 項目 | 内容 |
| --- | --- |
| 修正の本質 | proxy route handler を `server-fetch.ts` と同一の transport ロジック（service binding `API_SERVICE` 優先 / 不在時のみ `INTERNAL_API_BASE_URL` HTTP fallback）に統一する |
| 既存資産 | `getAuthEnv()`（`apps/web/src/lib/env.ts:136-141`）は既に `API_SERVICE` binding を公開済み。proxy は既に `getAuthEnv()` を import 済み。**新アクセサ不要** |
| 期待効果 | GET/POST/PATCH/DELETE 全てが service binding 経由で最新 api に到達 → `POST /admin/meetings` 201 → 開催日追加成功。全 admin client mutation（tags resolve / member status / requests resolve 等）が同時に回復 |

### Task B — 出席管理 UI/UX 改善（実用性・発見性向上）

| 項目 | 内容 |
| --- | --- |
| B1 出席者氏名表示 | `MeetingAttendanceDrawer` の出席者一覧を `memberId` → `fullName`（candidates から解決）表示に変更。memberId は補助表示 |
| B2 出席人数バッジ | `MeetingTimeline` の開催日カード見出しに出席人数バッジ（`N 名出席`）を表示し、「出席を記録」導線（展開ボタンの aria/ラベル明示）を追加 |
| B3 空状態・導線改善 | 「開催日を作成 → 各回を展開して出席を記録」の運用導線をページ説明 / ヘルプテキストに明示 |
| 不変条件 | OKLch トークン正本（#2）/ FormField・primitive 経由（#9）/ 既存 API のみ（#1）/ D1 直接アクセス禁止（#5）/ legacy useAdminMutation 不使用（#10） |

## 実装対象ファイル

| パス | 種別 | タスク | 役割 |
| --- | --- | --- | --- |
| `apps/web/app/api/admin/[...path]/route.ts` | 編集 | A | service binding 優先 transport へ統一 |
| `apps/web/app/api/admin/[...path]/route.spec.ts`（または既存 test） | 新規/編集 | A | binding 優先・HTTP fallback の transport 選択 spec |
| `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | B1 | 出席者氏名表示 |
| `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 編集 | B2 | 出席人数バッジ + 導線 |
| `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集 | B1/B2/B3 | candidates→name map / attendedCounts 配線 / 導線テキスト |
| `apps/web/src/features/admin/components/_meetings/__tests__/*.spec.tsx` | 新規/編集 | B | 各 component の回帰 + 新挙動テスト |

> apps/api（endpoint / D1 schema / Hono ルート）、Google Form 仕様、`useAdminMutation` hook、`api.ts` の attendance パスは**一切変更しない**（不変条件 #1）。

## スコープ（CONST_007: 1 サイクル完了可能）

- **含む**: Task A（proxy transport 統一による 404 修正）+ Task B（出席者氏名 / 出席人数バッジ / 導線改善）。すべて apps/web 内で完結し、03.実装.md の 1 サイクルで実装可能。
- **含まない（先送りではなく構造的別件）**:
  - `INTERNAL_API_BASE_URL` の staging 実値修正（インフラ設定）— service binding 統一で root を解消するため不要。万一 binding 不在環境が残る場合のみ別途インフラ確認（DoD で staging 実測）。
  - 出席 CSV import の UI 化（既存 `POST /admin/meetings/:id/attendance/import` は実装済みだが本タスクの 404/UX 課題に不要）。

## Phase 一覧

| Phase | File | 状態 |
| --- | --- | --- |
| 1 | `outputs/phase-1/phase-1.md` | completed |
| 2 | `outputs/phase-2/phase-2.md` | completed |
| 3 | `outputs/phase-3/phase-3.md` | completed |
| 4 | `outputs/phase-4/phase-4.md` | completed |
| 5 | `outputs/phase-5/phase-5.md` | completed |
| 6 | `outputs/phase-6/phase-6.md` | completed |
| 7 | `outputs/phase-7/phase-7.md` | completed |
| 8 | `outputs/phase-8/phase-8.md` | completed |
| 9 | `outputs/phase-9/phase-9.md` | completed |
| 10 | `outputs/phase-10/phase-10.md` | completed |
| 11 | `outputs/phase-11/phase-11.md` | completed_local_evidence |
| 12 | `outputs/phase-12/phase-12.md` | completed |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## 関連リソース

- 正本 API 仕様: `docs/00-getting-started-manual/specs/01-api-schema.md:178-299`（MeetingSession / MemberAttendance / attendance endpoints）
- 正本管理画面仕様: `docs/00-getting-started-manual/specs/11-admin-management.md:64-256`（/admin/meetings 仕様）
- proxy 実装: `apps/web/app/api/admin/[...path]/route.ts`
- server fetch transport（修正の参照元）: `apps/web/src/lib/admin/server-fetch.ts:81-85,554-562`
- env アクセサ: `apps/web/src/lib/env.ts:136-141,174-184`
- 関連既存 workflow: `docs/30-workflows/completed-tasks/step-06-meetings-attendance-implementation/`、`docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/`
