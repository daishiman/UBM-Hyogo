# Phase 1: 要件定義

**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-attendance-404-fix-and-ux` |
| issue | なし（ユーザー報告起点・staging 実機エラー） |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION`（admin 画面 `/admin/meetings` の表示・挙動変更を含む） |
| implementation_mode | `new`（404 修正・UI 改修ともに現行コードに未実装） |
| タスク分類 | **UI task（VISUAL）** — admin backoffice 画面の表示と client mutation 経路の修正 |

## 1.1 真の論点

> **主問題（1 文）**: staging の `/admin/meetings` で開催日を追加できない（`POST /api/admin/meetings` が 404）。これにより出席登録 UI にも到達できず、出席管理機能が「存在しない画面」に見えている。

論点の切り分け（1 提案に複数案件が混在していないか）:

- **案件 1（バグ）**: client mutation の proxy 経路が 404。→ **transport 不整合**が根本（現象は「404」だが原因は「service binding 経路と HTTP 経路の非対称」）。
- **案件 2（UX/IA）**: 出席管理の発見性・実用性が低い。→ 404 が直っても、出席人数表示・氏名表示・導線が無いと「出席管理に見えない」課題は残る。
- `why now`: staging で開催日追加が完全にブロックされ、運用開始できない。
- `why this way`: proxy を service binding 経由（既存 `server-fetch.ts` と同一）に統一すれば、`INTERNAL_API_BASE_URL` の値依存を排除し、GET と同じ最新 api に確実に到達できる。インフラ設定（env 値修正）より堅牢で再発しない。

副次論点（IA）: 「開催日」「出席記録」「出席分析」の 3 概念の責務境界 → §1.8 で整理。

## 1.2 carry-over 確認（前タスク成果物の棚卸し）

`git log --oneline -5`:

