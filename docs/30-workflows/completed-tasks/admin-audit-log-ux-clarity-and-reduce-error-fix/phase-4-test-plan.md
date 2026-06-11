# Phase 4 — テスト計画（TDD RED）

> 正本: [shared-context.md](./shared-context.md)。本書は AC-1〜AC-10 を網羅する RED テストケースを設計する。
> `implementation_mode: new` のため、Phase 5 実装より前に本テスト群を **失敗する状態（RED）** で先行作成する。

---

## 1. RED 方針

- 本タスクは UI task（VISUAL）/ `new` モード。各 spec は実装前に書き、**最初は import 解決失敗 or assertion 失敗で RED** になることを確認してから Phase 5 で GREEN にする。
- 純関数（`auditAppliedFilters` / `auditErrorMessage`）は **表駆動テスト**（input→output）。
- コンポーネント（`AuditLogCard` / `AuditPurposeGuide`）は **external props のみ注入**（[VSCPKR-03]・後述 §5）。React state を持たないため、テストで操作する入力は全て props であり internal state はない。
- `TagCatalogPanel.reduce-guard` は `initial` prop の undefined パターン注入。`window.api` 等の Preload API モックが必要な場合は `Object.defineProperty(window, ...)` を使い、**`vi.stubGlobal("window", ...)` は使用禁止**（[VSCPKR-02]）。本コンポーネントは `window.api` を直接参照しないが、`useAdminMutation` / `useRouter` を間接利用するため、`next/navigation` の `useRouter` モックは必要（§4-5 参照）。
- テスト文字列で文字数の境界が意味を持つ箇所は、`"...".length` で**実文字数を確認してから書く**（[W0-RV-001]）。本タスクでは minLength/maxLength 境界は無いが、JST 日時文字列・マスク文字列の部分一致は実値（`formatJst` の出力 `2026/05/01 ... JST`）を基準にする。

---

## 2. AC 網羅テストケース表

