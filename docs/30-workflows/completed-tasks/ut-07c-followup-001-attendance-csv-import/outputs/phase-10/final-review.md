# Phase 10 — 最終レビュー / AC 突合

## AC（Acceptance Criteria）対応

| # | AC | 実装 | 担当 test |
| --- | --- | --- | --- |
| 1 | 新 endpoint `POST /admin/meetings/:sessionId/attendance/import` を追加 | `apps/api/src/routes/admin/attendance.ts` | contract case#1〜#5e（10 件） |
| 2 | `dryRun=true|false` の切替が機能する | route handler + service `commit` 引数 | contract case#1（dry-run）/ case#2（commit） |
| 3 | 行別 status (`ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`) を返す | `classifyImportRow` | service case#6〜#9b, F11 |
| 4 | dry-run は副作用 0（D1 write 0 / audit_log 0） | service の commit=false 早期 return | service case#11, contract case#1 |
| 5 | commit は全行 ok 時のみ insert | service `every(r => r.status === "ok")` | service case#7（deleted 混入で committed=false）, contract case#5e |
| 6 | 成功行ごとに `audit_log` を 1 record 追加 | service の audit_log append per ok row | service case#10（ok=2 → appended=2） |
| 7 | D1 insert は chunk size 80 で分割 | `ATTENDANCE_BIND_CHUNK_SIZE` | service case#10 / F6 |
| 8 | 上限 500 行 / 501 行は 413 | route handler 先行分岐 | contract case#3 / case#3b |
| 9 | 未認証 401 / non-admin 403 | 既存 middleware | contract case#4 / case#5 |
| 10 | session 未存在で 404 | `SessionNotFoundError` → route catch | contract case#5b |
| 11 | 不正 JSON は 400 | route handler | contract case#5c |
| 12 | admin UI 3 ステップ wizard を `MeetingAttendancePanel` sibling として配置 | `AttendanceCsvImportPanel.tsx` + `page.tsx` | UI case#12 / case#13 |
| 13 | 413 受信時にユーザ向けエラー panel | UI `mapHttpErrorToMessage(413)` | UI case#14 |
| 14 | CSV parse はクライアント側 (papaparse) | `apps/web/src/lib/csv/parse-attendance.ts` | parse 全 6 ケース |
| 15 | email 正規化 (NFKC + trim + lowercase) | `apps/api/src/lib/email.ts` + `parse-attendance.ts` | F5（service / parse 両方） |
| 16 | memberId と email 不一致 → invalid + `memberId_email_mismatch` | `classifyImportRow` | service case#9b, F11 |
| 17 | 既存 single add/remove 挙動を変えない | 既存 route 未変更 | apps/api 既存 318 件 GREEN |

## CONST_005 ファイル一覧と実物の突合

| 仕様（implementation-plan.md） | 実物 |
| --- | --- |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` (新規) | ✅ 存在 |
| `apps/api/src/lib/email.ts` (新規) | ✅ 存在 |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` (新規) | ✅ 存在 |
| `apps/web/src/lib/csv/parse-attendance.ts` (新規) | ✅ 存在 |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` (新規) | ✅ 存在 |
| `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` (新規) | ✅ 存在 |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/AttendanceCsvImportPanel.spec.tsx` (新規) | ✅ 存在 |
| `apps/web/src/lib/csv/__tests__/parse-attendance.spec.ts` (新規) | ✅ 存在 |
| `apps/api/src/routes/admin/attendance.ts` (1 endpoint 追加) | ✅ 反映 |
| `apps/api/src/repository/attendance.ts` (1 関数追加) | ✅ 反映 |
| `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` (1 行追加) | ✅ 反映 |
| `apps/web/package.json` (papaparse / @types/papaparse 依存追加) | ✅ 反映 |

## 残課題

- Gate-C: Phase 11 VISUAL screenshot 取得（手動 admin login が必要）。
- Gate-D: ユーザ明示承認のみで commit / push / PR。

## 判定

Gate-B（implementation_review）通過に必要な条件（typecheck / lint / test 全 PASS、AC 17 件すべて対応 test 紐付け、CONST_005 ファイル一致）を満たす。
