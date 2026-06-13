# Phase 9: QA

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。検証コマンドの正本は §11、AC の正本は §8。

## 目的

本サイクルで実行した QA チェックリスト（typecheck / lint / focused vitest / verify:tokens / apps/api 空 diff / HEX 0 件 / 既存テスト回帰なし）を SSOT §11 を正本として確定し、各 AC への対応づけを行う。本タスクは追加中心（削除なし）であることを明記する。

## 実行タスク

- SSOT §11 のコマンドを QA チェックリスト（§下表）として転記し、合否基準を定義する。
- HEX 直書き 0 件を grep 手順（下記）で確認する。
- 既存タグ管理テスト（`TagDefinitionPanel.component.spec.tsx` 等）の回帰なし（DOM contract 維持 = AC-12）を確認する。
- ファイル削除がないため削除確認は N/A と明記する。
- 各 QA 項目を AC-1〜AC-12 に対応づける。

## 参照資料

- [shared-context.md](./shared-context.md) §8（AC）/ §9（DoD）/ §11（検証コマンド）
- [phase-7-coverage.md](./phase-7-coverage.md)（focused vitest 対象 spec）
- [phase-8-refactor.md](./phase-8-refactor.md)（DOM contract 維持方針）

## 1. QA チェックリスト（SSOT §11 を正本として転記）

> local deterministic evidence（typecheck / lint / focused vitest / token gate / api diff）は本サイクルで取得。staging 操作と authenticated screenshot のみ user-gated。

| # | コマンド | 合否基準 |
|---|----------|----------|
| QA-1 | `mise exec -- pnpm --filter web typecheck` | エラー 0（`generateTagCode` / `getTagTerm` / `TagManagementGuideProps` の型が整合） |
| QA-2 | `mise exec -- pnpm --filter web lint` | 違反 0（`--fix` で解消できない手修正残ゼロ） |
| QA-3 | `mise exec -- pnpm --filter web exec vitest run src/lib/admin/__tests__/tagCodeAutogen.spec.ts src/lib/admin/__tests__/tagManagementGlossary.spec.ts src/components/admin/__tests__/TagManagementGuide.component.spec.tsx src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx` | 対象 4 spec すべて GREEN（`generateTagCode` 全分岐 / `getTagTerm` 両分岐 / guide variant 2 経路 / form 自動補完・上書き停止） |
| QA-4 | `mise exec -- pnpm --filter web verify:tokens` | HEX 直書き 0 件で PASS（`verify-design-tokens` が fail しない） |
| QA-5 | `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | 出力 0 行（apps/api 非接触の確認 = AC-10） |
| QA-6 | `mise exec -- pnpm -s verify:phase12-compliance docs/30-workflows/completed-tasks/admin-tag-management-clarity-and-code-autogen` | 仕様書側 CI gate pre-flight: `ok:true` |
| QA-7 | `mise exec -- pnpm -s gate-metadata:validate` | gate-metadata: Gate-A passed / ERROR 0 |

> QA-3 の対象 spec 群は SSOT §11 と完全一致（`tagCodeAutogen.spec.ts` / `tagManagementGlossary.spec.ts` / `TagManagementGuide.component.spec.tsx` / `TagDefinitionCreateForm.component.spec.tsx`）。フルパス指定でルートから実行する（Phase 7 §統合テスト連携）。

## 2. AC との対応表

> [shared-context.md §8](./shared-context.md) の AC-1〜AC-12 を、上記 QA コマンドおよび spec へ対応づける。

| AC | 内容（要約） | 検証手段 | 対応 QA / spec |
|----|--------------|----------|----------------|
| AC-1 | 表示名入力でコード欄が `generateTagCode` 値で自動補完 | form component spec | QA-3（`TagDefinitionCreateForm.component.spec.tsx`） |
| AC-2 | コード手動編集後は自動上書きされない（`codeDirty`） | form component spec | QA-3（`TagDefinitionCreateForm.component.spec.tsx`） |
| AC-3 | `generateTagCode` 返り値が常に `TAG_CODE_PATTERN` 一致（全分岐） | unit spec | QA-3（`tagCodeAutogen.spec.ts`） |
| AC-4 | 「表示名から自動生成（編集可）」ヒント + 自動生成中状態表示 | form component spec | QA-3 |
| AC-5 | サイドバー label「タグ割当」がページ内タイトルと一致 | shell-config spec / grep | QA-3 / 下記 grep |
| AC-6 | `/admin/tag-master` 冒頭に guide(definition) + `/admin/tags` 相互リンク | guide / page spec | QA-3（`TagManagementGuide.component.spec.tsx`） |
| AC-7 | `/admin/tags` 冒頭に guide(assignment) + `/admin/tag-master` 相互リンク | guide / page spec | QA-3 |
| AC-8 | `TAG_MANAGEMENT_GLOSSARY` 必須キー揃い + `getTagTerm` lookup | unit spec | QA-3（`tagManagementGlossary.spec.ts`） |
| AC-9 | 技術文言（"tag master API" 等）が平易文に置換 | grep / component spec | 下記 grep / QA-3 |
| AC-10 | `apps/api` に差分なし | git diff gate | QA-5 |
| AC-11 | HEX 直書き 0 件（OKLch token のみ） | verify:tokens / grep | QA-4 / 下記 grep |
| AC-12 | 既存タグ管理テストが回帰しない（DOM contract 維持） | 既存 spec PASS | QA-3 + 既存 spec |

## 3. HEX 直書き 0 件確認（AC-11）

```bash
# 新規 / 編集対象に HEX リテラル・bg-[#xxx] / text-[#xxx] が無いこと（0 件期待）
grep -rnE '#[0-9a-fA-F]{3,6}\b|(bg|text|border)-\[#' \
  apps/web/src/components/admin/TagManagementGuide.tsx \
  apps/web/src/components/admin/TagDefinitionCreateForm.tsx \
  apps/web/src/lib/admin/tagManagementGlossary.ts \
  apps/web/app/\(admin\)/admin/tag-master/page.tsx \
  apps/web/app/\(admin\)/admin/tags/page.tsx
