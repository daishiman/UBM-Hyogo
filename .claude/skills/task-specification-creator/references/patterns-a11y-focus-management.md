# パターン集: a11y focus management（error boundary / dialog / loading skeleton）

> 由来: Issue #800（profile/login/admin error boundary focus transfer + `useAutoFocusOnMount` hook 抽出）
> 読み込み条件: error boundary / dialog / modal / loading skeleton で mount 時 focus 移譲を仕様化するタスクを書く時。
> 配置: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`（hook 正本） / `apps/web/src/app/error.tsx`（利用例） / `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`（focused test 正本）

## 適用シーン

| シーン | 用途 | 焦点付与対象 |
| --- | --- | --- |
| Root / Route error boundary (`app/error.tsx`, `app/(group)/error.tsx`) | 例外発生時に screen reader へ即時通知し、heading を活性化する | `h1`（`role="alert"` 直下） |
| Dialog / Modal の新規 open | open 直後に dialog title または primary action へ focus を移す | `[role="dialog"] h2` または primary `<button>` |
| Loading skeleton → loaded state の切替 | skeleton から loaded heading へ focus を引き継ぎ context lost を防ぐ | data ready 時の section heading |
| Form submit error の inline summary | error summary container を活性化し screen reader へ assertive 通知 | summary 内 heading |

> SSR/CSR 境界: hook は `"use client"` 必須。Server Component から直接呼ばない。
> 非活性要素（`h1` / `section`）に focus を当てる場合は呼び出し側で `tabIndex={-1}` を必ず付与する（hook 内では付与しない・責務分離）。

## パターン1: `useAutoFocusOnMount` hook の標準シグネチャ

正本: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`

### 契約

| 項目 | 規定 |
| --- | --- |
| Signature | `useAutoFocusOnMount<T extends HTMLElement>(ref: RefObject<T \| null>, options?: FocusOptions): void` |
| 既定挙動 | `ref.current?.focus({ preventScroll: true, ...options })` |
| `preventScroll` default | `true`（layout jump 抑止のため）。caller が opt-out する時は `{ preventScroll: false }` を明示する |
| 副作用順序 | `useEffect` 内で 1 回のみ実行。observable な logging effect が必要な場合は **本 hook より上に** 書いて順序を固定する |
| `tabIndex` 付与責務 | 呼び出し側（非活性要素を focus する場合に限り `tabIndex={-1}` を JSX 側で付与） |

### 最小実装（参考）

```ts
"use client";
import { type RefObject, useEffect } from "react";

export function useAutoFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options?: FocusOptions,
): void {
  useEffect(() => {
    ref.current?.focus({ preventScroll: true, ...options });
  }, [options, ref]);
}
```

> 新規 a11y hook を追加する場合も同 directory（`apps/web/src/lib/a11y/`）に置き、`use*OnMount` 命名で揃える。

## パターン2: Error Boundary 統一構造

`role="alert"` + `aria-live="assertive"` + `tabIndex={-1}` on h1 + auto-focus を 4 点セットで強制する。

### JSX 構造（最小）

```tsx
"use client";
import { useEffect, useRef } from "react";
import { useAutoFocusOnMount } from "@/lib/a11y/useAutoFocusOnMount";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef);

  return (
    <section role="alert" aria-live="assertive">
      <h1 ref={headingRef} tabIndex={-1}>エラーが発生しました</h1>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>再試行</button>
    </section>
  );
}
```

### 不変条件

1. `role="alert"` と `aria-live="assertive"` を同一コンテナに併記する（NVDA / VoiceOver 双方で確実に通知）。
2. `h1`（または該当 heading）には `tabIndex={-1}` を **必ず** 付与する。付与漏れは焦点が `<body>` に逃げる原因。
3. `useAutoFocusOnMount` は heading ref に対して 1 回だけ呼ぶ。再 mount しない限り再 focus しない。
4. observability effect（log / metric 送信）は `useAutoFocusOnMount` より **前** に書く。Phase 6 test plan で順序を assert する。
5. error reset 後の再 focus が必要な場合は本 hook の範囲外。caller 側で別 ref + `useEffect([resetSignal])` を組む。

## パターン3: Focused test（`HTMLElement.prototype.focus` spy + preventScroll 検証）

正本: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`

### 必須 3 ケース

| # | ケース | assert 対象 |
| --- | --- | --- |
| 1 | mount 時に ref 対象へ focus が移ること | `document.activeElement === getByRole("heading", { level: 1 })` |
| 2 | `preventScroll: true` が default で渡ること | `vi.spyOn(HTMLElement.prototype, "focus")` が `{ preventScroll: true }` で called |
| 3 | `options` で `preventScroll` を opt-out 可能なこと | spy が `{ preventScroll: false }` で called |

### 最小 spec（参考）

```tsx
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useAutoFocusOnMount } from "../useAutoFocusOnMount";

