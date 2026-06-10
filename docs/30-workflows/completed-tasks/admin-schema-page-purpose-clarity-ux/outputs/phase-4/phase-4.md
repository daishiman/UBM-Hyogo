# Phase 4 — テスト作成（TDD Red）

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) を正本とする。本 Phase は §5/§6/§7 に基づき、実装前に失敗するテスト（Red）の仕様を確定する。
> 後続 Phase 5（実装）はここで定義したテストを Green にする形で進める。

## 4.0 TDD Red 方針

1. **Red を先に書く**: SSOT §6 のテスト4本（2 新規 + 2 編集）を、実装ファイル（`schemaGlossary.ts` / `SchemaPurposeExplainer.tsx` / `page.tsx` / `SchemaDiffPanel.tsx`）の変更前に着地させる。新規モジュールは import 解決不能で fail、編集対象は新文言が無いため fail する（= 正しい Red）。
2. **既存テストは壊さない**: `SchemaDiffPanel.component.spec.tsx`（既存 30+ ケース）と `page.spec.tsx`（既存 2 ケース）は **操作系・回帰系を一切変更せず**、新規 `it` を **追加**する。Lane B/C は表示文言の追加のみ（handler/fetch/state 不変）なので、既存アサーションは無改変で Green を維持しなければならない（AC-7・SSOT §5 Lane B）。
3. **テスト対象の所有権を明記**（VSCPKR-03）:
   - `SchemaPurposeExplainer` は **静的描画**（state なし・props なし）。テストは render→静的 text/role/`data-region` 検証のみ。
   - `SchemaDiffPanel` の追加表示は **内部 state に依存しない静的説明（カテゴリ説明・アウトカム説明・empty コピー・平易ステータス）**。割り当てフォームのアウトカム説明だけは `active`（内部 state）が立った時に描画されるため、既存テストと同じ「ラベルクリック→form 展開」操作で到達する内部 state 経路を使う。external prop は導入しない。
   - `schemaGlossary` は **純関数/純定数**。引数（external input）→戻り値の決定的検証。
4. **日本語境界値**（W0-RV-001）: テスト文字列は実装コピーと**1文字単位で一致**させる。各コピー定数の直後に `// length: N` を付し、実装側（Phase 5）の確定文言と文字数を突き合わせる。全角・半角矢印（`→`）・中黒（`·`）・括弧の混入に注意。
5. **focused run のみ**（FB-UI-02-2 / SIGKILL 回避）: 全件 `pnpm test` は実行しない。SSOT §7 の4ファイル限定 run を正規経路とする。

---

## 4.1 vitest 実行コマンド（SSOT §7・repo root から `--root=.`）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
```

- focused run 対象ファイルリスト（これ以外は走らせない）:
  1. `apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts`（新規）
  2. `apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx`（新規）
  3. `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（既存編集 = 既存維持 + 追加）
  4. `apps/web/app/(admin)/admin/schema/page.spec.tsx`（既存編集 = 既存維持 + 追加）
- Red 段階の期待: 1・2 は import 解決不能/文言不在で fail、3・4 の **新規 it のみ** fail、3・4 の **既存 it は Green のまま**（Red 段階で既存が赤化したら実装方針が破綻している兆候）。

---

## 4.2 `schemaGlossary.spec.ts`（新規・純モジュール単体）

対象: `apps/web/src/components/admin/schemaGlossary.ts`（Phase 2 §2.3 の公開 API）。import 方法は同階層 `../schemaGlossary` から名前付き import。

