# Phase 12 — main 成果物 (UT-07C-FU-001)

## タスク概要

UT-07C-FU-001 meeting attendance CSV 一括 import。admin が CSV upload で大量の meeting attendance を、`upload → dry-run preview → confirm` の 3 ステップ wizard で安全に一括登録できるようにする。

GitHub Issue: #312。親タスク UT-07C（meeting attendance 単一 add/remove + audit_log）の follow-up。

## 実装ハイライト

| 領域 | 追加 / 変更 |
| --- | --- |
| API endpoint | `POST /admin/meetings/:sessionId/attendance/import?dryRun=true|false` |
| Service | `apps/api/src/use-cases/admin/import-attendance-bulk.ts`（`classifyImportRow` / `SessionNotFoundError` 含む） |
| Helper | `apps/api/src/lib/email.ts`（`normalizeEmail`: NFKC + trim + lowercase） |
| Repository | `apps/api/src/repository/attendance.ts` に `listExistingAttendanceMemberIds` 追加 |
| UI | `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` 3-step wizard |
| Web lib | `apps/web/src/lib/csv/parse-attendance.ts` (papaparse wrapper) |
| 依存 | `apps/web/package.json` に `papaparse@^5.4.1` / `@types/papaparse@^5.3.14` 追加 |

## 行別判定

| 入力 | 判定 |
| --- | --- |
| memberId / email どちらも空 | `invalid` (`memberId_or_email_required`) |
| memberId lookup miss | `unknown_member` (`memberId_not_found`) |
| email lookup miss | `unknown_member` (`email_not_found`) |
| memberId と email が別 member | `invalid` (`memberId_email_mismatch`) |
| `member_status.is_deleted=1` | `deleted_member` |
| 既存 attendance あり | `duplicate` |
| 上記以外 | `ok` |

## 副作用 / エラーモデル

- dry-run: D1 write 0 / audit_log 0
- commit: 全行 ok のみ D1 `batch` で attendance insert + `attendance.import.add` audit insert を同一境界に投入（部分コミット禁止）、chunk size 80
- `dryRun` 省略 / typo: 安全側の dry-run として扱い、`dryRun=false` の明示時だけ commit
- session 未存在 → 404 `session_not_found`
- 501 行 → 413 `payload_too_large`
- invalid JSON → 400 `invalid_json` / payload 構造不正 → 400 `invalid_payload`
- memberId / email 空 row は 400 ではなく row status `invalid` として preview に残す

## テスト

| spec | 件数 |
| --- | --- |
| `attendance-import.contract.spec.ts` | 13 |
| `import-attendance-bulk.spec.ts` | 13 |
| `AttendanceCsvImportPanel.spec.tsx` | 7 |
| `parse-attendance.spec.ts` | 6 (F1〜F7) |
| `attendance-csv-import.spec.ts` | 1 Playwright screenshot flow |

## QA 結果

| 項目 | 結果 |
| --- | --- |
| focused API route | 13 passed |
| focused API service | 13 passed |
| focused web parser/UI | 13 passed |
| Phase 11 Playwright screenshot | 1 passed / 4 screenshots captured |

## 残課題

- Gate-D (PR): ユーザ明示承認下での commit / push / PR。
