# Phase 9: 品質保証

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 5-8 完了後の最終 QA。

---

## 1. QA チェックリスト

### 1.1 自動検証

| # | 項目 | コマンド | 期待 |
|---|------|---------|------|
| Q1 | typecheck | `mise exec -- pnpm typecheck` | green |
| Q2 | lint | `mise exec -- pnpm lint` | green |
| Q3 | shared unit test | `mise exec -- pnpm --filter @ubm-hyogo/shared test` | 20+ 件 green |
| Q4 | apps/api 既存 sync contract spec | `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/` | 既存 + 1 件 green |
| Q5 | shared coverage | `mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage` | `sync-log.ts` line 100% |

### 1.2 grep gate

```bash
# 1) sync 経路に旧 trigger 値の文字列リテラルが残存していないか
grep -rn '"manual"\|"scheduled"' apps/api/src/sync/ \
  --include='*.ts' \
  --exclude='*.spec.ts' \
  | grep -v '^\s*//' | grep -v '^\s*\*'
# 期待: 0 件

# 2) 独立 literal union 宣言の再発
grep -rn 'type Sync\(Trigger\|LogStatus\) = "\|type AuditStatus = "' apps/api/src/
# 期待: 0 件

# 3) lockTriggerOf 関数の残存
grep -rn 'lockTriggerOf' apps/api/src/
# 期待: 0 件

# 4) deep import の混入
grep -rn '@ubm-hyogo/shared/zod/\|@ubm-hyogo/shared/src/' apps/api/src/ apps/web/src/
# 期待: 0 件
```

### 1.3 物理 DB 値との一致確認（Phase 11 で実機実行）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT DISTINCT trigger_type, status FROM sync_job_logs;"
# 期待:
#   trigger_type ∈ {cron, admin, backfill}
#   status ∈ {running, success, failed, skipped}
```

旧値（`manual` / `scheduled`）が混入していた場合、Phase 11 §5 の fallback retirement 手順に従う。

### 1.4 `z.infer` 強制ルール（構造的確認）

```bash
# packages/shared/src/zod/ 配下で 'type ... = "' 宣言が独立で存在しないか
# （Iso8601Z 等の primitive はゼロ件、sync-log.ts も z.infer 経由のみが期待）
grep -n 'export type Sync\(Log\|Trigger\)' packages/shared/src/zod/sync-log.ts
# 期待: 3 行とも `z.infer<typeof ...>` を含む
```

---

## 2. レビュー観点

| 観点 | 確認方法 |
|------|---------|
| 不変条件 #1 canonical status 一致 | `sync-log.ts` の `SyncLogStatusZ` が `["running","success","failed","skipped"]` |
| 不変条件 #2 canonical trigger 一致 | `sync-log.ts` の `SyncTriggerTypeZ` が `["cron","admin","backfill"]` |
| 不変条件 #3 field 命名 snake_case | `SyncLogRecordZ` の全 12 field が snake_case |
| 不変条件 #4 `z.infer` 強制 | §1.4 |
| 不変条件 #5 独立 literal union 削除 | §1.2 grep #2 |
| 不変条件 #6 web → api deep import 禁止 | `apps/web` 配下に sync import が無いことを grep |
| 不変条件 #7 sync_jobs と別契約 | `syncJobs.ts` 未変更を `git status` で確認 |
| 不変条件 #8 物理 DDL 不変 | `apps/api/migrations/` 未変更を `git status` で確認 |
| 不変条件 #9 typecheck / lint green | Q1 / Q2 |

---

## 3. リスク再評価

Phase 1 §9 で挙げた 5 リスクの再評価:

| リスク | 残存度 | 確認 |
|-------|------|------|
| cursor IN 句変更で旧 row 漏れ | 低 | §1.3 で staging 実機確認 |
| `lockTriggerOf` 削除による silent fail | 低 | Q1 typecheck で compile-time 検出 |
| `SyncLogRecordZ` field 不一致 | 低 | Q3 + Q4 で end-to-end 確認 |
| `z.infer` 型 ↔ 既存 `AuditRow` 構造ずれ | 低 | Q1 typecheck で検出 |
| #195 担当者が誤流用 | 低 | index.md `out of scope` 明示 |

---

## 4. ロールバック手順（万一）

実装 PR を merge 後に本番で異常を検知した場合:

```bash
# 1. PR を revert
gh pr revert <pr-number>

# 2. revert PR を dev → main へ流す
```

revert は git 履歴のみで完結する。物理 DDL 変更がないため D1 migration の rollback は不要。

---

## 5. Phase 9 DoD

- [ ] §1.1 自動検証 Q1-Q5 全件 green
- [ ] §1.2 grep gate 全 4 種 0 件
- [ ] §1.3 staging D1 値が canonical 範囲内
- [ ] §1.4 `z.infer` 強制 OK
- [ ] §2 全 9 不変条件 OK
- [ ] §3 全リスクが「低」または mitigation 済み
