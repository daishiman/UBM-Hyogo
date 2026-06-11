# 実装ガイド — admin-audit-log-ux-clarity-and-reduce-error-fix

本ガイドは「監査ログ `/admin/audit` UI/UX 情報設計刷新 + catalog reduce エラー根絶」タスクの実装ガイドである。
Part 1（初学者・中学生レベル）と Part 2（開発者・技術者レベル）の 2 部構成に視覚証跡セクションを加えて記す。
本タスクは `implemented_local_evidence_captured` であり、`apps/web` の実コード差分・focused vitest・pixel screenshot は **本サイクルで実装**する。
Part 2 末尾の検証コマンドは本サイクル で実行する（本 spec 作成 wave では実行しない）。

---

## Part 1: やさしい説明（中学生レベル）

### なぜ必要か（先に「困りごと」から）

学校の「事務室の出来事ノート」を想像してください。先生が「誰が・いつ・何を変えたか」を記録するノートです。
本来なら、1 件ずつ「6月9日 21時52分、A先生が、たかし君の名簿を直しました」のようにカードで読めるはずです。
ところが今のノートは、細かい字がぎっしり詰まった**大きな表**になっていて、しかも見出しが「action」「actor」「target」みたいな
英語ばかり。読む人は「これは何のノート？」「今どの条件でしぼり込んで見せているの？」「この行は結局誰が何をしたの？」が
さっぱり分かりません。せっかくの記録なのに「読めない」ので、まず見た目を整え、言葉の意味を分かるようにする必要があります。

もう 1 つ、別の教室（タグの一覧の画面）で「材料が空っぽのときに料理を始めようとして失敗する」バグがあります。
このバグの「失敗しました！」という赤いお知らせが、なぜか**となりの教室（監査ログの画面）にも漏れて貼り出されて**しまい、
見ている人をびっくりさせています。これも一緒に直します。

### 何が困っているか（3 つの困りごと）

1. **何のノートか分からない**: 画面に「このノートは何のためか」「英語の言葉（action=操作の種類、actor=やった人、target=された対象、
   batchId=まとめて処理した番号、PII=個人情報は自動でかくす）が何を意味するか」の説明が一切ありません。
2. **どうしぼり込んでいるか見えない**: 「今は『たかし君の名簿変更だけ』『6月の分だけ』を見せています」という**しぼり込みの札（ふだ）**が
   どこにも出ていません。実はその情報はノートの裏（プログラム）には用意されているのに、表に出していないだけでした。
3. **空っぽのとき失敗して、よその画面に赤いエラーが漏れる**: タグ一覧の画面が「材料ゼロ」のときに数えようとして転びます（reduce エラー）。
   その転んだお知らせが管理画面全体の共通の受け皿に落ちるので、別の画面（監査ログ）を見ていても赤いエラーが出ます。

### 何をするか（出来事ノートをカードに貼り替える例え）

文化祭で出来事を紹介するとき、ぎっしりの表ではなく、1 件ずつ「日付・やった人・何をしたか」を書いた**カード**を
上から順番に並べると、ぐっと読みやすくなりますよね。このタスクでやるのは、まさにその「表をカードに貼り替えて、
やさしい説明と『今のしぼり込み』の札を上に付ける」作業です。

- **カードで並べる**: 1 件の記録 = 1 枚のカード。「いつ／だれが／何を（操作の種類の色札）／対象／まとめ番号／▸ 中身を見る」を
  上から下にそろえて書きます。before（前）と after（後）は 1 つの折りたたみにまとめます。
- **しぼり込みの札を上に出す**: 「今は action=たかし君の名簿変更、期間=6月1日〜6月9日、件数=50 を見せています」という札（チップ）を
  カードの上に並べます。何もしぼっていないときは「なし（新しい順に直近 50 件）」と出します。
- **やさしい説明と用語ガイドをいつも出す**: 「この画面でできること」と「英語の言葉の意味」を、画面のいちばん上に**いつも**出します。
- **エラーを親切な言葉に直す**: 「404」みたいな数字のエラーを「つながらないようです。○○を確認してください」のように、
  やさしい日本語 + どうすればいいかのヒントに直します。
- **空っぽでも転ばないようにする**: タグ一覧の画面が「材料ゼロ」でも、転ばずに「データがありません」と静かに表示するようにします。
  これで別の画面に赤いエラーが漏れることもなくなります。

### どこまでやるか（やること・やらないこと）

