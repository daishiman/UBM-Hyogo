# Implementation Guide

## Part 1: 中学生レベル

このタスクでやることは「**`loading.tsx` がちゃんと表示されているかを、テストで確認できるようにする**」ことです。

- Web ページを開くとき、ページの中身が用意できるまで「読み込み中」と書かれた小さな画面が出ます。これが `loading.tsx`。
- 今までのテストは本物のページしか見ていなくて、「読み込み中」画面が出ているかをチェックできていませんでした。
- そこで、**わざとちょっとだけ遅く返事をする特別なページ**を用意します（`/smoke/loading-state`）。
- このページに行くと、必ず先に「読み込み中」画面が出てから本物の中身が出るので、テストで両方の画面を確認できます。
- ただし、この特別なページは**本番では絶対に出さない**ように、env（環境変数）で 2 重に鍵をかけます。鍵が無いと 404（ページが無い）を返します。

### 専門用語セルフチェック

| 用語 | 日常語での説明 |
| --- | --- |
| `loading.tsx` | ページの準備中に出る「読み込み中」の画面 |
| fixture | テスト用に用意した特別な入口 |
| env | サーバーに渡す設定メモ |
| 404 | そのページは無い、という返事 |
| smoke test | 大事な画面が最低限開くかを見る点検 |

## Part 2: 技術者レベル

### 実装ファイル

| Path | Contract |
| --- | --- |
| `apps/web/app/__smoke__/_lib/fixture-guard.ts` | `smokeFixtureEnabled()` を共有し、staging fixture の二重ガードを一元化 |
| `apps/web/app/__smoke__/_lib/fixture-guard.spec.ts` | fixture flag / production guard / local process env fallback を unit test で固定 |
| `apps/web/app/__smoke__/error-boundary/page.tsx` | 既存 error fixture を共有 guard へ寄せる |
| `apps/web/app/__smoke__/members-list/page.tsx` | 既存 members-list fixture を共有 guard へ寄せる |
| `apps/web/app/__smoke__/loading-state/page.tsx` | private source。`searchParams.delay` を 0-3000 ms に clamp し、server-side delay 後に final marker を返す |
| `apps/web/app/__smoke__/loading-state/loading.tsx` | private source。Suspense fallback として `[data-page="smoke-loading-state"]` / `role=status` / `aria-live=polite` を返す |
| `apps/web/app/smoke/error-boundary/page.tsx` | routable `/smoke/error-boundary` wrapper |
| `apps/web/app/smoke/members-list/page.tsx` | routable `/smoke/members-list` wrapper |
| `apps/web/app/smoke/loading-state/page.tsx` | routable `/smoke/loading-state` wrapper |
| `apps/web/app/smoke/loading-state/loading.tsx` | routable loading boundary wrapper |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | loading boundary → final render、delay clamp、default fallback を検証 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | staging fixture route 正本を `/smoke/*` wrapper + `__smoke__` source 構成へ同期 |
| `SMOKE-COVERAGE-MATRIX.md` | row 19 を fixture runtime observation に更新 |

### API / Type Signature

```ts
export function smokeFixtureEnabled(): boolean

export default async function SmokeLoadingStateFixture(props: {
  searchParams: Promise<{ delay?: string | string[] }>
}): Promise<JSX.Element>
```

### Runtime Path x Evidence

| Runtime path | Evidence |
| --- | --- |
| staging/local fixture enabled | `/smoke/loading-state?delay=1000` shows loading boundary then final fixture |
| production or fixture disabled | `notFound()` returns 404 before delay side effect |
| smoke matrix | `loading.tsx` row now points to fixture markers instead of `N/A-runtime-observation` |

### Edge Cases

| Input | Expected |
| --- | --- |
| `?delay=0` | immediate final render with `delay-ms: 0` |
| `?delay=3500` | clamped to `delay-ms: 3000` |
| `?delay=abc` / `?delay=-1` | default `delay-ms: 1500` |

### Boundary

No API route, D1 table, auth flow, or production-facing endpoint contract is added. The fixture route is bundled but returns 404 unless `ENABLE_STAGING_SMOKE_FIXTURE === "1"` and `ENVIRONMENT !== "production"`.
