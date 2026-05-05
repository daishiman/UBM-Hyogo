# 04c-followup-001-email-conflict-merge-api-and-ui

[実装区分: docs-only / canonical alias]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04c-followup-001-email-conflict-merge-api-and-ui |
| 状態 | completed_alias |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #432 |
| 正本 workflow | `docs/30-workflows/completed-tasks/issue-194-03b-followup-001-email-conflict-identity-merge/` |
| 正本 Issue | #194 |
| 更新日 | 2026-05-04 |

## Canonical Decision

本 task は新しい実装 workflow としては扱わない。`/admin/identity-conflicts` API、admin UI、D1 migration、shared schema、Phase 12 strict evidence は `issue-194-03b-followup-001-email-conflict-identity-merge` で既に実装仕様として同期済みである。

この root は Issue #432 から来た 04c follow-up 名称を残す alias / trace とし、二重の implementation workflow を作らない。重複 workflow を維持すると `identity_dismissals` / `identity_conflict_dismissals`、`admin_audit_log` / `identity_merge_audit`、`sync_jobs.lock_token` / `member_identities.merge_lock_token` などの drift が再発するため、正本は issue-194 に一本化する。

## Canonical Contract

| 項目 | 正本 |
| --- | --- |
| API | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/merge`, `POST /admin/identity-conflicts/:id/dismiss` |
| D1 tables | `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |
| UI | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `IdentityConflictRow` |
| shared schema | `packages/shared/src/schemas/identity-conflict.ts` |
| evidence | issue-194 Phase 9-12 outputs and Phase 11 runtime pending boundary |

## 30種思考法レビューの統合結果

| 集約カテゴリ | 結論 | 反映 |
| --- | --- | --- |
| schema / audit | 監査ログ名の分岐が最大の矛盾 | issue-194 の `identity_merge_audit` / `identity_aliases` / `identity_conflict_dismissals` を正本化 |
| lock | lock source の二重化は避ける | 本 alias では新 lock 仕様を追加しない |
| merge semantics | raw response 移動や hard delete を避ける | canonical alias による統合を正本化 |
| phase metadata | pending implementation ではなく alias completion | artifacts / outputs を completed_alias に同期 |
| evidence | screenshot 未取得を false PASS にしない | NON_VISUAL alias evidence と runtime pending 境界を分離 |

## Phase 一覧

| Phase | 名称 | 状態 | 出力 |
| --- | --- | --- | --- |
| 1 | 要件定義 | completed | `outputs/phase-01/main.md` |
| 2 | 設計 | completed | `outputs/phase-02/main.md` |
| 3 | 設計レビュー | completed | `outputs/phase-03/main.md` |
| 4 | テスト戦略 | completed | `outputs/phase-04/main.md` |
| 5 | 実装ランブック | completed | `outputs/phase-05/main.md` |
| 6 | 異常系検証 | completed | `outputs/phase-06/main.md` |
| 7 | AC マトリクス | completed | `outputs/phase-07/main.md` |
| 8 | 設計確定 | completed | `outputs/phase-08/main.md` |
| 9 | 品質保証 | completed | `outputs/phase-09/main.md` |
| 10 | 最終レビュー | completed | `outputs/phase-10/main.md` |
| 11 | NON_VISUAL evidence | completed | `outputs/phase-11/main.md` |
| 12 | ドキュメント更新 | completed | strict 7 files |
| 13 | PR 作成 | blocked_until_user_approval | `outputs/phase-13/main.md` |

## Phase Links

- [Phase 1](phase-01.md)
- [Phase 2](phase-02.md)
- [Phase 3](phase-03.md)
- [Phase 4](phase-04.md)
- [Phase 5](phase-05.md)
- [Phase 6](phase-06.md)
- [Phase 7](phase-07.md)
- [Phase 8](phase-08.md)
- [Phase 9](phase-09.md)
- [Phase 10](phase-10.md)
- [Phase 11](phase-11.md)
- [Phase 12](phase-12.md)
- [Phase 13](phase-13.md)

## 完了条件

- 本 root が implementation 正本ではなく alias であることが `index.md` / `artifacts.json` / `outputs/artifacts.json` で一致している。
- Phase 12 strict 7 files が存在し、Task 6 compliance check に 4 条件と 30種思考法の結論が残っている。
- commit / push / PR 作成は実行していない。
