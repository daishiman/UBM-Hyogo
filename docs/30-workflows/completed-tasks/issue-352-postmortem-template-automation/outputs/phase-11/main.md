# Phase 11 — 手動 smoke / 実測 evidence

## taskType
NON_VISUAL（CLI ツール / 運用 runbook）。スクリーンショット evidence は対象外。

## 実測コマンド & 結果
```bash
# 1. help
$ mise exec -- pnpm postmortem:generate -- --help
usage: pnpm postmortem:generate -- --release vX.Y.Z --commit <sha>
  --evidence <09c-phase-11-dir> --rollback-evidence <rollback-md>
  --occurred-at <iso8601> [--detected-at <iso8601>] [--resolved-at <iso8601>]
  [--severity <label>] [--out <path>]
# exit 0

# 2. happy path（一時 evidence dir を生成）
$ TMP=$(mktemp -d) && mkdir -p $TMP/phase-11 && echo "# evidence" > $TMP/phase-11/main.md
$ mise exec -- pnpm postmortem:generate -- \
    --release v0.0.0 --commit deadbee \
    --evidence $TMP/phase-11 --rollback-evidence rollback.md \
    --occurred-at 2026-05-05T00:00:00Z --severity sev2
# stdout: 固定 8 見出しを含む postmortem markdown
# exit 0

# 3. empty rollback evidence warning
$ : > $TMP/empty-rollback.md
$ mise exec -- pnpm postmortem:generate -- --release v0.0.0 --commit deadbee \
    --evidence $TMP/phase-11 --rollback-evidence $TMP/empty-rollback.md \
    --occurred-at 2026-05-05T00:00:00Z >/tmp/postmortem-empty.out
# stderr: warning: rollback-evidence is empty: <path>
# exit 0

# 4. unit tests
$ mise exec -- pnpm vitest run scripts/postmortem --coverage.enabled=false
# 13 tests passed

# 5. coverage
$ mise exec -- pnpm vitest run scripts/postmortem --coverage '--coverage.include=scripts/postmortem/**'
# statements 89.44% / branches 73.61% / functions 100% / lines 89.44%
```

## 異常系手動確認
- evidence path 未指定 → `missing required field: evidence` / exit 非 0
- evidence path 不在 → `evidence path not found: <p>` / exit 非 0
- release 形式不正 → `invalid release: <v>` / exit 非 0

## 結論
AC-1..AC-10 を実機で充足。冪等性 / blame-free / evidence 必須 / rollback evidence empty warning を全層で確認。
