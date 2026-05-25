**[実装区分: 実装仕様書]**

# Phase 3: 設計レビュー / Gate-A 判定

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 1 / Phase 2 |
| 出力 | 本ファイル（Gate-A 判定結果） |
| Gate | Gate-A（spec_review） |

## 1. レビュー対象

- Phase 1: 要件定義 / インベントリ / FR / NFR / AC / スコープ / タスク分類 / リスク
- Phase 2: 設計判断 4 件 / 実装順序 9 ステップ / component contract / verify gate 差分設計

## 2. 4 条件 verdict

| 条件 | 判定 | 根拠 |
|---|---|---|
| 矛盾なし | PASS | OKLch token 正本（HEX 直書き禁止）と Google brand 公式色（HEX 必須）の矛盾を「外部 brand owner 指定 = exempt path」で吸収。token システム自体は不変 |
| 漏れなし | PASS | 11 ファイル変更対象（新規 2 / 修正 6 / spec 1 / 親 workflow 2）すべてが Phase 1 インベントリと Phase 2 実装順序の両方に明示 |
| 整合性あり | PASS | `spec_created` / `VISUAL` / `new` の語彙統一。Gate-A/B/C 雛形配置 |
| 依存関係整合 | PASS | API / D1 / Auth.js / OKLch token 値は不変。staging deploy / commit / PR は Phase 13 user-gated に分離 |

## 3. 詳細レビュー項目

### 3.1 命名規則整合

| 観点 | 確認結果 |
|---|---|
| ディレクトリ命名 | `brand-icons` は既存 `apps/web/src/components/ui/` 配下の kebab-case と整合 |
| Component 命名 | `GoogleBrandIcon` は PascalCase。既存 `Icon` / `Button` / `Card` と整合 |
| IconName union | union から `"google"` を削除する方針は既存 kebab-case 文字列契約と整合 |
| exempt 変数命名 | `brandIconExemptPaths` は既存 `colorLiteralExcludes` と語感が揃う |

### 3.2 責務境界の確認

| layer | 責務 | 確認 |
|---|---|---|
| `Icon.tsx` | semantic icon（currentColor / token 駆動） | brand icon を扱わない。`case "google":` 削除で責務が純化 |
| `brand-icons/GoogleBrandIcon.tsx` | 外部 brand owner 指定アセット wrapper | HEX を持たず、`google.svg` のみを参照する |
| `verify-design-tokens.ts` | gate 全体 | brand-icons 配下は exempt として明示判定 |
| `09b-design-tokens.md` | 設計正本 | brand-asset exempt 章を持ち、追加基準を文書化 |

### 3.3 因果と影響範囲

- **強化ループ**: 「brand 公式色を直書き OK にする exempt path」→「外部 brand 追加時のパターン提示」→「`brand-icons/` 直下の再利用増加」（健全）
- **バランスループ**: 「exempt path 拡大の誘惑」← 「`09b-design-tokens.md` の追加基準（外部 brand owner 指定のみ）」によって抑止（健全）
- 影響範囲: `/login` 1 routes のみ。他 route の Icon 利用は無改変

### 3.4 リスク再評価

| リスク | Phase 1 評価 | Phase 3 再評価 |
|---|---|---|
| exempt path 再帰許可で抜け穴化 | 対策あり（直下のみ正規表現固定） | TC-EXEMPT-03 で nested-fail を明示テスト化 → 解消 |
| union から `"google"` 削除で typecheck 破壊 | 対策あり（grep で参照箇所列挙） | 唯一の参照は `GoogleOAuthButton.client.tsx` のみ → 解消 |
| visual baseline 更新忘れ | 対策あり（Phase 5 必須手順） | Phase 9 QA でも baseline 存在確認を入れる → 解消 |
| Google SVG の公式整合 | 対策あり（公式リソースから直接コピー） | viewBox `0 0 48 48` 固定で再現性確保 → 解消 |
| `Icon.tsx` switch の dead branch 残存 | 対策あり（Phase 8 リファクタ） | Phase 8 で switch 全体の grep と目視確認を必須化 → 解消 |

### 3.5 価値とコストの均衡

| 価値 | コスト |
|---|---|
| Google brand guideline 準拠（法務・ブランド risk 軽減） | SVG asset + component 新規 2 ファイル |
| brand asset と semantic icon の責務分離（将来 brand 追加コスト低下） | verify-design-tokens 差分 + spec 追加 1 ケース |
| exempt path 機構の汎用化（他 brand 追加コスト低下） | 09b spec 章追加（運用ルール明文化） |

→ 初期コストは小規模で、将来コスト削減効果が継続的。**均衡 OK**

## 4. Gate-A 判定

| 項目 | 結果 |
|---|---|
| Phase 4 への進行可否 | **GO** |
| ブロッカー | なし |
| 軽微な懸念 | なし |
| 残課題 | Phase 4 でテスト 4 ケースを設計、Phase 5 で SVG 入手元 URL を Google Identity 公式ページに固定 |

## 5. Phase 3 完了条件

- [x] 4 条件 verdict を提示
- [x] 命名規則整合 / 責務境界 / 因果と影響範囲 / リスク再評価 / 価値とコスト均衡を確認
- [x] Gate-A 判定を **GO** で確定

## 6. 次 Phase への引き継ぎ

Phase 4 では Gate-A 判定 GO を前提に、TC-EXEMPT-01..04 と `GoogleOAuthButton` の component test 更新、Playwright visual baseline 更新計画を TDD Red 視点で詳細化する。
