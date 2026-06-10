# アーキテクチャ設計 — admin-meeting-bulk-attendance-select

## レイヤ構成

| レイヤ | 要素 | 変更 |
| --- | --- | --- |
| route(server) | `page.tsx` | 不変 |
| 状態 owner(client) | `MeetingsClientShell` | `onBulkAdd` 追加・summary→attended 反映 |
| presentational | `MeetingAttendanceDrawer` | checklist 埋込・modal 起動・既存単発保持 |
| feature UI | `BulkAttendanceChecklist` / `BulkAttendanceModal` | 新規 |
| feature logic | `useBulkAttendanceSelection` / `bulk-attendance-message`(純関数) | 新規 |
| primitive | `Checkbox` | 新規 |
| web client | `lib/admin/api.ts importAttendance` | 新規関数 |
| API(再利用) | `attendance.ts /import` | **不変** |

## 責務境界（混在禁止）

- write（attended 更新・toast）= Shell のみ。
- 選択状態 = hook 局所。
- 純粋整形（失敗メッセージ）= 純関数（例外を投げない / [WEEKGRD-02]）。
- API 呼び出し = web client `importAttendance` 経由のみ（D1 直アクセス禁止・不変条件 #5）。

## 因果ループ（運用性）

- 強化ループ: 会員増 → 一括追加で操作コスト一定 → 運用継続可能（旧: 会員増 → 操作コスト線形増 → 破綻）。
- バランスループ: all-or-nothing → 誤選択は全件拒否 → UI が未出席のみ選択可能にして失敗を構造的に抑制。

## エラー経路（3 経路）

| 経路 | 結果 |
| --- | --- |
| 正常（committed:true） | summary.ok 反映・toast 成功・選択 clear |
| 業務失敗（committed:false / HTTP200） | 反映ゼロ・失敗内訳 toast・選択保持 |
| 通信/サーバ失敗（throw / res.ok=false） | 反映ゼロ・失敗 toast・選択保持 |
