# 要件定義書

## 機能要件

- FR-1: モバイル（≤640px）で `/admin/members` 会員一覧をカードレイアウト表示する。
- FR-2: カードに「メール / 区画・ステータス / タグ / 最終更新 / 公開」をラベル付きで全て表示する。
- FR-3: モバイルで公開トグル・編集ボタンを操作可能にする（横はみ出し解消）。
- FR-4: デスクトップ（≥641px）は現行テーブルを完全維持する。

## 非機能要件

- NFR-1: 機械可読id（`admin-members-row-*` / 各 aria-label / `chip-dot` / `member-state-chip-row`）を破壊しない。
- NFR-2: 色・寸法は OKLch トークン経由（HEX/任意値カラー禁止）。
- NFR-3: 既存 unit test（TC-MT-01〜20）を1件も壊さない。
- NFR-4: API / D1 / Form 不変。

## 真因

`apps/web` 表現層のレスポンシブCSS欠如。`MembersTable.tsx` の 8列 `<table>` にレスポンシブクラスなし + ラッパー `overflow-hidden` で横スクロール不可。

## P50 / implementation_mode

new（カード化レスポンシブCSSは未実装）。詳細は [phase-1-requirements.md](../../phase-1-requirements.md) Step 0。
