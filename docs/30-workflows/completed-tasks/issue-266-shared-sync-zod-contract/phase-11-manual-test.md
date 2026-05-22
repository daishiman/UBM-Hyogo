# Phase 11: 手動テスト（NON_VISUAL）

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> visual classification: NON_VISUAL（UI 変更なし。スクショ取得なし）

---

## 1. 手動テスト方針

本タスクは shared schema + TS 契約面の改修であり、UI に到達する差分がない。`outputs/phase-11/` には UI スクショの代わりに **CLI evidence（typecheck / test / grep / D1 SELECT）のログファイル**を保存する。

---

## 2. evidence 取得手順

### 2.1 typecheck

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-235006-wt-2

mise exec -- pnpm typecheck \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/typecheck.log 2>&1
echo $? > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/typecheck.exit
# 期待: exit code 0
```

### 2.2 lint

```bash
mise exec -- pnpm lint \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/lint.log 2>&1
echo $? > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/lint.exit
```

### 2.3 unit / contract test

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/test-shared.log 2>&1

mise exec -- pnpm --filter @ubm-hyogo/api test -- sync/ \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/test-api-sync.log 2>&1
```

### 2.4 coverage（Phase 7 連動）

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --coverage \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/coverage-shared.log 2>&1
```

### 2.5 grep gate

`outputs/phase-11/grep-gate.sh` として保存し、CI 化に備える。

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"
cd "$ROOT"

echo "[1/4] legacy trigger literal in runtime path"
! grep -rn '"manual"\|"scheduled"' apps/api/src/sync/ \
    --include='*.ts' --exclude='*.spec.ts' \
  | grep -v '^\s*//' | grep -v '^\s*\*' | grep .

echo "[2/4] independent literal union declaration"
! grep -rn 'type Sync\(Trigger\|LogStatus\) = "\|type AuditStatus = "' apps/api/src/ | grep .

echo "[3/4] lockTriggerOf残存"
! grep -rn 'lockTriggerOf' apps/api/src/ | grep .

echo "[4/4] shared deep import"
! grep -rn '@ubm-hyogo/shared/zod/\|@ubm-hyogo/shared/src/' apps/api/src/ apps/web/src/ | grep .

echo "OK: all grep gates passed"
```

実行:

```bash
bash docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/grep-gate.sh \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/grep-no-drift.log 2>&1
```

### 2.6 staging D1 値確認（OQ-1 解決）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT DISTINCT trigger_type, status, COUNT(*) AS n FROM sync_job_logs GROUP BY trigger_type, status ORDER BY trigger_type, status;" \
  > docs/30-workflows/issue-266-shared-sync-zod-contract/outputs/phase-11/d1-distinct.log 2>&1
```

---

## 3. 保存予定ファイル一覧

| ファイル | 内容 |
|---------|------|
| `typecheck.log` / `typecheck.exit` | `pnpm typecheck` 出力 + exit code |
| `lint.log` / `lint.exit` | `pnpm lint` 出力 + exit code |
| `test-shared.log` | shared 新規 spec の test 結果 |
| `test-api-sync.log` | apps/api `sync/` 配下 contract spec の test 結果 |
| `coverage-shared.log` | shared coverage summary |
| `grep-gate.sh` | grep gate wrapper（再利用可） |
| `grep-no-drift.log` | grep gate 実行ログ（OK: all grep gates passed が末尾） |
| `d1-distinct.log` | staging D1 の `SELECT DISTINCT trigger_type, status` 結果 |

---

## 4. 判定基準

| ログ | 合格条件 |
|------|---------|
| `typecheck.exit` | `0` |
| `lint.exit` | `0` |
| `test-shared.log` | 20+ pass / 0 fail |
| `test-api-sync.log` | 既存件数 + 1 pass / 0 fail / 0 regression |
| `coverage-shared.log` | `sync-log.ts` line 100% |
| `grep-no-drift.log` | 末尾に `OK: all grep gates passed` |
| `d1-distinct.log` | `trigger_type` ∈ {cron, admin, backfill}（旧値 0 件） |

---

## 5. 旧値 row が残存した場合の fallback

`d1-distinct.log` に `manual` / `scheduled` の trigger_type が >0 件あれば、Phase 5 §7 の cursor IN 句を hybrid に temporary 維持する:

```diff
- WHERE status = 'success' AND trigger_type IN ('cron','admin','backfill')
+ WHERE status = 'success' AND trigger_type IN ('cron','admin','backfill','manual','scheduled')
```

同時に **fallback retirement task を別 issue として起票**（例: 「issue #266 後続: sync_job_logs 旧 trigger 値のデータ cleanup」）。本 PR の merge は staging cleanup 完了後に行う、または fallback hybrid 込みで merge → 後続 task で cleanup の 2 択を採る。

---

## 6. Phase 11 DoD

- [ ] §3 の 8 ファイル全て `outputs/phase-11/` に保存
- [ ] §4 の全合格条件を満たす
- [ ] 旧値 row が残存した場合は §5 の fallback 判断が記録される