| テストID | 対象 AC | 対象 spec ファイル | 入力 | 期待値 |
|---------|---------|------------------|------|--------|
| T-AAF-01 | AC-2 | `auditAppliedFilters.spec.ts` | `toAppliedFilterChips(undefined, "50")` | `[]`（空配列。UI 側で「なし（直近50件）」表示） |
| T-AAF-02 | AC-2 | 〃 | `toAppliedFilterChips({ action: "identity.merge" }, "50")` | `[{ key: "action", label: "action=identity.merge" }]` |
| T-AAF-03 | AC-2 | 〃 | `toAppliedFilterChips({ from: "2026-06-01T00:00:00Z", to: "2026-06-09T00:00:00Z" }, "50")` | 期間チップ1件 `label` に `2026-06-01` と `2026-06-09` を含む |
| T-AAF-04 | AC-2 | 〃 | `toAppliedFilterChips({ from: "2026-06-01T00:00:00Z" }, "50")` | 期間チップ `label` が「以降」を含む（from のみ） |
| T-AAF-05 | AC-2 | 〃 | `toAppliedFilterChips({ to: "2026-06-09T00:00:00Z" }, "50")` | 期間チップ `label` が「まで」を含む（to のみ） |
| T-AAF-06 | AC-2 | 〃 | `toAppliedFilterChips({ limit: 25 }, "50")` | `[{ key: "limit", label: "limit=25" }]` |
| T-AAF-07 | AC-2 | 〃 | `toAppliedFilterChips({ action:"identity.merge", actorEmail:"a@b.com", targetType:"member", targetId:"m1", batchId:"b1", limit:100 }, "50")` | action/actorEmail/targetType/targetId/batchId/limit の6チップ（順序固定・key 一意） |
| T-AAF-08 | AC-2 | 〃 | `toAppliedFilterChips({ cursor: "xyz" }, "50")` | cursor はチップ化しない（`[]`。ページング内部値で絞り込み条件ではない） |
| T-ALC-01 | AC-1 | `AuditLogCard.spec.tsx` | 通常 item（actor=admin@…, target=meeting/s1, before/after あり, createdAt） | カードに JST 日時 / action バッジ / 対象 / 折りたたみが描画され、生 email を含まない |
| T-ALC-02 | AC-1 | 〃 | `actorEmail: null` の item | 「実行者: システム」が表示される（`maskAuditText` の "system" を「システム」表示へラップ） |
| T-ALC-03 | AC-1 | 〃 | `targetType: null, targetId: null` | 「対象: —」が表示される |
| T-ALC-04 | AC-1 | 〃 | `maskedBefore: null, maskedAfter: null` | 折りたたみ summary が「変更内容: なし」 |
| T-ALC-05 | AC-1 | 〃 | `maskedAfter: { batchId: "batch-1079", tagId: "t1" }` | `data-testid="audit-batch-id"` が描画され `BatchIdCopyButton`（aria-label `batchId batch-1079 をコピー`）が出る |
| T-ALC-06 | AC-1 | 〃 | batchId を含まない item | `audit-batch-id` が描画されない |
| T-ALC-07 | AC-1 | 〃 | `parseError: true` | `role="note"` の JSON parse warning が描画される |
| T-ALC-08 | AC-1 | 〃 | before/after 両方あり | 折りたたみ内に before（JSON）と after（JSON）が並置され、`before-json` / `after-json` の `data-testid` が維持される |
| T-APG-01 | AC-3 | `AuditPurposeGuide.spec.tsx` | （props なし）render | `data-component="audit-purpose-guide"` の section が描画される |
| T-APG-02 | AC-3 | 〃 | 〃 | 「この画面でできること」見出し相当のテキストが描画される |
| T-APG-03 | AC-3 | 〃 | 〃 | `AUDIT_GLOSSARY` の全エントリ（action/actor/target/batchId/PII の5語）が `term` と `plain` 両方描画される（`data-testid="audit-glossary"`） |
| T-AEM-01 | AC-4 | `auditErrorMessage.spec.ts` | `toAuditErrorView("admin api /admin/audit?limit=50 failed: 404")` | `title` あり・`hint` が「疎通」「deploy」「認可」のいずれかを含む |
| T-AEM-02 | AC-4 | 〃 | `toAuditErrorView("from must be before to")`（date range・`from` を含む文字列） | `hint` が期間の前後に関する案内を含む |
| T-AEM-03 | AC-4 | 〃 | `toAuditErrorView("invalid cursor")` | `hint` が cursor リセット誘導を含む |
| T-AEM-04 | AC-4 | 〃 | `toAuditErrorView("status 500")` | generic: `title` に元エラーを含み `hint` は undefined もしくは汎用文 |
| T-TCG-01 | AC-6 | `TagCatalogPanel.reduce-guard.spec.tsx` | `initial={{ total: 3 }}`（items undefined） | クラッシュせず EmptyState「該当するタグはありません」が描画される |
| T-TCG-02 | AC-6 | 〃 | `initial={undefined}` | クラッシュせず空表示（reduce が呼ばれない） |
| T-TCG-03 | AC-6 | 〃 | `initial={{ items: [] }}`（total undefined） | クラッシュせず「全体 0件」チップ・pager の page 数が NaN にならない |
| T-TCG-04 | AC-6 | 〃 | `initial={{ total: 1, items: [active1] }}` | 正常時: 有効件数チップが「有効 1件」 |
| T-ALP-01 | AC-1/AC-2/AC-3 | `AuditLogPanel.component.spec.tsx`（編集） | items あり + appliedFilters あり | カードタイムライン（`audit-log-card`）+ appliedFilters chips（`audit-applied-filters`）+ guide（`audit-purpose-guide`）が描画される |
| T-ALP-02 | AC-5 | 〃 | render | action datalist に拡充プリセット（`AUDIT_ACTION_PRESETS` の実 action）が含まれ、targetType に datalist が付与される |
| T-ALP-03 | AC-7 | 〃 | 既存 assertion（mask/href/empty/404/batchId/parseError 等） | 既存テストの意図（PII マスク・pagination href・empty・404 hint・batchId 表示）が維持される |
| T-ALP-04 | AC-3 | 〃 | error あり（result.ok=false 相当） | error 時でも guide が描画される（常時表示） |

---

## 3. AC ↔ テスト対応マトリクス（網羅確認）

