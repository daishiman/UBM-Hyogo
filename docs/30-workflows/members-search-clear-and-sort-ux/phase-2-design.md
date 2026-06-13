# Phase 2: 設計

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 2 / 13 |
| 前提 | Phase 1 完了（inventory 確定） |

## 目的

案件 A（CSS 抑止戦略）と案件 B（sort enum 拡張・ORDER BY・3 層同期）の実装トポロジを確定し、SubAgent レーンと検証パスを設計する。

## 実行タスク

### T2-1 案件 A: ネイティブ×抑止の設計

**既存コンポーネント再利用（FB-SDK-07-1）**: 新規 UI を作らず、共通プリミティブ `Search.tsx` の既存構造（独自×ボタン）を維持する。

設計:

1. `Search.tsx` の `<input>` に識別用 `className="ui-search__input"` を付与する（CSS スコープを明示し、グローバル汚染を避ける）。
2. `globals.css` に以下を追加する（色値を含まない＝AC-10 / verify-design-tokens 非抵触）:

```css
/* 検索入力: ネイティブのクリア/装飾ボタンを抑止し、独自×ボタン（aria-label="クリア"）のみを正本とする */
.ui-search__input::-webkit-search-cancel-button,
.ui-search__input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}
```

3. 独自×ボタン（`Search.tsx:43-51`）は変更しない。`type="search"` は維持する（セマンティクスと Escape クリア挙動を保つ）。

**state 所有権**: 検索値は URL query が正本（不変条件 #8）。`useImeSafeInput` が内部の表示 value を保持し、commit で `onChange` 経由 URL 更新。本変更は描画のみで state 所有権を変えない。

**jsdom 制約の明示**: jsdom は `::-webkit-search-cancel-button` を描画しない。よってユニットテスト（T1）では「DOM 上の独自×ボタンが 1 つだけ存在し、複数の×が描画されない」ことと「input に `ui-search__input` クラスが付く」ことを検証する。ネイティブ×の実非表示は Phase 11 の VISUAL 検証で担保する（CSS は jsdom 非評価）。

### T2-2 案件 B: sort 値の 3 層同期設計

sort 値 `oldest` / `name_desc` を以下 3 層で**同一サイクル（same-wave）**に追加する。1 層でも欠けると enum 不整合で API レスポンス検証が落ちる。

| 層 | ファイル | 変更 |
|----|---------|------|
| URL 正規化（web） | `members-search.ts:9` | `const SORT_VALUES = ["recent", "name"]` → `["recent", "oldest", "name", "name_desc"]` |
| API パーサ | `search-query-parser.ts:7` | `export const SortZ = z.enum(["recent", "name"])` → `z.enum(["recent", "oldest", "name", "name_desc"])` |
| 共有 viewmodel | `viewmodel.ts:158` | `sort: z.enum(["recent", "name"])` → `z.enum(["recent", "oldest", "name", "name_desc"])` |

`toApiQuery`（`members-search.ts:66-76`）は `if (search.sort !== "recent")` のロジックを変更しない（`oldest` / `name_desc` は recent 以外なので自動的に URL へ反映される）。DEFAULT は `recent` を維持する（`search-query-parser.ts:14-24` の `DEFAULT_PUBLIC_MEMBER_QUERY.sort`）。

### T2-3 案件 B: ORDER BY 拡張設計（apps/api）

`publicMembers.ts:103-106` の三項演算子を switch 相当の 4 分岐へ拡張する。`fullNameExpr` は既存の `COALESCE(json_extract(r.answers_json, '$.fullName'), '')` を再利用する。

```ts
const fullNameExpr = `COALESCE(json_extract(r.answers_json, '$.${STABLE_KEY.fullName}'), '')`;
let orderBy: string;
switch (input.sort) {
  case "name":
    orderBy = `ORDER BY ${fullNameExpr} ASC, mi.member_id ASC`;
    break;
  case "name_desc":
    orderBy = `ORDER BY ${fullNameExpr} DESC, mi.member_id ASC`;
    break;
  case "oldest":
    orderBy = `ORDER BY mi.last_submitted_at ASC, ${fullNameExpr} ASC, mi.member_id ASC`;
    break;
  case "recent":
  default:
    orderBy = `ORDER BY mi.last_submitted_at DESC, ${fullNameExpr} ASC, mi.member_id ASC`;
    break;
}
```

