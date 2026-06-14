# Phase 1: 要件定義

> SSOT: [`shared-context.md`](./shared-context.md)。本 Phase は SSOT §0〜§3, §8 を要件として固定する。

## 目的

非エンジニアの管理者が操作するタグ管理 2 画面（`/admin/tag-master`「タグ定義」・`/admin/tags`「タグ割当」）の直感性を、apps/web 表現層のみで 1 本サイクルで改善するためのスコープ・受入条件・命名規則・分類を確定する。

## 背景

staging 観察（2026-06-11 06:44）とユーザー報告から、(R-1) タグ定義の `コード` を何を入れるか分からない、(R-2) タグ定義とタグ割当の関係が伝わらず冗長に感じる、(R-3) サイドバー「タグキュー」とページ「タグ割当」の名称不一致、(R-4) 技術文言が非エンジニアに不親切、の 4 点が判明した。詳細は SSOT §1。

## タスク分類

- タスク種別: **VISUAL（UI task）**。admin 画面の表示・情報設計・フォーム挙動の変更を含む。
- 実装区分: **実装仕様書**（コード変更を伴う。CONST_004 デフォルト / CONST_005 必須項目を全充足）。
- workflow_state: `implemented_local_evidence_captured`（apps/web 実装・local evidence 取得済み）。
- docs-only ではない理由: 「自動生成する」「命名を統一する」「相互リンクを追加する」はいずれもコンポーネント・純関数の新規/編集を要し、コード変更なしでは目的達成不能。

## 命名規則（既存コードベース分析）

- ファイル: コンポーネント = PascalCase（`TagManagementGuide.tsx`）、lib = camelCase（`tagCodeAutogen.ts` / `tagManagementGlossary.ts`）。既存 `schemaGlossary.ts` / `schemaHistoryGlossary.ts` と整合。
- テスト: 新規は `*.spec.ts` / `*.component.spec.tsx`（`*.test.*` 禁止・CLAUDE.md invariant #8）。配置は `__tests__/`。
- 関数: camelCase（`generateTagCode` / `getTagTerm`）。定数: UPPER_SNAKE（`KANA_ROMAJI_MAP` / `TAG_CODE_PATTERN` / `TAG_MANAGEMENT_GLOSSARY`）。
- code バリデーション既存パターン: `/^[a-z0-9][a-z0-9_]{0,63}$/`（`TagDefinitionCreateForm` L15 / `TagMasterEditForm` L16）。自動生成値はこのパターンに必ず一致させる。

## ゴール

- G1: タグ定義フォームの `コード` を表示名から自動生成（手動上書き可）。
- G2: サイドバー label を「タグ割当」に統一。
- G3: 2 画面の役割と関係を説明 UI + 用語集 SSOT + 相互リンクで可視化。
- G4: 技術文言を用語集経由で非エンジニア向けに平易化。
- G5: 上記すべてを回帰テストで保護し、既存テストを破壊しない。

## 非ゴール（Out of Scope）

- 2 画面の 1 画面統合（OOS-1・API/データ構造が別系統で本サイクル破綻。SSOT §12）。
- 漢字→読みローマ字変換でのコード生成（OOS-2・fallback `tag_<hash>` で代替）。
- `TagMasterEditForm`（編集フォーム）へのコード自動生成適用（OOS-3）。
- apps/api / D1 / Google Form の変更。

## 実行タスク

- SSOT §1 のユーザー報告 4 点を主問題 R-1〜R-4 に分解する。
- SSOT §4 の Concern C1〜C5 と対象ファイル（SSOT §5）を確定する。
- AC-1〜AC-12（SSOT §8）を受入条件として固定する。
- 命名規則と既存 code パターンを記録する（上記）。
- carry-over 確認（直近の同種タスクとの差異）を行う。

## 参照資料

- [`shared-context.md`](./shared-context.md) §0〜§5, §7, §8
- `apps/web/src/components/admin/TagDefinitionCreateForm.tsx`（現状 code 手動入力）
- `apps/web/src/components/shell/shell-config.ts`（ナビ label 定義）
- `apps/web/src/lib/admin/schemaHistoryGlossary.ts`（用語集 SSOT 参考例）
- CLAUDE.md invariant #5/#8/#9/#10

## 成果物

- 本 `phase-1-requirements.md`（スコープ・分類・命名規則・AC 固定）。
- AC-1〜AC-12 の確定（SSOT §8 に正本）。

## carry-over 確認

直近の `admin-schema-history-purpose-clarity-and-filter-fix`（#1196）・`admin-tag-definition-unify-create-and-catalog-fix` と同系統（admin 表現層の用途明確化）。本タスクは **タグ管理ドメインの 2 画面横断（定義↔割当）の関係可視化 + コード自動生成**が新規価値で、既存タスクと重複しない。`tagManagementGlossary.ts` は既存 `schema*Glossary.ts` と別ドメインで新規。

## 受け入れ基準（AC）

SSOT §8 の AC-1〜AC-12 を正本とする（コード自動生成 / 手動上書き / pattern 適合 / 命名統一 / ガイド表示 / 相互リンク / 用語集 / 文言平易化 / API 非接触 / HEX 0 / 回帰なし）。

## ステークホルダー

- 利用者: 非エンジニアの支部会管理者（タグ定義・割当を操作）。
- 開発: solo（daishiman）。レビューは CI gate のみ。

## 統合テスト連携

- C5（回帰テスト）が C1〜C4 の AC を component / unit spec で検証する。既存 `TagDefinitionPanel.component.spec.tsx` / `TagQueuePanel.component.spec.tsx` の DOM contract を維持し、ガイド/ヒント追加が既存テストを壊さないことを Phase 6/9 で確認する。

## 完了条件

- [ ] R-1〜R-4 を C1〜C5 に分解済み。
- [ ] タスク分類（VISUAL / 実装仕様書 / implemented_local_evidence_captured）を記録済み。
- [ ] 命名規則と既存 code パターンを記録済み。
- [ ] AC-1〜AC-12 を SSOT §8 に固定済み。
- [ ] 非ゴール（OOS-1〜3）を記録済み。

## 中学生レベル概念説明

タグは「会員に貼るラベル（シール）」です。この管理画面は 2 つあります。1 つ目「タグ定義」は**どんなシールを作るか**を決める場所、2 つ目「タグ割当」は**作ったシールを誰に貼るか**を決める場所です。今は (1) シールに付ける“合言葉”（コード）を自分で考えないといけなくて難しい、(2) 2 つの場所の役割の違いが分かりにくい、(3) 場所の名前がメニューと画面で違う、という困りごとがあります。これを「合言葉を自動で作る」「役割の説明と行き来できるリンクを付ける」「名前をそろえる」で分かりやすくします。
