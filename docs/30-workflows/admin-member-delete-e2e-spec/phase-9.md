# Phase 9: ドキュメント整備

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 更新対象ドキュメント

| # | path | 更新内容 | 必須 |
|---|------|---------|------|
| 1 | `docs/30-workflows/admin-member-delete-e2e-spec/index.md` | 本 workflow の status を Phase 11 完了後に `implemented-local-runtime-pending` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` へ更新 | 必須 |
| 2 | `docs/30-workflows/admin-member-delete-e2e-spec/outputs/phase-12/documentation-changelog.md`（後述 Phase 12 で生成） | 本 spec 追加に伴う変更を記録 | 必須 |
| 3 | aiworkflow-requirements indexes / active guide | sub-task 2c の状態を同一 wave で同期 | 必須 |

## 2. 新規ドキュメント禁止

CLAUDE.md ガイドラインに従い、本タスクで以下を **新規作成しない**:

- README.md
- 別途の解説ドキュメント
- spec の README

## 3. spec 内コメントの最小化

| 許容コメント | 禁止コメント |
|------------|------------|
| `// TODO(stage-3): cascade preview API 未実装` | what コメント（コードを読めばわかるもの） |
| zod schema 由来の必須仕様への参照（line 番号） | プランニングコメント |

## 4. 不変条件の参照は CLAUDE.md に集約

spec ファイル内に不変条件の説明を書かない。CLAUDE.md「重要な不変条件」「不変条件（task-02..22 共通）」を正本として参照。
