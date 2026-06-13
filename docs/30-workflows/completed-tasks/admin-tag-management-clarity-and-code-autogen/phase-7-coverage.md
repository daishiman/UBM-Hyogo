# Phase 7: カバレッジ

[実装区分: 実装仕様書]

> SSOT: [shared-context.md](./shared-context.md)。対象範囲・関数シグネチャ・AC の正本は §5/§6/§8、検証コマンドは §11。

## 目的

本サイクルで新規作成・編集した関数 / ブロックに**局所限定**したカバレッジ目標を定義し、`TagQueuePanel` / `MemberDrawer` は表示文言のみを既存 spec / grep で保護する。広域カバレッジ計測でなく「触れたコードだけ」を保護する方針（[Feedback BEFORE-QUIT-002][Feedback 5]）を確定する。

## 実行タスク

- SSOT §5 の新規 product 3 ファイル（`tagCodeAutogen.ts` / `tagManagementGlossary.ts` / `TagManagementGuide.tsx`）と編集 product 6 + spec 2 ファイルに限定したカバレッジ対象表（下記 1-1）を確定する。
- `generateTagCode` は**全分岐網羅（line 100% / branch 100%）**を目標とし、SSOT §6 アルゴリズム 1〜8 の各分岐（空文字 / 日本語 kana / 漢字のみ fallback / 記号のみ / 長文切り詰め / 先頭非英数除去 / 連続 `_` 畳み込み）を `tagCodeAutogen.spec.ts` で網羅する（下記 1-2）。
- `getTagTerm` は**登録キー（lookup 成功）と未登録キー（`undefined` 返却）の両分岐**を `tagManagementGlossary.spec.ts` で網羅する。`TAG_MANAGEMENT_GLOSSARY` の必須キー（SSOT §6: `tag-definition` / `tag-assignment` / `tag-code` / `tag-label` / `tag-category` / `tag-suggestion` / `tag-unresolved` / `tag-resolve`）件数・キー整合をデータテストで確認する。
- `TagManagementGuide` は **variant 2 経路（`"definition"` / `"assignment"`）**それぞれの説明文・相互リンク向き（definition→`/admin/tags` / assignment→`/admin/tag-master`）を `TagManagementGuide.component.spec.tsx` で網羅する。
- `TagDefinitionCreateForm` のコード自動補完（`codeDirty=false` 経路）と手動上書き後の自動上書き停止（`codeDirty=true` 経路）の両分岐を component spec で確認する。
- SSOT §11 の focused vitest **フルパス指定**でカバレッジを取得する手順を記述する（ルートからの相対フルパス。package dir 相対 filter は絶対 include glob に非マッチになる罠を回避）。

### 1-1. カバレッジ対象（本サイクルで触れたもののみ）

| ID | 対象 | Lane | カバレッジ種別 | 検証 spec |
|----|------|------|----------------|-----------|
| COV-C1 | `generateTagCode(label)` 全分岐（SSOT §6 アルゴリズム 1〜8） | C1 | **line 100% / branch 100%** | `tagCodeAutogen.spec.ts` |
| COV-C1b | `TAG_CODE_PATTERN` / `KANA_ROMAJI_MAP` の整合（生成値が常に pattern 一致） | C1 | データ整合 / property | `tagCodeAutogen.spec.ts` |
| COV-C3a | `TAG_MANAGEMENT_GLOSSARY` の必須キー件数・形（`key`/`label`/`description`） | C3 | データ整合 | `tagManagementGlossary.spec.ts` |
| COV-C3b | `getTagTerm(key)` の登録（term 返却）/ 未登録（`undefined`）両分岐 | C3 | branch | `tagManagementGlossary.spec.ts` |
| COV-C3c | `TagManagementGuide` variant=`"definition"` の説明文 + `/admin/tags` 相互リンク | C3 | line / branch | `TagManagementGuide.component.spec.tsx` |
| COV-C3d | `TagManagementGuide` variant=`"assignment"` の説明文 + `/admin/tag-master` 相互リンク | C3 | line / branch | `TagManagementGuide.component.spec.tsx` |
| COV-C1f | `TagDefinitionCreateForm` 表示名 onChange → `codeDirty=false` でコード自動補完 | C1 | branch（自動補完 truthy） | `TagDefinitionCreateForm.component.spec.tsx` |
| COV-C1g | `TagDefinitionCreateForm` コード手動編集 → `codeDirty=true` で自動上書き停止 | C1 | branch（自動補完 falsy） | `TagDefinitionCreateForm.component.spec.tsx` |
| COV-C4 | 自動生成ヒント文 / 自動生成中バッジの描画 | C4 | line | `TagDefinitionCreateForm.component.spec.tsx` |

### 1-2. `generateTagCode` 全分岐の line / branch カバレッジ

> SSOT §6 のアルゴリズム 1〜8 を逐語で踏襲。全分岐を `tagCodeAutogen.spec.ts` で保護し、返り値が常に `TAG_CODE_PATTERN`（`/^[a-z0-9][a-z0-9_]{0,63}$/`）に一致することを各 case で assert する。

