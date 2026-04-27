# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

ローカル / staging で `/admin/*` 18 endpoint のうち代表 8 endpoint を curl と wrangler tail で動作確認し、screenshot / 出力ログを evidence として保存する。本タスクは spec_created なので実コマンドはランブック化のみ、実行は実装タスクに引き継ぐ。

## Manual smoke 手順

### 前提

- ローカルで `pnpm --filter api dev` が起動
- D1 に `admin_users` / `member_identities` / `member_status` / `meetings` / `attendance` / `tag_assignment_queue` / `schema_diff_queue` / `sync_jobs` / `audit_log` の seed が入っている
- Auth.js mock helper で admin / 一般会員 / 公開 user の 3 種 session cookie を取得済み
- `$ADMIN_SESSION_COOKIE`、`$MEMBER_SESSION_COOKIE`、未認証の 3 種を export

### Smoke step

#### 1. GET /admin/dashboard（admin 200）

```bash
curl -s http://localhost:8787/admin/dashboard \
  -H "Cookie: $ADMIN_SESSION_COOKIE" | jq
```

期待: `{ totalMembers, publishedMembers, pendingTagQueue, pendingSchemaDiff, lastSyncAt }`

#### 2. GET /admin/dashboard（一般会員 403）

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/admin/dashboard \
  -H "Cookie: $MEMBER_SESSION_COOKIE"
```

期待: `403`、レスポンス本文に `NOT_ADMIN`、memberId 露出ゼロ

#### 3. GET /admin/dashboard（未認証 401）

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/admin/dashboard
```

期待: `401`、レスポンス本文に session info ゼロ

#### 4. GET /admin/members（200 + pagination）

```bash
curl -s "http://localhost:8787/admin/members?q=hyogo&page=1&pageSize=20" \
  -H "Cookie: $ADMIN_SESSION_COOKIE" | jq '.items[0], .meta'
```

期待: 配列の各要素に `notes` キーが含まれない（#12）、`meta.total` が数値

#### 5. GET /admin/members/:memberId（200 + notes 含む）

```bash
curl -s http://localhost:8787/admin/members/<memberId> \
  -H "Cookie: $ADMIN_SESSION_COOKIE" | jq '.notes, .response.fields'
```

期待: `notes` array が返る（admin only context）、`response.fields` が現スナップショット

#### 6. PATCH /admin/members/:memberId/status（200）

```bash
curl -s -X PATCH http://localhost:8787/admin/members/<memberId>/status \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"publishState":"hidden","reason":"smoke test"}' | jq
```

期待: `member_status.publish_state` 更新、`audit_log` に `admin.member.status.update` 記録

#### 7. PATCH /admin/members/:memberId/status with isDeleted（422）

```bash
curl -s -X PATCH http://localhost:8787/admin/members/<memberId>/status \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"isDeleted":true}'
```

期待: `422` + `code: "VALIDATION_ERROR"`、isDeleted は別 endpoint 経由のみ

#### 8. POST /admin/meetings/:sessionId/attendance（201）

```bash
curl -s -X POST "http://localhost:8787/admin/meetings/<sessionId>/attendance" \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"<memberId>"}' | jq
```

期待: `201` + `attendanceId`、UNIQUE 制約で同 (sessionId, memberId) 二回目は 409

#### 9. POST attendance 二回目（409）

同じコマンドをもう一度叩く → `{ code: 'DUPLICATE_ATTENDANCE' }`

#### 10. POST /admin/sync/schema（202）

```bash
curl -s -X POST http://localhost:8787/admin/sync/schema \
  -H "Cookie: $ADMIN_SESSION_COOKIE" | jq
```

期待: `202` + `{ jobId, status: 'queued' }`

#### 11. POST /admin/sync/schema 二回目（409）

連投 → `{ code: 'SYNC_ALREADY_RUNNING' }`

#### 12. wrangler tail で audit_log 反映確認

```bash
wrangler tail --format pretty
```

期待: `audit_log.record action=admin.member.status.update actor=<adminUserId> target=<memberId>` 等が出力

#### 13. D1 へ直接照会

