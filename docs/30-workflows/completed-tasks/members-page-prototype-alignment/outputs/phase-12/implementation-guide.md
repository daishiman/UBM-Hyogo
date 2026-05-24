# Implementation Guide

## Part 1: Middle School Explanation

この改善が必要なのは、`/members` ページが設計図（プロトタイプ）と違って見え、利用者が「どこで探すのか」「どの表示モードなのか」を直感的に理解しづらいからです。

たとえば、学校の名簿がただの文字の縦並びだと、クラス・役割・検索欄を見分けるのに時間がかかります。見出し、絞り込み、カード、一覧の形がそろっていれば、同じ名簿でもすぐ探せます。

何をするかというと、今あるメンバー一覧を壊さずに、見出し・絞り込み・表示切替・カード・リスト表示を設計図と同じ形へ近づけます。

この workflow では、今あるデータの取り方は変えずに、見え方と並び方を設計図へ近づけます。新しいデータベースや API を作るのではなく、既存の部品をきれいに並べ直す作業です。

### 今回作ったもの

- Phase 12 strict 7 の物理ファイル一式
- `outputs/artifacts.json` の mirror
- Phase 11 screenshot inventory の `present` 台帳と PNG evidence
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS / lessons 同期

### 専門用語セルフチェック

中学生でも読み通せるよう、本文で出てくる専門用語をやさしい言葉で言い換えます。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| プロトタイプ | デザイナーが先に描いた「完成イメージの設計図」 |
| design token | サイト全体で使う「色・大きさの決まりリスト」 |
| CSS | 文字や箱の見た目（色・形・余白）を決める指示書 |
| @layer components | 「部品の見た目」を書く専用のページ。ほかのページの指示と混ざらないようにする仕切り |
| Phase 11 evidence | 「ちゃんと直したよ」と後から見せるための画面の写真や記録 |
| Segmented | 「ゆったり／密／リスト」のように、ひとつだけ選ぶタブ型スイッチの部品名 |
| data-component | 部品ごとに付ける「名札」。テストや CSS から部品を指し示すときに使う |

## Part 2: Technical Guide

### TypeScript 型定義

```tsx
type Density = "comfy" | "dense" | "list";

type DensityOption = {
  value: Density;
  label: string;
};

type MembersPrototypeAlignmentTarget =
  | "PublicHeader"
  | "PublicFooter"
  | "DensityToggle"
  | "MemberFilters"
  | "MemberCard"
  | "MemberGrid"
  | "MemberTable"
  | "EmptyState";
```

### APIシグネチャ

The runtime API contract is unchanged:

```ts
validateMembersPrototypeAlignment(workflowRoot: string): {
  taskType: "implementation";
  visualEvidence: "VISUAL";
  workflowState: "implemented_local_evidence_captured";
};
```

The application implementation continues to consume the existing `GET /public/members` endpoint and `apps/web/src/lib/url/members-search.ts` query parser.

### 使用例

```bash
pnpm verify:phase12-compliance
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/members-page-prototype-alignment --json
pnpm verify:tokens
```

### Scope

Implementation targets are `apps/web/src/components/public/*`, `apps/web/src/components/feedback/EmptyState.tsx`, `apps/web/app/(public)/members/page.tsx`, and `apps/web/src/styles/legacy-public.css`.

The task reuses `GET /public/members`, `apps/web/src/lib/url/members-search.ts`, and existing UI primitives. `apps/api/**`, D1 migrations, and public API response shapes are untouched constraints.

### Steps

1. Extend or reuse `Segmented` so `DensityToggle.client.tsx` can render a pill-style density control with stable ARIA.
2. Add `data-component` and `data-density` hooks to public member components without changing URL or API semantics.
3. Add prototype-derived selectors to `legacy-public.css` under `@layer components`, using only existing `var(--ubm-*)` tokens.
4. Add focused Vitest specs and a Playwright smoke spec for the primary visual selectors.
5. Capture Phase 11 screenshots and token grep evidence, then keep `present` rows tied to physical files.

### エラーハンドリング

No new runtime error surface is introduced. Existing fetch/API failures from `/public/members` remain owned by the current page data-loading path.

If Phase 11 screenshot capture fails, keep evidence rows as `pending` and record the failure in `outputs/phase-11/runtime-notes.md` instead of marking files `present`.

If `verify:tokens` fails, replace direct color/shadow values with existing `--ubm-*` tokens before continuing.

### エッジケース

- Empty search result must render the centered empty state without claiming a data failure.
- `density=list` must preserve the existing URL query contract while rendering the table/list visual density.
- Mobile width must keep filter controls stacked and avoid text overlap.
- `PublicHeader` active state requires an actual `aria-current="page"` source, not CSS-only assumptions.

### 設定項目と定数一覧

| Constant | Value |
| --- | --- |
| workflow root | `docs/30-workflows/members-page-prototype-alignment/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_evidence_captured` |
| implementationCategory | `standard` |
| implementation_mode | `existing-ui-alignment` |
| token gate | `pnpm verify:tokens` or `pnpm --filter @ubm-hyogo/web verify-design-tokens` |

### テスト構成

| Layer | Command / File |
| --- | --- |
| schema | `node .claude/skills/task-specification-creator/scripts/validate-schema.js --schema schemas/artifact-definition.json --data <artifacts>` |
| Phase 12 | `pnpm verify:phase12-compliance` |
| guide | `validate-phase12-implementation-guide.js --workflow docs/30-workflows/members-page-prototype-alignment --json` |
| unit | `apps/web/src/components/public/__tests__/*.spec.tsx` |
| visual smoke | `apps/web/playwright/tests/members-prototype-alignment.spec.ts` |
| visual evidence | `docs/30-workflows/members-page-prototype-alignment/outputs/phase-11/screenshots/EV-1..6` |
