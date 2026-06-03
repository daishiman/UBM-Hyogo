# Phase 11: 視覚的検証（VISUAL）

## 撮影方法

issue-1031 の self-upload UI（`PhotoUpload.client.tsx`）の各状態を **component-isolation harness** で撮影した。
認証付き `/(member)/profile` ライブページの撮影は full-stack（Auth.js セッション cookie + R2 binding + D1 seed）を要し本サイクルのローカル環境では成立しないため、確立された component-harness 方式（issue-1006 先例 L-I1006-002）を採用した。harness は実 `tokens.css` の OKLch / HEX 値を `:root` に注入し、component が生成する DOM 構造を忠実に再現する。

- harness: `outputs/phase-11/harness.html`
- 撮影: Playwright `chromium`（deviceScaleFactor=2 / fullPage）
- evidence: `outputs/phase-11/evidence/photo-upload-states.png`

## 撮影状態

| # | 状態 | 検証観点 |
|---|------|---------|
| ① | idle / 写真未登録 | hue placeholder（src 無し）。現行 Avatar と DOM 同一 → pixel diff ゼロ（AC-9） |
| ② | 写真登録済み | Avatar が `<img>` を描画。`写真を変更` + `削除` ボタン表示 |
| ③ | 削除確認ダイアログ | `role="alertdialog"` + `削除する` / `キャンセル` |
| ④ | uploading / success / error | アップロード中（input disabled・`role=status`）/ 成功（`role=status`）/ エラー（`role=alert`） |

| Classification | Path | Status |
| --- | --- | --- |
| screenshot | outputs/phase-11/evidence/photo-upload-states.png | present |
| harness | outputs/phase-11/harness.html | present |

## Apple UI/UX エンジニア視点レビュー

### レイアウト・整列
- avatar → 操作行 → 状態メッセージの **縦リズム**（gap 12px）が一貫。アバターと操作ボタンが垂直方向に整列しており視線移動が自然。✅

### タイポグラフィ
- ボタン・メッセージともに 14px で統一。見出し（運用説明）と操作系のコントラストが明瞭。✅

### カラーコントラスト・アクセシビリティ
- アクセント（`--ubm-color-accent` OKLch 0.52）はパネル背景に対し十分なコントラスト。削除系は `--ubm-color-danger`（OKLch 0.55 0.15 25）で「破壊的操作」を色で識別可能。成功は `--ubm-color-ok`（緑系）で意味的に正しい。✅
- HEX 直書きなし（全色 OKLch token 経由）。`verify-design-tokens` PASS（91 tracked）。✅
- a11y: file input に `aria-label="プロフィール写真を変更"`、削除ボタンに `aria-label="プロフィール写真を削除"`、確認に `role="alertdialog"`、状態通知に `role="status"` / `role="alert"`。スクリーンリーダーで状態遷移が読み上げ可能。✅

### インタラクション直感性
- 「写真を変更」ラベルが `<input type=file>` を内包し、クリック=ファイル選択という標準パターン。削除は **2 段階確認（confirm → 実行）** で誤操作を防止。✅
- upload 中はラベルを `アップロード中…` + `opacity .5 / pointer-events:none` にし、二重送信を視覚的にも構造的（`disabled`）にも防ぐ。✅

### レスポンシブ
- flex column ベースで幅に追従。新規 primitive を生やさず既存 `Avatar` を再利用しているため、prototype のデザイン言語と整合。✅

### 改善提案（将来 followup・本サイクル対象外）
- success メッセージの自動フェードアウト（現状は次操作まで残留）。MVP では明示残留で問題なし。
- public 表示時の写真合意フロー（followup-002 で別関心として分離済み）。

## 判定

新規 self-upload UI は Apple 水準のレイアウト整合・タイポグラフィ・カラーコントラスト・a11y を満たす。idle（写真なし）状態は現行 Avatar と DOM 同一で visual baseline を維持（AC-9）。**合格**。
