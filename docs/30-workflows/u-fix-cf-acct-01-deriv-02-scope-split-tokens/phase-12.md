# Phase 12: ドキュメント更新

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-12/phase-12.md` |

## 目的
Phase 12 の 6 必須タスク（実装ガイド / システム仕様書更新 / 更新履歴 / 未タスク検出 / skill feedback / コンプライアンスチェック）と Token rotation runbook を作成。

## 参照資料
- `outputs/phase-12/phase-12.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`

## 成果物（Phase 12 必須 7 ファイル + runbook）
- `outputs/phase-12/implementation-guide.md`（Part 1 中学生レベル + Part 2 技術者レベル）
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/runbook-token-rotation.md`（Token 単位 rotation/rollback）

## 完了条件
- 上記7ファイル + runbook が実体ファイルで存在し、`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` への canonical absolute path 反映行が記録されている。

## 実行タスク
- [ ] strict 7 files、runbook、same-wave aiworkflow sync、source unassigned consumed trace を作成する。

## 統合テスト連携
- Phase 12 は docs/evidence gate。`validate-phase-output` と Phase 9 evidence を参照する。
