# Phase 2: 既存実装調査

## 目的

親 Issue #515 で実装済みの classifier 抽象 / D1 列 / leakage grep / workflow env と、FU-03-C #548 の offline replay 成果物を調査し、production switch / 7 日 observation / forward-safe rollback の差替点と制約を特定する。

## 調査対象

| 対象 | 確認事項 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 既存 env / step 構造 / 既定 `CF_AUDIT_CLASSIFIER=threshold` の位置 / production env block の有無 |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | Issue #518 で削除済みであることを確認し、再作成しない境界を記録 |
| `scripts/cf-audit-log/classifier/ml.ts` | model artifact load 経路 / `ML_MODEL_PATH` の参照位置 / fallback 条件 |
| `scripts/cf-audit-log/classifier/index.ts` | `getClassifier(env)` の env 解釈分岐 |
| `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts` | 既存 grep 範囲 / hourly post-step に組み込む際の入力経路 |
| `scripts/cf-audit-log/analyze.ts` | hourly run の出口（Issue 起票 / log 書き出し先） |
| `scripts/cf-audit-log/issue-reporter.ts` | Issue body 構造（leakage grep の対象範囲確定） |
| `scripts/cf-audit-log/d1-client.ts` | `classifier_used` / `classifier_version` / `confidence` の write 経路（読み取り専用確認） |
| `apps/api/migrations/0016_cf_audit_log_classification.sql` | 列定義の確認（変更しないことを保証） |
| `scripts/cf.sh` | model artifact 配布の wrapper として使える step（`d1` / `deploy` 以外に generic op-run 入口があるか） |
| FU-03-C #548 の成果物（spec があれば） | 選定 model artifact の path / version / format |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook の追記位置 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | production switch 手順の追記位置 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `ML_MODEL_PATH` production op 参照の追記位置 |

## 出力

`outputs/phase-02/main.md` に以下を記録:

- 各ファイルの現行構造の要約（行数 / export / 主要関数）
- `cf-audit-log-monitor.yml` の env / step 構造（追加 step の挿入位置を行番号で特定）
- `MLClassifier` の artifact load 経路（read path）
- `secret-leakage-grep.ts` の入力契約（hourly post-step 化に必要な改修箇所）
- D1 列の現状（変更不要であることの再確認）
- `scripts/cf.sh` で model artifact を配布する場合に必要な拡張点（あるいは別 wrapper を作るか）

## 完了条件

- [ ] 上記対象すべてを実体読みして `outputs/phase-02/main.md` に要約
- [ ] `cf-audit-log-monitor.yml` への post-step 挿入位置を行番号付きで特定
- [ ] `MLClassifier` が `ML_MODEL_PATH` をどこから読むかを行番号で特定
- [ ] `secret-leakage-grep.ts` を hourly post-step として組み込む際の引数契約を確定
- [ ] FU-03-C #548 成果物の参照経路（spec / artifact path）を一覧化

## 参照資料

- `index.md`
- `phase-01.md`
- `docs/30-workflows/completed-tasks/issue-515-cf-audit-logs-ml-anomaly/`

## 統合テスト連携

- Phase 9 で本調査結果を test fixture / observation dry-run 設計に反映

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 02 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

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
