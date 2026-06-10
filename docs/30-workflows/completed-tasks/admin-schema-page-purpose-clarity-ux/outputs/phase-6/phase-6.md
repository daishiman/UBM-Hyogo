# Phase 6 — テスト拡充（fail path / 回帰 guard / 補助）

> SSOT: [`../../_shared-context.md`](../../_shared-context.md) を正本とする。本 Phase は Phase 4（正常系テスト）に **fail path / 回帰 guard / 補助テスト** を上積みする。実装は user-gated。
> 不変条件: テストファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件8）。既存 `SchemaDiffPanel` の handler/fetch/state は不変であることを「壊れていない証明」として固定する。

## 6.1 目的

Phase 4 は AC を満たす正常系（explainer 描画・統計ラベル・カテゴリ説明・empty コピー）を担保する。Phase 6 はそれに加え、次の 3 系統で堅牢性を担保する。

1. **防御テスト**（`schemaGlossary`）— 未知キー入力でも例外を投げず既定値を返す／全 diff type・stat key の網羅漏れを検出。
2. **回帰 guard**（`SchemaDiffPanel`）— 表示文言の追加が既存ロジック（割り当て／bulk／rollback／recompute）に影響しないことの証明。
3. **fail path**（`page.spec`）— `result.ok=false`（API エラー）時に explainer を出さず `AdminSectionErrorClient` 経路へ確実に分岐する。

## 6.2 `schemaGlossary.spec.ts`（新規・Lane A／純関数 → 防御＋網羅）

> 対象: `apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts`
> 純データ/純関数モジュールのため副作用なし・モック不要。`describe`/`it` を以下表で固定する。

| describe | it | 入力 | 期待値（実装時の assert 方針） |
| --- | --- | --- | --- |
| `SCHEMA_GLOSSARY` | 5 用語キーをすべて含む | — | `Object.keys(SCHEMA_GLOSSARY)` に `stableKey`/`resolve`/`revision`/`diff`/`backfill` が**過不足なく**存在（`toEqual(expect.arrayContaining([...]))` ＋ `length === 5`） |
| `SCHEMA_GLOSSARY` | 各用語が plainLabel と description を非空で持つ | 各 term | `term.plainLabel.length > 0` かつ `term.description.length > 0`（`for...of Object.values`） |
| `SCHEMA_GLOSSARY` | technicalName は任意（undefined 許容）でも型破綻しない | `stableKey` | `typeof term.technicalName === "string" || term.technicalName === undefined` |
| `SCHEMA_FLOW_STEPS` | 3 ステップちょうど・index が 0/1/2 で連番 | — | `SCHEMA_FLOW_STEPS.length === 3`、`map(s=>s.index)` が `[0,1,2]` または `[1,2,3]`（実装の採番に合わせ固定） |
| `SCHEMA_FLOW_STEPS` | 各ステップが title/detail を非空で持つ | 各 step | `title`/`detail` が非空文字列 |
| `SCHEMA_OUTCOME_SUMMARY` | 結果プレビュー文が「一覧／詳細／マイページ」に言及 | — | 文字列に `一覧`・`マイページ` を含む（`expect(SCHEMA_OUTCOME_SUMMARY).toContain("マイページ")`） |
| `describeDiffType` | 既知の 4 type すべてで label/meaning/action を返す | `added`/`changed`/`removed`/`unresolved` | 各キーで `{label, meaning, action}` がすべて非空（`it.each` で 4 ケース） |
| `describeDiffType` | **未知キーでも throw せず既定値**を返す（防御） | `"__unknown__" as DiffTypeKey` | 例外を投げない（`expect(()=>describeDiffType(x)).not.toThrow()`）。返却の `label`/`meaning`/`action` は空文字でなく既定フォールバック文字列（例「不明な差分種別」）。**空オブジェクトや undefined を返さない** |
| `describeStat` | 既知の 4 key すべてで label/hint を返す | `unresolved`/`added`/`changed`/`removed` | 各キー `{label, hint}` 非空（`it.each`） |
| `describeStat` | unresolved の hint が「対応づけ」など次アクションを示唆 | `unresolved` | `hint` に `対応づけ` を含む（RC-3 充足の単体保証） |
| `describeStat` | **未知キーでも throw せず既定値**を返す（防御） | `"__x__" as StatKey` | `not.toThrow()`＋ label/hint が既定フォールバック非空 |
| `ASSIGN_OUTCOME_POINTS` | 1 件以上のアウトカム箇条書きを持つ | — | `ASSIGN_OUTCOME_POINTS.length >= 1`、各要素非空。少なくとも1要素が `5分`（取消窓）に言及 |

