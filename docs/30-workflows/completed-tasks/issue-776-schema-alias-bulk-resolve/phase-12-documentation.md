# Phase 12: Documentation / Implementation Guide

## メタ情報
- workflow: issue-776-schema-alias-bulk-resolve

## 目的
本タスクの実装ガイドを Phase 12 canonical 9 headings に従って `outputs/phase-12/implementation-guide.md` として整備し、関連 spec / unassigned-task 文書を更新する。

## 中学生レベル概念説明

「diff を 1 件ずつ片付けるのではなく、まとめてチェックを入れて 1 つのまとめ画面で全部直す」UI を追加する。30 個の宿題を 1 つずつ提出するのではなく、まとめて提出箱に入れる、というイメージ。提出後に「これだけは名前のミスで戻ってきたよ」と分かるよう、失敗した分だけ残してもう一度直せるようにしておく。

## 変更ファイル要約

| 種別 | パス |
| --- | --- |
| 新規 | `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` |
| 新規 | `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts` |
| 編集 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` |
| 編集 | `apps/web/src/lib/admin/api.ts`（`postSchemaAliasBulk` 追加） |
| 新規 | `apps/web/src/components/admin/__tests__/SchemaDiffBulkResolveModal.component.spec.tsx` |
| 新規 | `apps/web/src/components/admin/hooks/__tests__/useSchemaDiffBulkSelection.spec.ts` |
| 編集 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` |
| 編集 | `apps/web/src/lib/admin/__tests__/api.spec.ts` |

API 側は無変更。

## 仕様書更新

- `docs/00-getting-started-manual/specs/11-admin-management.md`: schema diff resolve 章に「bulk resolve」セクションを追記
  - UI 操作フロー / partial failure UX / retryable continuation / 上限 50 件
  - 既存 single-resolve との関係
- `docs/00-getting-started-manual/specs/01-api-schema.md`: bulk endpoint は **新設しない** ことを明示（client-side fan-out 採用の理由）
- `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-12/unassigned-task-detection.md`: §3 「alias bulk resolve」を `consumed (Issue #776 / workflow issue-776-schema-alias-bulk-resolve)` に更新

## strict 7 files（Phase 12 canonical）

`outputs/phase-12/` 配下:

1. `main.md` — Phase 12 entry
2. `implementation-guide.md` — 本ガイド本体（PR description にも転記）
3. `documentation-changelog.md` — 仕様書更新の差分一覧
4. `system-spec-update-summary.md` — `specs/11`, `specs/01` 更新サマリ
5. `unassigned-task-detection.md` — 後続候補（rollback / history / notification は既に分離済）
6. `phase12-task-spec-compliance-check.md` — 本ワークフロー仕様準拠チェック
7. `skill-feedback-report.md` — skill 改善示唆

## 完了条件
- [ ] strict 7 files が配置
- [ ] `specs/11` / `specs/01` / parent `unassigned-task-detection.md` が更新
- [ ] `verify:phase12-compliance` gate green
