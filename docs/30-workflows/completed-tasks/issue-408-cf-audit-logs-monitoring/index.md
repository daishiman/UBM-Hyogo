# タスク仕様書: Issue #408 — Cloudflare Audit Logs による API Token 利用監視・alerting

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-408-cf-audit-logs-monitoring |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/408 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` |
| 親 wave | `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/` |
| 配置先 | `docs/30-workflows/issue-408-cf-audit-logs-monitoring/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — 親 Issue は CLOSED だがユーザー指示によりタスク仕様書を作成する。本タスクの目的（Cloudflare Audit Logs を 1 時間毎に取得し alerting を成立させる）はコード変更（GitHub Actions workflow / D1 schema / fetcher script / wrapper / SSOT 同期）を伴うため、CONST_004 に従い実装仕様書として策定する。 |
| 優先度 | MEDIUM |
| 想定 PR 数 | 1（本サイクル: 仕様書 + workflow / scripts / D1 migration 実装 + SSOT の `implemented_local / runtime pending` 同期 + source unassigned-task link。production token 発行・Secret 登録・migration apply・7日 baseline・hourly run evidence は外部credentialを伴う runtime gate として残す） |
| coverage AC | 適用外（GitHub Actions workflow + D1 schema + 監視 script。アプリ本体の coverage 対象外。fetcher script に focused unit test を追加する） |

## 目的

Cloudflare Audit Logs API から API Token 利用イベントを 1 時間毎に取得し、想定外 IP / 403 急増 / 業務時間外利用 などを HIGH / MEDIUM / LOW の重要度別に検知して GitHub Issue を自動起票する仕組みを構築する。漏洩・誤用の早期検知を可能にし、U-FIX-CF-ACCT-01 で確立した最小 scope Token 体制を運用面から補強する。

## スコープ

### 含む