> 設計補足: Phase 2 §2.3 は「`satisfies Record<...>` でコンパイル時網羅を担保」とするが、`describeDiffType`/`describeStat` は実行時に未知キーが渡る経路（将来の API 拡張で新 diff type が来る）を想定し、**switch の default で既定値を返す実装**にする。本 spec の未知キーテストはその default 分岐（branch coverage）を直接踏む。

## 6.3 `SchemaDiffPanel.component.spec.tsx`（編集・Lane B／回帰 guard）

> 対象: `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`
> Phase 4 が**追加表示要素**（カテゴリ説明・割り当てアウトカム・平易ステータス・empty コピー）の存在を assert する。Phase 6 は**既存ロジックの不変**を回帰 guard として固定する。既存 spec（割り当て送信・bulk・rollback・recompute・422/409 分岐）は**改変せず温存**し、以下の guard を追記する。

| describe | it | 操作 | 期待値（ロジック不変の証明） |
| --- | --- | --- | --- |
| `回帰: 割り当て送信` | 説明文言追加後も alias 割当の POST 引数が不変 | 項目選択→stableKey 入力→「割当」 | `postSchemaAliasMock` が `{diffId, questionId, stableKey}` で **1 回**呼ばれる（Phase 4 正常系と同じ引数。表示追加が送信 payload を汚さない証明） |
| `回帰: 割り当て成功 toast` | 成功後に既存 undo toast が出る | 割当成功 | `data-component="undo-toast"` が表示され、`router.refresh()` が呼ばれる（既存挙動温存） |
| `回帰: bulk resolve` | Bulk Resolve モードの選択サマリが不変 | Bulk Resolve→項目選択 | `data-testid="bulk-selection-summary"` のテキストが従来形式（`N 件選択中（unresolved .. / changed ..）`）。説明追加でセレクタ/集計が壊れない |
| `回帰: rollback 確認モーダル` | rollback ボタンで確認モーダルが開く | 履歴の rollback クリック | `data-component="rollback-confirm-modal"` 表示。`onConfirm` で `rollbackSchemaAliasMock` 呼出（引数 `{aliasId, version}` 不変） |
| `回帰: 422 検証エラー表示` | 422 で validation_error フィードバック | mock を 422 で reject | `data-feedback-kind="validation_error"` が表示（既存 error 分岐温存） |
| `補助: カテゴリ説明の存在` | 各 diff type グループ見出し直下に説明文が出る（Lane B 追加分） | added/changed/removed/unresolved を含む initial で描画 | `describeDiffType(t).meaning` の文言が DOM に存在（4 type 分）。**ロジックではなく表示の追加分** |
| `補助: 割り当てアウトカム説明` | 割り当てフォーム展開時にアウトカム説明が出る | 項目選択でフォーム展開 | `ASSIGN_OUTCOME_POINTS` の文言（例「5分以内なら取消可」）が DOM に存在。フォーム送信は別 it で不変確認済 |
| `補助: 0件 empty コピー` | total=0 / items=[] で良い状態コピー | `initial={total:0,items:[]}` | 「差分はありません」「一致した良い状態」を含む文言が表示（RC-5）。既存の各ペイン `EmptyState title="なし"` とは別レベルの全体 empty コピー |
| `補助: 平易ステータス併記` | queued/resolved を平易ラベルで併記 | queued の item を描画 | 平易ラベル（例「対応づけ待ち」）が技術名と併記。既存 `STATUS_LABELS` の値は壊さない |

