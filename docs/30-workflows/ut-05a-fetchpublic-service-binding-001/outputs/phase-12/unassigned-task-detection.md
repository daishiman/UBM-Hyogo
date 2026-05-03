# Unassigned Task Detection — ut-05a-fetchpublic-service-binding-001

## Summary

spec_created 段階での未タスク検出。新規 follow-up タスクの起票判定と、本タスク完了に伴う
既存 unassigned-task ファイルの `completed-tasks/` 移動可否を記録する。
**0 件であっても本ファイルは出力必須**。

## Decisions

| item | status | formalize decision | path | 根拠 |
| --- | --- | --- | --- | --- |
| 本タスクの正式化 | existing | already promoted to workflow root | `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/` | 既存 unassigned `task-05a-fetchpublic-service-binding-001.md` を本 workflow root へ promote 済み |
| `unassigned-task/task-05a-fetchpublic-service-binding-001.md` | existing | move-to-completed-tasks pending | `docs/30-workflows/unassigned-task/task-05a-fetchpublic-service-binding-001.md` | Phase 11 PASS かつ user 明示指示後に `completed-tasks/` 配下へ移動する。spec_created 段階では移動しない |
| 09c production deploy gate | existing | no new task | `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md` | 本タスクは 09c の前提ではないため、blocker 関係を新規起票しない |
| API 側ルーティング変更 | out-of-scope | no new task | — | 本タスクスコープ外（`apps/api` 側は無変更） |
| session-resolve service-binding 化 | existing-implementation | no new task | `apps/web/src/lib/auth.ts` `fetchSessionResolve` | 既に service-binding 経路で稼働済み（`transport: 'service-binding'` 確認済み） |
| DRY 抽出（service-binding helper 共通化） | conditional | Phase 10 で GO/NO-GO 判定 | Phase 10 outputs/phase-10/main.md | GO 判定の場合は本タスクサイクル内で完了させ別タスクへ deferred しない（CONST_007） |

## Result

- spec_created 段階で**新規起票が必要な未タスクは 0 件**
- 本タスク完了（Phase 11 PASS + Phase 13 PR merge）後に既存 unassigned ファイル 1 件を
  `completed-tasks/` 配下へ移動する判定を保留中（user 明示指示後に実行）

## 後続レビュー条件

Phase 11 で BLOCKED / FAIL が発生した場合は、原因に応じて以下の起票を再検討する:

- Cloudflare 認証復旧系（既存 `task-09a-cloudflare-auth-token-injection-recovery-001.md` が
  ある場合は再利用、無ければ新規起票判定）
- service-binding 経由でも 4xx/5xx になる場合の `apps/api` 側 route 調査タスク
