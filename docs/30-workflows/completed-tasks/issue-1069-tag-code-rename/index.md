# issue-1069 tag code rename — タスク仕様書（Phase 1-13）

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。
> 本ディレクトリは Issue #1069「Tag code rename requirements and implementation」の
> Phase 1-13 実装仕様書一式。本サイクルで local code/spec 実装と deterministic evidence 取得まで完了したスコープ（CONST_007）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | `TASK-ISSUE-1069-TAG-CODE-RENAME` |
| issue | [#1069](https://github.com/daishiman/UBM-Hyogo/issues/1069)（**CLOSED**・2026-06-03 外部クローズ・本仕様書では状態変更しない） |
| 親タスク | `issue-1035-tag-master-write-endpoints`（completed） |
| taskType | implementation |
| visualEvidence | NON_VISUAL（apps/api のみ・UI 変更なし） |
| implementation_mode | new |
| workflow_state | implemented_local_evidence_captured（local code/spec 実装・deterministic evidence 取得済み） |
| canonical_root | `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename` |

## 実装区分の判定根拠（CONST_004）

Issue #1069 の category は `要件`（requirements）だが、本タスクの目的「tag `code` の rename を**動作させる**」は
admin API・repository・audit・テストの**コード変更なしには達成できない**。したがって **docs-only ではなく実装仕様書**として作成する。
ADR（rename 可否の判断）はユーザー承認により「**rename を許可**」で確定済みのため、Phase 2 で ADR を比較する純粋な調査タスクではなく、
確定した方針に基づくコード実装仕様書とする。

## 根本問題と現行コード最適化（issue は古い前提を含む）

- **根本問題**: admin が tag を誤った `code` で作成しても修正できない（PATCH は label/category のみ）。唯一の回復策（新 code + 旧 code deactivate）は member_tags が無効タグを指し続けデータ衛生が悪化する。
- **issue の AC-3「member_tags 参照整合が壊れる（高リスク）」は現行スキーマでは杞憂**: `member_tags` は `PRIMARY KEY (member_id, tag_id)` で **tag_id 参照**（`apps/api/migrations/0002_admin_managed.sql:43-51`）。`code` は参照しないため rename は参照整合を壊さない。
- **親タスク issue-1035 の「code immutable」判断を supersede**: ユーザー承認 ADR により rename を許可へ改訂する。詳細は `artifacts.json` の `issue_optimization_note` / `supersedes`。

## スコープ

### 含む
- PATCH `/admin/tags/:tagId` の body 拡張（`code` / `expectedCode`）と repository `updateTagDefinition` の discriminated union 化
- UNIQUE 衝突 `tag_code_conflict`（409）/ optimistic 衝突 `tag_stale_conflict`（409）の分離
- 専用 audit action `admin.tag.code_renamed`（before/after に old/new code）
- focused D1 テスト追加・回帰テスト・正本 spec（不変条件 #13）改訂

### 含まない（理由付き）
- apps/web の admin tag master code 編集 UI（専用 CRUD UI ページが未整備）→ Phase 12 未タスク候補
- tag 物理削除 / reactivate（別タスク `task-issue-1035-followup-003`）
- member drawer inline-create UI（別タスク `task-issue-1035-followup-001`）
- D1 schema migration（optimistic は `expectedCode` CAS で実現・version 列不要）
- commit / push / PR / staging deploy / Issue 状態変更（user-gated）

## Phase 一覧

| Phase | 名称 | 仕様書 | 状態 |
| --- | --- | --- | --- |
| 1 | 要件定義 | [phase-1.md](outputs/phase-1/phase-1.md) | completed |
| 2 | 設計 | [phase-2.md](outputs/phase-2/phase-2.md) | completed |
| 3 | 設計レビュー | [phase-3.md](outputs/phase-3/phase-3.md) | completed |
| 4 | テスト作成 | [phase-4.md](outputs/phase-4/phase-4.md) | completed |
| 5 | 実装 | [phase-5.md](outputs/phase-5/phase-5.md) | completed |
| 6 | テスト拡充 | [phase-6.md](outputs/phase-6/phase-6.md) | completed |
| 7 | カバレッジ確認 | [phase-7.md](outputs/phase-7/phase-7.md) | completed |
| 8 | リファクタリング | [phase-8.md](outputs/phase-8/phase-8.md) | completed |
| 9 | 品質保証 | [phase-9.md](outputs/phase-9/phase-9.md) | completed |
| 10 | 最終レビュー | [phase-10.md](outputs/phase-10/phase-10.md) | completed |
| 11 | 手動テスト | [phase-11.md](outputs/phase-11/phase-11.md) | completed |
| 12 | ドキュメント同期 | [phase-12.md](outputs/phase-12/phase-12.md) | completed |
| 13 | commit-pr-release | [phase-13.md](outputs/phase-13/phase-13.md) | pending_user_approval |

> Phase 1-12 の status `completed` は local 実装・正本同期・deterministic evidence 取得まで完了したことを表す。commit / push / PR / staging deploy / Issue 状態変更は未実施で user-gated。

## 受け入れ基準（サマリ）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | code rename を許可する ADR が記録（immutable → mutable 改訂・issue-1035 supersede 明記） |
| AC-2 | uniqueness（`tag_code_conflict` 409）と optimistic（`tag_stale_conflict` 409）を別 error code で返す |
| AC-3 | rename 後も `member_tags` 参照整合が保たれる（tag_id 参照・regression test 証明） |
| AC-4 | audit log に old/new code が残る（`admin.tag.code_renamed`） |
| AC-5 | seed / static manifest / admin UI 表示に stale code が残らないことを grep / focused test で確認 |
| AC-6 | rename 許可に伴う運用注意（seed と code がずれ得る点）を spec 不変条件 #13 注記で明記 |

## 検証コマンド（実装後）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts \
  apps/api/src/routes/admin/members.tags.contract.spec.ts \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:static-manifest
```

## 参照

- `artifacts.json` / `outputs/artifacts.json`（gate metadata・parity byte-identical）
- 親タスク: `docs/30-workflows/completed-tasks/issue-1035-tag-master-write-endpoints/`
- 正本 spec: `docs/00-getting-started-manual/specs/01-api-schema.md`（不変条件 #13）
- 旧 unassigned spec: `docs/30-workflows/completed-tasks/task-issue-1035-followup-002-tag-code-rename-requirements.md`（本ディレクトリで formalize）
</content>
