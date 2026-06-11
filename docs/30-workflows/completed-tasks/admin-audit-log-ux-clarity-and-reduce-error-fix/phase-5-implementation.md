# Phase 5 — 実装手順

> 正本: [shared-context.md](./shared-context.md)。本書は Lane A/B/C の具体的実装手順を記述する。
> コード実装の実行は user-gated（本仕様書は手順のみ）。Phase 4 の RED → 本 Phase で GREEN。

---

## 0. P50 差分確認（implementation_mode: new）

current branch に実装は無い（Phase 1 §9 確認済み）。本 Phase は新規実装。upstream マージ済みなし・前提タスクなし。
→ 通常の RED/GREEN 実装手順。Lane A→B 統合 → Lane C の順、または同一担当で進める。

---

## 1. [Feedback RT-03] 変更ファイル一覧（新規 / 修正）

| パス | 種別 | レーン |
|------|------|--------|
| `apps/web/src/components/admin/AuditLogCard.tsx` | **新規** | A |
| `apps/web/src/components/admin/auditAppliedFilters.ts` | **新規** | A |
| `apps/web/src/components/admin/AuditPurposeGuide.tsx` | **新規** | B |
| `apps/web/src/components/admin/auditGlossary.ts` | **新規** | B |
| `apps/web/src/components/admin/auditErrorMessage.ts` | **新規** | B |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | **修正** | A(主構造)/B(差し込み) |
| `apps/web/app/(admin)/admin/audit/page.tsx` | **修正** | B（error を文字列のまま渡す既存維持。guide は Panel 内配置のため原則不変。必要時のみ調整） |
| `apps/web/src/components/admin/TagCatalogPanel.tsx` | **修正** | C |
| `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | **修正（真因が shape 不整合の場合のみ）** | C |
| `apps/web/src/styles/globals.css` | **修正** | A/B |
| `apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | **新規** | A |
| `apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts` | **新規** | A |
| `apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx` | **新規** | B |
| `apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts` | **新規** | B |
| `apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx` | **新規** | C |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | **修正**（カード化に伴う既存 assertion 調整・意図保持） | A |

> `apps/api` は非変更（AC-8）。`apps/web/src/lib/admin/types.ts` も非変更（`AdminAuditFilters` / `AdminAuditListItem` / `AdminAuditListResponse` を既存のまま import）。

---

## 2. Lane A — カード型タイムライン + appliedFilters 可視化

### 2-1. `auditAppliedFilters.ts`（新規・純関数）

シグネチャ（shared-context §4 / phase-2 §4）:

```ts
import type { AdminAuditFilters } from "../../lib/admin/types";

export interface AppliedFilterChip {
  readonly key: string;
  readonly label: string;
}

export function toAppliedFilterChips(
  filters: AdminAuditFilters | undefined,
  fallbackLimit: string,
): AppliedFilterChip[];
```

- 入力: `filters`（API の `appliedFilters`。undefined あり）/ `fallbackLimit`（UI 側 limit 文字列。チップ未生成時の「直近N件」表示に UI が使う。本関数では limit チップ生成にのみ参照）。
- 出力: `AppliedFilterChip[]`。全フィールド未指定（or undefined）なら `[]`（UI 側で「なし（直近 N 件）」を表示）。
- 副作用なし・例外を投げない（[WEEKGRD-02]）。不正 ISO は `new Date()` 不能でも throw せず元文字列のまま label に使う。
- 生成順序（key 一意・固定）: `action` → `actorEmail` → `targetType` → `targetId` → `period`（from/to を1チップに集約）→ `batchId` → `limit`。
- `cursor` はチップ化しない（ページング内部値）。
- 期間 label 規則:
  - from と to 両方 → `期間 {fromDate}〜{toDate}`
  - from のみ → `期間 {fromDate} 以降`
  - to のみ → `期間 {toDate} まで`
  - 日付整形は `YYYY-MM-DD` まで（時刻は省略可。JST 表記は UI 任せでよいが label は date 部分でよい）。実装では ISO 先頭10文字 `slice(0,10)` を fallback とし、`new Date` 可なら整形してもよい（throw 禁止）。

### 2-2. `AuditLogCard.tsx`（新規・presentational）

シグネチャ:

```tsx
import type { AdminAuditListItem } from "../../lib/admin/types";
export function AuditLogCard({ item }: { readonly item: AdminAuditListItem }): JSX.Element;
```

