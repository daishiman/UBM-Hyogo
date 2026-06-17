# メンバー一覧 キーワード検索クリア×重複修正 + 並べ替え選択肢拡張 UX 改善

> 実装区分: **実装仕様書**（コード変更を伴う。CONST_004 デフォルト）
> 対象画面: 公開メンバー一覧 `/(public)/members`（staging 報告ベース）

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| slug | members-search-clear-and-sort-ux |
| canonical_root | docs/30-workflows/members-search-clear-and-sort-ux |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| implementation_mode | new |
| branch | feat/members-search-clear-and-sort-ux |
| base ブランチ | dev |

## 背景と真因（ユーザー報告 2 件）

staging `/members` にて以下 2 件の報告を受けた。1 報告に独立した 2 案件が含まれるため切り分ける。

### 案件 A: キーワード検索ボックスに「×（クリアボタン）」が 2 つ表示される

- **真因**: 共通プリミティブ `apps/web/src/components/ui/Search.tsx` の `<input type="search">`（`Search.tsx:35`）がブラウザネイティブのクリアボタン（`::-webkit-search-cancel-button`）を自動描画し、かつ同コンポーネントが独自のクリア（×）ボタン（`Search.tsx:43-51`）を重ねて描画している。`::-webkit-search-cancel-button` を抑止する CSS が `apps/web/src/styles/globals.css` / `tokens.css` に存在しない（grep 0 件）ため両方が同時表示される。
- **責務**: apps/web 表現層のみ。API / D1 / Google Form は無罪。
- **方針**: IME 安全なクリア処理（`useImeSafeInput` の `commitNow("")`）と `aria-label="クリア"` を持つ**独自×ボタンを正本として残し**、ネイティブ× を CSS で抑止する。独自ボタンを削除しない理由は IME composition 中の安全な空文字 commit とアクセシビリティラベルを保持するため。

### 案件 B: 並べ替えの選択肢を 4 種に拡張（新しい順 / 古い順 / 名前順 / 名前の逆順）

- **現状**: ソート選択肢は `recent`（新着順）/ `name`（名前順）の 2 値のみ（`MemberFilters.client.tsx:39-42`, `members-search.ts:9`, `search-query-parser.ts:7`, `viewmodel.ts:158`）。
- **要望**: 「新しい順 / 古い順 / 名前順 / 名前の逆順」の 4 種を直感的なラベルで提供する。
- **設計判断（重要）**: 一覧はページネーション（`limit` 既定 24・page ベース）されているため、クライアント側でのページ内反転は**全体順序が壊れる**（ページ内だけ反転される）。よって `oldest` / `name_desc` は**既存エンドポイント `/public/members` の `ORDER BY` を拡張**する（新規エンドポイント追加ではなく、既存 API の sort 値拡張）。これは CONST_004 の「目的達成にコード変更（apps/api 含む）が必要」ケースに該当する。
- **責務**: apps/web（UI 選択肢・URL 正規化）+ apps/api（sort enum・ORDER BY）+ packages/shared（appliedQuery.sort enum）。

### ユーザー確定事項（AskUserQuestion ×2 ラウンド）

| 論点 | 確定 |
|------|------|
| ソートラベル | シンプル案: `新しい順` / `古い順` / `名前順` / `名前の逆順`（現状の冗長な「並び替え: 」接頭辞は除去。FormField 見出しが既に「並び替え」） |
| デフォルトソート | `新しい順`（`recent`・現状維持） |
| 名前順の並び順 | 文字コード順（`fullName` ASC/DESC）のまま進める。**ふりがなデータが無いため真の五十音順は今回不可**。この事実を UI/仕様に明記 |
| 五十音順対応（ふりがな追加） | **未タスク（Issue）として記録**。Google Form schema 変更 + 全会員 backfill が必要で今回サイクル外（CONST_007 正当分離: 外部 schema 依存） |

## ソート値マッピング（正本）

| value | UI ラベル | ORDER BY（apps/api） | 区分 |
|-------|----------|----------------------|------|
| `recent` | 新しい順 | `last_submitted_at DESC, fullName ASC, member_id ASC` | 既存・default |
| `oldest` | 古い順 | `last_submitted_at ASC, fullName ASC, member_id ASC` | **新規** |
| `name` | 名前順 | `fullName ASC, member_id ASC` | 既存 |
| `name_desc` | 名前の逆順 | `fullName DESC, member_id ASC` | **新規** |

