# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 1 / 13（要件定義） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 実装区分 | 実装仕様書（コード変更を伴う） |
| implementation_mode | new |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

`/admin/schema`（スキーマ差分のレビュー）とその波及先で、非エンジニア管理者に表示される「スキーマ」「stableKey」「resolve」「revision」「CURRENT REVISION」「Bulk Resolve」等のエンジニア用語・英語表記を、平易な日本語へ統一する。あわせて「CURRENT REVISION」に出る意味不明な内部 revisionId 生表示（例 `000000…` + active バッジ）を隠し、人が読める表記に置換する。これにより管理者が「何をする画面か」「表示番号が何か」を直感的に理解できるようにする。

## 実行タスク

1. 既存コードの命名規則を記録する: 表示文字列は日本語、内部識別子は camelCase（`stableKey` `revisionId` `aliasQuestionId`）、testid は kebab-case（`admin-kpi-card-schema`）。**本タスクは表示文字列のみ変更し、内部識別子・testid・href・API フィールドは不変**とする。
2. スコープを「`apps/web` 表現層のみ」に固定する。API / D1 / Google Form / endpoint surface は CLAUDE.md invariant #5 に従い変更しない。
3. ユーザー確定方針を固定する（[shared-context.md §1](../../shared-context.md) 参照）: 新名称=「フォーム項目の対応づけ」、英語表記=原則日本語のみ（用語集カード内のみ技術名併記）、revisionId=生 ID 非表示。
4. 変更対象ファイルを inventory 化する（[shared-context.md §4](../../shared-context.md)）: 実装12ファイル + テスト最大6 + Playwright 5（後者は本サイクル非実行だが同 wave 更新）。用語集 SSOT 3ファイルは技術名併記を残すため据置。
5. タスク分類を `UI task` として記録し、Phase 11 を VISUAL（local evidence captured / staging screenshot pending）として扱うことを確定する。
6. 「CURRENT REVISION の 000000」の正体を確定: `page.tsx:30,41` の `diff.items[0]?.revisionId` 生表示。これは取り込んだフォーム構成の内部版 ID であり、ユーザーには意味がないため非表示にする（データ自体は保持）。

## 参照資料

- [shared-context.md](../../shared-context.md) — 設計 SSOT・用語リネーム正本テーブル
- `apps/web/app/(admin)/admin/schema/page.tsx` — 改修対象メインページ
- `apps/web/src/components/admin/schemaGlossary.ts` / `schemaReviewTerms.ts` — 用語集 SSOT（技術名併記を残す）
- CLAUDE.md invariant #5（D1 直接アクセス禁止 / API surface 不変）
- CLAUDE.md「UI prototype alignment」invariant #1（既存 API のみ接続）・#2（OKLch トークン正本）

## 成果物

- 本 Phase 1 要件定義（スコープ・分類・命名規則記録）
- 変更対象ファイル inventory（shared-context.md §4 に集約）
- 受入条件（下記）

### 受入条件（AC）

| AC | 内容 |
|----|------|
| AC-1 | サイドバー label が「スキーマ」→「フォーム項目」（href `/admin/schema` 不変） |
| AC-2 | ページ見出しが「フォーム項目の対応づけ」、パンくず「管理 / フォーム項目」 |
| AC-3 | CURRENT REVISION カードに生 revisionId / hash が描画されず、「最新版 ●適用中（取得: 日本語日付）」表示 |
| AC-4 | REVISIONS / ALIAS HISTORY セクションの英語 eyebrow が日本語化、生 revisionId 非表示、`diff items`→`件の変更点` |
| AC-5 | SchemaDiffPanel の Bulk Resolve / Bulk Rollback / DIFF ITEMS / resolve 履歴 / DL ラベル / toast が日本語化 |
| AC-6 | Bulk Resolve/Rollback モーダルの見出し・table header が日本語化（questionId→設問の元ID 等） |
| AC-7 | history ページ・HistoryPanel・HistoryPurposeExplainer の英語表記が日本語化 |
| AC-8 | ダッシュボード SchemaAlertCard / KpiGrid の文言が日本語化（testid 不変） |
| AC-9 | 用語集カード内のみ「項目キー（技術名: stableKey）」形式の技術名併記を維持 |
| AC-10 | `formatJstDate` helper 追加（fail-soft・既存 formatJstDateTime 不変） |
| AC-11 | API / D1 / Form 非接触（`git diff --quiet -- apps/api`） |

## 統合テスト連携

- focused vitest（`page.spec.tsx` / Sidebar 系 / SchemaDiffPanel component spec / SchemaAlertCard spec）で表示文字列の新旧を検証する。
- `verify:tokens` で HEX 直書き 0 を保証（本タスクはスタイル非変更だが回帰確認）。
- `git diff --quiet -- apps/api` を統合 gate として API 非接触を機械確認する。
- Playwright（staging visual）は Phase 11 / Phase 13 で user-gated として扱い、本サイクルでは spec 文字列の同 wave 更新のみ行う。

## 完了条件

- [ ] スコープが「apps/web 表現層のみ」に固定されている
- [ ] ユーザー確定方針（新名称・英語表記・revisionId）が記録されている
- [ ] 変更対象ファイル inventory が shared-context.md §4 に揃っている
- [ ] AC-1〜AC-11 が定義されている
- [x] タスク分類 UI task / VISUAL（implemented_local_evidence_captured）が記録されている
