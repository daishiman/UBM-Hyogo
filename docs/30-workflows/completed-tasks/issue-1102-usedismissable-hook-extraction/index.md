---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
task_id: issue-1102-usedismissable-hook-extraction
issue: 1102
issue_state: CLOSED
visual_category: NON_VISUAL
implementation_mode: new
created: 2026-06-06
branch: docs/issue-1102-usedismissable-hook-extraction-spec
---

# issue-1102 — account popover 外側クリック / Escape 閉じロジックを汎用 `useDismissable` hook へ抽出

> **[実装区分: 実装仕様書]** — コード変更を伴う（新規 hook 追加 + 2 consumer 移行）。
> issue #1102 の既定ラベルは `type:refactoring`。本タスクは挙動不変リファクタだが、根本問題（DRY 違反 = inline dismiss ロジックの重複）の解消にコード変更が必須のため、CONST_004 に従い実装仕様書として作成する（ラベルより実態優先）。

## 0. このタスクの結論（調査サマリ）

| 項目 | 結論 |
| --- | --- |
| issue は別タスクで解決済か | 調査時点では未解決（`rg useDismissable apps/web` 0 件 / 2026-06-06）。本サイクルで `apps/web/src/hooks/useDismissable.ts` を実装済 |
| 重複 consumer | 調査時点で **2 箇所現存** — `SidebarUserMenu.tsx:34-58` / `DensityToggle.client.tsx:76-101`。本サイクルで両方を hook 呼び出しへ移行済 |
| 着手トリガー（rule of three） | issue 起票時は「再利用先 1 箇所のみ=未到達」だったが、**現時点で 2 箇所目（DensityToggle）が出現しトリガー成立**。着手可能 |
| issue 最適化（再スコープ） | 元 issue は「2 箇所目の適用はスコープ外」としていたが、現行コードでは DensityToggle が既に重複保持。根本解決（DRY）には両 consumer 移行が必要。CONST_005 に従い**両移行を 1 サイクルに含めて再スコープ** |
| 実装区分 | 実装完了（NON_VISUAL / implementation_mode=new / implemented_local_evidence_captured） |
| issue 状態 | #1102 は **CLOSED のまま**（ユーザー明示指示で reopen しない） |

## 1. 背景

親タスク `sidebar-footer-pinning-and-account-popover-ux` の C3（account popover 外側クリック / Escape 閉じ）で、ネイティブ `<details>` が「外側クリックで閉じる」標準挙動を持たない問題に対応した。その実装が `SidebarUserMenu.tsx` の匿名 `useEffect`（`browserDocument()` 経由 pointerdown + keydown(Escape) listener）にインライン化されている。親タスク Phase 3 MINOR `TECH-M-02` / Phase 10 で「再利用先 1 箇所のみ（rule of three 未到達）」を理由に early abstraction を見送り、follow-up（issue #1102）として温存していた。

その後 `DensityToggle.client.tsx`（公開メンバー一覧の表示密度ヘルプ popover）にも、ほぼ同一の inline dismiss ロジックがコピー実装された。これにより **2 箇所目の重複が顕在化＝着手トリガー成立**。本タスクは hook 抽出 + 両 consumer 移行で DRY 違反を根絶する。

## 2. ゴール

`apps/web/src/hooks/useDismissable.ts` を新規追加し、`SidebarUserMenu` と `DensityToggle` の inline dismiss ロジックを hook 呼び出しへ置換する。挙動は完全不変（既存 spec を無改修で全パス）。

### hook シグネチャ（確定）

```ts
export type DismissReason = "pointerdown-outside" | "escape";

export interface UseDismissableOptions {
  /** false のとき listener を一切張らない（既定 true）。 */
  readonly enabled?: boolean;
}

/**
 * ref で囲った領域の外側 pointerdown / Escape を検知して onClose を呼ぶ。
 * - open state は所有しない（I-2: state owner は呼び出し側の `<details>.open`）。
 * - browser API は `browserDocument()` 経由のみ（I-5: SSR/Workers 安全・null で no-op）。
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  onClose: (reason: DismissReason) => void,
  options?: UseDismissableOptions,
): void;
```