| describe | it | 期待値 | 検証対象 |
| --- | --- | --- | --- |
| `SCHEMA_GLOSSARY` | 5 つの用語キー（stableKey/resolve/revision/diff/backfill）を持つ | `Object.keys(SCHEMA_GLOSSARY)` が該当5キーを過不足なく含む | 定数キー網羅 |
| `SCHEMA_GLOSSARY` | stableKey エントリが plainLabel「項目キー」technicalName「stableKey」を持つ | `SCHEMA_GLOSSARY.stableKey.plainLabel === "項目キー"` / `.technicalName === "stableKey"` / `.description` が非空 | やさしい言い換え |
| `SCHEMA_GLOSSARY` | resolve エントリが plainLabel「対応づけ」technicalName「resolve」を持つ | 同上（resolve） | 言い換え |
| `SCHEMA_GLOSSARY` | revision エントリが plainLabel「フォーム版数」technicalName「revision」を持つ | 同上（revision） | 言い換え |
| `SCHEMA_GLOSSARY` | 全エントリの description が空文字でない | 各 `term.description.length > 0` | データ健全性 |
| `SCHEMA_FLOW_STEPS` | length === 3 | `SCHEMA_FLOW_STEPS.length === 3` | 3ステップ固定 |
| `SCHEMA_FLOW_STEPS` | index が 1,2,3 の昇順 | `steps.map(s => s.index)` が `[1,2,3]` | 順序固定 |
| `SCHEMA_FLOW_STEPS` | 各ステップ title が確定文言（検知/対応づけ/反映） | step[0].title が「変更を検知する」等の確定文言（§4.7 コピー表）と一致 | 流れ文言 |
| `SCHEMA_FLOW_STEPS` | 各ステップ detail が非空 | 各 `step.detail.length > 0` | データ健全性 |
| `SCHEMA_OUTCOME_SUMMARY` | 結果プレビュー文が確定文言と一致 | §4.7 の確定文言と完全一致 | 成果文言 |
| `describeDiffType` | added を平易説明へ写像 | `{ label:"追加", meaning:..., action:... }`（§4.7） | diff type |
| `describeDiffType` | changed を平易説明へ写像 | `{ label:"変更", ... }` | diff type |
| `describeDiffType` | removed を平易説明へ写像 | `{ label:"削除", ... }` | diff type |
| `describeDiffType` | unresolved を平易説明へ写像 | `{ label:"未対応", ... }` | diff type |
| `describeDiffType` | 全 DiffTypeKey で label/meaning/action がすべて非空 | 4キー each 非空 | 網羅性 |
| `describeDiffType` | 未知キー防御: 型外文字列でも throw せず既定値を返す | `describeDiffType("xxx" as DiffTypeKey)` が throw せず `label/meaning/action` 文字列を返す（WEEKGRD-02） | 防御 |
| `describeStat` | unresolved の label/hint が確定文言 | `{ label:"未対応", hint:"対応づけ待ち。クリックして対応づけます" }`（§4.7） | 統計 |
| `describeStat` | added/changed/removed の label/hint が確定文言 | 各 §4.7 と一致 | 統計 |
| `describeStat` | 未知キー防御: throw せず既定値 | `describeStat("xxx" as StatKey)` が throw せず文字列を返す | 防御 |
| `ASSIGN_OUTCOME_POINTS` | 3 行以上の非空アウトカム文 | `ASSIGN_OUTCOME_POINTS.length >= 3` かつ全要素非空 | アウトカム |
| `ASSIGN_OUTCOME_POINTS` | 「一覧/詳細/マイページ」「5分以内なら取消」を含む | 配列内に該当 substring を含む要素が存在 | 結果伝達 |

- **コンパイル時網羅**: `describeDiffType`/`describeStat`/`SCHEMA_GLOSSARY` は実装側で `satisfies Record<DiffTypeKey, ...>` 等を使い網羅を担保（Phase 5）。spec はランタイム値を検証する。
- すべて副作用なし・throw なし（防御テストで未知キーが throw しないことを明示検証）。

---

## 4.3 `SchemaPurposeExplainer.component.spec.tsx`（新規・静的描画）

対象: `apps/web/src/components/admin/SchemaPurposeExplainer.tsx`。`@testing-library/react` の `render`/`screen` を使用。state/API/mock 不要（純表示）。`afterEach(() => cleanup())`。

| describe | it | 期待値 | 対象（testid / role / text） |
| --- | --- | --- | --- |
| `SchemaPurposeExplainer` | 見出し「このページでできること」を表示 | `screen.getByRole("heading", { name: "このページでできること" })` が truthy | heading |
| 〃 | `data-region="schema-purpose-explainer"` を持つ | `container.querySelector('[data-region="schema-purpose-explainer"]')` が non-null | data-region |
| 〃 | `<section aria-labelledby>` でラベル付き | section の `aria-labelledby` が見出し id を指す | a11y |
| 〃 | 3ステップ流れ図を `<ol>` で 3 件描画 | `screen.getByRole("list")` 配下の `getAllByRole("listitem")` が **流れ図3件**（用語集と分離するため流れ図に `data-region="schema-flow-steps"` を付与しその中の `<li>` を 3 と検証） | ol/li |
| 〃 | 各ステップ title（変更を検知する / 項目を対応づける / 会員データへ反映する）を表示 | `screen.getByText("変更を検知する")` 等3件が truthy（§4.7） | text |
| 〃 | 結果プレビュー文を表示 | `screen.getByText(SCHEMA_OUTCOME_SUMMARY 相当の確定文言)` が truthy（§4.7） | text |
| 〃 | 用語集に「項目キー」「対応づけ」「フォーム版数」を表示 | 各 plainLabel が `getByText` で取得可 | text |
| 〃 | 用語集の技術名（stableKey / resolve / revision）を併記表示 | 各 technicalName が描画される（`getAllByText` 許容。`page` 側と重複しない単体 render なので単一一致を基本に、表記揺れ無し） | text |
| 〃 | 用語集領域に `data-region="schema-glossary"` を付与 | 該当要素 non-null | data-region |

