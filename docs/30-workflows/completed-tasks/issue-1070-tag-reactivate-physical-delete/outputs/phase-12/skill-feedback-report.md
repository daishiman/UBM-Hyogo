# スキルフィードバックレポート — tag master reactivate + physical delete

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

> automation-30 close-out review で、不可逆 physical delete endpoint の 2-stage 境界と FK 不在時の reference guard を同種タスクで再利用すべき正本ルールと判定したため、`task-specification-creator` reference へ同サイクル反映した。

## テンプレート改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1070-001 | applied | **DB-level FOREIGN KEY 不在テーブルへの delete を仕様化するとき、参照整合は「アプリ層の `COUNT(*)` ガード」が唯一の防壁であることを Phase 2/3 で明示し、`ON DELETE` 依存の誤設計を防ぐチェック項目をテンプレ化する** | `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` §「物理削除 endpoint の 2-stage 実装境界」 | `apps/api/migrations/0002_admin_managed.sql`, `outputs/phase-2/phase-2.md` |
| FB-I1070-002 | applied | **不可逆な physical delete は `physical deletion 2-stage` として「endpoint コード + 参照ガード + audit + tests は実装可能（先送りしない）／production runtime mutation のみ user-gated（runbook + approval marker）」と分離表現する。artifacts `governance_mutation_user_gate` / `mutation_commands` / `user_approval_marker` + runbook に固定する** | `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` §「物理削除 endpoint の 2-stage 実装境界」 | `references/non-visual-irreversible-task-rules.md`, `outputs/phase-12/physical-delete-runbook.md` |

## ワークフロー改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1070-003 | candidate | **lifecycle write を「対称形ペア」で設計すると実現性が上がる（reactivate は deactivate の逆操作＝同一 row の `active` flip・UNIQUE 列非接触ゆえ conflict path 不要）。対称操作を足すときは既存操作のシグネチャ/no-op/audit 条件を反転テンプレとして再利用する** | `task-specification-creator` symmetric-lifecycle pattern | `outputs/phase-2/phase-2.md` §2.1.2 |
| FB-I1070-004 | candidate | **新パスが既存パスの prefix を共有するとき（`/tags/:tagId` vs `/tags/:tagId/physical`）、既存パスの regression test を必須化し Hono の静的セグメント優先解決を固定する。issue-1035 の `/tags/queue` regression と同型** | `task-specification-creator` route-prefix regression pattern | `outputs/phase-3/phase-3.md` §3.2, `apps/api/src/routes/admin/tags.contract.spec.ts` |

## ドキュメント改善

| ID | classification | 内容 | promotion target | evidence path |
| --- | --- | --- | --- | --- |
| FB-I1070-005 | no-op | logical（active=0 / code 占有継続）vs physical（row 削除 / code 解放）の運用差は `system-spec-update-summary.md` と正本 spec 同期内容で吸収済み。汎用テンプレへの昇格は不要 | なし | `outputs/phase-12/system-spec-update-summary.md` |

## 改善不要と判断した点

- NON_VISUAL（API only / `apps/web` 非接触）で Phase 11 screenshot を不要とし、focused D1 Vitest / typecheck / lint を一次証跡計画にする運用は適切に機能した。
- task-specification-creator の SKILL.md 本体への追記は行わず、詳細正本である `references/non-visual-irreversible-task-rules.md` に適用した。SKILL.md は既に本 reference を導線として持つため追加導線は不要。
- `AuditAction` が `RepoBrand<string>`（enum なし）で route literal union のみ拡張すれば足りる点は issue-1035 で既知。新規 promotion 不要。
