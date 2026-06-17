# Phase 5: 実装手順

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。関数シグネチャ・データ構造・対象ファイルの正本は §5 / §6、AC は §8、検証コマンドは §11。設計は [phase-2-design.md](./phase-2-design.md)、テストは [phase-4-test-plan.md](./phase-4-test-plan.md)。

## 目的

タグ管理 2 画面（タグ定義 / タグ割当）の直感性を、apps/web 表現層のみの変更で改善する具体的な実装手順を定義する。コード自動生成（C1）・命名統一（C2）・説明 UI + 用語集 + 相互リンク（C3）・文言平易化（C4）を、新規 7 ファイル / 編集 product 6 + spec 2 ファイルで実装し、各関数の入力 / 出力 / 副作用 / エラーハンドリングと検証コマンドを明文化する。**本サイクルで実装済み。** 本書は本サイクル着手時の手順書として機能する。

## 実行タスク

- 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）を SSOT §5 から表で再掲する（§0）。
- `tagCodeAutogen.ts` の `generateTagCode` 8 ステップアルゴリズム・`KANA_ROMAJI_MAP`・`TAG_CODE_PATTERN`・fallback を実装する（§1）。
- `tagManagementGlossary.ts` の `TagGlossaryTerm` 型・`TAG_MANAGEMENT_GLOSSARY`（必須 8 キー）・`getTagTerm` を実装する（§2）。
- `TagManagementGuide.tsx` を variant 別説明文 + 相互リンクで実装する（§3）。
- `TagDefinitionCreateForm.tsx` に `codeDirty` state とコード自動補完・ヒント・平易文言を追加する（§4）。
- `shell-config.ts` / `TagQueuePanel.tsx` / `MemberDrawer.tsx` のユーザー向け文言を「タグ割当」に統一する（§5）。
- `tag-master/page.tsx` / `tags/page.tsx` にガイドを挿入し、tags 説明文を平易化する（§6）。
- ローカル実行・検証コマンド（SSOT §11）と DoD（SSOT §9）を再掲する（§7 / §8）。

## 参照資料

- [shared-context.md](./shared-context.md)（§5 対象ファイル / §6 関数シグネチャ / §8 AC / §9 DoD / §11 検証コマンド）
- [phase-2-design.md](./phase-2-design.md)（設計・Lane 定義・色トークン方針）
- [phase-4-test-plan.md](./phase-4-test-plan.md)（テスト計画・AC → TC マッピング）
- 既存参考: `apps/web/src/components/admin/TagDefinitionPanel.tsx` / `TagDefinitionCreateForm.tsx`（現状の DOM contract）

## 成果物

- 本 phase ドキュメント（`phase-5-implementation.md`）= 実装手順の正本（CONST_005 核）。
- 新規 product 3 ファイル: `tagCodeAutogen.ts` / `tagManagementGlossary.ts` / `TagManagementGuide.tsx`（§1〜§3）。
- 編集 product 6 + spec 2 ファイル: `TagDefinitionCreateForm.tsx` / `TagQueuePanel.tsx` / `MemberDrawer.tsx` / `shell-config.ts` / `tag-master/page.tsx` / `tags/page.tsx` / `TagQueuePanel.component.spec.tsx` / `shell-config.spec.ts`（§4〜§6）。
- 新規 spec 4 ファイル（Phase 4 / Phase 6 を正本に作成）。
- 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）= §0。検証コマンド = §7。DoD = §8。

> いずれも本サイクルで作成・編集済み。

## 0. 変更対象ファイル一覧（SSOT §5）

### 新規作成（product 3 + spec 4 = 7）

| # | Path | 種別 | Lane | 役割 |
|---|------|------|------|------|
| 1 | `apps/web/src/lib/admin/tagCodeAutogen.ts` | 新規 | C1 | `generateTagCode` / `KANA_ROMAJI_MAP` / `TAG_CODE_PATTERN`（純関数・純データ） |
| 2 | `apps/web/src/lib/admin/tagManagementGlossary.ts` | 新規 | C3/C4 | `TagGlossaryTerm` / `TAG_MANAGEMENT_GLOSSARY` / `getTagTerm`（用語集 SSOT） |
| 3 | `apps/web/src/components/admin/TagManagementGuide.tsx` | 新規 | C3 | variant 別の目的説明 + 相互リンク（stateless） |
| 4 | `apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts` | 新規 | C5 | `generateTagCode` unit（Phase 4 §4） |
| 5 | `apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts` | 新規 | C5 | 用語集網羅・lookup（Phase 4 §5） |
| 6 | `apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx` | 新規 | C5 | variant 別描画（Phase 4 §6） |
| 7 | `apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx` | 新規 or 追記 | C5 | コード自動補完・上書き停止（Phase 4 §7） |

