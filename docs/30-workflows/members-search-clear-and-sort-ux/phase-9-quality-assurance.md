# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 9 / 13 |
| 前提 | Phase 8（リファクタリング）完了。全テスト GREEN |
| ゲート種別 | 機械検証（tokens / lint / typecheck / 3層enum突合 / mirror parity） |

## 目的

実装が以下の品質ゲートを通過することを、列挙したコマンドで機械的に検証する。とくに (1) HEX 直書き 0 件（`verify-design-tokens`）と追加 CSS が色値を含まないこと、(2) sort enum の 3 層一致、(3) `.claude` → `.agents` mirror parity を確定させる。

## 実行タスク

### T9-1 typecheck / lint / 既存テスト非破壊

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

- typecheck: Phase 8 R2 の `MembersSearch["sort"]` 型注釈が通り、sort enum 3 層に型不整合が無いこと（exit 0）。
- lint: `pnpm lint` green。違反があれば `pnpm lint --fix` 後に残違反を手修正。
- 既存テスト非破壊: Phase 4-6 で列挙した 7 テストファイルが GREEN（`Search.spec.tsx` / `members-search.spec.ts` / `MemberFilters.client.spec.tsx` / `search-query-parser.spec.ts` / `list-public-members.spec.ts` / `viewmodel.spec.ts` / `publicMembers.repository.spec.ts`）。

### T9-2 verify-design-tokens（HEX 0 件 + 追加 CSS 色値なし）

```bash
# CI gate 本体（HEX 直書き / bg-[#xxx] / text-[#xxx] を検出）
mise exec -- pnpm verify:tokens

# 追加した CSS ルールが色値（hex / rgb / oklch / 色名）を含まないことを grep で確認
grep -n 'ui-search__input' apps/web/src/styles/globals.css
grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|oklch\(' apps/web/src/styles/globals.css | grep 'ui-search__input'
```

- `pnpm verify:tokens` が exit 0（HEX 0 件）。実装は `apps/web/src/components/ui/Search.tsx` の `className` 付与のみで色値を持ち込まない。
- 追加 CSS（`.ui-search__input::-webkit-search-cancel-button, .ui-search__input::-webkit-search-decoration`）が `-webkit-appearance / appearance / display` のみで、2 番目の grep が **0 hit**（色値を含まない）であること。AC-10 充足。

### T9-3 sort enum 3 層一致の grep 突合

3 層（web `SORT_VALUES` / api `SortZ` / shared `viewmodel.sort`）が `recent` / `oldest` / `name` / `name_desc` の 4 値で一致することを確認する。

```bash
# 各層が 4 値を含むことを確認（各行に recent/oldest/name/name_desc が揃う）
grep -nE 'recent.*oldest.*name.*name_desc' apps/web/src/lib/url/members-search.ts
grep -nE 'recent.*oldest.*name.*name_desc' apps/api/src/_shared/search-query-parser.ts
grep -nE 'recent.*oldest.*name.*name_desc' packages/shared/src/zod/viewmodel.ts

# 4 値以外の混入（typo）が無いことを確認（newest / asc / desc 等の別表記が無い）
grep -nE '"(newest|asc|desc|name_asc|date)"' apps/web/src/lib/url/members-search.ts apps/api/src/_shared/search-query-parser.ts packages/shared/src/zod/viewmodel.ts
```

- 前者 3 コマンドが各 1 hit 以上（同一行に 4 値が並ぶ enum 宣言）。
- 後者が **0 hit**（別表記の混入なし）。
- UI ラベルと value の対応は `MemberFilters.client.tsx:39-42` の `SORT_OPTIONS` を目視突合: `recent=新しい順` / `oldest=古い順` / `name=名前順` / `name_desc=名前の逆順`（index.md「ソート値マッピング」正本）。

### T9-4 ORDER BY 4 分岐の SQL 妥当性 grep

```bash
# 4 分岐の ORDER BY が member_id ASC タイブレークで終端することを確認
grep -nE 'ORDER BY.*member_id ASC' apps/api/src/repository/publicMembers.ts
# last_submitted_at DESC(recent) / ASC(oldest) と fullName ASC(name) / DESC(name_desc) の存在
grep -nE 'last_submitted_at (DESC|ASC)|ASC, mi.member_id|DESC, mi.member_id' apps/api/src/repository/publicMembers.ts
```

- 4 分岐すべてが `mi.member_id ASC` で終端（決定的順序）。

### T9-5 `.claude` → `.agents` mirror parity

skill / workflow 系の正本は `.claude`、`.agents` はミラー（不変条件: `.claude` 正本 + `.agents` mirror）。本タスクは `docs/30-workflows/` 配下のみ追加で skill 変更は無いが、wave 完了時の parity を確認する。

```bash
# .agents が .claude のミラーとして一致すること（symlink または byte-identical）
diff -qr .claude/skills .agents/skills 2>&1 | grep -v 'symbolic link' || echo "parity OK"
```

- `diff -qr` が差分 0（symlink ミラーの場合は symlink を辿って identical）。本タスクで skill ファイルを変更していないため drift 0 が期待値。

### T9-6 docs-only / 仕様生成ゲート（PR pre-flight 連動）

本ウェーブで以下の品質ゲートが green であることを確認する。

```bash
bash scripts/verify-pr-ready.sh
```

- `verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift が一括 green。

## 参照資料

- [phase-2-design.md](phase-2-design.md)（T2-1 CSS スニペット / T2-2 sort 3 層表 / T2-3 ORDER BY）
- [phase-8-refactoring.md](phase-8-refactoring.md)（R1/R2 リファクタ後の検証対象）
- `apps/web/src/styles/globals.css`（追加 CSS ルール）
- `apps/web/src/lib/url/members-search.ts:9` / `apps/api/src/_shared/search-query-parser.ts:7` / `packages/shared/src/zod/viewmodel.ts:158`（sort 3 層）
- `apps/api/src/repository/publicMembers.ts:97-120`（ORDER BY）
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`（HEX 禁止・トークン正本）
- `scripts/verify-design-tokens.ts`（`verify:tokens` 本体）

## 成果物

- typecheck / lint / 既存テスト非破壊コマンド（T9-1）
- verify-design-tokens + CSS 色値なし grep（T9-2）
- sort enum 3 層一致 grep 突合（T9-3）
- ORDER BY 4 分岐 SQL grep（T9-4）
- `.claude` → `.agents` mirror parity（T9-5）

## 統合テスト連携

品質保証で統合実行する検証:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
```

sort enum 3 層一致を grep で突合し、`.claude` 正本と `.agents` mirror の parity（`diff -qr`）を結合確認する。

## 完了条件

- [ ] `pnpm typecheck` / `pnpm lint` が exit 0 になる検証コマンドが列挙されている
- [ ] `pnpm verify:tokens`（HEX 0 件）と追加 CSS が色値を含まないことの grep（0 hit 期待）が記述されている
- [ ] sort enum 3 層（web/api/shared）一致の grep 突合コマンドが記述され、別表記混入 0 hit が期待値として明記されている
- [ ] ORDER BY 4 分岐が `member_id ASC` 終端であることの grep が記述されている
- [ ] `.claude` → `.agents` mirror parity（`diff -qr`）が記述されている
- [ ] 既存 7 テストファイルの非破壊が確認対象に含まれている
