# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 8 / 13 |
| 前提 | Phase 7（カバレッジ確認）完了。全テスト GREEN |
| 原則 | 責務不変・テスト維持。過剰リファクタ禁止 |

## 目的

Phase 5 で GREEN になった実装の可読性・型安全性を、振る舞いを変えずに整える。`対象 / Before / After / 理由` の表形式（Feedback RT-03）で限定的に提示し、navigation drift と重複を削る。過剰なリファクタ（責務を跨ぐ抽象化・別ファイルへの移設）は行わない。

## 実行タスク

### T8-1 リファクタ候補（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| R1 | `apps/api/src/repository/publicMembers.ts:103-106` | ORDER BY を三項演算子（`recent`/`name` 2 値前提）で組み立て、`oldest`/`name_desc` 追加で三項のネストが深くなる | `switch (input.sort)` の 4 case + default に展開し、`fullNameExpr` を switch 直前で 1 度だけ定義して全 case で再利用（重複排除） | 4 分岐の三項ネストは可読性が低く分岐追加で破綻しやすい。switch は各 case が独立して読め、`fullNameExpr` 一元化で `COALESCE(json_extract(...))` の重複記述を 4 → 1 に削減 |
| R2 | `apps/web/src/components/public/MemberFilters.client.tsx:39-42` | `SORT_OPTIONS` の `value` が文字列リテラル型推論（`string`）で、4 値以外を書いてもコンパイルが通る | `value` を `MembersSearch["sort"]` 型で注釈し、4 値以外を型エラーにする（`SelectOption<MembersSearch["sort"]>[]` 相当の型付け。既存 `as` キャストは踏襲） | sort enum（3 層）と UI option の drift を型で防ぐ。`oldest`/`name_desc` の typo や enum 未同期がコンパイル時に検出される |

### T8-2 リファクタしない判断（過剰回避）

| 候補 | 不採用理由 |
|------|-----------|
| `SORT_VALUES`（web）/ `SortZ`（api）/ `viewmodel.sort` enum を単一定数へ集約 | 3 層は意図的に独立した契約境界（web URL 正規化 / api パーサ / shared viewmodel）。共有定数化は `packages/shared` への依存方向を変え責務境界（不変条件 #5）を曖昧にする。drift は Phase 9 の grep 突合で機械検知する方針が確定済み（phase-3 T3-1 整合性 PASS）。本タスクのスコープ拡大を避ける |
| `Search.tsx` の独自×ボタン抽出（別コンポーネント化） | 案件 A は `className` 1 行付与のみで責務不変。抽出は表現層の構造を変え既存 `Search.spec.tsx` の DOM contract を壊すリスク。価値なし |
| `globals.css` の `.ui-search__input` ルールを utility class 体系へ移設 | 追加は 1 ルールのみ。utility 化はトークン体系（tokens.css）への波及で OOS。最小追加に留める |

### T8-3 navigation drift / 重複の確認

- R1 適用後、ORDER BY 文字列の組み立てで `COALESCE(json_extract(r.answers_json, '$.fullName'), '')` 相当（`fullNameExpr`）が 1 箇所定義であることを確認する（grep で 1 hit）。
- R2 適用後、`SORT_OPTIONS` の `value` 4 値が `SortZ` の enum 4 値と文字列一致することを確認する（Phase 9 の grep 突合へ引き継ぐ）。
- リファクタによる import 追加は R2 の `MembersSearch` 型 import のみ。不要 import を増やさない。

### T8-4 振る舞い不変の保証

- R1/R2 適用後、Phase 4-6 の全テスト（`list-public-members.spec.ts` / `publicMembers.repository.spec.ts` / `MemberFilters.client.spec.tsx` 等）が GREEN を維持することを確認する。
- ORDER BY の生成 SQL 文字列が switch 化前後で同一（同一 sort 値に対し同一 SQL）であることを `publicMembers.repository.spec.ts` の順序アサーションで担保する。リファクタは出力を変えない。

## 参照資料

- [phase-2-design.md](phase-2-design.md)（T2-3 switch 設計スニペット / T2-4 SORT_OPTIONS）
- [phase-7-coverage-check.md](phase-7-coverage-check.md)（変更ブロック・ORDER BY 4 分岐到達）
- `apps/api/src/repository/publicMembers.ts:97-120`
- `apps/web/src/components/public/MemberFilters.client.tsx:39-42`
- `apps/web/src/lib/url/members-search.ts:9`（`MembersSearch` 型 / `SORT_VALUES`）
- Feedback RT-03（リファクタは 対象/Before/After/理由 表で提示）

## 成果物

- リファクタ候補表 R1/R2（T8-1）
- 不採用判断表（T8-2）
- 振る舞い不変の保証方針（T8-4）

## 統合テスト連携

リファクタ（ORDER BY 三項→switch・`fullNameExpr` 一元化）後に全 focused スイートを再実行し、結合挙動が不変であることを回帰確認する。責務境界（描画 / 順序計算 / 契約）が分離したまま統合スイートが GREEN を維持することを確認する。

## 完了条件

- [ ] R1（ORDER BY 三項→switch化 + `fullNameExpr` 一元化）が 対象/Before/After/理由 で記述されている
- [ ] R2（`SORT_OPTIONS.value` の `MembersSearch["sort"]` 型安全化）が記述されている
- [ ] sort 3 層を単一定数へ集約しない判断（責務境界維持）が明記されている
- [ ] リファクタが責務不変・既存テスト GREEN 維持であることが明記されている
- [ ] `fullNameExpr` の重複が 4→1 に削減されることが確認方針として記述されている
