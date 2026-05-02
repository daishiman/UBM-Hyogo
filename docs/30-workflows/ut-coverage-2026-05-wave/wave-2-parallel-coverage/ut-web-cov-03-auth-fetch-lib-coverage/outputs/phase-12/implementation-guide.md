# Phase 12 Implementation Guide: ut-web-cov-03-auth-fetch-lib-coverage

## Part 1: 中学生レベル

このタスクは、学校の入口で「だれが入ってよいか」「困った時にどう案内するか」を確認する作業に似ている。ログインや通信の部品は、画面の外側で大事な判断をしている。合っている時、情報がない時、間違っている時、通信に失敗した時をテストで確かめる。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| auth | 入ってよい人かの確認 |
| fetch | 必要な情報を取りに行くこと |
| token | 入場札 |
| network-fail | 連絡が届かない状態 |
| type predicate | 形が合っているか調べる係 |

## Part 2: 技術者レベル

対象は `lib/auth.ts`、`lib/auth/magic-link-client.ts`、`lib/auth/oauth-client.ts`、`lib/session.ts`、`lib/fetch/authed.ts`、`lib/fetch/public.ts`、`lib/api/me-types.ts`。auth client は happy / token-missing / token-invalid / network-fail、fetch wrapper は 200 / 401 / 403 / 5xx / network-fail を網羅する。

既存 Auth.js / Magic Link / fetch contract は変更しない。apps/web は D1 に直接アクセスせず、fetch wrapper 経由の境界を維持する。