- internal state なし。external props（`item`）のみ。
- `AuditLogPanel.tsx` から **既存 exported 純関数を import 再利用**: `maskAuditText` / `extractBatchId` / `maskAuditJson` / `summarizeAuditJson` / `formatJst`。`BatchIdCopyButton` も再利用。
  - これらは `AuditLogPanel.tsx` で `export` 済み（行 52/70/81/87/125）。`AuditLogCard.tsx` から `import { maskAuditText, extractBatchId, maskAuditJson, summarizeAuditJson, formatJst } from "./AuditLogPanel";` で参照。**シグネチャは変更しない**（AC-7）。
- カード構造（shared-context §5-1）:
  - ルート `<li className="admin-audit-card" data-testid="audit-log-card">`。
  - `.admin-audit-card__head`: `<time dateTime={item.createdAt}>{formatJst(item.createdAt)}</time>` + action バッジ `<Chip tone="info">{item.action}</Chip>`。
  - 実行者行: `実行者: {actorLabel}`。`const masked = maskAuditText(item.actorEmail, "actorEmail"); const actorLabel = masked === "system" ? "システム" : masked;`（actor=null → 「システム」）。
  - 対象行: `対象: {item.targetType ?? "—"} / {item.targetId ?? "—"}`。
  - batchId 行: `const batchId = extractBatchId(item);` があれば `<p data-testid="audit-batch-id">バッチ: <code>{batchId}</code><BatchIdCopyButton batchId={batchId} /></p>`（既存 id 維持）。
  - 折りたたみ: **1つの `<details>`** に before/after を並置:
    ```tsx
    const beforeValue = item.maskedBefore ?? item.beforeJson ?? null;
    const afterValue = item.maskedAfter ?? item.afterJson ?? null;
    const summaryText = beforeValue === null && afterValue === null ? "変更内容: なし" : "変更内容を表示";
    ```
    `<details><summary>{summaryText}</summary>` の中に before / after それぞれ `<pre data-testid="before-json">` / `<pre data-testid="after-json">`（`maskAuditJson` でマスク + `summarizeAuditJson` の見出し）。**既存 `${label}-json` testid を維持**。
  - `item.parseError` があれば `<p role="note">JSON parse warning</p>`（既存挙動維持）。

### 2-3. `AuditLogPanel.tsx`（修正・主構造）

**Before→After 差分方針（具体行番号）**:

- **削除/置換**: 行 **276-304** の結果カード（`<Card>` 内 `admin-audit-table-scroll` テーブル + Pagination ブロック）を **カード型タイムラインへ置換**:
  ```tsx
  {items.length > 0 ? (
    <Card>
      {/* appliedFilters chips（Lane A 新規） */}
      <div className="admin-audit-applied-filters" data-testid="audit-applied-filters">
        <span>現在の絞り込み: </span>
        {chips.length > 0
          ? chips.map((c) => <Chip key={c.key} tone="stone">{c.label}</Chip>)
          : <span>なし（直近 {values.limit ?? "50"} 件を新しい順に表示）</span>}
      </div>
      <ol className="admin-audit-timeline" aria-label="監査ログ一覧">
        {items.map((item) => <AuditLogCard key={item.auditId} item={item} />)}
      </ol>
      <Pagination current={1} hasPrev={false}
        hasNext={Boolean(data?.nextCursor)}
        nextHref={data?.nextCursor ? buildAuditHref(values, data.nextCursor) : undefined}
        nextLabel="次のページ" />
      {!data?.nextCursor ? <span>次のページはありません</span> : null}
    </Card>
  ) : null}
  ```
  ここで `const chips = toAppliedFilterChips(data?.appliedFilters, values.limit ?? "50");`（関数本体上部で算出）。
- **削除**: 行 **136-170** の `AuditRow`（テーブル行）。`AuditLogCard` へ移譲。
- **維持**: 行 112-134 の `JsonDisclosure` / `extractBatchId` は `AuditLogCard` が `JsonDisclosure` 相当を内包するか、もしくは `JsonDisclosure` を export して `AuditLogCard` から再利用してよい（実装簡略化のため `JsonDisclosure` を `AuditLogCard` 側へ移すか共有 export 化のいずれか。**`before-json`/`after-json` testid と summary 文言（`summarizeAuditJson`）は維持**）。
- **import 追加**: `import { Chip } from "../ui/Chip";`, `import { AuditLogCard } from "./AuditLogCard";`, `import { toAppliedFilterChips } from "./auditAppliedFilters";`。
- **既存 exported 純関数のシグネチャは不変**（AC-7）。`AuditRow` 削除に伴い `JsonDisclosure`/`extractBatchId` を `AuditLogCard` から使えるよう `export`（`extractBatchId` は既に export 済み）。
- 入力: `data` / `values` / `error` / `showHeading`（既存 props 不変）。出力: JSX。副作用なし。