**タイブレーク**: 全分岐で末尾に `mi.member_id ASC` を残し決定的順序を保証する（既存の DISTINCT + GROUP 集合定義と整合）。

**五十音順の限界（明記）**: `fullName` ソートは SQLite の既定 COLLATE（バイナリ＝Unicode コードポイント）順。ひらがな・カタカナは概ね あ→ん 順だが、漢字氏名は読みでなくコード順。真の五十音順はふりがなデータが無いため非対応（OOS-1 で未タスク化）。

### T2-4 案件 B: UI ラベル設計（apps/web）

`MemberFilters.client.tsx:39-42` の `SORT_OPTIONS` を刷新する。接頭辞「並び替え: 」を除去する（FormField の `label="並び替え"` が既に文脈を提供）。

```tsx
const SORT_OPTIONS = [
  { value: "recent", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "name", label: "名前順" },
  { value: "name_desc", label: "名前の逆順" },
];
```

`value` の型は `MembersSearch["sort"]` 経由で型安全（`as` キャストは既存踏襲）。`Select` 共通プリミティブ（`apps/web/src/components/ui/Select.tsx`）の `SelectOption` をそのまま使う。

### T2-5 因果ループと境界

- バランスループ: sort enum の 3 層が同期しているとき API レスポンス検証が通る → 1 層欠落で検証 fail → 同一 wave 同期が必須。
- 責務境界: 描画（Search.tsx / globals.css / MemberFilters）と並び順計算（publicMembers ORDER BY）と契約（viewmodel enum）を混在させない。UI は値を選ぶだけ、順序計算は API に閉じる（不変条件 #5: D1 アクセスは apps/api）。

### T2-6 SubAgent レーン設計（Phase 4-13）

| レーン | 担当 Phase | 関心 |
|--------|-----------|------|
| Lane A | 4, 5, 6 | テスト作成・実装・テスト拡充 |
| Lane B | 7, 8, 9, 10 | カバレッジ・リファクタ・QA・最終レビュー |
| Lane C | 11, 12, 13 + outputs/phase-11 + outputs/phase-12 | 手動テスト VISUAL・ドキュメント・PR |

検証レーンは直列で締める（Phase 9/10 → validators）。並列は 3 レーン以下。

## 参照資料

- Phase 1 inventory（変更 7 + テスト 7）
- `apps/web/src/components/ui/Select.tsx`（SelectOption）
- `apps/api/src/repository/publicMembers.ts:97-120`（listPublicMembers / ORDER BY）
- `packages/shared/src/zod/field.ts:70`（STABLE_KEY.fullName）
- `docs/00-getting-started-manual/specs/design-tokens.md`（HEX 禁止根拠）

## 成果物

- CSS 抑止スニペット（T2-1）
- sort 3 層同期表（T2-2）
- ORDER BY 4 分岐スニペット（T2-3）
- SORT_OPTIONS 刷新スニペット（T2-4）
- SubAgent レーン割当（T2-6）

## 統合テスト連携

設計の結合検証点を固定する。sort enum 3 層（`members-search.ts` / `search-query-parser.ts` / `viewmodel.ts`）が一致して初めて API レスポンス検証（`appliedQuery.sort`）が通る。ORDER BY 4 分岐の実順序は D1 contract（`publicMembers.repository.spec.ts`）で結合確認する。CSS 抑止はユニット非評価のため Phase 11 VISUAL（Chromium）で結合検証する。

## 完了条件

- [ ] ネイティブ×抑止 CSS が色値を含まず globals.css に追加される設計が確定
- [ ] sort 3 層（web / api / shared）の同期表が確定
- [ ] ORDER BY 4 分岐（recent/oldest/name/name_desc）の SQL 設計が確定
- [ ] UI ラベル 4 種・接頭辞除去が確定
- [ ] jsdom の CSS 非評価制約と VISUAL 担保範囲が明記されている
