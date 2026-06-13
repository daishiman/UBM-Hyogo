# Phase 11 — UI Sanity / Visual Review（VISUAL 宣言付き）

## VISUAL 宣言

- **タスク種別 = VISUAL**（ホーム画面 `/` の見た目が変わる：統計ラベル日本語化・英語 overline 削除）。
- **workflow_state = implemented_local_evidence_captured** のため、実 capture は **local_fullpage_present_staging_pending**（local PNG 3 present / staging pending）。
- ローカル実スクリーンショットは取得済み。staging 反映と追加 staging capture は **user-gated**。
- 本サイクルの証跡は local evidence（PNG 3 件）。ローカル実画像のみを置き、staging 画像は捏造しない。

## UI Sanity 観点（実装後に確認）

| # | 観点 | 期待 |
| --- | --- | --- |
| S-1 | 統計4ラベルが日本語表示 | 公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新 |
| S-2 | 同期バッジ文言 | 「自動で最新化」（点滅ドットは不変） |
| S-3 | 英語 overline（eyebrow）の消失 | Hero/Featured/About/区画/Timeline/CTA の 6 箇所すべてで非表示 |
| S-4 | 見出し上端余白 | eyebrow 削除後、各 section-heading がカード/ヘッダー上端に揃い崩れない |
| S-5 | CTA copy 先頭余白 | heading margin-top 調整後、過剰な空きが出ない |
| S-6 | 値・サブ行の不変 | 統計の数値・サブ文言（公開中のメンバー等）は現状維持 |
| S-7 | レスポンシブ | 1280px / モバイル幅で日本語の折返し・行長が自然 |
| S-8 | コントラスト | OKLch トークンのまま（色追加なし）で可読性・コントラストが保たれる |

## 評価層の対応

- Semantic: S-1〜S-3（意味が日本語で伝わる）。
- Visual: S-4〜S-7（余白・レイアウト・レスポンシブ）。
- AI UX: S-1/S-2/S-8（非エンジニアの直感理解・コントラスト）。

## 結論

implemented_local_evidence_captured のため本 Phase は **local evidence PASS**。`home-localized-full.png` / `home-localized-stats.png` /
`home-localized-about.png` は取得済みで、追加 staging baseline は user 承認後に取得する。
