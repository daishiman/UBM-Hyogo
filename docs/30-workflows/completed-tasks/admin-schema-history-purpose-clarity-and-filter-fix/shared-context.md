# shared-context.md — SSOT（admin-schema-history-purpose-clarity-and-filter-fix）

> 本ファイルは全 Phase 仕様書（phase-1〜13）と outputs/ 成果物が参照する単一の正本（Single Source Of Truth）。
> Phase 仕様書作成 SubAgent は本ファイルの「対象ファイル一覧」「関数シグネチャ」「Lane 定義」「AC」「DoD」を逐語で踏襲すること。
> 矛盾が生じた場合は本ファイルが優先する。

---

## 0. メタ情報

| 項目 | 値 |
|------|-----|
| slug | `admin-schema-history-purpose-clarity-and-filter-fix` |
| 出力先 | `docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/` |
| branch | `feat/admin-schema-history-purpose-and-filter-fix` |
| base | `origin/dev`（tip `21b64ef2a` に整合済み） |
| 実装区分 | **実装仕様書**（CONST_005 必須項目すべて含む / CONST_007 1サイクル完了スコープ） |
| status / workflow_state | `implemented_local_evidence_captured`（apps/web 実装・focused evidence・local screenshot 完了。staging deploy / authenticated screenshot / commit / PR は user-gated） |
| task_type | `implementation` |
| visual_category | `VISUAL`（admin UI 改修。local deterministic evidence と local screenshot 2 点は取得済み、staging authenticated screenshot 2 点は user-gated pending） |
| relatedIssue | null（staging 観察起点・ユーザー報告 2026-06-09） |

---

## 1. 対象画面とユーザー報告

- 画面: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/schema/history`（「alias resolve 履歴」）
- ユーザー報告（2026-06-09 19:38 staging スクリーンショット + DevTools）:
  1. 「この画面は何をするところか分からない。何を解決・解消した結果を見るのか。フォームスキーマの履歴を見るのか用途が不明瞭」
  2. 「レイアウトが崩れている」
  3. 「絞り込みっていうところで JSON データが下部に配置されている」
     → 画面下部に `[ { "code": "unrecognized_keys", "keys": [ "batchId" ], "path": [ "appliedFilters" ], "message": "Unrecognized key: \"batchId\"" } ]` が raw 表示

---

## 2. 真因（調査確定・3 観点統合）

> いずれも **apps/web 表現層 / adapter 層**に起因。**apps/api・D1・Google Form は無罪・既存 surface のまま修正可能**。

| ID | 課題 | 真因 | 担当 Lane |
|----|------|------|-----------|
| RC-1 | 絞り込みで `batchId` JSON エラー（機能バグ・最重要） | `apps/web/src/lib/admin/api.ts` の `AppliedFiltersZ`（行 582-592）が `.strict()` で定義され `batchId` フィールドを欠く。API 側 `apps/api/src/routes/admin/audit.ts` は issue-1079/1128/1129 で response の `appliedFilters.batchId`（query 未指定時 `null`）を返すようになった。web 側 `SchemaAliasHistoryResponseZ.parse(projected)`（api.ts 行 704）が `batchId` を `unrecognized_keys` で reject し ZodError を throw する | A |
| RC-2 | raw JSON が画面下部に表示（脆弱なエラー表示） | `SchemaDiffHistoryPanel.tsx` 行 80-81 で `setError(e instanceof Error ? e.message : ...)`。ZodError は `Error` サブクラスで `e.message` が JSON 配列文字列。行 185 `{error ? <p role="alert">{error}</p> : null}` がそのまま raw JSON を描画。`<p role="alert">` には CSS クラスが一切なく（globals.css にエラー alert スタイル無し）レイアウトが崩れる | B |
| RC-3 | 用途不明瞭（情報設計欠如） | タイトル「alias resolve 履歴」+ 説明「過去の解消結果を audit 経由で閲覧」だけでは、画面の目的・使いどころ・得られる情報が伝わらない。実体は「Google フォームの設問が変更されたとき、新旧スキーマを照合して `stableKey` を紐付けた（alias resolve した）操作の履歴 = 誰がいつどの設問をどの stableKey に解決したか」。機能は完成済みで情報設計のみ欠如 | C |
| RC-4 | 履歴の表示形式がプロトタイプと乖離 | 現行は素の `<table>`。プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` `SchemaDiffPage`（L633-652）の「ALIAS HISTORY」はカード形式（stableKey + 旧→新 question + 日時・実行者）。デザイン言語の正本と不整合 | D |