- 監視専用 API Token 発行手順の確定（`Account > Audit Logs:Read` のみ、deploy Token と分離）
- `CF_AUDIT_TOKEN_PROD` を GitHub Secrets / 1Password に保管する経路の確立（`scripts/cf.sh` 拡張）
- `.github/workflows/cf-audit-log-monitor.yml`（`schedule: '0 * * * *'`）の新規作成
- 取得スクリプト `scripts/cf-audit-log/fetch.ts`（Cloudflare Audit Logs API 呼び出し → D1 へ書き込み）
- D1 migration 追加（`apps/api/migrations/0014_create_cf_audit_log.sql`）: `cf_audit_log` テーブル + 30 日 TTL purge SQL
- 異常検知 / alerting スクリプト `scripts/cf-audit-log/analyze.ts`（HIGH / MEDIUM / LOW 判定 + GitHub Issue 自動起票）
- 7 日間ベースライン学習スクリプト `scripts/cf-audit-log/baseline.ts`
- 監視 workflow 自体の失敗検知（`.github/workflows/cf-audit-log-monitor-watchdog.yml`）
- SSOT 同期: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`、`.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` への監視 Token / alerting フロー追記（runtime 実装は後続 PR）

### 含まない

- Audit Logs 90 日以上の長期保管（cold storage 化は別タスク）
- リアルタイム streaming（バッチで十分）
- Cloudflare 以外（GitHub Actions audit log 等）の統合
- alerting 経路の Slack / メール拡張（MVP は GitHub Issue 起票のみ）
- 異常検知 ML モデル化（閾値ベースで開始）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | U-FIX-CF-ACCT-01 | 監視対象 Token の scope が確定し本番稼働していること |
| 上流 | scripts/cf.sh ラッパー | Cloudflare API 呼び出し経路の正本（本タスクで `audit-log` サブコマンドを追加） |
| 関連 | UT-25-DERIV-03 (cf-secrets-audit-log) | secret 配置 audit log との重複排除 |
| 関連 | UT-17-cloudflare-analytics-alerts | alerting 経路 / Issue 起票テンプレ共有 |
| 関連 | U-FIX-CF-ACCT-01-DERIV-03 (rotation runbook) | rotation 期間を baseline 学習対象外にする meta-data 連携 |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| U-FIX-CF-ACCT-01 最小 scope Token が production で稼働 | `bash scripts/cf.sh whoami` で対象 Token が success |
| GitHub Issue 自動起票用の権限がある PAT or `GITHUB_TOKEN` workflow scope | `.github/workflows/*.yml` で `permissions: issues: write` を確認 |
| D1 production への migration 適用経路が既に確立 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` |
| 1Password に `CF_AUDIT_TOKEN_PROD` 用エントリが作成可能 | `op vault list` |

## 苦戦箇所・知見（unassigned-task からの継承）

1. **Audit Logs 読み取り Token の権限分離**: 監視用 Token は `Account > Audit Logs:Read` 単一 scope。deploy Token と secret を分離し、漏洩しても deploy 経路に影響しない設計とする。
2. **想定外 IP の定義**: GitHub Actions runner IP range は広く固定不可。`https://api.github.com/meta` の official IP range list と複合（IP + User-Agent + scope 利用パターン）で異常判定する。
3. **ベースライン学習期間**: 最初の 7 日は alerting 無効・閾値計算のみ。学習中の異常は手動レビュー。学習後も rotation 期間（DERIV-03 runbook と meta-data 連携）を学習対象外とする。
4. **log 保管コスト**: D1 への 30 日保管は無料枠で十分（1h × 30 day × 数 KB）。クエリ用途あるため D1 を正本、artifact 保管は補助。
5. **重要度分類**: HIGH (想定外 IP からの認証成功) / MEDIUM (403 急増) / LOW (業務時間外利用)。Issue label を変える。
6. **監視自体の障害検知**: schedule workflow の失敗が抜け漏れるため、別 workflow (`cf-audit-log-monitor-watchdog.yml`) で前回成功からの経過時間を監視する。
7. **Cloudflare Audit Logs API のページネーション**: `cursor` ベース。1h 取得でも複数ページになり得るため、`per_page=1000` 上限と cursor ループを必ず実装する。
8. **Token 漏洩時の自己起票**: 監視 Token 自身の認証失敗を検知した場合、deploy Token とは別経路で alert する（GitHub Issue 起票は監視 workflow 自身のため、failure 時は watchdog 経由）。

## DoD（完了条件）

- [ ] 監視用 Token が `Audit Logs:Read` のみで発行され、`CF_AUDIT_TOKEN_PROD` GitHub Secret に登録済み
- [ ] `.github/workflows/cf-audit-log-monitor.yml` が `schedule: '0 * * * *'` で稼働、連続 7 日 green
- [ ] D1 `cf_audit_log` テーブルが production に migration 適用済み、log が蓄積され、TTL で 30 日経過行が purge される
- [ ] HIGH / MEDIUM / LOW 別 alerting が動作し、検知時に GitHub Issue が `priority:*` / `type:security` label 付きで起票される
- [ ] 7 日学習完了後、閾値ベースで誤検知率 ≤ 5%
- [ ] 監視 workflow 失敗が `cf-audit-log-monitor-watchdog.yml` によって独立検知される
- [ ] 監視 Token が deploy Token と独立に rotation 可能（runbook に記載）
- [ ] `deployment-secrets-management.md` / `observability-monitoring.md` / `15-infrastructure-runbook.md` 同期完了
- [ ] `pnpm typecheck` / `pnpm lint` green

## 参照

- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/408
- unassigned-task spec: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- 親 wave: `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`
- SSOT 1: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- SSOT: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- 関連: `docs/30-workflows/unassigned-task/UT-25-DERIV-03-cf-secrets-audit-log.md`
- 関連: `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md`
- 関連: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`
- Cloudflare Audit Logs API: https://developers.cloudflare.com/fundamentals/setup/account/account-security/review-audit-logs/
- GitHub Actions IP range: https://api.github.com/meta

## Phase 一覧

| Phase | 目的 | 状態 |
| --- | --- | --- |
| 1 | 要件定義・GO 判定（baseline 取得・Token scope 確認） | completed |
| 2 | データモデル設計（cf_audit_log schema / 重要度判定ロジック） | completed |
| 3 | アーキテクチャ設計（fetcher / analyzer / watchdog の三層構成） | completed |
| 4 | 検証シナリオ設計（合成イベント / fixture / dry-run 設計） | completed |
| 5 | 実装（D1 migration / fetcher / analyzer / workflows / cf.sh 拡張） | completed_local |
| 6 | カバレッジ確認（fetcher / analyzer の focused test） | completed_local |
| 7 | カバレッジ判定（threshold 80% を fetcher / analyzer に限定適用） | completed_local |
| 8 | 統合テスト（fixture / dry-run / watchdog contract） | completed_local_runtime_pending |
| 9 | 品質検証（focused test / typecheck / runtime baseline pending） | completed_local_runtime_pending |
| 10 | 最終レビュー・rollback 経路（workflow 無効化 + Token 失効） | completed |
| 11 | 手動テスト / runtime evidence（fresh GET + Issue 起票観測） | runtime_evidence_pending |
| 12 | ドキュメント整備（必須 7 成果物 + SSOT 同期） | completed |
| 13 | コミット・PR 作成（ユーザー承認後） | blocked_pending_user_approval |