- 文字列はすべて実装コピーと逐語一致（§4.7）。`// length: N` を spec のコピー定数直後に付す。
- 注意: 流れ図 `<ol>` と用語集を両方 list で描画する場合、`getByRole("list")` が複数 hit しうる。**流れ図は `data-region="schema-flow-steps"` 配下に限定して listitem を数える**ことで 3 件を一意に検証する（実装側は §Phase 5 の JSX で `<ol data-region="schema-flow-steps">` を保証）。

---

## 4.4 `SchemaDiffPanel.component.spec.tsx`（既存編集 = 既存維持 + 追加）

> **既存の操作系・回帰系テスト（happy 4ペイン / hideInlineStats / empty / mutation 成功・失敗 / retryable / 422 / 409 / undo / bulk resolve / bulk rollback / recompute / suggestedStableKey 等、現状 30+ ケース）は一切変更しない**。これらは AC-7（操作ロジック・API 不変）の回帰ガードであり、Lane B は表示文言追加のみなので無改変で Green を保つ。以下は **新規 `it` の追加のみ**。
>
> 既存 mock 構成（`postSchemaAliasMock` 等の `vi.mock("../../../lib/admin/api")`、`next/navigation` mock、`beforeEach`/`afterEach`）をそのまま流用する。

| describe（既存 `SchemaDiffPanel` 内に追記） | it | 期待値 | 対象 |
| --- | --- | --- | --- |
| 追加: カテゴリ説明 | 「EXPLAIN-01 各 diff type グループに平易説明を表示」 | 追加/変更/削除/未解決の各ペインに `describeDiffType().meaning` の文言が描画される（例: 追加ペインに「新しく増えた設問です」相当）。`data-role="diff-type-meaning"` 4件 or 各 meaning text の getByText | text / data-role |
| 追加: カテゴリ説明 | 「EXPLAIN-02 各カテゴリに推奨アクションを表示」 | 各 `describeDiffType().action` の文言が描画される（例: 未解決ペインに「クリックして対応づけます」相当） | text |
| 追加: 平易ステータス | 「EXPLAIN-03 ステータスに平易ラベルを併記」 | queued 行に技術名「未解決」に加え平易補足が併記される。**既存の `STATUS_LABELS` 表示（"未解決"/"解決済み"）は維持**しつつ説明を追加（`data-role="diff-status-plain"`）。既存テスト「`getAllByText("未解決")`」を壊さないため、平易補足は別文言（例「対応づけ待ち」）を別要素で出す | text / data-role |
| 追加: アウトカム説明 | 「EXPLAIN-04 割り当てフォーム展開時にアウトカム説明を表示」 | ラベルクリック→form 展開（既存操作）後、`ASSIGN_OUTCOME_POINTS` の各行（一覧/詳細/マイページ反映・バックフィル・5分以内取消）が form 内に描画される。`data-role="assign-outcome"` 配下 list の listitem >= 3 | 内部 state（active）経由 / list |
| 追加: 0件 empty コピー | 「EXPLAIN-05 全ペイン 0 件時に良い状態コピーを表示」 | `items=[]` render 時、「差分はありません。フォームとデータベースが一致した良い状態です」相当の説明が表示される。**既存テスト「各ペインに『なし』4件」を壊さない**ため、パネル全体 0 件のときだけ出る集約コピー（`data-role="schema-diff-all-clear"`）を別要素で追加 | text / data-role |

- **回帰非破壊の制約（実装契約）**:
  - 既存 `getAllByText("未解決")` を増減させない → 平易ステータス補足は「未解決」という文字列を新たに増やさない別語（「対応づけ待ち」等）で出す。
  - 既存 empty テストの「`なし` ちょうど4件」を壊さない → ペイン内 EmptyState の title「なし」は変更しない。集約 all-clear コピーは別 `data-role` 要素。
  - 既存 form 操作テスト（form name "stableKey alias 割当" / 「割当」「閉じる」ボタン / input ラベル）に新文言が干渉しないこと（アウトカム説明は form 内の補助テキストとして追加し、既存 role/name を変えない）。
