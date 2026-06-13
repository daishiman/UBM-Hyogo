# Phase 4: テスト計画

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。新規 spec の Path・対象関数・データ構造の正本は §5 / §6、AC は §8、検証コマンドは §11。

## 目的

タグ管理 2 画面（タグ定義 / タグ割当）のコード自動生成・用語集・ガイド UI・命名統一を TDD で固定するためのテスト計画を定義する。SSOT §8 の AC-1〜AC-12 を、新規追加する 4 つの spec ファイルへマッピングし、各テストケース（TC-XX）の対象・入力・期待値を列挙する。特に純関数 `generateTagCode` の全分岐（空文字 / ひらがな / カタカナ / 漢字のみ→fallback / 記号のみ / ASCII / 64 文字超 / 先頭が数字や記号）を境界値として網羅し、Red 設計（local evidence 取得済みに失敗する spec）の根拠を明文化する。

## 実行タスク

- SSOT §8 の AC-1〜AC-12 を、追加 4 spec（`tagCodeAutogen.spec.ts` / `tagManagementGlossary.spec.ts` / `TagManagementGuide.component.spec.tsx` / `TagDefinitionCreateForm.component.spec.tsx`）へマッピングする対応表を作る（§3）。
- `generateTagCode` の境界値テストケースを、SSOT §6 のアルゴリズム 8 ステップ全分岐で列挙する（§4）。
- 日本語テスト入力文字列は `// length: N` コメントで `.length` を明記する方針を記す（Feedback W0-RV-001）。
- 用語集 SSOT（`TAG_MANAGEMENT_GLOSSARY` / `getTagTerm`）の網羅・キー整合・lookup テストを列挙する（§5）。
- `TagManagementGuide` の variant 別描画・相互リンク・HEX 非混入テストを列挙する（§6）。
- `TagDefinitionCreateForm` のコード自動補完・手動上書き停止（`codeDirty`）テストを、内部 state か外部 props かを明記して列挙する（§7・VSCPKR-03）。
- 既存テスト（`TagDefinitionPanel.component.spec.tsx` / `tags.create.spec.ts` 等）の DOM contract 非破壊を回帰確認項目として記す（§8）。
- private / 内部関数のテスト方針と、focused vitest のフルパス指定（SSOT §11）を記す（§9）。

## 参照資料

- [shared-context.md](./shared-context.md)（§5 対象ファイル / §6 関数シグネチャ / §8 AC / §11 検証コマンド）
- [phase-2-design.md](./phase-2-design.md)（設計・Lane 定義）
- 既存参考 spec: `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx`（DOM contract 維持の基準）
- 既存参考 spec: `apps/api`（非接触・本タスクで参照しない）

## 成果物

- 本 phase ドキュメント（`phase-4-test-plan.md`）= テスト計画（Red 設計）の正本。
- 以下 4 spec ファイル（本サイクルで作成。本サイクルでは Path とテストケースを確定するのみ）:
  - `apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts`（§4 TC-G-01〜13）
  - `apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts`（§5 TC-GL-01〜05）
  - `apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx`（§6 TC-D / TC-A 群）
  - `apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx`（§7 TC-F 群）
- AC-1〜AC-12 → spec/TC マッピング表（§3）。

## 1. テスト方針

- TDD: 各 Lane（C1/C3/C4/C5）の振る舞いを spec で先に固定し、実装が AC を満たすことを保証する（Red → Green）。
- テストランナー: Vitest（`pnpm --filter web exec vitest run …`）。component は `@testing-library/react`。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8 / SSOT 不変条件）。`*.test.*` は禁止。
- component spec は `*.component.spec.tsx` 慣行（既存 `TagDefinitionPanel.component.spec.tsx` に整合）。
- 純関数（`generateTagCode` / `getTagTerm`）はモック不要・副作用なし。component spec は実モジュール（`tagCodeAutogen` / `tagManagementGlossary`）を使用しモックしない。
- API mutation（`createTag`）はモックする。本タスクは mutation shape を変えないため、フォーム送信値の検証は「現在の `code` 値が送信ペイロードに乗る」ことだけ確認し、ネットワーク呼び出しはスタブする。

### 日本語テスト文字列の `.length` 明記方針（Feedback W0-RV-001）

`generateTagCode` の境界（特に 64 文字超の切り詰め）を検証する際、日本語入力は見た目で文字数が判別しづらい。テスト中の日本語入力リテラルには必ず `// length: N` コメントを併記し、テスト意図（境界のどちら側か）を明示する。例:

```ts
const label = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよ"; // length: 33（ローマ字化後に 64 超を検証）
```

