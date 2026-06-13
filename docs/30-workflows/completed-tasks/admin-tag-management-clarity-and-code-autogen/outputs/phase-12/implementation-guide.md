# Implementation Guide

[実装区分: 実装仕様書]

`/admin/tag-master`（タグ定義）と `/admin/tags`（タグ割当）の直感性を 1 サイクルで改善する実装ガイド。本タスクは `implemented_local_evidence_captured`（apps/web 実装・local evidence 取得済み）であり、staging visual・commit・PR は user-gated。識別子は SSOT §6 と一致させる。

## Part 1（やさしい説明・専門用語を避けて）

タグは、会員さんに貼る「シール」のようなものです。たとえば「神戸エリア」「ボランティア参加」といったシールを作って、会員一覧で絞り込んだり分類したりできます。

この改善には 2 つの画面が関わります。1 つ目の「タグ定義」は、**どんなシールを作るか**を決める場所です。2 つ目の「タグ割当」は、**作ったシールを誰に貼るか**を決める場所です。これまでこの 2 つの画面がどう違うのか分かりにくかったので、それぞれの画面の上に「この画面でできること」と、もう一方の画面への案内リンクを置きました。

タグ定義では、これまで「コード」という欄に英数字を自分で考えて入れる必要があり、何を入れればよいか分かりにくいものでした。そこで、シールの名前（表示名）を入れると、コードを自動で作るようにしました。自動で作った値が気に入らなければ、自分で書き換えることもできます（書き換えた後は自動で上書きされません）。

また、サイドバーで「タグキュー」と表示されていた項目を、画面のタイトルと同じ「タグ割当」に直し、名前のずれをなくしました。難しい言葉（「tag master API」など）も、やさしい日本語に置き換えました。色は既存のデザイン設定だけを使い、データベースやフォームの仕組みは一切触っていません。

## Part 2（技術者向け）

### 実装内容

- C1: `apps/web/src/lib/admin/tagCodeAutogen.ts`（新規・純関数 + 純データ）。`generateTagCode(label: string): string` は NFKC 正規化 → 小文字化 → kana ローマ字化 → 非英数の `_` 化 → 整形 → 64 文字切り詰め → 空なら fallback `tag_<djb2(label) base36>` の決定的アルゴリズムで、返り値は必ず `TAG_CODE_PATTERN` に一致する。副作用なし・throw しない。
- C1: `TagDefinitionCreateForm.tsx` に内部 state `codeDirty: boolean`（初期 `false`）を追加。表示名 `onChange(label)` で `if (!codeDirty) setCode(generateTagCode(label))`、コード `onChange(code)` で `setCode(code); setCodeDirty(true)`。コード欄に「表示名から自動生成（編集可）」ヒントと自動生成中の状態表示を追加。`createTag` 呼び出し shape は不変。
- C3: `tagManagementGlossary.ts`（新規・純データ）に `TAG_MANAGEMENT_GLOSSARY: readonly TagGlossaryTerm[]`、`TAG_MANAGEMENT_COPY`、`getTagTerm(key: string): TagGlossaryTerm | undefined` を実装。`TagManagementGuide.tsx`（新規・stateless）は `variant: "definition" | "assignment"` で説明文と相互リンクの向きを切り替え、既存 primitive で構成。
- C2: `shell-config.ts` の `tag-queue` ナビ label `"タグキュー"` → `"タグ割当"`（href `/admin/tags` 不変）。`TagQueuePanel.tsx` と `MemberDrawer.tsx` のユーザー向け導線文言も「タグ割当」へ統一。
- C4: `TagDefinitionCreateForm.tsx` / `tags/page.tsx` / `TagManagementGuide.tsx` の技術文言を用語集 SSOT 経由の平易日本語へ。
- C5: `tagCodeAutogen.spec.ts` / `tagManagementGlossary.spec.ts` / `TagManagementGuide.component.spec.tsx` / `TagDefinitionCreateForm.component.spec.tsx` / `shell-config.spec.ts` / `TagQueuePanel.component.spec.tsx` で回帰保護。

### 型・シグネチャ（SSOT §6 と一致）

```ts
// tagCodeAutogen.ts
export function generateTagCode(label: string): string;
export const KANA_ROMAJI_MAP: Readonly<Record<string, string>>;
export const TAG_CODE_PATTERN: RegExp; // = /^[a-z0-9][a-z0-9_]{0,63}$/

// tagManagementGlossary.ts
export interface TagGlossaryTerm { key: string; label: string; description: string; }
export const TAG_MANAGEMENT_GLOSSARY: readonly TagGlossaryTerm[];
export const TAG_MANAGEMENT_COPY: {
  readonly createFormDescription: string;
  readonly assignmentHeaderDescription: string;
  readonly definitionGuideBody: string;
  readonly assignmentGuideBody: string;
};
export function getTagTerm(key: string): TagGlossaryTerm | undefined;

// TagManagementGuide.tsx
export interface TagManagementGuideProps { variant: "definition" | "assignment"; className?: string; }
export function TagManagementGuide(props: TagManagementGuideProps): JSX.Element;
```

