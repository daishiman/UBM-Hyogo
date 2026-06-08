# スキルフィードバックレポート — tag physical delete force-migration（参照付き tag の強制移行）

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> 本サイクルは **implemented_local_evidence_captured**。テンプレ / reference への実反映が必要なものは本サイクル内で同期する。本レポートは candidate / no-op / applied 判定を確定記録する。

## テンプレート改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1117-001 | candidate | **DB-FK 不在テーブルで「参照を別キーへ付け替えてから親を消す」強制移行を仕様化するとき、PK 衝突は `INSERT OR IGNORE`+`DELETE` の 2 ステップを単一 `c.db.batch` で原子実行し、移行件数は 移行前 source 参照数 で測ることをテンプレ化する（素朴な `UPDATE ... SET key=dest` は PK 衝突で部分移行を生む）** | `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` §「物理削除 endpoint の 2-stage 実装境界」（force-migration 派生として追記候補） | `outputs/phase-2/phase-2.md` §2.3, `apps/api/migrations/0002_admin_managed.sql` |
| FB-I1117-002 | candidate | **不可逆操作の「前段に安全な移行を積む」設計では、移行後に参照件数 `COUNT(*)===0` を再検証してから不可逆削除に進む防御段（`has_references`）を必ず挟むことを 2-stage 境界テンプレに含める。移行と削除を 1 経路に混ぜず、`migrateTo` 未指定時は既存拒否経路を不変保持して regression test で固定する** | `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` §「物理削除 endpoint の 2-stage 実装境界」 | `outputs/phase-2/phase-2.md` §2.1/2.4, `outputs/phase-3/phase-3.md` §3.2 |

## ワークフロー改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1117-003 | candidate | **親タスクの `unassigned-task-detection.md` で formalize 済みの未タスク（U-1 強制移行）を解消する followup を起票するとき、Phase 12 未タスク検出は「current 新規 0 件」と明記し、親の他 U（UI / DB-FK）は重複起票せず参照のみとする。`unassigned-task` source → followup → 親 U 参照のトレーサビリティを Phase 12 に固定する** | `task-specification-creator` followup-from-unassigned パターン | `outputs/phase-12/unassigned-task-detection.md`, 親 `issue-1070` `unassigned-task-detection.md` |
| FB-I1117-004 | candidate | **新パスを増やさず既存パスへ query 分岐（`?migrateTo`）を足して機能拡張するとき、query 未指定経路の既存挙動を regression test で固定し contract surface を最小化する。issue-1070 の `/tags/:tagId/physical` route-prefix regression と同型** | `task-specification-creator` route-query-branch regression パターン | `outputs/phase-2/phase-2.md` §2.4/2.7, `outputs/phase-11/manual-test-result.md` TC-AC7-1/2 |

## ドキュメント改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1117-005 | no-op | 強制移行 runbook の「逆移行ロールバック（dest→src 戻し）」は AC-6 専用の運用手順であり、親 issue-1070 の `physical-delete-runbook.md` を force-migration 向けに拡張したもの。`force-migration-runbook.md` に固定済みで汎用テンプレへの昇格は不要 | なし | `outputs/phase-12/force-migration-runbook.md` |

## 改善不要と判断した点

- NON_VISUAL（API only / `apps/web` 非接触）で Phase 11 screenshot を不要とし、focused D1 Vitest / typecheck / lint を一次証跡計画にする運用は親 issue-1070 で確立済みで適切に機能した。新規 promotion 不要。
- `AuditAction` が `RepoBrand<string>`（enum なし）で route literal union のみ拡張すれば足りる点は issue-1035 / issue-1070 で既知。新規 promotion 不要。
- task-specification-creator の SKILL.md 本体への追記は行わず、詳細正本である `references/non-visual-irreversible-task-rules.md` を導線とする方針は親 issue-1070 で確立済み。SKILL.md 追加導線は不要。
- FB-I1117 のうち正本仕様・workflow ledger に関わる項目は本サイクルで applied。テンプレ一般化は既存 task-specification-creator の CONST_004/005 ルールで充足するため no-op。