### private / internal メンバーのテスト方針

本タスクの対象（純関数 `generateTagCode`・純データ `KANA_ROMAJI_MAP` / `TAG_CODE_PATTERN` / `TAG_MANAGEMENT_GLOSSARY`・lookup `getTagTerm`・export 済 component `TagManagementGuide` / `TagDefinitionCreateForm`）はすべて public export であり、private/internal を直接テストする必要は無い。**該当なし**。テストは公開 API（export されたシンボル）越しに検証する。`djb2` ハッシュ等の内部ヘルパは `generateTagCode` の戻り値（fallback `tag_<base36>`）越しに間接検証する。

### focused vitest のフルパス指定（SSOT §11）

focused 実行はワークツリールートから package 相対のフルパスを与える（package dir 相対 filter は絶対 include glob に非マッチになる罠を回避）:

```bash
mise exec -- pnpm --filter web exec vitest run \
  src/lib/admin/__tests__/tagCodeAutogen.spec.ts \
  src/lib/admin/__tests__/tagManagementGlossary.spec.ts \
  src/components/admin/__tests__/TagManagementGuide.component.spec.tsx \
  src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx
```

## 2. spec ファイル一覧（SSOT §5）

| Path | Lane | 種別 | 対象 |
|------|------|------|------|
| `apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts` | C5 | 新規 | `generateTagCode` 純関数 / `TAG_CODE_PATTERN` / `KANA_ROMAJI_MAP` unit |
| `apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts` | C5 | 新規 | `TAG_MANAGEMENT_GLOSSARY` 網羅 / `getTagTerm` lookup unit |
| `apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx` | C5 | 新規 | variant 別の説明文・相互リンク描画 |
| `apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx` | C5 | 新規 or 追記 | コード自動補完・手動上書き停止（`codeDirty`） |

> `TagDefinitionCreateForm.component.spec.tsx` が未存在なら新規、存在すれば追記（既存 TC を壊さない）。

## 3. AC → spec マッピング

| AC | 内容 | 検証 spec | 検証 TC |
|----|------|-----------|---------|
| AC-1 | 表示名入力でコード欄が `generateTagCode(label)` で自動補完 | `TagDefinitionCreateForm.component.spec.tsx` | TC-F-AUTO-01 / 02 |
| AC-2 | コード手動編集後は自動上書きされない（`codeDirty`） | `TagDefinitionCreateForm.component.spec.tsx` | TC-F-DIRTY-01 / 02 |
| AC-3 | `generateTagCode` 返り値が常に `TAG_CODE_PATTERN` に一致（全分岐） | `tagCodeAutogen.spec.ts` | TC-G-01〜TC-G-12 |
| AC-4 | コード欄に「自動生成（編集可）」ヒント + 自動生成中の状態表示 | `TagDefinitionCreateForm.component.spec.tsx` | TC-F-HINT-01 / 02 |
| AC-5 | サイドバー label「タグ割当」がページ内タイトルと一致 | （shell-config grep / Phase 5 検証） | 静的 grep（§8 参照） |
| AC-6 | `/admin/tag-master` 冒頭に `variant="definition"` ガイド + `/admin/tags` 相互リンク | `TagManagementGuide.component.spec.tsx` | TC-D-01 / 02 / 03 |
| AC-7 | `/admin/tags` 冒頭に `variant="assignment"` ガイド + `/admin/tag-master` 相互リンク | `TagManagementGuide.component.spec.tsx` | TC-A-01 / 02 / 03 |
| AC-8 | `TAG_MANAGEMENT_GLOSSARY` 必須キー揃い・`getTagTerm` lookup | `tagManagementGlossary.spec.ts` | TC-GL-01〜TC-GL-05 |
| AC-9 | 技術文言（"tag master API" 等）が平易文に置換 | `TagDefinitionCreateForm.component.spec.tsx` | TC-F-PLAIN-01 |
| AC-10 | `apps/api` 差分なし | （`git diff -- apps/api` 空・Phase 5 検証） | 静的（§8 参照） |
| AC-11 | HEX 直書き 0 件 | `TagManagementGuide.component.spec.tsx`（軽量補助）/ `verify:tokens` | TC-D-04 |
| AC-12 | 既存タグ管理テストが回帰しない | 既存 spec PASS | §8 回帰確認 |

## 4. `tagCodeAutogen.spec.ts`（C1 / C5 / AC-3）

