# Phase 8: リファクタ

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。本タスクは最小実装（CONST_007 1 サイクル完了）であり、大規模リファクタは行わない。
> ただし「重複削減」「責務分離（純データ / 純関数 / 純表示）」「文言ドリフト解消」に資する小規模集約は実装と同一 wave で記録する。

## 目的

本サイクル設計（Phase 2）に内包された「純データ・純関数・純表示の分離」と「用語集 SSOT 化による文言重複削減」を整理し、`対象 / Before / After / 理由` テーブル（[Feedback RT-03]）で記録する。API 接触を伴う広域置換は OOS に送り、本サイクルは表現層に閉じた net 改善のみ実施する。

## 実行タスク

- 下記リファクタ一覧（§2）を実装と同一 wave で行い、Before/After/理由を記録する。
- 既存 `TagDefinitionCreateForm` / `TagMasterEditForm` の code バリデーション正規表現の重複を `TAG_CODE_PATTERN`（`tagCodeAutogen.ts`）へ SSOT 化する**余地**を §3 に記す。ただし本タスクの主目的は**新規作成フォームの自動生成**であり、既存編集フォームへの広域置換は OOS-3 に抵触しうるため、**定数 import のみ**（正規表現リテラルの重複を 1 つ削る）に留め、ロジック改変・自動生成適用は行わない。リスクがある場合は未タスク化候補（§3）として記す。
- 文言の用語集 SSOT 化（`tagManagementGlossary.ts`）でフォーム説明文・ガイド文言のベタ書き重複を削減する。
- リファクタが既存テストの DOM contract（testid / role / aria）を破壊しないことを確認する（不変条件 #7）。

## 参照資料

- [shared-context.md](./shared-context.md) §5（対象ファイル）/ §6（シグネチャ）/ §7（不変条件）/ §12（OOS-3）
- [phase-7-coverage.md](./phase-7-coverage.md)（リファクタ後コードのカバレッジ対象）

## リファクタ一覧 [Feedback RT-03]

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| code 自動生成ロジック | `TagDefinitionCreateForm.tsx` 内にコード入力欄があるが**自動生成ロジックなし**。非エンジニアが `a-z0-9_` を手入力する障壁 | 表示名→slug 変換を純関数 `generateTagCode`（`tagCodeAutogen.ts`）へ**外出し**。フォームは import して `codeDirty=false` 時に補完するだけ | UI（表示）と変換ロジックの責務分離。純関数化でテスト容易性向上（Lane C1 / COV-C1）。決定的で副作用なし・throw しない |
| code バリデーション正規表現 | `TagDefinitionCreateForm.tsx`（および `TagMasterEditForm.tsx`）に `CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/` が**個別リテラルで重複** | `tagCodeAutogen.ts` の `TAG_CODE_PATTERN` を**単一 SSOT 化**し、新規作成フォームはこれを import。`generateTagCode` の返り値が常にこの pattern に一致することを保証 | 同一正規表現リテラルの重複を 1 本化。生成値とバリデーションが同じ pattern を参照することで drift を構造的に排除 |
| 用語・説明データ | フォーム説明文・ガイド文言を UI コンポーネント内にベタ書きすると、表示と知識データが混在し再利用・テストが困難。同義文言が複数画面に散る | `TAG_MANAGEMENT_GLOSSARY` と `TAG_MANAGEMENT_COPY` を `tagManagementGlossary.ts` の**純データへ分離**。`TagManagementGuide` / `TagDefinitionCreateForm` / `tags/page.tsx` は import して描画 | UI と knowledge の責務分離（先例 `schemaGlossary` と同設計）。文言の単一定義で重複削減・ドリフト防止。データ単体テスト可能（Lane C3 / COV-C3a） |
| 2 画面の関係説明 | 定義 / 割当の関係を説明する UI が**未実装**。各 page に説明をベタ書きすると 2 画面で重複しドリフトする | `TagManagementGuide`（`variant` 切替・stateless）へ**集約**し、両 page から variant 指定で呼ぶ。文言は用語集から引く | 説明 UI の単一実装で重複排除。variant で向きだけ変える設計が DRY（Lane C3 / COV-C3c/d） |
| 技術文言 | `TagDefinitionCreateForm` の「既存の tag master API に新しいタグ定義を追加します」等、非エンジニアに不親切な技術用語が散在 | 用語集準拠の平易文（SSOT §6 C4）へ置換。文言は `tagManagementGlossary.ts` 経由 | 文言の出所を用語集に一本化し、平易化と同時に重複定義を解消（Lane C4） |

