# Lessons Learned: Issue #720 CF Audit Monitor Environment Protection Fix

## L-720-001: Read-only monitor jobs must not inherit deploy environment protection

`cf-audit-log-monitor.yml` は production resource を read-only に観測し、issue 起票と Slack/mail 通知だけを行うジョブだが、`environment: production` を付けていたため production deployment environment の branch policy (`main` only) に従い、`dev` の scheduled run / `workflow_dispatch` が 30 日以上 block され続けて hourly snapshot が完全停止していた。

**結論**: GitHub Actions の `environment:` は deploy 系 (apply / rollback / schema mutation) のみに付与する。read-only monitor / notification-only ジョブは付与しない。

**再発防止**: `task-specification-creator` の Phase 06 design check に environment 判断 gate を追加 (`references/phase12-skill-feedback-promotion.md` Read-only monitor section に正本化済)。`aiworkflow-requirements/references/observability-monitoring.md` §11.3 に monitor vs deploy credentials 分離原則を明記。

## L-720-002: Alternative comparison cost — `environment:` 削除 1 行が正解にたどり着くまで

採用方針 (案 B': `environment:` 削除 + repo-level secret/variable mirror) を選定するまでに、次の代替案を破棄した:

| 案 | 破棄理由 |
| --- | --- |
| A: 新 environment `monitor-readonly` を作成し branch policy を緩める | 環境管理面増加・命名コスト・将来の責務逸脱リスク |
| B: production env の branch policy を緩める | deploy 系の保護を弱体化、blast radius 拡大で却下 |
| C: cron 自体を削除し manual 運用に変更 | 168h 集約前提の hourly snapshot 仕様を満たせない |
| **B': `environment:` 削除 + repo-level mirror** | コード差分最小 (1 行)、deploy 経路保護不変、管理最小 |

**結論**: 「最高品質かつ管理最小」を選定基準として明示すると、選択肢比較が高速化する。

**再発防止**: タスク仕様書 Phase 02 に代替案比較表テンプレ (`案 / 評価軸 / 結論`) を残し、後続が同種判断を再現できるようにする。

## L-720-003: Repository-level secret mirror は widened access boundary を伴う trade-off

production env scope の secret を repository-level に複製すると、`environment:` を持たないすべての workflow から参照可能になり、アクセス境界が広がる。今回は read-only / notification-only credentials に限定したため許容したが、deploy/rotate 系の credentials を repo-level に複製してはならない。

**結論**: repo-level secret mirror は (a) read-only または notification-only、(b) widened access boundary を documentation に明示、の 2 条件を同時に満たした場合のみ許可。

**再発防止**: `aiworkflow-requirements/references/observability-monitoring.md` §11.3 に「repo-level mirror 許容条件」を明文化済。runbook (`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`) にも environment 分離 ADR として追記済。

## L-720-004: CLOSED issue への phase-12 fold-state sync

Issue #720 は実装完了前に GitHub 側で CLOSED 済 (2026-05-16T13:02:38Z) になっていたため、Phase 12 で `unassigned-task-detection.md` に「CLOSED issue への状態同期方針」を明記し、source unassigned-task を `completed-tasks/` に `consumed_via_issue_720_followup_spec` ステータスで移送する fold-state sync 規約 (`task-specification-creator` v2026.05.14-issue638) に従った。

**結論**: GitHub issue が CLOSED で本タスクが未 push の状態は珍しくない。Phase 12 で必ず fold-state sync 方針を unassigned-task-detection.md に記録する。

**再発防止**: `task-specification-creator/SKILL.md` v2026.05.14 changelog 行で既に促進済。本 lessons は実例として参照される。

## L-720-005: `implemented_local_runtime_pending` 新ステータスの導入意義

local code 差分 (workflow yaml 1 行) は完了しているが、push / repo secret set / workflow_dispatch / 6h scheduled success / D'+0 declaration / prod env secret cleanup はすべて user-gated。この状態に `completed` を付けると runtime 未検証の品質を偽る一方、`spec_created` に戻すと local 成果を埋没させる。中間ステータス `implemented_local_runtime_pending` を採用し、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を compliance-check で明示する手順を取った。

**結論**: `local 完了 / runtime 未検証 / user-gated` の三条件が揃った場合は `implemented_local_runtime_pending` を採用し、placeholder evidence を `PENDING_USER_GATE` で配置する。

**再発防止**: `task-specification-creator/SKILL.md` の `v2026.05.09 IMPLEMENTED_LOCAL_RUNTIME_PENDING` 行で正本化済。Phase 11 placeholder evidence pattern も同 changelog 内の promoted feedback として記録済。
