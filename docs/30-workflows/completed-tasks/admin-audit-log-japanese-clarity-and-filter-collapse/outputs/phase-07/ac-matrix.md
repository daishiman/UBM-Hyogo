# Phase 7 — AC × テスト/検証手段 トレーサビリティマトリクス（ac-matrix.md）

> AC-1〜AC-12 × テスト（TC / TC-E）または grep gate の 1:1 対応表。各 AC が「テストで担保 / gate で担保」のどちらかを明示する。
> [Feedback BEFORE-QUIT-002]: カバレッジ・検証対象は **本タスクで変更したファイル / ブロック**に限定する（`auditGlossary.ts` / `AuditLogPanel.tsx` / `AuditLogCard.tsx` / `auditAppliedFilters.ts` / `globals.css` の `.admin-audit-*` ブロック）。

## トレーサビリティ表

| AC | 内容（要約） | 担保手段 | テスト / gate | 担保区分 | 実装ファイル |
| --- | --- | --- | --- | --- | --- |
| AC-1 | フィルタ全ラベル日本語化・name は英語不変 | テスト + grep | AuditLogPanel.spec（日本語 label 描画）+ `grep name="action"` 等 8 個維持 | テスト + gate | AuditLogPanel.tsx / auditGlossary.ts |
| AC-2 | フィルタ 2 層・詳細に値あれば details open | テスト | TC-E-07（全空→閉）/ TC-E-08（値あり→開）/ 正常系（2 層構造存在） | テスト | AuditLogPanel.tsx |
| AC-3 | カードの action/targetType 日本語・未登録 fallback | テスト | TC-E-01/02/03/04 + 正常系（登録済→日本語） | テスト | AuditLogCard.tsx / auditGlossary.ts |
| AC-4 | チップ label/value 日本語・英語キー名ゼロ | テスト | TC-E-05（空）/ TC-E-09（英語キー名ゼロ）+ 正常系 | テスト | auditAppliedFilters.ts / auditGlossary.ts |
| AC-5 | datalist placeholder / auditId ラベル英語解消 | テスト | AuditLogPanel.spec（placeholder 日本語）/ AuditLogCard.spec（「ログID」表示） | テスト | AuditLogPanel.tsx / AuditLogCard.tsx |
| AC-6 | glossary に 3 マップ + 3 helper + raw fallback | テスト | auditGlossary.spec（マップ存在 + helper 戻り値 + fallback） | テスト | auditGlossary.ts |
| AC-7 | カードブロック整列（chip wrap / glossary / meta グリッド） | 構造アサート + 視覚 | クラス付与アサート（jsdom）+ Phase 11 screenshot | テスト（構造）+ 手動（視覚） | globals.css |
| AC-8 | 全色 OKLch トークン・HEX ゼロ | grep gate | `pnpm verify:tokens` + `grep -nE "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" globals.css`（追加ブロック 0 件） | gate | globals.css |
| AC-9 | API/D1/Form/shared 型変更ゼロ・query param キー不変 | grep gate | `git diff --name-only -- apps/api packages/shared` 空 + `grep name=` 8 個維持 | gate | （全変更ファイル表現層に閉じる） |
| AC-10 | 新規 primitive ゼロ | grep gate | `git status --porcelain apps/web/src/components/ui/` 新規 0 件 | gate | （既存 FormField/Input/Select/Chip + ネイティブ details 再利用） |
| AC-11 | a11y 維持（FormField label / details キーボード / aria-label / コントラスト） | 構造アサート + 手動 | FormField label 関連付けアサート + `aria-label="現在の絞り込み条件"` 維持アサート + Phase 11 手動（キーボード/コントラスト） | テスト（構造）+ 手動 | AuditLogPanel.tsx / globals.css |
| AC-12 | 既存挙動温存（検索/リセット/ページ/PII/JSON/エラー） | 構造アサート + 手動 | DOM contract アサート（form action / Link href / Pagination / details 開示 / testid 維持）+ Phase 11 手動 | テスト（構造）+ 手動 | AuditLogPanel.tsx / AuditLogCard.tsx |

## 担保区分サマリ

| 区分 | AC |
| --- | --- |
| テストで担保（主） | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 |
| テスト（構造）+ 手動/視覚 | AC-7, AC-11, AC-12 |
| grep gate で担保 | AC-8, AC-9, AC-10 |

## 未カバー AC 確認

- **未カバー AC = 0 件**。AC-1〜AC-12 すべてがテスト（TC / TC-E）または grep gate にマップされ、空セルは存在しない。
- AC-7 / AC-11 / AC-12 の「視覚 / キーボード / コントラスト」部分は jsdom で検証不可のため Phase 11 手動テストで担保し、構造（クラス付与 / DOM contract / aria 属性）は vitest で担保する二段構成とする。

## 範囲限定の明記（[Feedback BEFORE-QUIT-002]）

- 本マトリクスの検証・カバレッジ対象は **本タスクで変更したファイル / ブロックに限定**する。監査ログ以外の admin 画面、`globals.css` の `.admin-audit-*` 以外のブロック、`apps/api` は検証対象外（変更しないため diff ゼロを gate で確認するのみ）。
