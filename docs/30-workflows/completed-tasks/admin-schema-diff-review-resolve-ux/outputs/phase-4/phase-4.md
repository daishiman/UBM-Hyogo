# Phase 4: テスト作成（ケース設計） — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書 / implemented_local_evidence_captured]`

> 本 Phase は **テスト実装済み**。テストファイルの実コードとケースを実装済み。テスト実行・実装・commit は本 wave で実行済み（本 waveで実行済み）。
> 各ケース・各判定行に状態 suffix `implemented_local_evidence_captured` を付す。

---

## 0. 対象テストファイル（3 件）

| # | ファイル | 種別 | 主目的 |
|---|---------|------|--------|
| 1 | `apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts` | 新規 | `plainLabel` / `termDescription` の登録/未登録/全 12 語整合・形式検証 |
| 2 | `apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx` | 新規 | 3 ステップ見出し・用語ミニ集・`data-component` の存在 |
| 3 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | 既存に追加 | インライン展開（カード直下）・文脈ヘルプ・ボタン文言・**回帰**（bulk/rollback/undo 不変） |

> テストファイル命名は不変条件 #8（`*.spec.ts(x)` のみ）に準拠 `implemented_local_evidence_captured`。

---

## 1. props vs internal state の前提（VSCPKR-03・全ケース共通）

- インラインフォームの表示分岐は **新規 props を増やさず、既存 internal state `active`（`SchemaDiffPanel` が所有）駆動**である `implemented_local_evidence_captured`。
- 表示条件は `active?.diffId === it.diffId && active.questionId`。`active.questionId` が無い場合はカード直下に alert（`alias 割当はできません`）を出す `implemented_local_evidence_captured`。
- `stableKey` / `busy` / `feedback` / `stableKeyInputRef` も既存 internal state を再利用。テストは props ではなく **クリック操作（`fireEvent.click(label button)`）で `active` を遷移**させて表示を検証する `implemented_local_evidence_captured`。

---

## 2. `schemaReviewTerms.spec.ts`（新規・純データ/ヘルパ）

### 2.1 検証対象シンボル

- `SCHEMA_REVIEW_TERMS: Record<string, SchemaReviewTerm>`（12 語）
- `plainLabel(technical: string): string` — `${plain}（技術名: ${technical}）`、未登録は `technical` を原文返却
- `termDescription(technical: string): string` — 一文説明、未登録は `""`

### 2.2 ケース表

| ID | 前提 | 操作 | 期待値 | 状態 |
|----|------|------|--------|------|
| TC-TERMS-01 | `SCHEMA_REVIEW_TERMS` import | `Object.keys(SCHEMA_REVIEW_TERMS)` | 12 キー（`stableKey`,`questionId`,`alias`,`resolve`,`unresolved`,`added`,`changed`,`removed`,`revision`,`backfill`,`recompute`,`rollback`）を**過不足なく**含む | `implemented_local_evidence_captured` |
| TC-TERMS-02 | 同上 | 各エントリの `technical` がそのキー文字列と一致するか走査 | 全 12 件で `entry.technical === key`（自己整合） | `implemented_local_evidence_captured` |
| TC-TERMS-03 | 同上 | 各エントリの `plain` / `description` を走査 | 全 12 件で `plain` が非空文字、`description` が非空文字（空欄漏れ防止） | `implemented_local_evidence_captured` |
| TC-TERMS-04 | `plainLabel` import | `plainLabel("stableKey")` | `"永続的な名前（技術名: stableKey）"`（形式 `${plain}（技術名: ${technical}）`・全角括弧・コロン後半角スペース） | `implemented_local_evidence_captured` |
| TC-TERMS-05 | 同上 | `plainLabel("resolve")` | `"名前を割り当てる（技術名: resolve）"` | `implemented_local_evidence_captured` |
| TC-TERMS-06 | 同上 | 12 語すべてに対し `plainLabel(key)` が `` `（技術名: ${key}）` `` を含むかを走査 | 全 12 件で `.includes(\`（技術名: ${key}）\`)` が true | `implemented_local_evidence_captured` |
| TC-TERMS-07（未登録防御） | 同上 | `plainLabel("notARegisteredTerm")` | `"notARegisteredTerm"`（原文をそのまま返す・例外を投げない） | `implemented_local_evidence_captured` |
| TC-TERMS-08 | `termDescription` import | `termDescription("unresolved")` | `SCHEMA_REVIEW_TERMS.unresolved.description` と一致（一文説明を返す） | `implemented_local_evidence_captured` |
| TC-TERMS-09（未登録防御） | 同上 | `termDescription("notARegisteredTerm")` | `""`（空文字・例外を投げない） | `implemented_local_evidence_captured` |
| TC-TERMS-10（境界・空文字入力） | 同上 | `plainLabel("")` / `termDescription("")` | `plainLabel("")` は `""`（原文 = 空文字を返す）、`termDescription("")` は `""`（どちらも throw しない） | `implemented_local_evidence_captured` |

