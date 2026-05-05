# Phase 11: 手動 smoke

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07a-parallel-tag-assignment-queue-resolve-workflow |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke |
| Wave | 7 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

resolve workflow を curl + wrangler tail で手動 smoke する。

## 実行タスク

1. ローカル apps/api で `pnpm dev`
2. fixture admin user で session 取得
3. 各 case の curl
4. wrangler tail で audit_log 確認
5. D1 で member_tags / queue 状態確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/tag-queue-implementation-runbook.md | 操作対象 |

## smoke シナリオ

### シナリオ 1: confirm 正常系
```bash
curl -X POST http://localhost:8787/admin/tags/queue/queue_test_001/resolve \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"action":"confirmed","tagCodes":["ai","dx"]}'
# expected: 200, member_tags に 2 行追加, queue.status='confirmed', audit_log に entry
```

### シナリオ 2: reject 正常系
```bash
curl -X POST .../queue/queue_test_002/resolve \
  -d '{"action":"rejected","reason":"既存タグで十分"}'
# expected: 200, queue.status='rejected', queue.reason='既存タグで十分', audit_log entry
```

### シナリオ 3: idempotent
```bash
# 同じ confirm を 2 回
curl ... -d '{"action":"confirmed","tagCodes":["ai","dx"]}'
curl ... -d '{"action":"confirmed","tagCodes":["ai","dx"]}'
# expected: 200, audit_log は 1 件のまま
```

### シナリオ 4: state conflict
```bash
# confirm 済み queue に reject
curl ... -d '{"action":"rejected","reason":"テスト"}'
# expected: 409
```

### シナリオ 5: unknown tag
```bash
curl ... -d '{"action":"confirmed","tagCodes":["unknown_tag"]}'
# expected: 422
```

### シナリオ 6: deleted member
```bash
# member.isDeleted=true の queue
curl ... -d '{"action":"confirmed","tagCodes":["ai"]}'
# expected: 422
```

### シナリオ 7: 認可
```bash
# session なし
curl -X POST .../queue/queue_test_003/resolve -d '{"action":"confirmed","tagCodes":["ai"]}'
# expected: 401
# 一般 user
curl -H "Cookie: session=non-admin" ... 
# expected: 403
```

### シナリオ 8: candidate 自動投入
- 03b の sync を mock で実行 → enqueueTagCandidate が呼ばれる
- D1 で `SELECT * FROM tag_assignment_queue WHERE member_id=...` で行追加確認

## evidence 一覧

| evidence | path | 種別 |
| --- | --- | --- |
| シナリオ 1 curl | outputs/phase-11/curl/confirm.txt | text |
| シナリオ 2 curl | outputs/phase-11/curl/reject.txt | text |
| シナリオ 3 curl | outputs/phase-11/curl/idempotent.txt | text |
| シナリオ 4 curl | outputs/phase-11/curl/conflict.txt | text |
| シナリオ 5-7 curl | outputs/phase-11/curl/{422,401,403}.txt | text |
| audit_log SQL | outputs/phase-11/sql/audit-after-resolve.sql | text |
| member_tags SQL | outputs/phase-11/sql/member-tags-after-confirm.sql | text |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | smoke 結果を documentation-changelog へ |
| Phase 13 | PR description |

## 多角的チェック観点

| 不変条件 | 手動確認 | 結果 |
| --- | --- | --- |
| #5 | curl の host が apps/api のみ | OK |
| #13 | member_tags が queue 経由のみ | SQL 確認 |
| 監査 | audit_log entry | SQL 確認 |
| 認可 | 401 / 403 | curl |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | confirm 正常系 | 11 | pending | curl |
| 2 | reject 正常系 | 11 | pending | curl |
| 3 | idempotent / conflict | 11 | pending | curl |
| 4 | 422 ケース | 11 | pending | curl |
| 5 | 認可 | 11 | pending | curl |
| 6 | candidate 自動投入 | 11 | pending | mock + SQL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | smoke 結果 |
| メタ | artifacts.json | Phase 11 を completed |

## 完了条件

- [ ] 8 シナリオすべて期待通り
- [ ] evidence (curl + SQL) が揃う
- [ ] 不変条件 #5, #13 手動確認

## タスク100%実行確認

- 全シナリオに evidence
- artifacts.json で phase 11 を completed

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ: evidence を changelog へ
- ブロック条件: violation あれば差し戻し
