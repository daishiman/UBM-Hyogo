# Phase 6: テスト拡充

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`


## 目的

fail path / 回帰 guard / 補助ケースを追加する。

## 追加ケース

| ID | 対象 | ケース | expected |
| --- | --- | --- | --- |
| F-T1 | route POST | 存在しない member への付与 | 404 `member_not_found`（A-T5 の強化: member_status 行なしと members 行なしを区別） |
| F-T2 | route POST | members 在・member_status 行なし | 200（`is_deleted` default 0 扱い）で付与成功 |
| F-T3 | route DELETE | member 不在 | 404 `member_not_found`（DELETE でも member 検証） |
| F-T4 | route | 非 admin（requireAdmin 失敗） | 401/403（既存 middleware の回帰確認） |
| F-T5 | repository | `assigned_by` / `source='manual'` が persist | row の `source='manual'` / `assigned_by=actor` |
| F-T6 | web | fetch エラー（GET 失敗） | drawer に error 表示・pill 操作不可（クラッシュしない） |
| F-T7 | web | available 0 件 | empty 表示（pill なし）でクラッシュしない |
| F-T8 | 回帰 | `tags-queue.contract.spec.ts` | 既存 queue resolve が引き続き green |

## 回帰 guard

- detail endpoint の `tags` shape `{code,label,category,source}` を契約テストで固定（AC-6）。
- audit の no-op 非記録（A-T2 / A-T8）を回帰 guard として残す。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test -- MemberDrawer
```

## 実行タスク

- 本 Phase の記載内容を実装時の gate として使用する。

## 成果物

- F-T1〜F-T8 追加（全 PASS）

## 統合テスト連携

- 実装時は Phase 4-7 の focused tests と Phase 11 evidence ledger に接続する。

## 参照資料

- docs/30-workflows/completed-tasks/issue-982-drawer-tag-pill-editing/index.md
- .claude/skills/task-specification-creator/SKILL.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 完了条件

- fail path / 回帰 guard が網羅されている
- 既存 spec の green 維持