### batchId 混入の経緯（参考・修正対象外）
- `6e7b3e344`（issue-1079）: admin/audit generic endpoint に `batchId` query + `appliedFilters.batchId` 返却を追加
- `963e7e914`（issue-1129）: 単一 tag write の audit payload に `batchId` 相関キーを付与
- `c4b48aa44`（issue-1128）: `audit_log.batch_id` を VIRTUAL generated column 化し index 検索を最適化
- → schema alias history（issue-777）は generic audit endpoint を再利用するため、batchId が `appliedFilters` に副作用的に現れる。web 側 zod が追従していないのが不整合の発生源。

---

## 3. AskUser 確定事項（2026-06-09）

| Q | 確定 |
|---|------|
| Q1 用途明確化の厚み | **目的説明UIを追加**（先例 `admin-schema-page-purpose-clarity-ux` 同型。画面冒頭に「何の画面か・何を解決した記録か・何が分かるか」を平易な日本語で説明するパネル + 用語集。タイトル/説明文も平易化） |
| Q2 表示形式 | **プロトタイプのカード形式へ整合**（`pages-admin.jsx` ALIAS HISTORY カード準拠。OKLch token で整形。raw JSON エラーは human-readable な日本語メッセージへ変換） |
| Q3 batchId フィルタUI | **足さない・受理のみ**（web zod に `batchId` フィールドを追加してエラーを根治するのみ。履歴画面のフィルタUIは現状維持＝操作者 email / 期間 / question 部分一致） |

---

## 4. Lane 定義（CONST_007: 全 Lane を 1 実装サイクルで完了）

| Lane | 名称 | 責務 | 主対象 |
|------|------|------|--------|
| A | zod batchId 受理（機能バグ根治） | `AppliedFiltersZ` に `batchId: z.string().nullable()` を追加。`EMPTY_RESPONSE.appliedFilters` にも `batchId: null` を追加 | `api.ts`, `SchemaDiffHistoryPanel.tsx` |
| B | エラー表示の堅牢化 | ZodError / HTTP エラーを human-readable な日本語メッセージへ変換する純関数を新設し、panel の catch で使用。alert に OKLch token のスタイルクラスを付与 | `schemaHistoryError.ts`(新), `SchemaDiffHistoryPanel.tsx`, `globals.css` |
| C | 目的説明UI / 用途明確化 | 目的説明パネル + 用語集（純データ）を新設し panel 冒頭に組込。page のタイトル/説明文を平易化 | `SchemaHistoryPurposeExplainer.tsx`(新), `schemaHistoryGlossary.ts`(新), `history/page.tsx`, `SchemaDiffHistoryPanel.tsx` |
| D | 履歴カード表示整合 | 現行 `<table>` をプロトタイプ ALIAS HISTORY カード形式へ。OKLch token で整形 | `SchemaDiffHistoryPanel.tsx`, `globals.css` |
| E | 回帰テスト | batchId parse 回帰 / human-readable error / card 描画 / explainer 描画 / glossary を保護 | `__tests__/*.spec.{ts,tsx}` |

---

## 5. 対象ファイル一覧（implementation_targets）

### 新規作成（product 3 + spec 3 = 6）
| Path | Lane | 責務 |
|------|------|------|
| `apps/web/src/lib/admin/schemaHistoryError.ts` | B | `formatSchemaHistoryError(e: unknown): string` 純関数。raw JSON を出さず日本語メッセージへ |
| `apps/web/src/lib/admin/schemaHistoryGlossary.ts` | C | 用語集 + 流れステップの純データ（`schemaHistoryGlossary` / `schemaHistoryPurposeSteps`） |
| `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | C | 目的説明パネル component |
| `apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | E | explainer 回帰 spec |
| `apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts` | E | error formatter 純関数 unit |
| `apps/web/src/lib/admin/__tests__/api.spec.ts` | E | 既存 `fetchSchemaAliasHistory` spec に batchId parse 回帰を追加 |

> 新規 spec は `*.spec.{ts,tsx}` のみ（不変条件 #8）。

