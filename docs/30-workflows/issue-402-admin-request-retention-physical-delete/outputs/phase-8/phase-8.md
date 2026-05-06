# Phase 8 正本: 統合テスト（miniflare D1 round-trip）

## 目的
miniflare D1 環境で、retention purge の end-to-end 動作を seed → 時刻進行 → cron tick → dry-run → apply → 復元 round-trip の順で検証する。実 cron / 実 D1 の挙動差を吸収しつつ、運用 runbook と実装の整合を担保する。

## 新規テストファイル
`apps/api/src/jobs/retention-purge.int.test.ts`

## テスト基盤
- `vitest` + `@cloudflare/vitest-pool-workers` (既存 apps/api 採用)
- D1 binding は `wrangler.toml` の test 用 binding を使う
- migration は `apps/api/migrations/*.sql` を順次 apply するヘルパ `applyMigrations(env)` を利用

## ラウンドトリップシナリオ

### Step 1: seed
- `members` 3 件 (A/B/C) を投入。
- A: 200 日前に delete request 承認 → `datetime(deleted_at, '+180 days') <= now`
- B: 100 日前に承認 → 期限未到
- C: 200 日前に承認、ただし `purged_at` が既に設定済み（再処理されないことの確認用）
- `member_responses` / `member_identities` / `member_status` / `audit_log` に各 member の関連行を投入

### Step 2: 時刻進行
- `opts.now = new Date()` で現在時刻基準。seed 側で日付差分を吸収するため、実際の `vi.setSystemTime` は使わない。

### Step 3: cron tick (dry-run)
- `runRetentionPurge(env, { mode: "dry-run" })` を実行。
- 期待:
  - `processedMembers === 1` (A のみ)
  - `affectedRows.member_responses >= 1`
  - DB の実行数は変化しない（A の行はまだ存在）

### Step 4: apply
- `runRetentionPurge(env, { mode: "apply" })` を実行。
- 期待:
  - A の `member_responses` / `member_status` が DELETE 済み
  - A の `member_identities` row が DELETE 済み
  - A の `deleted_members.purged_at IS NOT NULL`
  - B の関連行は不変
  - C は再処理されない（`purged_at` 既存値が変更されない）

### Step 5: audit_log 不変確認
- `audit_log` に `action='retention_purge'` の差分行が 1 件追加され、PII を含まないことを assertion。

### Step 6: 復元 round-trip
- 事前に取った snapshot SQL（テスト内では `db.dump()` 相当または手書き INSERT 配列）から A の行を復元。
- `deleted_members.purged_at` を NULL に戻す。
- 復元後に再 `runRetentionPurge(env, { mode: "dry-run" })` を実行し A が再対象として現れることを確認（idempotent な流れであることを担保）。

## アサーション項目チェックリスト
- [ ] dry-run で DB 行数不変
- [ ] apply で physical_delete テーブルの行数減少
- [ ] apply で `member_identities` row が DELETE される
- [ ] `audit_log` に PII を含まない purge 差分行が追加される
- [ ] `purged_at` が apply 後に設定される
- [ ] retention 期限未到 member (B) は影響を受けない
- [ ] 既 purge member (C) は再処理されない
- [ ] 復元後に再 dry-run で対象再出現

## 完了基準
- 統合テストが PASS する。
- audit_log 差分行の PII 非含有が assertion で担保されている。
- 復元 round-trip が再 dry-run で正しく対象再検出する。
