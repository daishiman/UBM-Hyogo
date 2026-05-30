# Phase 11: UI サニティ / 3層ビジュアルレビュー（spec）— VISUAL

> 本ファイルは 2026-05-30 の local screenshot 3 枚に基づく VISUAL レビュー結果を記録する。

## VISUAL 宣言

本タスクは **VISUAL タスク**である（`NON_VISUAL` ではない）。

- **根拠**: merge 実行直後に該当 row が一覧から消える（optimistic hide）、および server error 時に row が復元し inline error（`role="alert"`）が表示される、という **DOM の有無・配色・レイアウトの視覚的変化** を伴うため。これらは text assertion のみでは操作体感を担保できず、screenshot による視覚 evidence が必要となる。
- **route**: `/admin/identity-conflicts`
- **対象 component**: `apps/web/src/components/admin/IdentityConflictRow.tsx`（component-local state `optimisticMerged: boolean` を追加し、merge click 直後 `setOptimisticMerged(true)` で `return null`、trigger の `.catch` で `setOptimisticMerged(false)` rollback）

## 3層評価観点

### 1. Semantic（意味・構造）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| row 消失の DOM 正当性 | `optimisticMerged === true` で `return null` し、該当 row が DOM から消えること（`display:none` での擬似消去ではない） | #2 |
| aria/role 維持 | rollback 後に row が復元した際、merge / dismiss トリガの role・aria 属性が復元前と同一であること | #3 |
| error の role | inline error が `role="alert"` を持ち、スクリーンリーダに通知されること | #3 |
| confirm 文言の正当性 | 確認 2/2 の文言（「merge 理由」「merge 実行」等）が意味的に正しいこと | #1 |
| dismiss 不変 | dismiss 側の DOM 構造・role が本変更前と同一であること（回帰なし） | （全 screenshot 共通の前提） |

### 2. Visual（視覚）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| OKLch トークン整合 | 色は `var(--ubm-color-*)` を使用し、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を含まないこと（不変条件・`verify-design-tokens` gate 準拠） | #1・#2・#3 |
| inline error の視認性 | inline error が danger トークン（例: `text-[var(--ubm-color-danger)]` / `--ubm-color-danger-soft`）で表示され、十分に視認できること | #3 |
| レイアウト崩れなし | row 消失後に一覧レイアウトが崩れない（隙間・ガタつきがない）こと | #2 |
| 復元時のレイアウト | rollback で row が復元した際、消失前と同位置・同寸法で戻ること | #3 |

### 3. AI UX（操作体感）

| 観点 | 内容 | 対応 screenshot |
| --- | --- | --- |
| 即時フィードバック | 「merge 実行」click → 即時 row 消失で round-trip 待ち感がなく、複数 conflict の一括処理体験が改善されること | #2 |
| rollback の認知負荷 | error 時に row が戻り、inline error で原因が読め、再操作可能と理解できること（操作者が迷子にならない） | #3 |
| 確定的消去の読み取り | 消失が「処理中（pending）」ではなく「確定的に処理された」と読めること（誤った安心・誤操作を招かない範囲か） | #2 |

## レビュー判定枠（実装後記入）

| 層 | 判定 | 所見 |
| --- | --- | --- |
| Semantic | PASS | 確認 2/2、row 消失、rollback error の意味が一致 |
| Visual | PASS | row 消失後も list layout が崩れず、error は danger token で表示 |
| AI UX | PASS | click 直後に対象 row が消え、error 時に復元して再操作できる |

## 判定（spec）

**GATE: ビジュアルレビュー PASS** — VISUAL タスクとして 3 層の評価観点を screenshot 対応付きで評価済み。
