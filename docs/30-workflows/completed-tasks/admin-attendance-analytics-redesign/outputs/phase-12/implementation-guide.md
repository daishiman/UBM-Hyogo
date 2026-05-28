# Implementation Guide

## Part 1: 中学生レベルの説明

管理画面の「出席分析」を、プロトタイプに沿った 8 ブロック構成（KPI / フィルタ / トレンド / 分布 / セッション表 / メンバー表 / Top10 / 欠席アラート + CSV エクスポート）にリニューアルした。今サイクルでローカル実装と単体・契約テストまで完了。staging 反映と画面 screenshot は次サイクルで取得する。

## Part 2: 技術者向けの要約

- 既存 3 endpoint（`overview` / `by-session` / `ranking`）に `periodFrom` / `periodTo` / `zone` query を後方互換で追加。
- 新規 5 endpoint（`trend` / `zone-distribution` / `sessions/:id/attendees` / `absentees` / `export`）を `apps/api/src/routes/admin/dashboard.ts` に追加。
- D1 アクセスは `apps/api/src/repository/attendance-analytics.ts` に集約。`sessionPeriodClause` で `held_on >= ? AND held_on < ?` 半開区間。
- Zod schema は `packages/shared/src/zod/admin-attendance.ts` に集約し、`AttendanceOverviewExtZ` で `previousPeriodRate` と `filter` を追加。
- `apps/web` は `safeServerFetch<T>()` を経由し、`Promise.all` で 6 endpoint を並列 fetch、partial failure は section error に閉じる。
- CSV は Workers `Response` ストリーミング、BOM + CRLF + RFC4180 escape。

## Part 3: 実装ステップ（完了済み）

1. Shared zod schemas を追加（`packages/shared/src/zod/admin-attendance.ts`）。
2. API repository（`attendance-analytics.ts`）と route 5 endpoint 追加 + 3 endpoint 拡張。
3. CSV/filter parser ライブラリ（`apps/api/src/lib/{csv-export,parse-attendance-filter}.ts`）。
4. Web feature components（`apps/web/src/features/admin/attendance/` 11 ファイル）と page delegation。
5. Unit/contract test 15 ケースを green に。

## Part 4: 検証コマンド（実行済み）

```bash
pnpm --filter @ubm-hyogo/api test       # 419 green
pnpm --filter @ubm-hyogo/web test       # 1156 green
pnpm --filter @ubm-hyogo/shared test    # 231 green
pnpm typecheck && pnpm lint && pnpm build  # all green
```

## Part 5: 既知制限 / 次サイクル

| 項目 | 状態 |
|------|------|
| staging 404 RCA | 未実施（staging skip ユーザー判断） |
| Playwright visual baseline | 未生成（browser/staging 未起動） |
| 実機 screenshot（`outputs/phase-11/screenshots/`） | 未取得 |
| CSV 大量行（>1万）非同期 export | scope 外。将来 followup 候補。 |
| commit / push / PR | user-gated（本サイクル禁止指示） |

`git status --short` / `git diff --stat` で実コード変更（21 新規 + 7 編集）を確認済み。CONST_005 充足。
