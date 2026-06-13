# shared-context.md — SSOT（admin-tag-management-clarity-and-code-autogen）

> このファイルが全 Phase / outputs の正本（Single Source of Truth）。
> 各 phase-\*.md と outputs/\* は本ファイルを参照し、矛盾時は本ファイルを優先する。
> 実装区分: **実装仕様書**（VISUAL）。CONST_005 必須項目をすべて含み、CONST_007 の「1 本サイクル完了」スコープに収める。

---

## 0. メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `admin-tag-management-clarity-and-code-autogen` |
| 起点 | staging 観察 + ユーザー報告（2026-06-11 06:44 / `/admin/tag-master`・`/admin/tags`） |
| relatedIssue | null（staging 観察起点・新規 issue 未起票） |
| task_type | implementation |
| visual_category | VISUAL |
| workflow_state | `implemented_local_evidence_captured`（apps/web 実装・local evidence 取得済み。commit / PR / staging visual は user-gated） |
| implementation_mode | new |
| branch | `feat/admin-tag-management-clarity-and-code-autogen` |
| scope_routes | `/admin/tag-master`（タグ定義）, `/admin/tags`（タグ割当） |
| api_endpoints_in_scope | 既存のみ（`GET/POST /admin/tags`, `GET /admin/tags/queue` ほか）。**新規追加・変更なし** |

---

## 1. 対象画面とユーザー報告

ユーザー（非エンジニアの管理者を想定）の生報告（2026-06-11）を 4 つの主問題に分解する。

| # | ユーザーの声（要約） | 解釈した主問題 |
|---|----------------------|----------------|
| R-1 | 「（タグ定義で）どういう内容を入れたらいいか分からないので自動生成してほしい」 | タグ定義フォームの **`コード` フィールド**（現状 `a-z0-9_` 手動入力・例 `region_kobe`）を非エンジニアが何を入れるか分からない。**表示名から自動生成**したい。 |
| R-2 | 「タグキューで作成したらタグ定義の方で管理するのは冗長では？タグの割り当てとタグの定義がいまいちリンクしていない」 | **2 画面（タグ定義 / タグ割当）の役割と関係が伝わらない**。語彙の定義（マスター）と、提案レビュー→割当の作業が別物であることが画面から読み取れない。 |
| R-3 | 「タグキューとタグ割当でページ名がそれぞれ違うのが気になる」 | サイドバー label が **「タグキュー」**、ページ内タイトルが **「タグ割当」** で**名称不一致**。 |
| R-4 | 「非エンジニアが管理者権限で操作する前提で直感的な日本語にしてほしい」 | フォーム・説明文に技術用語（"tag master API" 等）が残り、非エンジニアに不親切。 |

### 現状把握（Explore 調査確定・2026-06-11）

- `/admin/tag-master`（サイドバー「タグ定義」）= タグ語彙のマスター。`TagDefinitionPanel`（一覧 + 編集）+ `TagDefinitionCreateForm`（コード / 表示名 / カテゴリ）。**コードは手動入力・自動生成ロジックなし**（`CODE_PATTERN = /^[a-z0-9][a-z0-9_]{0,63}$/`）。
- `/admin/tags`（サイドバー「タグキュー」/ ページ内「タグ割当」）= AI 提案された未解決タグをレビューしメンバーへ割り当てる。`TagQueuePanel` + `TagsQueueResolveDrawer`。
- タグ管理に関する**用語集 SSOT は未実装**（`schemaGlossary.ts` / `schemaHistoryGlossary.ts` は既存の参考例）。
- 2 画面の関係を説明するガイド UI は**未実装**。

---

## 2. 真の論点（要件レビュー思考法・一次結論）

1. **真の論点**: タグ管理の 2 画面（**定義** = 語彙を決める / **割当** = 決めた語彙をメンバーに付与する）の責務関係が非エンジニアに伝わらず、(a) コード入力の障壁と (b) IA 命名の不一致が直感性を損なっている。
2. **依存・責務境界**: 2 画面は API も責務も別系統（定義 = tag master CRUD / 割当 = queue resolve）。**この境界は維持する**（統合しない）。不足しているのは「境界を説明する表現層」だけ。
3. **価値とコストの不均衡**: 価値が最も高く低コストなのは「説明 UI + 命名統一 + コード自動生成」。**API / D1 / Form を触らない表現層変更**で完結する。1 画面統合（R-2 の別案）は API/データ構造が別系統のため高コスト・本サイクル外。
4. **改善優先順位**: C2（命名統一・最小） < C1（コード自動生成） ≒ C3（説明 UI / 用語集 / 相互リンク） < C4（文言平易化・C1/C3 に内包）。すべて 1 サイクルで完了。
5. **4 条件評価**: 価値性◎（非エンジニアの操作コスト低減）/ 実現性◎（表現層のみ・既存 primitive 再利用）/ 整合性◎（責務境界維持・API 不変）/ 運用性◎（用語集 SSOT 化で今後の文言ドリフト防止）。

