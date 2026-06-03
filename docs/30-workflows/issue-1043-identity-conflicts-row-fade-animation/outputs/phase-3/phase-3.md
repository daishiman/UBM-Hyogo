# Phase 3: 設計レビュー（Phase 4 進行可否判定）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| phase | 3（設計レビューゲート） |
| 入力 | `phase-2/phase-2.md`（設計） |
| 出力 | Phase 4 進行可否判定（PASS / BLOCKER / MINOR） |

## 目的

Phase 2 の設計が AC を満たし、責務境界・timer 安全性・reduced-motion・design token gate・不変条件を破綻なく閉じているかをレビューし、Phase 4（テスト作成）への進行可否を判定する。

## 実行タスク

1. 設計妥当性を観点別にチェックする（§3.2）。
2. 既存コンポーネント再利用可否を判定する（§3.3）。
3. MINOR 指摘を抽出し Phase 8 / Phase 12 での扱いを確定する（§3.4）。
4. Phase 4 進行可否を結論づける（§3.1）。

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 1 要件 | `../phase-1/phase-1.md` | AC 充足判定 |
| Phase 2 設計 | `../phase-2/phase-2.md` | レビュー対象 |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 再利用可否判定 |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-3/phase-3.md` | 設計レビュー結果（PASS 判定 / BLOCKER 0 件 / MINOR 2 件と扱い） |

## 統合テスト連携

- §3.2 の「既存テスト回帰」観点が Phase 4 のテスト更新範囲（line 99 / line 155）を確定する。
- §3.4 MINOR-2（#988 screenshot 意味 drift）が Phase 11 の capture metadata 注記方針に連携する。

## 3.1 設計レビュー結論

| 判定 | 結果 |
| --- | --- |
| Phase 4（テスト作成）へ進行 | **可（PASS）** |
| BLOCKER | 0 件 |
| MINOR | 2 件（§3.4・未タスク化判断は Phase 12 で確定） |

## 3.2 設計妥当性チェック

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 真の論点に応えているか | ✅ | 「即時消失 → 視覚的手がかりのある退場」を exiting 相導入で解決。optimistic 体感（trigger 直後に fade 開始）を維持 |
| 責務境界の整合 | ✅ | `stage` / `isExiting` / `optimisticMerged` を責務分離。state 所有権は component-local に閉じ、page/hook/API 不変 |
| timer 競合の安全性 | ✅ | rollback・正常・アンマウントの 3 経路すべてで `exitTimerRef` を clear（§2.6）。`finalizeRemoval` は冪等 |
| reduced-motion a11y | ✅ | globals.css グローバル + Tailwind `motion-reduce` variant + timeout fallback の 3 重保証 |
| design token gate | ✅ | Tailwind 汎用 transition utility のみ。HEX / inline style 追加なし。新規 token / keyframes なし |
| 不変条件遵守 | ✅ | #1（API 不変）/ #2（OKLch・HEX 禁止）/ #9 / #10 すべて充足 |
| 既存テスト回帰 | ✅（要更新明記） | line 99 / 155 のテスト更新方針を §2.4 で確定。jsdom transitionend 制約への 2 系統対応を明記 |

## 3.3 既存コンポーネント再利用可否（FB-SDK-07-1）

- 新規 UI コンポーネントは作らない。既存 `IdentityConflictRow.tsx` の root `<div>` に transition utility と条件付き class を付与するのみ。
- 新規 primitive / 新規 hook を生やさない（不変条件: プロトタイプ primitive 群の範囲内）。
- → 再利用優先で品質・a11y を既存レベルで担保。

## 3.4 MINOR 指摘（Phase 12 で未タスク化判断）

| # | 指摘 | 扱い |
| --- | --- | --- |
| MINOR-1 | `scale-[0.99]`（collapse 補助）は opacity fade のみでも AC を満たすため任意。height collapse（行高の縮小）まで行うと layout reflow が absolute/grid 構成に依存し flaky リスク | 実装は opacity を主とし、scale は任意。height collapse は本タスクでは行わない（Phase 8 で簡素化確認） |
| MINOR-2 | 親 #988 の `identity-conflict-row-optimistic-removed.png` は「即時削除」時点の証跡。本タスクで挙動が「fade 後の安定 removed」へ変わるため意味が drift する | #988 成果物は越境編集せず、#1043 側 metadata に「#988 screenshot は即時削除時点の証跡」と注記し、#1043 で新 canonical screenshot を撮る（§1.4 スコープ外で確定済） |

## 完了条件（Phase 3）

- 設計レビューで BLOCKER 0 件、Phase 4 進行可と判定した。
- MINOR 2 件を記録し、Phase 8 / Phase 12 での扱いを確定した。
- 既存コンポーネント再利用方針を確定した。
