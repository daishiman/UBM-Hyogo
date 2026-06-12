# 実装ガイド（implementation-guide）

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_runtime_pending |

---

## Part 1: 中学生にもわかる説明

### 「×」が 2 つ出てしまう理由

検索ボックスに文字を打つと、文字を一気に消すための「×ボタン」が出ます。今回の画面では、この「×」が 2 つ並んで出ていました。

これは、消しゴムが 2 つ机に乗っているような状態です。1 つは「ブラウザがもともと持っている消しゴム」、もう 1 つは「このサイトが自分で用意した消しゴム」です。どちらも同じ「文字を消す」役割なので、2 つあると押す人が「どっちを押せばいいの？」と迷ってしまいます。

そこで、サイトが自分で用意した消しゴム（×）だけを残し、ブラウザがもともと持っている消しゴムは見えないように隠します。サイト自身の×を残す理由は、日本語を変換している途中（漢字に変換する前）でも安全に文字を消せるように作られていて、目の見えない人向けに「クリア」という名前も付いているからです。

### 並べ替えの選択肢を増やす仕組み

会員一覧には「並べ替え」があり、今までは「新しい順」と「名前順」の 2 つだけでした。今回はここに「古い順」と「名前の逆順」を足して 4 つにします。

大事なのは、並べ替えを「画面に出ている分だけ」ひっくり返すと順番が壊れることです。一覧は何ページにも分かれていて、1 ページ分だけをひっくり返すと、ページをまたいだ全体の順番がぐちゃぐちゃになります。だから、データを取り出す元（サーバー側）で「最初から正しい順番で並べて渡す」ようにします。本棚から本を取り出すとき、棚の段ごとに並べ替えるのではなく、本棚全体で並べ替えてから 1 段ずつ取り出すイメージです。

「名前順」は、名前の文字の番号順（コンピューターが持っている文字の順番）で並びます。ふりがな（よみがな）のデータがまだ無いので、本当の「あいうえお順（五十音順）」にはできません。この点は別の宿題（OOS-1）として記録します。

---

## Part 2: 技術者向けガイド

### 変更ファイル（7 件）

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `apps/web/src/components/ui/Search.tsx` | `input` に `className="ui-search__input"` を付与。`type="search"` は維持し独自×ボタン（`commitNow("")` / `aria-label="クリア"`）を正本として残す |
| 2 | `apps/web/src/styles/globals.css` | `.ui-search__input::-webkit-search-cancel-button, .ui-search__input::-webkit-search-decoration { -webkit-appearance:none; appearance:none; display:none; }` を追加（色値を含まない） |
| 3 | `apps/web/src/lib/url/members-search.ts` | `SORT_VALUES` を `["recent","oldest","name","name_desc"]` に拡張。default=`recent` は URL から省略 |
| 4 | `apps/web/src/components/public/MemberFilters.client.tsx` | ソート option を 4 種に刷新。ラベルから「並び替え: 」接頭辞を除去（`新しい順 / 古い順 / 名前順 / 名前の逆順`） |
| 5 | `apps/api/src/_shared/search-query-parser.ts` | `SortZ` enum を 4 値に拡張。不正値は `recent` を DEFAULT とする |
| 6 | `apps/api/src/repository/publicMembers.ts` | ORDER BY を 4 分岐に拡張（下表） |
| 7 | `packages/shared/src/zod/viewmodel.ts` | `appliedQuery.sort` enum を 4 値に拡張 |

### sort enum 3 層同期

| 層 | シンボル | 値 |
|----|---------|-----|
| apps/web | `SORT_VALUES`（members-search.ts:9） | recent / oldest / name / name_desc |
| apps/api | `SortZ`（search-query-parser.ts:7） | recent / oldest / name / name_desc |
| packages/shared | `appliedQuery.sort`（viewmodel.ts:158） | recent / oldest / name / name_desc |

3 層が 4 値で文字列一致する（drift なし）。UI ラベルと API enum の value も文字列一致する。

### ORDER BY マッピング（publicMembers.ts）

| value | ORDER BY | 区分 |
|-------|----------|------|
| `recent` | `last_submitted_at DESC, fullName ASC, member_id ASC` | 既存・default |
| `oldest` | `last_submitted_at ASC, fullName ASC, member_id ASC` | 新規 |
| `name` | `fullName ASC, member_id ASC` | 既存 |
| `name_desc` | `fullName DESC, member_id ASC` | 新規 |

`fullName` は `COALESCE(json_extract(r.answers_json, '$.fullName'), '')`。SQLite 既定 COLLATE の Unicode 文字コード順であり、五十音順ではない。各分岐末尾に `member_id ASC` のタイブレークを置き、ページ跨ぎで順序が一貫するようにする。

### 型・フォールバック

- apps/web: zod の `.catch("recent")` で不正 sort 値を `recent` にフォールバックする。
- apps/api: parser DEFAULT が `recent`。
- packages/shared: enum は 4 値のみ受理し、不正値を reject する（API レスポンス検証）。

### テスト（7 ファイル・既存テスト追記）

| ID | テスト | 確証 AC |
|----|-------|--------|
| T1 | Search.spec.tsx | AC-1 / AC-2 |
| T2 | members-search.spec.ts | AC-6 / AC-7 |
| T3 | MemberFilters.client.spec.tsx | AC-3 |
| T4 | search-query-parser.spec.ts | AC-6 |
| T5 | list-public-members.spec.ts | AC-4 / AC-5 / AC-6 |
| T6 | viewmodel.spec.ts（既存） | AC-8 |
| T7 | publicMembers.repository.spec.ts（既存 D1） | AC-4 / AC-5 |

---

## 視覚証跡（VISUAL）

本タスクは VISUAL である。local Chromium filter UI screenshot は本ウェーブで撮影し、`outputs/phase-11/phase11-capture-metadata.json` の `status: "captured_local_filter_ui"` として記録した。staging/API 接続での実機確認は user-gated として残す。

| screenshot | 撮影状態 | 検証 AC |
|-----------|---------|--------|
| `members-search-single-clear.png` | captured: 検索入力に値あり・×1 つ | AC-1 / AC-2 |
| `members-sort-four-options.png` | captured: `name_desc` 選択状態。4 option は Chromium DOM 検証で確認 | AC-3 |

PNG は `outputs/phase-11/screenshots/` に配置済み。Phase 13 の PR 本文に参照する。
