# Phase 3: 設計レビュー（Phase 4 進行ゲート）

`[実装区分: 実装仕様書]` / `taskType: implementation`

## 3.1 レビュー観点と判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 責務境界（state 分離） | PASS | `optimisticDismissed` を `optimisticMerged` と分離。render guard でのみ OR 合流。issue 苦戦箇所の failure mode（state 混線で error surface 帰属不明）を構造的に回避 |
| 状態所有権 | PASS | row 可視性は component-local。親 Server Component / hook に所有権を漏らさない（#988 と整合） |
| API 不変条件 | PASS | dismiss endpoint / payload（`{ reason }`）不変。不変条件 #1 遵守 |
| hook 不変 | PASS | `useAdminMutation` 拡張なし。component-local state で完結。不変条件 #10 遵守（`@/lib/useAdminMutation` 不使用） |
| merge 非回帰 | PASS | render guard を OR 統合するのみで `optimisticMerged` の挙動は不変。Phase 6 で merge 既存ケースの非回帰を test 化 |
| 理由保持（rollback） | PASS | `.catch` で `optimisticDismissed` だけ false 復帰、`dismissReason` は touch しない設計 |
| 命名一貫性 | PASS | `optimisticDismissed` / `setOptimisticDismissed`（camelCase・merge と対称） |
| OKLch トークン | PASS | markup 追加は render guard 1 行のみ。色追加なし。不変条件 #2 自動遵守 |
| 1 サイクル完了性（CONST_007） | PASS | 単一 component の state 1 個 + ハンドラ差し替え + guard 1 行 + test。先送りなし |
| VISUAL 区分 | PASS | dismiss 即時消失 + rollback 復元の視覚変化あり。Phase 11 VISUAL（実装時 capture） |

## 3.2 リスクと対策（issue リスク表を現行設計へ反映）

| リスク | 影響 | 対策 |
| --- | --- | --- |
| dismiss と merge の rollback state が混線する | 中 | `optimisticMerged` と `optimisticDismissed` を分離。test で「片方の失敗が片方に影響しない」を固定（Phase 6） |
| dismiss 理由入力が rollback 後に消える | 中 | `.catch` では optimistic state だけ戻し、`setDismissReason("")` を呼ばない（Phase 4 TC-DOPT-2 で固定） |
| row を即時削除すると screen reader の状態変化が唐突 | 低 | Playwright / RTL で `role="alert"` の rollback error を確認。fade は別 followup へ委譲（scope out） |
| render guard 統合で merge が回帰 | 低 | OR 条件のみ追加。merge state 不変。Phase 6 で merge 既存 optimistic ケースの非回帰を test 化 |

## 3.3 設計判断の確定事項（Phase 4 へ引き継ぐ）

1. state 名: `optimisticDismissed: boolean`（初期値 `false`）
2. true 契機: `onDismiss` 先頭（`setOptimisticDismissed(true)`）
3. false 契機: `dismissMutation.trigger(...).catch(() => setOptimisticDismissed(false))`（rollback のみ）
4. render guard: `if (optimisticMerged || optimisticDismissed) return null;`
5. 理由保持: `.catch` 内で `dismissReason` を一切操作しない
6. `optimisticDismissed` は **internal state**（props 非露出 / VSCPKR-03）。test は UI 操作（「別人として確定」click）経由でのみ駆動

## 3.4 ゲート判定

**GATE: PASS** — Phase 4（テスト作成 / TDD RED）へ進行可。設計に矛盾・未確定なし。

## 3.5 完了条件

- 全レビュー観点が PASS であること。
- Phase 4 が参照する確定設計事項（§3.3 の 1-6）が曖昧さなく固定されていること。