| 分岐 | 入力例 | 期待挙動 | line | branch |
|------|--------|----------|------|--------|
| ① 空 / null / undefined | `""` / `null` / `undefined` | fallback `tag_<base36 hash>` を返し pattern 一致 | covered | covered |
| ② 半角英数主体 | `"Region Kobe"` | 小文字化 + 非英数→`_` で `region_kobe` 相当・pattern 一致 | covered | covered |
| ③ ひらがな / カタカナ | `"こうべ"` / `"コウベ"` | `KANA_ROMAJI_MAP` でローマ字化し pattern 一致 | covered | covered |
| ④ 漢字のみ（マッピング不能） | `"神戸"` | 生成不能 → fallback `tag_<hash>`・pattern 一致 | covered | covered |
| ⑤ 記号のみ | `"!!!@@@"` | 英数残らず → fallback `tag_<hash>`・pattern 一致 | covered | covered |
| ⑥ 先頭が数字 / 非英数 | `"1番"` / `"_abc"` | 先頭非英数除去後も pattern 先頭 `[a-z0-9]` 保証 | covered | covered |
| ⑦ 連続区切り / 前後空白 | `"  a   b  "` | 連続 `_` 畳み込み + 前後 `_` 除去 → `a_b` | covered | covered |
| ⑧ 64 文字超 | 70 文字の英字 | 64 文字に切り詰め + 末尾 `_` 再除去・pattern 一致 | covered | covered |

> branch 100% の要件: 分岐 ① と ④⑤ は「結果が空文字 → fallback」経路（アルゴリズム step 7）を、②③⑥⑦⑧ は「非空 → 正規化経路」（step 4-6）を網羅する。fallback / 非 fallback の双方を別 case で固定することで `generateTagCode` の if 分岐を全通過させる。**決定的**（同入力で常に同出力）であることも spec で固定する。

## 統合テスト連携

- focused vitest はルートからフルパス指定で実行する（SSOT §11）。package dir 相対 filter は絶対 include glob に非マッチになるため使わない。

```bash
mise exec -- pnpm --filter web exec vitest run \
  src/lib/admin/__tests__/tagCodeAutogen.spec.ts \
  src/lib/admin/__tests__/tagManagementGlossary.spec.ts \
  src/components/admin/__tests__/TagManagementGuide.component.spec.tsx \
  src/components/admin/__tests__/TagDefinitionCreateForm.component.spec.tsx
```

- 上記 4 spec が GREEN であることを Phase 9 QA-3 と整合させる。
- `TagManagementGuide` → `tagManagementGlossary` の依存エッジは component spec で「用語ラベルが用語集から引かれている」ことを確認し、文言ベタ書きを検出する。
- `TagDefinitionCreateForm` → `tagCodeAutogen` の依存エッジは「表示名入力でコード欄が `generateTagCode` 値に補完される」ことで確認する（DOM contract: 既存 `FormField` / `Input` の testid を破壊しない）。

## 成果物

- 本ファイル（`phase-7-coverage.md`）= カバレッジ対象表（1-1）+ `generateTagCode` 全分岐表（1-2）+ focused 実行手順。
- 本サイクルで追加する 4 spec のカバレッジ目標（`generateTagCode` line/branch 100% / `getTagTerm` 両分岐 / `TagManagementGuide` variant 2 経路）。

## 対象外（カバレッジ対象外・本タスク非変更）

> 本サイクルで触れないため、カバレッジ目標・spec 追加の対象外と明記する（[Feedback 5] スコープ越境防止）。

- `apps/api/**`（API 無罪。`git diff origin/dev...HEAD -- apps/api` が空 = AC-10）
- D1 migrations / schema、Google Form schema
- `TagsQueueResolveDrawer.tsx`（割当ロジック不変・本サイクルで内部に手を入れない）
- `TagDefinitionPanel.tsx` / 既存 `TagDefinitionPanel.component.spec.tsx`（一覧・編集ロジック不変。DOM contract 維持）
- `TagMasterEditForm`（編集フォームへのコード自動生成は OOS-3。本サイクル対象外）
- `apps/web/src/features/admin/api/tags.ts`（API 呼び出し shape 不変）
- 既存カバレッジ低下: 変更外ファイルの既存カバレッジ増減は本サイクルのスコープ外。**新規追加分のみ**を coverage 評価対象とする。

## 完了条件

- [x] カバレッジ対象が SSOT §5 の新規 3 + 編集 product 6 + spec 2 に局所限定され、広域計測でないことが 1-1 表に明記されている。
- [x] `generateTagCode` の line/branch 100% 目標が 1-2 表で全 8 分岐に対応づけられている。
- [x] `getTagTerm` の登録 / 未登録両分岐、`TagManagementGuide` の variant 2 経路がカバレッジ対象に含まれる。
- [x] focused vitest のフルパス指定手順（SSOT §11）が記述されている。
- [x] 対象外（`TagsQueueResolveDrawer` 等・本タスク非変更）が明示されている。
