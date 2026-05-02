# task-08a-canonical-workflow-tree-restore-001

## メタ情報

```yaml
issue_number: 346
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-08a-canonical-workflow-tree-restore-001 |
| タスク名 | 08a canonical workflow tree 復元または状態分類更新 |
| 分類 | documentation |
| 対象機能 | Workflow canonical path / aiworkflow-requirements |
| 優先度 | 高 |
| 見積もり規模 | 中規模 |
| ステータス | formalized / execution evidence captured / Phase 13 pending_user_approval |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

08a API contract / repository / authorization tests workflow の current canonical path `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` が、このワークツリーでは削除状態のまま実体不在になっている。09c production release runbook は上流 contract gate として 08a を参照するため、canonical workflow tree を復元または正本上の状態分類を更新する必要がある。

放置すると、09a / 09b / 09c の上流 AC 確認が broken link になり、production release gate の根拠が辿れなくなる。

## 2. 何を達成するか（What）

08a canonical workflow tree を復元するか、completed-tasks / archived / stale-current のどれが正しい状態かを aiworkflow-requirements 正本へ反映し、09c からの参照を壊れない状態にする。

## 3. どのように実行するか（How）

`legacy-ordinal-family-register.md`、`resource-map.md`、`task-workflow-active.md`、09a/09b/09c の参照を同一 wave で照合する。単に削除を確定せず、実体復元、移動先登録、stale-current 分類のいずれかを明示する。

## 4. 実行手順

1. `git status --short` と `git diff --name-status` で 08a の削除状態を確認する。
2. `docs/30-workflows/completed-tasks` 配下に 08a の移動先があるか確認する。
3. aiworkflow-requirements の resource-map / task-workflow-active / legacy register の 08a 記述を照合する。
4. 復元または状態分類更新の方針を決める。
5. 09a / 09b / 09c からの 08a 参照が broken link にならないよう同期する。

## 5. 完了条件チェックリスト

- [x] `test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/index.md` が成功する、または別 canonical path / archived state が正本化されている
- [x] `resource-map.md` と `legacy-ordinal-family-register.md` の 08a 状態が一致している
- [x] 09c からの 08a 参照が broken link にならない（09a / 09b は正本 current path に委譲）
- [x] 必要な unassigned-task の検出元パスが同期されている

## 6. 検証方法

```bash
test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/index.md || rg -n "08a-parallel-api-contract-repository-and-authorization-tests|08a.*stale|08a.*completed" .claude/skills/aiworkflow-requirements docs/30-workflows
rg -n "08a-parallel-api-contract-repository-and-authorization-tests" docs/30-workflows/02-application-implementation docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification .claude/skills/aiworkflow-requirements
```

期待: 08a の実体または状態分類が一意に辿れ、参照先が壊れていない。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 09c Phase 10 の上流 contract gate が実体ファイルへ辿れない | 08a canonical tree を復元するか、正本上の current path / stale path を再分類する |
| 09a / 09b / 09c の上流 AC 確認が broken link になる | 08a artifact inventory と workflow root の整合を再検証する |
| 08a follow-up task が存在しない workflow path を参照し続ける | unassigned-task 内の 08a 参照も同時に更新する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-10.md`
- `.claude/skills/aiworkflow-requirements/references/legacy-ordinal-family-register.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 9. 備考

このタスクは 09c の production 実行を進める前の参照整合タスクであり、08a の test 実装を拡張するタスクではない。

## Formalization Status

- Formalized on 2026-05-02 as `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/`.
- Execution evidence was captured in `docs/30-workflows/issue-346-08a-canonical-workflow-tree-restore/outputs/phase-11/`; Phase 13 remains pending user approval.
- Issue #346 was already closed at specification time; this formalization keeps Phase 13 as `pending_user_approval` and uses `Refs #346`, not `Closes #346`.

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-10.md`
- 症状: 09c final review path validation で、08a current canonical path が削除状態なのに上流 contract gate として参照されていた
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- 08a workflow tree の復元または状態分類更新
- aiworkflow-requirements の 08a 参照同期
- 09a / 09b / 09c の broken link 解消

### 含まない

- 08a test suite の新規実装
- production deploy 実行
