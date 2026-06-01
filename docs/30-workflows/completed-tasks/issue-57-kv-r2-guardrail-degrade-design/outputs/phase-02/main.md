# Phase 2 成果物 — 設計

## kill-switch 判定（export-to-r2.ts）

```
runCli():
  paused = process.env.AUDIT_COLD_STORAGE_EXPORT_PAUSED === "true"
  return exportAuditLogToR2({ db, r2 }, { paused, dryRun, targetDate })

exportAuditLogToR2(...):
  if opts.paused === true:
      return { status: "paused", objectKey: null, rowCount: 0, ... }
  # 非 paused のみ D1 SELECT -> gzip -> R2 PUT -> manifest
```

- pause（明示停止）と実行失敗（R2 / D1 / credential failure）を区別する。
- 既定=稼働（フラグ未設定/"false"/その他は通常動作）。

## env.ts 型整合

- `readonly ALERT_DEDUP_KV: KVNamespace;` -> `readonly ALERT_DEDUP_KV?: KVNamespace;`
- alert-relay は KV 未設定時に delivery を継続し、dedup のみ `dedupPersisted:false` とする。

## GitHub Actions wiring

`.github/workflows/audit-log-cold-storage.yml` の export step に `AUDIT_COLD_STORAGE_EXPORT_PAUSED: ${{ vars.AUDIT_COLD_STORAGE_EXPORT_PAUSED || 'false' }}` を渡す。

## ドキュメント編集箇所

- `specs/08-free-database.md`: 無料枠表に KV/R2 行追加（確認日付き）。
- `deployment-cloudflare.md`: stale 記述是正 + KV/R2 limit 追記。
- `cost-guardrail-runbook.md`: §2-7 数値閾値化 + §4-2 executable degrade 化 + 05a/05b handoff 同期。