| AC | カバーするテストID |
|----|-------------------|
| AC-1（カード型タイムライン） | T-ALC-01〜08, T-ALP-01 |
| AC-2（appliedFilters 可視化） | T-AAF-01〜08, T-ALP-01 |
| AC-3（目的・用語ガイド常時表示） | T-APG-01〜03, T-ALP-01, T-ALP-04 |
| AC-4（エラー親切化） | T-AEM-01〜04 |
| AC-5（datalist 拡充） | T-ALP-02 |
| AC-6（reduce 根絶） | T-TCG-01〜04 |
| AC-7（既存純関数・既存テスト維持） | T-ALP-03 + 既存 `AuditLogPanel.component.spec` の純関数 describe 群（maskAuditJson / formatJst / buildAuditHref / maskAuditText / summarizeAuditJson / extractBatchId）を**シグネチャ不変で全 PASS 維持** |
| AC-8（apps/api 非変更） | テストではなく `git diff --name-only -- apps/api` 空チェック（§6） |
| AC-9（HEX ゼロ） | `pnpm verify:tokens`（§6） |
| AC-10（typecheck/lint/vitest 緑） | §6 検証コマンド |

---

## 4. 各 spec ファイルのケース詳細

### 4-1. `auditAppliedFilters.spec.ts`（純関数・表駆動）

- import: `toAppliedFilterChips`, `type AppliedFilterChip`（`../auditAppliedFilters`）, `type AdminAuditFilters`（`../../../lib/admin/types`）。
- 表駆動: `[{ name, filters, fallbackLimit, expected }]` を `it.each` で回す。
- 検証観点:
  - undefined → `[]`（T-AAF-01）。
  - 個別フィールド → 該当チップ1件（T-AAF-02, 06）。
  - from/to は **1つの「期間」チップに集約**し、from のみ/to のみ/両方で label 表現を分岐（T-AAF-03/04/05）。
  - 複合 → key 重複なし・順序固定（action→actorEmail→targetType→targetId→期間→batchId→limit）（T-AAF-07）。
  - `cursor` は絞り込み条件でないためチップ化しない（T-AAF-08）。
- 純関数のため副作用・例外なし（[WEEKGRD-02]）。不正 ISO（`new Date` 不能）でも throw せず元文字列 fallback。

### 4-2. `AuditLogCard.spec.tsx`（external props のみ）

- import: `AuditLogCard`（`../AuditLogCard`）, `render`/`screen`/`cleanup`（@testing-library/react）。`afterEach(cleanup)`。
- props 注入のみ（internal state なし）。各ケースで `<AuditLogCard item={...} />` を render。
- 検証観点（T-ALC-01〜08）:
  - 通常: 日時（`/2026\/05\/01/` 等 `formatJst` 出力）、action テキスト、対象、生 PII 非含有。
  - actor=null → 「システム」表示（`maskAuditText` の "system" を日本語ラベル化。**実装側で "system" → 「システム」変換**。テストは「システム」を assert）。
  - target=null → 「—」。
  - before/after 両 null → 折りたたみ summary「変更内容: なし」。
  - batchId 有/無で `audit-batch-id` の描画分岐 + copy ボタン aria-label 維持。
  - parseError → `role="note"`。
  - before/after 両方あり → `before-json` / `after-json` の `data-testid` 維持 + 1つの `<details>` 内並置。

### 4-3. `AuditPurposeGuide.spec.tsx`（external props なし・静的）

- import: `AuditPurposeGuide`（`../AuditPurposeGuide`）, `AUDIT_GLOSSARY`（`../auditGlossary`）。
- render 後:
  - `data-component="audit-purpose-guide"` の存在。
  - 「この画面でできること」相当の説明文。
  - `AUDIT_GLOSSARY` を `.forEach` で回し、各 `entry.term` と `entry.plain` が DOM に描画されることを assert（全エントリ描画・常時表示）。
  - `data-testid="audit-glossary"` リストの存在。

### 4-4. `auditErrorMessage.spec.ts`（純関数・分岐）

- import: `toAuditErrorView`, `type AuditErrorView`（`../auditErrorMessage`）。
- 分岐ケース（T-AEM-01〜04）: 404 / date range（`from`>`to`）/ invalid cursor / generic。
- 各ケースで `title`（必ず存在）・`hint`（404/range/cursor は存在、generic は任意）を assert。
- 純関数・例外なし。空文字 `""` 入力でも generic で `title` を返す（防御）。

### 4-5. `TagCatalogPanel.reduce-guard.spec.tsx`（防御ガード）

