# Workflow Artifact Inventory: issue-1102-usedismissable-hook-extraction

## Metadata

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1102-usedismissable-hook-extraction/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr` |
| issue | #1102 CLOSED 維持（mutation は user-gated） |
| parent workflow | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/` |
| source unassigned | `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/unassigned-task-specs/sidebar-footer-pinning-and-account-popover-ux-followup-001-usedismissable-hook-extraction.md` |

## Implementation

| 種別 | パス |
| --- | --- |
| hook | `apps/web/src/hooks/useDismissable.ts` |
| hook spec | `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` |
| migrated consumer | `apps/web/src/components/shell/SidebarUserMenu.tsx` |
| migrated consumer | `apps/web/src/components/public/DensityToggle.client.tsx` |
| unchanged regression spec | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` |
| unchanged regression spec | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |

## Evidence

| 検証 | 結果 |
| --- | --- |
| focused vitest | PASS: 3 files / 35 tests |
| command | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/hooks/__tests__/useDismissable.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |
| visual evidence | N/A（NON_VISUAL behavior-preserving refactor） |

## Invariants

- `useDismissable` は open state を所有しない。呼び出し側の `<details>.open` が正本。
- browser API は `browserDocument()` 経由のみ。
- `SidebarUserMenu` / `DensityToggle` の既存 consumer spec は未編集で PASS。
- API / D1 / Google Form / design token は変更なし。

## User Gate

commit / push / PR / Issue mutation はユーザー承認後のみ。

## Lessons Learned

- **L-I1102-001**（rule of three の遅延成立）: issue #1102 起票時点の前提「再利用先 1 箇所（`SidebarUserMenu` のみ）= rule of three 未到達」は実装着手時に変化していた。2 箇所目（`DensityToggle.client.tsx`）が独立に同じ outside-pointerdown / Escape dismiss を実装しておりトリガー成立。**抽出タスクは起票時の前提を鵜呑みにせず、着手時に現行コードを再 grep して再利用箇所を数え直す**。本サイクルでは両 consumer 移行を 1 サイクルで完結させ DRY 違反を根絶した（CONST_005 先送り禁止に整合）。
- **L-I1102-002**（hook は open state を非所有）: `useDismissable` は `<details>.open` を所有しない。state owner は呼び出し側の `<details>` 要素であり、hook は「外側 pointerdown / Escape の検知 → `onClose(reason)` 通知」だけを単一責務とする（I-2）。これにより hook を汎用化しても各 consumer の state 機構（native `<details>` toggle）を奪わない。
- **L-I1102-003**（`DismissReason` union で consumer 固有 a11y を保持）: close 理由を `"pointerdown-outside" | "escape"` の union で onClose に渡すことで、`DensityToggle` は Escape 時のみ `summary` へフォーカス復帰させ、`SidebarUserMenu` は reason を無視して単純 close、という**挙動差を汎用 hook を壊さずに吸収**できた。汎用化で consumer 固有挙動を平準化してしまうのを防ぐ鍵。
- **L-I1102-004**（SSR / Workers 安全な DOM 参照）: browser API は `browserDocument()` 経由のみ（I-5）。`doc` が null（SSR/Workers）なら `useEffect` 内で early return し no-op。`instanceof` 判定は `doc.defaultView?.Node` で document の realm に合わせて取得することで、jsdom / iframe 跨ぎでも `element.contains(target)` の型ガードが壊れない。
- **L-I1102-005**（挙動不変はテスト無改修 PASS で証明）: 既存 consumer spec 2 本（`SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx`）を**一切改修せず全 PASS**（focused 3 files / 35 tests）。リファクタが観測挙動を変えないことをテスト差分ゼロで立証でき、これが NON_VISUAL 判定（実 screenshot 不要）の根拠となる。
