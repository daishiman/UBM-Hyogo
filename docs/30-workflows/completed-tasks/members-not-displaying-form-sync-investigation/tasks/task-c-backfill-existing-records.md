# Task C: Backfill existing records (publish_state)

`[実装区分: 実装仕様書]`

## 目的

staging に既に堆積している `publish_state='member_only'` 会員のうち、`public_consent='consented'` かつ admin override 無しの records を `publish_state='public'` に backfill する。

## 変更対象ファイル

| Path | 種別 |
| --- | --- |
| `apps/api/src/routes/admin/sync-backfill-publish-state.ts` | 新規 |
| `apps/api/src/routes/admin/sync-backfill-publish-state.spec.ts` | 新規 |
| `apps/api/src/index.ts` | 編集 |
| `scripts/backfill-publish-state.sh` | 新規 (+x) |

## エンドポイント

```
POST /admin/sync/backfill-publish-state?dryRun=true|false
Authorization: Bearer <SYNC_ADMIN_TOKEN>
```

既存 sync 系と同じ `requireSyncAdmin` を使う。

## 動作

1. `member_status` を scan。
2. `publish_state='hidden'` または non-system `updated_by` を admin override とする。
3. `decidePublishState({ flagEnabled: true, ...row })` を適用。
4. `dryRun=false` の時だけ 200 行ずつ UPDATE。
5. UPDATE 時は `updated_by='system:backfill'`, `updated_at=datetime('now')` を残す。

`member_status_history` は現行 schema にないため作らない。履歴 table が必要になった場合は別 migration を伴う独立設計にする。

## script

`scripts/backfill-publish-state.sh --env <staging|production> [--dry-run | --apply]`

- default は `--dry-run`。
- `--apply` は `yes` 確認を要求。
- token 値は標準出力・ログに出さない。

## テスト

| ケース | 期待 |
| --- | --- |
| dryRun=true | candidates は数えるが applied=0 |
| dryRun=false | UPDATE 件数と `updated_by='system:backfill'` |
| 再実行 | candidates=0 / applied=0 |
| admin override | `updated_by='admin:user1'` は skipped.adminExplicit |
| hidden | skipped.adminExplicit |
| no auth | 401 |

## DoD

- [ ] 6 ケース green
- [ ] default dry-run
- [ ] route mount 済み
- [ ] staging dry-run -> apply -> dry-run candidates=0（user-gated）
- [ ] backfill 後 `visiblePublicCount > 0`（user-gated）
