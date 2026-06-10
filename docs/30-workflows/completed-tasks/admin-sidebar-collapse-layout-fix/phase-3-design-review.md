# Phase 3: 設計レビュー（Phase 4 へ進めるかの判定ゲート）

## 要件レビュー思考法（一次結論）

| 観点 | 評価 |
| --- | --- |
| 1. 真の論点 | 「collapsed 時に各行が `px-3` を剥がさず内側 16px に圧縮され、icon/avatar/mark が溢れ中心軸がずれる」こと。現象（はみ出し/不揃い）でなく主問題を 1 文で固定済み。 |
| 2. 依存関係・責務境界 | レイアウト整列の責務は各コンポーネントの className。CSS surface（globals.css の overflow/sticky）は別責務で触らない。状態所有権（useSidebarState）は不変。混在なし。 |
| 3. 価値とコストの不均衡 | 価値: collapsed UX の崩れ解消（全 route 共通 shell なので影響大）。コスト: className 分岐 4 ファイル + テストのみで小。tooltip overflow（OOS-1）は高コスト（sticky/overflow 全 viewport 検証）なので分離。均衡が取れている。 |
| 4. 改善優先順位 | (1) px 除去 + 中央枠（AC-1..3）→ (2) active 維持 + アカウント可視性（AC-4/6）→ (3) expanded regression（AC-5）。主訴に直結する順。 |
| 5. 4 条件評価 | 下記の通り全て PASS。 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 公開/会員/管理で共有する shell の collapsed 崩れを解消。誰の（全ユーザー）どのコスト（視認性・操作性の低下）を下げるかが AC で定義済み。 |
| 実現性 | PASS | className 分岐 4 ファイル + テストで 1 サイクル完結。新規 primitive/型/endpoint なし。実装厚みが適正。 |
| 整合性 | PASS | 責務境界（className vs CSS surface vs state）が矛盾なく分離。data 属性・collapsed 契約・トークンを変えない。 |
| 運用性 | PASS | focused vitest + verify:tokens + apps/api diff 空で検証可能。implemented_local_evidence_captured の gates / Phase 11 captured 方針が破綻しない。 |

## 設計レビューチェックリスト

| 項目 | 判定 | 備考 |
| --- | --- | --- |
| 根本原因が実コードで裏取りされているか | ✅ | `SidebarNavItem.tsx:30` / `SidebarUserMenu.tsx:54` / `SidebarBrand.tsx:16` / `SidebarShell.tsx:32` を実 Read 確認 |
| Explore 誤判定の棄却が裏取りされているか | ✅ | `.ui-sidebar-*`（globals.css:270-504）が現行 shell 未使用の legacy であることを grep で確認（`ui-sidebar` / `data-size` は shell/ で 0 件） |
| 新規 primitive を増やしていないか | ✅ | 既存 4 コンポーネントの className 編集のみ（不変条件 #9 #10 相当の精神に整合） |
| API/D1/Form 非変更か | ✅ | apps/web 表現層のみ。AC-8 で apps/api diff 空を担保 |
| 色トークン不変条件を守るか | ✅ | spacing/layout utility のみ変更。HEX 新規追加なし（AC-7） |
| 命名規則の一貫性 | ✅ | 既存 `${collapsed ? ...}` テンプレートリテラルパターンを踏襲（[FB-SDK-07-4] 命名ドリフト回避） |
| スコープが 1 サイクル完結か（CONST_007） | ✅ | AC-1..9 が単一関心で 1 実装サイクル。未タスク分離 0 件。OOS-1 のみ baseline（回帰リスク分離の正当理由付き） |
| テスト方針（props vs internal state）が明確か | ✅ | collapsed は **external prop**（`SidebarShell` から各子へ伝播）であり internal state ではない。Phase 4 で「collapsed prop を渡して className を assert」する方針を明記（[VSCPKR-03] 対策） |

## リスクと緩和

| リスク | 影響 | 緩和 |
| --- | --- | --- |
| px-0 中央化で active `border-l-2` の左ボーダーが中央レイアウトと衝突 | AC-4 | Phase 5 で active 時の border 表現を中央枠と両立する形に確定。Phase 6 で active+collapsed の spec を追加 |
| expanded で gap/px を分岐に移す際に既存 expanded 値を取り違える | AC-5 regression | Phase 5 で各コンポーネントの現行 expanded 値（nav=gap-3 / user-menu=gap-2 / brand=gap-2）を逐語保持 |
| collapsed の overflow:hidden で tooltip が切れる（OOS-1） | UX | 本サイクル対象外（baseline）。Phase 11 で実機確認、改善判断時のみ別タスク化 |
| vitest が repo root のため targeted run で No test files | 検証 | `--root=.` + `apps/web/src/components/shell/__tests__` パス指定を Phase 4/9 に明記 |

## ゲート判定

**PASS — Phase 4（テスト計画）へ進む。**

根本原因が単一で裏取り済み、スコープが 1 サイクル完結、責務境界が矛盾なく閉じ、4 条件すべて PASS。
未解決の設計論点はなし（OOS-1 は意図的な別関心分離で baseline 記録）。
