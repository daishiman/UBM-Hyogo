# Phase 12 / Task 12-5: スキルフィードバックレポート

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 改善点なしでも出力必須。テンプレート改善 / ワークフロー改善 / ドキュメント改善の 3 観点で記録する。

---

## 1. テンプレート改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| exit animation の state 責務分離 | dialog 制御（`stage` union）/ removed 相（`optimisticMerged` boolean）/ exiting 相（`isExiting` boolean）を 3 つに分離する判断が有効。1 つの union に詰め込まず独立 boolean にすることで rollback 時の復元経路が単純化する | 既存 Phase 2 設計観点の「責務分離」/ `references/patterns-ui-ipc-modules.md` で吸収可能。新規 skill 変更は no-op |
| timer/transitionend 二重化パターン | CSS transition 完了を `transitionend` で待ちつつ、非発火環境向けに `setTimeout` fallback を張る二重化は UI exit animation の汎用パターン。`finalizeRemoval` を冪等にすれば二重発火しても安全 | 既存 lessons の「optimistic row mutation + rollback」節に exit-animation 派生として追記可能（本サイクルで体系化） |

---

## 2. ワークフロー改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| 親 completed-tasks 成果物の越境編集回避 | 親 #988 の screenshot が本タスクで意味 drift するケースで、completed-tasks 配下を編集せず本タスク側 metadata に注記して新 canonical を撮る方針は、完了済みワークフローの不変性を守りつつ drift を解消できる | 既存「completed-tasks 成果物は越境編集しない」practice で十分。新規ルール化は no-op |
| implemented_local_evidence_captured の local fixture screenshot 分離 | VISUAL タスクで staging auth が不要な local fixture 経路を構成できる場合、同一 cycle で screenshot を取得し、commit / push / PR / Issue mutation のみ user-gated として残す分離が有効 | 既存 FB-VISUAL-CAP-001 / two-tier evidence ルールで十分 |
| reduced-motion 3 重保証の設計テンプレ化 | globals.css グローバル + Tailwind `motion-reduce` variant + timeout fallback の 3 重保証は exit animation を含む全 UI motion タスクで再利用できる a11y 設計 | aiworkflow-requirements artifact inventory に汎化候補として記録 |

---

## 3. ドキュメント改善

| 観点 | 知見 | 提案 |
| --- | --- | --- |
| identifier drift 防止 | implementation-guide の確定設計（`isExiting` / `exitTimerRef` / `finalizeRemoval` / `onMerge`）を Phase 1-3 設計と一致させ、compliance check で grep 確認する運用は drift 防止に有効 | 現行 W1-02b-3 ルールで十分。追加改善なし |
| screenshot canonical 名の早期固定 | 3 枚の screenshot 名（`-exiting-fade` / `-removed-stable` / `-rollback-restored`）を Phase 1 spec で先に確定し implementation-guide でも同名参照したため、Phase 11 実行時の名前ドリフトを予防できる。親 #988 の名前（`-optimistic-removed` / `-rollback-error`）と区別した命名で意味 drift も明示 | 現行 FB-VISUAL-CAP-001 ルールで十分。追加改善なし |

---

## 総括

SKILL.md 本体へ昇格すべき新ルール（gate / policy）は検出されなかった。本タスクは implemented_local_evidence_captured 段階であり、実装で得た再利用知見（lessons-learned）の体系化は本サイクルで実行済み。本 WF で確定した設計知見の体系化候補は以下:

- **UI exit animation パターン**（本サイクルで lessons 化）: exiting 相を独立 boolean で持ち、`transitionend` + timeout fallback の二重化で removed 遷移を保証し、rollback で全経路 timer を clear する設計。`finalizeRemoval` 冪等化により transition 複数 property の多重発火を吸収。
- **reduced-motion 3 重保証**（同上）: globals.css グローバル + Tailwind `motion-reduce:transition-none` + timeout fallback の組み合わせで、a11y を壊さず exit animation を提供する。
- **jsdom transitionend 制約への 2 系統テスト**（同上）: jsdom は `transitionend` を自動発火しないため、`fireEvent.transitionEnd` 明示発火と `vi.useFakeTimers` による fallback timer 進行の両系統で removed 遷移を再現する。

既存の implementation target physical existence gate と same-wave sync rule は維持。本サイクルでは skill 本体・reference への変更は行わず（implemented_local_evidence_captured・実コード実装済み）、aiworkflow-requirements ledger/inventory への実装知見同期に留める。
