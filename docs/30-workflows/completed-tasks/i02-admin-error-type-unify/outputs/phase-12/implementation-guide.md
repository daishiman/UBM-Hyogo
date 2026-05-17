# Implementation Guide

## Part 1: 概念説明

失敗に付ける名札をそろえる変更である。ログインしていない失敗は `AuthRequiredError`、ログイン以外の
HTTP 失敗は `FetchAuthedError` と呼ぶ。名札がそろうと、管理画面の保存処理も共通の認証処理に拾われる。

## Part 2: 技術詳細

| 観点 | 実装 |
| --- | --- |
| 401 | `useAdminMutation` が `new AuthRequiredError()` を throw し、`toLoginRedirect(currentPath)` の結果を `redirector` へ渡す |
| 403 / 4xx / 5xx | `new FetchAuthedError(res.status, bodyText)` を throw |
| toast | `FetchAuthedError.bodyText` から `message` / `error` を抽出し、403 は alert variant |
| public hook shape | `{ trigger, isLoading, error, reset }`。既存 caller の `{ trigger, isLoading, error }` 利用は維持 |
| redirect DI | `redirector` / `currentPath` は optional。テストは DI、本番は browser location を使用 |
| 旧 class | `AdminMutationHttpError` は production code/export ともに不使用 |

`FetchAuthedError` の message は共通 class の既存仕様を変えない。UI 表示に必要な文言は
`bodyText` から抽出するため、既存の 400 validation toast と 403 alert の両方を保てる。

`useAdminMutation` は client hook なので、`next/headers` を含む `fetch/authed.ts` ではなく
client-safe な `fetch/errors.ts` から error class を import する。class 定義は同一で、`fetch/authed.ts`
も同じ `errors.ts` から re-export する。

401 redirect は p-10 正本契約に合わせ、既存 `toLoginRedirect` helper を使う。query 名は `next` ではなく
`redirect` が正本である。

## 検証コマンド

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
