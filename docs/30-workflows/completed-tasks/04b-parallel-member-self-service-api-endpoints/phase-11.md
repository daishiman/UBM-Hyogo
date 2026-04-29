# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

ローカル / staging で `/me/*` 4 endpoint を curl と wrangler tail で動作確認し、screenshot / 出力ログを evidence として保存する。本タスクは実装済みであり、ローカル evidence は curl 手順と自動テスト結果で保持する。

## Manual smoke 手順

### 前提

- ローカルで `pnpm --filter api dev` が起動
- D1 に `member_identities` / `member_status` / `member_responses` の seed が入っている
- Auth.js mock helper でテスト用 session cookie を取得済み

### Smoke step

#### 1. GET /me（200）

```bash
curl -s http://localhost:8787/me \
  -H "Cookie: $TEST_SESSION_COOKIE" | jq
```

期待: `{ user: { email, memberId, responseId, isAdmin }, authGateState: 'active' }`

#### 2. GET /me（401）

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/me
```

期待: `401`、レスポンス本文に memberId が一切含まれない

#### 3. GET /me/profile（200 + editResponseUrl）

```bash
curl -s http://localhost:8787/me/profile \
  -H "Cookie: $TEST_SESSION_COOKIE" | jq '.editResponseUrl, .fallbackResponderUrl'
```

期待: `editResponseUrl` が URL 文字列 or null、null 時は `fallbackResponderUrl` に responderUrl

#### 4. POST /me/visibility-request（202）

```bash
curl -s -X POST http://localhost:8787/me/visibility-request \
  -H "Cookie: $TEST_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"desiredState":"hidden","reason":"smoke test"}' | jq
```

期待: `{ queueId, type: 'visibility_request', status: 'pending', createdAt }`

#### 5. POST /me/visibility-request 二回目（409）

同じコマンドをもう一度叩く → `{ code: 'DUPLICATE_PENDING_REQUEST' }`

#### 6. POST /me/delete-request（202）

```bash
curl -s -X POST http://localhost:8787/me/delete-request \
  -H "Cookie: $TEST_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"reason":"smoke test"}' | jq
```

#### 7. wrangler tail で audit_log 反映確認

```bash
wrangler tail --format pretty
```

期待: `audit_log.record action=member.self.visibility_request target=<memberId>` が出力

#### 8. D1 へ直接照会

```bash
wrangler d1 execute ubm-hyogo --command \
  "SELECT type, source_member_id, status FROM admin_member_notes WHERE source_member_id = '<memberId>' ORDER BY created_at DESC LIMIT 5"
```

期待: type が `visibility_request` / `delete_request` で並ぶ、本文（response_fields）には影響なし

## Manual evidence

| evidence | 保存先 | 取得方法 |
| --- | --- | --- |
| GET /me 200 レスポンス | outputs/phase-11/get-me-200.json | curl 出力 |
| GET /me 401 レスポンス | outputs/phase-11/get-me-401.txt | curl -o |
| GET /me/profile レスポンス | outputs/phase-11/get-me-profile.json | curl 出力 |
| POST visibility 202 | outputs/phase-11/post-visibility-202.json | curl 出力 |
| POST visibility 409 | outputs/phase-11/post-visibility-409.json | curl 出力 |
| wrangler tail ログ | outputs/phase-11/wrangler-tail.txt | tail 中の record 行 |
| D1 admin_member_notes 抜粋 | outputs/phase-11/admin-notes-after-smoke.txt | wrangler d1 execute |

## 確認観点

- [ ] 401 レスポンスに memberId / email が含まれない (#11)
- [ ] GET /me/profile レスポンスに `notes` キーが含まれない (#12)
- [ ] response_fields に書き込みが走らない (#4)
- [ ] audit_log に visibility/delete request の record が残る (#12)
- [ ] rate limit で 6 連投 → 429 (#11)

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/06-member-auth.md | 期待挙動 |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | request API |
| 参考 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler 操作 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | manual evidence を documentation-changelog に記録 |
| 09a | staging で再実行 |
| 08b | Playwright が同等のフローを E2E 化 |

## 多角的チェック観点（不変条件マッピング）

- #4: D1 への response_fields 書き込みゼロを smoke で確認
- #11: 401 / 429 で他人 memberId 露出ゼロ
- #12: notes leak ゼロ
- #9: authGateState 5 状態のうち active と rules_declined と deleted を smoke で観察

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | smoke step 8 件 runbook 化 | 11 | pending | outputs/phase-11/main.md |
| 2 | evidence 保存先固定 | 11 | pending | outputs/phase-11/manual-evidence.md |
| 3 | 確認観点チェック | 11 | pending | 5 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 主成果物 |
| ドキュメント | outputs/phase-11/manual-evidence.md | evidence 一覧と取得方法 |
| メタ | artifacts.json | Phase 11 を completed に更新 |

## 完了条件

- [ ] 8 step の smoke 手順が curl レベルで記述
- [ ] evidence 7 種の保存先が定義
- [ ] 確認観点 5 項目が記述

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 11 を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: evidence を Phase 12 の changelog に組み込む
- ブロック条件: 確認観点 5 項目のいずれかが NG なら次 Phase に進まない
