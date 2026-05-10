# Phase 5: 実装補強仕様

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. 実装方針

本 Phase は新規 23 ファイル作成ではない。現行実装を正本に、gap closure が必要な場合だけ既存ファイルへ最小変更する。

## 2. 補強対象

| 対象 | 補強条件 |
| --- | --- |
| `TagQueuePanel.tsx` | reason 空 reject を API 呼出前に止める。terminal status は mutation disabled。 |
| `MeetingPanel.tsx` | deleted member candidate 除外、既出席 disabled、409/422 toast を保持。 |
| `RequestQueuePanel.tsx` | reject は reason 必須、approve は delete/visibility 警告を出す。409 は refresh。 |
| `api.ts` | `resolveTagQueue`, `resolveAdminRequest`, meeting mutation helpers のみ。新 namespace は不要。 |
| `server-fetch.ts` | request SSR fixture boundary を維持。production では fixture 無効。 |

## 3. 禁止

- `apps/web/src/app` への新規作成。
- `apps/web/src/features/admin` への新規作成。
- `apps/web/src/lib/api/admin-tags.ts` 等の新規 adapter 作成。
- 旧 request decision endpoint 形式の呼出。
- MVP 範囲外の meeting CSV export link 表示。