対象: `generateTagCode(label: string): string` / `TAG_CODE_PATTERN`（`/^[a-z0-9][a-z0-9_]{0,63}$/`）/ `KANA_ROMAJI_MAP`。純関数のためモック不要。**全 TC で「返り値が `TAG_CODE_PATTERN.test(result) === true`」を共通アサーションとして必ず併せて確認する**（SSOT §6 ステップ 8 の不変条件）。

| TC-ID | 対象 / 分岐（SSOT §6 ステップ） | 入力 | 期待結果 |
|-------|--------------------------------|------|----------|
| TC-G-01 | 空文字 → fallback（ステップ 1, 7） | `""` | `TAG_CODE_PATTERN` に一致する非空文字（`tag_` 接頭の fallback）。throw しない |
| TC-G-02 | 空白のみ → fallback（ステップ 1, 7） | `"   "` / `"\t\n"` | fallback `tag_…`。`TAG_CODE_PATTERN` 一致 |
| TC-G-03 | ASCII 英字 → 小文字 slug（ステップ 2, 4） | `"Kobe Region"` | `"kobe_region"`。パターン一致 |
| TC-G-04 | ASCII 英数記号混在 → `_` 畳み込み（ステップ 4, 5） | `"Region: Kobe-2024!!"` | 連続非英数が単一 `_`、先頭末尾 `_` 除去（例 `"region_kobe_2024"`）。パターン一致 |
| TC-G-05 | ひらがな → ローマ字化（ステップ 3） | `"こうべ"` // length: 3 | `KANA_ROMAJI_MAP` 経由のローマ字 slug（例 `"koube"` または実装表に従う決定値）。`[a-z0-9_]` のみ・パターン一致 |
| TC-G-06 | カタカナ → ローマ字化（ステップ 3） | `"コウベ"` // length: 3 | TC-G-05 と同等のローマ字 slug。パターン一致 |
| TC-G-07 | 漢字のみ（マッピング不能）→ fallback（ステップ 3, 7） | `"神戸支部"` // length: 4 | fallback `tag_<base36>`（漢字はローマ字化せずスキップ → 残り空 → fallback）。`TAG_CODE_PATTERN` 一致 |
| TC-G-08 | 記号のみ → fallback（ステップ 4, 5, 7） | `"!!!---###"` // length: 9 | 英数が残らず fallback `tag_…`。パターン一致 |
| TC-G-09 | 先頭が数字 → 先頭非英字許容範囲（ステップ 5, 8） | `"2024年度"` // length: 5 | 先頭 `[a-z0-9]` を満たす（`2024…` は数字始まり OK。漢字「年度」はスキップ）。パターン一致（先頭が数字でもパターンは許容） |
| TC-G-10 | 先頭が記号 → 先頭非英数の除去（ステップ 5） | `"-kobe"` / `"_kobe"` | 先頭 `_` / `-` が除去され `"kobe"` 始まり。パターン一致（先頭が `_` で始まらないことを確認） |
| TC-G-11 | 64 文字超 → 切り詰め（ステップ 6） | `"a".repeat(80)` // length: 80 | 結果の `.length <= 64`。末尾 `_` が無い。パターン一致 |
| TC-G-12 | 決定性（同入力同出力） | 任意の同一 label を 2 回呼ぶ | 2 回の戻り値が厳密一致（純関数性・副作用なし） |

> **共通アサーション**: 全 TC で `expect(TAG_CODE_PATTERN.test(generateTagCode(input))).toBe(true)` を必ず実行（AC-3 の「常に一致」を全分岐で固定）。
> **`KANA_ROMAJI_MAP` 単体**: `Object.keys(KANA_ROMAJI_MAP)` がひらがな・カタカナを含み、値がすべて `[a-z]+` であること（マッピング表自体の健全性）を 1 ケースで固定する（TC-G-13 として追加可）。

## 5. `tagManagementGlossary.spec.ts`（C3 / C5 / AC-8）

対象: `TAG_MANAGEMENT_GLOSSARY`（`readonly TagGlossaryTerm[]`）/ `getTagTerm(key)`。純データ + 純関数。

| TC-ID | 対象 | 入力 / 操作 | 期待結果 |
|-------|------|------------|----------|
| TC-GL-01 | 必須キー網羅 | `TAG_MANAGEMENT_GLOSSARY.map(t => t.key)` | SSOT §6 の必須 8 キー（`tag-definition` / `tag-assignment` / `tag-code` / `tag-label` / `tag-category` / `tag-suggestion` / `tag-unresolved` / `tag-resolve`）をすべて含む |
| TC-GL-02 | 各 term の必須フィールド | 全エントリ | `key`（非空 string）/ `label`（非空 日本語 string）/ `description`（非空 string）がすべて存在する |
| TC-GL-03 | key 一意性 | キー配列 | 重複 key が無い（`new Set(keys).size === keys.length`） |
| TC-GL-04 | `getTagTerm` 正常 lookup | `getTagTerm("tag-definition")` | 対応する `TagGlossaryTerm`（`.label` が「タグ定義」相当）を返す |
| TC-GL-05 | `getTagTerm` 未登録 key | `getTagTerm("nonexistent")` | `undefined` を返す。throw しない |

