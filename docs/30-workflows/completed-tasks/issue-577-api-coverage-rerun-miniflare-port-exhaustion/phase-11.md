# Phase 11 — runtime evidence 取得（rerun 実行・log 保存・triage 実施）

## 目的

Phase 1〜10 の仕様に基づき、実機で rerun と triage を実行して evidence を canonical path に固定する。本 Phase は user approval gate（G1）後に実行する。失敗は収集対象なので、vitest fail で手順全体を即終了させず、exit code / duration / exit reason を evidence に残す。

## 入力 / 前提

- Phase 4 のシナリオ
- Phase 6 helper script（採用時）
- 環境: Node 24.15.0 / pnpm 10.33.2 / mise 経由

## 手順

1. 環境 snapshot を取得:
   ```bash
   mkdir -p docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence
   {
     mise exec -- node -v
     mise exec -- pnpm -v
     uname -a
     sysctl net.inet.ip.portrange.first net.inet.ip.portrange.last 2>/dev/null || true
     date -u +%Y-%m-%dT%H:%M:%SZ
   } > docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/env-snapshot.txt
   ```
2. baseline rerun を 3 回実行:
   ```bash
   workflow=docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion
   for i in 1 2 3; do
     start_epoch=$(date +%s)
     set +e
     mise exec -- pnpm --filter @ubm-hyogo/api test:coverage 2>&1 \
       | tee "$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log"
     exit_code=${PIPESTATUS[0]}
     set -e
     duration_sec=$(($(date +%s) - start_epoch))
     eaddr_count=$(grep -c EADDRNOTAVAIL "$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log" || true)
     {
       echo ""
       echo "# command_result"
       echo "exit_code=$exit_code"
       echo "duration_sec=$duration_sec"
       echo "eaddrnotavail_count=$eaddr_count"
     } >> "$workflow/outputs/phase-11/evidence/baseline-rerun-${i}.log"
     sleep 10
   done
   ```
3. EADDRNOTAVAIL 検出時は Phase 3 matrix を順次実行し、各軸の log を `triage-matrix-<axis>-<value>.log` に保存。
4. 最終採用軸の log を `full-coverage-rerun.log` として複製（または最終 baseline 3 回目）。
5. matrix 結果を `triage-summary.md` の表形式で記録:

   | 軸 | 値 | exit_code | exit_reason | EADDRNOTAVAIL count | duration_sec | 採用 |
   | --- | --- | --- | --- | --- | --- | --- |
   | baseline | (none) | ? | ? | ? | ? | - |
   | B | maxWorkers=1/minWorkers=1 | ? | ? | ? | ? | ? |
   | A | pool=forks | ? | ? | ? | ? | ? |
   | C | no-file-parallelism | ? | ? | ? | ? | ? |
   | D | shard=1/2 | ? | ? | ? | ? | ? |

6. `outputs/phase-11/main.md` に概要・採用判断・後続 Phase（5/6 採用 or no-code verification close-out）を記録。

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/full-coverage-rerun.log`
- `outputs/phase-11/evidence/triage-summary.md`
- `outputs/phase-11/evidence/env-snapshot.txt`
- `outputs/phase-11/evidence/baseline-rerun-{1,2,3}.log`
- `outputs/phase-11/evidence/triage-matrix-*.log`（再現時のみ）

## 検証コマンド

```bash
ls docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/
grep -c EADDRNOTAVAIL docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-11/evidence/baseline-rerun-*.log
```

## 完了条件（DoD）

- [ ] env-snapshot.txt が固定されている。
- [ ] baseline rerun 3 件の log が保存されている。
- [ ] EADDRNOTAVAIL 再現時は matrix log と triage-summary.md が完成している。
- [ ] 採用判断が `main.md` に記録されている。
