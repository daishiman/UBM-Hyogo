# admin-schema-terminology-clarity followup-001 — サイドバー fixture ラベルの文言整合

`[実装区分: 実装仕様書]` / status: `spec_created`

> 親タスク `admin-schema-terminology-clarity`（`/admin/schema` のエンジニア用語を平易な日本語へリネーム）の
> Phase 12 close-out 時、**2回目の独立検証**で検出された current 未タスク 1 件。先行の
> `unassigned-task-detection.md` は「current 0 件」と判定していたが、shared-context §4 が更新対象に
> 明記していた Playwright fixture 1 箇所の取りこぼしを再検証で捕捉した。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| タスクID | `admin-schema-terminology-clarity-followup-001-sidebar-fixture-label-sync` |
| 実装区分 | 実装仕様書（1 行のコード変更を伴う・presentation fixture のみ） |
| taskType | implementation |
| implementation_mode | `new` |
| visualEvidence | `NON_VISUAL`（テストの静的 fixture 文字列のみ・ライブ UI 変更なし） |
| 親タスク | `admin-schema-terminology-clarity`（`feat/admin-schema-terminology-clarity`） |
| 発見元 | 親タスク Phase 12 close-out の 2 回目独立検証（Explore 監査 + ground truth grep） |
| 発見日 | 2026-06-11 |
| 優先度 | low（テスト非破綻・ユーザー無影響の cosmetic 整合漏れ） |
| 変更範囲 | `apps/web/playwright` のテスト fixture 1 ファイル 1 行のみ。API / D1 / Google Form / ライブ component 非接触 |

---

## 1. 真の論点（1 文）

親タスクで admin サイドバーのナビラベルを「スキーマ」→「フォーム項目」へリネームし（`shell-config.ts`）、
shared-context §4 は文言整合のため Playwright 期待文字列の更新も指定していたが、
**別ワークフロー（admin-sidebar-public-return-link）のスクリーンショット用静的 `fixtureHtml` 内の
`<li><a href="/admin/schema">スキーマ</a></li>`（`admin-sidebar-public-return-link.spec.ts:177`）だけが
取りこぼされ、旧文言「スキーマ」が残存している**。

### why this way / なぜ低優先か

- 当該 177 行は `fixtureHtml` 定数の中の**静的 HTML 文字列**であり、ライブ `SidebarShell` の描画結果を
  アサートするものではない。実アサーション（`assertImplementationContract`）は `SidebarShell.tsx` のソースから
  `data-role="public-return"` / `aria-label="公開サイトに戻る"` 等を検証するのみで、ナビラベルは見ない。
- したがって**テストは破綻しない**（ラベル一致アサーションが存在しない）し、ユーザー向け画面にも影響しない。
- ただし shared-context §4 が明記した整合作業であり、放置すると「スキーマ」という旧称が別 WF の証跡 fixture に
  残り続け、用語統一の完全性（grep gate の意図）が損なわれる。よって low priority の followup として formalize する。

---

## 2. スコープ

### 含む

- `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts:177` の fixture 文字列
  `<li><a href="/admin/schema">スキーマ</a></li>` を
  `<li><a href="/admin/schema">フォーム項目</a></li>` へ修正する（`href` は不変）。

### 含まない（スコープ外）

- ライブ component / API / D1 / Google Form の変更（親タスクで完了済み・本 followup では非接触）。
- 別 WF `admin-sidebar-public-return-link` の挙動・スクリーンショット再取得（fixture 文言整合のみが対象で、
  視覚証跡の再取得は不要。fixture は public-return-link の見た目を示すためのもので、ナビ各行の文言は副次的）。
- 親タスクで既に更新済みの Playwright 5 ファイル（`AdminSchemaPage.ts` / `issue776-schema-bulk-resolve.spec.ts`
  / `task15-admin-screenshots.spec.ts` / `admin-pageheader-task-c.spec.ts` /
  `visual-staging-authenticated/admin-schema-authenticated.spec.ts`）。

---

## 3. 受入条件（Acceptance Criteria）

- [ ] AC-1: `admin-sidebar-public-return-link.spec.ts:177` が `フォーム項目` を含み、`href="/admin/schema"` は不変。
- [ ] AC-2: `rg -n '>スキーマ<' apps/web/playwright` が 0 件（playwright 配下に旧ラベル `スキーマ` が残らない）。
- [ ] AC-3: `git diff --quiet -- apps/api`（API 非接触の継続確認）。
- [ ] AC-4: 当該 Playwright テストが従来通りロードされる（`--list` で件数不変・アサーション挙動不変）。
- [ ] AC-5: ライブ component（`SidebarShell.tsx` 等）への差分が無いこと（fixture のみの変更）。