### 編集（product 6 + spec 2）

| # | Path | 種別 | Lane | 変更内容 |
|---|------|------|------|----------|
| 8 | `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` | 編集 | C1/C4 | `codeDirty` state 追加 / 表示名 onChange→自動補完 / コード onChange→`codeDirty=true` / ヒント / 平易文言 |
| 9 | `apps/web/src/components/shell/shell-config.ts` | 編集 | C2 | `tag-queue` label `"タグキュー"`→`"タグ割当"`（L84 付近） |
| 10 | `apps/web/app/(admin)/admin/tag-master/page.tsx` | 編集 | C3 | 冒頭に `TagManagementGuide variant="definition"` 挿入 |
| 11 | `apps/web/app/(admin)/admin/tags/page.tsx` | 編集 | C3/C4 | 冒頭に `TagManagementGuide variant="assignment"` 挿入 + 説明文平易化 |
| 12 | `apps/web/src/components/admin/TagQueuePanel.tsx` | 編集 | C2/C4 | region label を「タグ割当」へ統一（割当ロジック不変） |
| 13 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | C2/C4 | 会員 drawer の導線文言を「タグ割当へ」へ統一（href 不変） |
| 14 | `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | 編集 | C5 | region label 変更の回帰保護 |
| 15 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 編集 | C5 | nav label と sibling route contract の回帰保護 |

### 非接触（不変条件で保証）

- `apps/api/**`（`git diff origin/dev...HEAD -- apps/api` が空・AC-10）
- D1 migrations / schema / Google Form schema
- `apps/web/src/features/admin/api/tags.ts`（`createTag` 呼び出し shape 不変）
- `TagsQueueResolveDrawer.tsx`（割当ロジック不変。`TagQueuePanel.tsx` は表示 label のみ変更）
- `tokens.css` / OKLch token 定義（新規 HEX 直書き禁止・AC-11）

> **canUseTool / IPC Bridge / Preload API について**: 本タスクは Cloudflare Workers + Next.js の web 表現層改修であり、Electron preload / IPC / `canUseTool` のような bridge 機構は本タスクに無関係なため**該当なし**。

## 0-1. 実装順序

SSOT §4 の通り全 Lane を 1 本サイクル（同一 wave）で完了する（CONST_007）。推奨着手順は依存に沿って **C1（純関数）→ C3（用語集 → ガイド）→ C4（フォーム文言）→ C2（命名）→ C5（テスト）**。C5 は各 Lane と並走して TDD で書き、最終的に同一 wave 内で GREEN にする。

---

## 1. C1 — `apps/web/src/lib/admin/tagCodeAutogen.ts`（新規・#1）

### 1-1. 公開シグネチャ（SSOT §6 逐語）

```ts
/**
 * 表示名（日本語可）から tag code（^[a-z0-9][a-z0-9_]{0,63}$ に適合）を決定的に生成する純関数。
 * - 副作用なし / 例外を throw しない（WEEKGRD-02: ガードは無効値でなく安全な fallback を返す）。
 * - 生成不能（マッピング不能な漢字のみ等）の場合は決定的な fallback `tag_<base36 hash>` を返す。
 */
export function generateTagCode(label: string): string;

/** カナ→ローマ字の最小変換表（ひらがな / カタカナ）。純データ。 */
export const KANA_ROMAJI_MAP: Readonly<Record<string, string>>;