afterEach(() => { vi.restoreAllMocks(); });

function Harness({ options }: { readonly options?: FocusOptions }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(ref, options);
  return <h1 ref={ref} tabIndex={-1}>Error heading</h1>;
}

describe("useAutoFocusOnMount", () => {
  it("preventScroll=true を default で渡す", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<Harness />);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});
```

### Spec 作成時の注意

- `vi.spyOn(HTMLElement.prototype, "focus")` は `afterEach(vi.restoreAllMocks)` で必ず復元する（他 spec へリーク禁止）。
- `document.activeElement` の比較は jsdom 環境で安定する。テスト harness 側で `tabIndex={-1}` を付けないと focus が `<body>` に逃げて false-positive になる。
- `preventScroll` 引数は **完全一致** で検証する（`expect.objectContaining` を使うと regression 検出力が落ちる）。

## Phase 6 (test plan) でのチェックポイント

仕様書の Phase 6 test plan には次を必須記述する。

1. 対象 spec ファイルの **完全パス + 行範囲** 列挙（例: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx:1-38`）
2. `vi.spyOn(HTMLElement.prototype, 'focus')` を使った **引数完全一致 assertion** を 1 ケース以上含める
3. `{ preventScroll: true }` の default 検証 + caller override 検証の 2 ケースを independent に持つ
4. error boundary 統合 spec では `expect(document.activeElement).toBe(getByRole('heading', { level: 1 }))` で actual focus 移譲を確認する（spy だけでは不足）
5. observability effect（log / metric）順序を assert する場合、`vi.fn` モックの `mock.invocationCallOrder` で `log → focus` 順を検証する

## Phase 11 (evidence) でのチェックポイント

Phase 11 evidence inventory に次を必ず含める。

| evidence file | 内容 |
| --- | --- |
| `phase-11/evidence/focus-management-spec-run.txt` | `mise exec -- pnpm --filter web exec vitest run src/lib/a11y` のフル出力（pass 集計末尾あり） |
| `phase-11/evidence/focus-management-spec-list.txt` | `grep -rn "useAutoFocusOnMount" apps/web/src` 結果（利用箇所の drift 防止） |
| `phase-11/screenshots/error-boundary-focus-{route}.png` | VISUAL タスクのみ。focus ring が heading に可視で乗っている state を撮影 |
| `phase-11/evidence/axe-report-{route}.json` | `@axe-core/playwright` で error boundary route を走査し violations: [] を確認 |

> NON_VISUAL hook 単体タスクは screenshot を要求しない（[phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) L3 in-memory test layer 準拠）。
> VISUAL（route 統合）タスクは [phase-11-screenshot-guide.md](phase-11-screenshot-guide.md) の screenshot evidence と併用する。

## パターン: 多重配置 description id（`useId`）と native `<details>` disclosure close

> 由来: Issue #1007（`DensityToggle` help-hint hardening — 多重配置時の `aria-describedby` id 衝突 + 非制御 `<details>` の Escape/外側クリック close）
> 読み込み条件: 同一ページに複数置きうる component が hidden description span を持つ／disclosure（help hint・popover・accordion）を native `<details>` で実装するタスクを書く時。
> 正本: `apps/web/src/components/public/DensityToggle.client.tsx` / focused test `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`
> 詳細 lessons: aiworkflow-requirements `lessons-learned/lessons-learned-issue-1007-density-toggle-help-hint-hardening-2026-05.md`（L-DTHH-001..006）

### 契約

| 項目 | 規定 |
| --- | --- |
| description id 生成 | `const uid = useId(); const descId = (v) => `${uid}-${scope}-${v}-desc``。固定文字列 id を禁止し、hidden span の `id` と control の `aria-describedby` を同じ `descId(v)` から生成する |
| disclosure 開閉方式 | 非制御 native `<details ref>`。open は summary native toggle 任せ、**close のみ** `detailsRef.current.open = false` を `useCallback` 化して命令的に行う（controlled state 化しない） |
| document listener | `browserDocument()`（SSR guard）→ mount〜unmount で 1 本 → handler 内で `detailsRef.current?.open` を直接判定 → cleanup で必ず解除、の 4 点セット。依存配列は安定 `closeHelp` のみ |
| close UX | Escape は close 後 `summary` へ focus 復帰。外側クリックは `pointerdown` + `target instanceof Node` + `!detailsRef.current.contains(target)` の双方成立時のみ close |
| icon 追加 | `icons.ts` union + `Icon.tsx` glyph case + `09d-icons.md` spec 行の 3 点を同一 wave で同期（[patterns-mobile-ui-primitive-3point-sync.md](patterns-mobile-ui-primitive-3point-sync.md) と同型の 3-point 同期） |