今回やるのは、あくまで「見た目を整える・言葉を分かりやすくする・転ばないようにする」ところまでです。
ノートの裏側（プログラムが記録を作るしくみ・データベース・アンケートのしくみ）は**一切さわりません**。
「全部で何件あるか」を出す機能や、「ファイルに書き出す」機能は、裏側を変えないと作れないので、今回は別の宿題（別タスク）に
切り分けてあります。だから今回は「いまある情報を、読めるように見せ直す」ことに集中します。

### 専門用語セルフチェック

| 専門用語の例 | 日常語への言い換え例 |
| --- | --- |
| 監査ログ（audit log） | 「誰が・いつ・何を変えたかを記録した『出来事ノート』」 |
| appliedFilters | 「今かけているしぼり込みの条件（札）」 |
| カード型タイムライン | 「1 件ずつカードにして、新しい順に上から並べた見せ方」 |
| reduce（リデュース） | 「並んだ数を 1 つずつ足していって合計を出す処理。材料ゼロだと失敗しやすい」 |
| 防御ガード | 「材料が空っぽでも転ばないようにする『安全のおまじない』」 |
| トークン（デザイントークン） | 「色や余白を決める『共通の色見本・物差し』」 |

---

## Part 2: 技術詳細（開発者レベル）

### 全体方針

