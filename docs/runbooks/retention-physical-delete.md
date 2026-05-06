# Runbook: retention 物理削除（Issue #402）

## 目的

`deleted_members.deleted_at` から 180 日経過した row を対象に、`member_responses` /
`member_identities` / `member_status` および子テーブル (`response_fields` /
`response_sections`) の PII row を物理削除する。`deleted_members` は audit minimum
tombstone として残し、`purged_at` と `retention_policy_version` を更新する。

通常は Cloudflare Workers の既存 daily cron (`0 18 * * *` UTC = 03:00 JST) から
自動実行される。本 runbook は cron 障害時 / staging 検証時 / 緊急停止時の manual
fallback を定義する。

## 着手前提

| 確認 | コマンド |
| --- | --- |
| migration 適用済み | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(deleted_members);"` で `purged_at` / `retention_policy_version` を確認 |
| due 件数を把握 | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT COUNT(*) FROM deleted_members WHERE datetime(deleted_at, '+180 days') <= datetime('now') AND purged_at IS NULL"` |
| PITR bookmark | Cloudflare D1 dashboard で実行直前の bookmark ID を控える（7 日以内なら復元可能） |

## 1. dry-run（副作用なし）

cron が動いていれば staging / production とも既定で dry-run mode が走る
（`RETENTION_PURGE_MODE=dry-run`）。手動で確認したい場合は manual trigger:

```bash
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging
```

dry-run の出力には以下が含まれる:

- `mode: "dry-run"`
- `targets[]`: 対象 member ごとの `memberId` / `deletedAt` / `deletedAtPlus180DaysAt` / `childCounts`
- `applied: []`
- `errors: []`

## 2. apply（物理削除）

apply mode は `RETENTION_PURGE_MODE=apply` の明示切替時だけ動く。production でも
default は `dry-run` なので、staging runtime evidence を確認し、ユーザー明示承認を得てから
Cloudflare Variable を切り替える。緊急停止時は `RETENTION_PURGE_MODE=off` にする。

staging で 1 件だけ apply したい場合は `RETENTION_PURGE_MODE=apply` と
`RETENTION_PURGE_LIMIT=1` を一時設定して cron trigger を実行し、確認後すぐ `dry-run` に戻す。
直接 apply CLI は本 cycle では未提供。

apply 後の確認:

```sql
-- 物理削除済み tombstone の確認
SELECT member_id, deleted_at, purged_at, retention_policy_version
  FROM deleted_members
  WHERE purged_at IS NOT NULL
  ORDER BY purged_at DESC LIMIT 10;

-- 子テーブル残留がないこと
SELECT COUNT(*) FROM member_identities WHERE member_id = '<member_id>';
SELECT COUNT(*) FROM member_status WHERE member_id = '<member_id>';
SELECT COUNT(*) FROM member_responses
  WHERE response_email = '<元 identity の email>';
```

## 3. rollback

| 状況 | 経路 |
| --- | --- |
| apply 直前で停止したい | cron を一時無効化（wrangler dashboard）。`purged_at IS NULL` 条件で idempotent なので再開しても二重削除しない |
| apply 直後〜7 日以内 | Cloudflare D1 PITR で実行直前の bookmark に restore |
| 7 日超過 | 復旧不可（不可逆境界）。承認時通知に明記済み |

## 4. audit / 通報

- `audit_log` に `action='retention_purge'` 行が作成される。`after_json` には PII を
  含めない（`member_id` / `purged_at` / `retention_policy_version` のみ）
- 障害時は `console.error("[retentionPurge] failed", ...)` が Workers logs に出る

## 5. 不変条件チェック

- `datetime(deleted_at, '+180 days') > datetime('now')` の row が purge されないこと
- `purged_at IS NOT NULL` の row が再 purge されないこと
- audit_log の差分行が PII を含まないこと
