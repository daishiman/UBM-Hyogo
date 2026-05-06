# Implementation Guide — Issue #408 Cloudflare Audit Logs 監視

## Part 1: 中学生レベル概念説明

「Cloudflare Audit Logs」とは、Cloudflare というサーバ会社が「誰が・いつ・どこから・何の操作をしたか」を全部記録している日記帳のことです。私たちのサイトは Cloudflare に住んでいるので、もし悪い人が API トークン（合鍵のようなもの）を盗んで悪さをしたら、この日記帳に必ず足跡が残ります。

なぜ 1 時間ごとに見張るのかというと、足跡を見つけるのが翌日になると合鍵で家中を荒らされ終わっているからです。1 時間ごとに日記帳の新しいページだけ覗いて、「いつもと違う場所からアクセスしている」「失敗のログが急に増えた」「夜中なのに動いている」のような怪しい行動を自動で見つけ、見つけたら GitHub に通知チケットを作るのが今回の仕組みです。

### 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| Cloudflare Audit Logs | サーバ会社が残す操作の日記帳 |
| API トークン | サーバを操作するための合鍵 |
| D1 | 足跡をしまっておく表つきノート |
| baseline | ふだんの動き方の目安 |
| workflow | 決まった時間に自動で動く係 |
| severity | 怪しさの強さ |
| rotation | 古い合鍵を使えなくして新しい合鍵に替えること |

## Part 2: 技術者向け実装ガイド

### 全体アーキテクチャ

```
GitHub Actions schedule (0 * * * *)
        │
        ▼
fetch.ts ──(Cloudflare Audit Logs API: cursor pagination, per_page=1000)──▶ D1: cf_audit_log
        │
        ▼
analyze.ts ──(threshold 評価: HIGH/MEDIUM/LOW)──▶ gh issue create --label priority:*,type:security
        │
        ▼
purge SQL (TTL 30day)

別ライン:
cf-audit-log-monitor-watchdog.yml ──(前回成功 heartbeat > 2h なら自己 alert)
baseline.ts ──(7 日学習: percentile / 業務時間帯)──▶ outputs/phase-N/baseline.json
```

### File-by-file 変更（Phase 5 で生成）

| ファイル | 変更種別 | 主要変更内容 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 新規 | `schedule: '0 * * * *'`, `permissions: issues:write, contents:read`, secrets `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` / `CLOUDFLARE_ACCOUNT_ID` 注入、`scripts/cf-audit-log/fetch.ts` → `analyze.ts` の順実行 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 新規 | `schedule: '15 * * * *'`、heartbeat variable を確認し 2h 超で Issue 自動起票 |
| `scripts/cf-audit-log/fetch.ts` | 新規 | Cloudflare Audit Logs API (`/accounts/:id/audit_logs`) を cursor ベースで全ページ取得、D1 (`cf_audit_log`) へ INSERT。`since` / `before` を直前 1 時間で指定 |
| `scripts/cf-audit-log/analyze.ts` | 新規 | 直近 1h 行を D1 SELECT、HIGH (想定外 IP × 認証成功) / MEDIUM (403 ≥ 閾値) / LOW (業務時間外) を判定、`gh issue create` で `priority:high|medium|low,type:security` label 付与 |
| `scripts/cf-audit-log/baseline.ts` | 新規 | 過去 7 日の D1 集計から 403 p95 / 業務時間外比率を計算し、D1 `cf_audit_baseline` と `--output` artifact に保存 |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | 新規 | `cf_audit_log (id TEXT PK, occurred_at INTEGER, actor_email TEXT, actor_ip TEXT, action TEXT, resource TEXT, status_code INTEGER, raw_json TEXT)` + `CREATE INDEX idx_cf_audit_log_occurred_at` + 30 日 TTL purge SQL |
| `scripts/cf.sh` | 拡張 | `audit-log fetch|analyze|baseline` サブコマンドを `op run` 経由で `CF_AUDIT_TOKEN_PROD` を注入して呼び出す |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | "監視 Token 分離" 節を追加（命名規則 `CF_*_AUDIT_*` / scope `Audit Logs:Read` のみ / rotation 経路は deploy Token と独立） |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | Issue #408 監視 contract、severity label、Phase 11 runtime pending evidence 境界を追記 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | "audit-log alert 対応手順" 節を追加（HIGH 検知 → Token 即失効 → 影響範囲調査 → 再発行 の 4 ステップ） |

### TypeScript interfaces