### Phase 4 / Phase 11 検証規定

- focused vitest で「N 個配置時に description id 全件 unique」「各 control の `aria-describedby` が **自 instance 内** span を指す」を assert（参照崩れ guard）。
- jsdom は `<details>` summary click を native toggle しないため、test helper で `details.open = true` + `new Event("toggle")` 手動 dispatch の fallback を 1 箇所に集約する。実ブラウザの open/close 見た目は Phase 11 screenshot（help-open / help-closed）で別途担保する。

## アンチパターン（避ける）

| アンチパターン | なぜ駄目か | 正解 |
| --- | --- | --- |
| 各 error boundary 毎に inline `useEffect(() => ref.current?.focus(), [])` を書く | hook 化されておらず preventScroll default や test pattern が drift | `useAutoFocusOnMount` 経由に統一 |
| heading への `tabIndex={-1}` を省略 | focus が `<body>` に逃げ activeElement assertion が false-positive | JSX 側で `tabIndex={-1}` 必須 |
| `aria-live="polite"` を error boundary に使う | 重要 error 通知が読み上げ待ち行列で遅延 | error boundary は `assertive` 固定 |
| `focus()` 引数なしで呼ぶ | scroll jump が発生し layout が暴れる | `{ preventScroll: true }` を default |
| focused test で `expect(focusSpy).toHaveBeenCalled()` のみ | preventScroll regression を検出できない | 引数完全一致 (`toHaveBeenCalledWith`) |
| 多重配置 component の description id を `desc-${value}` 固定文字列にする | 2 個目以降で id 衝突し `aria-describedby` が他 instance を指す参照崩れ | `useId()` 接頭辞で instance ごと namespace 化 |
| disclosure を `useState(open)` で controlled 化 | summary native toggle / keyboard a11y を自前再実装する羽目になり複雑化 | 非制御 native `<details ref>`、close のみ `detailsRef.current.open=false` |
| `document.addEventListener` を SSR guard 無しで張る | OpenNext Workers SSR で `document` 未定義 throw | `browserDocument()` で `null` 早期 return + unmount 解除 |
| icon-only ボタンへ `sr-only` ラベルを足す際、既存 E2E が `getByText(短い語)` 非 exact で同領域を触っているか未確認 | sr-only テキストが検索語を部分文字列で含むと Playwright strict-mode で複数要素マッチし smoke が落ちる（jsdom unit では顕在化せず CI smoke でのみ発覚） | E2E ロケータを `{ exact: true }` か `getByRole`/`data-testid` で明示限定。a11y 追加は正しく、修正は E2E 側に入れる |

> **sr-only ラベル × E2E `getByText` strict-mode（Phase 6 / Phase 11 チェック）**: a11y 改善で `sr-only` ラベルを追加するタスクは、Phase 6 test plan で「追加ラベルのテキストが既存 Playwright の `getByText(語)` 非 exact ロケータと部分一致しないか」を確認規定に含める。落とし穴の実例 = 2026-06-03 `docs/admin-meetings-attendance-404-and-ia-spec`（PR #1115）で見出しボタンへ `sr-only`「出席を記録・編集」を追加した結果 `getByText('編集')` が `<summary>編集</summary>` と 2 要素マッチし `playwright-smoke / smoke (chromium)` で strict-mode 違反 → `{ exact: true }` 1 行で解消。Playwright のエラーメッセージ自体が `aka getByText('編集', { exact: true })` を提示するので、strict-mode violation のログから正解ロケータを直読みできる。aiworkflow-requirements [[testing-accessibility]] §3「非表示要素」の落とし穴節が正本。

## 参照

- 実装: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- 利用例: `apps/web/src/app/error.tsx` / `apps/web/src/app/(public)/login/error.tsx` / `apps/web/src/app/(public)/profile/error.tsx` / `apps/web/src/app/(admin)/admin/error.tsx`
- Spec 正本: `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx`
- Workflow: `docs/30-workflows/completed-tasks/issue-800-*`（root error boundary focus management 系の Phase 1-13 spec 群）
- 関連 references: [patterns-testing.md](patterns-testing.md) / [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) / [quality-gates.md](quality-gates.md) §a11y focus management