- import: `TagCatalogPanel`（`../TagCatalogPanel`）, `render`/`screen`/`cleanup`。
- **モック**: `next/navigation` の `useRouter`（`vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))`）。`useAdminMutation` は実体で動くが mutation を呼ばないため副作用なし。`window.api` を要する場合は `Object.defineProperty(window, "api", { value: {...}, writable: true })`（`vi.stubGlobal("window")` 禁止 [VSCPKR-02]）。
- ケース（T-TCG-01〜04）:
  - `initial={{ total: 3 } as TagCatalogListView}`（items undefined を意図的に型キャストで注入）→ クラッシュせず EmptyState。
  - `initial={undefined as unknown as TagCatalogListView}` → クラッシュせず空表示。
  - `initial={{ items: [] } as TagCatalogListView}`（total undefined）→ 「全体 0件」・pager の page 表示が NaN にならない（`page 1 / 1` 等）。
  - 正常 `initial={{ total: 1, items: [activeTag] }}` → 「有効 1件」。
- **RED 確認**: 現状（防御ガードなし）の `TagCatalogPanel` では `items.reduce` で `TypeError` が throw され T-TCG-01/02/03 が失敗する。Phase 5 の防御ガード実装で GREEN。

### 4-6. `AuditLogPanel.component.spec.tsx`（編集・既存 + 新規 assertion）

- **既存 assertion の維持方針（AC-7）**:
  - 純関数 describe 群（maskAuditJson / formatJst / buildAuditHref / maskAuditText / summarizeAuditJson / extractBatchId）は **無改変**。
  - DOM 依存の既存 it のうち、テーブル前提（`screen.getByText("after: email, count")`・`before: なし`・`-`（target dash）・`audit-batch-id` 等）は **カード DOM へ最小調整**。テキスト/summary 文言が実装で変わる箇所（例: target dash `-` → `—`、actor `system` → `システム`）はテスト側を新仕様へ更新し、**意図（PII マスク・pagination href・empty・404・batchId 表示・parseError）は保持**する。調整は「テーブル構造 → カード構造」への DOM セレクタ変更に限定し、検証している振る舞いは変えない。
- **新規 assertion（T-ALP-01〜04）**:
  - カードタイムライン: `screen.getAllByTestId("audit-log-card")` が items 数と一致。
  - appliedFilters: data に `appliedFilters` を渡し `data-testid="audit-applied-filters"` 内にチップが描画される。未指定時は「なし」表現。
  - guide: `data-component="audit-purpose-guide"` が常時（error 有無問わず）描画。
  - datalist: `audit-action-presets` の option が拡充プリセット（`AUDIT_ACTION_PRESETS`）を含む。targetType に datalist（新規 id 例: `audit-target-type-presets`）が付与。
  - **注意**: 既存テスト T（filter form の it）は datalist option を `["identity.merge","identity.dismiss"]` に厳密一致で assert している。datalist 拡充により**この既存 assertion を新プリセット配列へ更新**する（AC-5 の正当な変更。意図は「datalist が存在し action 補助が効く」ことなので保持）。

---

## 5. [VSCPKR-03] props vs internal state 明記

| コンポーネント | テスト操作対象 | internal state |
|--------------|--------------|----------------|
| `AuditLogCard` | **external props のみ**（`item`） | なし（`<details>` open は DOM ネイティブ・React state 非保持） |
| `AuditPurposeGuide` | props なし（静的） | なし |
| `AuditLogPanel` | external props（`data`/`values`/`error`） | なし（フォームは uncontrolled・既存踏襲） |
| `TagCatalogPanel` | external props（`initial`/`query`/`page`/`pageSize`） | あり（`items`/`searchText` 等 useState）。ただし reduce-guard テストは **初期 props（`initial`）注入で初期 state を検証**し、内部操作はしない |

→ RED を書く前に各コンポーネントが props のみで描画されることを確認済み。`AuditLogCard` / `AuditPurposeGuide` は props 注入で RED を書く（state 操作不要）。

---

## 6. 実行コマンド（targeted vitest・SIGKILL 回避）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
  apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx
git diff --name-only -- apps/api    # 空であること（AC-8）
```

- 全件 `pnpm test` は使わず、対象6ファイル指定で実行（[FB-UI-02-2]）。
- RED → GREEN: 上記6 spec を Phase 5 実装前に作成し RED 確認。実装後に同コマンドで全 PASS（GREEN）を確認する。