> `fullName` は `COALESCE(json_extract(r.answers_json, '$.fullName'), '')`。五十音順ではなく Unicode 文字コード順。

## スコープ

### 含む（今回 1 サイクルで完了 — CONST_007）

1. 案件 A: `Search.tsx` の×重複解消（独自×保持 + ネイティブ× CSS 抑止）
2. 案件 B: `oldest` / `name_desc` ソート 2 値を apps/web + apps/api + packages/shared に追加し、UI ラベルを 4 種に刷新

### 含まない（スコープ外・別タスク）

- **OOS-1（未タスク Issue 化）**: ふりがな（よみがな）設問追加による真の五十音順ソート。Google Form schema 変更 + backfill が必要。Phase 12 `unassigned-task-detection.md` で current 未タスクとして formalize し Issue 起票候補とする。
- OOS-2: 他画面（admin 一覧等）の検索×重複。本タスクは公開 `/members` の共通 `Search` プリミティブ修正で全 search input に波及するが、検証範囲は公開 `/members` に限定。
- OOS-3: ソートのアクセシビリティ強化（ライブリージョン読み上げ等）は baseline。

## Phase 一覧

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・受入条件・命名規則・inventory |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（CSS 抑止戦略 / sort enum 拡張 / レーン） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビューゲート |
| 4 | [phase-4-test-creation.md](phase-4-test-creation.md) | テスト作成（RED） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装（GREEN） |
| 6 | [phase-6-test-expansion.md](phase-6-test-expansion.md) | テスト拡充（fail path / 回帰） |
| 7 | [phase-7-coverage-check.md](phase-7-coverage-check.md) | カバレッジ確認 |
| 8 | [phase-8-refactoring.md](phase-8-refactoring.md) | リファクタリング |
| 9 | [phase-9-quality-assurance.md](phase-9-quality-assurance.md) | 品質保証（tokens / lint / parity） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビューゲート |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト（VISUAL 3 層評価） |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント更新・spec sync・未タスク |
| 13 | [phase-13-pr-creation.md](phase-13-pr-creation.md) | PR 作成（user 明示承認後のみ） |

## 受入条件（AC）

| ID | 受入条件 |
|----|---------|
| AC-1 | 検索ボックスに表示されるクリア（×）は 1 つだけ（ネイティブ× が CSS 抑止され、独自×のみ表示） |
| AC-2 | 独自×は値が空のとき非表示、値があるとき表示。クリックで IME 安全に空文字 commit され、`aria-label="クリア"` を保持 |
| AC-3 | ソート選択肢が 4 種（新しい順 / 古い順 / 名前順 / 名前の逆順）、ラベルから「並び替え: 」接頭辞が除去されている |
| AC-4 | `oldest` 選択時、`last_submitted_at` 昇順（最も古い更新が先頭）で全件順序が正しい（ページ跨ぎで一貫） |
| AC-5 | `name_desc` 選択時、`fullName` 降順で並ぶ |
| AC-6 | 不正な sort 値は `recent` にフォールバック（apps/web zod catch / apps/api DEFAULT） |
| AC-7 | デフォルト（URL に sort 無し）は `recent`（新しい順）。`recent` は URL から省略される |
| AC-8 | `packages/shared` の `appliedQuery.sort` enum が 4 値を受理し、API レスポンス検証が通る |
| AC-9 | 新規エンドポイント追加・D1 schema 変更・Google Form 仕様変更を行わない（既存 `/public/members` の sort 拡張のみ） |
| AC-10 | HEX 直書き禁止（`verify-design-tokens`）を遵守。CSS 追加は `::-webkit-search-cancel-button` 抑止のみで色値を含まない |

## 正本順位（衝突時）

1. 本 index.md の「ソート値マッピング」「ユーザー確定事項」
2. phase-1〜3 設計書
3. `docs/00-getting-started-manual/specs/01-api-schema.md`
4. プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）

## runtime_boundary

本ウェーブは Phase 1-13 のタスク仕様作成・strict Phase 12 outputs・aiworkflow-requirements 整合までを完遂する。**Playwright 視覚証跡・staging 検証・commit・push・PR は user-gated。コード実装・focused test・typecheck・lint・token gate は本ウェーブで完了**。