- アウトカム説明テストの到達経路 = **内部 state**（`active` を立てるため `fireEvent.click(getByRole("button", { name: /lbl/ }))`）。external prop は導入しない（VSCPKR-03 明記）。

---

## 4.5 `page.spec.tsx`（既存編集 = 既存維持 + 追加）

> 既存 2 ケース（diff レスポンスからのセクション描画 / fetch 失敗時の section error）は **維持**。既存アサーション（"スキーマ差分のレビュー" 見出し / "CURRENT REVISION" / Unresolved/Added/Changed/Removed / "項目別の差分" / "バージョン履歴" / "紐付け履歴" / "Form schema 概要" 非表示）は無改変。ただし **履歴見出し「紐付け履歴」のアサーションは平易化に伴い更新が必要**（§下記注記）。新規 `it` を追加。

| describe（既存 `AdminSchemaPage`） | it | 期待値 | 対象 |
| --- | --- | --- | --- |
| 追加 | 「explainer をページ上部に常時描画」 | render 後 `data-region="schema-purpose-explainer"` が non-null、見出し「このページでできること」が truthy（fetch 成否に関わらず常時表示 → 成功レスポンス mock のケースで検証） | data-region / heading |
| 追加 | 「header description が流れ・成果の伝わる文へ更新」 | header description が新文言（§4.7）を含む。`screen.getByText(新 description)` truthy。旧文「stableKey の割り当てと履歴確認を行います。」が**含まれない**ことを `queryByText` で確認（任意） | text |
| 追加 | 「統計の label が平易日本語に更新」 | `screen.getByText("未対応")`（旧 "Unresolved" の平易主表記）等、§4.7 の確定 label が truthy。技術名併記は hint 側 | text |
| 追加 | 「統計の hint が次アクション示唆へ更新」 | Unresolved 統計の hint が「対応づけ待ち。クリックして対応づけます」相当（§4.7・`describeStat`）。旧 hint「stableKey 未割当」が消える | text |
| 追加 | 「履歴見出しが対応づけ履歴へ平易化＋技術名併記」 | 「対応づけ履歴」見出しが truthy、技術名「ALIAS HISTORY」または「alias」併記が描画される。説明文「誰がいつ何を対応づけたかの記録」相当が表示 | heading / text |

- **既存アサーション更新（必須注記）**:
  - 既存 `it("renders prototype-aligned...")` 内の `expect(screen.getByRole("heading", { name: "紐付け履歴" }))` は、平易化で主見出しが「対応づけ履歴」に変わるため、**この行を「対応づけ履歴」へ更新**する（AC-4）。これは「破壊」ではなく仕様変更に伴う必然更新。技術名「ALIAS HISTORY」は eyebrow として残すなら既存 `getByText("CURRENT REVISION")` 同様の eyebrow 検証を追加してよい。
  - 統計の既存 `getByText("Unresolved"/"Added"/"Changed"/"Removed")` は、AC-3 で label を平易日本語主表記へ変えるため、**該当行を §4.7 の新 label（"未対応"/"追加"/"変更"/"削除"）へ更新**する。技術名は hint 併記なので、必要なら hint 側の getByText を追加する。
  - これら 2 点（履歴見出し・統計 label）は **AC が要求する仕様変更**であり、操作・データ取得の回帰ではない。本 spec の既存「セクションが正しく出る」意図は保持される。

---

## 4.6 internal state vs external prop（VSCPKR-03 まとめ）

| テスト群 | 対象 | state 種別 | 到達方法 |
| --- | --- | --- | --- |
| schemaGlossary.spec | 純定数/純関数 | なし | 直接呼び出し |
| SchemaPurposeExplainer | 静的説明全体 | なし（static） | render のみ |
| SchemaDiffPanel カテゴリ説明/empty/平易ステータス | 静的派生（grouped から describeDiffType） | なし（描画派生） | render のみ |
| SchemaDiffPanel アウトカム説明 | form 内補助文 | **内部 state（active）** | ラベルクリックで form 展開 |
| page.spec explainer/header/stat/history | 静的 + safeServerFetch mock | safeServerFetch のみ external（既存 mock） | render + 既存 mock |

---

## 4.7 確定日本語コピー（テストと実装の単一正本）

> Phase 5 実装はこの表の文言を逐語で使う。spec のアサーション文字列もここからコピーする（W0-RV-001）。`// length` は半角=1・全角=1 の JS `String.length` 基準。