### 2-4. globals.css（Lane A 分・§5 共通で 2-3 と統合記述）

§4（Lane A/B 共通）にまとめて記述。

---

## 3. Lane B — 目的・用語ガイド + エラー親切化 + datalist 拡充

### 3-0. Lane A/B の AuditLogPanel.tsx 競合回避手順（必須）

- **Lane A が `AuditLogPanel.tsx` の構造の最終統合責任を持つ**（カード化・appliedFilters 配置）。
- **Lane B は新規3ファイル（`AuditPurposeGuide.tsx` / `auditGlossary.ts` / `auditErrorMessage.ts`）を先に作る**。`AuditLogPanel.tsx` 本体は触らず、差し込み位置だけを本仕様で定義する。
- 統合は **Lane A → Lane B の順、または同一担当が一括統合**。並行で同一ファイルを編集しない。
- `AuditLogPanel.tsx` への Lane B 差し込み位置:
  1. **guide（最上部・常時表示）**: `<section data-component="admin-audit">` 直下、`showHeading` ヘッダーの直後・フィルタ `<Card>`（行 196）の**前**に `<AuditPurposeGuide />` を挿入。error の有無に関わらず常時描画（AC-3）。
  2. **error 親切化**: 行 **262-271** の Banner ブロックを `auditErrorMessage` 経由へ置換:
     ```tsx
     {error ? (() => {
       const view = toAuditErrorView(error);
       return (
         <Banner tone="warning">
           <p>{view.title}</p>
           {view.hint ? <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">{view.hint}</p> : null}
         </Banner>
       );
     })() : null}
     ```
     既存の `error.includes("404")` ハードコード hint（行 265-269）は `toAuditErrorView` 内へ集約し削除。
  3. **datalist 拡充**: 行 210-213 の `audit-action-presets` を `AUDIT_ACTION_PRESETS` から map 生成。targetType（行 217-219）に新規 datalist（id 例 `audit-target-type-presets`）を `AUDIT_TARGET_TYPE_PRESETS` から付与し、`<Input ... list="audit-target-type-presets" />`。

### 3-1. `auditGlossary.ts`（新規・純データ SSOT）

```ts
export interface AuditGlossaryEntry {
  readonly term: string;
  readonly plain: string;
  readonly technical: string;
}
export const AUDIT_GLOSSARY: readonly AuditGlossaryEntry[];      // 5語: action/actor/target/batchId/PII
export const AUDIT_ACTION_PRESETS: readonly string[];
export const AUDIT_TARGET_TYPE_PRESETS: readonly string[];
```

- `AUDIT_GLOSSARY`（やさしい日本語=plain 主・技術名=technical 併記）の5エントリ:
  - `action`: plain「どんな操作をしたか（操作の種類）」 / technical「action」
  - `actor`: plain「操作した人（実行者）」 / technical「actorEmail」
  - `target`: plain「操作の対象（誰の・どのデータ）」 / technical「targetType / targetId」
  - `batchId`: plain「一括処理をまとめる目印（同じ作業の塊）」 / technical「batchId」
  - `PII`: plain「個人情報は自動で伏せ字になります」 / technical「PII redaction」
- `AUDIT_ACTION_PRESETS`（調査で確認した実 action から代表値を採用。datalist 補助。網羅でなくてよい）:
  `["attendance.add", "attendance.remove", "identity.merge", "identity.dismiss", "admin.member.tag_assigned", "admin.member.tag_unassigned", "admin.member.status_updated", "admin.tag.created", "admin.request.approve", "admin.meeting.created"]`
- `AUDIT_TARGET_TYPE_PRESETS`: `["meeting", "member", "admin_member_note", "tag"]`
- 純データ・副作用なし。Lane A/B どちらからも import 可。

### 3-2. `auditErrorMessage.ts`（新規・純関数）

```ts
export interface AuditErrorView {
  readonly title: string;
  readonly hint?: string;
}
export function toAuditErrorView(error: string): AuditErrorView;
```