```ts
export type CfAuditSeverity = "HIGH" | "MEDIUM" | "LOW";

export interface CfAuditEvent {
  id: string;
  occurredAt: number;
  action: string;
  actorEmail: string | null;
  actorIp: string | null;
  outcome: "success" | "failure";
  statusCode: number | null;
  resource: string | null;
  raw: unknown;
}

export interface CfAuditBaseline {
  id: "production";
  activeFrom: number;
  allowedIpCidrs: string[];
  hourlyFailureCountP99: number;
  businessHoursJst: { start: 9; end: 19 };
  rotationWindows: Array<{ start: number; end: number; reason: string }>;
}

export interface SeverityResult {
  severity: CfAuditSeverity | null;
  labels: string[];
  fingerprint: string;
  redactedSummary: string;
}

export interface FetchResult {
  fetched: number;
  inserted: number;
  skipped: number;
  cursorExhausted: boolean;
}
```

### CLI signatures and usage

```bash
pnpm tsx scripts/cf-audit-log/fetch.ts \
  --since 2026-05-06T00:00:00Z \
  --until 2026-05-06T01:00:00Z \
  --out outputs/phase-11/workflow-run-success.json

pnpm tsx scripts/cf-audit-log/analyze.ts \
  --window-start 2026-05-06T00:00:00Z \
  --window-end 2026-05-06T01:00:00Z \
  --baseline outputs/phase-11/baseline-7day-thresholds.json \
  --dry-run false

pnpm tsx scripts/cf-audit-log/baseline.ts \
  --days 7 \
  --out outputs/phase-11/baseline-7day-thresholds.json
```

Required environment:

| 変数 | 必須 | 用途 |
| --- | --- | --- |
| `CF_AUDIT_TOKEN_PROD` | yes | Audit Logs API 読み取り専用 token |
| `CLOUDFLARE_ACCOUNT_ID` | yes | 対象 account |
| `CF_AUDIT_DB` | yes | `ubm-hyogo-db-prod` |
| `GITHUB_TOKEN` | yes | alert Issue 起票 |
| `--dry-run` | no | `true` の間は Issue 起票を抑止 |

### Error handling and edge cases

| ケース | 扱い |
| --- | --- |
| Audit Logs API 401/403 | job fail。watchdog が P1 Issue を起票し、`CF_AUDIT_TOKEN_PROD` rotation 手順へ誘導 |
| cursor pagination 中断 | last cursor と window を log に残し retry。重複は `INSERT OR IGNORE` で吸収 |
| baseline 未作成 | baseline 未作成時は classifier が null を返し Issue 起票しない |
| GitHub Issue API rate limit | analyzer は non-zero exit。dedup fingerprint を log に残し次回 run で再評価 |
| actor IP null | HIGH 判定せず MEDIUM/LOW だけ評価。raw body には full IP/user agent を保存しない |

### Tunable constants

| 定数 | 初期値 | 理由 |
| --- | --- | --- |
| `FETCH_WINDOW_MINUTES` | 60 | hourly schedule と一致 |
| `AUDIT_LOG_TTL_DAYS` | 30 | D1 無料枠と incident investigation のバランス |
| `BASELINE_DAYS` | 7 | 曜日差を一巡させる |
| `FAILURE_SPIKE_MULTIPLIER` | 1.5 | p99 からの急増を検出 |
| `WATCHDOG_STALE_MINUTES` | 90 | hourly run 1 回分の遅延を許容 |
| `ISSUE_DEDUP_WINDOW_MINUTES` | 60 | 同一 fingerprint の重複起票を抑止 |

### Runtime flow（1 サイクル）

1. `schedule '0 * * * *'` 発火 → `cf-audit-log-monitor.yml` 起動
2. `op run` で `CF_AUDIT_TOKEN_PROD` を環境変数として注入
3. `fetch.ts` が `since=now-1h` `before=now` で cursor ループ取得 → `cf_audit_log` テーブルへ idempotent INSERT (`INSERT OR IGNORE`)
4. `analyze.ts` が直前 1h 行を判定 → 該当があれば `gh issue create`（label と body は `_templates/audit-alert-issue.md`）
5. 30 日経過行を `DELETE FROM cf_audit_log WHERE occurred_at < unixepoch() - 30*86400` で purge
6. job 成功 → `cf-audit-log-monitor-watchdog.yml` が次回サイクルで last_success を更新
7. 失敗時は watchdog が 90 分以内に独立 Issue を起票

### 本番初投入手順（runbook）

