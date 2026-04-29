# Phase 10 — 最終レビュー

## 実装エビデンス

- **新規 route**: `apps/api/src/routes/admin/{dashboard,members,member-status,member-notes,member-delete,tags-queue,schema,meetings,attendance}.ts` (9 ファイル)
- **共通 helper**: `apps/api/src/routes/admin/_shared.ts`
- **新規 repository**: `apps/api/src/repository/dashboard.ts`
- **新規 test**: 上記各 route に対応する `*.test.ts` (9 ファイル)
- **index.ts 結線**: 9 router を `app.route("/admin", ...)` で mount

## 検証結果

| 検証 | 結果 |
|---|---|
| `pnpm --filter @ubm-hyogo/api typecheck` | ✅ エラー 0 |
| `pnpm --filter @ubm-hyogo/api test -- --run` | ✅ **251 passed / 0 failed** (48 files) |
| 不変条件 #4 | ✅ profile 更新 endpoint 不在 |
| 不変条件 #11 | ✅ 全 status 変更は `setPublishState` / `setDeleted` のみ |
| 不変条件 #12 | ✅ admin_member_notes は detail / notes route のみ |
| 不変条件 #13 | ✅ tag 確定は queue→reviewing→resolved 経由のみ |
| 不変条件 #14 | ✅ `updateStableKey` 呼出は schema route のみ |
| 不変条件 #15 | ✅ attendance は 404 / 422 / 409 を厳密マップ |

## AC 達成判定

| AC | status |
|---|---|
| AC-1 admin gate 200/403/401 | ✅ |
| AC-2 profile 編集 endpoint 不在 | ✅ |
| AC-3 admin_member_notes 公開非露出 | ✅ |
| AC-4 認可違反 6 ケース | ✅ |
| AC-5 publishState / isDeleted 分離 | ✅ |
| AC-6 tag は queue 経由のみ | ✅ |
| AC-7 schema /admin/schema 集約 | ✅ |
| AC-8 attendance 重複 / 削除済み | ✅ |
| AC-9 audit_log 全 mutation 記録 | ✅ |
| AC-10 sync 202 + jobId / 重複 409 | ✅（既存 03a/03b 流用） |
| AC-11 zod parse | ✅ |

## 残課題（既知 / 後続 wave で対応）

| # | 内容 | 後続担当 |
|---|---|---|
| K-1 | `members detail` の `profile.attendance` は MVP として空配列 | 06c / 後続詳細ビルダー |
| K-2 | adminGate スタブのため audit actor が null | 05a で Auth.js 注入 |
| K-3 | attendance audit `targetType` は `meeting` を流用（attendance 専用型を追加するかは要判断） | audit_log schema 拡張時 |
| K-4 | alias 確定時に対応する diff queue が無い場合は黙ってスキップ | UI 表示で先に確認させる方針 |

## Go / No-Go

→ **GO**: Phase 11（manual smoke）→ Phase 12（doc）に進む。