/** 生成された code が API/フォームの CODE_PATTERN に一致するか（テスト/呼び出し側の確認用）。 */
export const TAG_CODE_PATTERN: RegExp; // = /^[a-z0-9][a-z0-9_]{0,63}$/
```

### 1-2. `KANA_ROMAJI_MAP` 構成方針

- ひらがな・カタカナの**最小変換表**を純データ（`Object.freeze` 推奨）で定義する。
- 収録範囲: 五十音（あ〜ん / ア〜ン）、濁音・半濁音（が〜ぽ / ガ〜ポ）、拗音・促音・長音の最小対応（きゃ→`kya`、っ→次子音重ね or `tsu` の簡易対応、ー→無視）。SSOT §6 ステップ 3「未収録文字はスキップ」に従い、表に無い文字は出力に含めない。
- 値はすべて `[a-z]+`（小文字英字のみ）。ひらがなとカタカナは同一ローマ字へマップ（`"こ"` も `"コ"` も `"ko"`）。
- 漢字はマップに含めない（ステップ 3 でスキップ → 漢字のみ表示名は fallback へ）。SSOT §6 設計判断・OOS-2 に整合。

### 1-3. `generateTagCode` の 8 ステップアルゴリズム（SSOT §6 逐語）

| ステップ | 処理 | 入力 → 出力 |
|---------|------|------------|
| 1 | `String(label ?? "")` で受け、前後空白除去。空なら fallback（ステップ 7）へ | `null`/`undefined`/`"  "` → `""` |
| 2 | NFKC 正規化（`.normalize("NFKC")`）→ 小文字化（`.toLowerCase()`） | 全角英数 → 半角小文字 |
| 3 | ひらがな / カタカナを `KANA_ROMAJI_MAP` でローマ字へ。拗音・促音・長音は最小対応。**未収録文字（漢字含む）はスキップ** | `"こうべ"` → `"koube"`、`"神戸"` → `""` |
| 4 | 残る `[a-z0-9]` 以外の連続を単一 `_` へ置換（`replace(/[^a-z0-9]+/g, "_")`） | `"region: kobe-2024"` → `"region_kobe_2024"` |
| 5 | 先頭/末尾の `_` 除去 + 連続 `_` 畳み込み + 先頭が `[a-z0-9]` でなければ先頭の非英数を除去 | `"_kobe_"` → `"kobe"` |
| 6 | 64 文字に切り詰め（`.slice(0, 64)`）+ 末尾 `_` 再除去 | 80 文字 → 64 文字以内・末尾 `_` 無し |
| 7 | 結果が空文字なら fallback `"tag_" + djb2(label).toString(36)`（先頭 `tag_` で `[a-z]` 始まり保証） | `""` → `"tag_1a2b3c"` |
| 8 | 返り値は必ず `TAG_CODE_PATTERN` に一致する | （不変条件・テストで全分岐確認） |

- **入力**: `label: string`（実際は `unknown` 相当も `String(label ?? "")` で吸収）。
- **出力**: `TAG_CODE_PATTERN` に必ず一致する `string`。
- **副作用**: なし（純関数）。
- **エラーハンドリング**: throw しない。生成不能はすべて fallback で吸収（WEEKGRD-02）。

### 1-4. fallback ハッシュ `djb2`

```ts
// 内部ヘルパ（非 export）。決定的な 32bit ハッシュ。
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0; // unsigned
  }
  return hash;
}
```

- fallback 値は `"tag_" + djb2(originalLabel).toString(36)`。`toString(36)` は `[0-9a-z]` のみ → 接頭 `tag_` で `TAG_CODE_PATTERN`（先頭 `[a-z0-9]`）を満たす。
- 同一 label で常に同一 fallback（決定性・Phase 4 TC-G-12）。

---

## 2. C3/C4 — `apps/web/src/lib/admin/tagManagementGlossary.ts`（新規・#2）

### 2-1. 型と公開シグネチャ（SSOT §6 逐語）

```ts
export interface TagGlossaryTerm {
  /** 安定キー（英語・コード内参照用） */
  key: string;
  /** 画面表示名（日本語） */
  label: string;
  /** 非エンジニア向け平易説明（1〜2 文） */
  description: string;
}

/** タグ管理ドメインの用語集 SSOT。配列順に表示してよい。 */
export const TAG_MANAGEMENT_GLOSSARY: readonly TagGlossaryTerm[];

