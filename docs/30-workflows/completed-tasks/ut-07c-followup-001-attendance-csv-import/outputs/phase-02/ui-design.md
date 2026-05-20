# Phase 2 — UI 設計

## state machine

```
idle ──(file selected)──▶ parsing ──(parse ok)──▶ preview
                                    │
                                    └(parse error)─▶ error
preview ──(confirm)──▶ confirming ──(commit ok)──▶ done
                                    │
                                    └(commit error)─▶ error
done / error ──(reset)──▶ idle
```

useReducer 6 状態:

| state | 説明 |
| --- | --- |
| `idle` | 初期状態。file input のみ active |
| `parsing` | クライアント側 papaparse 実行中 |
| `preview` | dry-run API 応答受信済。行別エラー render |
| `confirming` | commit API 実行中 |
| `done` | commit 成功。summary 表示 |
| `error` | parse / API いずれかの失敗 |

## ステップ間 state 引き渡し

| 状態遷移 | 渡す state |
| --- | --- |
| idle → parsing | `{ file }` |
| parsing → preview | `{ rows: ParsedAttendanceRow[], dryRunResult: ImportResponse }` |
| preview → confirming | `{ rows }` |
| confirming → done | `{ commitResult: ImportResponse }` |
| * → error | `{ message: string }` |

## 配置先

- `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` に `<AttendanceCsvImportPanel sessionId={id} />` を `<MeetingAttendancePanel />` の sibling として追加
- 既存 `MeetingAttendancePanel` は変更しない（CONST_006 でも分割禁止）

## CSV parse 戦略

| 項目 | 採用 |
| --- | --- |
| ライブラリ | `papaparse` ^5 |
| 場所 | クライアント側 (`apps/web/src/lib/csv/parse-attendance.ts`) |
| header | 必須 (`memberId` / `email` のいずれかカラム存在) |
| 行数上限 | クライアント側でも 500 で警告（API 側でも 413 で再防御） |
| email 正規化 | NFKC + trim + lowercase（parse 時に適用） |

## アクセシビリティ

- step 進捗を `<ol aria-label="import-steps">` + `aria-current="step"` で表現
- error は `role="alert"`
- preview の row table は `<table>` + `<caption>` 必須

## API 連携

| step | request |
| --- | --- |
| dry-run | `POST /api/admin/meetings/:sessionId/attendance/import?dryRun=true` body `{ rows }` |
| commit | `POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false` body `{ rows }` |

`apps/web` 側は `fetch` を直接使用（既存 `MeetingAttendancePanel` 踏襲）。env は `getEnv()` 経由のみ参照（本 panel では client-side fetch のみなので env 直参照は発生しない）。

## エラー UX

| API 応答 | UI 表示 |
| --- | --- |
| 413 | error state「500 行を超えています」 |
| 400 invalid_payload | error state「データ形式不正」 |
| 401 / 403 | error state「権限がありません。再ログインしてください」 |
| 404 session_not_found | error state「meeting が見つかりません」 |
| 500 | error state「サーバエラー。時間をおいて再試行してください」 |
