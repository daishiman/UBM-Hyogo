# Phase 11 — 実装後 手動確認チェックリスト

> 本チェックリストは **実装（F1〜F7 + T1〜T6）完了後**に、ホーム画面 `/` を実描画して確認する項目。
> implemented_local_evidence_captured として local screenshots + DOM verification で確認済み。追加 staging capture は user-gated。

## 必須確認項目

- [x] 統計4ラベルが日本語表示（公開メンバー / 事業フェーズ / 年間の支部会 / 最終データ更新）になっている
- [x] 同期バッジが「自動で最新化」になっている（点滅ドットは残っている）
- [x] 6 箇所の英語 overline（CHAPTER SITE / FEATURED MEMBERS / ABOUT / THREE ZONES / RECENT MEETINGS / FOR MEMBERS）が消失している
- [x] eyebrow 削除後、各セクションの見出し上端余白が崩れていない（section-heading がカード/ヘッダー上端に揃う）
- [x] CTA の見出し直下に過剰な余白が出ていない（heading margin-top 調整が効いている）
- [x] 1280px fullpage で日本語の折返し・カードレイアウトが自然

## 補助確認項目

- [x] 統計の数値・サブ行（公開中のメンバー / 0→1 / 1→10 / 10→100 / 毎月の支部会）が現状維持
- [x] コントラスト（OKLch トークンのまま）で文字が読みやすい
- [x] ホバーで開く等のギミックが導入されていない（静的に読み取れる）
- [x] スクリーンショット（`screenshots/home-localized-full.png` / `screenshots/home-localized-stats.png` / `screenshots/home-localized-about.png`）を取得し本ディレクトリに配置した
