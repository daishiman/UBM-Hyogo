# Phase 11: UI サニティ / 3層ビジュアルレビュー（spec）— VISUAL

> 本ファイルは focused Vitest の主証跡と、local Playwright screenshot のレビュー観点を記録する。Phase 11 screenshot 3 PNG は captured。

## VISUAL 宣言

本タスクは **VISUAL タスク**である（`NON_VISUAL` ではない）。

- **タスク種別**: VISUAL_ON_EXECUTION
- **視覚変化の内容**: merge 二段階 confirm 完了直後に該当 row が **fade out（opacity 減衰 + 任意 scale collapse）して退場し、fade 完了後に DOM から除去** される。server error 時は exiting を解いて row を復元し inline error（`role="alert"`）を表示する。これらは opacity・DOM の有無・レイアウトの視覚的変化であり、text assertion のみでは「fade を経た退場」の操作体感を担保できない。
- **route**: `/admin/identity-conflicts`
- **対象 component**: `apps/web/src/components/admin/IdentityConflictRow.tsx`（`isExiting: boolean` + `exitTimerRef` を追加し、merge 成功時 `isExiting=true` で fade class を付与、`finalizeRemoval` で `optimisticMerged=true`（`return null`）、`.catch` で exiting キャンセル + rollback）
- **証跡**: tier 1 は local jsdom render + focused Vitest、tier 2 は local Playwright screenshot 3 PNG。

## Apple HIG / motion 観点

| HIG 観点 | 内容 | 対応 |
| --- | --- | --- |
| motion の控えめさ | fade は短時間（`EXIT_ANIMATION_MS = 200ms` 程度・Tailwind `duration-200`）で控えめに行い、運用者の注意を奪わず「処理済み」の手がかりに留める。過度な bounce / 長尺 animation を用いない | #1（exiting） |
| reduced-motion 配慮 | `prefers-reduced-motion: reduce` 環境では globals.css のグローバル `transition-duration: 0.001ms !important` + Tailwind `motion-reduce:transition-none` で animation を抑制し、ほぼ即時に消える（旧 `return null` 同等）。動きを強制しない | reduced-motion ケース |
| 一貫性 | fade は opacity / transform のみで色 token を変えない。danger 等の意味色は rollback の inline error にのみ用い、退場演出と意味色を混同させない | #1・#3 |
| 予測可能性 | fade → 消失という一方向の退場で、運用者が「この row は処理された」と直感的に理解できる。rollback では同位置・同寸法に復元し迷子にさせない | #2・#3 |

## 3層評価観点

### 1. Semantic（意味・構造）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| exiting の意味 | exiting 相が「処理中（pending）」ではなく「確定的に退場していく」と読めること | #1 |
| removed の DOM 正当性 | `optimisticMerged === true` で `return null` し、row が DOM から消えること（`display:none` 擬似消去ではない） | #2 |
| rollback の role 復元 | rollback 後に row が復元した際、merge/dismiss トリガの role・aria が復元前と同一であること | #3 |
| error の role | inline error が `role="alert"` を持ちスクリーンリーダに通知されること | #3 |
| dismiss 不変 | dismiss 側の DOM 構造・role が本変更前と同一であること（回帰なし） | 全 screenshot 共通の前提 |

### 2. Visual（視覚）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| OKLch トークン整合 | 色は `var(--ubm-color-*)` を使用し、fade は opacity / transform のみで実現。HEX 直書き / `bg-[#xxx]` / inline `style` を含まないこと（`verify-design-tokens` gate 準拠） | #1・#2・#3 |
| inline error の視認性 | inline error が danger トークン（`text-[var(--ubm-color-danger)]` 等）で表示され視認できること | #3 |
| レイアウト崩れなし | row 消失後に一覧レイアウトが崩れない（隙間・ガタつきがない）こと | #2 |
| 復元時のレイアウト | rollback で row が消失前と同位置・同寸法に戻ること | #3 |

### 3. AI UX（操作体感）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| 視覚的手がかり | fade 退場で連続 row 処理時に「どの row を処理したか」の手がかりになり誤操作が減ること | #1 |
| reduced-motion 体感 | reduced-motion 環境で動きを強制せずほぼ即時に消えること | （reduced-motion 検証） |
| rollback の認知負荷 | error 時に row が戻り inline error で原因が読め再操作できること（迷子にならない） | #3 |

## レビュー判定枠（本サイクルで記入）

| 層 | 判定 | 所見 |
| --- | --- | --- |
| Semantic | （実装後記入） | exiting/removed/rollback の意味整合 |
| Visual | （実装後記入） | fade が token を変えず opacity のみ・layout 不崩れ |
| AI UX | （実装後記入） | 控えめ fade が処理手がかりになり rollback で復帰可能 |

## 判定（spec）

**GATE: ビジュアルレビュー観点 PASS** — VISUAL タスクとして Apple HIG motion 観点（控えめさ・reduced-motion 配慮）と 3 層評価観点を screenshot 対応付きで確認した。local Playwright screenshot 3 PNG は取得済み。