### 編集（5）
| Path | Lane | 変更 |
|------|------|------|
| `apps/web/src/lib/admin/api.ts` | A | (1) `AppliedFiltersZ`（行 582-592）に `batchId: z.string().nullable()` 追加。(2) `defaultAppliedFilters()`（行 623-633）にも `batchId: null` 追加（型 `SchemaAliasHistoryResponse["appliedFilters"]` に batchId が入るため、これを欠くと型エラー） |
| `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | A/B/C/D | `EMPTY_RESPONSE.appliedFilters` に `batchId: null`、catch で `formatSchemaHistoryError`、alert に class、explainer 組込、table→card |
| `apps/web/app/(admin)/admin/schema/history/page.tsx` | C | `AdminPageHeader` の title/description を平易化 |
| `apps/web/src/styles/globals.css` | B/D | `.schema-history-error`（alert）+ `.schema-history-card` 系スタイル（OKLch token のみ） |
| `apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx` | E | human-readable error / card 描画 / explainer 表示 回帰を追記 |

### 非接触（不変条件で保証）
- `apps/api/**`（API 無罪。`git diff origin/dev...HEAD -- apps/api` が空であること = AC）
- `apps/api/migrations/**`（D1 schema 不変）
- Google Form schema

---

## 6. 関数シグネチャ / データ構造

### Lane A — `apps/web/src/lib/admin/api.ts`
```ts
// 行 582-592 を以下へ（batchId 追加・順序は API audit.ts の appliedFilters に合わせ limit の前）
const AppliedFiltersZ = z
  .object({
    action: z.string().nullable(),
    actorEmail: z.string().nullable(),
    targetType: z.string().nullable(),
    targetId: z.string().nullable(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    batchId: z.string().nullable(), // ← 追加。API generic audit endpoint が返す相関キー。schema history では常に null
    limit: z.number(),
  })
  .strict();
```
> `.strict()` は維持する（想定外キーの早期検出を残す）。batchId だけを明示的に許容する最小修正。

```ts
// 行 623-633 の defaultAppliedFilters() にも batchId: null を追加（型整合・必須）
function defaultAppliedFilters(): SchemaAliasHistoryResponse["appliedFilters"] {
  return {
    action: SCHEMA_ALIAS_RESOLVE_ACTION,
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: null, // ← 追加。AppliedFiltersZ に batchId を入れると型に出るため、欠くと typecheck が落ちる
    limit: SCHEMA_ALIAS_HISTORY_LIMIT,
  };
}
```
> `normalizeAppliedFilters()`（行 635）は `...defaultAppliedFilters()` + 受信値 spread のため追加修正不要。`defaultAppliedFilters()` が batchId を持てば、API 未返却時も `null` で埋まる。

### Lane A — `SchemaDiffHistoryPanel.tsx` の `EMPTY_RESPONSE`（行 31-44）
```ts
const EMPTY_RESPONSE: SchemaAliasHistoryResponse = {
  ok: true,
  items: [],
  nextCursor: null,
  appliedFilters: {
    action: "schema_diff.alias_assigned",
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: null, // ← 追加（型 SchemaAliasHistoryResponse に整合）
    limit: 50,
  },
};
```

### Lane B — `apps/web/src/lib/admin/schemaHistoryError.ts`（新規）
```ts
import { ZodError } from "zod";

/**
 * 履歴取得時の例外を、画面表示に適した日本語メッセージへ変換する純関数。
 * raw JSON（ZodError.message）をそのまま UI へ出さないための堅牢化。
 * - ZodError: データ形式不一致
 * - HTTP ステータス系 Error: サーバー応答エラー
 * - その他: 汎用失敗メッセージ
 */
export function formatSchemaHistoryError(e: unknown): string {
  if (e instanceof ZodError) {
    return "履歴データの形式が想定と一致しませんでした。時間をおいて再度お試しください。";
  }
  if (e instanceof Error) {
    if (/HTTP\s*\d{3}/.test(e.message)) {
      return "履歴の取得に失敗しました（サーバー応答エラー）。時間をおいて再度お試しください。";
    }
    return "履歴の取得に失敗しました。時間をおいて再度お試しください。";
  }
  return "履歴の取得に失敗しました。";
}
```
> 入力: `unknown`（catch 節の例外）。出力: 日本語 string（副作用なし・純関数）。

### Lane C — `apps/web/src/lib/admin/schemaHistoryGlossary.ts`（新規・純データ）
```ts
export interface SchemaHistoryGlossaryTerm {
  readonly term: string;   // 技術名（併記用）
  readonly plain: string;  // やさしい言い換え
}

export interface SchemaHistoryPurposeStep {
  readonly order: number;
  readonly label: string;  // 流れの 1 ステップ
}

export const schemaHistoryGlossary: readonly SchemaHistoryGlossaryTerm[] = [
  { term: "alias resolve（エイリアス解決）", plain: "新しくなった設問を、過去のどの設問と同じ扱いにするか紐付ける作業" },
  { term: "stableKey", plain: "設問につける変わらない名札。フォームの文言が変わっても同じ回答だと分かる目印" },
  { term: "audit（監査ログ）", plain: "誰がいつ何をしたかを記録した操作の履歴" },
  { term: "question text", plain: "Google フォームに表示される設問の文章" },
];

