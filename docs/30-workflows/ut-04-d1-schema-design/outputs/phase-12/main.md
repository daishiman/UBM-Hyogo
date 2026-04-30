# Phase 12 成果物 — index / 7 成果物ナビ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 12 / 13 — ドキュメント更新 |
| 作成日 | 2026-04-29 |
| visualEvidence | NON_VISUAL |
| docsOnly | true（spec PR 段階・実 DDL 非混入） |
| workflow_state | spec_created（completed への昇格は実装 PR 後の別 wave） |
| user_approval_required | false |

## 必須 7 成果物ナビ

| # | 種別 | ファイル | 内容 |
| --- | --- | --- | --- |
| 1 | index | [main.md](./main.md) | 本ファイル / Phase 12 ナビ |
| 2 | ガイド | [implementation-guide.md](./implementation-guide.md) | Part 1（中学生・例え話 4 つ） + Part 2（技術者向け DDL/index/migration/cf.sh） |
| 3 | サマリー | [system-spec-update-summary.md](./system-spec-update-summary.md) | Step 1-A / 1-B / 1-C + Step 2 (N/A) |
| 4 | 履歴 | [documentation-changelog.md](./documentation-changelog.md) | workflow-local sync / global skill sync の別ブロック記録 |
| 5 | 検出 | [unassigned-task-detection.md](./unassigned-task-detection.md) | Phase 10 MINOR formalize 含む（0 件でも出力） |
| 6 | FB | [skill-feedback-report.md](./skill-feedback-report.md) | task-specification-creator / aiworkflow-requirements / github-issue-manager |
| 7 | 検証 | [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md) | 必須 7 ファイル揃い PASS 判定 |

## Phase 11 からの引き渡し

- 既知制限 #1（production apply）→ UT-06 / UT-26 に register 済み
- 既知制限 #4（field-level 暗号化）/ #5（audit_logs retention）→ unassigned-task-detection に formalize
- schema 確定状態（DDL 仕様化完了）→ UT-09 mapper 実装の前提として接続

## Phase 13 への引き渡し

- documentation-changelog → PR description 草案の根拠
- phase12-task-spec-compliance-check の PASS → Phase 13 承認ゲート前提
- workflow_state = `spec_created` / docsOnly = `true` / `apps/api/migrations/` 非混入を PR body に明記
