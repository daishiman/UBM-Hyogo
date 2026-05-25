# Phase 3: 設計レビュー

> Phase 2 設計が Phase 4（テスト作成）へ進める品質かを判定するゲート。

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|---|---|---|
| 価値性 | ✅ | admin 全 mutation の無限ハング・重複押下・transient error 即失敗という共通コストを hook 1 か所で下げる。caller の try/catch を痩せさせる |
| 実現性 | ✅ | hook 1 ファイル拡張 + useConfirmDialog 軽微改修 + legacy 削除。1 実装サイクルで完了可能な厚み。API/D1 変更なし |
| 整合性 | ✅ | 責務境界（hook=通信 / dialog=open状態 / ConfirmDialog=focus）が矛盾なく閉じる。型レベル overload で retry の idempotent 限定が静的保証される |
| 運用性 | ✅ | 後方互換（option 全 optional）。既定 timeout のみ新規適用。legacy 削除で SSOT 一本化 |

## 2. 真の論点と切り分け

- **真の論点**: 「admin mutation の信頼性 policy をどこに置くか」→ hook 単一注入点に集約（caller 分散を止める）
- **複数案件の混在チェック**: 元 issue には「DELETE attendance 実装」が暗黙に混ざっていたが、本仕様では **hook 基盤整備のみ**にスコープを切り、DELETE route 実装は scope 外（step-06 が将来 task と明記）として分離。先送りではなく「別関心の正当な分離」

## 3. 依存・責務境界の確認

- `useAdminMutation` ↔ `useConfirmDialog` の結合は `onCancelMutation` callback の一方向のみ（hook 間の循環依存なし）
- `ConfirmDialog.tsx` は触らない → focus restore 回帰リスクを構造的に排除
- AbortError の握り（silent）は hook 内に閉じ、caller / dialog に漏らさない

## 4. リスクと対処

| リスク | 対処 |
|---|---|
| timeout 既定適用で既存テストが fake timer 不足で flaky 化 | Phase 4 で fake timer（`vi.useFakeTimers`）を timeout テストに限定使用。既存 TC-01..10 は実時間のまま（10s 既定なので即解決系は影響なし） |
| overload 追加で型推論が崩れ既存 caller が型エラー | POST/PATCH caller は retry 未使用のため非破壊。Phase 5 typecheck で全 caller を検証 |
| legacy 削除で隠れた参照が壊れる | Phase 5 で `grep -rn "lib/useAdminMutation"` を削除前に実行し 0 件（テスト除く）を確認 |
| AbortError 判定が DOMException で `instanceof Error` を外れる | `e instanceof Error && e.name === "AbortError"` で判定。jsdom/happy-dom の AbortError も `name` を持つ |
| `mutationFn` 経路で timeout 期待が裏切られる | JSDoc + Phase 12 で「mutationFn 経路は timeout/retry 非適用」を明記。テストでも mutationFn 経路の timeout 非適用を確認 |

## 5. 判定

**GO（Phase 4 へ進行可）**。

- 型・シグネチャ・内部フロー・abort 連携・legacy 削除方針が確定
- AC-1〜AC-15 全てに対応する設計が存在
- 1 実装サイクル内で完了するスコープに収まっている（CONST_007 充足）

## 6. 完了条件（Phase 3）

- [ ] 4 条件評価が全て ✅
- [ ] 真の論点とスコープ分離の妥当性を確認
- [ ] リスクと対処を列挙
- [ ] GO/NO-GO 判定を記録
