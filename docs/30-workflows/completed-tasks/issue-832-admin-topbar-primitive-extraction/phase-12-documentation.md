# Phase 12: ドキュメント

> 本ドキュメントは **Part1（中学生にも分かる概念説明）** と **Part2（技術者向け: 型定義・props・data-* 契約）** の 2 パート構成。CI gate `verify-phase12-compliance`（canonical 9 headings / Phase 11 evidence 表 / workflow root scan）準拠。

## 1. 中学生にも分かる概念説明（必須セクション / Part1）

### この変更は何をしているの？

学校で「学級新聞」を毎号作るとき、いちばん上の「○○新聞」というタイトルの帯（見出しバー）を、毎回 定規で線を引いて手書きしていたら大変ですよね。そこで「タイトルの帯」だけを **1 個のスタンプ（部品）** にしておいて、新聞を作るたびにそのスタンプをポンと押せば、いつも同じ見た目の帯がすぐ出せます。

この変更でやっているのは、まさにそれです。管理画面（先生だけが入れるページ）のいちばん上には「**管理**」と書かれた **見出しバー**（topbar）があります。これまでは、このバーを作るための部品が、画面全体の設計図（`layout.tsx`）の中に **直接べた書き** されていました。

今回は、その見出しバーだけを **`AdminTopbar` という名前の専用部品（スタンプ）** として 1 個だけ切り出します。そして設計図のほうは「ここに AdminTopbar のスタンプを押す」と 1 行書くだけにします。

### なぜわざわざ部品にするの？

すでに、左側のメニュー（sidebar）や、別ページの見出し（PublicHeader / MemberHeader）は、それぞれ専用の部品になっています。でも管理画面の上のバーだけが「べた書きのまま」で、仲間外れになっていました。みんな部品なのに 1 個だけべた書きだと、後で直すとき「あれ、これだけ場所が違う」と探しにくくて間違えやすいのです。

部品として揃えておくと、(1) どこを直せばいいか一目で分かる、(2) 同じ見た目をいろんな場所で使い回せる、(3) その部品だけを単独でテスト（動作チェック）できる、という良いことがあります。

### 見た目は変わるの？

**まったく変わりません。** やっているのは「べた書きの部品を、名前の付いた部品に引っ越しさせる」だけ。文字（「管理」）も、線（下の罫線）も、余白も、色も、引っ越し前とそっくり同じです。引っ越し後に「見た目が前と同じか」をちゃんと確認する仕組み（テスト）もそのまま残します。

## 2. システム仕様書更新サマリ（Part2 起点）

API / D1 / Google Form schema の変更は **一切なし**（UI primitive の抽出のみ）。

| 仕様ファイル | 更新内容 |
|---|---|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | **変更なし**（API 変更なし） |
| `docs/00-getting-started-manual/specs/08-free-database.md` | **変更なし**（D1 変更なし） |
| `docs/00-getting-started-manual/google-form/` | **変更なし**（Google Form schema 変更なし） |
| `docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/index.md` | 本タスクの**正本**（変更対象ファイル・不変条件・スコープを規定） |

## 3. 関連ドキュメント更新

- `docs/30-workflows/completed-tasks/parallel-03-followup-001-admin-topbar-primitive-extraction.md`
  → 冒頭に本仕様書ディレクトリ（`docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/`）へのリンクを追記し、ステータス行を **`consumed / canonical spec created`** に更新する。one-pager は予兆メモであり、以後の正本は issue-832 ワークフロー側に移管したことを明示する。
- 親ワークフロー `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/` の deferred 宣言（`phase-13-commit-pr.md` line 192「topbar は inline JSX のまま完了形」）は破壊的に書き換えず、本仕様書から parent link で「deferred 分を issue-832 で解消」と依存を明示する。
- PR merge 後（別 commit / 別 PR 可）に `docs/30-workflows/completed-tasks/issue-832-admin-topbar-primitive-extraction/` を `docs/30-workflows/completed-tasks/` 配下へ移動する。

## 4. canonical 9 headings 対応表（verify-phase12-compliance gate 互換）

task-specification-creator gate が要求する canonical 9 headings と、それを詳細化する Phase ファイルのマップ。

| # | 見出し | 詳細化先 Phase |
|---|---|---|
| 1 | 概要 | `index.md §概要` / `phase-1-requirements.md §1-3` |
| 2 | 不変条件 | `index.md §不変条件`（1〜7） |
| 3 | 変更対象ファイル | `index.md §変更対象ファイル`（3 ファイル） |
| 4 | テスト方針 | `phase-4-test-plan.md` |
| 5 | 実装手順 | `phase-5-implementation.md` |
| 6 | 完了条件 (DoD) | `phase-1-requirements.md §5 AC` / `phase-10-final-review.md §1` |
| 7 | リスクと対策 | `phase-3-design-review.md §2`（R-1〜R-5） |
| 8 | ロールバック | `phase-10-final-review.md §3` |
| 9 | 中学生にも分かる概念説明 | `phase-12-documentation.md §1`（本ファイル Part1） |