> guard の肝（FB / 回帰防止）: 「割り当て送信 payload」「rollback 引数」「bulk 集計サマリ」の 3 点を**従来と同一**で固定することで、表示文言追加がロジック層へ漏れないことを機械的に証明する。Phase 4 の正常系 it を温存したうえで重複しない guard のみを追加する（テスト二重化を避ける）。

## 6.4 `page.spec.tsx`（編集・Lane A,C／fail path）

> 対象: `apps/web/app/(admin)/admin/schema/page.spec.tsx`
> 既存 spec（`renders prototype-aligned ...` / `renders section error without stale fallback ...`）は温存。explainer 追加と fail path 振る舞いを追記する。

| describe | it | mock 状態 | 期待値 |
| --- | --- | --- | --- |
| `AdminSchemaPage`（既存温存） | result.ok=true で各セクション描画 | `safeServerFetch` ok=true | 既存 assert に加え、**explainer が描画**される（`data-region="schema-purpose-explainer"` が存在、流れ図 `<ol>` の `<li>` が 3 つ、結果プレビュー文が存在）（AC-1） |
| `AdminSchemaPage` | 統計ラベル/hint が平易化されている | ok=true | `describeStat("unresolved").hint` 文言（「対応づけ」を含む）が DOM に存在。旧 hint 文字列「stableKey 未割当」単独表記が消える／技術名は併記（AC-3） |
| `AdminSchemaPage` | 履歴見出しが「対応づけ履歴」主表記＋技術名併記 | ok=true | `対応づけ履歴` が見出しに存在。`ALIAS HISTORY` 技術名は補助併記として残る（AC-4） |
| `AdminSchemaPage`（fail path） | **result.ok=false 時も explainer は常時表示** | `safeServerFetch` ok=false（既存 ADMIN_FETCH_404 mock 流用） | `AdminSectionErrorClient` 経路（`getByRole("alert")` に code 含む）が出る。**かつ** explainer（`data-region="schema-purpose-explainer"`）と header description が描画される（AskUser「常時表示」/ AC-1）。explainer は三項の**外**に置く設計の保証 |
| `AdminSchemaPage`（fail path） | エラー時に統計 Grid / DiffPanel / 履歴は描画されない（stale 防止温存） | ok=false | 既存の `queryByTestId("admin-schema-section")` null 維持に加え、`項目別の差分` 見出しが null（差分本文は ok 真枝のみ） |

> 設計上の決定（fail path の置き場所）: 現行 `page.tsx`（L154-167）は `result.ok ? (<>...</>) : <AdminSectionErrorClient/>` の三項。`SchemaPurposeExplainer` は **`AdminPageHeader` 直下・かつ三項の外**に置く。理由 — ユーザーの AskUser 確定方針「常時表示」と AC-1「常時表示」が最上位の根拠であり、混乱・エラー時こそ目的説明の価値が高い。header description（平易化）は元から三項の外で常時表示されるため、explainer も同じ層に置くのが整合的。差分本文（統計 / DiffPanel / 履歴）のみ ok 真枝に閉じ、stale を防ぐ。

## 6.5 テスト実行コマンド（focused・SSOT §7 準拠）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
```

> vitest include は `apps/**/__tests__/**/*.spec.{ts,tsx}` / `apps/**/app/**/*.spec.{ts,tsx}` を既にカバー（`vitest.config.ts` L44-54）。新規 spec は追加設定不要で収集される。

## 完了条件

- [x] `schemaGlossary` の防御（未知キー not.toThrow＋既定値）・網羅（全 diff type / stat key）テストを表で定義
- [x] `SchemaDiffPanel` の回帰 guard（割り当て payload / rollback 引数 / bulk 集計の不変）を Phase 4 と非重複で定義
- [x] `page.spec` の fail path（ok=false 時も explainer 常時表示・差分本文は stale 非描画）を定義
- [x] explainer の置き場所（三項の外＝常時表示）を AskUser 方針・AC-1 から確定、Phase 8/9 へ申し送り
- [x] focused vitest コマンドを明記