/** key → term の lookup（未登録 key は undefined）。 */
export function getTagTerm(key: string): TagGlossaryTerm | undefined;
```

### 2-2. `TAG_MANAGEMENT_GLOSSARY` 必須キー（SSOT §6）

最低限以下 8 キーを収録する（`label` 日本語・`description` は非エンジニア向け平易文 1〜2 文）:

| key | label | description（方針） |
|-----|-------|---------------------|
| `tag-definition` | タグ定義 | タグの「語彙」を作る画面。会員を分類・検索するためのラベルそのものを登録・編集する。 |
| `tag-assignment` | タグ割当 | 提案されたタグをレビューして実際にメンバーへ付与する画面。語彙を作るのではなく、作った語彙を使う。 |
| `tag-code` | コード | タグをシステム内部で区別するための英数字の識別子。表示名から自動生成され、必要なら手で直せる。 |
| `tag-label` | 表示名 | 画面に表示されるタグの名前。日本語で分かりやすく付ける。 |
| `tag-category` | カテゴリ | タグをグループ分けする区分（地域・役割など）。 |
| `tag-suggestion` | 提案タグ | システムが「このメンバーに合いそう」と提案した、まだ確定していないタグ。 |
| `tag-unresolved` | 未解決 | まだレビューして割り当てるか決めていない提案タグの状態。 |
| `tag-resolve` | 割当を確定する | 提案タグを確認し、メンバーへ付与するか却下するかを決める操作。 |

### 2-3. `getTagTerm`

```ts
export function getTagTerm(key: string): TagGlossaryTerm | undefined {
  return TAG_MANAGEMENT_GLOSSARY.find((t) => t.key === key);
}
```

- **入力**: `key: string`。**出力**: 一致 term または `undefined`。**副作用**: なし。**エラー**: throw しない（未登録は `undefined`）。

---

## 3. C3 — `apps/web/src/components/admin/TagManagementGuide.tsx`（新規・#3）

### 3-1. 公開シグネチャ（SSOT §6 逐語）

```ts
export interface TagManagementGuideProps {
  /** 配置画面。説明文と相互リンクの向きを決める。 */
  variant: "definition" | "assignment";
  className?: string;
}
export function TagManagementGuide(props: TagManagementGuideProps): JSX.Element;
```

### 3-2. variant 別の内容

- `variant="definition"`（`/admin/tag-master` 冒頭）:
  - 説明: 「この画面ではタグの“語彙”を作ります。ここで作ったタグを、会員ディレクトリでメンバーを分類・検索するためのラベルとして使います。」（用語集 `tag-definition` 準拠）。
  - 相互リンク: 「作ったタグをメンバーに割り当てるには → タグ割当へ」（`href="/admin/tags"`・文言に「タグ割当」を含む）。
- `variant="assignment"`（`/admin/tags` 冒頭）:
  - 説明: 「この画面では、システムが提案したタグをレビューしてメンバーに割り当てます。タグそのものの追加・編集はここでは行いません。」（用語集 `tag-assignment` / `tag-resolve` 準拠）。
  - 相互リンク: 「タグそのものを追加・編集するには → タグ定義へ」（`href="/admin/tag-master"`・文言に「タグ定義」を含む）。

### 3-3. 実装方針

- 文言・用語は `tagManagementGlossary.ts` の `getTagTerm` から引く（ハードコード文言の重複を避ける。SSOT で一元管理）。
- 既存 primitive（`Card` / `Button`(リンク用) / `Icon`）で構成。**新 primitive を生やさない**（不変条件 #3）。
- 相互リンクは Next.js `Link`（既存 admin の内部遷移パターンに合わせる。`ButtonLink` 相当が既存にあれば再利用）。
- 色は **OKLch token / class のみ**（HEX 直書き・`bg-[#xxx]` 禁止・AC-11）。`className` props は外側 wrapper に合成する。
- **stateless**（props のみ・状態なし）。`variant` で説明文 / リンク向きを排他的に切り替える。

---

## 4. C1/C4 — `apps/web/src/components/admin/TagDefinitionCreateForm.tsx`（編集・#8）

> 実装時に既存 `TagDefinitionCreateForm.tsx` を Read し、現状の state（`code` / `label` / `category` の管理方法）・`FormField` / `Input` の使用・`createTag` 呼び出し shape を確認してから差分を当てる。**フォーム送信 shape（`createTag` の引数）は変えない**（不変条件 #5 / AC-12）。

### 4-1. state 追加（C1）

- 内部 state に `codeDirty: boolean`（初期 `false`）を追加（`const [codeDirty, setCodeDirty] = useState(false)`）。
- `import { generateTagCode } from "../../lib/admin/tagCodeAutogen";`（既存 import 構造に合わせ相対パス調整）。

### 4-2. 表示名 onChange → 自動補完（AC-1）

```ts
// 表示名入力の onChange
const onLabelChange = (next: string) => {
  setLabel(next);
  if (!codeDirty) {
    setCode(generateTagCode(next));
  }
};
```

- `codeDirty` が `false` の間だけコードを自動補完。手動編集後は追随しない。

### 4-3. コード onChange → 自動上書き停止（AC-2）

```ts
// コード入力の onChange
const onCodeChange = (next: string) => {
  setCode(next);
  setCodeDirty(true); // ユーザーが触れたら自動上書き停止
};
```

### 4-4. ヒント + 状態表示（AC-4）

- コード欄の近傍（`FormField` の help/description スロット等）に「表示名から自動生成（編集可）」のヒント文を表示。
- `codeDirty === false` の間は「自動生成中」相当のバッジ等で状態を可視化（既存 Badge primitive を再利用）。手動編集後は状態が変わる（バッジ消失 or 「手動編集中」等）。

### 4-5. 文言平易化（C4 / AC-9 / SSOT §6 C4）

- 技術文言「既存の tag master API に新しいタグ定義を追加します」を削除し、用語集準拠の平易文へ置換:
  - 「ここで新しいタグを作成します。タグは会員ディレクトリでメンバーを分類・検索するためのラベルです。」
- 「tag master API」等の技術語を本フォーム文言から排除（AC-9 / Phase 4 TC-F-PLAIN-01）。

- **入力**: 表示名 / コード / カテゴリの UI 入力。**出力**: 既存と同じ `createTag` ペイロード（現在の `code` 値）。**副作用**: 内部 state 更新のみ。**エラーハンドリング**: `generateTagCode` は throw しないため自動補完で例外が出ない。

---

## 5. C2/C4 — 命名統一（編集・#9）

- `tag-queue` ナビ項目の label `"タグキュー"` → `"タグ割当"`（L84 付近）。`href`（`/admin/tags`）は不変。`isNavItemActive` の active 判定に影響なし（label のみ変更）。
- 実装時に該当行を Read し、`label: "タグキュー"` を `label: "タグ割当"` へ置換する（AC-5）。
- `TagQueuePanel.tsx` の region label は `"タグ割当"` へ統一する。queue resolve の状態遷移・API 呼び出し・drawer contract は変更しない。
- `MemberDrawer.tsx` の `/admin/tags?memberId=...` 導線文言は `"タグ割当へ"` へ統一する。href と query contract は変更しない。
- 既存 `TagQueuePanel.component.spec.tsx` / `shell-config.spec.ts` を実文言に合わせ、DOM contract と active 判定の非退化を確認する。

---

## 6. C3/C4 — page.tsx 編集（#10, #11）

### 6-1. `apps/web/app/(admin)/admin/tag-master/page.tsx`（#10・C3）

- `import { TagManagementGuide } from "@/components/admin/TagManagementGuide";`（既存 import alias に合わせる）。
- ページ本文の**冒頭**（`AdminPageHeader` 直後・主要パネル `TagDefinitionPanel` の直前）に `<TagManagementGuide variant="definition" />` を挿入（AC-6）。

### 6-2. `apps/web/app/(admin)/admin/tags/page.tsx`（#11・C3/C4）

- `import { TagManagementGuide } from "@/components/admin/TagManagementGuide";`。
- ページ本文の**冒頭**（`AdminPageHeader` 直後・`TagQueuePanel` の直前）に `<TagManagementGuide variant="assignment" />` を挿入（AC-7）。
- `AdminPageHeader` の説明文を用語集準拠で平易化（AC-9）:
  - 「AI が提案した未解決のタグを確認し、メンバーに割り当てます。」相当。
  - タイトル「タグ割当」は**維持**。eyebrow `ADMIN / TAGS` は維持可。
- 実装時に既存 `AdminPageHeader` 呼び出し（`eyebrow` / `title` / `description` のプロパティ名）を Read し整合させる。`AdminPageHeader` を使っていない場合は当該見出しの description テキストを上記文言へ置換する（文言が正本・実装方法は既存構造に合わせる）。

---

## 7. ローカル実行・検証コマンド（SSOT §11）

```bash
# 型 / lint（web のみ）
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint

# focused unit / component（ルートからフルパス指定）
mise exec -- pnpm --filter web exec vitest run \
  src/lib/admin/__tests__/tagCodeAutogen.spec.ts \
  src/lib/admin/__tests__/tagManagementGlossary.spec.ts \
  src/components/admin/__tests__/TagManagementGuide.component.spec.tsx \
  src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx

# デザイントークン（HEX 直書き 0 件）
mise exec -- pnpm --filter web verify:tokens

# API 非接触の確認（空であること・AC-10）
git diff origin/dev...HEAD -- apps/api

# 命名統一（AC-5 静的確認）
grep -n "タグキュー" apps/web/src/components/shell/shell-config.ts   # ヒット 0 件であること
grep -n "タグ割当" apps/web/src/components/shell/shell-config.ts     # ヒットすること

# 仕様書側 CI gate pre-flight
mise exec -- pnpm -s gate-metadata:validate
mise exec -- pnpm -s verify:phase12-compliance docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen
```

## 8. DoD（SSOT §9 反映）

- AC-1〜AC-12 を満たす実装手順が本 phase に記述されている（§1〜§6）。
- 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）が §0 に列挙されている。
- 関数シグネチャ（`generateTagCode` / `getTagTerm` / `TagManagementGuide`）が §1 / §2 / §3 に明記されている。
- テスト方針は Phase 4 / Phase 6 を正本とする。
- ローカル実行 / 検証コマンド（SSOT §11）が §7 に記述されている。
- 実装後の検証: `typecheck` / `lint` / focused vitest / `verify:tokens` / `git diff -- apps/api` 空。
- spec 側 CI gate: `gate-metadata:validate`（Gate-A passed / ERROR 0）/ `verify:phase12-compliance`（ok:true）。

> **本サイクルで実装済み。** commit / push / PR は Phase 13、staging 反映後の screenshot 取得は Phase 11（いずれも user-gated）。

## 統合テスト連携

- 本タスクは web 表現層単体で完結し、API / D1 / Google Form を触らない（不変条件 #1 / #6・AC-10）。結合テストは新規追加せず、`createTag` mutation shape を不変に保つことで既存 API 結合を維持する。
- `TagDefinitionCreateForm` への自動補完追加が `TagDefinitionPanel` との既存統合（パネル ↔ 作成フォーム）を壊さないことを、Phase 4 §8 / Phase 6 の回帰確認で担保する。
- Lane C1〜C5 を同一 wave で実装し、focused vitest GREEN + `verify:tokens` HEX 0 件 + `git diff -- apps/api` 空を一括確認することで、機能（自動生成）・情報設計（ガイド）・命名（label）・テスト（回帰）の統合整合を確認する。

## 完了条件

- [x] 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）が §0 に表で再掲されている。
- [x] `generateTagCode` の 8 ステップ・`KANA_ROMAJI_MAP` 構成・`TAG_CODE_PATTERN`・fallback `tag_<djb2 base36>` が §1 に記述され、入力 / 出力 / 副作用なし / throw しないが定義されている。
- [x] `TagGlossaryTerm` 型・`TAG_MANAGEMENT_GLOSSARY` 必須 8 キー・`getTagTerm` が §2 に記述されている。
- [x] `TagManagementGuide` の props（variant）・variant 別説明文 / 相互リンク向き・既存 primitive 合成・OKLch token のみが §3 に記述されている。
- [x] `TagDefinitionCreateForm` の `codeDirty` state 追加・自動補完・上書き停止・ヒント・平易文言が §4 に記述されている。
- [x] `shell-config.ts` / `TagQueuePanel.tsx` / `MemberDrawer.tsx` の「タグ割当」文言統一が §5 に記述されている。
- [x] tag-master/page.tsx・tags/page.tsx のガイド挿入位置と tags 説明文平易化が §6 に記述されている。
- [x] 各関数の入力・出力・副作用・エラーハンドリングが定義されている。
- [x] ローカル実行・検証コマンド（SSOT §11）が §7 に再掲されている。
- [x] DoD（SSOT §9）が §8 に反映されている。
- [x] 実装と local evidence は本サイクルで完了し、staging deploy / authenticated screenshot / commit / PR は user-gated と明記されている。
