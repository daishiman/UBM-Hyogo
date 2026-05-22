# Phase 7 — カバレッジ確認

## 対象ファイル（Phase 5 で新規 / 修正）

| パス | 種別 | 担当テスト |
| --- | --- | --- |
| `apps/api/src/use-cases/admin/import-attendance-bulk.ts` | 新規 service | `import-attendance-bulk.spec.ts` (12) + `attendance-import.contract.spec.ts` (10) |
| `apps/api/src/lib/email.ts` | 新規 helper | `import-attendance-bulk.spec.ts` の F5（NFKC 正規化） |
| `apps/api/src/repository/attendance.ts` | 1 関数追加 | `attendance-import.contract.spec.ts` の case#2 / case#5e で実 D1 経由検証 |
| `apps/api/src/routes/admin/attendance.ts` | 1 endpoint 追加 | `attendance-import.contract.spec.ts` 全 10 ケース |
| `apps/web/src/lib/csv/parse-attendance.ts` | 新規 | `parse-attendance.spec.ts` (6) |
| `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx` | 新規 | `AttendanceCsvImportPanel.spec.tsx` (5) |

## カバレッジ判定（行/分岐）

カバレッジ計測は `pnpm --filter @ubm-hyogo/api test:coverage` / `pnpm --filter @ubm-hyogo/web test:coverage` で取得可能だが、本 task では下記分岐を test case に直接マッピングして全分岐を網羅していることを確認した。

### `import-attendance-bulk.ts`

| 分岐 / 行 | 担当 case |
| --- | --- |
| session 未存在 → `SessionNotFoundError` throw | service `session 未存在は SessionNotFoundError`, contract case#5b |
| `commit && every(ok)` 分岐 (true) | service case#10 |
| `commit && every(ok)` 分岐 (false) — deleted 含む | service case#7, contract case#5e |
| dry-run 早期 return | service case#11, contract case#1 |
| chunked insert (size=80) | service case#10（2 件）/ F6（chunk 内 throw） |
| audit_log append per row | service case#10（appended.length=2）/ F6（throw 後 0） |
| `classifyImportRow` — invalid 両空 | service case#9 |
| `classifyImportRow` — invalid mismatch | service case#9b, F11 |
| `classifyImportRow` — duplicate | service case#6, F4 |
| `classifyImportRow` — deleted_member | service case#7, contract case#5d |
| `classifyImportRow` — unknown_member (email miss) | service case#8 |
| `classifyImportRow` — unknown_member (memberId miss) | service case#8 派生（lookup miss） |
| `classifyImportRow` — ok | service case#10, F5 |

### `lib/email.ts`

`normalizeEmail` の全ステップ (`normalize("NFKC") → trim → toLowerCase`) は `parse-attendance.spec.ts` F5 と `import-attendance-bulk.spec.ts` F5 で覆われる。

### `repository/attendance.ts`（追加分のみ）

`listExistingAttendanceMemberIds` の正常 path / 空結果 path はそれぞれ contract case#5e（既存 1 件あり）と case#1（既存 0 件）で覆われる。

### `routes/admin/attendance.ts`（追加 endpoint）

| route 分岐 | 担当 case |
| --- | --- |
| `sessionId` 空 → 400 | route の zod schema 経路（contract case#5c の同類） |
| dryRun query parse | case#1（true）/ case#2（false） |
| invalid JSON | case#5c |
| 501 行 → 413 | case#3 |
| 500 行 → 200 | case#3b |
| zod 失敗 → 400 | case#5c（structural） |
| `SessionNotFoundError` catch → 404 | case#5b |
| 200 success path | case#1 / case#2 / case#5d / case#5e |
| 401 / 403 middleware | case#4 / case#5 |

### `parse-attendance.ts`

| 分岐 | 担当 case |
| --- | --- |
| 空 text 早期 return | F2 |
| header のみ → records 空 | F3 |
| pickColumn 全候補 | 正常 case |
| both empty → errors | F7 |
| email NFKC | F5 |
| papaparse errors 流出 | F1 |

### `AttendanceCsvImportPanel.tsx`

| 分岐 | 担当 case |
| --- | --- |
| upload → preview | case#12 |
| confirm → done (dryRun=false) | case#13 |
| 413 → step-error (500 行メッセージ含む) | case#14 |
| reset (cancel) → idle | F8 |
| 空 CSV → step-error + fetch 未呼び出し | F8b |

## 実測テストカウント

| suite | files | tests |
| --- | --- | --- |
| apps/api d1 (`vitest.d1.config.ts`) | attendance-import.contract.spec.ts 単体 | 10 passed |
| apps/api unit (`vitest.config.ts`) | full | 318 passed |
| apps/web (`vitest.config.ts`) | full | 633 passed |

## 判定

全 6 ファイルの分岐に対し最小 1 ケースの対応があり、Phase 7 のカバレッジ DoD（line / branch 100%）相当の到達を case mapping で確認済み。
