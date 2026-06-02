# Phase 12 Task 2: システム仕様更新サマリ

`[実装区分: implementation]` / status: `implemented_local_runtime_pending`

## Step 1-A: タスク完了記録

- 本ワークフロー `issue-1027-member-dynamic-og-worker-split` を作成（`implemented_local_runtime_pending`）。
- 関連: `web-worker-size-limit-fix`（completed-tasks）/ unassigned task `member-dynamic-og-paid-or-worker-split.md` / Issue #806（CLOSED）。
- LOGS / indexes / task-workflow-active / artifact inventory / changelog を同一 wave で同期し、`OG_IMAGE_BASE_URL` と `apps/og` Worker 契約を正本へ反映した。

## Step 1-B: 実装状況テーブル

| 項目 | ステータス |
|------|-----------|
| 仕様書作成（Phase 1-13） | `implemented_local_runtime_pending` |
| コード実装 | `apps/og` / `apps/web` / `og-cd.yml` 実装済み。staging runtime は user-gated |

## Step 1-C: 関連タスクテーブル更新

| 関連 | 旧 | 新 |
|------|----|----|
| unassigned `member-dynamic-og-paid-or-worker-split`（#1027） | `status: open`（未着手・user 決定待ち） | `status: consumed`。OG 専用 Worker 分離でローカル実装済み。Issue は OPEN 維持 |

> 元 unassigned task ファイルは本サイクルで `consumed` 化し、canonical workflow へのリンクを追加済み。

## Step 2: システム仕様更新（新規インターフェース判定）

| 判定対象 | 結果 |
|----------|------|
| 新規 env var `OG_IMAGE_BASE_URL`（apps/web public env） | 追加済み。`apps/web/src/lib/env.ts` の public schema 経由で参照 |
| 新規 Worker `apps/og` の API 契約（`GET /members/:id`, `/health`） | 追加済み。新規 D1 schema / Google Form 仕様変更なし。既存 `GET /public/members/:id` を read-only 利用 |
| 既存 API surface 変更 | なし（不変条件遵守） |

> 上記はいずれも本サイクルでコード・正本仕様へ反映済み。staging deploy と実 PNG capture のみ user-gated。
