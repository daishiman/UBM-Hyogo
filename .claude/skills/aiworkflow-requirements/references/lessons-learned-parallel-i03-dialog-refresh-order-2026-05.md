# Lessons Learned: parallel-i03 dialog refresh order (2026-05)

> Workflow: `docs/30-workflows/completed-tasks/parallel-i03-dialog-refresh-order/`
> Source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md`
> Date: 2026-05-17
> State: `implemented_local_evidence_captured / NON_VISUAL`
> Related: [[lessons-learned-task-14-my-profile-and-requests-2026-05]] (dialog 純 UI 化 limitation の継続)

## L-PARALLEL-I03-001: dialog 内で `router.refresh()` を最先に発火する順序契約

`VisibilityRequestDialog` / `DeleteRequestDialog` は当初 `onSubmitted()` → `onClose()` の順で parent callback を呼び、`router.refresh()` は parent (`RequestActionPanel`) 側が `onSubmitted` 内で発火していた。この構造だと dialog が `onClose` で unmount された後に refresh が走るため、refresh 中の RSC fetch が dialog unmount + parent re-render と race して pending banner の点滅 / stale 表示が起きる。

- **Why:** `router.refresh()` は RSC tree の再フェッチを開始するが、その完了前に parent state が dialog unmount に伴って変動すると、新しい server state が古い client state に上書きされる window が生まれる。最先発火にすることで refresh の inflight 状態を parent が onSubmitted 内で観測可能にする。
- **How to apply:** 申請系 dialog の submit handler は `router.refresh()` → `onSubmitted()` → `onClose()` の順を invariant とする。success 分岐と 409 duplicate pending 分岐の両方に同じ順序で `router.refresh()` を入れる。spec で callOrder を assert する。

## L-PARALLEL-I03-002: 409 duplicate pending 分岐の `router.refresh()` 漏れは review gate でしか検知できない

happy path の success 分岐に `router.refresh()` を入れた時点で local 動作は安定するため、409 duplicate pending 分岐 (`response.status === 409`) で refresh を呼ばないバグは local では再現しない。Phase 11 evidence 1-B / 2-B の existence assertion と Phase 12 compliance review でようやく漏れが検出された。

- **Why:** 409 は「既に pending あり」を意味するため、server side の最新 pending 状態を UI に反映させる必要性は success と同じ。failure path だからといって refresh を省くと UI と server で pending 表示が乖離する。
- **How to apply:** mutation dialog では `response.ok` / `409` / その他 error の **全分岐で** `router.refresh()` の要否をレビューする。component spec に「409 分岐でも refresh が呼ばれる」regression assertion を必ず置く。Phase 11 evidence で全分岐の existence をリスト化してから Phase 12 に進む。

## L-PARALLEL-I03-003: `vi.hoisted` + `vi.mock("next/navigation")` で callOrder を spec 間共有する pattern

dialog submit の callOrder を assert するには `router.refresh` / `onSubmitted` / `onClose` を同一の callOrder array に push させる必要があるが、`vi.mock` は module を hoist するため top-level `let callOrder = []` を mock factory から参照すると ReferenceError になる。`vi.hoisted(() => ({ refresh: vi.fn(), callOrder: [] }))` で hoist-safe な共有 state を作るのが正解。

- **Why:** Vitest の `vi.mock` は import より先に評価されるため、factory が closure する変数は `vi.hoisted` で同じく hoist された値でなければ TDZ に入る。callOrder を hoist 経由で expose することで spec body からも安全に参照できる。
- **How to apply:** navigation / fetch / toast 系 module mock で callOrder を取りたい時は `vi.hoisted` を起点に mock object を組み立て、`vi.mock("next/navigation", () => ({ useRouter: () => navigationMock }))` の形で expose する。afterEach で `navigationMock.callOrder.length = 0` を明示的に reset する（`vi.restoreAllMocks()` では hoisted state は復元されない）。

## L-PARALLEL-I03-004: 親 spec で子 dialog を inline `vi.mock` 化して navigation mock 衝突を回避する

`RequestActionPanel.component.spec.tsx` で実 `VisibilityRequestDialog` / `DeleteRequestDialog` を render すると、各 dialog 内部の `useRouter()` 呼び出しが parent spec の navigation mock と衝突し、callOrder が二重 push される。解決策は親 spec 側で `vi.mock("./VisibilityRequestDialog", () => ({ default: ({ onSubmitted }) => <button onClick={onSubmitted}>submit</button> }))` の形で子 dialog を submit button stub に置換すること。

- **Why:** parent spec の責務は「parent が `router.refresh()` を呼ばないこと」「`onSubmitted` callback で適切な state 更新が走ること」の 2 点であり、子 dialog の submit logic は子 spec で別途検証済み。子 dialog を実体で render すると spec の責務境界が曖昧になり、navigation mock の二重発火という偽 failure を生む。
- **How to apply:** 子 component が外部副作用 (`router.refresh` / `fetchAuthed` / toast) を持つ場合、親 spec では子を inline mock の最小 stub に置換する。stub は親の callback (`onSubmitted` / `onClose`) を triggers するだけにする。実装変更で子の prop が増えた時に親 spec の stub も更新する規律を、spec head の TODO コメントで明示する。

## L-PARALLEL-I03-005: ワークフロー dir の `completed-tasks/` 自動移送と canonical path drift

Phase 12 compliance gate を通過したワークフローは task-specification-creator skill により `docs/30-workflows/<slug>/` から `docs/30-workflows/completed-tasks/<slug>/` へ自動移送される。検証指示書や artifact inventory が旧 path を直書きしていると、Phase 12 通過後に dead link 化する。

- **Why:** completed-tasks 移送は workflow lifecycle の終端 marker として canonical path を二系統に分けるが、external reference（unassigned-task の closure 記述、外部 PR の link、AI agent への指示）は移送タイミングを知らない。
- **How to apply:** ワークフロー dir を参照する external doc は `docs/30-workflows/{,completed-tasks/}<slug>/` の glob 表記、もしくは「active と completed の両方を探索する」運用文言にする。artifact inventory には canonical root path を 1 行で明記し、移送時に `references/workflow-<slug>-artifact-inventory.md` の root path を completed-tasks 側に更新する。