- **`apps/web` 表現層完結の UI/UX 是正 + 防御ガード**。新しい API endpoint / D1 schema / Google Form schema / fetch URL は一切追加・変更しない（不変条件 #1 #4、AC-8）。
- 案件1（情報設計）の真因: `appliedFilters` は型（`apps/web/src/lib/admin/types.ts:30`）・API（`apps/api/src/routes/admin/audit.ts:30-51`）の両方に既存だが **UI（AuditLogPanel）が未表示**。結果が 4 列テーブルで過密。目的説明・用語ガイドが皆無。
- 案件2（reduce）の真因: `TagCatalogPanel.tsx:44/69-80/164/205/210` が props 防御ガードを欠き、`safeServerFetch` の `result.data` が期待 shape（`{total, items}`）でないとき `items.reduce(...)` で `Cannot read properties of undefined (reading 'reduce')` を throw。admin 共通 error boundary（scope: admin）で別画面でも表面化。
- 既存 primitive（`Card` / `Chip` / `Banner` / `EmptyState` / `FormField` / `Button` / `Pagination` / `BatchIdCopyButton`）を再利用し、新 primitive / 新トークンを生やさない（不変条件 #2 #3）。
- 色は `var(--ubm-color-*)` 経由のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` の新規追加なし（AC-9、`verify:tokens` gate）。
- 既存 exported 純関数（`maskAuditJson` / `summarizeAuditJson` / `formatJst` / `maskAuditText` / `buildAuditHref` / `extractBatchId`）のシグネチャと既存テストを維持（AC-7）。既存 `data-testid` 等の機械可読 id は維持し、新規要素のみ新規 id（不変条件 #8）。

### 型定義・関数シグネチャ（新規 export はすべて apps/web 内部の表示用）

```ts
// auditAppliedFilters.ts（Lane A・純関数）
export interface AppliedFilterChip {
  readonly key: string;
  readonly label: string;
}
// 未指定（全フィールド空）のとき [] を返し、UI 側で「なし（直近 N 件）」を表示。例外を投げない（防御的返却）。
export function toAppliedFilterChips(
  filters: AdminAuditFilters | undefined,
  fallbackLimit: string,
): AppliedFilterChip[];
```

```tsx
// AuditLogCard.tsx（Lane A・presentational・internal state なし）
export function AuditLogCard({ item }: { readonly item: AdminAuditListItem }): JSX.Element;
// 内部で既存 maskAuditText / extractBatchId / maskAuditJson / summarizeAuditJson / formatJst を再利用。
// before/after を 1 つの <details> に集約。actorEmail=null は「システム」、targetType/targetId=null は「—」。
```

```ts
// auditGlossary.ts（Lane B・純データ SSOT）
export interface AuditGlossaryEntry {
  readonly term: string;
  readonly plain: string;      // やさしい日本語（主）
  readonly technical: string;  // 技術名（併記）
}
export const AUDIT_GLOSSARY: readonly AuditGlossaryEntry[];        // action/actor/target/batchId/PII
export const AUDIT_ACTION_PRESETS: readonly string[];             // datalist: attendance.add, identity.merge, identity.dismiss …
export const AUDIT_TARGET_TYPE_PRESETS: readonly string[];        // datalist: meeting, admin_member_note …
```

```ts
// auditErrorMessage.ts（Lane B・純関数）
export interface AuditErrorView {
  readonly title: string;
  readonly hint?: string;
}
export function toAuditErrorView(error: string): AuditErrorView;
// 404 → 疎通/deploy/認可ヒント, from>to の期間 → 期間の前後ヒント, cursor → リセット誘導, それ以外 → generic。例外を投げない。
```

```tsx
// AuditPurposeGuide.tsx（Lane B・presentational・props なし・静的）
export function AuditPurposeGuide(): JSX.Element;   // AUDIT_GLOSSARY を <section aria-label="この画面の説明"> で描画
```

```tsx
// TagCatalogPanel.tsx（Lane C・編集・防御ガード）
const safeItems = initial?.items ?? [];
const safeTotal = initial?.total ?? 0;
const [items, setItems] = useState<TagDefinitionItem[]>(safeItems);
// counts useMemo は items（空配列で安全）を畳む。pager 計算（Math.ceil(safeTotal / pageSize) 等）は safeTotal を使う。
```

### 想定変更 16 ファイルの Before → After 要約

| # | ファイル | 種別 | Before | After | AC |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | 4 列テーブル + before/after 2 個の `<JsonDisclosure>`。appliedFilters 未表示。404 hint をインライン記述 | カード型タイムライン（`<ol.admin-audit-timeline>` + `AuditLogCard`）。最上部に `AuditPurposeGuide` + appliedFilters チップ列。Banner は `toAuditErrorView` 経由。datalist 拡充 | AC-1/2/3/4/5 |
| 2 | `apps/web/src/components/admin/AuditLogCard.tsx` | 新規 | （不在） | 1 ログ = 1 カード。日時/実行者/action バッジ/対象/バッチ/▸変更内容（before→after 1 折りたたみ） | AC-1 |
| 3 | `apps/web/src/components/admin/auditAppliedFilters.ts` | 新規 | （不在） | `toAppliedFilterChips` 純関数 | AC-2 |
| 4 | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 新規 | （不在） | 目的説明 + 用語ガイド常時表示 | AC-3 |
| 5 | `apps/web/src/components/admin/auditGlossary.ts` | 新規 | （不在） | 用語 SSOT + datalist プリセット | AC-3/5 |
| 6 | `apps/web/src/components/admin/auditErrorMessage.ts` | 新規 | （不在） | `toAuditErrorView` 純関数 | AC-4 |
| 7 | `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | header + AuditLogPanel | guide 配置位置整合（最上部・常時表示） | AC-3 |
| 8 | `apps/web/src/components/admin/TagCatalogPanel.tsx` | 編集 | `initial.items` 等を防御なしで参照 → `reduce` クラッシュ | `initial?.items ?? []` / `?? 0` で防御 | AC-6 |
| 9 | `apps/web/app/(admin)/admin/tags/catalog/page.tsx` | 編集（shape 不整合時のみ） | `safeServerFetch` 戻りを `initial` で渡す | shape 不整合判明時は adapter 正規化 | AC-6 |
| 10 | `apps/web/src/styles/globals.css` | 編集 | `.admin-audit-table*` のみ | `@layer components` 末尾に `.admin-audit-timeline` / `.admin-audit-card` / `.admin-audit-applied-filters` / `.admin-audit-purpose` 追記 | AC-1/9 |
| 11 | `__tests__/AuditLogCard.spec.tsx` | 新規 | （不在） | カード DOM 構造・null 分岐・折りたたみ | AC-1 |
| 12 | `__tests__/auditAppliedFilters.spec.ts` | 新規 | （不在） | input→output 表駆動（未指定 []・from/to 片側・limit） | AC-2 |
| 13 | `__tests__/AuditPurposeGuide.spec.tsx` | 新規 | （不在） | guide / glossary DOM 文言 | AC-3 |
| 14 | `__tests__/auditErrorMessage.spec.ts` | 新規 | （不在） | 404/date range/cursor/generic 分岐 | AC-4 |
| 15 | `__tests__/TagCatalogPanel.reduce-guard.spec.tsx` | 新規 | （不在） | `initial.items`/`initial`/`initial.total` undefined でクラッシュなし空表示 | AC-6 |
| 16 | `__tests__/AuditLogPanel.component.spec.tsx` | 編集 | テーブル DOM 依存 | カード DOM へ最小調整（mask/href/empty/404 の意図は保持） | AC-7 |

### CSS 配置（globals.css `@layer components` 末尾追加・HEX 禁止）

- 配置: `apps/web/src/styles/globals.css` の `@layer components { … }` 内末尾（既存 `.admin-audit-table*`（1602-1618）の後）。
- セレクタは `.admin-audit-*` 名前空間に限定。色・余白・角丸・影は `var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-radius-*)` / `color-mix(in oklch, ...)` のみ。`#rrggbb` / `bg-[#...]` / `text-[#...]` を新規に書かない（不変条件 #2、AC-9）。