export const schemaHistoryPurposeSteps: readonly SchemaHistoryPurposeStep[] = [
  { order: 1, label: "Google フォームの設問が追加・変更される" },
  { order: 2, label: "「スキーマ差分のレビュー」画面で新旧の設問を照合し stableKey を紐付ける（alias resolve）" },
  { order: 3, label: "紐付けた操作がここに「誰がいつどの設問をどう解決したか」として記録される" },
];
```
> 用語/言い換えはやさしい日本語を主、技術名を併記（AskUser Q1 方針）。

### Lane C — `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx`（新規）
```tsx
import type { ReactElement } from "react";
import { schemaHistoryGlossary, schemaHistoryPurposeSteps } from "../../lib/admin/schemaHistoryGlossary";

/**
 * /admin/schema/history 冒頭に置く目的説明パネル。
 * 「何の画面か」「いつ使うか」「何が分かるか」+ 流れ + 用語集を平易な日本語で提示する。
 * 純表示（props なし・状態なし）。色は OKLch token のみ。
 */
export function SchemaHistoryPurposeExplainer(): ReactElement {
  // - 見出し: 「この画面でできること」
  // - 1 文要約: 「Google フォームの設問を新旧で紐付け（alias resolve）した操作の履歴を確認できます」
  // - 流れ: schemaHistoryPurposeSteps（番号付き）
  // - 用語集: schemaHistoryGlossary（plain 主・term 併記）
  // ...
}
```
> `data-testid="schema-history-purpose-explainer"` を root に付与（spec 参照用）。

### Lane C — `history/page.tsx` の `AdminPageHeader`
```tsx
<AdminPageHeader
  eyebrow="ADMIN / SCHEMA"
  title="設問の紐付け履歴"            // ← 旧「alias resolve 履歴」を平易化
  description="フォームの設問を新旧で紐付け（alias resolve）した操作の記録を、操作者・期間で絞り込んで確認できます" // ← 旧「過去の解消結果を audit 経由で閲覧」を平易化
  breadcrumbs={[
    { label: "管理", href: "/admin" },
    { label: "Form schema", href: "/admin/schema" },
    { label: "紐付け履歴" },          // ← 旧「履歴」
  ]}
/>
```

### Lane D — 履歴カード（`SchemaDiffHistoryPanel.tsx` 行 187-224 の table を card へ）
- `displayItems.length === 0` → 既存 `<EmptyState title="該当する履歴がありません" />` 維持
- それ以外 → `<ul>` ベースのカードリスト。各カード（`<li className="schema-history-card">`）に:
  - `stableKey`: `it.afterStableKey ?? it.beforeStableKey ?? "—"`（mono 強調）
  - 紐付け遷移: `it.beforeStableKey ?? "—"` → `it.afterStableKey ?? "—"`
  - `question text`: `it.questionText ?? "—"`
  - 操作日時 `it.createdAt` ・操作者 `it.actorEmail ?? "(unknown)"`
  - `data-audit-id={it.auditId}`（既存 spec 互換のため保持）
- `Pagination` は現行のまま維持

### Lane B/D — `globals.css`（OKLch token のみ・HEX 直書き禁止）
```css
/* schema history: error alert（raw JSON の不格好表示を解消） */
.schema-history-error {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ubm-color-danger-soft);
  color: var(--ubm-color-danger);
  border: 1px solid var(--ubm-color-danger);
  font-size: var(--ubm-text-sm);
}