```

- 期待: **0 件**。色は `tokens.css` の OKLch token クラスのみ使用（不変条件 #2）。
- `verify:tokens`（QA-4）でも CI gate として fail 判定する。

## 4. 技術文言の置換確認（AC-9）

```bash
# 旧技術文言が残っていないこと（0 件期待）
grep -rn 'tag master API' apps/web/src/components/admin/TagDefinitionCreateForm.tsx
```

- 期待: **0 件**。「ここで新しいタグを作成します。…」等の平易文（SSOT §6 C4）へ置換済み。

## 5. apps/api 非接触の空確認（AC-10）

```bash
git diff origin/dev...HEAD -- apps/api apps/api/migrations
```

- 期待: **出力 0 行**。本サイクルの変更は apps/web 表現層のみ（不変条件 #5/#6）。
- 非空になった場合は API 接触の混入を意味し QA を fail とする。

## 6. 既存テスト回帰なし確認（DOM contract / AC-12）

- 既存 `TagDefinitionPanel.component.spec.tsx`・タグ管理関連 spec が GREEN であること。
- ガイド / ヒントは**追加のみ**で、既存 `FormField` / `Input` の testid / role / aria を変更しない（不変条件 #7）。
- `TagQueuePanel` は region label のみ変更、`TagsQueueResolveDrawer` の内部 DOM は不変。

## 7. ファイル削除確認 [FB-UI-02-1]

> [FB-UI-02-1] は「削除されたファイルの不在確認」を要求するが、**本タスクは追加中心でファイル削除が無いため該当なし（N/A）**と明記する。

- 新規作成: `tagCodeAutogen.ts` / `tagManagementGlossary.ts` / `TagManagementGuide.tsx` + 4 spec（追加のみ）。
- 編集: `TagDefinitionCreateForm.tsx` / `shell-config.ts` / `tag-master/page.tsx` / `tags/page.tsx`（更新のみ）。
- 削除ファイルは 0 件 → 削除不在確認の対象項目は **N/A**。

## 統合テスト連携

- QA-3 の 4 spec を focused vitest フルパスで実行し、Phase 7 のカバレッジ目標（`generateTagCode` line/branch 100% / `getTagTerm` 両分岐 / guide variant 2 経路）が満たされることを確認する。
- 既存 spec の回帰なしを併せて確認し、AC-12（DOM contract 維持）の統合的検証とする。
- staging 手動 QA（user-gated）: `/admin/tag-master` で表示名入力 → コード自動補完、サイドバー「タグ割当」表示、両画面冒頭のガイド + 相互リンク表示を確認（Phase 11）。

## 成果物

- 本ファイル（`phase-9-qa.md`）= QA チェックリスト（QA-1〜QA-7）+ AC 対応表 + HEX/文言 grep 手順 + 削除 N/A 明記。

## 完了条件

- [ ] typecheck / lint / focused vitest / verify:tokens / apps/api 空 diff の QA チェックリストが SSOT §11 と整合して記述されている。
- [ ] HEX 直書き 0 件確認の grep 手順が記述されている。
- [ ] 既存テスト回帰なし（DOM contract 維持 = AC-12）の確認方針が記述されている。
- [ ] ファイル削除がないため削除確認は N/A と明記されている。
- [ ] 各 QA が AC-1〜AC-12 に対応づけられている。
