# Phase 1: 要件定義

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。

## 1.1 タスク分類（Feedback 1 / Feedback 3）

| 項目 | 値 |
| --- | --- |
| タスク分類 | **docs/code refactoring task（NON_VISUAL）** |
| 実装区分 | **[実装区分: 実装仕様書]**（CONST_004 デフォルト） |
| UI task / docs-only task | どちらでもない（内部リファクタ・UI 非接触） → Phase 11 は NON_VISUAL |
| implementation_mode | `new`（既存コードを shared import へ切替える実コード変更） |

## 1.2 真の論点（要件レビュー思考法・一次結論）

1. **真の論点**: 公開検索 query 正規化規約が web/api で二重定義され drift する。規約の**所有権を `packages/shared` に一本化**する。
2. **依存・責務境界**: 規約（値集合・制限・正規化アルゴリズム）の所有権 = shared。受信形式→app DTO 適用 = 各 app。D1 アクセスは apps/api 限定を維持。
3. **価値とコストの不均衡**: 価値 = drift 起因 silent bug の根絶（低コスト・高効果）。コスト最大部品 = 既存 contract を壊さない切替（回帰テストで担保）。
4. **改善優先順位**: ① shared SSOT 新規（Lane A）→ ② api 切替（Lane B）→ ③ web 切替（Lane C）。
5. **4条件**: 価値性=drift 解消／実現性=小規模 1PR／整合性=責務境界明確／運用性=既存テスト緑で回帰保証。

## 1.3 issue #222 調査結果（現コードへの最適化が必要な根拠）

| 確認 | 結果 |
| --- | --- |
| parser は shared へ移設済みか | **否**。`apps/api/src/_shared/search-query-parser.ts` に現存 |
| completed-tasks doc の実態 | 本文「ステータス: 未実施」。doc 移動のみで実コード未着手（commit 562c61091 で移動） |
| 着手条件（06a 到達）| **到達済**。`apps/web/src/lib/url/members-search.ts` が存在し重複が現実化 |
| issue AC-3「400」 | **古い**。現コードは `z.catch()`/`clamp` で silent fallback（200）。これが現行正仕様 |
| 他タスクで解決済みか | 否。`grep ZONE_VALUES packages/shared` ヒット0・他ブランチ対応なし |

→ **結論**: issue は未解決・実装が必要。ただし原案（parser 全体移設＋薄ラッパ＋400）は現コードに不適合。**共通プリミティブ抽出**へ最適化する（SSOT §1.2）。

## 1.4 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No（spec 作成のみ） | 通常の実装 Phase（Phase 5）とする |
| upstream にマージ済み | No | 未マージとして扱う |
| 前提タスク（06a 公開ディレクトリ）完了済み | Yes（members-search.ts 存在） | 依存解消済み・着手条件 met |

## 1.5 既存コードの命名規則分析（FB-01 / FB-SDK-07-4）

| 観点 | 既存規則 | 本タスクの命名 |
| --- | --- | --- |
| 定数 | UPPER_SNAKE（`TAG_LIMIT` / `ZONE_VALUES`） | `PUBLIC_MEMBER_ZONE_VALUES` 等（prefix で admin/search と衝突回避） |
| zod schema | PascalCase + `Z` 接尾（`SortZ` / `DensityZ`） | `PublicMemberSortZ` / `PublicMemberDensityZ` |
| 純関数 | camelCase 動詞始まり（`normalizeQ` / `clampLimit`） | `normalizePublicMemberQ` / `clampPublicMemberLimit` |
| ファイル | kebab-case（`search-query-parser.ts`） | `search-query-primitives.ts` |
| package import | `@ubm-hyogo/shared` workspace + subpath（`/browser-storage`） | `@ubm-hyogo/shared/public-search` subpath |

> **FB-W0-01 厳守**: root barrel（`src/index.ts` の `export *`）に追加すると `SortZ` 等が `admin/search` / `zod` と衝突しうる。**subpath export に閉じる**。

## 1.6 スコープ・受入条件・不変条件

スコープ（含む/含まない/先送り 0 件）は SSOT §2、受入条件（AC-1〜AC-7）は SSOT §4、不変条件は SSOT §7 を正本とする。

## 1.7 targeted test ファイルリスト（FB-UI-02-2: 全件 test 回避）

```
packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts   # 新規
apps/api/src/_shared/__tests__/search-query-parser.spec.ts                     # 既存・回帰
apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts            # 既存・回帰
apps/web/src/lib/url/__tests__/members-search.spec.ts                          # 既存・回帰
```

## 1.8 carry-over 確認

`git log --oneline -5` の直近コミットは本タスクと無関係（admin sidebar / members zone search / public home card）。本タスクの新規作業は public-search shared primitives 抽出に限定。

## 完了条件

- [x] タスク分類（NON_VISUAL refactoring）を記録
- [x] issue 調査結論（未解決・現コード最適化方針）を確定
- [x] 命名規則・subpath export 方針を確定
- [x] スコープ・AC・不変条件を SSOT に固定