/* schema history: alias resolve カード（プロトタイプ ALIAS HISTORY 準拠） */
.schema-history-list { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; }
.schema-history-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--ubm-color-surface-panel);
  border: 1px solid var(--ubm-color-border-default);
  /* ... mono stableKey / 旧→新 / 日時・実行者 ... */
}
```
> 既存 token 変数名（`--ubm-color-*` / `--ubm-text-*`）は `tokens.css` / `globals.css` に存在するもののみ使用。新規 token は追加しない。

---

## 7. 不変条件

1. 既存 API surface のみ利用（`GET /admin/audit?action=schema_diff.alias_assigned` を再利用。新 endpoint 追加・D1 schema 変更・Google Form 仕様変更は禁止）
2. OKLch tokens 正本化（`apps/web/src/styles/tokens.css` 参照。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CI gate `verify-design-tokens` で fail 判定）
3. プロトタイプ正本順位（`pages-admin.jsx` `SchemaDiffPage` ALIAS HISTORY を表示形式の正本とし、新 primitive を生やさない）
4. D1 直接アクセス禁止（`apps/web` は API helper 経由のみ）
5. apps/api 非接触（`git diff origin/dev...HEAD -- apps/api apps/api/migrations` が空）
6. 新規 test ファイルは `*.spec.{ts,tsx}` のみ
7. admin form input は `FormField` 経由を標準（既存フィルタフォームは維持）

---

## 8. 受け入れ基準（AC）

- AC-1: `/admin/schema/history` で「絞り込み」を押しても `unrecognized_keys` / `batchId` の ZodError が発生せず、履歴取得 parse が成功する（Lane A）
- AC-2: `SchemaAliasHistoryResponseZ.parse` が `appliedFilters.batchId`（string / null 両方）を受理する回帰 spec が PASS（Lane A/E）
- AC-3: 取得失敗時に画面へ raw JSON ではなく日本語メッセージ（例「履歴データの形式が想定と一致しませんでした。…」）が表示される（Lane B）
- AC-4: error 表示要素に `.schema-history-error` クラスが付き、OKLch token のスタイルが当たる（Lane B）
- AC-5: 画面冒頭に目的説明パネル（`data-testid="schema-history-purpose-explainer"`）が表示され、流れ 3 ステップと用語集が描画される（Lane C）
- AC-6: page の title が「設問の紐付け履歴」、description が平易な日本語へ更新される（Lane C）
- AC-7: 履歴がプロトタイプ ALIAS HISTORY 準拠のカード形式（`.schema-history-card`）で描画され、stableKey / 旧→新 / question / 日時・操作者を含む（Lane D）
- AC-8: 当該 page.tsx / panel / explainer / globals.css に HEX 直書きが 0 件（`verify-design-tokens` で fail しない）（不変条件 #2）
- AC-9: `apps/api` の diff が空（`git diff origin/dev...HEAD -- apps/api apps/api/migrations` が 0 行）（不変条件 #5）
- AC-10: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web test --run`（対象 spec 群）が全 PASS（Lane E）

---

## 9. DoD（Definition of Done）

実装サイクル（後続 03.実装.md）完了の定義:
1. 上記 AC-1〜AC-10 をすべて満たす
2. 新規 product 3 + spec 3 が作成され、編集 5 ファイルが反映されている
3. `verify-design-tokens` で HEX 0 件
4. 対象 Vitest spec 群が GREEN（batchId parse 回帰 / human-readable error / card / explainer / glossary）
5. `git diff origin/dev...HEAD -- apps/api` が空
6. staging 反映後の visual evidence（screenshot）取得 = Phase 11（user-gated）
7. commit / push / PR = Phase 13（user-gated）

---

## 10. Phase 11 / capture 方針（implemented_local_evidence_captured 時点）

- local deterministic evidence は取得済み。`outputs/phase-11/manual-test-result.md` に focused Vitest / local Playwright / typecheck / token gate / apps-api diff gate を記録する。
- local screenshot は `outputs/phase-11/screenshots/admin-schema-history-purpose-and-card.png` / `admin-schema-history-error-message.png` の 2 PNG を取得済み。
- authenticated staging screenshot は user-gated のため staging 実機 PNG は未取得。
- compliance check の Phase 11 evidence inventory は local command evidence と local screenshot 2 点を `present`、authenticated staging screenshot を `pending_user_gate` で記載する。

## 11. 検証コマンド（実装サイクルで使用）

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm exec vitest run --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx
pnpm verify:tokens
git diff origin/dev...HEAD -- apps/api apps/api/migrations   # 空であること
# 仕様書側 CI gate pre-flight:
pnpm verify:phase12-compliance
pnpm gate-metadata:validate
```

### 2026-06-09 local evidence

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/lib/admin/__tests__/schemaHistoryError.spec.ts apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaHistoryPurposeExplainer.component.spec.tsx` | PASS（4 files / 60 tests） |
| `PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-schema-history-purpose-clarity-and-filter-fix/outputs/phase-11 pnpm --dir apps/web exec playwright test playwright/tests/admin-schema-history-purpose-clarity.spec.ts --project=desktop-chromium` | PASS（2 tests / local screenshots 2 PNG） |
| `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `pnpm verify:tokens` | PASS（design tokens in sync / 91 tracked） |
| `git diff origin/dev...HEAD -- apps/api apps/api/migrations` | PASS（空） |

補足: 誤って `pnpm --filter @ubm-hyogo/web test -- ...` を実行した結果、apps/web 全体が走り `MemberDrawer.tagInlineCreate.spec.tsx` の既存無関係 failure 1 件を確認した。今回変更対象の schema history 関連 spec はその全体実行中でも PASS 済み。