- 入力: API エラー文字列。出力: `{ title, hint? }`。例外なし。
- 分岐（優先順）:
  - `error.includes("404")` → title「監査ログを読み込めませんでした（404）」, hint「API endpoint への疎通、staging deploy 状態、admin 認可を確認してください。」（既存 hint を集約）。
  - date range（`/from/i.test(error) && /(before|range|to)/i.test(error)` 等で from>to を検出）→ hint「期間の指定（from / to）の前後を確認してください。from は to より前の日時にしてください。」
  - cursor（`/cursor/i`）→ hint「ページ位置（cursor）が無効です。リセットして最初のページから絞り込み直してください。」
  - generic → title「監査ログを読み込めませんでした: {error}」, hint 省略 or 汎用「時間をおいて再読み込みするか、絞り込み条件を変えて試してください。」
- `title` は必ず返す（防御）。空文字入力でも generic。

### 3-3. `AuditPurposeGuide.tsx`（新規・presentational・静的）

```tsx
import { AUDIT_GLOSSARY } from "./auditGlossary";
export function AuditPurposeGuide(): JSX.Element;   // props なし・internal state なし
```

- `<section className="admin-audit-purpose" data-component="audit-purpose-guide" aria-label="この画面の説明">`。
- 「■ この画面でできること」見出し + 1〜2行の目的説明（誰がいつ何をしたかの記録を、PII を伏せた形で絞り込み参照できる）。
- 用語ガイド: `<ul data-testid="audit-glossary">` に `AUDIT_GLOSSARY.map((e) => <li key={e.term}><strong>{e.plain}</strong>（{e.technical}）</li>)`（plain 主・technical 併記）。
- 常時表示（result.ok 内外問わず・Panel 最上部）。

---

## 4. CSS 実装手順（globals.css `@layer components` 末尾）

- 追記場所: `globals.css` の `@layer components { ... }` の**閉じ `}` の直前**（現状ファイル末尾の admin sidebar media query ブロックの後、layer 閉じ括弧の前）。既存 `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table`（行 1602-1618）はそのまま残置（OOS-4 で参照確認後判定）。
- 追加クラス（`var(--ubm-*)` / `color-mix(in oklch, ...)` のみ・**HEX 禁止** AC-9）:
  - `.admin-audit-timeline` — `display: flex; flex-direction: column; gap: var(--ubm-space-3); list-style: none; padding: 0; margin: 0;`
  - `.admin-audit-card` — `border: 1px solid var(--ubm-color-border-default); border-radius: var(--ubm-radius-md|既存トークン); padding: var(--ubm-space-4); background: var(--ubm-color-surface-panel);`（radius は tokens.css の既存 `--ubm-radius-*` を使用。無ければ既存カードに準拠）
  - `.admin-audit-card__head` — `display: flex; align-items: center; justify-content: space-between; gap: var(--ubm-space-2); flex-wrap: wrap;`
  - `.admin-audit-applied-filters` — `display: flex; align-items: center; flex-wrap: wrap; gap: var(--ubm-space-2); margin-bottom: var(--ubm-space-3);`
  - `.admin-audit-purpose` — `border: 1px solid var(--ubm-color-border-default); border-radius: var(--ubm-radius-md|既存); padding: var(--ubm-space-4); background: color-mix(in oklch, var(--ubm-color-info-soft) 60%, var(--ubm-color-surface-panel));`
- 使用前に `tokens.css` で実在する変数名を grep 確認（`--ubm-color-border-default` / `--ubm-color-surface-panel` / `--ubm-color-info-soft` / `--ubm-space-2|3|4` は確認済み。`--ubm-radius-*` は実在トークンを確認のうえ使用、無ければ既存 Card の radius 指定に倣う）。

---

## 5. Lane C — reduce エラー根絶 + 回帰 spec

### 5-0. reduce 真因確認手順（冒頭で必須実施）

実装着手の最初に、防御ガード(a) を入れる前提で**真因(b) を照合**する:

1. `apps/web/src/lib/admin/safe-server-fetch.ts` の戻り値型を確認 → `SafeResult<T>`（`{ ok: true; data: T } | { ok: false; error }`、`result.ts` 確認済み）。`result.ok` のとき `result.data` は `T`（= `TagCatalogListView`）型だが、**API レスポンスが実際に `{ total, items }` shape を返すか**を照合する。
2. `/admin/tags?page=&pageSize=` の実レスポンス shape を `apps/api/src/routes/admin/tags.ts` で確認:
   - **`{ total, items }` で正しい場合** → 空レスポンス/malformed 時のみ `items` undefined になりうる。防御ガード(a) のみで根治。`page.tsx` の adapter 変更は不要。
   - **shape 不整合の場合**（配列直返し / `{ data: {...} }` ラップ等）→ `app/(admin)/admin/tags/catalog/page.tsx` の `safeServerFetch<TagCatalogListView>` 受領後に正規化 adapter（`const initial = { total: result.data?.total ?? 0, items: result.data?.items ?? [] }`）を `page.tsx` に追加し、その上で `TagCatalogPanel` へ渡す。
