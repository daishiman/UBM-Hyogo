# Phase 10: 最終レビュー・rollback 経路 / 不可逆境界 / member 通知文言

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |
| 親 Issue | #402 (CLOSED) — delete request 承認後の物理削除 / retention policy |

## 目的

Phase 5-9 成果物（retention purge job 実装 / dry-run mode / Cron Trigger / audit_log minimum schema）を最終レビューし、Phase 11 runtime evidence 取得 / Phase 13 PR 作成可否を判定する。物理削除という不可逆操作のため、rollback 経路と境界条件を厳密に確認する。

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| AC 達成 | AC-1 (180日経過後の物理削除) / AC-2 (dry-run mode) / AC-3 (audit_log 差分行) / AC-4 (member 通知) / AC-5 (cron trigger 設定) |
| diff 最小性 | `apps/api/src/jobs/retention-purge.ts` 新規 + `db/migrations/*` 新規 + `wrangler.toml` cron 追記 + 通知テンプレ更新に限定 |
| 後方互換 | 既存 admin request flow（approve / reject）が retention purge 導入後も同一挙動 |
| invariant | 物理削除対象 row 以外（`purged_at IS NULL` の delete request）は purge job 走行後も一切変更されない |
| rollback 経路 | 3 段の復旧経路（下記）が即実行可能な手順として整備済 |
| 不可逆境界 | 物理削除実行後の row は audit_log 差分行のみ追跡可能。これを許容する member 合意フローが approve 時通知に組み込み済 |
| member 通知文言 | retention deadline / 本削除予定日が approve 時メールに明記済 |

## rollback 経路（3 段）

### 段階 1: 物理削除前（dry-run / pre-apply）

`purged_at` が NULL のため、対象 row は `deleted_members` テーブルに soft-delete 形式で残っている。

```bash
# 該当 admin request を purge 対象外へ戻す（deleted_at を現在時刻へ補正）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "UPDATE deleted_members SET deleted_at = datetime('now'), purged_at = NULL WHERE member_id = '<member_id>';"
```

### 段階 2: 物理削除後 7 日以内

Cloudflare D1 の point-in-time recovery (PITR) を使う。最大 30 日遡及可能だが、業務上は 7 日以内を推奨境界とする。

```bash
# Cloudflare Dashboard から D1 → ubm-hyogo-db-prod → Time Travel で
# purge 実行直前のタイムスタンプを指定し restore
bash scripts/cf.sh d1 time-travel restore ubm-hyogo-db-prod \
  --env production --bookmark <BOOKMARK_BEFORE_PURGE>
```

事前に `outputs/phase-11/pre-apply-bookmark.txt` に restore 用 bookmark を記録する運用とする。

### 段階 3: 物理削除後 7 日超過

**復旧不可**。本タスクの不可逆境界。これを member に対して合意済とするため、approve 時通知メールに以下文言を必ず含める:

> ご登録情報は承認日から 180 日（{deletedAtPlus180Days}）以降、順次完全に削除されます。
> 本削除予定日: {purgeScheduledDate (= deletedAtPlus180Days + 1 日 cron tick)}
> 本削除完了後 7 日を経過すると、システム上の復元手段が一切なくなります。
> 同期間内に取り消しをご希望の場合は、本メールに直接ご返信ください。

## 不可逆境界レビュー

| 確認項目 | 状態 |
| --- | --- |
| 物理削除実行後、`deleted_members` row および子テーブル（`member_responses`, `member_identities`, `member_status`）の対応 row が物理削除されている | spec 上 PASS（Phase 5 で `DELETE FROM ... WHERE member_id = ?` を子→親順で実行） |
| 物理削除後、追跡可能な情報は `deleted_members` tombstone と audit_log の差分行のみ | PASS（audit_log には `action=retention_purge`, `target_id`, `after_json`, `created_at` のみ記録、PII は含めない） |
| audit_log の差分行は `email`, `name` 等の PII を含まない | PASS（`after_json` は `member_id` / `purged_at` / `retention_policy_version` のみ） |
| 7 日超過後の復旧手段が技術的にも運用的にも提供されない | spec 上 PASS（PITR が 30 日まで物理的には可能だが、運用ポリシーで 7 日境界を強制し、手順書に明記） |

## member 通知文言レビュー

approve 時メールテンプレ (`apps/api/src/templates/admin-request-approved.ts`) に以下を必須項目として含める:

| 項目 | 値の生成元 |
| --- | --- |
| `deletedAtPlus180Days` | `now() + 180 days`（ISO 8601 / JST 表示） |
| `purgeScheduledDate` | `deletedAtPlus180Days` の翌日 03:00 JST cron tick（YYYY-MM-DD） |
| 本削除完了後 7 日 = 復旧不可境界の明示 | 固定文言 |
| 取消方法（メール返信） | 固定文言 |

文言バリエーションのレビューは `outputs/phase-9/notification-template-review.md` で完了済とする（本 Phase で再確認のみ）。

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| (Phase 3 で記録があれば転記) | - | - | - | - |

## 成果物

- `outputs/phase-10/phase-10.md`（本ファイル）
