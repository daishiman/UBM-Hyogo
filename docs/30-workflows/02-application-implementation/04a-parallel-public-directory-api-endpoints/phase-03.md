# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（テスト戦略） |
| 状態 | pending |

## 目的

simpler alternative と現案を比較し、PASS / MINOR / MAJOR を判定。leak 防止 / N+1 / form-preview の整合 / 検索 SQL の設計選択をレビュー。

## 実行タスク

1. alternative を 4 案以上列挙。
2. trade-off matrix。
3. leak 防止戦略の二重チェック設計を確認。
4. リスク R-1〜R-8 を整理。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計案 |
| 必須 | outputs/phase-01/main.md | scope / AC |
| 参考 | doc/00-getting-started-manual/specs/12-search-tags.md | 検索仕様 |
| 参考 | doc/00-getting-started-manual/specs/04-types.md | view model |

## 実行手順

### ステップ 1: alternative
- A: 採用案（router → use-case → repository、view 層で leak 二重チェック）
- B: handler 直 SQL（simple だが leak チェックが分散しやすい）
- C: GraphQL（過剰、MVP 不要）
- D: SSR で apps/web から D1 直接（不変条件 #5 違反）
- E: Edge cache 全 endpoint で 60s TTL（admin 同期反映遅延）

### ステップ 2: trade-off matrix
- 後述参照。

### ステップ 3: leak 二重チェック
- SQL where + view model filter の二重で leak を防ぐ。test fixture に「不適格 6 通り」を入れて contract test で 0 件を assert。

### ステップ 4: リスク
- R-1 leak: SQL where 漏れ → view model 二重チェックで補完
- R-2 N+1: 1 member につき response_fields × N → 詳細 endpoint は 1 query で取得（join 1 回）
- R-3 検索性能: LIKE のスキャン → MVP 規模では許容
- R-4 form-preview と admin sync 不整合: ETag 出さない場合は最終手段として client refresh
- R-5 pagination 暴走: limit 上限 100 で clamp
- R-6 不正 query: zod safeParse + default fallback
- R-7 sync_jobs の status 取り違え: kind を必ず whitelist
- R-8 admin notes 混入: converter で delete 必須

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | リスクごとに test ケース化 |
| Phase 6 | failure cases に R-1〜R-8 反映 |
| Phase 9 | 無料枠 / cache の検討 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| leak 防止 | #2 #3 #11 | SQL + view 二重 |
| 直書き禁止 | #1 | form-preview 動的構築 |
| apps/api | #5 | apps/web から D1 直接禁止 |
| 無料枠 | #10 | cache 戦略決定 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 列挙 | 3 | pending | 5 案 |
| 2 | trade-off matrix | 3 | pending | コスト / 価値 |
| 3 | leak 二重チェック設計 | 3 | pending | SQL + view |
| 4 | R-1〜R-8 整理 | 3 | pending | リスク |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビュー |
| メタ | artifacts.json | phase 3 を `completed` |

## 完了条件

- [ ] alternative 5 案
- [ ] trade-off 表
- [ ] リスク R-1〜R-8

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] PASS / MINOR / MAJOR 判定
- [ ] leak 二重チェックが採用設計
- [ ] artifacts.json の phase 3 が `completed`

## 次 Phase

- 次: 4（テスト戦略）

## alternative 一覧

| 案 | 内容 | 価値 | コスト | 採否 |
| --- | --- | --- | --- | --- |
| A | router → use-case → repository → view（leak 二重チェック） | 責務明確、test しやすい | 中 | 採用 |
| B | handler 直 SQL | simple | leak チェック分散 | 不採用 |
| C | GraphQL | flexible | 過剰 | 不採用 |
| D | apps/web から D1 直 | 1 hop 削減 | #5 違反 | 不採用 |
| E | Edge cache 60s 全 endpoint | response 早い | admin sync 反映遅延 | 部分採用（stats は 60s、members / profile は cache off） |

## trade-off

| 項目 | A | B | E |
| --- | --- | --- | --- |
| leak 防止 | 二重 | 単重 | 単重 |
| 性能 | 中 | 高 | 高 |
| test 容易性 | 高 | 中 | 高 |
| 保守 | 高 | 低 | 中 |

## リスク

| ID | 内容 | 緩和 |
| --- | --- | --- |
| R-1 | SQL where 漏れで leak | view 二重 |
| R-2 | N+1 | 詳細 endpoint は join 1 回 |
| R-3 | 検索 LIKE 性能 | MVP 数百で許容、INDEX を後付検討 |
| R-4 | form-preview / admin 不整合 | client refresh、ETag は Phase 9 |
| R-5 | pagination 暴走 | limit 上限 100 clamp |
| R-6 | 不正 query | zod + default fallback |
| R-7 | sync_jobs status 取り違え | kind whitelist |
| R-8 | adminNotes 混入 | converter で delete |

## PASS / MINOR / MAJOR

- PASS: 採用設計 A + 部分 E（stats のみ 60s cache）
- MINOR: form-preview の整合は 06a で client 側 refresh / 条件を満たす場合は admin manual。
- MAJOR: なし