> 境界値テスト注記（Feedback W0-RV-001）: 形式アサーションは**実文字数・実文字種**に正確であること。`（技術名: ...）` は **全角開き括弧 U+FF08 / 全角閉じ括弧 U+FF09**・`技術名` の後は**半角コロン `:` + 半角スペース**で固定。テストは shared-context §2-A の逐語値（例 `永続的な名前`）を期待値に直書きする（部分一致でなく完全一致 or `.includes` を用途で使い分け） `implemented_local_evidence_captured`。

---

## 3. `SchemaReviewGuide.spec.tsx`（新規・目的説明）

### 3.1 検証対象

- `SchemaReviewGuide`（props なし・`@testing-library/react` の `render(<SchemaReviewGuide />)` で描画）
- 3 ステップの流れ `data-component="schema-review-guide-flow"`
- 用語ミニ集 `data-component="schema-review-glossary"`

### 3.2 ケース表

| ID | 前提 | 操作 | 期待値 | 状態 |
|----|------|------|--------|------|
| TC-GUIDE-01 | `render(<SchemaReviewGuide />)` | `screen.getByRole("heading", { name: /フォームの設問変更を、過去データと繋げて整理します/ })` | 見出し（`<h2 id="schema-guide-h">`）が存在 | `implemented_local_evidence_captured` |
| TC-GUIDE-02 | 同上 | eyebrow テキスト `screen.getByText("このページでできること")` | 存在する | `implemented_local_evidence_captured` |
| TC-GUIDE-03 | 同上 | `document.querySelector('[data-component="schema-review-guide-flow"]')` | not null（3 ステップ流れコンテナが存在） | `implemented_local_evidence_captured` |
| TC-GUIDE-04 | 同上 | flow コンテナ配下のステップ文 3 件を確認（「自動で見つけます」「永続的な名前」「過去の回答が新しい設問に自動で対応づきます」を含む 3 ステップ） | ステップ 1=検出、2=名前割当（`技術名: stableKey` 併記を含む）、3=対応づけ の 3 件が順に存在 | `implemented_local_evidence_captured` |
| TC-GUIDE-05 | 同上 | `document.querySelector('[data-component="schema-review-glossary"]')` | not null（用語ミニ集が存在） | `implemented_local_evidence_captured` |
| TC-GUIDE-06 | 同上 | glossary 配下に主要語（少なくとも `永続的な名前` / `名前を割り当てる` / `名前が未割当`）が表示されているか | 主要 4-6 語のうち上記が `schema-review-glossary` 配下に存在し、各語に `技術名:` 併記がある | `implemented_local_evidence_captured` |
| TC-GUIDE-07（用語 SSOT 連動） | 同上 + `schemaReviewTerms` import | glossary 表示語が `plainLabel(...)` 由来である（例: `plainLabel("stableKey")` の文字列が DOM に含まれる） | `screen.getByText` で `永続的な名前（技術名: stableKey）` 等が取得できる（ハードコードでなく SSOT 連動） | `implemented_local_evidence_captured` |
| TC-GUIDE-08（a11y） | 同上 | `section[aria-labelledby="schema-guide-h"]` の存在と、その `aria-labelledby` が `h2#schema-guide-h` を指す | section と h2 の id 連携が成立 | `implemented_local_evidence_captured` |

---

## 4. `SchemaDiffPanel.component.spec.tsx`（既存に追加）

> 既存ファイルは form を `screen.getByRole("form", { name: "stableKey alias 割当" })`、input を `getByLabelText(/新しい stableKey/)`、送信ボタンを `getByRole("button", { name: "割当" })` で query している。本タスクの文言変更（label「新しい永続的な名前（技術名: stableKey）」/ ボタン「名前を割り当てる」）と配置変更（カード直下インライン）により**これら既存ケースの query セレクタが破綻する**。Phase 6（テスト更新計画）で既存ケースのセレクタを新文言・新配置へ追従させる前提を本 Phase で確定する `implemented_local_evidence_captured`。

### 4.1 新規追加ケース（インライン展開 / 文脈ヘルプ / ボタン文言）

