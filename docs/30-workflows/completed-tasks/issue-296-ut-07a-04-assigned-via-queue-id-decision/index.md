# issue-296-ut-07a-04-assigned-via-queue-id-decision - タスク仕様書 index

[実装区分: ドキュメントのみ]

> **実装区分判定根拠**: 採用判断は「`member_tags.assigned_via_queue_id` 列を追加しない」ことを正本化する ADR 起票であり、コードは既にその判断を反映済み（07a 完了時点で `member_tags` は `tag_id / source / confidence / assigned_at / assigned_by` のみ、queue 追跡は `audit_log.target_type='tag_queue', target_id=queueId` で担保）。Phase 5-7 でコード変更は行わず grep 確認に置き換える。Phase 8 で `docs/00-getting-started-manual/specs/08-free-database.md` と `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` および新規 ADR `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` を作成・同期する。CONST_004 例外条件「対象タスクが純粋にドキュメント・調査・合意形成で完結し、コード変更なしで目的が達成できる」に該当し、CONST_005 の関数シグネチャ・テスト・実行コマンドは grep 検証コマンドに置き換える。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-07A-04 |
| タスク名 | member_tags.assigned_via_queue_id 採否 ADR 起票 |
| ディレクトリ | docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision |
| 親タスク | 07a parallel tag assignment queue resolve workflow（`docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/`） |
| 原典 | docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | documentation / NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #296（CLOSED / docs-only follow-up to formalize decision as ADR） |

## 目的

07a workflow（tag assignment queue resolve）完了時点で発生していた schema drift（仕様: `tag_code, assigned_via_queue_id` / 実装: `tag_id, source, assigned_by`）について、`member_tags.assigned_via_queue_id` 列を追加するか否かの判断を **ADR として正本化**する。

採用判断は「**列を追加しない**」。理由は (1) 現行 `audit_log` (`target_type='tag_queue', target_id=queueId`) で member_tags ↔ queue 追跡が SQL join で再構成可能、(2) 列追加すると migration / backfill / API schema / repository / test fixture / D1 row size / index 戦略まで広範に波及、(3) MVP 監査要件は audit_log で達成済み、(4) `source='admin_queue'` で queue 経由付与は識別可能、queueId 直引きが必要な業務 query が現時点で存在しない。

## スコープ

### 含む

