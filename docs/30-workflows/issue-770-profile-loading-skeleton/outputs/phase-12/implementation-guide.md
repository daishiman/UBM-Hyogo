# Implementation Guide

## Part 1: 中学生レベルの説明

マイページは、会員情報をサーバーから読むまで少し待ち時間がある。その間に文字だけで「読み込み中」と出すと、本物の画面が出た瞬間に大きく形が変わって見える。

今回の変更では、本物のマイページに近い形の灰色ブロックを先に表示する。丸いブロックはアバター、太い横棒は見出し、4 本の横棒はプロフィール項目の場所を表す。これを skeleton loading と呼ぶ。

スクリーンリーダー利用者には、見た目の灰色ブロックだけでは状態が伝わらない。そのため `role="status"` と「マイページを読み込み中」という隠しテキストを入れ、読み込み中であることを音声でも伝える。

### 用語セルフチェック

| 用語 | 意味 |
|---|---|
| loading boundary | 本体ページが用意できるまで Next.js が表示する仮画面 |
| skeleton | 本物の画面の形だけを先に出す読み込み表示 |
| CLS | 本体表示時に画面配置がどれだけ動くかの指標 |
| `role="status"` | 状態変化を支援技術に伝える役割 |
| `bg-surface-2` | project の OKLch token に接続された背景色 utility |

## Part 2: 技術者向け

### 実装

- `apps/web/app/profile/loading.tsx`
  - Server Component のまま維持し、`"use client"` は追加しない。
  - root `<main>` に `role="status"`, `aria-busy="true"`, `aria-live="polite"`, `data-page="profile-loading"` を付与。
  - sr-only text は `マイページを読み込み中`。
  - placeholder は avatar 1、heading 1、KV rows 4 の合計 6 blocks。
  - 色は `bg-surface-2` のみ。HEX 直書き禁止。
  - animation は `motion-safe:animate-pulse` のみ。

### テスト

- `apps/web/app/profile/loading.spec.tsx`
  - role / aria / data-page
  - sr-only text
  - `bg-surface-2` block count
  - `motion-safe:animate-pulse` block count

### Edge Cases

| ケース | 扱い |
|---|---|
| `prefers-reduced-motion: reduce` | `motion-safe:` により pulse 停止 |
| 未ログイン `/profile` | loading boundary は認証前後に依存しない。実 page 側が `/login?redirect=/profile` に redirect |
| local component screenshot | `outputs/phase-11/screenshots/profile-loading-local-component-desktop.png` で avatar + heading + 4 KV rows を確認 |
| staging screenshot | user-gated runtime visual evidence |
