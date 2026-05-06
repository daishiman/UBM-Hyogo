# File Layout (Phase 3 抜粋)

親: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-3/phase-3.md`

## 新規ファイル

| パス | LOC 目安 | 責務 | 依存 |
| --- | --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | ~80 | 1h schedule で fetch → analyze 実行 | secrets: `CF_AUDIT_TOKEN_PROD`, `GITHUB_TOKEN` |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | ~40 | 30 分 schedule で監視 workflow last success を確認 | `gh run list`, `gh issue create` |
| `scripts/cf-audit-log/fetch.ts` | ~120 | Cloudflare Audit Logs API → D1 insert | `lib/cloudflare-client`, `lib/d1-client` |
| `scripts/cf-audit-log/analyze.ts` | ~150 | D1 query → severity 分類 → Issue 起票 | `lib/d1-client`, `lib/severity-classifier`, `lib/issue-reporter` |
| `scripts/cf-audit-log/baseline.ts` | ~100 | 7 日学習 → cf_audit_baseline insert | `lib/d1-client` |
| `scripts/cf-audit-log/lib/cloudflare-client.ts` | ~80 | Cloudflare API HTTP client (cursor pagination) | fetch (global) |
| `scripts/cf-audit-log/lib/d1-client.ts` | ~80 | D1 HTTP API ラッパ | fetch (global) |
| `scripts/cf-audit-log/lib/severity-classifier.ts` | ~80 | Phase 2 ロジック純関数 | `lib/types` |
| `scripts/cf-audit-log/lib/issue-reporter.ts` | ~60 | GitHub Issue 作成 | `gh` CLI or REST |
| `scripts/cf-audit-log/lib/types.ts` | ~40 | 共通型定義 | (none) |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | ~50 | Phase 2 DDL | (Phase 2 抜粋) |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | ~10 | TTL purge SQL | (none) |

## 編集対象ファイル

| パス | 編集内容 | 影響範囲 |
| --- | --- | --- |
| `scripts/cf.sh` | `audit-log` サブコマンド dispatcher 追加 (+~30 LOC) | wrapper のみ。op run / esbuild 解決はそのまま継承 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_TOKEN_PROD` セクション追記 | SSOT 同期 (Phase 12) |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | HIGH/MEDIUM/LOW 別対応フロー追記 | SSOT 同期 (Phase 12) |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | audit-log HIGH alert 対応手順追記 | SSOT 同期 (Phase 12) |
| `package.json` (root) | `tsx` が devDependencies に未登録なら追加 | 既存なら no-op |

## ディレクトリツリー (新規分)

```
scripts/cf-audit-log/
├── fetch.ts
├── analyze.ts
├── baseline.ts
└── lib/
    ├── cloudflare-client.ts
    ├── d1-client.ts
    ├── severity-classifier.ts
    ├── issue-reporter.ts
    └── types.ts

.github/workflows/
├── cf-audit-log-monitor.yml         (new)
└── cf-audit-log-monitor-watchdog.yml (new)

apps/api/migrations/
├── NNNN_create_cf_audit_log.sql       (new)
└── NNNN_create_cf_audit_log_purge.sql (new)
```

## 命名規則

| 対象 | ルール |
| --- | --- |
| Migration file | `NNNN_<verb>_<entity>.sql` (`NNNN` は既存最大値 +1) |
| Workflow file | `cf-audit-log-monitor.yml` / `-watchdog.yml` (kebab-case) |
| Script entry | `<verb>.ts` (fetch / analyze / baseline) |
| Lib module | `<noun>-client.ts` / `<noun>-classifier.ts` / `<noun>-reporter.ts` |
| Issue title | `[cf-audit] [<SEVERITY>] <action> by <actor_ip> at <JST timestamp>` |

## Coverage 対象

| 対象 | 80% 適用 | 理由 |
| --- | --- | --- |
| `scripts/cf-audit-log/lib/severity-classifier.ts` | ✅ | 純関数 / 分岐多 / 安全クリティカル |
| `scripts/cf-audit-log/fetch.ts` | ✅ | API 呼び出し境界 (mock で確保) |
| `scripts/cf-audit-log/analyze.ts` | ✅ | classify と Issue 起票の合成 |
| `scripts/cf-audit-log/lib/cloudflare-client.ts` | ✅ | cursor pagination の境界 |
| `scripts/cf-audit-log/lib/d1-client.ts` | △ | HTTP wrapper のみ (focused に限定) |
| `scripts/cf-audit-log/lib/issue-reporter.ts` | △ | gh CLI ラップ (label mapping だけ test) |
| `scripts/cf-audit-log/baseline.ts` | △ | weekly cron / 統計関数のみ test |
| `.github/workflows/*.yml` | ✗ | YAML / lint 対象外 |