`onClose(reason)` に dismiss 理由を渡すのが本再スコープの設計核心。2 consumer の挙動差（DensityToggle のみ Escape 時に summary へ focus 復帰）を呼び出し側で `reason === "escape"` で分岐でき、hook 自体は単一責務（検知 → 通知）に収まる。

## 3. スコープ

### 含むもの
- `apps/web/src/hooks/useDismissable.ts`（新規）
- `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`（新規・単体保護）
- `apps/web/src/components/shell/SidebarUserMenu.tsx`（inline `useEffect` → hook 呼び出しへ置換）
- `apps/web/src/components/public/DensityToggle.client.tsx`（inline `useEffect` → hook 呼び出しへ置換）
- 既存 spec 2 本（SidebarUserMenu / DensityToggle）の無改修回帰確認

### 含まないもの
- `<details>.open` を React state 化する変更（I-2 違反のため禁止）
- 親タスクの route-close `useEffect`（pathname 監視）の hook 化（責務が別・dismiss 機構ではない）
- `<details>` 以外（独自 state 駆動 popover）への汎用化拡張（必要時に options 拡張）
- `Modal.tsx` / `ConfirmDialog.tsx` / `SidebarDrawer.tsx` / `TagsQueueResolveDrawer.tsx` 等の focus-trap modal 系（`useFocusTrap` 系統で別パターン・本 hook の対象外）

## 4. Phase 構成

| Phase | 成果物 | 状態 |
| --- | --- | --- |
| 1 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | completed |
| 2 設計 | [phase-2-design.md](phase-2-design.md) | completed |
| 3 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | completed |
| 4 テスト作成 | [phase-4-test-plan.md](phase-4-test-plan.md) | completed |
| 5 実装 | [phase-5-implementation.md](phase-5-implementation.md) | completed（local code reflected） |
| 6 テスト拡充 | [phase-6-test-additions.md](phase-6-test-additions.md) | completed |
| 7 カバレッジ確認 | [phase-7-coverage.md](phase-7-coverage.md) | completed |
| 8 リファクタリング | [phase-8-refactor.md](phase-8-refactor.md) | completed |
| 9 品質保証 | [phase-9-qa.md](phase-9-qa.md) | completed |
| 10 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | completed |
| 11 手動テスト | [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | completed（focused vitest 3 files / 35 tests PASS） |
| 12 ドキュメント更新 | [phase-12-documentation.md](phase-12-documentation.md) / [outputs/phase-12/](outputs/phase-12/) | completed |
| 13 PR作成 | [phase-13-pr.md](phase-13-pr.md) | blocked（commit / push / PR は user-gated） |

## 5. 不変条件

- **I-2**: state owner 単一。`<details>.open` が正本。hook は open state を所有しない（`onClose` コールバックのみ）。
- **I-5**: browser API 入口は `browserDocument()`（`apps/web/src/lib/is-browser.ts`）経由のみ。素の `document.addEventListener` 禁止。
- **behavior-preserving**: 既存 `SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx` は無改修で全パス（挙動完全不変の証跡）。
- **CLAUDE.md invariant #5**: D1 直接アクセス不変（本タスクは UI 層のみ・非該当）。

## 6. 参照

- 元 unassigned-task: `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/unassigned-task-specs/sidebar-footer-pinning-and-account-popover-ux-followup-001-usedismissable-hook-extraction.md`
- 親 WF: `docs/30-workflows/completed-tasks/sidebar-footer-pinning-and-account-popover-ux/`
- 関連コード: `apps/web/src/components/shell/SidebarUserMenu.tsx` / `apps/web/src/components/public/DensityToggle.client.tsx` / `apps/web/src/lib/is-browser.ts` / `apps/web/src/hooks/useImeSafeInput.ts`(配置参考)
