# Lessons Learned: parallel-02-state-sync-router-refresh

> Source workflow: `docs/30-workflows/completed-tasks/parallel-02-state-sync-router-refresh/`
> Implementation date: 2026-05-15
> Scope: Next.js App Router `/profile` の visibility/delete request dialog で `router.refresh()` 呼び出し位置を local 化し、`RequestPendingBanner` を mutation 直後に server snapshot 由来で表示する。

## 教訓

| ID | Lesson |
| --- | --- |
| L-P02-001 | Dialog の mutation success 後に `router.refresh()` / `onSubmitted` / `onClose` を呼ぶ場合、`onClose` を最後に固定しないと unmount 後に refresh が走り「React state update on unmounted component」warning が発生する。順序は spec で明文化し、test で `mock.invocationCallOrder` 比較で検証する。 |
| L-P02-002 | server state を正本とする mutation flow では、refresh 完了までの一時的ギャップを埋めるため parent 側に bridge state（例: `acceptedPending`）を持たせ、`useEffect` の dependency で server snapshot 到着時に自動破棄する。bridge は楽観的 UI ではなく「次の server snapshot まで」の寿命に限定する。 |
| L-P02-003 | Mutation 失敗系 (409 DUPLICATE_PENDING_REQUEST / 422 / network error) は refresh 経路が分岐する。409 は accepted response 相当に詰め替えて bridge state は更新するが refresh は不要、422 / 5xx は両方とも skip する、という contract を Phase 4 spec に明記する。 |
| L-P02-004 | 複数の side-effect callback を順序付きで呼ぶ component の test は `vi.hoisted` で router mock を事前定義し、`vi.fn().mock.invocationCallOrder` を直接比較する。`toHaveBeenCalledBefore` 系 matcher は順序の `<`/`<=` 区別ができないため不適合。 |
| L-P02-005 | `useRouter` を parent (`RequestActionPanel`) に置くと callback chain の起点が遠くなり、child dialog の unmount タイミングと refresh schedule の競合を制御しにくい。router 依存は呼び出し側 (dialog) ローカルへ局所化し、parent は domain callback (`onSubmitted(accepted)`) だけを公開する責務境界が保守的。 |

## 関連リソース

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md`
- Phase 12 成果物: `docs/30-workflows/completed-tasks/parallel-02-state-sync-router-refresh/outputs/phase-12/`
- 実装: `apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx`
- 検証 spec: 同 dir の `*.component.spec.tsx` + `apps/web/playwright/tests/profile-state-sync-router-refresh.spec.ts`
- 関連 reference: [arch-state-management-core.md](arch-state-management-core.md), [arch-state-management-reference.md](arch-state-management-reference.md)
