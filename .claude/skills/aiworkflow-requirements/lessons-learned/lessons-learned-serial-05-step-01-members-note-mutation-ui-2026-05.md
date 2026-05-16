# Lessons Learned: serial-05-step-01 members-note mutation UI

対象 workflow: `docs/30-workflows/serial-05-step-01-members-note-mutation-ui/`
状態: `implemented_local_runtime_pending`
作成日: 2026-05-15

## L-S5S1-001: shared infrastructure と semantic domain で hook owner を分離する

parallel-08 (shared-foundation) は ToastProvider / ErrorBoundary / route guard / hook contract gate という **mount infrastructure** のみを所有し、`useAdminMutation.ts` の実体作成は serial-05/step-01 が **semantic owner** として担う。同じ親 workflow 内で parallel と serial task が hook を共有する場合、owner-boundary table を親 spec と各子 spec の両方に明記する。owner 衝突を Phase 1 まで遡って検知できる。

## L-S5S1-002: cross-task error contract は task-local 複製を許可しない

401/403 の `FetchAuthedError` は parallel-10 (auth-session) が owner。step-01 単独実装中であっても `FetchAuthedError` の stub / local replacement を作らず、「parallel-10 completed 待ち」を **着手 NO-GO gate** として spec に書く。task-local 複製は一度生やすと downstream task 全てがそれを参照し、後の置換 cost が線形に膨らむ。

## L-S5S1-003: mutation hook の副作用は呼び出し元負担を最小化する粒度で内部化する

`useAdminMutation` は `onSuccess` / `onError` を options（選択的）で受け、`router.refresh()` と toast 発火は hook 内部で **常に** 実行する。App Router の RSC 流儀に合わせ、step-02..08 の各呼び出し元が同じ boilerplate を書かない設計。hook 副作用設計のルール: 「複数の呼び出し元が必ず書く副作用」は hook 内部化、「呼び出し元固有のロジック」は options で受ける。

## L-S5S1-004: AC 漏れの mid-cycle discovery は Phase 3 を再走させずに同一サイクル内で閉じる

Phase 3 レビューで `MemberDrawer` の server-fetch に `notes` 配列が含まれるか不明という MAJOR が検出された場合、Phase 3 を再 gate せず、API contract 確認 → Drawer 拡張 → spec 後追い更新を同一サイクル内で resolve する。次回以降は Phase 1 の AC 定義時に「UI が依存する server-fetch field の存在を API contract で確認」を明示的 AC として含める。

## L-S5S1-005: spec-only と implemented-local を workflow_state enum で正規化する

root `artifacts.json` の workflow_state は次の値で運用する: `pending` (spec only / no apps diff), `implemented_local_runtime_pending` (apps/packages に local 実装 + Phase 11 mock evidence あり / runtime evidence pending), `implemented` (runtime evidence + PR merged)。`outputs/artifacts.json` の parity は実装着手後に generation し、Phase 12 compliance check で root との一致を検証する。skeleton workflow と dirty apps state の混在は spec_created 状態の循環定義を生むため、enum で early に分類する。

## L-S5S1-006: 複数検証 tool の gate condition は phase に割り当てる

`pnpm verify:tokens` (design token / Phase 6 lint gate), `pnpm test` + coverage AC >=80% (Phase 9 guard), runtime evidence (Phase 11 / 13 boundary) を Phase 別に明示割当する。Phase 12 compliance check の checklist は各 gate の通過を独立行で記録する。`bash scripts/coverage-guard.sh` のような複合 tool は coverage gate に統合し、runtime evidence は user-gated として Phase 13 まで持ち越す。

## 関連参照

- workflow root: `docs/30-workflows/serial-05-step-01-members-note-mutation-ui/`
- parent workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/`
- skill index 同期: `indexes/resource-map.md`, `indexes/quick-reference.md`, `references/task-workflow-active.md`
- changelog: `changelog/20260515-serial-05-step-01-members-note-mutation-ui.md`