### 強化ループ / バランスループ

- 強化ループ: 用語集 SSOT 化 → 文言一貫性 → 非エンジニアの理解 → 誤操作減 → 運用負荷減。
- バランスループ: コード自動生成は「手動上書き」で抑制（自動値が不適切な場合に管理者が上書きでき、上書き後は自動上書きを停止）。

---

## 3. AskUser 確定事項（2026-06-11）

| 質問 | 回答 |
|------|------|
| 「自動生成」の対象 | **コードを表示名から自動生成**（手動上書き可・コード欄は残す） |
| 命名の統一先 | **「タグ割当」に統一**（サイドバー「タグキュー」→「タグ割当」） |
| 2 画面の関係整理 | **説明 UI + 相互リンクで関係を可視化**（1 画面統合はしない・責務境界 / API 維持） |

---

## 4. Concern（Lane）定義（CONST_007: 全 Lane を 1 本サイクルで完了）

| Lane | 概要 | 主対象 | 種別 |
|------|------|--------|------|
| **C1** | コード自動生成（表示名 → slug、手動上書き可） | `TagDefinitionCreateForm.tsx` + 新規純関数 `tagCodeAutogen.ts` | 機能追加（表現層） |
| **C2** | 命名統一「タグ割当」（サイドバー label とユーザー向け導線文言の変更） | `shell-config.ts` / `TagQueuePanel.tsx` / `MemberDrawer.tsx` | IA 命名 |
| **C3** | 説明 UI + 用語集 SSOT + 相互リンク | 新規 `TagManagementGuide.tsx` + `tagManagementGlossary.ts`、両 page.tsx | 情報設計（表現層） |
| **C4** | 非エンジニア向け文言平易化 | `TagDefinitionCreateForm.tsx` / `tags/page.tsx` / `TagQueuePanel.tsx` / `MemberDrawer.tsx`（用語集経由・導線文言統一） | 文言（C1/C2/C3 に内包） |
| **C5** | 上記すべてを回帰テストで保護 | 各 `__tests__/*.spec.ts(x)` | テスト |

すべて **apps/web 表現層**で完結。新 API endpoint・D1 schema 変更・Google Form 仕様変更を行わない（不変条件 §7）。

---

## 5. 対象ファイル一覧（implementation_targets）

### 新規作成（product 3 + spec 4 = 7）

| パス | 役割 |
|------|------|
| `apps/web/src/lib/admin/tagCodeAutogen.ts` | C1。純関数 `generateTagCode(label)`（表示名→`a-z0-9_` slug、kana ローマ字化 + fallback）。副作用なし・throw しない。 |
| `apps/web/src/lib/admin/tagManagementGlossary.ts` | C3/C4。タグ管理の用語集 SSOT（純データ）。タグ定義 / タグ割当 / コード / 表示名 / カテゴリ / 提案 / 未解決 等の平易日本語定義。 |
| `apps/web/src/components/admin/TagManagementGuide.tsx` | C3。2 画面冒頭に置く目的説明 + 相互リンク UI（`variant: "definition" \| "assignment"`）。stateless。 |
| `apps/web/src/lib/admin/__tests__/tagCodeAutogen.spec.ts` | C5。`generateTagCode` の純関数テスト。 |
| `apps/web/src/lib/admin/__tests__/tagManagementGlossary.spec.ts` | C5。用語集 SSOT の網羅・キー整合テスト。 |
| `apps/web/src/components/admin/__tests__/TagManagementGuide.component.spec.tsx` | C5。variant 別の説明文・相互リンク描画テスト。 |
| `apps/web/src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx` | C5。コード自動生成・手動上書き挙動テスト（既存があれば追記）。 |