```bash
wrangler d1 execute ubm-hyogo --command \
  "SELECT actor_id, action, target_member_id, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10"
```

期待: smoke で打った全 mutation の記録、actor 範囲が `admin.*` で統一

#### 14. PATCH /admin/members/:memberId/profile（404 - route 不在）

```bash
curl -s -o /dev/null -w "%{http_code}" -X PATCH \
  http://localhost:8787/admin/members/<memberId>/profile \
  -H "Cookie: $ADMIN_SESSION_COOKIE" \
  -d '{}'
```

期待: `404`（mount されていない）、不変条件 #11 の構造的保証

## Manual evidence

| evidence | 保存先 | 取得方法 |
| --- | --- | --- |
| GET /admin/dashboard 200 | outputs/phase-11/get-dashboard-200.json | curl 出力 |
| GET /admin/dashboard 403 | outputs/phase-11/get-dashboard-403.txt | curl -o |
| GET /admin/dashboard 401 | outputs/phase-11/get-dashboard-401.txt | curl -o |
| GET /admin/members レスポンス（notes 不在確認） | outputs/phase-11/get-admin-members.json | curl + jq |
| GET /admin/members/:memberId（notes 含む） | outputs/phase-11/get-admin-member-detail.json | curl + jq |
| PATCH status 200 + audit | outputs/phase-11/patch-status-200.json | curl 出力 |
| PATCH status isDeleted 422 | outputs/phase-11/patch-status-422.json | curl 出力 |
| POST attendance 201 / 409 | outputs/phase-11/post-attendance-201-409.json | curl 出力 |
| POST sync/schema 202 / 409 | outputs/phase-11/post-sync-schema-202-409.json | curl 出力 |
| wrangler tail ログ | outputs/phase-11/wrangler-tail.txt | tail 中の record 行 |
| D1 audit_log 抜粋 | outputs/phase-11/audit-log-after-smoke.txt | wrangler d1 execute |
| PATCH profile 404 | outputs/phase-11/patch-profile-404.txt | curl -o |

## 確認観点

- [ ] 401 / 403 レスポンスに memberId / email が含まれない (#11)
- [ ] GET /admin/members レスポンスに `notes` キーが含まれない (#12)
- [ ] response_fields に書き込みが走らない (#4 / #11)
- [ ] audit_log にすべての mutation の record が残る
- [ ] PATCH /admin/members/:memberId/profile が 404 (#11 構造保証)
- [ ] PATCH /admin/members/:memberId/tags が 404 (#13 構造保証)
- [ ] PATCH /admin/sync/aliases 系 PATCH が 404 (#14 構造保証)
- [ ] POST attendance UNIQUE 制約が 409 (#15)

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 期待挙動 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag queue 挙動 |
| 参考 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual evidence を documentation-changelog に記録 |
| 09a | staging で再実行 |
| 08a | contract / authz test が同等のフローを E2E 化 |

## 多角的チェック観点（不変条件マッピング）

- #4 / #11: D1 への response_fields 書き込みゼロを smoke で確認
- #11: 401 / 403 で他人 memberId 露出ゼロ
- #12: notes leak ゼロ（list レスポンスに notes 不在）
- #13: PATCH /tags が 404
- #14: PATCH /sync/aliases が 404
- #15: POST attendance UNIQUE 制約 (DUPLICATE_ATTENDANCE)

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | smoke step 14 件 runbook 化 | 11 | pending | outputs/phase-11/main.md |
| 2 | evidence 保存先固定 | 11 | pending | outputs/phase-11/manual-evidence.md |
| 3 | 確認観点チェック | 11 | pending | 8 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 主成果物 |
| ドキュメント | outputs/phase-11/manual-evidence.md | evidence 一覧と取得方法 |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] 14 step の smoke 手順が curl レベルで記述
- [ ] evidence 12 種の保存先が定義
- [ ] 確認観点 8 項目が記述

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: evidence を Phase 12 の changelog に組み込む
- ブロック条件: 確認観点 8 項目のいずれかが NG なら次 Phase に進まない
