# オーケストレーション / リソース導線 / ベストプラクティス

> **役割**: 本ファイルは workflow 観点の導線ハブ + ベストプラクティス集約のインデックスである。`resource-map.md` 形式（機械的リソースマップ）を持たない skill では本ファイルが代行し、双方が存在する skill では本ファイルが workflow 観点を担う棲み分けとする。

## リソース導線

### core workflow

- [resource-map.md](resource-map.md)
- [create-workflow.md](create-workflow.md)
- [execute-workflow.md](execute-workflow.md)
- [commands.md](commands.md)
- [quality-standards.md](quality-standards.md)
- [coverage-standards.md](coverage-standards.md)
- [review-gate-criteria.md](review-gate-criteria.md)
- [artifact-naming-conventions.md](artifact-naming-conventions.md)
- [evidence-sync-rules.md](evidence-sync-rules.md)
- [self-improvement-cycle.md](self-improvement-cycle.md)

### phase templates

- [phase-templates.md](phase-templates.md)
- [phase-template-core.md](phase-template-core.md)
- [phase-template-execution.md](phase-template-execution.md)
- [phase-template-phase11.md](phase-template-phase11.md)
- [phase-template-phase12.md](phase-template-phase12.md)
- [phase-template-phase13.md](phase-template-phase13.md)

### Phase 11/12 guides

- [phase-11-12-guide.md](phase-11-12-guide.md)
- [phase-11-screenshot-guide.md](phase-11-screenshot-guide.md)
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md)
- [phase-12-documentation-guide.md](phase-12-documentation-guide.md)
- [phase12-checklist-definition.md](phase12-checklist-definition.md)
- [technical-documentation-guide.md](technical-documentation-guide.md)
- [screenshot-verification-procedure.md](screenshot-verification-procedure.md)
- [../assets/phase12-task-spec-compliance-template.md](../assets/phase12-task-spec-compliance-template.md)

### spec update

- [spec-update-workflow.md](spec-update-workflow.md)
- [spec-update-step1-completion.md](spec-update-step1-completion.md)
- [spec-update-step2-domain-sync.md](spec-update-step2-domain-sync.md)
- [spec-update-validation-matrix.md](spec-update-validation-matrix.md)

### pattern family

- [patterns.md](patterns.md)
- [patterns-workflow-generation.md](patterns-workflow-generation.md)
- [patterns-validation-and-audit.md](patterns-validation-and-audit.md)
- [patterns-phase12-sync.md](patterns-phase12-sync.md)

### logs and archives

- [../LOGS.md](../LOGS.md)
- [logs-archive-index.md](logs-archive-index.md)
- [logs-archive-2026-march.md](logs-archive-2026-march.md)
- [logs-archive-2026-feb.md](logs-archive-2026-feb.md)
- [logs-archive-legacy.md](logs-archive-legacy.md)
- [changelog-archive.md](changelog-archive.md)

## システム観点チェック

| 観点               | aiworkflow-requirements 側の参照先 |
| ------------------ | ---------------------------------- |
| セキュリティ       | `security-*.md`                    |
| UI/UX              | `ui-ux-*.md`                       |
| アーキテクチャ     | `architecture-*.md`                |
| API/IPC            | `api-*.md`                         |
| データ整合性       | `database-*.md`                    |
| エラーハンドリング | `error-handling.md`                |
| インターフェース   | `interfaces-*.md`                  |

Web/API task では Browser、Server (Workers)、外部インテグレーション（packages/integrations/）、Cloudflare バインディングの境界を都度明記する。詳細は [quality-standards.md](quality-standards.md) を参照。

## ベストプラクティス

### すべきこと

- 仕様、テスト、実装、検証、同期の順序を崩さない。
- `outputs/phase-N/` を phase ごとに実体化し、`artifacts.json` と同時更新する。
- SubAgent 相当の lane は 3 並列以下に抑え、validation lane は直列で締める。
- detail を増やしたくなったら `references/` へ逃がし、`SKILL.md` は入口に保つ。
- Phase 12 は `implementation-guide`、`system-spec-update-summary`、`documentation-changelog`、`unassigned-task-detection`、`skill-feedback-report` を必ず揃える。
- **[Feedback P0-09-U1-3]** 小規模タスク（Phase 1〜3 で設計が自明）の outputs 必須度は規模（小/中/大）で tier 分けを検討する。ドキュメント作成コストが実装コストを上回るリスクを Phase 1 スコープ固定時に評価する。

### 避けるべきこと

- `.agents` 側だけ先に更新して canonical root を残すこと。
- `outputs/` を後回しにして phase 完了だけ先に付けること。
- `current` と `baseline` の監査結果を混ぜること。
- UI task で screenshot を自動テスト代替として扱うこと。
- user の明示承認なしに commit や PR を作ること。

詳細な履歴と usage log は [../LOGS.md](../LOGS.md)、[../SKILL-changelog.md](../SKILL-changelog.md)、[logs-archive-index.md](logs-archive-index.md) を参照。