| commit | 内容 | 本タスクとの差異 |
|---|---|---|
| `c0f78bb28` (#1072) | identity-conflicts dismiss 楽観更新 | 無関係（admin identity 領域） |
| `bd0393a29` (#1083) | member 本人プロフィール写真 | 無関係 |
| `5c31ef353` (#1084) | member 動的 OG worker 分離 | 無関係 |

関連既存実装（completed-tasks）:

| workflow | 提供済み資産 | 本タスクとの関係 |
|---|---|---|
| `step-06-meetings-attendance-implementation` | 開催日/出席の mutation UI（drawer / api.ts） | 本タスクが改善対象。出席登録 UI 自体は存在 |
| `admin-attendance-analytics-redesign` | `/admin/dashboard/attendance` 分析画面 | 別ページ・read-only。本タスクは触らない（IA 分離維持） |
| `07c-parallel-meeting-attendance-and-admin-audit-log-workflow` | attendance endpoints（audit / idempotency） | api 側は完成済み。本タスクは apps/web のみ |

→ 本タスクの新規作業 = ① proxy transport 統一（404 修正）② 開催日カードの出席人数・氏名・導線。api 側・分析画面は再実装不要。

## 1.3 既存コード命名規則の分析（FB-01: 仕様書 vs 実装名ズレ検出）

実コードで確認済みの現行命名（踏襲する）:

| 種別 | 現行命名 | 本タスクで踏襲 |
|---|---|---|
| proxy transport（server 側） | `getAdminServiceBinding()` / `binding.fetch(...)` / `logAdminTransport("service-binding"|"http-fallback", ...)` | proxy route handler に**同パターンを移植**（命名一貫） |
| env アクセサ | `getAuthEnv()` / `getAdminFetchEnv()`（ともに `API_SERVICE` を公開） | proxy は既存 `getAuthEnv().API_SERVICE` を使用 |
| meeting state | `attended: Record<string, Set<string>>`（`MeetingsClientShell`） | 出席人数は `attended[sessionId].size` から算出（新 state を増やさない） |
| candidate | `MemberCandidate { memberId; fullName }` | 氏名解決に `candidates` を流用（新規 fetch しない） |
| component | `MeetingTimeline` / `MeetingAttendanceDrawer` / `MeetingsClientShell` / `computeMeetingStats` | 既存を編集（新規 primitive を増やさない・不変条件 #9） |

→ 命名ズレなし。proxy 修正は `server-fetch.ts` の transport 命名を踏襲し一貫性を確保。

## 1.4 受け入れ基準（AC）

### Task A — 404 修正（proxy transport 統一）

- [ ] AC-A1: `apps/web/app/api/admin/[...path]/route.ts` が、`API_SERVICE` service binding が存在する場合は binding 経由（`binding.fetch`）でリクエストを転送する。
- [ ] AC-A2: service binding が存在しない場合のみ `INTERNAL_API_BASE_URL` への HTTP fetch に fallback する（local dev 互換）。binding も URL も無い場合は従来どおり 500（`internal_api_base_url_missing`）。
- [ ] AC-A3: transport 統一後も既存の admin gate（`requireAdmin` 403）・`needsSyncAdminBearer`・cookie/authorization/content-type の中継・GET/POST/PATCH/DELETE 振り分け・body 中継は不変。
- [ ] AC-A4: staging で `POST /api/admin/meetings`（cookie 付き・有効 body）が 201 を返し、開催日が一覧に追加される（DoD = staging 実測）。
- [ ] AC-A5: 他の admin client mutation（tags resolve / member status / requests resolve）が回帰しない（同 proxy 経由のため同時に検証）。

### Task B — 出席管理 UI/UX 改善

- [ ] AC-B1: 開催日カードを展開した出席者一覧で、各出席者が**氏名**（`candidates` から `memberId`→`fullName` 解決）で表示される。解決不能時のみ `memberId` を表示（fallback）。
- [ ] AC-B2: 開催日カード見出しに出席人数バッジ（例「3 名出席」/ 0 名時は「未登録」）が表示される。
- [ ] AC-B3: 開催日カードの展開操作が「出席を記録/編集する」導線として識別できる（aria-label / 可視ラベル）。
- [ ] AC-B4: 開催日が 1 件以上あるとき、「各回を展開して出席を記録できる」旨の運用導線テキストが表示される。
- [ ] AC-B5: OKLch トークン正本（HEX 直書き禁止・#2）、FormField/primitive 経由（#9）を維持。新規 primitive を増やさない。

## 1.5 inventory（変更対象と不変境界）

| カテゴリ | 対象 | 扱い |
|---|---|---|
| 変更 | `apps/web/app/api/admin/[...path]/route.ts` | service binding 優先 transport へ統一（Task A） |
| 変更 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 出席者氏名表示（B1） |
| 変更 | `apps/web/src/features/admin/components/_meetings/MeetingTimeline.tsx` | 出席人数バッジ + 導線（B2/B3） |
| 変更 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | candidates→name map / attendedCounts 配線 / 導線テキスト（B1/B2/B4） |
| 追加/編集 | 上記の `__tests__/*.spec.{ts,tsx}` | transport spec + component spec（`*.spec` のみ・不変条件 #8） |
| 不変 | `apps/api/**`（meetings.ts / attendance.ts / index.ts / D1 migrations） | API contract・endpoint・schema 不変（#1） |
| 不変 | `apps/web/src/lib/admin/api.ts` | attendance パス（複数形 attendances）は api と一致しており変更しない |
| 不変 | `apps/web/src/lib/admin/server-fetch.ts` | 参照元（transport ロジックの模範）。変更しない |
| 不変 | `apps/web/src/lib/env.ts` | `getAuthEnv()` が既に `API_SERVICE` 公開済み。新アクセサ不要 |
| 不変 | `/admin/dashboard/attendance`（出席分析） | read-only 分析。IA 分離維持（触らない） |
| 不変 | Google Form schema | 出席は admin-managed data（Form 項目外）。不変 |

## 1.6 targeted test run（FB-UI-02-2: 全件 test SIGKILL 回避）

メモリ制約環境向けに、対象ファイル指定で実行する（全件 `pnpm test` 禁止）。本リポジトリの vitest 正経路はルートから config 明示:

```bash
# component / route handler テスト（ルートから config 明示・apps/web/vitest.config.ts は不在）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingsClientShell.spec.tsx
```

> Phase 4 で対象 spec の正確なパスを確定する（既存 spec の有無を `ls` で確認し、新規/編集を分岐）。

## 1.7 P50 前提確認

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に 404 修正が存在する | **No**（proxy は HTTP のみ） | 通常の実装 Phase（`new`）。Phase 4 TDD Red → Phase 5 実装 |
| current branch に UI 改修が存在する | **No**（カードに出席情報なし・出席者は memberId 表示） | 同上 |
| upstream（dev/main）にマージ済み | **No** | 未マージとして扱う |
| 前提（api endpoint / service binding / env アクセサ）が揃っている | **Yes** | `meetings.ts` endpoint・`API_SERVICE` binding・`getAuthEnv()` アクセサ確認済み。依存解消タスク不要 |

→ `implementation_mode: new`。本仕様書は automation-30 改善サイクルで `implemented_local_runtime_pending` へ昇格済み。staging 実測・screenshot・commit/PR は user-gated。

## 1.8 IA（情報設計）の責務境界（設計根拠）

ユーザー設計要望への回答。3 概念の責務を因果・所有権で分離:

| 概念 | 責務 | データ所有 | 画面（配置） | write/read |
|---|---|---|---|---|
| 開催日（meeting） | 支部会の開催回（master） | `meeting_sessions`（PK `session_id`） | `/admin/meetings`（本ページ） | write |
| 出席記録（attendance） | 「ある開催回に誰が出席したか」（transaction、meeting に従属 FK `session_id`） | `member_attendance`（PK `member_id`+`session_id`） | `/admin/meetings`（**親=開催日の子として統合**） | write |
| 出席分析（analytics） | 集計・可視化（read model） | 上記から導出 | `/admin/dashboard/attendance`（**別ページ維持**） | read |

**設計結論（ベストプラクティス）**:
- attendance は meeting なしに存在し得ない（FK）。よって「開催日一覧 → 各回を展開 → 出席記録」の **Master-Detail を同一ページに統合**するのが自然で最小認知負荷。→ Task B はこの統合を強化（人数バッジ・氏名・導線）。
- 分析（read）と登録（write）は別関心。集計画面を登録画面に混ぜると責務が肥大化するため、`/admin/dashboard/attendance` の分離を維持。
- 会員管理（`/admin/members`）での出席登録は**追加しない**。会員詳細は出席履歴の参照のみで十分（登録は「1 会で複数人をまとめて」が自然な運用単位であり、会員起点の 1 人ずつ登録は非効率）。