## 5. Phase 11 evidence 表（TC → evidence path）

| TC | 内容 | evidence path |
|---|---|---|
| TC-1 | breadcrumb「管理」目視 | `outputs/phase-11/screenshots/admin-topbar-default.png` |
| TC-2 | border-b / padding regression なし | `outputs/phase-11/manual-test-result.md` |
| TC-3 | DOM 契約（topbar / slot / route-group 残置） | `outputs/phase-11/screenshots/admin-topbar-dom-contract.txt` |
| TC-4 | axe critical 0 | `outputs/phase-11/screenshots/admin-topbar-axe.png` |
| TC-5 | sidebar / main regression なし | `outputs/phase-11/screenshots/admin-shell-regression.png` |

## 6. 未タスク検出（Phase 12 必須出力）

| ID | 内容 | 判定 | 理由 |
|---|---|---|---|
| FU-001 | breadcrumb 実データ統合（現在の route から動的にパンくずを生成し `breadcrumb` props へ注入） | **起票しない** | `AdminTopbar` の `breadcrumb?` slot は既に注入口として開いている（Phase 2 §3）。実データ連携は admin 機能側の責務であり、将来の各 admin 画面実装タスクで `breadcrumb` props を渡す形で対応する。本 primitive 抽出タスクのスコープ外（index.md §スコープ外） |
| FU-002 | topbar actions の具体ボタン実装（sign-out 等） | **起票しない** | `actions?` slot も注入口として開いており（Phase 2 §3）、client button が必要な場合は呼び出し側で `"use client"` boundary を作る設計（Phase 2 §1）。実ボタンは admin 機能側の別タスクで対応。本タスクで実装すると「責務外の新 design 追加」になるため分離（index.md §スコープ外 / CONST_007） |

新規未タスクは **0 件**。FU-001 / FU-002 はいずれも primitive 側で slot 注入口を確保済みのため、将来の admin 機能タスクが props 経由で消化する設計であり、本サイクルでの新規バックログ化は不要。Phase 3 R-5（breadcrumb=null フォールバック）も Phase 10 §4 で「起票不要・仕様として文書化済み」と確定済み。検出結果は `outputs/phase-12/unassigned-task-detection.md` に反映する。

## 7. 技術者向けサマリ（Part2: 型定義 / props / data-* 契約）

### 型定義 / props（Phase 2 §3-4 正本）

```ts
import type { ReactNode } from "react";

type AdminTopbarProps = {
  /** breadcrumb slot の中身。省略時はテキスト「管理」を表示する。 */
  readonly breadcrumb?: ReactNode;
  /** topbar 右側 actions slot の中身。省略時は aria-hidden の空 placeholder。 */
  readonly actions?: ReactNode;
};

// 名前付き export / Server Component / default param で props なし呼び出しを許容
export function AdminTopbar({ breadcrumb, actions }: AdminTopbarProps = {}) { /* ... */ }
```

- **default param `= {}`**: `<AdminTopbar />`（props なし）呼び出しを許容（Phase 2 §4）。
- **`breadcrumb ?? "管理"`**: `undefined` / `null` 両方で既定テキスト「管理」へフォールバック（Phase 3 R-5 で文書化済みの仕様）。
- **`actions === undefined` 判定**: 省略時のみ `aria-hidden="true"` の空 placeholder。`null` 明示注入時は visible な空 div（呼び出し側の意図を尊重）。

### data-* 契約（所有権 / Phase 2 §2）

| 属性 | 付与位置 | 所有責務 |
|---|---|---|
| `data-shell="topbar"` | **AdminTopbar 内部 root `<header>`** | shell slot 識別（primitive 責務） |
| `data-component="admin-breadcrumb-slot"` | AdminTopbar 内部 `<div>` | slot 識別（primitive 内部 DOM） |
| `data-component="admin-topbar-actions"` | AdminTopbar 内部 `<div>` | slot 識別（primitive 内部 DOM） |
| `data-route-group="admin"` / `data-theme="cool"` / `data-testid="admin-shell"` | layout.tsx wrapper `<div>`（**移動しない**） | route group 識別（AppShell 責務） |
| `data-shell="sidebar"` / `data-route="admin"` | layout.tsx `<aside>` / `<main>`（変更なし） | sidebar slot / route 識別 |

OKLch トークン: `var(--ubm-color-border-default)`（下罫線）/ `var(--ubm-color-text-primary)`（breadcrumb 文字）を inline JSX から無改変で移植（HEX 直書き禁止 / CLAUDE.md UI 不変条件2）。
