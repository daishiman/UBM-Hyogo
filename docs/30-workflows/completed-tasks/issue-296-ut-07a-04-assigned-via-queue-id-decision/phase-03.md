# Phase 3: ADR 草案

## 目的

Phase 2 で確定した判断（`member_tags.assigned_via_queue_id` 列を追加しない）を、`docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` として ADR テンプレート（Context / Decision / Consequences / Alternatives / Re-evaluation triggers）に整形した草案を作成する。Phase 8 で正本コミットされる。

## 入力

- Phase 2 成果物 `outputs/phase-02/decision-rationale.md`
- 既存 ADR（`docs/decisions/` 配下があれば書式踏襲のため参照）
- 原典 task spec

## 作業手順

1. `docs/decisions/` ディレクトリの有無を確認し、既存 ADR があれば書式・連番を踏襲する。連番未確定の場合は `0002-` を仮採番（Phase 8 で確定）。
2. 以下のセクションを持つ ADR 草案を `outputs/phase-03/adr-draft.md` に作成する:
   - **Status**: Accepted
   - **Context**:
     - 07a workflow で発生した schema drift（仕様: `tag_code, assigned_via_queue_id` / 実装: `tag_id, source, assigned_by`）
     - 07a closure 時点で UT-07A-04 として未起票扱いだった経緯
     - Google Form schema 外の admin-managed data 分離原則
   - **Decision**:
     - `member_tags.assigned_via_queue_id` 列を追加しない
     - queue ↔ member_tags の追跡は `audit_log (target_type='tag_queue', target_id=queueId, action IN ('admin.tag.queue_resolved','admin.tag.queue_rejected','admin.tag.queue_dlq_moved'))` で代替
     - `source='admin_queue'` で queue 経由付与を識別する既存運用を継続
   - **Consequences**:
     - 利点: migration 不要 / API schema 不変 / repository 不変 / test fixture 不変 / D1 row size 増えない
     - 欠点: queue → member_tags の直接 FK が無いため SQL join が 2 段必要（許容: MVP は audit join で OK）
     - 監査要件: 既存 audit_log で十分（保持・物理削除ポリシー変更時は再評価）
   - **Alternatives considered**:
     - 案 A: 列追加 → 却下理由（migration / backfill / schema / repository / test の同時改修、既存行に queueId backfill 不能、列追加後に削除する方が高コスト）
   - **Re-evaluation triggers**:
     - (a) 監査 UI で「特定 queue から確定したタグ一覧」を 1 クエリで表示する要件発生
     - (b) audit_log の保持期間短縮または物理削除方針により queue 追跡に必要な履歴が保持できなくなる
     - (c) D1 read で audit join 性能問題が顕在化
   - **References**:
     - `docs/30-workflows/unassigned-task/UT-07A-04-member-tags-assigned-via-queue-id-decision.md`
     - `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/`
     - GitHub Issue #296
3. ADR 草案の本文を 80-200 行に収め、各セクションを過不足なく記述する。

## 出力成果物

- `outputs/phase-03/adr-draft.md`（Phase 8 で `docs/decisions/0002-...` として正式 commit される草案）

## 検証コマンド

```bash
# 既存 ADR 連番確認
ls -1 docs/decisions/ 2>/dev/null

# ADR 必須セクションが揃っているか
rg -n "^## (Status|Context|Decision|Consequences|Alternatives|Re-evaluation triggers|References)" \
  docs/30-workflows/issue-296-ut-07a-04-assigned-via-queue-id-decision/outputs/phase-03/adr-draft.md
```

## DoD

- [ ] ADR 7 セクション（Status, Context, Decision, Consequences, Alternatives, Re-evaluation triggers, References）が揃った
- [ ] Decision セクションで「列を追加しない」を明示した
- [ ] Alternatives セクションで案 A の却下理由を列挙した
- [ ] Re-evaluation triggers 3 件を明示した
- [ ] References に原典 / 07a 親 / Issue #296 を含めた
- [ ] `outputs/phase-03/adr-draft.md` を作成した
