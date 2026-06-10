# Phase 11 — 手動テストチェックリスト（Apple HIG 観点）

> ステータス: `pending_visual_capture`。本チェックリストは認証済み visual capture 時に [x] を埋める。各項目は出席ダッシュボード `/admin/dashboard/attendance` の 3 層リファイン結果に対する HIG 観点の評価。

---

## 1. 視覚的階層（Visual Hierarchy）

- [ ] PRIMARY ゾーンが最大の視覚ウェイト（サイズ・余白・サーフェス）を持ち、最上部に位置する（AC-1 / AC-2）
- [ ] TREND ゾーンが PRIMARY より弱く、DETAIL より強い中間ウェイトで配置される
- [ ] DETAIL ゾーンが最も控えめなウェイトで、タブ統合により占有面積が抑えられる（AC-3）
- [ ] 見出し階層が h1（ページタイトル）> h2（各ゾーン）> h3（ゾーン内サブ）で論理的（AC-2 / AC-9）

## 2. 焦点（Focal Point）

- [ ] 全体出席率が特大タイポグラフィ（`--ubm-text-3xl`）で最初に目に入る（AC-1）
- [ ] 要フォロー対象数が PRIMARY で視覚的に強調され、件数に応じてトーンが変わる（0=neutral/success、1+=warning）（AC-4）
- [ ] 「このページで何を判断すべきか」が一目で伝わる（出席率の健全性 + 要フォロー有無）

## 3. 余白リズム（Spacing Rhythm）

- [ ] ゾーン間 / カード間の余白が `--ubm-space-*`（4px grid）に整合し、リズムが均一（AC-2）
- [ ] 過密 / 過疎がなく、各ゾーンが視覚的に「区切られている」と認識できる

## 4. タイポスケール（Type Scale）

- [ ] 数値・ラベル・説明文が `--ubm-text-*` のスケール段階に沿っている（特大=3xl、KPI=xl/2xl、本文=base/md、補助=sm/xs）
- [ ] eyebrow（小見出し）が `--ubm-eyebrow-tracking` でトラッキングされている

## 5. コントラスト（Contrast）

- [ ] 本文テキストと背景のコントラストが WCAG 2 AA（4.5:1）を満たす（AC-9）
- [ ] 要フォロー warn トーン（`warning` Badge）が背景に対して十分判読可能
- [ ] 全色が OKLch トークン（`var(--ubm-color-*)`）由来で、HEX 直書きが 0 件（AC-5）

## 6. タップ / クリック領域（Hit Target）

- [ ] Segmented タブ（session/member/top10）のタップ領域が十分（モバイルで誤タップしない）（AC-3 / AC-8）
- [ ] フィルタ操作・CSV エクスポート・drilldown 起点のクリック領域が温存されている（AC-10）
- [ ] フォーカスリング（accent + color-mix）がキーボード操作で保持される（AC-9）

## 7. 一目での理解しやすさ（Glanceability）

- [ ] 初期スクロールなしで「出席率」「要フォロー」「直近セッション」の要点が把握できる（AC-1）
- [ ] DETAIL の詳細表は初期表示で 1 つのみ（Segmented 排他）で、情報過多が解消されている（AC-3）
- [ ] 初期スクロール量が現状（8 セクション縦積み）比で削減されている

## 8. レスポンシブ（Responsive）

- [ ] desktop で PRIMARY 2 カラム / TREND 2 カラムが grid で成立（AC-8）
- [ ] mobile で全ゾーンが 1 カラム縦積みになり、横溢れ・レイアウト崩れがない（AC-8）

## 9. 既存機能温存（Regression Guard）

- [ ] 期間プリセット / 回数帯チェックのフィルタが挙動不変（AC-10）
- [ ] CSV エクスポートが挙動不変（AC-10）
- [ ] ドリルダウン modal（出席 / 欠席者）が挙動不変（AC-10）
- [ ] SafeResult error 時にゾーン単位で degrade し、他ゾーンが描画継続（AC-10）
- [ ] フッター生成日時が温存（AC-10）