### API シグネチャ

- API は新規追加・変更なし。既存 `GET/POST /admin/tags` / `GET /admin/tags/queue` のみ利用。`createTag` 呼び出し shape は不変。`apps/web/src/features/admin/api/tags.ts` 非接触（不変条件 §7-6）。

### エラーハンドリング

- `generateTagCode` は throw しない（WEEKGRD-02: ガードは無効値でなく安全な fallback を返す）。マッピング不能な漢字のみ等で生成不能な場合は決定的 fallback `tag_<base36 hash>` を返し、先頭 `tag_` で `[a-z]` 始まりを保証する。
- `getTagTerm` は未登録 key で `undefined` を返す（throw しない）。呼び出し側はラベル欠落を平易フォールバックで表示する。
- フォームのコード自動補完は表示層の補助であり、最終バリデーションは既存の `CODE_PATTERN` チェックを維持する。

### 定数

- `TAG_CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/`（既存フォームの `CODE_PATTERN` と同義・テスト/呼び出し側の確認用に export）。
- `KANA_ROMAJI_MAP`: ひらがな / カタカナ → ローマ字の最小変換表（拗音・促音・長音の最小対応・純データ）。

### 対象ファイル

#### 新規作成（apps/web product）

- `apps/web/src/lib/admin/tagCodeAutogen.ts`
- `apps/web/src/lib/admin/tagManagementGlossary.ts`
- `apps/web/src/components/admin/TagManagementGuide.tsx`

#### 新規作成（apps/web spec）

- `apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts`
- `apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts`
- `apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx`
- `apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx`（未存在なら新規 / 存在すれば追記）

#### 編集（apps/web）

- `apps/web/src/components/admin/TagDefinitionCreateForm.tsx`
- `apps/web/src/components/admin/TagQueuePanel.tsx`
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- `apps/web/src/components/shell/shell-config.ts`
- `apps/web/app/(admin)/admin/tag-master/page.tsx`
- `apps/web/app/(admin)/admin/tags/page.tsx`
- `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx`
- `apps/web/src/components/shell/__tests__/shell-config.spec.ts`

#### 非接触

- `apps/api/**` / `apps/api/migrations/**`
- `apps/web/src/features/admin/api/tags.ts`
- `TagsQueueResolveDrawer.tsx`
- `tokens.css` / OKLch token 定義

### 検証コマンド（本サイクルで使用・SSOT §11）

```bash
mise exec -- pnpm --filter web typecheck
mise exec -- pnpm --filter web lint
mise exec -- pnpm --filter web exec vitest run \
  src/lib/admin/__tests__/tagCodeAutogen.spec.ts \
  src/lib/admin/__tests__/tagManagementGlossary.spec.ts \
  src/components/admin/__tests__/TagManagementGuide.component.spec.tsx \
  src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx
mise exec -- pnpm --filter web verify:tokens
git diff origin/dev...HEAD -- apps/api   # 空であること
```

### 既知制約

- 漢字主体の表示名はローマ字辞書を持たないため fallback `tag_<hash>` になる（OOS-2・SSOT §12）。code は技術識別子であり、非エンジニアにとって重要なのは表示名であるため許容する。
- 編集フォーム（`TagMasterEditForm`）へのコード自動生成適用は本サイクル外（OOS-3）。
- 2 画面の 1 画面統合は API/データ構造が別系統のため本サイクル外（OOS-1）。
- staging deploy / authenticated screenshot 2 点 / commit / push / PR は user-gated。

## 視覚証跡

本タスクは `implemented_local_evidence_captured`（local evidence 取得済み）のため、authenticated staging screenshot は user-gated として分離する（`outputs/phase-11/phase11-capture-metadata.json` 参照）。capture 計画は `staging_visual_pending_user_gate`。

| canonical 名 | 内容 | status |
|------|------|--------|
| `tag-definition-code-autogen.png` | 表示名入力でコード自動補完 + 自動生成ヒント + `TagManagementGuide variant="definition"` | staging_visual_pending_user_gate |
| `tag-assignment-guide-and-rename.png` | `TagManagementGuide variant="assignment"` + サイドバー「タグ割当」 + 相互リンク | staging_visual_pending_user_gate |

Local dev では `outputs/phase-11/screenshots/local-auth-gate-tag-master.png` / `local-auth-gate-tags.png` を取得し、どちらも管理者ログイン画面で止まることを確認した。dev server log では Auth.js `MissingSecret` も出ており、対象 UI の canonical screenshot は認証済み staging で取得する。
