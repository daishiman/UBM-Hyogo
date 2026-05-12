# Phase 9: ドキュメント整備

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 更新対象ドキュメント

| # | path | 更新内容 | 必須 |
|---|------|---------|------|
| 1 | `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/index.md` | Phase 11 PASS 後に `workflow_state` を `implemented_local_evidence_captured` へ更新 | 必須 |
| 2 | `docs/30-workflows/e2e-stage-2-2d-contract-stage-2/outputs/phase-12/documentation-changelog.md` | spec 追加 + route 3 ファイル微修正に伴う変更を記録 | 必須 |
| 3 | `docs/30-workflows/unassigned-task/e2e-stage-2-2d-contract-stage-2-001.md` | consumed trace に更新 | 必須 |
| 4 | aiworkflow-requirements indexes / artifact inventory | Phase 12 で同一 wave 同期 | 必須 |

## 2. 新規ドキュメント禁止

CLAUDE.md ガイドラインに従い、本タスクで以下を **新規作成しない**:

- README.md
- 別途の解説ドキュメント
- spec の README

## 3. spec 内コメントの最小化

| 許容コメント | 禁止コメント |
|------------|------------|
| `MergeIdentityResponseZ` の shape 正本（shared 経由）に対する 1 行ノート | what コメント（コードを読めばわかるもの） |
| 失敗系 it の `min(1)` / `max(500)` 由来の境界値ノート | プランニングコメント |

## 4. 不変条件の参照は CLAUDE.md に集約

spec ファイル内に不変条件の説明を書かない。CLAUDE.md「重要な不変条件」「UI prototype alignment / MVP recovery」を正本として参照。

## 5. route 3 ファイルの export 化に伴うドキュメント影響

| path | 影響 | 対応 |
|------|------|------|
| `apps/api/src/routes/admin/member-delete.ts` | `DeleteBodyZ` が public surface に昇格 | コメント追加不要（route 内部参照は不変） |
| `apps/api/src/routes/admin/requests.ts` | `ListQueryZ` が `ListRequestsQueryZ` 別名で public 化 | 同上 |
| `apps/api/src/routes/admin/audit.ts` | `QueryZ` が `ListAuditQueryZ` 別名で public 化 | 同上 |

`packages/shared` への昇格は今回目的に不要な no-op として扱う（Phase 12 unassigned-task-detection.md で判定を記録）。