| # | ステップ | コマンド / 操作 |
| --- | --- | --- |
| 1 | 監視専用 Token 発行 | Cloudflare dashboard → My Profile → API Tokens → Create Token → "Account: Audit Logs:Read" のみ。Account scope = production account 1 件に限定。Zone scope は付けない |
| 2 | 1Password 登録 | Vault `UBM-Hyogo Production` → Item `Cloudflare API Token (Audit)` → field `credential` に Token 値、field `scope` に `Audit Logs:Read`、field `created_at` を記録 |
| 3 | GitHub Secrets 登録 | `gh secret set CF_AUDIT_TOKEN_PROD --body "$(op read 'op://UBM-Hyogo Production/Cloudflare API Token (Audit)/credential')"` |
| 4 | `.env` 追記 | `CF_AUDIT_TOKEN_PROD="op://UBM-Hyogo Production/Cloudflare API Token (Audit)/credential"`（実値ではなく op 参照のみ） |
| 5 | D1 migration 適用 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` |
| 6 | watchdog workflow 先行 enable | `gh workflow enable cf-audit-log-monitor-watchdog.yml` |
| 7 | monitor workflow enable | `gh workflow enable cf-audit-log-monitor.yml`、最初の cron 起動を `gh run watch` で観測 |
| 8 | 7 日 baseline 学習 | `bash scripts/cf.sh audit-log baseline --days 7 --output outputs/phase-11/baseline-7day-thresholds.json` を実行 |
| 9 | alerting 有効化 | 誤検知率 ≤ 5% を 3 日確認 |
| 10 | runbook update | `observability-monitoring.md` / `15-infrastructure-runbook.md` の rotation 経路に監視 Token を追記、`pnpm indexes:rebuild` |

### Troubleshooting

| 症状 | 一次切り分け | 対処 |
| --- | --- | --- |
| 監視 Token 認証失敗 (401/403) | `bash scripts/cf.sh whoami` (audit profile) で再現 | Token 失効 → 1Password で新 Token を発行・置換 → `gh secret set` 再実行。watchdog が自己起票している前提 |
| watchdog アラート | `gh run list -w cf-audit-log-monitor.yml --limit 5` | 直近失敗 run のログを確認、Cloudflare API rate limit / GitHub Actions outage を切り分け、必要に応じ手動 fetch |
| false positive 急増 | `outputs/phase-9/baseline.json` の閾値が古い可能性 | `baseline.ts` 再計算、IP allowlist 更新、`analyze.ts` の threshold env を tune |
| D1 容量逼迫 | `SELECT count(*) FROM cf_audit_log` | 30 日 TTL purge SQL の cron が動いているか確認、`raw_json` を圧縮 or 切り詰め検討（FU-02 候補） |
| Issue 起票過多 | `gh issue list -l type:security --limit 20` | dedup key（`hash(actor_ip + action + hour)`）を `analyze.ts` に追加、同 key は 1h 内 1 件に抑制 |

### 検証コマンド

```bash
# spec 整合
ls docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-12/
# 期待: Phase 12 strict 7 ファイル + workflow-local phase-12.md の 8 ファイル

# runtime evidence 採取後
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT count(*) FROM cf_audit_log WHERE occurred_at_ms > (unixepoch() - 3600) * 1000"
# 期待: 直近 1h で >0

gh run list -w cf-audit-log-monitor.yml --limit 24 --json conclusion -q '.[].conclusion' | sort | uniq -c
# 期待: success が大多数
```

### 参照

- 親仕様: `../../index.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- SSOT: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- Cloudflare Audit Logs API: https://developers.cloudflare.com/fundamentals/setup/account/account-security/review-audit-logs/

---

## Part 4: 本 PR で実装したコード（2026-05-06 実装サイクル）

本タスクは index.md `[実装区分: 実装仕様書]` の通り runtime コードを伴う実装。本サイクルで以下を merge 対象として完了させた。Token 発行・1Password 登録・GitHub Secret 登録・D1 migration apply・7 日 baseline 学習は production 担当者が手動 runbook で段階的に green 化する（CONST_009 例外: 外部システム認証情報を伴うため別工程に分離。`outputs/phase-5/secrets-registration.md` に登録済）。

### 追加・変更ファイル

#### コード