```css
.admin-audit-timeline {
  display: flex;
  flex-direction: column;
  gap: var(--ubm-space-3);
  list-style: none;
}
.admin-audit-card {
  padding: var(--ubm-space-4);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-lg);
  background: var(--ubm-color-surface-panel);
}
.admin-audit-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ubm-space-2);
}
.admin-audit-applied-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ubm-space-2);
}
.admin-audit-purpose {
  padding: var(--ubm-space-4);
  border: 1px solid var(--ubm-color-border-subtle);
  border-radius: var(--ubm-radius-lg);
  background: color-mix(in oklch, var(--ubm-color-surface-panel) 92%, var(--ubm-color-accent));
}
```

> 上記は token 使用例。実値は本サイクル で `tokens.css` の存在トークン名に合わせて確定する（不存在トークンは使わない。`verify:tokens` で gate）。

### エラーハンドリング・エッジケース

| ケース | 期待挙動 | 担保 |
| --- | --- | --- |
| `appliedFilters` undefined | チップ列「なし（直近 N 件）」 | `toAppliedFilterChips` が `[]` を返し UI が fallback 文言 |
| `from` のみ / `to` のみ 指定 | 期間チップを「2026-06-01 以降」「2026-06-09 まで」 | `toAppliedFilterChips` の片側分岐 |
| `actorEmail = null`（system 操作） | カードに「実行者: システム」 | `AuditLogCard` の null 分岐 |
| `targetType`/`targetId = null` | 「対象: —」 | `AuditLogCard` の null 分岐 |
| `before`/`after` 両方 null | 折りたたみ summary「変更内容: なし」 | `AuditLogCard` + 既存 `summarizeAuditJson` |
| API error が 404 含む | title + 疎通/deploy/認可ヒント | `toAuditErrorView` の 404 分岐（既存 inline hint を集約） |
| API error が `from`>`to` | 期間の前後ヒント | `toAuditErrorView` の date range 分岐 |
| invalid cursor | cursor リセット誘導 | `toAuditErrorView` の cursor 分岐 |
| `initial.items` undefined（catalog） | 空配列・EmptyState・クラッシュなし | `initial?.items ?? []` 防御ガード |
| `initial` 自体 undefined（catalog） | 同上 | optional chaining |
| reduce 真因が shape 不整合だった場合 | 防御ガード(a)に加え page.tsx で adapter 正規化(b) | 実装 Phase 1 冒頭で `safeServerFetch`/`/admin/tags` レスポンス shape を実照合 |

### 検証コマンド（本サイクル で実行）

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
# API 非変更（AC-8）
git diff --name-only -- apps/api   # 空であること
```

> 本タスクは `implemented_local_evidence_captured`。上記 focused vitest / typecheck / lint / verify:tokens は **本サイクルで実行済み**し、結果を Phase 11 evidence と documentation-changelog へ転記する。

---

## 視覚証跡（VISUAL・capture runtime_pending）

本タスクは VISUAL だが `implemented_local_evidence_captured` のため、pixel screenshot は本サイクル で取得する。spec 作成時点では実 PNG なし。

| TC | 対象 AC | 配置先 | 状態 |
| --- | --- | --- | --- |
| TC-11-1 | AC-1 カード型タイムライン全景 | `outputs/phase-11/screenshots/TC-11-1-audit-timeline-desktop.png` | `pending`（capture runtime_pending） |
| TC-11-2 | AC-3 目的・用語ガイド | `outputs/phase-11/screenshots/TC-11-2-audit-purpose-guide.png` | `pending` |
| TC-11-3 | AC-4 エラー Banner | `outputs/phase-11/screenshots/TC-11-3-audit-error-banner.png` | `pending` |
| TC-11-4 | AC-6 catalog 空表示（reduce ガード） | `outputs/phase-11/screenshots/TC-11-4-catalog-empty-guard.png` | `pending` |

- `outputs/phase-11/screenshots/.gitkeep` で空ディレクトリを維持。実 PNG は本サイクル で追加し `screenshot-inventory.json` の status を `present` へ更新する。
- staging 認証済み baseline は user-gated runtime artifact のため別途ユーザー承認後に取得する。
- jsdom で確認できない CSS の効きは local fixture screenshot で、それ以外（DOM 構造・文言・純関数 input→output）は focused vitest 6本で担保する（`phase-11-manual-test.md` §4）。