### 流れ3ステップ（`SCHEMA_FLOW_STEPS`）

| index | title | `// length` | detail | `// length` |
| --- | --- | --- | --- | --- |
| 1 | `変更を検知する` | 6 | `Googleフォームの設問が追加・変更・削除されると差分として表示されます。` | 33 |
| 2 | `項目を対応づける` | 8 | `設問を会員データの保存先（項目キー）へ結びつけます。` | 24 |
| 3 | `会員データへ反映する` | 10 | `対応づけ後、会員の回答が正しい項目に整理されて表示されます。` | 28 |

### 結果プレビュー（`SCHEMA_OUTCOME_SUMMARY`）

```
会員の回答が、会員一覧・会員詳細・マイページに正しく表示されるようになります。
```
`// length: 36`

### explainer 見出し / リード

| 用途 | 文言 | `// length` |
| --- | --- | --- |
| 見出し | `このページでできること` | 11 |
| リード文 | `フォームの設問が変わったとき、会員の回答を正しい保存先へ結びつけるためのページです。` | 41 |

### 用語集（`SCHEMA_GLOSSARY`）

| key | plainLabel | technicalName | description |
| --- | --- | --- | --- |
| stableKey | `項目キー` | `stableKey` | `会員データの保存先となる列名。フォームの設問が変わっても変わりません。` |
| resolve | `対応づけ` | `resolve` | `設問を項目キーへ結びつける操作です。` |
| revision | `フォーム版数` | `revision` | `取り込んだフォームのバージョンです。` |
| diff | `差分` | `diff` | `フォームとデータベースの食い違いです。` |
| backfill | `再インデックス` | `backfill` | `対応づけ後、過去の回答を新しい項目キーで並べ直す処理です。` |

### diff type 説明（`describeDiffType`）

| key | label | meaning | action |
| --- | --- | --- | --- |
| added | `追加` | `新しく増えた設問です。` | `項目キーへ対応づけてください。` |
| changed | `変更` | `文言や種類が変わった設問です。` | `内容を確認して対応づけ直してください。` |
| removed | `削除` | `フォームから無くなった設問です。` | `不要なら対応づけを外せます。` |
| unresolved | `未対応` | `まだ項目キーへ対応づいていない設問です。` | `クリックして対応づけます。` |

### 統計 label / hint（`describeStat`）

| key | label | hint |
| --- | --- | --- |
| unresolved | `未対応` | `対応づけ待ち。クリックして対応づけます` |
| added | `追加` | `新しく増えた設問` |
| changed | `変更` | `文言や種類が変わった設問` |
| removed | `削除` | `フォームから無くなった設問` |

### 割り当てアウトカム（`ASSIGN_OUTCOME_POINTS`）

| 行 | 文言 |
| --- | --- |
| 1 | `この設問の回答が、会員一覧・会員詳細・マイページに表示されるようになります。` |
| 2 | `対応づけ後、過去の回答が新しい項目キーで並べ直されます（再インデックス）。` |
| 3 | `割り当て直後の5分以内なら取り消せます。` |

### 0件集約コピー（all-clear）

```
差分はありません。フォームとデータベースが一致した良い状態です。
```
`// length: 33`

### header description（page.tsx）

```
フォームの設問変更を会員データの保存先へ結びつけ、回答が正しく表示される状態を保ちます。
```
`// length: 42`

### 履歴見出し（page.tsx）

| 用途 | 文言 |
| --- | --- |
| 主見出し（旧「紐付け履歴」） | `対応づけ履歴` |
| 技術名併記（eyebrow 維持可） | `ALIAS HISTORY` |
| 説明文 | `誰がいつどの設問をどの項目キーへ対応づけたかの記録です。` |

> 上記文字数は Phase 5 実装時に最終確定し、spec の `// length: N` と突き合わせる。実装で表記を変えた場合は本表と spec を同時更新する（単一正本維持）。

---

## 完了条件

- [x] TDD Red 方針（Red 先行・既存非破壊・state 種別明記）記述
- [x] 4 spec ファイルそれぞれの describe/it・期待値・testid/role/text を表で列挙
- [x] 既存操作系テストを壊さない制約を明記（SchemaDiffPanel / page）
- [x] internal state vs external prop の対応表（VSCPKR-03）
- [x] 確定日本語コピーを単一正本として表で固定（`// length` 付き）
- [x] focused vitest コマンド・対象4ファイル列挙（SIGKILL 回避）
