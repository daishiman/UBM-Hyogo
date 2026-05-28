# Phase 1: 要件定義

| 項目                | 値                                                     |
| ------------------- | ------------------------------------------------------ |
| Phase               | 1 / 13                                                 |
| 名称                | 要件定義                                               |
| 状態                | completed                                              |
| 作成日              | 2026-05-28                                             |
| 担当                | task-specification-creator                             |
| Task type           | implementation                                         |
| visualEvidence      | NON_VISUAL                                             |
| implementation_mode | new                                                    |

## 1. 目的

`apps/web/app/page.tsx`（route `/`）は親 workflow Task A の async `PublicHeader` 化に対応していない。本 task では root page でも `getAuthView()` を取得し、`<PublicHeader authView={authView} />` 配信に整合する。

## 2. スコープ（含む / 含まない）

| 区分    | 内容                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------- |
| 含む    | `apps/web/app/page.tsx` の `await getAuthView()` 追加 + `<PublicHeader>` props 配線             |
| 含む    | `apps/web/app/__tests__/page.spec.tsx` の `getAuthView` mock 追加（guest / member 2 ケース）    |
| 含まない | `(public)/page.tsx` への route 移動                                                             |
| 含まない | `connection()` / `revalidate = 60` / `generateMetadata` の変更                                  |
| 含まない | Task A 側（`PublicHeader` async 化・`getAuthView` helper 実装）                                  |
| 含まない | Task C 以降（privacy/terms/login redirect/member header/admin sidebar/auth slot e2e）           |

## 3. 受入条件（AC）

| ID    | 受入条件                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------- |
| AC-01 | `app/page.tsx` は `await getAuthView()` を呼び、戻り値を `<PublicHeader authView={...} />` に渡す  |
| AC-02 | `revalidate = 60` / `connection()` / `generateMetadata` は不変                                      |
| AC-03 | page spec に `getAuthView` を `vi.mock` し、guest / member 2 ケースで `data-auth-state` を assert   |
| AC-04 | `pnpm typecheck` / `pnpm lint` green                                                                |
| AC-05 | `pnpm --filter @ubm-hyogo/web build` green（OpenNext Workers 互換）                                  |

## 4. inventory（変更対象）

| #   | パス                                              | 種別          | 備考                                       |
| --- | ------------------------------------------------- | ------------- | ------------------------------------------ |
| 1   | `apps/web/app/page.tsx`                           | 編集          | import + await + props 配線                |
| 2   | `apps/web/app/__tests__/page.spec.tsx`            | 編集 or 新規  | `getAuthView` mock（既存有無を確認）        |

## 5. 命名規則の確認

- helper: `getAuthView`（Task A/B 共通で `apps/web/src/lib/auth-view/index.ts` に定義）
- prop: `authView`（kebab/camel: camelCase）
- type: `AuthView = { kind: "guest" } | { kind: "member"; profileHref: string }`
- DOM attribute: `data-auth-state`（kebab）
- test file 命名: `*.spec.tsx`（不変条件 #8）

## 6. 依存

- **前提タスク**: Task A（`getAuthView` / `PublicHeader` async 化）が dev 上で merged or 同 PR で先行マージ済み
- **後続**: Task C / D / E / F / G は本 task と独立に進行可能

## 7. テスト対象ファイル（事前列挙）

`mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run app/__tests__/page.spec.tsx` の単一ファイル focused 実行のみ。SIGKILL リスクは無し（root page spec は重い data fetch も mock 化済のため軽量）。

## 8. carry-over 確認

`git log --oneline -5` で確認:
- `533db5fab feat(profile): fix Server Components render error via env unification + safeServerFetch (#980)` … 直前 task。本 task と無関係（`/profile` 系）
- 他: admin-meetings / admin-visual-baseline / admin-pageheader / admin-attendance / admin-shell

本 task は public layer の最小差分で完結し、carry-over は無し。
