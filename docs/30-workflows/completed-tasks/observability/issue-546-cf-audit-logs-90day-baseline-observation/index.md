# Issue #546 CF Audit Logs 90 Day Baseline Observation

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Issue | #546 |
| 状態 | `spec_created` |
| workflow state | `observation_continue` |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| 実装区分 | ドキュメントのみ。既存 GitHub Actions / D1 / Issue evidence を read-only に観測し、コード・migration・workflow YAML は変更しない |
| closed issue handling | Issue #546 は CLOSED のまま維持し、PR / commit message は `Refs #546` のみを使う |

## 目的

Issue #546 の Cloudflare Audit Logs 90 日 baseline runtime 観測を、Phase 1-13 の docs-only / NON_VISUAL workflow として検証する。2026-05-08 時点の観測では Gate-A が FAIL、Gate-B/C は `PENDING_RUNTIME_EVIDENCE` のため、ML comparison や production switch へ進まず継続観測に固定する。

## Gate 定義

| Gate | 判定 | 入力 | 出力 |
| --- | --- | --- | --- |
| Gate-A 90 day continuity | 90 日連続稼働と watchdog gap なしなら PASS | GitHub Actions monitor/watchdog run history | `outputs/phase-11/gh-run-list-*.json`, `gate-decision.md` |
| Gate-B FPR <= 5% | false positive rate が 5% 以下なら PASS | alert Issue evidence + D1 aggregate + baseline threshold | `outputs/phase-11/gh-issues-cf-audit.json`, `baseline-90day-thresholds.json` |
| Gate-C tuning cost >= 4h/month | owner-authored tuning minutes が月4h以上なら PASS | tuning cost log / Issue evidence | `outputs/phase-11/tuning-cost-summary.md`, `tuning-cost-issues.json` |

## 2026-05-08 観測結果

| 項目 | 結果 |
| --- | --- |
| monitor evidence | 2026-05-06〜2026-05-07 の 32 failure |
| watchdog evidence | 2026-05-06〜2026-05-07 の 32 failure |
| D1 evidence | `no such table: cf_audit_log` |
| baseline threshold | `PENDING_RUNTIME_EVIDENCE` marker |
| tuning cost | `PENDING_RUNTIME_EVIDENCE` |
| decision | `observation_continue` |
| reminder | `docs/30-workflows/unassigned-task/issue-546-cf-audit-logs-90day-reobservation-reminder-001.md` |

## Read-only コマンド境界

GitHub Actions の 90 日 hourly run は `gh run list --limit 500` 上限を超えるため、Gate evidence は `gh api --paginate` で取得し、JSON array として保存する。D1 evidence は read-only `SELECT` のみを許可し、Cloudflare mutation、migration apply、workflow YAML 変更、Issue reopen は実行しない。

## Phase 11 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL evidence summary |
| `outputs/phase-11/manual-smoke-log.md` | 実行ログ |
| `outputs/phase-11/link-checklist.md` | link / reference checklist |
| `outputs/phase-11/gh-run-list-cf-audit-log-monitor.json` | monitor run evidence |
| `outputs/phase-11/gh-run-list-watchdog.json` | watchdog run evidence |
| `outputs/phase-11/gh-issues-cf-audit.json` | alert issue evidence |
| `outputs/phase-11/d1-cf-audit-90day-summary.json` | D1 read-only evidence |
| `outputs/phase-11/baseline-90day-thresholds.json` | pending baseline marker |
| `outputs/phase-11/tuning-cost-summary.md` | tuning cost summary |
| `outputs/phase-11/tuning-cost-issues.json` | tuning cost issue evidence |
| `outputs/phase-11/redaction-check.md` | redaction check |
| `outputs/phase-11/gate-decision.md` | Gate-A FAIL / Gate-B-C pending decision |

## Phase 12 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 summary |
| `outputs/phase-12/implementation-guide.md` | 観測手順ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 正本仕様同期サマリ |
| `outputs/phase-12/documentation-changelog.md` | 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | Gate 結果別の未タスク判定 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback ルーティング |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict 7 files compliance |

## DoD

- [x] Issue #546 は CLOSED のままで、PR / commit message は `Refs #546` のみを使う。
- [x] `phase-01.md` から `phase-13.md` がすべて存在する。
- [x] Gate-A/B/C の判定式、入力データ、出力先が仕様書に明記されている。
- [x] runtime evidence 取得コマンドが read-only であることが明記されている。
- [x] コード変更なしで目的達成できる根拠が `[実装区分: ドキュメントのみ]` に明記されている。
- [x] Phase 12 で aiworkflow-requirements 同期対象が列挙されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 / 実装区分判定 | `phase-01.md` | completed |
| 2 | 既存仕様・runtime 基盤調査 | `phase-02.md` | completed |
| 3 | 観測設計 / Gate 設計 | `phase-03.md` | completed |
| 4 | データ取得契約 | `phase-04.md` | completed |
| 5 | 集計 SQL / データ構造 | `phase-05.md` | completed |
| 6 | 実行手順 / コマンド仕様 | `phase-06.md` | completed |
| 7 | セキュリティ / redaction | `phase-07.md` | completed |
| 8 | 欠測分類 / pending boundary | `phase-08.md` | completed |
| 9 | 品質保証 | `phase-09.md` | completed |
| 10 | Gate decision / rollback | `phase-10.md` | completed |
| 11 | 手動テスト検証 | `phase-11.md` | completed_with_runtime_blockers |
| 12 | ドキュメント更新 | `phase-12.md` | completed |
| 13 | PR 作成 | `phase-13.md` | pending_user_approval |
