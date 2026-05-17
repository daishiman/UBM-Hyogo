# Phase 12 implementation-guide - UT-07A-04

> docs-only タスク。コード変更なし。「実装」は ADR / spec / skill の docs 編集のみ。

## Part 1: 中学生向けの説明

学校の係活動で、誰がどの札を配ったかを後から確認したい場面を考える。札そのものに「どの係の仕事で配ったか」を毎回書き込む方法もあるが、すでに先生の記録ノートに「いつ、誰が、どの係の仕事として配ったか」が残っているなら、札の形を変えなくても後から確認できる。

今回の判断も同じで、`member_tags` という表に新しい欄を足さず、すでにある記録ノートにあたる `audit_log` で追跡する。新しい欄を足すと、古い札の書き直しや確認テストが必要になり、作業が大きくなる。今必要な確認は既存の記録で足りるため、まずは小さく保つ。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| `member_tags` | 会員についた札の一覧 |
| `assigned_via_queue_id` | どの確認待ち箱から来たかを書く欄 |
| `audit_log` | 先生の記録ノート |
| migration | 表の形を変える工事 |
| ADR | あとで迷わないための決定メモ |

## Part 2: 技術者向けの実装ガイド

### 実装区分

ドキュメントのみ。`apps/` / `packages/` 配下に差分を生成しない。実行時コードは現行の `member_tags` schema と `audit_log.target_type='tag_queue'` 追跡経路を維持する。

### 実装ステップ（docs 編集）

1. `docs/decisions/0002-member-tags-assigned-via-queue-id-decision.md` を新規作成（ADR テンプレート 7 セクション）
2. `docs/00-getting-started-manual/specs/08-free-database.md` の `member_tags` セクションに schema 確定理由を追記し ADR 0002 へリンク
3. `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` を同期
4. `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/outputs/phase-12/unassigned-task-detection.md` 行 10 に「ADR 0002 で closure」相当の補足追記
5. changelog fragment 追加

### 関数シグネチャ（CONST_005 docs-only 変形）

該当なし。grep 検証コマンドに置き換え:

```bash
rg "assigned_via_queue_id" apps/ packages/                    # 期待: 0 件
rg "targetType.*tag_queue|target_type.*tag_queue" apps/api/src/ # 期待: 3 件（resolve/reject implementation 2 / contract 1）
rg '"tag_queue"' apps/api/src/repository/tagQueue.ts apps/api/src/repository/auditLog.ts # 期待: 2 件（DLQ bind / target type union）
rg "source.*admin_queue" apps/api/src/                        # 期待: ≥ 1 件
```

### API シグネチャ / 使用例

新規 API は追加しない。既存の `POST /admin/tags/queue/:queueId/resolve` が guarded update 成功後に `member_tags` を更新し、同じ queueId を `audit_log.target_id` に保存する。

```ts
type TagQueueTraceDecision = {
  addAssignedViaQueueIdColumn: false;
  traceSource: "audit_log";
  tagSource: "admin_queue";
};
```

### エラーハンドリングとエッジケース

`audit_log` retention が短縮された場合、過去 queue 追跡が失われるため ADR の再評価トリガに該当する。D1 read 性能で audit join が問題化した場合も、列追加または index 戦略を別 ADR で再評価する。既存 row には queueId backfill ができないため、列追加を後で採用する場合でも NULL 許容と履歴境界を明示する。

### 設定値 / 定数

| 項目 | 値 |
| --- | --- |
| 不採用列 | `member_tags.assigned_via_queue_id` |
| 追跡正本 | `audit_log.target_type='tag_queue'`, `audit_log.target_id=<queueId>` |
| queue 経由識別 | `member_tags.source='admin_queue'` |
| 再評価条件 | 監査 UI 要件 / retention 短縮 / audit join 性能問題 |

### 実行コマンド（CONST_005 docs-only 変形）

該当なし。検証コマンドのみ:

```bash
# 差分検証
git diff dev...HEAD --stat -- apps/ packages/                 # 期待: empty
git diff dev...HEAD --stat -- docs/ .claude/                  # 期待: 差分あり

# 品質検証（Phase 13 で実行）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### PR 作成情報

- base: `dev`
- title: `docs(ut-07a-04): ADR 0002 - member_tags.assigned_via_queue_id を追加しない決定を正本化 (Refs #296)`
- body: Phase 9 review-readiness.md / Phase 13 phase-13.md の HEREDOC テンプレートを使用
- Issue 連携: `Refs #296`（CLOSED 済のため `Closes` は使わない）

### 注意

- `git add` はファイル名指定で行う（`git add -A` 禁止）
- secret を含むファイルがないことを確認（本タスクで触れるファイルは公開可能な docs のみ）
