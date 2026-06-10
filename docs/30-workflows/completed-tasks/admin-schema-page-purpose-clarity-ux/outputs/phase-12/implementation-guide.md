# 実装ガイド — admin-schema-page-purpose-clarity-ux

> 実装区分: implementation / VISUAL（apps/web local implementation completed。staging visual / commit / PR は user-gated）

## Part 1: これは何をするものか（はじめての人向け）

### なぜ必要か

会員のみなさんは Google フォームに回答します。その回答は、サイトの「会員一覧」「会員詳細」「マイページ」に表示されます。ところが、フォームの質問は時々変わります（質問が増えたり、文章が直されたり、消えたりします）。

日常の例えで言うと、**引っ越しで荷物の置き場所が変わったとき、荷物（回答）を正しい棚（保存場所）に入れ直す作業**が必要になります。これをしないと、せっかくの回答がどの棚に入れたらいいか分からず、画面にうまく出てこなくなります。

`/admin/schema` ページは、この「**フォームの質問が変わったときに、回答を正しい棚に入れ直す**」ための管理画面です。

### 何をするか

この画面では次の 3 ステップを行います。

1. **変更を検知する** — フォームの質問が増えた・変わった・消えたことが「差分」として一覧に出ます。
2. **項目を対応づける** — 「この質問は、この棚（項目キー）に入れる」と人が決めて結びつけます。
3. **会員データへ反映する** — 結びつけると、回答が正しい棚に整理され、画面に正しく表示されます。

今回の改善では、この 3 ステップと「**やると何が良くなるのか（会員の回答が一覧・詳細・マイページに正しく出る）**」を、画面の上にいつも分かりやすく表示します。さらに「stableKey」「resolve」などの難しい言葉を「項目キー」「対応づけ」というやさしい言葉に言い換え、難しい言葉は小さく添えるだけにします。

### 何が良くなるか

これまでは「このページで何をすればいいの？ やると何が起きるの？」が分からない状態でした。改善後は、画面を開いた瞬間に「目的・やること・得られる結果」が一目で分かり、迷わず作業できるようになります。

### 今回作ったもの

- 画面上部に「このページでできること」を説明するカードを作った。
- 難しい言葉を「項目キー」「対応づけ」「フォーム版数」と言い換える用語集を作った。
- 差分カテゴリや割当フォームに「次に何をすればよいか」「対応づけると何が起きるか」を表示した。

## Part 2: 技術詳細（開発者向け）

### 背景

真因は apps/web 表現層に閉じる（API/D1/Google Form は正しく動作）。`page.tsx:139-153` の header description が 1 文のみで流れ・成果を説明せず、stableKey 等の専門用語が説明なしで露出（`page.tsx:66`, `:111-113`）、統計・ステータスの意味と次アクションが不明、割り当て後の下流結果が示されない、という情報設計の欠如が問題（SSOT §2 RC-1..5）。

### 要約

3 レーンの表現層追加で解決する（新規 endpoint/D1/Form 変更なし・OKLch トークン正本・新規プリミティブ 0）。

- Lane A: 新規 `SchemaPurposeExplainer.tsx`（常時表示の目的説明カード）＋ 新規 `schemaGlossary.ts`（用語/流れ/結果の純データ SSOT）＋ `page.tsx` への挿入と header description 更新。
- Lane B: `SchemaDiffPanel.tsx` にカテゴリ説明・割り当てアウトカム・平易ステータス・0件 empty コピーを**表示追加のみ**（handler/fetch/state 不変）。
- Lane C: `page.tsx` の統計 label/hint・履歴見出し平易化＋ `globals.css` に `.schema-purpose-card` 等を OKLch で追加。

### 実装結果

1. `apps/web/src/components/admin/schemaGlossary.ts` を新規作成し、用語・diff category・統計・status の表示文言を SSOT 化した。
2. `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` を新規作成し、AdminPageHeader 直下に目的説明カードを常時表示した。
3. `apps/web/app/(admin)/admin/schema/page.tsx` を編集し、header description / 統計 label-hint / revision-history / alias-history を平易化した。
4. `apps/web/src/components/admin/SchemaDiffPanel.tsx` を編集し、カテゴリ説明・平易ステータス・割当アウトカム・0件 empty copy を追加した。mutation handler / fetch / rollback / recompute は不変。
5. `apps/web/src/styles/globals.css` に `.schema-purpose-card` / `.schema-flow-steps` / `.schema-glossary` / `.schema-assignment-outcome` 等を token-only で追加した。
6. `schemaGlossary.spec.ts` / `SchemaPurposeExplainer.component.spec.tsx` を新規作成し、`SchemaDiffPanel.component.spec.tsx` / `page.spec.tsx` を更新した。

