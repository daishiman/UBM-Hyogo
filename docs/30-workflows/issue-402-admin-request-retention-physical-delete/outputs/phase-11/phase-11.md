# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created（runtime_evidence_pending） |
| visualEvidence | NON_VISUAL |

## 目的

NON_VISUAL タスクとして、retention purge job が staging 環境で:
1. dry-run mode で正しく対象 row を抽出すること
2. 1 メンバー分 apply で `deleted_members.purged_at` 更新と子テーブル row 0 件化が起きること
3. audit_log に差分行が 1 行記録されること

を runtime evidence として取得する。スクリーンショット不要。

## 環境制約

- 時計操作不可（Cloudflare Workers は実時刻を使う）→ test fixture で `deleted_at` を 180 日超過の過去日に設定
- staging D1 (`ubm-hyogo-db-staging`) を対象にする（production には実行しない）

## NON_VISUAL evidence 必須ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/seed-fixture.sql` | seed 用 SQL（`deleted_at` を 180 日超過の過去日に設定した deleted_members 行 + 子テーブル行） |
| 2 | `outputs/phase-11/pre-apply-bookmark.txt` | apply 直前の D1 PITR bookmark（rollback 段階 2 用） |
| 3 | `outputs/phase-11/dry-run-report.json` | dry-run mode 実行時のターゲット row サマリ JSON |
| 4 | `outputs/phase-11/apply-result.json` | 1 メンバー分 apply 後の `deleted_members` row + 子テーブル件数 |
| 5 | `outputs/phase-11/audit-log-diff.json` | audit_log 差分行 1 件の内容 |
| 6 | `outputs/phase-11/invariant-check.log` | 非対象 row（`datetime(deleted_at, '+180 days') > datetime('now')`）が一切変更されないことの確認 |
| 7 | `outputs/phase-11/cron-trigger-log.txt` | `wrangler triggers cron` の実行ログ（trigger 完了 / job 完走を含む） |

## 取得手順

```bash
# 0) seed: deleted_at を 180 日超過の過去日にした fixture を投入
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file outputs/phase-11/seed-fixture.sql

# 1) apply 直前の PITR bookmark 記録（rollback 段階 2 用）
bash scripts/cf.sh d1 time-travel info ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-11/pre-apply-bookmark.txt

# 2) dry-run mode で job 実行し、Workers log から redacted report を保存
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh wrangler tail --config apps/api/wrangler.toml --env staging \
  --format=json > outputs/phase-11/dry-run-report.json &
TAIL_PID=$!
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging
kill "$TAIL_PID"

# 3) 1 メンバー分 apply（user-gated: RETENTION_PURGE_MODE=apply / RETENTION_PURGE_LIMIT=1 を一時設定）
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT member_id, deleted_at, purged_at, retention_policy_version FROM deleted_members WHERE purged_at IS NOT NULL ORDER BY purged_at DESC LIMIT 1;" \
  --json > outputs/phase-11/apply-result.json

# 4) cron trigger 経由でも同等動作することを確認（apply 済み後の dry-run は 0 件）
bash scripts/cf.sh wrangler triggers cron --config apps/api/wrangler.toml --env staging \
  > outputs/phase-11/cron-trigger-log.txt

# 5) audit_log 差分行の取得
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT * FROM audit_log WHERE action = 'retention_purge' ORDER BY created_at DESC LIMIT 1;" \
  --json > outputs/phase-11/audit-log-diff.json

# 6) invariant: 非対象 row（180 日未経過）が変更されていないこと
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT member_id, purged_at FROM deleted_members WHERE datetime(deleted_at, '+180 days') > datetime('now');" \
  --json | tee outputs/phase-11/invariant-check.log
```

## 期待結果

| ファイル | 期待 |
| --- | --- |
| `dry-run-report.json` | `[retentionPurge] completed` log に `mode="dry-run"`、`targets[].memberId` が seed 投入分のみ含まれる / `applied=[]` / `purged_at` は NULL のまま |
| `apply-result.json` | 対象 1 件の `purged_at` が NOT NULL / 子テーブル `member_responses` / `member_identities` / `member_status` の対応 row 件数 0 |
| `audit-log-diff.json` | `action=retention_purge`, `target_id=<member_id>`, `after_json` に PII 含まず |
| `invariant-check.log` | 非対象 row の `purged_at` が全て NULL のまま |
| `cron-trigger-log.txt` | trigger 成功 / 既に apply 済みのため対象 0 件 |

## DoD

- [ ] 上記 7 ファイルが実体配置（runtime 取得時に充足）
- [ ] dry-run report と apply result の対象 ID が一致
- [ ] audit_log 差分行が 1 件で PII を含まない
- [ ] 非対象 row drift 0 件
- [ ] cron trigger による自動実行経路が確認済

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- 上記 7 evidence ファイル（runtime 取得時）
