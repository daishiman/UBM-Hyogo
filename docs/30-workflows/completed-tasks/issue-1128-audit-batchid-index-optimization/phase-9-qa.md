# Phase 9: QA 一括判定（Gate-B 相当）

line budget / link / typecheck / lint / D1 targeted vitest / migration sequence guard を
一括で判定するゲート。全項目 PASS で Phase 10（最終レビュー）へ進む。

## 実行コマンド

> filter 名は `apps/api/package.json` の `"name"` フィールドで確認すること（本リポジトリでは `@ubm-hyogo/api`）。
> 全件テストは回さない。D1 group は `vitest.d1.config.ts`（`pool: forks` / `singleFork`）で targeted run する。

```bash
# 1. typecheck（apps/api のみ）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# 2. lint（リポジトリ全体の boundaries / deps / stable-key / no-inline-style 等を含む集約 lint）
mise exec -- pnpm lint

# 3. D1 targeted vitest（変更に関係する spec のみ・singleFork）
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --config vitest.d1.config.ts \
  src/repository/__tests__/auditLog.repository.spec.ts \
  src/routes/admin/audit.contract.spec.ts \
  migrations/__tests__/0026_audit_log_batchid_index.spec.ts   # 新規作成した場合のみ

# 4. migration sequence guard（連番重複・欠番検証）
mise exec -- pnpm verify:d1-migrations

# 5. sequence guard の自己テスト
mise exec -- node --test scripts/__tests__/verify-d1-migration-sequence.test.mjs
```

> 上記 vitest の filter / config 経路は環境差があり得るため、初回は `apps/api/package.json` の
> test script 定義（`vitest.d1.config.ts` を指す script）を確認し、定義済み script があればそれを使う。

## 合否基準テーブル

| # | コマンド | 期待結果 | 不合格時の主因 |
| --- | --- | --- | --- |
| 1 | `pnpm --filter @ubm-hyogo/api typecheck` | exit 0・型エラー 0 | `add()` 引数型・`AuditLogListRow` shape 不整合。SELECT に派生列を足していないか |
| 2 | `pnpm lint` | exit 0・違反 0 | inline-style / boundaries / deps 違反。`pnpm lint --fix` で自動修復後に残違反を手修正 |
| 3 | D1 targeted vitest | 全 spec PASS。batchId ケース（`auditLog.repository.spec.ts:122-235`）が非退化で緑・新規 index 走査 / 後方互換ケースも緑 | `_setup.ts` が `0026` を適用できない（DDL が単文でない / `BEGIN..END` 混入）。VIRTUAL 列 index が D1 で不可 → 方式 B へ fallback 判断（Phase 2 ゲートに差し戻し） |
| 4 | `pnpm verify:d1-migrations` | exit 0・`0026` が連番として整合・重複/欠番なし | `0026` 番号衝突。最新が `0025_backfill_member_status.sql` であることを再確認 |
| 5 | `node --test scripts/__tests__/verify-d1-migration-sequence.test.mjs` | 全 test PASS | sequence guard ロジック自体の回帰（本タスクで触らない想定・PASS で guard の健全性を担保） |

## line budget / link 確認

| 項目 | 確認方法 | 期待 |
| --- | --- | --- |
| line budget | 変更ファイル（`0026_*.sql` / `auditLog.ts` / spec）の diff 行数が単一サイクル相応（migration 数十行・repository 数行）であること | 肥大化なし。`SELECT_COLS` 不変・write path は方式 B のみ 1 列増 |
| link | index.md / phase-N.md の相互参照リンク・コードパス（`auditLog.ts:200-205` 等）が実在すること | 死リンク 0。`apps/api/src/repository/auditLog.ts` / `apps/api/migrations/0026_audit_log_batchid_index.sql` が存在 |

## migration sequence guard の確認（重複なし・例外登録不要）

| 確認 | 期待 |
| --- | --- |
| `0026` が `apps/api/migrations/` に 1 ファイルのみ | 重複連番なし（`grep -c "^0026" <(ls apps/api/migrations/)` 相当で 1） |
| `apps/api/migrations/sequence-exceptions.json` への登録 | **不要**。`0026` は最新 `0025` の次の正常連番であり、欠番・重複ではないため例外登録しない。本ファイルは差分なしであること |
| `verify:d1-migrations`（#4）の合否 | 上記が満たされれば PASS |

## Gate-B 判定

上記 1〜5 が全て PASS かつ line budget / link / sequence guard の確認が満たされたとき Gate-B 通過。
いずれか不合格の場合は Phase 5/6（実装・テスト追加）または Phase 2（列方式 fallback 判断）へ差し戻す。