| ID | 前提 | 操作 | 期待値 | 状態 |
|----|------|------|--------|------|
| TC-PANEL-INLINE-01 | `initial={{ total:1, items:[item({ diffId:"d-x", questionId:"q-x", type:"unresolved", label:"lbl-x" })] }}` で render | `fireEvent.click(screen.getByRole("button", { name: /lbl-x/ }))` | `document.querySelector('[data-component="schema-assign-inline-form"]')` が not null（割当フォームが描画） | `implemented_local_evidence_captured` |
| TC-PANEL-INLINE-02（**直下** = 当該カードの子孫） | 同上 + クリック後 | `screen.getByText("lbl-x").closest(".schema-field-card")` を取得し、その要素の `.querySelector('[data-component="schema-assign-inline-form"]')` を確認 | インラインフォームが**クリックしたカード（`schema-field-card`）の子孫**として存在する（パネル末尾ではない） | `implemented_local_evidence_captured` |
| TC-PANEL-INLINE-03（他カード非汚染） | `items` に 2 件（`d-x`/`d-y`）。`d-x` をクリック | `d-y` の `closest(".schema-field-card")` 配下に `schema-assign-inline-form` が**無い**こと | クリックしたカードのみフォームを持ち、他カードには出ない（`active` 駆動の単一表示） | `implemented_local_evidence_captured` |
| TC-PANEL-INLINE-04（focus 維持） | `d-x`（questionId あり）クリック | クリック直後の `document.activeElement` | 新 label の input（`getByLabelText(/新しい永続的な名前/)`）が focus される（既存 `useEffect([active])` focus 挙動の維持） | `implemented_local_evidence_captured` |
| TC-PANEL-HELP-01（文脈ヘルプ表示） | `d-x` クリック後 | `document.querySelector('[data-role="assign-help"]')` | not null かつ textContent に「過去のフォーム回答が新しい設問に自動で対応づきます」を含む（達成価値の提示・AC-2） | `implemented_local_evidence_captured` |
| TC-PANEL-HELP-02（やさしい用語 label） | `d-x` クリック後 | `screen.getByLabelText(/新しい永続的な名前/)`（または `/技術名: stableKey/` を含む label） | input の label が「新しい永続的な名前（技術名: stableKey）」へ更新済み（AC-3） | `implemented_local_evidence_captured` |
| TC-PANEL-BTN-01（送信ボタン文言） | `d-x` クリック後 | `screen.getByRole("button", { name: "名前を割り当てる" })` | 送信ボタン文言が「名前を割り当てる」へ更新済み（旧「割当」は当該フォーム内に存在しない） | `implemented_local_evidence_captured` |
| TC-PANEL-PANEDESC-01（ペイン平易説明・AC-5） | `items` に 4 type を 1 件ずつ含めて render | 各ペイン見出し（`<h2 id="pane-unresolved">` 等）直下の `<p className="muted">` を確認 | `unresolved` ペインに `termDescription("unresolved")` 由来の平易説明（「名前が未割当」「割り当てると過去回答と繋がります」相当）が表示。`added`/`changed`/`removed` も各 `termDescription` 由来の一文が付く | `implemented_local_evidence_captured` |
| TC-PANEL-NOQID-01（questionId なし alert がカード直下） | `item({ diffId:"d-n", questionId:null, type:"removed", label:"lbl-removed" })` | label クリック後、`screen.getByText("lbl-removed").closest(".schema-field-card")` 配下の `[role="alert"]` を確認 | alert（`alias 割当はできません` 相当）が**当該カードの子孫**として表示され、`schema-assign-inline-form` は出ない | `implemented_local_evidence_captured` |

### 4.2 回帰ケース（bulk / rollback / undo / recompute の不変・AC-6）

> 既存テスト群（`BULK-PANEL-01..04`, `BULK-ROLLBACK-PANEL-01..02`, `rollback`, `undo toast`, `T-13U..T-15U`, `UI-02..06`）は**動作・`data-testid`・`aria-label` が不変**であることを担保する。表示テキスト・配置変更に伴い query セレクタのみ追従し、検証ロジックは維持する。

