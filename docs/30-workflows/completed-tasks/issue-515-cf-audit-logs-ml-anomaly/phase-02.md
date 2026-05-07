# Phase 2: 既存実装調査

## 目的

`scripts/cf-audit-log/` 配下と関連 D1 / GitHub Actions / SSOT を調査し、classifier 抽象化の差替点 / redaction の必要点 / 互換性維持の制約を特定する。

## 調査対象

| 対象 | 確認事項 |
| --- | --- |
| `scripts/cf-audit-log/analyze.ts` | severity 判定の現在の呼出形 / GitHub Issue 起票形式 |
| `scripts/cf-audit-log/severity-classifier.ts` | HIGH/MEDIUM/LOW 判定ロジックの正本 / 入出力型 |
| `scripts/cf-audit-log/types.ts` | `AuditEvent` / `Severity` 型の正本 |
| `scripts/cf-audit-log/baseline.ts` | baseline 学習期間（現在 7 日想定）/ 出力形式 |
| `scripts/cf-audit-log/baseline-cli.ts` | CLI フラグ既存系（`--classifier` / `--evaluate` 追加時の衝突回避） |
| `scripts/cf-audit-log/cli-args.ts` | parser 構造 / 既存フラグ |
| `scripts/cf-audit-log/cloudflare-client.ts` | 取得 event の生 IP / UA 取扱 |
| `scripts/cf-audit-log/d1-client.ts` | `cf_audit_log` write 経路 / 追加カラムの insert 形式 |
| `scripts/cf-audit-log/issue-reporter.ts` | GitHub Issue 起票本文 / classifier 情報の追加位置 |
| `scripts/cf-audit-log/__tests__/` | 既存 test の網羅範囲 |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | 現スキーマ確認 / 追加 migration の連番 |
| `apps/api/migrations/` 全体 | 最新番号確定（00XX を埋める） |
| `.github/workflows/cf-audit-log-monitor.yml` | 既存 env / step 構造 / 追加位置 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | watchdog 側影響有無 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | classifier 抽象の追記位置 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | env 追記位置 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook 追記位置 |

## 出力

`outputs/phase-02/main.md` に以下を記録:

- 各ファイル先頭〜末尾の現行構造の要約（行数 / export / 主要関数）
- `severity-classifier.ts` の入出力契約（再掲・本タスクで wrap 対象）
- `cf_audit_log` の現スキーマ列挙
- migration 連番の最新値（次の番号を確定）
- `cf-audit-log-monitor.yml` の既存 env 一覧
- 既存 test の curent カバレッジサマリ

## 完了条件

- [ ] 上記 16 対象すべてを実体読みして `outputs/phase-02/main.md` に要約
- [ ] migration 連番（追加分の番号）を確定（例: `0015_cf_audit_log_classification.sql`）
- [ ] classifier 注入差替点（`analyze.ts` 内の severity 取得行）を行番号付きで特定
- [ ] redaction が必要な field を `cloudflare-client.ts` から列挙

## 参照資料

- `index.md`
- `phase-01.md`

## 統合テスト連携

- Phase 9 で本調査結果を test fixture 設計に反映

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 02 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 02-1 | この Phase の契約を確定する |
| 02-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
