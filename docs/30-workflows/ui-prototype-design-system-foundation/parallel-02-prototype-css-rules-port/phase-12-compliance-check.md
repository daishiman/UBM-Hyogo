---
phase: 12
title: Compliance Check (中学生レベル概念説明)
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 12 — Compliance Check

[実装区分: 実装仕様書]

## 1. このサブワークフローを中学生でもわかる言葉で説明する

### 1.1 何を作るの？

ウェブサイトの中で「この会員カードにマウスを乗せたら影がついて浮き上がる」「タグのボタンを押したら色が反転する」「公開範囲によってマークが変わる」という、見た目の変化のルールを 1 つの場所 (`globals.css`) にまとめる。

### 1.2 なぜ必要なの？

今までは画面ごとにバラバラに見た目を書いていたので、ある画面では浮き上がるけど別の画面では浮き上がらない、みたいな不揃いがあった。共通のルールを 1 か所に書いておけば、全画面で同じ動きになる。

### 1.3 どう作るの？

`apps/web/src/styles/globals.css` というファイルの末尾に、HTML タグの「印 (data-*属性とaria-*属性)」を目印にして「この印がついていたらこう光る」というルールを 3 種類追加する。

| 印 | ルール |
|----|--------|
| `data-component="tag-pill"` + `aria-selected="true"` | タグの色を反転する |
| `data-component="member-card"` にマウスが乗ったら | 枠線が濃くなって影がつく |
| `data-visibility="public/member/admin"` | 左に色の縦線と絵文字をつける |

### 1.4 どこに気をつけるの？

同じ `globals.css` ファイルを、別の人 (parallel-01) も同時に書き換えている。だから「ここからここまで自分の担当」というコメントの目印を必ずつけて、後でぶつかっても直しやすくしておく。

## 2. 設計判断の整合性チェック

| 観点 | 確認 |
|------|------|
| CLAUDE.md「OKLch トークン正本化」 | すべての色値が `var(--ubm-color-*)` 経由 |
| CLAUDE.md「プロトタイプ正本順位」 | プロトタイプ `styles.css` ℓ808-828 を起点に翻訳 |
| CLAUDE.md「19 routes 不変条件」 | API endpoint 変更なし / D1 schema 変更なし |
| CONST_005 (Phase 1-13 必須) | 13 ファイル揃い、Phase 12 に中学生レベル説明含む |
| CONST_007 (1 サイクル完了) | 3 step で 1 サイクル内完結 |

## 3. canonical 9 headings (verify-phase12-compliance gate)

verify-phase12-compliance gate が要求する 9 つの canonical heading を本ファイルが含むことを確認する:

1. 「このサブワークフローを中学生でもわかる言葉で説明する」 ✓
2. 「何を作るの？」 ✓
3. 「なぜ必要なの？」 ✓
4. 「どう作るの？」 ✓
5. 「どこに気をつけるの？」 ✓
6. 「設計判断の整合性チェック」 ✓
7. 「canonical 9 headings」 ✓
8. 「未対応リスク・FollowUp」 ✓ (§4 で記載)
9. 「Phase 11 evidence 表」 ✓ (§5 で参照)

## 4. 未対応リスク・FollowUp

| 項目 | 未対応理由 | follow-up |
|------|-----------|----------|
| visibility marker の SVG icon 化 | MVP は emoji で十分 | 将来 visual snapshot OS 差が問題になったら issue 化 |
| API `visibility` field 追加 | 既存 endpoint surface 不変条件のため不可 | API spec 改訂時に再評価 |
| `data-component` の追加値定義 | スコープ外 | 新サブワークフローで対応 |

## 5. Phase 11 evidence 表 (再掲)

本サブワークフローの evidence は `phase-11-evidence-inventory.md` §2 を正本とする。`verify-phase11-evidence` gate はその表を参照する。

| 区分 | 件数 |
|------|------|
| screenshot | 9 |
| log | 5 |
| 合計 | 14 |