| ID | 前提 | 操作 | 期待値（不変） | 状態 |
|----|------|------|----------------|------|
| TC-PANEL-REG-01（bulk checkbox aria-label 不変） | `BULK-PANEL-01` 相当 | `Bulk Resolve` トグル → `getByLabelText("select diff qb")` / `getByLabelText("select diff qd")` | aria-label `select diff ${questionId}` は**不変**（rename しない） | `implemented_local_evidence_captured` |
| TC-PANEL-REG-02（bulk 全選択 aria-label 不変） | `BULK-PANEL-02` 相当 | `getByLabelText("全選択 未解決")` / `getByTestId("bulk-selection-summary")` | 「全選択 未解決」「`bulk-selection-summary`」は不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-03（bulk modal testid 不変） | `BULK-PANEL-03c` 相当 | `getByTestId("bulk-resolve-modal")` | testid 不変・modal 動作不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-04（rollback aria-label 不変） | `rollback` 相当 | `getByRole("button", { name: /alias Full name の resolve を取り消す/ })` → dialog | rollback トリガー aria-label・dialog 挙動不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-05（bulk rollback testid 不変） | `BULK-ROLLBACK-PANEL-01` 相当 | `getByTestId("bulk-rollback-selection-summary")` / `getByTestId("bulk-rollback-modal")` | testid・選択集計・modal 動作不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-06（undo toast 不変） | `undo toast` 相当 | `document.querySelector('[data-component="undo-toast"]')` / `getByRole("button", { name: /alias lbl-u の割当を取消す/ })` | `data-component="undo-toast"`・aria-label・5 分失効動作が不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-07（recompute data-role 不変） | `T-13U..T-15U` 相当 | `[data-role="recompute-trigger"]` / `[data-role="recompute-status"]` / `[data-role="recompute-error"]` | recompute 系 `data-role` と状態遷移が不変 | `implemented_local_evidence_captured` |
| TC-PANEL-REG-08（API contract 不変） | `mutation 成功` 相当 | 割当送信で `postSchemaAlias` 呼出 payload を確認 | `postSchemaAliasMock` が `{ diffId, questionId, stableKey }` で呼ばれる（API contract 不変・配置/文言変更の影響を受けない） | `implemented_local_evidence_captured` |
| TC-PANEL-REG-09（HTTP 202 retryable 不変） | `UI-02` 相当 | 202 応答で `data-feedback-kind="retryable"` / 「Back-fill 再試行可能」 | retryable continuation 表示・form 維持が不変 | `implemented_local_evidence_captured` |

### 4.3 既存ケースのセレクタ追従（Phase 6 で更新する既存ケース一覧）

> 下記既存ケースは文言/配置変更で query が破綻するため、Phase 6（テスト拡充）で**新文言・新配置へ追従**させる。検証意図は維持し、セレクタのみ更新する `implemented_local_evidence_captured`。

| 既存ケース | 旧セレクタ | 新セレクタ方針 | 状態 |
|-----------|-----------|---------------|------|
| `mutation 成功` 他 input 取得 | `getByLabelText(/新しい stableKey/)` | `getByLabelText(/新しい永続的な名前/)` | `implemented_local_evidence_captured` |
| 送信操作 | `getByRole("button", { name: "割当" })` | `getByRole("button", { name: "名前を割り当てる" })` | `implemented_local_evidence_captured` |
| form 取得 | `getByRole("form", { name: "stableKey alias 割当" })` | `[data-component="schema-assign-inline-form"]` の存在 + 当該カード子孫検証へ置換（form の aria-label は維持の場合は role 取得も可・shared-context §1 の `aria-label="stableKey alias 割当"` を残すなら名前不変） | `implemented_local_evidence_captured` |
| `BULK-PANEL-04` 回帰 | `getByRole("form", { name: "stableKey alias 割当" })` | インライン form 存在検証（`schema-assign-inline-form`）へ置換 | `implemented_local_evidence_captured` |

> 注: form の `aria-label="stableKey alias 割当"` を**維持する**設計の場合（shared-context §1 で機械可読属性不変方針）、`getByRole("form", { name: "stableKey alias 割当" })` は不変で温存できる。インライン化で位置のみ変わるため、form の role/aria-label は維持し、追加検証として「当該カード子孫であること」を `data-component` で確認する二段構えとする（機械可読 id 不変・AC-6 整合） `implemented_local_evidence_captured`。

---

## 5. テスト実行コマンド（本 waveで実行済み）

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
```

> targeted run（FB-UI-02-2・メモリ制約対策）。全件 `pnpm test` は使わない `implemented_local_evidence_captured`。

---

## 完了条件

- [x] 3 テストファイルのケースを ID・前提・操作・期待値で設計記述した（実行済み）`implemented_local_evidence_captured`
- [x] `schemaReviewTerms.spec.ts` に登録/未登録防御/全 12 語整合/形式 `${plain}（技術名: ${technical}）` のケースを定義した `implemented_local_evidence_captured`
- [x] `SchemaReviewGuide.spec.tsx` に 3 ステップ・用語ミニ集・`data-component` 存在のケースを定義した `implemented_local_evidence_captured`
- [x] `SchemaDiffPanel.component.spec.tsx` にインライン直下展開（カード子孫）・文脈ヘルプ `assign-help`・ボタン「名前を割り当てる」・**回帰**（bulk/rollback/undo/recompute/202 の不変）を定義した `implemented_local_evidence_captured`
- [x] props vs internal state（`active` 駆動）を明記した（VSCPKR-03）`implemented_local_evidence_captured`
- [x] 既存ケースのセレクタ追従（Phase 6 で更新する一覧）を明記した `implemented_local_evidence_captured`
- [x] 境界値テストの実文字数/文字種注意（Feedback W0-RV-001）を明記した `implemented_local_evidence_captured`
- [x] targeted vitest 実行コマンドを記載した（本 waveで実行済み）`implemented_local_evidence_captured`
