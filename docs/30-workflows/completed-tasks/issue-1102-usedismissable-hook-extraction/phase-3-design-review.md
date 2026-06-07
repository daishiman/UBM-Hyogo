---
phase: 3
name: 設計レビュー
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 3: 設計レビュー（Phase 4 進行可否判定）

## 3.1 判定: **PASS**（Phase 4 へ進行可）

## 3.2 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 重複 dismiss ロジック（2 箇所）の DRY 違反を根絶。新 popover 追加時のコピー由来 drift（Escape 漏れ / cleanup リーク）を防ぐ。I-2/I-5 を hook 型シグネチャで強制 |
| 実現性 | PASS | hook 1 本（約 30 行）+ 2 consumer の inline `useEffect`（各約 25 行）→ hook 呼び出し数行への置換。1 PR・1 サイクルに収まる |
| 整合性 | PASS | hook は open state を所有しない（I-2）/ `browserDocument()` 経由のみ（I-5）/ 既存命名規則（`use*` + `.ts` + `*.spec.tsx`）に一致 |
| 運用性 | PASS | 既存 spec 2 本を無改修で回帰確認 = 挙動不変の機械的証跡。hook 単体 spec で将来の回帰を保護 |

## 3.3 設計レビュー指摘と解決

| ID | 観点 | 指摘 | 解決 |
| --- | --- | --- | --- |
| R-1 | 挙動互換 | hook が `details.open` を見ないと、閉じている状態での外側 pointerdown が `onClose` を呼んでしまい、現行の「open のときだけ閉じる」挙動とズレる懸念 | `onClose` 内に open ガードを置く設計に確定（Phase 2 §2.3）。hook は検知のみ、open 判定は呼び出し側。これにより挙動完全保持 + I-2 維持を両立 |
| R-2 | 挙動差吸収 | DensityToggle は Escape 時のみ summary focus 復帰、SidebarUserMenu は両理由で単純 close。単一 `onClose()` では区別不能 | `onClose(reason: DismissReason)` に dismiss 理由を渡す API に確定。呼び出し側で `reason === "escape"` 分岐 |
| R-3 | listener 再登録 | `onClose` がレンダー毎に新規生成されると useEffect が毎回 re-register | 呼び出し側で `useCallback` 安定化を必須化（Phase 5 手順に明記）。DensityToggle は既存 `closeHelp`(useCallback) を流用 |
| R-4 | 配置（[FB-SDK-07-4] 命名一貫性） | 元仕様の `components/shell/` 配置は public consumer から見て feature 越境 | `apps/web/src/hooks/` に確定（cross-feature・既存 `useImeSafeInput.ts` 同階層） |
| R-5 | SSR/Workers 境界 | 素の `document` 直書きは I-5 違反 | hook 内部で `browserDocument()` 経由 + null 時 no-op。利用側は SSR 境界を意識不要 |
| R-6 | route-close の扱い | SidebarUserMenu の pathname 監視 `useEffect` を hook 化すべきか | 対象外（dismiss 機構ではなく nav 連動・責務別）。Phase 2 §2.4 で「そのまま残す」と明記 |

MINOR 指摘なし（すべて設計内で解決済）。未タスク化候補は Phase 12 §未タスク検出で再確認する。

## 3.4 テスト設計の整合性事前確認（[VSCPKR-03] props vs state）

- hook のテスト操作対象は `ref`（外部から渡す RefObject）と document イベント（`fireEvent`）。internal state は持たない（I-2）。よって props/state 混同のリスクはない。
- 2 consumer の既存 spec は `details.open = true` を手動設定してから `fireEvent.pointerDown` / `fireEvent.keyDown` する方式。hook 化後も同方式でパスする（open ガードが `onClose` に移るだけで、外形的挙動は不変）。

## 3.5 Phase 4 への申し送り

- RED テストは hook 単体（`useDismissable.spec.tsx`）で先に作る。reason 引数（`"pointerdown-outside"` / `"escape"`）の検証を含める。
- 2 consumer の既存 spec は**無改修**で回帰確認に使う（テスト追加・変更しない）。これが「挙動不変」の最強証跡。
