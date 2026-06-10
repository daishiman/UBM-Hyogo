# 受け入れ基準 (Acceptance Criteria) — admin-meeting-bulk-attendance-select

各 AC は検証可能な形で定義する。trace 先 Phase を併記。

| ID | 受け入れ基準 | 検証方法 | trace |
| --- | --- | --- | --- |
| AC-1 | ドロワー内に未出席候補を複数同時選択できるチェックリスト（各候補に Checkbox）がある | `BulkAttendanceChecklist.spec.tsx`（複数 toggle で selectedCount 増加） | P4/P5/P6 |
| AC-2 | チェックリストは会員名 / memberId で絞り込める | hook spec（query 設定で selectableCandidates 絞込） | P4/P5/P6 |
| AC-3 | 「選択した N 名を一括追加」ボタンにラベルへ N 反映、0 件で disabled | checklist spec（ラベル文字列 + disabled 属性） | P4/P5 |
| AC-4 | 出席済会員はチェック不可（disabled）+「出席済」表示、選択対象は未出席のみ | hook spec（attended を selectableCandidates から除外） | P4/P5 |
| AC-5 | 一括追加は `POST .../attendance/import?dryRun=false` を 1 リクエストで送る | api client spec（fetch path / body / 単一呼び出し回数） | P4/P5/P6 |
| AC-6 | committed:true 時 summary.ok を attended 反映 + toast「N 名の出席を追加しました」+ 選択クリア | shell/checklist spec（state 反映・toast 文言） | P4/P5/P6 |
| AC-7 | committed:false 時 attended 不変 + 失敗内訳 toast + 選択保持 | spec（committed:false モック時 0 反映・文言・選択残存） | P4/P6 |
| AC-8 | 「人数が多い時はこちら」からモーダルを開ける。検索/全選択/選択解除/一括追加を持つ | `BulkAttendanceModal.spec.tsx` | P4/P5/P6 |
| AC-9 | モーダルも同一 API 契約・状態反映を共有（ロジックは hook 集約） | hook を両 UI で共有、modal spec | P5/P8 |
| AC-10 | 既存単発追加・出席者削除が回帰なし | 既存 `MeetingAttendanceDrawer.spec.tsx` GREEN 維持 + 追加 case | P6/P9 |
| AC-11 | Checkbox/CSS は OKLch トークンのみ（HEX 直書き 0） | `pnpm verify:tokens` PASS | P9 |
| AC-12 | apps/api / packages / Form 非変更 | `git diff --name-only -- apps/api packages` が空 | P9/P10 |

## DoD（タスク全体）

- 全 AC が対応 Phase に trace され、focused vitest が GREEN。
- `pnpm typecheck` / `pnpm lint` / `pnpm verify:tokens` PASS。
- `git diff --name-only -- apps/api packages` が空（AC-12）。
- Phase 12 strict 7 outputs 完備、`verify:phase12-compliance` / `gate-metadata:validate` PASS。
- commit / PR / staging 視覚証跡は user-gated（Phase 13）。