> 既存テスト `TagDefinitionPanel.component.spec.tsx` 等は破壊しない（DOM contract 維持）。`TagDefinitionCreateForm.component.spec.tsx` が未存在なら新規、存在すれば追記。

### 編集（product 6 + spec 2）

| パス | 変更内容 |
|------|----------|
| `apps/web/src/components/admin/TagDefinitionCreateForm.tsx` | C1/C4。表示名 onChange → `codeDirty` false 時に `generateTagCode` で `code` 自動補完。code を手動編集したら `codeDirty=true` で自動上書き停止。「自動生成」ヒント表示。技術文言（"既存の tag master API に新しいタグ定義を追加します"）を用語集経由の平易文へ。 |
| `apps/web/src/components/shell/shell-config.ts` | C2。`tag-queue` の label `"タグキュー"` → `"タグ割当"`（L84 付近）。 |
| `apps/web/app/(admin)/admin/tag-master/page.tsx` | C3。`TagManagementGuide variant="definition"` を冒頭に挿入。 |
| `apps/web/app/(admin)/admin/tags/page.tsx` | C3/C4。`TagManagementGuide variant="assignment"` を冒頭に挿入。`AdminPageHeader` の説明文を用語集準拠で平易化（タイトル「タグ割当」は維持）。 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | C2/C4。ユーザー向け region label を「タグ割当」へ統一（割当ロジック不変）。 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | C2/C4。会員 drawer からのリンク文言を「タグ割当へ」へ統一（href 不変）。 |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | C5。`TagQueuePanel` の region label 変更を回帰保護。 |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | C5。サイドバー label「タグ割当」と sibling route contract を回帰保護。 |

### 非接触（不変条件で保証）

- `apps/api/**`（`git diff origin/dev...HEAD -- apps/api` が空）
- D1 migrations / schema
- `apps/web/src/features/admin/api/tags.ts`（API 呼び出し shape 不変）
- `TagsQueueResolveDrawer.tsx`（割当ロジック不変。`TagQueuePanel.tsx` は表示 label のみ変更）
- `tokens.css` / OKLch token 定義（新規 HEX 直書き禁止）

---

## 6. 関数シグネチャ / データ構造

### C1 — `apps/web/src/lib/admin/tagCodeAutogen.ts`（新規・純データ + 純関数）

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

**`generateTagCode` のアルゴリズム（決定的・テスト可能）**:
1. `label` を `String(label ?? "")` で受け、前後空白除去。空なら `""` 用 fallback へ。
2. NFKC 正規化 → 小文字化。
3. ひらがな / カタカナを `KANA_ROMAJI_MAP` でローマ字へ（拗音・促音・長音の最小対応。未収録文字はスキップ）。
4. 残る `[a-z0-9]` 以外の連続を単一 `_` へ置換。
5. 先頭/末尾の `_` 除去、連続 `_` の畳み込み、先頭が `[a-z0-9]` でなければ先頭の非英数を除去。
6. 64 文字に切り詰め（末尾 `_` を再除去）。
7. 結果が空文字なら fallback `tag_` + `djb2(label)` を base36 化（先頭が数字でも `tag_` 接頭で `[a-z]` 始まり保証）。
8. 返り値は必ず `TAG_CODE_PATTERN` に一致する（テストで全分岐を確認）。

> **設計判断（記録）**: 漢字のローマ字化は本サイクルでは行わない（辞書が重く・読み曖昧性があるため）。漢字主体の表示名は fallback `tag_<hash>` になる。code は技術識別子であり、非エンジニアにとって重要なのは表示名であるため許容する（OOS: 将来の漢字→読み変換は未タスク候補 §12）。

### C1 — `TagDefinitionCreateForm.tsx`（編集）

- 内部 state に `codeDirty: boolean`（初期 false）を追加。
- 表示名入力の `onChange(label)`: `setLabel(label); if (!codeDirty) setCode(generateTagCode(label));`
- コード入力の `onChange(code)`: `setCode(code); setCodeDirty(true);`（ユーザーが触れたら自動上書き停止）
- コード欄横に「表示名から自動生成（編集可）」のヒント文を表示。`codeDirty` が false の間は「自動生成中」のバッジ等で状態可視化。
- フォーム送信時の値は現在の `code`（自動生成値 or 手動上書き値）。既存の `createTag` 呼び出し shape は不変。

### C3 — `apps/web/src/lib/admin/tagManagementGlossary.ts`（新規・純データ）

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

