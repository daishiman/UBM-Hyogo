# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 7 (カバレッジ確認) |
| 次 Phase | 9 (品質保証) |
| タスク種別 | implementation / NON_VISUAL / implementation_mode: new |

## 目的

Phase 5-6 で landed した実装に対し、新規抽象化を増やさずに「重複削減・命名整合・型安全化」を行う。
変更は `対象 / Before / After / 理由` のテーブル形式で記録する（RT-03）。既存 tags batch（issue-224）と
fields batch の Map groupBy パターンを同型に揃え、`as never` キャストを `asResponseId` で型安全化する。

## リファクタリング方針（新規抽象化を増やさない）

本タスクは単一責務の N+1 解消であり、汎用 groupBy ユーティリティ等の新規抽象化は導入しない。
既存の tags batch ブロック（同 use-case 内 L78-92 相当）と同じ「ループ外 1 query → `Map` groupBy →
per-member lookup」の形を踏襲し、命名のみ整合させる。

## 変更記録（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| use-case の `current_response_id` 渡し（旧 L100-101） | `m.current_response_id as never`（per-member ループ内で `listFieldsByResponseId` に渡す際の逃げキャスト） | `asResponseId(m.current_response_id)`（ループ外で `responseIds` 配列を組み立てる際に適用） | `as never` は型安全性を失う逃げ。`asResponseId`（`@ubm-hyogo/shared` / `_shared/brand` 経由）で `ResponseId` に正しく brand 付与し型安全化 |
| fields 取得経路 | per-member ループ内 `await listFieldsByResponseId(ctx, ...)`（N+1） | ループ外 1 回の `listFieldsByResponseIds(ctx, responseIds)` + `Map<string, ResponseFieldRow[]>`（key=`response_id`）への groupBy | N+1 を 1 query 化。tags batch と同型のパターンに統一 |
| groupBy 変数命名 | （なし。per-member の `fields`） | `fieldsByResponseId`（Map）/ `responseIds`（配列） | tags 側 `tagsByMember` / `memberIds` と対になる命名で可読性・一貫性を確保 |
| per-member lookup | `fields`（その member 専用の取得結果） | `const fields = fieldsByResponseId.get(m.current_response_id) ?? []`（miss 時は空配列） | 旧ループの `byKey` 構築以降のロジックを不変に保ったまま、入力 `fields` の供給元のみ Map lookup に差し替え |

> `byKey` 構築 〜 `items.push(...)` のロジック（SUMMARY_KEYS フィルタ・`parseJsonString` / `parseJsonNullable`・
> tags 付与）は AC-4（出力不変）保護のため**一切変更しない**。

## 重複削減・整合の観点

| 観点 | 内容 |
| --- | --- |
| 重複削減 | tags batch（`memberIds` → `listTagsByMemberIds` → `tagsByMember` Map）と fields batch（`responseIds` → `listFieldsByResponseIds` → `fieldsByResponseId` Map）が同一構造になり、読み手が 1 つのパターンとして理解できる |
| 命名整合 | 配列 = `responseIds`、Map = `fieldsByResponseId`（key=`response_id`）。tags 側命名と対称 |
| 型安全化 | `as never` を全廃し `asResponseId` 採用。`ResponseId[]` を `listFieldsByResponseIds` のシグネチャに合わせる |
| helper シグネチャ整合 | `listFieldsByResponseIds(c, rids: ResponseId[]): Promise<ResponseFieldRow[]>` を `listTagsByMemberIds(c, mids: MemberId[])` と同型に保つ（空配列ガード → `placeholders` → フラット配列返却） |

## 実行タスク

1. use-case の `as never` キャストを除去し、`asResponseId(m.current_response_id)` でループ外に
   `responseIds: ResponseId[]` を構築する（`@ubm-hyogo/shared` から `asResponseId` を import）。
   完了条件: `apps/api/src/use-cases/public/list-public-members.ts` 内に `as never` が残っていない（grep 0 件）。
2. groupBy 変数を `fieldsByResponseId`（Map）/ `responseIds`（配列）に揃え、tags batch と同型構造にする。
   完了条件: 変数名が tags 側（`tagsByMember` / `memberIds`）と対称になっている。
3. `byKey` 構築以降のロジックが Before と完全一致であることを差分確認する（出力不変保護）。
   完了条件: `git diff` 上、`byKey` 以降の行に変更が入っていない。
4. 変更内容を `対象 / Before / After / 理由` テーブル（RT-03）として `outputs/phase-08/main.md` に記録する。
   完了条件: 上記テーブルが成果物に転記されている。
5. 新規抽象化（汎用 groupBy ユーティリティ等）を追加していないことを確認する。
   完了条件: 新規 export / 新規ファイルが repository helper 追加分（`listFieldsByResponseIds`）以外に無い。
6. リファクタ後に対象 vitest を再実行し緑を維持する。
   ```bash
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/api/src/repository/__tests__/responseFields.repository.spec.ts \
     apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
   ```
   完了条件: 2 spec 全緑。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/use-cases/public/list-public-members.ts | リファクタ対象（命名整合 / `as never` 除去） |
| 必須 | apps/api/src/repository/responseFields.ts | helper シグネチャ整合 |
| 必須 | apps/api/src/repository/memberTags.ts | tags batch 同型パターン（`listTagsByMemberIds`） |
| 必須 | apps/api/src/repository/_shared/brand.ts | `asResponseId` の所在 |
| 参考 | phase-07.md | カバレッジ実測で判明した未カバー分岐 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタリング主成果物（対象/Before/After/理由 テーブル + 整合観点） |
| メタ | artifacts.json | Phase 8 状態の更新（completed） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | カバレッジ実測の未カバー分岐をリファクタ判断に取り込む |
| Phase 9 | `as never` 全廃・命名整合の結果を最終 QA の grep チェックへ渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 変更内容が `対象 / Before / After / 理由` テーブル（RT-03）で記録されている
- [ ] `as never` が use-case から全廃され `asResponseId` に置換されている（grep 0 件）
- [ ] 変数命名が `fieldsByResponseId` / `responseIds` で tags 側と対称に整合している
- [ ] `byKey` 構築以降のロジックが Before と完全一致（出力不変保護）
- [ ] 新規抽象化（汎用ユーティリティ等）を追加していない
- [ ] リファクタ後も対象 2 spec が全緑

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が completed
- 成果物が `outputs/phase-08/main.md` に配置済み
- 対象/Before/After/理由 テーブルが残っている
- `as never` grep 0 件 / 命名整合が確認済み
- artifacts.json の `phases[7].status` が completed

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - `as never` 全廃・命名整合（`fieldsByResponseId` / `responseIds`）の結果
  - 単数 `listFieldsByResponseId` は温存（削除していない）
- ブロック条件:
  - `byKey` 以降に意図しない差分が混入している
  - リファクタで対象 spec が赤化した
