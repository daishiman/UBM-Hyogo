# Implementation Guide

## Part 1: 中学生レベル

学校の係活動で、クラスごとに別々の連絡用紙を作ると、書き方がばらばらになって先生が確認しづらくなります。このタスクは、入力欄、ページ送り、現在地の表示、アイコン、空の画面表示の「共通の用紙」を先に決める作業です。

今回は共通部品そのものまで作りました。次に各画面を作る人は、この部品を使えば同じルールで入力欄、ページ送り、道しるべ、アイコン、空の画面をそろえられます。

| 用語 | 言い換え |
| --- | --- |
| primitive | 画面を作る小さな共通部品 |
| FormField | 入力欄とエラー表示のまとまり |
| Breadcrumb | 今どの場所にいるかを示す道しるべ |
| token | 色や余白の名前つきルール |
| visual evidence | 画面が正しく見える証拠 |

## Part 2: 技術者レベル

Implemented targets:

- `apps/web/src/components/ui/FormField.tsx`
- `apps/web/src/components/ui/EmptyState.tsx`
- `apps/web/src/components/ui/Pagination.tsx`
- `apps/web/src/components/ui/Icon.tsx`
- `apps/web/src/components/admin/Breadcrumb.tsx`
- `apps/web/src/lib/useAdminMutation.ts`
- `apps/web/src/styles/globals.css`

Key constraints: keep existing callers compatible, use existing OKLch tokens only, do not edit `apps/api`, and keep staging/production runtime evidence user-gated.

## Part 3: 実装サマリ (本サイクル実コード実装)

> ラベルは `[実装区分: 実装仕様書]` 通り。今回のレビューサイクルで実コード実装まで完了させた (CONST_009 準拠)。Playwright visual snapshot は Issue #746 recovery で 12 PNG 取得済み。PR / push / commit はユーザー明示承認後の操作として未実行。

### 追加ファイル

| ファイル | 役割 | AC |
| --- | --- | --- |
| `apps/web/src/components/ui/FormField.tsx` | `aria-invalid` / `aria-describedby` / `role="alert"` を一貫注入する form validation wrapper | AC-1 |
| `apps/web/src/components/ui/Pagination.tsx` | `nav[aria-label="pagination"]`。`total` 未指定時 cursor only | AC-3 |
| `apps/web/src/components/ui/Icon.tsx` | `IconSize = sm/md/lg/xl` を 12/16/20/24px にマップ、`name?: IconName` と `children?` を併用、`ariaLabel` 有無で `role=img` / `aria-hidden` を切替 | AC-4 |
| `apps/web/src/components/admin/Breadcrumb.tsx` | `nav[aria-label="breadcrumb"] > ol > li`、最終項目 `aria-current="page"`、separator `aria-hidden` | AC-5 |
| `apps/web/src/lib/useAdminMutation.ts` | ongoing mutation 中の 2nd call を toast 通知付きで拒否、`onError` は呼び form state には触らない | AC-8 / AC-9 |
| `apps/web/src/components/ui/__tests__/parallel09-primitives.component.spec.tsx` | 5 primitive の Vitest unit test | AC-1〜AC-5 |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.tsx` | mutation hook の Vitest unit test (4 cases) | AC-8 / AC-9 |
| `apps/web/app/visual-harness/[name]/page.tsx` | production `notFound()` guard 付き visual fixture route | Phase 11 |
| `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` | 6 種 x 2 scale screenshot capture spec | Phase 11 |
| `apps/web/playwright.parallel09.config.ts` | local webServer 自動起動付き visual evidence config。`PLAYWRIGHT_BASE_URL` 指定時のみ外部 server を使用 | Phase 11 |

### 編集ファイル

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/src/styles/globals.css` | `@layer components` に G9-1 (form-field) / G9-3 (pagination) / G9-4 (icon) / G9-5 (breadcrumb) / G9-7 (focus-visible + prefers-reduced-motion) の rule set を section コメント付きで追加。tokens のみ参照 (HEX 直書きなし) |
| `apps/web/src/components/ui/index.ts` | `FormField` / `Pagination` / `Icon` を re-export |

### EmptyState (AC-2)

既存 `apps/web/src/components/ui/EmptyState.tsx` は 4 props (`icon` / `title` / `description` / `action`) に加え、children-only 既存 API を維持する。`title` は optional とし、`children` は `action` の前に描画する。

### G9-6 (mobile responsive)

19 routes 個別適用は parallel-01〜08 の責務。本 task では `globals.css` 内に方針コメントのみ残し、新規 breakpoint は追加していない。

### 検証結果

- `pnpm --filter @ubm-hyogo/web typecheck` pass
- Focused Vitest: startup blocked by local esbuild host/binary mismatch (`0.27.3` vs `0.25.4`) before test execution
- Playwright visual: Issue #746 recovery で `6 passed`、12 PNG captured、全 non-empty / 全 <= 500KB
- `verify-design-tokens` 観点で新規ファイル grep 上 HEX/`bg-[#`/`text-[#` 直書きゼロ
- `apps/api/`、D1 schema、Google Form schema いずれも未変更

### user-gated として未実行

- staging / production runtime smoke
- 実 a11y test (`jest-axe`): package は存在するが本 focused run には未統合。aria 属性 assertion を Vitest で代替
- commit / push / PR 作成

## Part 4: Screenshot Evidence

Canonical screenshots are stored at:

`docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`

Issue #746 recovery root:

`docs/30-workflows/issue-746-parallel-09-playwright-visual-evidence-completion/`

Re-run command:

```bash
mise exec -- pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts --reporter=line
```