3. **いずれの場合も防御ガード(a) は無条件で入れる**（恒久的価値）。真因(b) が shape 不整合だった場合のみ page.tsx も是正する。

### 5-1. `TagCatalogPanel.tsx`（修正・防御ガード）

**Before→After 差分方針（具体行番号）**:

- 行 **44** `const [items, setItems] = useState(initial.items);`
  → 防御化:
  ```tsx
  const safeItems = initial?.items ?? [];
  const safeTotal = initial?.total ?? 0;
  const [items, setItems] = useState<TagDefinitionItem[]>(safeItems);
  ```
- 行 **69-80** `counts` useMemo は `items`（空配列で安全）を使うため変更不要（`items` が常に配列になるため `reduce` が undefined を踏まない）。
- 行 **164** `<Chip tone="warm">全体 {initial.total}件</Chip>` → `<Chip tone="warm">全体 {safeTotal}件</Chip>`。
- 行 **205** `Math.ceil(initial.total / pageSize)` → `Math.ceil(safeTotal / pageSize)`。
- 行 **210** `page * pageSize >= initial.total` → `page * pageSize >= safeTotal`。
- 入力: props `initial`（undefined / 部分 undefined を許容）。出力: クラッシュしない描画。副作用: なし（既存 mutation は不変）。
- 型注意: `initial?.items` は型上 `TagDefinitionItem[]`。テストは `as` キャストで undefined を注入する（4-5 参照）。実 props 型 `TagCatalogListView` は不変（`{ total, items }`）。

### 5-2. `catalog/page.tsx`（修正・真因が shape 不整合の場合のみ）

5-0 の照合で shape 不整合と判明した場合のみ、`result.ok` ブロックで正規化:
```tsx
const initial: TagCatalogListView = {
  total: result.data?.total ?? 0,
  items: result.data?.items ?? [],
};
// <TagCatalogPanel initial={initial} ... />
```
shape が正しければ本ファイルは非変更。

### 5-3. `TagCatalogPanel.reduce-guard.spec.tsx`（新規・回帰）

Phase 4 §4-5 のケース（T-TCG-01〜04）を実装。`next/navigation` モック必須。`vi.stubGlobal("window")` 禁止。

---

## 6. 統合順序（推奨）

1. Lane A 新規（`auditAppliedFilters.ts` / `AuditLogCard.tsx`）+ spec → RED→GREEN。
2. Lane B 新規（`auditGlossary.ts` / `auditErrorMessage.ts` / `AuditPurposeGuide.tsx`）+ spec → RED→GREEN。
3. `AuditLogPanel.tsx` を Lane A→B の順で統合（カード化 + guide/error/datalist 差し込み）。既存 `AuditLogPanel.component.spec.tsx` を新仕様へ調整（意図保持）。
4. globals.css 追記。
5. Lane C（真因照合 → 防御ガード → 回帰 spec）。
6. §7 検証コマンドを全て緑にする。

---

## 7. DoD（Definition of Done）

| 項目 | 判定基準 |
|------|---------|
| typecheck | `mise exec -- pnpm typecheck` 緑 |
| lint | `mise exec -- pnpm lint` 緑 |
| design token | `mise exec -- pnpm verify:tokens` 緑（HEX 直書きゼロ・AC-9） |
| 対象 vitest | Phase 4 §6 の6 spec が全 PASS（AC-1〜7, 10） |
| 既存テスト維持 | `AuditLogPanel.component.spec` の純関数 describe 群が無改変で PASS（AC-7） |
| apps/api 非変更 | `git diff --name-only -- apps/api` が空（AC-8） |
| AC 全充足 | AC-1〜AC-10 を §マトリクス（Phase 4 §3）で確認 |
| カード描画 | `/admin/audit` の結果が `audit-log-card` タイムライン + `audit-applied-filters` + `audit-purpose-guide` で描画される（AC-1/2/3） |
| reduce 根絶 | `initial.items`/`initial`/`initial.total` undefined でクラッシュしない（AC-6） |

> commit / push / PR / staging deploy / screenshot 実撮影は **user-gated（Phase 13）**。本 Phase では実行しない。