| パス | 役割 |
| --- | --- |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | D1 schema: `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` + 関連 INDEX |
| `scripts/cf-audit-log/types.ts` | 共有型 (`AuditLogEvent` / `Baseline` / `Finding` / `Severity`) |
| `scripts/cf-audit-log/cli-args.ts` | 軽量 argv parser + duration parser |
| `scripts/cf-audit-log/cloudflare-client.ts` | Cloudflare Audit Logs API cursor ページネーション iterator |
| `scripts/cf-audit-log/severity-classifier.ts` | HIGH/MEDIUM/LOW 純関数 + IPv4/IPv6 CIDR matcher |
| `scripts/cf-audit-log/issue-reporter.ts` | dedupe key (sha256) + body renderer + IssueClient interface |
| `scripts/cf-audit-log/d1-client.ts` | D1 アクセス層: `InMemoryD1` (test) / `WranglerD1` (prod, `wrangler d1 execute --remote --json`) |
| `scripts/cf-audit-log/baseline.ts` | trimmed-p95 / hourly bucket / off-hours ratio |
| `scripts/cf-audit-log/baseline-cli.ts` | `cf.sh audit-log baseline` CLI entry |
| `scripts/cf-audit-log/fetch.ts` | `cf.sh audit-log fetch --since --until` CLI entry |
| `scripts/cf-audit-log/analyze.ts` | `cf.sh audit-log analyze --window 1h [--dry-run] [--fixture path]` CLI entry |
| `scripts/cf.sh` | `audit-log <fetch|analyze|baseline>` サブコマンド追加 |

#### Workflows

| パス | 役割 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | `cron: '0 * * * *'`。fetch → analyze → heartbeat 更新 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | `cron: '15 * * * *'`。前回 heartbeat から 2h 超で `priority:high` + `type:reliability` Issue 起票 |

#### テスト（focused unit, 5 files / 36 tests, all green）

| ファイル | カバー |
| --- | --- |
| `scripts/cf-audit-log/__tests__/severity-classifier.test.ts` | TC-01〜TC-10 + CIDR helper（16 tests） |
| `scripts/cf-audit-log/__tests__/cloudflare-client.test.ts` | CC-01/02/03/05（4 tests） |
| `scripts/cf-audit-log/__tests__/issue-reporter.test.ts` | IR-01〜IR-05 + dedupe granularity（6 tests） |
| `scripts/cf-audit-log/__tests__/d1-client.test.ts` | insert / window / purge / baseline / dedupe / count403（5 tests） |
| `scripts/cf-audit-log/__tests__/baseline.test.ts` | trimmedP95 / hourlyCounts / offHoursRatio（5 tests） |

#### SSOT 同期

| ファイル | 変更点 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | runtime コード merge 済の旨追記。token 発行 / Secret 登録 / baseline 学習が依然 manual runbook である境界を明記 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 状態を `spec_created / runtime pending` → `implementation_merged / runtime pending` |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | audit-log alert 対応の状態表記を更新 |

#### Phase outputs

- `outputs/phase-5/secrets-registration.md` を新規作成（production 担当者向け 10 step runbook）。

### 動作検証（本 PR / ローカル）

```bash
mise exec -- pnpm exec vitest run scripts/cf-audit-log/   # 36 passed (5 files)
mise exec -- pnpm typecheck                                # green
mise exec -- pnpm lint                                     # green（既存 stablekey 警告のみ、本 PR 由来なし）
```

### 設計メモ

- `WranglerD1` は `wrangler d1 execute --remote --json` を `execFileSync` 経由で呼び出すシンプル実装。`?` プレースホルダは shell injection を避けるため数値以外を `'...'` quoting で埋め込む。bind パラメータの実際の SQL 化は本番呼び出し前に必要なら prepared statement 経由に置き換え可能。
- `analyze.ts` は GitHub Issue API を `fetch` で直接叩く（Octokit 依存を避け install / bundle を軽量化）。
- D1 TTL purge は migration 内に置かず、`analyze.ts` 末尾で 30 日カットオフ DELETE を毎時実行する schedule 駆動。
- baseline rotation 除外は環境変数 `CF_AUDIT_ROTATION_WINDOW="<startISO>,<endISO>"` 経由で classifier に渡す。rotation runbook（DERIV-03）から workflow 入力に橋渡しする経路は後続タスクで自動化可能。
- 監視 Token は `CF_AUDIT_TOKEN_PROD`、deploy Token は `CLOUDFLARE_API_TOKEN`。両者を必ず別 secret として保つ（誤って同 token を流用しない）。

### 残課題（本 PR 外で完了させる runtime steps）

`outputs/phase-5/secrets-registration.md` の 10 step：
1. Cloudflare Token 発行
2. 1Password Item 登録
3. `.env` op:// 参照追記
4. GitHub Secret 登録
5. GitHub Variable 初期化
6. D1 migration apply (production)
7. dispatch dry-run
8. 本番 dispatch + Issue 起票観測
9. 7 日 baseline 学習
10. watchdog dispatch 確認

これらは外部認証情報を扱うため、人間オペレータが production credential を持って実施する。本 PR 内では完了扱いにしない（CONST_009 例外要件・先送り根拠：外部システム認証情報の手動付与が必要）。