## 6. `TagManagementGuide.component.spec.tsx`（C3 / C5 / AC-6 / AC-7 / AC-11）

対象: `TagManagementGuide`（props: `variant: "definition" | "assignment"` / `className?`）。stateless。`render(<TagManagementGuide variant=… />)`。Next.js `Link` を使う場合は既存 admin component spec のレンダリングパターン（必要なら `next/link` をスタブ）に合わせる。

| TC-ID | 対象 / variant | 入力 / 操作 | 期待結果 |
|-------|----------------|------------|----------|
| TC-D-01 | definition 説明文描画 | `variant="definition"` | 「タグの語彙（マスター）を作る」旨の説明文が描画される（用語集 `tag-definition` の description 準拠） |
| TC-D-02 | definition → 割当への相互リンク | `variant="definition"` | `/admin/tags`（タグ割当）へのリンク（`href="/admin/tags"`・リンク文言に「タグ割当」を含む）が存在 |
| TC-D-03 | definition の用語併記 | `variant="definition"` | 「コード」「表示名」等の用語が用語集経由で平易に説明されている（`getTagTerm` 由来テキストの存在） |
| TC-D-04 | HEX 非混入（軽量補助・AC-11） | いずれかの variant render | render された要素の `style` 属性に `#` 始まりの色値が無い（class / OKLch token 経由。最終 gate は `verify:tokens`） |
| TC-A-01 | assignment 説明文描画 | `variant="assignment"` | 「提案されたタグをレビューしてメンバーに割り当てる」旨の説明文が描画される（用語集 `tag-assignment` / `tag-resolve` 準拠） |
| TC-A-02 | assignment → 定義への相互リンク | `variant="assignment"` | `/admin/tag-master`（タグ定義）へのリンク（`href="/admin/tag-master"`・リンク文言に「タグ定義」を含む）が存在 |
| TC-A-03 | variant 切替でリンク向きが反転 | definition と assignment を別々に render | definition は `/admin/tags`、assignment は `/admin/tag-master` を指す（向きが排他的に切り替わる） |

## 7. `TagDefinitionCreateForm.component.spec.tsx`（C1 / C4 / C5 / AC-1 / AC-2 / AC-4 / AC-9）

対象: `TagDefinitionCreateForm`（コード自動生成・手動上書き停止）。`@testing-library/react` + `@testing-library/user-event` で表示名・コード入力欄を操作する。

> **VSCPKR-03（テスト操作対象の明示）**: 本フォームの自動補完ロジックは **component 内部 state（`code` / `codeDirty`）** に閉じる。テストは外部 props（`createTag` 等のコールバック）ではなく、**内部 state の結果として描画される input の `value`** を観測して検証する。`codeDirty` は直接観測せず「コード欄を手動編集した後に表示名を変えてもコード `value` が変わらない」という外部から観測可能な振る舞いで間接検証する（内部 state を直接 spy しない）。`createTag` はモックし、送信ペイロードの `code` 値のみを外部 props 観測点として使う。

| TC-ID | 対象 / Lane | 入力 / 操作 | 期待結果（観測点） |
|-------|------------|------------|--------------------|
| TC-F-AUTO-01 | 表示名入力でコード自動補完（AC-1 / 内部 state） | 表示名欄に `"Kobe Region"` を入力（コード欄未編集） | コード欄 input の `value` が `generateTagCode("Kobe Region")`（=`"kobe_region"`）になる |
| TC-F-AUTO-02 | 日本語表示名でも自動補完（AC-1） | 表示名欄に `"こうべ"` // length: 3 を入力 | コード欄 `value` が `generateTagCode("こうべ")` と一致（`[a-z0-9_]` のみ） |
| TC-F-DIRTY-01 | コード手動編集後は自動上書きしない（AC-2 / `codeDirty`） | (1) 表示名 `"abc"` → コード自動補完 →(2) コード欄を `"my_custom"` に手動編集 →(3) 表示名を `"xyz"` に変更 | コード欄 `value` は `"my_custom"` のまま（表示名変更で上書きされない） |
| TC-F-DIRTY-02 | 自動補完中（未編集）は表示名変更に追随（AC-2 反対側） | 表示名を `"abc"` → `"xyz"` と続けて変更（コード未編集） | コード欄 `value` が `generateTagCode("xyz")` に追随更新される |
| TC-F-HINT-01 | 「自動生成（編集可）」ヒント描画（AC-4） | render | コード欄付近に「表示名から自動生成」「編集可」相当のヒントテキストが存在する |
| TC-F-HINT-02 | 自動生成中の状態表示（AC-4） | コード未編集状態で render | 「自動生成中」相当の状態表示（バッジ等）が存在し、コード手動編集後は消える（または状態が変わる） |
| TC-F-PLAIN-01 | 技術文言の平易化（AC-9 / C4） | render | 「tag master API」「既存の tag master API に新しいタグ定義を追加します」等の技術文言が **存在しない**。代わりに用語集準拠の平易文（「会員ディレクトリでメンバーを分類・検索するためのラベル」相当）が存在する |
| TC-F-SUBMIT-01 | 送信値が現在のコード（外部 props 観測） | 自動補完値のまま submit / 手動上書き後 submit | モックした `createTag` に渡る `code` が、それぞれ自動補完値 / 手動上書き値と一致する |