### TypeScript 型定義

```ts
export type SchemaStatKey = "unresolved" | "added" | "changed" | "removed";

export interface SchemaTerm {
  readonly plainLabel: string;
  readonly technicalName: string;
  readonly description: string;
}

export interface SchemaDiffTypeDescription {
  readonly label: string;
  readonly technicalName: DiffType;
  readonly description: string;
  readonly actionHint: string;
}
```

### APIシグネチャ

公開 API は変更していない。apps/web 内の表示補助 API は次の純関数のみ。

```ts
describeDiffType(type: DiffType): SchemaDiffTypeDescription;
describeSchemaStat(key: SchemaStatKey): SchemaStatDescription;
describeSchemaStatus(status: SchemaDiffItem["status"]): string;
```

### 使用例

```tsx
import { SchemaPurposeExplainer } from "../../../../src/components/admin/SchemaPurposeExplainer";
import { describeSchemaStat } from "../../../../src/components/admin/schemaGlossary";

<SchemaPurposeExplainer />;
const unresolvedStat = describeSchemaStat("unresolved");
```

### エラーハンドリング

- `SchemaDiffPanel` の mutation error / validation error / retryable continuation / rollback error は既存分岐を維持した。
- 新規表示文言は純表示であり、API error を握り潰さない。
- `active.questionId` が無い diff では既存の alert を維持し、割当フォームを出さない。
- `SchemaPurposeExplainer` は `AdminPageHeader` 直下、`result.ok` 三項の外に置く。API error 時も目的・流れ・用語は常時表示し、統計 / DiffPanel / 履歴だけを stale 防止のため非描画にする。

### エッジケース

- 差分0件では「差分はありません。フォームとデータベースが一致した良い状態です」を表示する。
- mobile 390px では flow/glossary を 1 column に落とし、長い技術名は code 表示のまま折り返す。
- local fixture が非空 diff 固定のため empty runtime screenshot は作らず、component test を正本証跡にする。

### 設定項目と定数一覧

| 定数/データ | 役割 |
| --- | --- |
| `SCHEMA_GLOSSARY` | 項目キー / 対応づけ / フォーム版数の表示 SSOT |
| `DIFF_TYPE_DESCRIPTIONS` | added / changed / removed / unresolved の説明 SSOT |
| `STAT_DESCRIPTIONS` | 統計4枚の label/hint SSOT |
| `STATUS_LABELS` | queued / resolved の平易表示 |

### テスト構成

| テスト | 役割 |
| --- | --- |
| `schemaGlossary.spec.ts` | 用語/カテゴリ/統計/status の文言 SSOT |
| `SchemaPurposeExplainer.component.spec.tsx` | 目的説明カードの DOM |
| `SchemaDiffPanel.component.spec.tsx` | カテゴリ説明、割当アウトカム、empty copy、mutation 回帰 |
| `page.spec.tsx` | ページ全体の説明カード、統計、履歴ラベル、API error 時も explainer 常時表示 |

### 検証コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/schemaGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaPurposeExplainer.component.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  "apps/web/app/(admin)/admin/schema/page.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
git diff --stat -- apps/api packages/shared   # 空を期待
```

### 検証結果

| コマンド | 結果 |
| --- | --- |
| focused Vitest 4 files | PASS（34 tests） |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` | PASS |
| `git diff --stat -- apps/api packages/shared` | diff 0 |
| local Playwright desktop/mobile smoke | PASS |

### 既知制限

- Staging visual baseline は未取得（user-gated）。
- `schema-empty-state.png` は fixture が非空 diff 固定のため runtime PNG なし。empty copy は component test で semantic PASS。
- ガイド付きフルウィザード再設計は OOS（unassigned-task-detection.md baseline 候補）。
- API/D1/Form は不変条件で変更不可のため、メタ情報追加による説明強化は本タスクでは行わない。

## 視覚証跡

VISUAL タスク。Phase 11 capture 実績は `outputs/phase-11/screenshot-plan.json` / `phase11-capture-metadata.json` に定義。present screenshot: `schema-purpose-explainer-default.png` / `schema-stats-plain-labels.png` / `schema-diff-assign-outcome.png` / `admin-schema-purpose-clarity-mobile-runtime.png`。`schema-empty-state.png` は semantic PASS / runtime fixture N/A（`phase12-task-spec-compliance-check.md` §4 と一致）。