収録必須キー（最低限）: `tag-definition`（タグ定義）, `tag-assignment`（タグ割当）, `tag-code`（コード）, `tag-label`（表示名）, `tag-category`（カテゴリ）, `tag-suggestion`（提案タグ）, `tag-unresolved`（未解決）, `tag-resolve`（割当を確定する）。

### C3 — `apps/web/src/components/admin/TagManagementGuide.tsx`（新規・stateless）

```ts
export interface TagManagementGuideProps {
  /** 配置画面。説明文と相互リンクの向きを決める。 */
  variant: "definition" | "assignment";
  className?: string;
}
export function TagManagementGuide(props: TagManagementGuideProps): JSX.Element;
```

- `variant="definition"`: 「この画面ではタグの“語彙”を作ります。…」+ 「作ったタグをメンバーに割り当てるには → タグ割当へ」リンク（`/admin/tags`）。
- `variant="assignment"`: 「この画面では提案されたタグをレビューしてメンバーに割り当てます。…」+ 「タグそのものを追加・編集するには → タグ定義へ」リンク（`/admin/tag-master`）。
- 文言・用語は `tagManagementGlossary.ts` から引く。既存 primitive（`Card` / `Button`(リンク) / `Icon`）で構成。新 primitive を生やさない。OKLch token のみ（HEX 直書き禁止）。
- 相互リンクは Next.js `Link`（既存 admin の内部遷移パターンに合わせる。`ButtonLink` 相当が既存にあれば再利用）。

### C2 — `apps/web/src/components/shell/shell-config.ts`（編集）

- `tag-queue` ナビ項目の label `"タグキュー"` → `"タグ割当"`（href `/admin/tags` は不変）。active 判定（`isNavItemActive`）への影響なし。

### C4 — 文言平易化

- `TagDefinitionCreateForm.tsx` の説明「既存の tag master API に新しいタグ定義を追加します」→ 「ここで新しいタグを作成します。タグは会員ディレクトリでメンバーを分類・検索するためのラベルです。」（用語集準拠）。
- `tags/page.tsx` の `AdminPageHeader` 説明文を「AI が提案した未解決のタグを確認し、メンバーに割り当てます。」等へ平易化（用語集準拠）。eyebrow `ADMIN / TAGS` は維持可。

---

## 7. 不変条件

