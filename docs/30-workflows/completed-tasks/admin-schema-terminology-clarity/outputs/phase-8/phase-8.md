# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 8 / 13（リファクタリング） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

Phase 5〜7 で日本語化した表示文字列群について、重複削減・命名整合・navigation drift 検査の3観点でリファクタリング方針を確定する。本タスクは表現層の文字列置換に閉じるため、共通化は最小限に留め、過剰な抽象化（小規模文言の定数化）を避けることを設計判断として明文化する。

## 実行タスク

- 重複文字列を棚卸しする。「最新版」（page.tsx `CurrentRevisionCard` :40-42 と `RevisionAndAliasHistory` :105 の2箇所）、「適用中」（`Chip` 内 :44 と :107 の2箇所）、「対応づけの記録」（page.tsx :120・SchemaDiffPanel :335-336・SchemaHistoryPurposeExplainer :15 の3箇所）、「項目キー」（SchemaDiffPanel :266-273・BulkResolveModal table header・HistoryPanel aria-label の複数箇所）の出現箇所を記録する。
- 重複文字列を定数化すべきか判断する。各文字列は2〜3箇所の出現に留まり、表示文脈（カード見出し / Chip / aria-label）が異なるため、定数化は **行わない**（インライン日本語リテラルを維持する）。理由を下表「変更内容テーブル」に明記する。
- navigation drift がないことを検査する。`shell-config.ts:64` の `href: "/admin/schema"`・page.tsx breadcrumb の `href`・testid `admin-kpi-card-schema` が一切変更されていないことを grep で確認する。
- 命名整合を検査する。内部識別子（`revisionId` `stableKey` `aliasQuestionId` `batchId`）が変数名・型名・data 属性・API フィールドとして不変であり、表示文字列のみが日本語化されていることを確認する。
- `formatJstDate` helper（[shared-context.md §3](../../shared-context.md)）が `formatJstDateTime` と命名規則整合（`formatJst` プレフィックス・fail-soft 空文字返却）し、既存 helper と重複実装になっていないことを確認する。
- 本タスクの変更が新規スタイル・新規 primitive を生やしていないこと（既存 `Chip` / `AdminPageHeader` / `Card` 再利用のみ）を確認する。

## 参照資料

- [shared-context.md §2 用語リネーム正本テーブル](../../shared-context.md)
- [shared-context.md §3 新規 helper（formatJstDate）](../../shared-context.md)
- [shared-context.md §4 変更対象ファイル一覧](../../shared-context.md)
- [shared-context.md §5 不変条件](../../shared-context.md)

## 成果物

### 変更内容テーブル（リファクタリング判断記録）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| 「最新版」リテラル（page.tsx :40-42 / :105） | 生 revisionId 表示 | 各箇所インライン `"最新版"` | 出現2箇所・カード見出しと履歴行で文脈が異なるため定数化せずインライン維持 |
| 「適用中」Chip（page.tsx :44 / :107） | `active` | 各箇所インライン `"適用中"` | 出現2箇所・Chip 内短文のため定数化のコストが利得を上回る。インライン維持 |
| 「対応づけの記録」（page.tsx :120 / SchemaDiffPanel :335-336 / HistoryPurposeExplainer :15） | `ALIAS HISTORY` 等 | 各箇所インライン `"対応づけの記録"` | 出現3箇所だが eyebrow / h2 / eyebrow と用途が異なる。SSOT 化すると用語集 SSOT（schemaGlossary.ts）と責務が二重化するため定数化しない |
| 「項目キー」（SchemaDiffPanel DL / BulkResolveModal header / HistoryPanel aria-label） | `stableKey` | 各箇所インライン `"項目キー"` | 用語集 SSOT（schemaReviewTerms.ts）が技術名併記の正本。表示ラベルは文脈ごとにインライン維持し用語集と二重管理を避ける |
| `formatJstDate` helper | 不在 | `datetime.ts` に追加 | `formatJstDateTime` と同一モジュール・同一命名規則。日付のみ整形は別関数として分離（責務分割） |

### リファクタリング結論

- **定数化は行わない**。理由: 各重複文字列は2〜3箇所・短文・文脈差ありで、定数化すると用語集 SSOT（schemaGlossary.ts / schemaReviewTerms.ts）との責務二重化を招く。用語の正本は用語集 SSOT に閉じ、画面表示はインライン日本語リテラルを維持する。
- **新規 helper は `formatJstDate` のみ**。既存 `formatJstDateTime` は不変・重複実装なし。
- **navigation drift なし**。href / testid / data 属性 / 型名 / 変数名は全て不変。

## 統合テスト連携

- `grep -rn 'href.*"/admin/schema"' apps/web/src apps/web/app` で href 不変を機械確認する（Phase 9 grep gate に含める）。
- `grep -rn 'admin-kpi-card-schema' apps/web` で testid 不変を確認する。
- focused vitest（T2〜T4 Sidebar 系）で nav label 変更時に href / badge が不変であることを assert する。

## 完了条件

- [ ] 重複文字列の棚卸し結果が変更内容テーブルに記録されている
- [ ] 定数化しない判断と理由が明記されている
- [ ] navigation drift なし（href / testid 不変）が確認項目として定義されている
- [ ] `formatJstDate` が命名整合・重複実装なしと確認されている
- [ ] 新規スタイル・新規 primitive を生やしていないことが確認されている
