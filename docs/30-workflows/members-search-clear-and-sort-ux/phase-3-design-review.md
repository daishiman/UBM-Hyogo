# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 3 / 13 |
| ゲート | Phase 4 へ進めるかを判定する |

## 目的

Phase 1-2 の設計を 4 条件（価値性 / 実現性 / 整合性 / 運用性）で検証し、Phase 4（テスト作成）への進行可否を判定する。

## 実行タスク

### T3-1 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | 非エンジニア会員の検索 UI 混乱（×2 つ）を解消し、探索手段（古い順 / 名前の逆順）を増やす。コストは 7 ファイル編集 + 既存テストへの契約追加 |
| 実現性 | PASS | 既存プリミティブ（Search / Select / SortZ / ORDER BY）の最小拡張で完結。新規エンドポイント・schema 変更なし。1 サイクルで完了（CONST_007） |
| 整合性 | PASS | sort enum 3 層同期で契約が閉じる。描画 / 順序計算 / 契約の責務境界が分離。D1 アクセスは apps/api に閉じる（不変条件 #5） |
| 運用性 | PASS | sort 値はバイナリ順で決定的・タイブレーク member_id ASC。CSS は色値なしで verify-design-tokens 非抵触。jsdom 制約は VISUAL で補完 |

### T3-2 リスクと対策

| リスク | 対策 |
|--------|------|
| sort 3 層のうち 1 層欠落 → API レスポンス検証 fail | Phase 5 で 3 層を same-wave 編集。Phase 9 で enum 一致を grep 確認 |
| クライアント反転誤設計（ページ内のみ反転） | ORDER BY を API 側で拡張する設計を Phase 2 で確定済み。UI 側反転ロジックは作らない |
| `name`/`name_desc` を五十音順と誤認 | UI ラベル「名前順 / 名前の逆順」は方式中立。五十音順非対応を index.md / Phase 12 に明記し OOS-1 で未タスク化 |
| ネイティブ×抑止が他ブラウザ（Firefox 等）に無効 | Firefox/Safari は `type="search"` でネイティブ×を出さない。問題は Chromium 系のみ。独自×は全ブラウザ共通で残る → 全ブラウザで×は最大 1 つ |
| jsdom が CSS 非評価でネイティブ×非表示を検証できない | Phase 11 VISUAL（Chromium）で実描画を確認。ユニットは独自×が 1 つ・class 付与を検証 |

### T3-3 既存テスト破壊リスクの確認

- `Search.spec.tsx` / `MemberFilters.client.spec.tsx` / `members-search.spec.ts` / `search-query-parser.spec.ts` / `list-public-members.spec.ts` は既存。sort enum 拡張は既存値（recent/name）を保持するため後方互換。ラベル文言変更（接頭辞除去）に依存する既存アサーションがあれば Phase 5 で同期更新する。

### T3-4 判定

- 判定: **PASS（Phase 4 へ進行可）**。
- ブロッカー: なし。
- 条件付き事項: Phase 5 で sort 3 層 same-wave 編集を厳守すること。

## 参照資料

- phase-1-requirements.md（inventory）
- phase-2-design.md（CSS / sort / ORDER BY 設計）
- task-specification-creator FB-SDK-07-4（命名一貫性）

## 成果物

- 4 条件評価表（T3-1）
- リスク対策表（T3-2）
- 進行判定 PASS（T3-4）

## 統合テスト連携

ゲート通過の前提として、既存統合スイート（`Search.spec.tsx` / `MemberFilters.client.spec.tsx` / `members-search.spec.ts` / `search-query-parser.spec.ts` / `list-public-members.spec.ts`）が sort enum 拡張後も非破壊であることを Phase 5-6 で確認する。既存 D1 contract（T7）と shared（T6）を統合スイートへ追加する設計が確定していることをレビュー対象とする。

## 完了条件

- [ ] 4 条件すべて PASS
- [ ] sort 3 層同期リスクへの対策が明記されている
- [ ] 五十音順誤認リスクへの対策（ラベル中立 + OOS-1）が明記されている
- [ ] Phase 4 進行判定が記録されている