## 8. 既存テスト DOM contract 非破壊（回帰確認・AC-12）

ガイド/ヒント/コード自動補完は **追加のみ** で、既存の testid / role / aria / フォーム送信 shape を変えない。以下を回帰確認項目とする:

- `apps/web/src/components/admin/__tests__/TagDefinitionPanel.component.spec.tsx`（既存）: パネル一覧・編集の DOM contract が不変。`TagDefinitionCreateForm` への変更がパネルテストを壊さないこと。
- `apps/api` のタグ作成テスト（`tags.create.spec.ts` 等・**本タスク非接触**）: API mutation shape を変えないため API 側 spec は無変更で PASS であること（`git diff -- apps/api` 空が前提）。
- 既存フォームの input role / label / submit button の aria 構造を維持（自動補完は `value` の更新のみで DOM 構造を変えない）。
- AC-5（命名統一）の検証は spec ではなく静的 grep: `shell-config.ts` に `"タグキュー"` が無く `"タグ割当"` が存在すること（Phase 5 で確認）。
- AC-10（apps/api 非接触）の検証は `git diff origin/dev...HEAD -- apps/api`（Phase 5 で確認）。

## 統合テスト連携

- 本タスクのテストは web 単体（vitest + jsdom）で完結する。E2E / API 結合は新規に追加しない（API 非接触・SSOT §7）。
- 既存の web component 統合（`TagDefinitionPanel` ↔ `TagDefinitionCreateForm`）に対しては、Create フォームの自動補完追加が既存パネルテストを壊さないことを「回帰確認」（§8）として担保する。
- Phase 6 で fail path / 境界 / 回帰 guard を上乗せし、Phase 4 の正常系と同一 wave 内で GREEN にする。
- focused vitest（SSOT §11・§1）でローカル GREEN を確認後、`verify:tokens` で HEX 0 件、`git diff -- apps/api` 空を統合的に確認する。

## 完了条件

- [ ] AC-1〜AC-12 を 4 spec の TC へマッピングする対応表が §3 に記載されている。
- [ ] `generateTagCode` の全分岐（空 / 空白 / ASCII / ひらがな / カタカナ / 漢字のみ / 記号のみ / 先頭数字 / 先頭記号 / 64 超 / 決定性）が §4 の TC-G-01〜12 で網羅されている。
- [ ] 全 `generateTagCode` TC が「返り値が `TAG_CODE_PATTERN` に一致」を共通アサーションとして含む方針が明記されている。
- [ ] 日本語入力リテラルに `// length: N` を付ける方針（Feedback W0-RV-001）が記載されている。
- [ ] 用語集 SSOT の必須 8 キー網羅・`getTagTerm` lookup テスト（§5）が定義されている。
- [ ] `TagManagementGuide` の variant 別説明文・相互リンク向き・HEX 非混入テスト（§6）が定義されている。
- [ ] フォーム test が「内部 state（`code`/`codeDirty`）か外部 props（`createTag`）か」を明記している（VSCPKR-03・§7）。
- [ ] 既存テスト（`TagDefinitionPanel.component.spec.tsx` / `tags.create.spec.ts` 等）の DOM contract 非破壊が回帰確認項目として記載されている（§8）。
- [ ] private/内部関数のテスト方針（該当なし・公開 API 越し）と focused vitest フルパス指定が記載されている（§1）。
- [ ] 統合テスト連携（web 単体完結・API 非接触・Phase 6 連結）が記載されている。
