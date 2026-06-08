---
phase: 10
name: 最終レビュー
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 10: 最終レビュー

実装反映後の最終レビュー。acceptance criteria の網羅性と focused evidence を判定し、
blocker の有無と MINOR 指摘の未タスク化要否を確定する。

## 10.1 acceptance criteria 充足判定

判定列の意味:
- **仕様として網羅: PASS** = 本仕様書（Phase 1〜13）が AC を満たす設計・手順を完備している。
- **実装検証: PASS** = 実コードで focused vitest / 無改修 consumer 回帰が PASS している。

| AC | 内容 | 仕様として網羅 | 実装検証 |
| --- | --- | --- | --- |
| AC-1 | 汎用 hook `apps/web/src/hooks/useDismissable.ts` を新規追加し、外側 pointerdown / Escape を検知 | PASS | PASS |
| AC-2 | API は `useDismissable(ref, onClose, options?)`・`DismissReason = "pointerdown-outside" \| "escape"` | PASS | PASS |
| AC-3 | `SidebarUserMenu.tsx` の inline dismiss を hook 呼び出しへ移行（挙動不変） | PASS | PASS（既存 spec 無改修） |
| AC-4 | `DensityToggle.client.tsx` の inline dismiss を hook 呼び出しへ移行（Escape 時 summary focus 復帰を保持） | PASS | PASS（既存 spec 無改修） |
| AC-5 | I-2（`<details>.open` 単一所有・hook 非所有）を維持 | PASS | PASS |
| AC-6 | I-5（document アクセスは `browserDocument()` 経由のみ）を維持 | PASS | PASS |
| AC-7 | hook 単体 spec を追加し、両 reason / 内側無視 / enabled:false no-op / cleanup を検証 | PASS | PASS（12 tests） |
| AC-8 | 既存 consumer spec 2 本を無改修で回帰パス（挙動不変の証跡） | PASS | PASS（3 files / 35 tests） |

仕様網羅: **AC-1〜AC-8 すべて PASS**。

## 10.2 blocker 判定

**blocker なし。**

- spec は Phase 1〜13 完備。設計レビュー（Phase 3）も PASS。
- 実装コードは本サイクルで反映済み。commit / push / PR は user-gated のため Phase 13 のみ blocked。
- API 追加・D1 schema 変更・Google Form 仕様変更は無し（UI 内部リファクタのみ）で、不変条件違反なし。

## 10.3 MINOR 指摘と未タスク化判定（[Phase 10 MINOR→未タスク化ルール]）

MINOR 指摘の有無を明記する。本タスクで検討した MINOR 候補は以下。

| 候補 | 内容 | 未タスク化するか | 理由 |
| --- | --- | --- | --- |
| M-1 | Modal / ConfirmDialog 等 focus-trap modal 系への `useDismissable` 横展開 | **しない** | focus-trap modal は「フォーカス閉じ込め + 背景 inert + Tab 循環」を伴い、`<details>` popover の dismiss とはパターンが異なる。本 hook の責務（外側 pointerdown / Escape 検知のみ）を超え、別 hook（例: `useFocusTrap` 既存）の領域。スコープ外であり未解決の欠陥ではない |
| M-2 | `reason` への `"pointerdown-outside"` / `"escape"` 以外（例: blur / route 変更）の拡張 | **しない** | 現行 2 consumer は pointerdown / Escape の 2 reason のみ。YAGNI。route-close は責務別で hook 化対象外（Phase 3 R-6 確定済）。3 つ目の需要が出るまで拡張しない |
| M-3 | hook の `capture: true` オプション対応 | **しない** | 現行 consumer は capture 不使用。挙動不変リファクタが目的であり、新オプションは挙動を変えうる。需要が出た時点で別タスク |

**未タスク化が必要な MINOR: 0 件。**
すべて「スコープ外パターン」または「YAGNI で需要待ち」であり、本タスクの未解決欠陥ではないため Issue 起票しない。

## 10.4 最終判定

- AC 網羅: PASS（AC-1〜8）
- blocker: なし
- 未タスク化 MINOR: 0 件

→ **implemented_local_evidence_captured として完備。commit / push / PR は user-gated。**
