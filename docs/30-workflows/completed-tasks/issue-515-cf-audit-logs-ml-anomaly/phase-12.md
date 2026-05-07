# Phase 12: 実装ガイド・未タスク・SSOT 同期・skill feedback

## 目的

Phase 12 必須 6 タスクを実行し、`outputs/phase-12/` 配下に最低 7 ファイルを実体作成する。

## 必須タスク

### Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md`

- Part 1（中学生レベル）: 「なぜ判定方法を抽象化するのか」「閾値と機械学習の違い（コーヒー豆の選別を例に）」「rollback とは何か」を中学生向けに説明
- Part 2（技術者レベル）: Classifier interface / DI による差替設計 / redaction の必要性 / offline evaluation 指標（precision/recall/FP/FN）/ Gate 条件 / migration 順序 / rollback 3 段階を厳密に記述

### Task 12-2: SSOT 更新（aiworkflow-requirements）

| 対象 | 追記内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | classifier 抽象 / Gate-A〜D / threshold rollback / offline evaluation 指標 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_REDACT_SECRET` |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | rollback runbook（即時 env / code revert / migration DOWN の 3 段階） |

合わせて `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` と `.claude/skills/task-specification-creator/LOGS/_legacy.md` に本タスク entry を canonical absolute path で 1 行ずつ追加。

### Task 12-3: ドキュメント更新履歴作成

`outputs/phase-12/documentation-changelog.md`

- 上記 SSOT 3 ファイル + LOGS 2 ファイル + `artifacts.json` / `index.md` / `phase-01.md`〜`phase-13.md` + outputs を canonical absolute path で列挙

### Task 12-4: 未タスク検出レポート作成（**0 件でも作成必須**）

`outputs/phase-12/unassigned-task-detection.md`

本サイクル外として以下を未タスク化:

- **U-FIX-CF-ACCT-01-DERIV-04-FU-03-A**: 90 日 baseline 観測の継続実施。Gate-A〜C 達成判定。完了条件: parent #408 monitoring の 90 日連続稼働 evidence
- **U-FIX-CF-ACCT-01-DERIV-04-FU-03-B**: 学習データ抽出スクリプトの本番実行（redacted features の 90 日分エクスポート）。Gate-A 通過後着手
- **U-FIX-CF-ACCT-01-DERIV-04-FU-03-C**: ML モデル選定 / 学習（Isolation Forest / XGBoost / Cloudflare Workers AI 等の比較）と offline evaluation での閾値 vs ML 比較
- **U-FIX-CF-ACCT-01-DERIV-04-FU-03-D**: production 切替（migration apply prod + `CF_AUDIT_CLASSIFIER=ml` 反映）と post-switch 7 日観測

各エントリは `docs/30-workflows/unassigned-task/` 配下に新規 md として起票（テンプレ必須 4 セクション: 苦戦箇所 / リスクと対策 / 検証方法 / スコープ）。

### Task 12-5: スキルフィードバックレポート作成

`outputs/phase-12/skill-feedback-report.md`

3 観点固定:

- **テンプレ改善**: classifier 抽象化のような「本サイクル：抽象 + 評価、後続 Gate：実モデル」型タスクの先送り境界明示テンプレ
- **ワークフロー改善**: Gate 条件を artifacts.json metadata に構造化する案
- **ドキュメント改善**: NON_VISUAL evidence の置き方ガイドへ「offline evaluation JSON / leakage grep log」の例を追加

### Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md`

CONST_004 / CONST_005 / CONST_007 の各項目を本タスクが満たしていることを check 列で記録。

### Task 12-Sys: システム仕様書更新サマリ

`outputs/phase-12/system-spec-update-summary.md`

Task 12-2 の 3 ファイルへの差分要約。

## 完了条件

- [ ] `outputs/phase-12/` に 7 ファイル実体存在: `main.md` / `implementation-guide.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `system-spec-update-summary.md` / `phase12-task-spec-compliance-check.md`
- [ ] SSOT 3 ファイルが更新されている
- [ ] LOGS.md 2 ファイルに entry 追加
- [ ] 未タスク 4 件が `unassigned-task/` 配下に新規 md 起票

## 出力

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`

## 統合テスト連携

- Phase 11 evidence が本 Phase の test 証跡として参照される

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 12-1 | この Phase の契約を確定する |
| 12-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
