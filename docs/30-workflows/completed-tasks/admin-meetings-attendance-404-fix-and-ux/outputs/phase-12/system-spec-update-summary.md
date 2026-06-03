**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12 / Task 12-2: システム仕様書更新サマリ

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_runtime_pending`

> 本タスクは admin API proxy の transport 統一（404 修正）+ 開催日/出席管理 UI/UX 改善を扱う。Step 1-A〜1-C を current facts として記録する。Step 2 は新規インターフェース追加の有無で判定する（proxy は内部実装変更で API contract 不変 → N/A）。

---

## Step 1 — タスク完了記録 + 状況テーブル + 関連タスク

### Step 1-A: タスク完了記録

| 更新対象 | 内容 |
| --- | --- |
| 本 workflow `index.md` | `workflow_state: implemented_local_runtime_pending`。Phase 1-12 を completed、Phase 13 を `pending_user_approval` として記録 |
| 本 workflow `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_runtime_pending`、Gate-A passed（spec review）/ Gate-B passed（implementation）/ Gate-C pending（external ops）。Phase 13 は `pending_user_approval` |
| `aiworkflow-requirements` LOGS（×2 想定） | (1) 「admin 開催日追加 404 = proxy transport 不整合（GET=service binding / POST=HTTP 非対称）」の真因特定を current fact として登録。(2) 修正方針「proxy を server-fetch と同一の service binding 優先 transport へ統一」を登録 |
| `aiworkflow-requirements` topic-map / keywords | `pnpm indexes:rebuild` 対象（新規 lessons / artifact inventory を追加した場合のみ index 再生成）。本 spec は references 追加を伴わない想定のため index drift なし（Step 1-D で判定） |

> 本サイクルは local implementation まで完了。commit・staging deploy・runtime screenshot は user-gated。

### Step 1-B: 実装状況テーブル

| 機能 | 状況 |
| --- | --- |
| Task A: proxy transport を service binding 優先へ統一（`POST /api/admin/meetings` 404 解消） | implemented local / focused test PASS |
| Task B1: 出席者氏名表示（candidates から memberId→fullName 解決） | implemented local / focused test PASS |
| Task B2: 出席人数バッジ（`N 名出席`） | implemented local / focused test PASS |
| Task B3: 展開導線（aria-label） | implemented local / focused test PASS |
| Task B4: 運用導線テキスト（各回を展開して出席を記録・編集） | implemented local / focused test PASS |
| apps/api endpoint / D1 schema / Google Form / `useAdminMutation` / `api.ts` attendance パス | 不変（変更対象外） |

> focused Vitest は 4 files / 15 tests PASS。staging 実測 / screenshot は user-gated 操作で取得する。

### Step 1-C: 関連タスクテーブル

| 関連タスク / Issue | ステータス | 関係 |
| --- | --- | --- |
| Issue | なし（`issue: null` / `issue_state: n/a`） | 起点は staging 実機エラー（ユーザー報告）。Issue 化は未実施 |
| `step-06-meetings-attendance-implementation`（completed-tasks） | completed | 開催日/出席の mutation UI（drawer / api.ts）の提供元。本タスクが改善対象 |
| `admin-attendance-analytics-redesign`（completed-tasks） | completed | `/admin/dashboard/attendance` 出席分析（read-only）。IA 分離維持（本タスクは触らない） |
| `07c-parallel-meeting-attendance-and-admin-audit-log-workflow`（completed-tasks） | completed | attendance endpoints（audit / idempotency）。api 側は完成済み。本タスクは apps/web のみ |
| INTERNAL_API_BASE_URL staging 実値修正 | スコープ外（構造的別件・インフラ設定） | service binding 統一で root を解消するため不要。binding 不在環境が残る場合のみ別途インフラ確認（DoD で staging 実測） |

---

## Step 2 — システム仕様（新規インターフェース）更新判定

| 判定軸 | 結果 |
| --- | --- |
| 新規インターフェース / 型の追加 | なし（`AdminServiceBinding = { fetch: typeof fetch }` は `server-fetch.ts` 既存型と同等の内部 alias。`attendedCounts` は component props で外部契約ではない） |
| 既存インターフェースの変更 | なし（admin API の endpoint surface / payload / response shape 不変。proxy は transport 切替のみで HTTP contract を変えない） |
| 新規定数 / 設定値の追加 | なし（`API_SERVICE` / `INTERNAL_API_BASE_URL` / `LOCAL_DEV_FALLBACK` は既存） |
| API 仕様の変更 | なし（`POST /admin/meetings` ほか既存 endpoint を変更しない。404 は transport 経路の問題であり contract の問題ではない） |

→ **Step 2 は N/A**。proxy transport 統一は内部実装変更（service binding 優先）であり、API contract（`docs/00-getting-started-manual/specs/01-api-schema.md` / `11-admin-management.md`）は不変。aiworkflow-requirements の interfaces / api-ipc 系正本仕様の更新は不要。

### docs-only → code 再判定ルールの確認

本タスクは当初から code 変更を含む implementation task（docs-only ではない）。proxy transport 統一 + UI props 追加のみで、外部に公開する新規 IF は発生しないため Step 2 は N/A のまま維持する。