---

## 4. 変更対象ファイル

| # | パス | 種別 | 変更 |
|---|------|------|------|
| 1 | `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts` | 編集（1 行） | `fixtureHtml` 内 `スキーマ`→`フォーム項目`（:177、`href` 不変） |

> 内部識別子（`href` / `data-role` / `data-testid` / `aria-label`）は一切変更しない（CLAUDE.md invariant #5）。

---

## 5. 苦戦箇所（CONST_004・将来の同種課題を簡潔に解決するための知見）

### 苦戦 1: grep gate が「素の旧ラベル」を網羅しておらず 1 回目検証で見落とした

親タスクの DoD grep gate は
`CURRENT REVISION|FORM SCHEMA GUIDE|DIFF ITEMS|Bulk Resolve|Bulk Rollback|ALIAS HISTORY|スキーマ差分のレビュー|スキーマ未解決|Schema issues|Form schema`
を対象にしていたが、**素の `スキーマ`（ナビラベル単体）を含めていなかった**ため、fixture の `>スキーマ<` を検出できなかった。

- **教訓**: 文言リネーム gate では「複合語（スキーマ差分のレビュー 等）」だけでなく「リネーム対象の素の語
  （スキーマ）」も `>語<` / `"語"` の形で grep に含める。さもないと HTML fixture や属性外テキストの残存を取りこぼす。

### 苦戦 2: 「test 期待値の残存」を即「テスト破綻」と短絡しない

2 回目検証の Explore は当初「テストが破綻する / DoD 違反」と過大評価したが、ground truth で当該行が
`fixtureHtml` 定数（静的 HTML）であり、実アサーション（`assertImplementationContract` がソース文字列を検証）
とは無関係と判明した。**spec ファイル内に旧文言があっても、それが assertion 対象か単なる fixture/mock かで
影響度（破綻 vs cosmetic）が変わる**。

- **教訓**: 「spec に旧文言が残っている」を検出したら、その行が `expect(...).toContain` 等のアサーション対象か、
  `fixtureHtml` のような入力固定値かを必ずソースで切り分けてから severity を確定する。fixture 残存は低優先 cosmetic、
  assertion 残存は高優先（CI 破綻）。

### 苦戦 3: 別 WF の証跡 fixture に他機能の文言が混在する

177 行は `admin-sidebar-public-return-link`（別 WF）のスクショ用 fixture で、admin ナビ全行（スキーマ含む）を
ハードコードしていた。**ある機能のリネームが、別機能の証跡 fixture に飛び火する**構造的問題。

- **教訓**: ナビ全体をハードコードする fixture は、個別機能のリネーム時に同期漏れの温床になる。将来的には
  fixture をナビ定義（`shell-config.ts`）から生成するか、リネーム時の grep 対象に `apps/web/playwright` を
  明示的に含めることで飛び火を機械検知する。

---

## 6. 関連タスク差分確認（重複起票チェック）

| 確認対象 | 結果 |
|----------|------|
| 親 `admin-schema-terminology-clarity`（Phase 12 close-out 済） | 本 followup はその取りこぼし 1 件。親スコープに内包されるが close-out 後検出のため別タスク化 |
| `admin-sidebar-public-return-link`（別 WF・fixture の出自） | fixture の所有 WF だが、本件は文言整合のみで public-return-link の挙動・証跡には非干渉。重複なし |
| open issues（schema / 用語 / sidebar 関連） | 同等の起票なし。本 followup が初出 |

**結論: 重複起票なし。priority:low / type:followup / scale:small / area:web + area:testing で 1 件起票する。**

---

## 7. 実装手順（最小）

```bash
# 1. fixture の旧ラベルを修正（href 不変）
#    apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts:177
#    <li><a href="/admin/schema">スキーマ</a></li>
#  → <li><a href="/admin/schema">フォーム項目</a></li>

# 2. 残存確認
rg -n '>スキーマ<' apps/web/playwright    # 0 件を確認（AC-2）
git diff --quiet -- apps/api && echo OK   # API 非接触（AC-3）

# 3. テストロード確認（任意・件数不変）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts --list
```

> commit / PR はユーザーの明示承認後のみ（CONST_001）。
