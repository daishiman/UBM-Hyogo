# Phase 12: ドキュメント整備（6 必須タスク）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| Source | `outputs/phase-12/phase-12.md` |
| 親 Issue | #555 |
| workflow_state ルール | local 実装完了で `implemented-local`。staging evidence 完了で `runtime_evidence_collected`。spec_created のままなら本 Phase の実書き込みは skip し spec のみ整備。 |

## 目的

task-specification-creator skill 規定の **6 必須タスク** を整備し、`AUDIT_CORRELATION_SALT` rotation 自動化と fingerprintVersion=2 移行を Part 1（中学生レベル）/ Part 2（技術者レベル）両面で説明する。aiworkflow-requirements SSOT (`references/audit-correlation.md` / `references/deployment-secrets-management.md` / `topic-map` / `keywords.json`) を更新し、`pnpm indexes:rebuild` で再生成する。

## 実行タスク

詳細仕様は `outputs/phase-12/phase-12.md` を正本とする。

## 6 必須タスクと成果物

| # | 必須タスク | 成果物 |
| --- | --- | --- |
| 1 | implementation guide（Part 1 + Part 2） | `outputs/phase-12/implementation-guide.md` |
| 2 | aiworkflow-requirements SSOT 反映ログ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | docs / SSOT 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 残課題（unassigned）検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | task-specification-creator skill への feedback | `outputs/phase-12/skill-feedback-report.md` |
| 6 | spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 完了条件

詳細 DoD は `outputs/phase-12/phase-12.md` を正本とする。
