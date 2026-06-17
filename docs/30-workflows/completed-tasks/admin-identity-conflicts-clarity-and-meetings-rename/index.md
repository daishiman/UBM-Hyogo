# admin-identity-conflicts-clarity-and-meetings-rename

`/admin/identity-conflicts`（会員の重複確認）と管理サイドバーの非エンジニア向け改善＋重複候補の staging 仮データ整備の実装仕様書。

- **実装区分**: 実装仕様書（コード変更を伴う / implemented_local_evidence_captured）
- **visual_category**: VISUAL（concern 1-3）＋ NON_VISUAL（concern 4 seed）
- **正本決定事項**: [shared-context.md](./shared-context.md)
- **ブランチ**: `feat/admin-identity-conflicts-clarity-and-meetings-rename`

## 4 concern

| # | 内容 | 区分 | 主対象 |
| --- | --- | --- | --- |
| 1 | サイドバー「開催日」→「開催・出席管理」 | VISUAL | `apps/web` shell-config |
| 2 | 重複候補ページの UI/UX を直感化（何ができるか明示） | VISUAL | `apps/web` page/Row/Guide |
| 3 | 「アイデンティティ」等の専門用語を非エンジニア向けに平易化 | VISUAL | `apps/web` 文言/glossary |
| 4 | 重複候補の staging 仮データ 5 組（＋会員アカウント） | NON_VISUAL | `apps/api` seed + `scripts` |

## Phase 一覧

| Phase | 出力 | status |
| --- | --- | --- |
| 1 要件定義 | [phase-1-requirements.md](./phase-1-requirements.md) | completed |
| 2 設計 | [phase-2-design.md](./phase-2-design.md) | completed |
| 3 設計レビュー | [phase-3-design-review.md](./phase-3-design-review.md) | completed |
| 4 テスト計画 | [phase-4-test-plan.md](./phase-4-test-plan.md) | completed |
| 5 実装手順 | [phase-5-implementation.md](./phase-5-implementation.md) | completed |
| 6 テスト追加 | [phase-6-test-additions.md](./phase-6-test-additions.md) | completed |
| 7 カバレッジ | [phase-7-coverage.md](./phase-7-coverage.md) | completed |
| 8 リファクタ | [phase-8-refactor.md](./phase-8-refactor.md) | completed |
| 9 QA | [phase-9-qa.md](./phase-9-qa.md) | completed |
| 10 最終レビュー | [phase-10-final-review.md](./phase-10-final-review.md) | completed |
| 11 手動テスト | [phase-11-manual-test.md](./phase-11-manual-test.md) | completed |
| 12 ドキュメント同期 | [phase-12-documentation.md](./phase-12-documentation.md) | completed |
| 13 PR作成 | [phase-13-pr.md](./phase-13-pr.md) | implemented_local_evidence_captured（user-gated） |

## Phase 12 成果物（strict 7）

- [outputs/phase-12/main.md](./outputs/phase-12/main.md)
- [outputs/phase-12/implementation-guide.md](./outputs/phase-12/implementation-guide.md)
- [outputs/phase-12/system-spec-update-summary.md](./outputs/phase-12/system-spec-update-summary.md)
- [outputs/phase-12/documentation-changelog.md](./outputs/phase-12/documentation-changelog.md)
- [outputs/phase-12/unassigned-task-detection.md](./outputs/phase-12/unassigned-task-detection.md)
- [outputs/phase-12/skill-feedback-report.md](./outputs/phase-12/skill-feedback-report.md)
- [outputs/phase-12/phase12-task-spec-compliance-check.md](./outputs/phase-12/phase12-task-spec-compliance-check.md)
