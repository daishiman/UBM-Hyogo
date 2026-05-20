---
phase: 12
title: コンプライアンスチェック（中学生レベル概念説明）
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 12 — コンプライアンスチェック

[実装区分: 実装仕様書]

このページは「専門用語を知らない人にも分かるように」概念を平易に説明する Phase。Phase 12 canonical heading SSOT に従い、以下 9 canonical 見出しを保持する。

## 1. 何を作るのか（概要）

ウェブサイトの **すべてのページに共通の「外枠」と「困ったときに表示する画面」** を整える作業です。

たとえば本でいうと、

- 表紙と裏表紙（layout）
- 「このページは見つかりません」のしおり（not-found）
- 「読み込み中…」と書かれた栞（loading）
- 「中身が壊れています」と書かれた注意書き（error）

を、本のどのページを開いても同じデザイン・同じ書体で出るように差し替える、というイメージです。

## 2. なぜ必要か（背景）

各ページが個別に外枠を作っていると、ページごとに文字サイズや色がバラついて「ちぐはぐ」に見えます。本サブワークフローでは **アプリの一番外側の 4 つのファイル** に手を入れて、共通の見た目を保証します。

## 3. 中学生レベルの用語説明

| 用語 | 平易な説明 |
|------|----------|
| Root layout | サイト全体の「いちばん外側の枠」。すべての画面がこの中に入る |
| Server Component (SC) | サーバー側でだけ作る部品。ボタンを押す等の動作は持てない |
| Client Component (CC) | ブラウザ側で動く部品。クリック・入力・タイマー等の動作を持てる |
| `"use client"` | 「この部品はブラウザで動くよ」と明示する魔法の一行 |
| ToastProvider | 画面右上に出る「保存しました」みたいな通知を、どのページからでも出せるようにする道具箱 |
| error.tsx | 何かが壊れたときに「画面を表示できませんでした」と出すページ |
| not-found.tsx | URL を打ち間違えたときに「ページが見つかりません」と出すページ |
| loading.tsx | データを取りに行っている間「読み込み中…」と出すページ |
| metadata | ブラウザのタブ名や検索エンジン用の説明文 |
| viewport | スマホで見たときの画面サイズ調整の設定 |
| OKLch トークン | 色を数値で名前付けして管理する仕組み。「青っぽい灰色 = `--ubm-color-surface-bg`」のように使う |
| hydration | サーバーが作った HTML をブラウザで動く React に「つなぎ直す」処理 |
| Suspense | 「データが揃うまでちょっと待ってね」の仕組み |

## 4. 何を変えるか（人にも分かる粒度）

| ファイル | 変更内容 |
|---------|---------|
| `app/layout.tsx` | サイト全体の「テーマ色（warm）」と「色設定の読み込み順番」を直す。タイトル名のテンプレートも整える |
| `app/error.tsx` | 既存の Tailwind 直書きから、共通カード部品（Card）を使った見た目に変える |
| `app/not-found.tsx` | 「ページが見つかりません」を共通カード（Card + EmptyState）で表示する |
| `app/loading.tsx` | 読み込み中のグレー帯を共通カードの中に置く |

## 5. やってはいけないこと（禁止事項）

| 禁止 | 理由 |
|------|------|
| 色を `#abcdef` のように直接書く | 全画面で色がバラつく原因になる。OKLch トークン経由のみ |
| 新しい部品を作る | 既存の Card / EmptyState / Toast で足りる。増やすと管理が大変になる |
| ToastProvider を 2 か所に置く | 通知が二重に出たり消えたりする |
| API を直接呼ぶ | 本サブワークフローでは API も DB も触らない |
| `*.test.tsx` 名でテストを書く | プロジェクト全体で `*.spec.tsx` に統一しているため |

## 6. どうやって正しさを確認するか（検証）

| 確認 | コマンド |
|------|--------|
| 型が合っているか | `pnpm typecheck` |
| 文法が合っているか | `pnpm lint` |
| 動作が合っているか | `pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__` |
| ビルドが通るか | `pnpm --filter @ubm-hyogo/web build` |
| 色の禁止違反がないか | `pnpm verify:design-tokens` |

## 7. 上位ワークフローとの関係

本サブワークフローは **準備の一部** です。同時並行で:

- parallel-01: 色とリズムの CSS ルール本体
- parallel-02: プロトタイプ独自の selector ルール
- parallel-03: 公開／会員／管理それぞれの中枠（layout）

が動いています。本サブワークフロー（parallel-04）が完了すると、残る serial-05（個別ページ）/ serial-06（API 接続）/ serial-07（最終確認）に進めます。

## 8. リスクの平易説明

| もしも… | こう対処する |
|--------|-------------|
| ToastProvider が 2 個になってしまったら | `grep ToastProvider apps/web/app/` で 1 件しかないことを確認 |
| 色が直書きされていないか不安 | `pnpm verify:design-tokens` を実行。何も出力されなければ OK |
| 古い browser で `viewport.themeColor` の色が出ない | 機能には影響なし。新しい browser では正しく表示される |

## 9. 完了の合図

「DoD（Phase 8 参照）が全部 ✓ になり、PR を `dev` ブランチに向けて出せる状態」になったらこのサブワークフローは完了です。

---

> Phase 12 canonical heading 9 見出し（1. 概要 / 2. 背景 / 3. 用語 / 4. 変更内容 / 5. 禁止事項 / 6. 検証 / 7. 上位関係 / 8. リスク / 9. 完了基準）を維持。`verify:phase12-compliance` gate に整合する。