- ADR 新規起票: `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md`
- `docs/00-getting-started-manual/specs/08-free-database.md` への「`member_tags` schema 確定理由」セクション追記
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` 同期（schema drift 解消の正本化）
- `.claude/skills/task-specification-creator/references/phase-12-spec.md` への docs-only grep / completed-task back-link ルール昇格
- 07a 親タスクの `outputs/phase-12/unassigned-task-detection.md` で未起票となっていた本件の closure 明示
- 再評価トリガ条件の文書化（監査画面要件 / audit retention 短縮 / D1 read 性能）

### 含まない

- `apps/api/migrations/*.sql` の変更（列追加しない方針のため migration 不要）
- `apps/api/src/db/repositories/memberTags.ts` 等の repository 変更
- `apps/api/src/workflows/tagQueueResolve.ts` の振る舞い変更
- `packages/shared/src/schemas/admin/*` の response schema 変更
- 07a 親タスクの再オープン
- D1 schema migration 全般

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md | 原典タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/index.md | 親タスク AC / schema drift 背景 |
| 必須 | apps/api/migrations/0002_admin_managed.sql | `member_tags` 現行 schema |
| 必須 | apps/api/src/workflows/tagQueueResolve.ts | audit_log への queue 追跡実装 |
| 必須 | apps/api/src/workflows/tagQueueRetryTick.ts | DLQ audit の `target_type='tag_queue'` 実装 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 schema 正本仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | DB 実装 SSOT |
| 参考 | CLAUDE.md | 「D1 への直接アクセスは apps/api に閉じる」「Google Form schema 外は admin-managed として分離」 |

## 受入条件 (AC)

- **AC-1**: `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` が ADR テンプレート（Context / Decision / Consequences / Alternatives / Re-evaluation triggers）に準拠して新規作成されている。
- **AC-2**: ADR の Decision セクションが「`member_tags.assigned_via_queue_id` 列を追加しない」を明示している。
- **AC-3**: ADR の Alternatives セクションが「列を追加する案」の波及範囲（migration / backfill / schema / repository / test）を列挙し、却下理由を記載している。
- **AC-4**: ADR の Re-evaluation triggers セクションが (a) 監査 UI 要件 (b) audit retention 短縮 (c) D1 read 性能 の 3 条件を明示している。
- **AC-5**: `docs/00-getting-started-manual/specs/08-free-database.md` に `member_tags` の schema 確定理由が追記され、ADR への相互参照リンクが張られている。
- **AC-6**: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` が同決定を反映している（drift なし）。
- **AC-7**: `rg "assigned_via_queue_id" apps/` の出力が 0 件であることが Phase 5 evidence として記録されている。
- **AC-8**: `rg "targetType.*tag_queue|target_type.*tag_queue" apps/api/src/` と repository/type grep のヒット件数が記録され、resolve / reject / DLQ の queue 追跡が audit_log で完結していることが確認されている。
- **AC-9**: 07a 親 `outputs/phase-12/unassigned-task-detection.md` 行 10 の UT-07A-04 が本 ADR で closure されたことが Phase 8 で相互参照されている。
- **AC-10**: `task-specification-creator` の docs-only grep / completed-task back-link ルールが同一 cycle で owning reference へ昇格されている。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | スコープ・前提・既存実装確認 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計判断（採用案決定 + 代替案評価） | phase-02.md | completed | outputs/phase-02/decision-rationale.md |
| 3 | ADR 草案 | phase-03.md | completed | outputs/phase-03/adr-draft.md |
| 4 | 影響範囲分析（列追加した場合の波及） | phase-04.md | completed | outputs/phase-04/impact-analysis.md |
| 5 | コード変更不要の grep verification | phase-05.md | completed | outputs/phase-05/grep-verification.md |
| 6 | テストコード側 grep verification | phase-06.md | completed | outputs/phase-06/test-grep-verification.md |
| 7 | 差分ゼロ宣言 | phase-07.md | completed | outputs/phase-07/zero-diff-declaration.md |
| 8 | ドキュメント更新（ADR + spec + skill） | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | review readiness | phase-09.md | completed | outputs/phase-09/review-readiness.md |
| 10 | review feedback ループ方針 | phase-10.md | completed | outputs/phase-10/review-loop.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-verification-skip.md |
| 12 | 正本同期（7 必須成果物） | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR 作成・base=dev・Refs #296 | phase-13.md | blocked_pending_user_approval | outputs/phase-13/pr-summary.md |

## 不変条件

1. **コード変更ゼロ**: 本タスクは docs-only。`apps/`, `packages/` 配下のソースコード差分は許可しない。
2. **schema 不変**: `member_tags` の列構成は 07a 完了時点（`member_id / tag_id / source / confidence / assigned_at / assigned_by`）から変更しない。
3. **audit_log 経由の queue 追跡を正本**: `audit_log.target_type='tag_queue', target_id=queueId` を queue ↔ member_tags 追跡の正規経路とする。
4. **再評価余地の保全**: 列を追加しない判断は不可逆ではない。再評価トリガ条件を明文化する。
5. **CONST_004 docs-only**: コード変更を伴わないため CONST_005 の関数シグネチャ・テスト・実行コマンドは grep 検証コマンドに置き換える。
6. **CONST_007 単一 PR 完結**: Phase 1〜12 を本サイクル内で完了させ、Phase 13 の commit / push / PR は user-gated。
7. **Refs only**: GitHub Issue #296 は既に CLOSED のため、PR では `Refs #296` で扱い `Closes` は使わない。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| 後日「やはり列が必要」となり migration コストが膨らむ | Re-evaluation triggers を ADR に明示。条件発生時に新規 ADR で superseding して migrate する手順を docs 化 |
| audit_log retention 短縮で queue 追跡が失われる | retention 短縮の決定時に本 ADR を再評価対象として明示。skill reference にも記載 |
| skill SSOT と spec のどちらかが drift | Phase 8 で両方同時更新。Phase 12 で changelog fragment に相互参照 |
| 07a 親 closure と本 ADR の整合性 | Phase 8 で 07a `unassigned-task-detection.md` 行 10 への back-link を追加 |

## Phase マップ

```
phase-01 (前提確認)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (判断) ─→ phase-03 (ADR草案) ─→ phase-04 (影響範囲)
       │
       ▼
phase-05〜07 (grep verification / 差分ゼロ宣言)
       │
       ▼
phase-08 (docs 更新: ADR + spec + skill)
       │
       ▼
phase-09〜12 (review / evidence / 正本同期)
       │
       ▼
phase-13 (PR / Refs #296 / user-gated)
```

## 注意点

- GitHub Issue #296 は既に CLOSED。本仕様書は ADR 未起票という残作業を docs-only として正本化する。
- コード変更を行わないため、CI gate のうち typecheck / lint は通常通り通過する想定。`verify-design-tokens` 等の UI gate は対象外。
- Phase 13 の commit / push / PR は user 明示承認後にのみ実行する。
