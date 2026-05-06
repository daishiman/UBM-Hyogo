# Phase 4: 検証シナリオ設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |

## 目的

staging 環境で seed → cron tick → dry-run report → apply → restore round-trip を実行し、retention purge の正常系・dry-run 不変条件・PITR 復元経路を検証する。

## 前提

- staging D1 (`ubm-hyogo-db-staging`) が利用可能
- `bash scripts/cf.sh` 経由で wrangler 操作
- `RETENTION_POLICY_V1.defaultRetentionDays = 180` を test 用に `1` に上書き可能な env override (`RETENTION_DAYS_OVERRIDE`) を用意

## シナリオ全体像

```
[1] seed 古い deleted_members 行 + 関連 member_*
       ↓
[2] cron tick (dry-run)
       ↓ 期待: candidateCount > 0, appliedCount = 0
[3] cron tick (apply)
       ↓ 期待: candidateCount = appliedCount, purged_at IS NOT NULL
[4] 物理削除確認 (SELECT で 0 件)
       ↓
[5] D1 PITR で seed 直前に復元 → round-trip 検証
```

## ステップ詳細

### Step 1: seed

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file apps/api/src/jobs/__fixtures__/retention-seed.sql
# fixtures: deleted_members (deleted_at = now - 200d) 1 行 + 関連 member_responses/identities/status 各 1 行
```

期待 evidence: `outputs/phase-4/seed-result.json`（4 table の row count）

### Step 2: dry-run cron tick

```bash
curl 'https://staging.api.ubm-hyogo.workers.dev/__scheduled?cron=0+18+*+*+*&dryRun=1' \
  -H "Authorization: Bearer $STAGING_INTROSPECT_TOKEN" \
  | tee outputs/phase-4/dry-run-report.json
```

期待:

- `dryRun: true`
- `totals[*].candidateCount > 0`
- `totals[*].appliedCount === 0`
- D1 上の row count に変化なし

### Step 3: apply cron tick

```bash
curl 'https://staging.api.ubm-hyogo.workers.dev/__scheduled?cron=0+18+*+*+*' \
  | tee outputs/phase-4/apply-report.json
```

期待:

- `dryRun: false`
- `totals[*].appliedCount === totals[*].candidateCount`
- `member_responses` / `member_identities` / `member_status` 該当行が 0 件
- `deleted_members` 該当行は audit minimum tombstone として残り、`purged_at` / `retention_policy_version` がセット済

### Step 4: 物理削除確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) FROM member_responses WHERE member_id='<seed-id>';" \
  | tee outputs/phase-4/post-purge-counts.log
```

期待: 全関連テーブルで 0 件、`deleted_members` のみ 1 件（匿名化済）

### Step 5: PITR round-trip

```bash
# D1 Time Travel で seed 直前のタイムスタンプにロールバック（manual runbook 検証）
bash scripts/cf.sh d1 time-travel restore ubm-hyogo-db-staging \
  --env staging --timestamp <seed-before-iso> \
  | tee outputs/phase-4/pitr-restore.log
```

期待: 復元後 `member_responses` 該当行が再出現 → manual runbook の rollback 節が機能することを確認

## 失敗時 rollback コマンド

| 失敗状況 | コマンド |
| --- | --- |
| seed 投入ミス | `d1 execute --command "DELETE FROM deleted_members WHERE member_id='<seed-id>'"` |
| apply 中断 | member 単位 transaction rollback 後、`purged_at IS NULL` のまま次回 cron で再試行 |
| apply 完了後の復元要求 | D1 Time Travel restore（30 日以内）。runbook 参照 |

## 期待 evidence ファイル

- `outputs/phase-4/seed-result.json`
- `outputs/phase-4/dry-run-report.json`
- `outputs/phase-4/apply-report.json`
- `outputs/phase-4/post-purge-counts.log`
- `outputs/phase-4/pitr-restore.log`
- `outputs/phase-4/round-trip-summary.md`

## 成果物

- `outputs/phase-4/phase-4.md`
- 上記 evidence 群（Phase 11 で実機取得）