## navigation drift / duplicate 削減観点

| 観点 | 評価 |
|------|------|
| navigation drift | `shell-config.ts` のサイドバー label「タグキュー」→「タグ割当」でページ内タイトルと**名称統一**（R-3 / AC-5）。href `/admin/tags` は不変・新規 route / nav エントリ追加なし（drift を生まない）。label 文字列の変更のみで導線構造は不変 |
| duplicate 削減（本サイクル実施） | (1) code 正規表現リテラルの重複 → `TAG_CODE_PATTERN` 1 本化。(2) 2 画面の説明文 → `TagManagementGuide` 1 実装。(3) 散在文言 → 用語集 1 定義 |
| 残存する重複（本サイクル外） | OOS-3: `TagMasterEditForm` への自動生成適用は編集時に既存コードがあり意味が薄く、rename は別タスク（#1069 等）で扱い済みのため分離。本サイクルは定数 import で正規表現重複のみ削り、ロジック改変はしない |

## リファクタしないと明示するもの（過剰改変の回避）

- `TagsQueueResolveDrawer.tsx`: 割当ロジック不変。`TagQueuePanel.tsx` は region label のみ変更し、状態遷移・resolve drawer contract には手を入れない（不変条件・OOS）。
- `TagMasterEditForm.tsx`: コード自動生成は適用しない（OOS-3）。`TAG_CODE_PATTERN` の import 差し替えはリスクがあれば見送り、未タスク化候補とする。
- `apps/web/src/features/admin/api/tags.ts` / `useAdminMutation`: mutation shape 不変（不変条件 #5）。
- `AppliedFiltersZ` / api 系 schema: 本タスクはフィルタ周りを触らない。非接触。
- `AdminPageHeader` / `Card` / `Button` / `FormField` / `Input`: 再利用のみ・primitive を生やさない / 改変しない（不変条件 #3）。
- `.passthrough()` 化等の防御性低下リファクタ: 採らない。

## 統合テスト連携

- リファクタ後も既存 `TagDefinitionPanel.component.spec.tsx` 等が GREEN であること（DOM contract 維持 = AC-12）を Phase 9 QA で確認する。
- `generateTagCode` 外出し後、`TagDefinitionCreateForm.component.spec.tsx` で「表示名入力 → コード欄補完」のエッジが GREEN であることを確認する（Phase 7 COV-C1f/g）。
- 用語集分離後、`TagManagementGuide.component.spec.tsx` で「描画文言が用語集と一致」することを確認し、ベタ書き回帰を検出する。

## 成果物

- 本ファイル（`phase-8-refactor.md`）= リファクタ一覧テーブル（Before/After/理由）+ duplicate 削減観点 + リファクタしない明示 + 未タスク化候補の判定。

## 完了条件

- [ ] リファクタが `対象 / Before / After / 理由` テーブル形式で記録されている（[Feedback RT-03]）。
- [ ] `TAG_CODE_PATTERN` への正規表現重複 SSOT 化（定数 import に留め広域置換しない）が記述され、OOS-3 抵触回避が明記されている。
- [ ] 用語集 SSOT 化による文言重複削減が記述されている。
- [ ] リファクタが既存テストの DOM contract を破壊しない方針が明記されている。
- [ ] リファクタしないもの（過剰改変回避）と未タスク化候補が列挙されている。