1. 既存 API surface のみ利用（新 endpoint / D1 schema / Google Form 変更禁止）。CLAUDE.md invariant #5（D1 直接アクセスは apps/api に閉じる）を継続。
2. OKLch tokens 正本化（HEX 直書き / `bg-[#xxx]` 禁止・`verify-design-tokens` で fail）。
3. プロトタイプ primitives 正本順位（新 primitive を生やさない・既存 `Card`/`Button`/`FormField`/`Input` を合成）。
4. admin form input は `FormField` 経由を標準とする（CLAUDE.md invariant #9）。
5. admin mutation は `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md invariant #10。本タスクは mutation shape を変えない）。
6. apps/api 非接触（`git diff origin/dev...HEAD -- apps/api` が空）。
7. 既存テストの DOM contract（testid / role / aria）を破壊しない。ガイド/ヒントは追加のみ。

---

## 8. 受け入れ基準（AC）

| AC | 内容 | Lane | 検証 |
|----|------|------|------|
| AC-1 | タグ定義フォームで表示名を入力すると、コード欄が `generateTagCode(label)` の値で自動補完される | C1 | component spec |
| AC-2 | コード欄を手動編集した後は、表示名を変えてもコードが自動上書きされない（`codeDirty`） | C1 | component spec |
| AC-3 | `generateTagCode` の返り値は常に `TAG_CODE_PATTERN` に一致する（空文字 / 日本語 / 記号のみ / 長文を含む全分岐） | C1 | unit spec |
| AC-4 | コード欄に「表示名から自動生成（編集可）」のヒントと自動生成中の状態表示がある | C1 | component spec |
| AC-5 | サイドバー label が「タグ割当」になり、ページ内タイトル「タグ割当」と一致する | C2 | shell-config spec / grep |
| AC-6 | `/admin/tag-master` 冒頭に `TagManagementGuide variant="definition"` が表示され、`/admin/tags` への相互リンクがある | C3 | component spec / page spec |
| AC-7 | `/admin/tags` 冒頭に `TagManagementGuide variant="assignment"` が表示され、`/admin/tag-master` への相互リンクがある | C3 | component spec / page spec |
| AC-8 | 用語集 `TAG_MANAGEMENT_GLOSSARY` に必須キーが揃い、`getTagTerm` が lookup できる | C3 | unit spec |
| AC-9 | 技術文言（"tag master API" 等）が非エンジニア向け平易文に置換される | C4 | grep / component spec |
| AC-10 | `apps/api` に差分がない（API/D1/Form 不変） | 全 | `git diff -- apps/api` 空 |
| AC-11 | HEX 直書き 0 件（OKLch token のみ） | C3 | `verify:tokens` / grep |
| AC-12 | 既存タグ管理テストが回帰しない（DOM contract 維持） | C5 | 既存 spec PASS |

---

## 9. DoD（Definition of Done）

- [x] AC-1〜AC-12 を満たす実装手順が phase-5 に記述され、apps/web 実装と local evidence 取得まで完了している。
- [x] 変更対象ファイル一覧（新規 7 / 編集 product 6 + spec 2 / 非接触）が phase-5 と Phase 12 成果物に列挙されている。
- [x] 関数シグネチャ（`generateTagCode` / `getTagTerm` / `TagManagementGuide`）が phase-2 / phase-5 に明記されている。
- [x] テスト方針（追加 spec ファイル・ケース・期待値）が phase-4 / phase-6 に記述されている。
- [x] ローカル実行 / 検証コマンド（§11）が phase-5 / phase-9 に記述されている。
- [x] 実装後の検証: `pnpm --filter web typecheck` / `pnpm --filter web lint` / focused vitest / `verify:tokens` / `git diff -- apps/api` 空。
- [x] spec 側 CI gate: `gate-metadata:validate`（Gate-A passed / ERROR 0）/ `verify:phase12-compliance`（ok:true）。

---

## 10. Phase 11 / capture 方針（implemented_local_evidence_captured 時点）

- 本サイクルは **implemented_local_evidence_captured**（local evidence 取得済み）。authenticated staging screenshot は未取得。
- Phase 11 evidence の主ソースは「実装後に取得する focused test + 手動テスト手順」で、screenshot は capture 計画（`staging_visual_pending_user_gate`）として記述する。
- VISUAL タスクだが implemented_local_evidence_captured のため、`outputs/phase-11/manual-test-result.md` は local deterministic evidence を `present`、authenticated staging screenshot を `staging_visual_pending_user_gate` として二層で記録する。
- 想定 canonical screenshot 名（staging deploy/auth user-gated で取得）:
  - `tag-definition-code-autogen.png`（表示名入力でコード自動補完 + ガイド表示）
  - `tag-assignment-guide-and-rename.png`（タグ割当ガイド + サイドバー「タグ割当」表示）

---

## 11. 検証コマンド（本サイクルで使用）

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

# API 非接触の確認
git diff origin/dev...HEAD -- apps/api   # 空であること

# 仕様書側 CI gate pre-flight
mise exec -- pnpm -s gate-metadata:validate
mise exec -- pnpm -s verify:phase12-compliance docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen
```

---

## 12. スコープ外（未タスク候補・本サイクルで分離する明確な理由つき）

| OOS | 内容 | 分離理由（CONST_007 例外） |
|-----|------|----------------------------|
| OOS-1 | 2 画面の 1 画面統合（タブ等） | 定義 = tag master CRUD / 割当 = queue resolve は **API・データ構造が別系統**。統合は API 層設計を要し本サイクル（表現層のみ）で破綻する。R-2 は「説明 UI + 相互リンク」で意図を満たす（AskUser 確定）。実施場所: 将来 Issue。 |
| OOS-2 | 漢字 → 読み（ローマ字）変換でのコード生成 | 読み辞書が重く読み曖昧性がある。本サイクルは fallback `tag_<hash>` で十分（code は技術識別子）。実施場所: 将来 Issue（必要性が出た場合）。 |
| OOS-3 | `TagMasterEditForm`（編集フォーム）へのコード自動生成適用 | 編集時は既存コードが存在し自動生成の意味が薄い（rename は別タスク #1069 等で扱い済み）。本サイクルは新規作成フォームに限定。 |

> OOS-1〜3 は「分量」ではなく技術的・整合性的理由で分離。実装は本サイクルでは行わない。
